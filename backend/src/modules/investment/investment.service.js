const prisma = require("../../config/db");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInvestmentModel() {
  const model = prisma.investment || prisma.Investment;
  if (!model) throw new Error("Investment model not found. Run 'npx prisma generate'.");
  return model;
}

function getPropertyModel() {
  const model = prisma.property || prisma.Property;
  if (!model) throw new Error("Property model not found. Run 'npx prisma generate'.");
  return model;
}

// ---------------------------------------------------------------------------
// User-facing services
// ---------------------------------------------------------------------------

/**
 * Create a new investment (user clicks "Pay Now").
 * Locks units immediately by incrementing property.purchasedUnits.
 * Uses a transaction to prevent race conditions / double-booking.
 *
 * Business rules:
 *  - Property must be AVAILABLE.
 *  - units >= 1 and units <= remainingUnits.
 *  - Amount is snapshotted at current perUnitPrice.
 */
async function createInvestment(userId, propertyId, units) {
  return prisma.$transaction(async (tx) => {
    const property = await tx.property.findUnique({ where: { id: propertyId } });

    if (!property) throw new Error("Property not found with the provided ID");
    if (property.status !== "AVAILABLE") {
      throw new Error(`This property is not available for investment (status: ${property.status})`);
    }
    if (property.totalUnits <= 0) {
      throw new Error("This property has not been set up for unit-based investment yet");
    }

    const remainingUnits = property.totalUnits - property.purchasedUnits;
    if (units > remainingUnits) {
      throw new Error(
        `You requested ${units} units but only ${remainingUnits} unit(s) are available`
      );
    }

    const unitPriceAtTime = property.perUnitPrice;
    const totalAmount     = units * unitPriceAtTime;

    // Create the investment record
    const investment = await tx.investment.create({
      data: {
        propertyId,
        userId,
        units,
        unitPriceAtTime,
        totalAmount,
        status: "PENDING",
      },
      include: {
        property: { select: { id: true, title: true, location: true, perUnitPrice: true } },
        user:     { select: { id: true, fullName: true, phone: true, email: true } },
      },
    });

    // Lock units by incrementing purchasedUnits counter
    await tx.property.update({
      where: { id: propertyId },
      data:  { purchasedUnits: { increment: units } },
    });

    return investment;
  });
}

/**
 * User cancels their own PENDING investment.
 * Releases the locked units back to the property.
 */
async function cancelInvestment(userId, investmentId) {
  return prisma.$transaction(async (tx) => {
    const investment = await tx.investment.findUnique({ where: { id: investmentId } });

    if (!investment) throw new Error("Investment not found");
    if (investment.userId !== userId) throw new Error("You are not authorised to cancel this investment");
    if (investment.status !== "PENDING") {
      throw new Error(`Only PENDING investments can be cancelled (current status: ${investment.status})`);
    }

    const updated = await tx.investment.update({
      where: { id: investmentId },
      data:  { status: "CANCELLED" },
    });

    // Release locked units
    await tx.property.update({
      where: { id: investment.propertyId },
      data:  { purchasedUnits: { decrement: investment.units } },
    });

    return updated;
  });
}

/**
 * Get all investments belonging to a user (with pagination & optional status filter).
 */
async function getUserInvestments(userId, { page = 1, limit = 20, status } = {}) {
  const skip  = (page - 1) * limit;
  const where = { userId };
  if (status) where.status = status;

  const [investments, total] = await Promise.all([
    getInvestmentModel().findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        property: {
          select: {
            id: true, title: true, location: true,
            category: true, status: true,
            perUnitPrice: true, totalUnits: true, purchasedUnits: true,
            images: true,
          },
        },
      },
    }),
    getInvestmentModel().count({ where }),
  ]);

  return {
    investments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Get a single investment by ID (user can only see their own).
 */
async function getUserInvestmentById(userId, investmentId) {
  const investment = await getInvestmentModel().findUnique({
    where: { id: investmentId },
    include: {
      property: {
        select: {
          id: true, title: true, location: true, category: true,
          status: true, perUnitPrice: true, totalUnits: true,
          purchasedUnits: true, images: true,
        },
      },
      user: { select: { id: true, fullName: true, phone: true, email: true } },
    },
  });

  if (!investment) throw new Error("Investment not found");
  if (investment.userId !== userId) throw new Error("You are not authorised to view this investment");
  return investment;
}

// ---------------------------------------------------------------------------
// Admin-facing services
// ---------------------------------------------------------------------------

/**
 * Admin approves a PENDING investment.
 * Updates user.hasPurchasedProperty = true and increments property.investors count.
 * purchasedUnits stays as-is (already counted on creation).
 */
async function approveInvestment(adminId, investmentId) {
  return prisma.$transaction(async (tx) => {
    const investment = await tx.investment.findUnique({
      where: { id: investmentId },
      include: { user: true },
    });

    if (!investment) throw new Error("Investment not found");
    if (investment.status !== "PENDING") {
      throw new Error(`Only PENDING investments can be approved (current status: ${investment.status})`);
    }

    const updated = await tx.investment.update({
      where: { id: investmentId },
      data:  { status: "APPROVED" },
      include: {
        property: { select: { id: true, title: true, location: true } },
        user:     { select: { id: true, fullName: true, phone: true, email: true } },
      },
    });

    // Mark user as having purchased property
    await tx.user.update({
      where: { id: investment.userId },
      data:  { hasPurchasedProperty: true },
    });

    // Increment the named-investor count on the property
    await tx.property.update({
      where: { id: investment.propertyId },
      data:  { investors: { increment: 1 } },
    });

    return updated;
  });
}

/**
 * Admin rejects a PENDING investment.
 * Units are released back so other users can invest.
 */
async function rejectInvestment(adminId, investmentId, remark) {
  return prisma.$transaction(async (tx) => {
    const investment = await tx.investment.findUnique({ where: { id: investmentId } });

    if (!investment) throw new Error("Investment not found");
    if (investment.status !== "PENDING") {
      throw new Error(`Only PENDING investments can be rejected (current status: ${investment.status})`);
    }

    const updated = await tx.investment.update({
      where: { id: investmentId },
      data:  { status: "REJECTED", adminRemark: remark || null },
      include: {
        property: { select: { id: true, title: true, location: true } },
        user:     { select: { id: true, fullName: true, phone: true, email: true } },
      },
    });

    // Release units back to property
    await tx.property.update({
      where: { id: investment.propertyId },
      data:  { purchasedUnits: { decrement: investment.units } },
    });

    return updated;
  });
}

/**
 * Admin: list all investments with optional filters (status, propertyId, userId, pagination).
 */
async function getAllInvestments({ page = 1, limit = 20, status, propertyId, userId } = {}) {
  const skip  = (page - 1) * limit;
  const where = {};
  if (status)     where.status     = status;
  if (propertyId) where.propertyId = propertyId;
  if (userId)     where.userId     = userId;

  const [investments, total] = await Promise.all([
    getInvestmentModel().findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        property: { select: { id: true, title: true, location: true, category: true } },
        user:     { select: { id: true, fullName: true, phone: true, email: true } },
      },
    }),
    getInvestmentModel().count({ where }),
  ]);

  return {
    investments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Admin: get a single investment by ID.
 */
async function getInvestmentById(investmentId) {
  const investment = await getInvestmentModel().findUnique({
    where: { id: investmentId },
    include: {
      property: { select: { id: true, title: true, location: true, category: true, status: true } },
      user:     { select: { id: true, fullName: true, phone: true, email: true, profileUrl: true } },
    },
  });
  if (!investment) throw new Error("Investment not found");
  return investment;
}

/**
 * Admin: get all investments for a specific property.
 */
async function getInvestmentsByProperty(propertyId, { page = 1, limit = 20, status } = {}) {
  return getAllInvestments({ page, limit, status, propertyId });
}

/**
 * Admin: get all investments by a specific user.
 */
async function getInvestmentsByUser(userId, { page = 1, limit = 20, status } = {}) {
  return getAllInvestments({ page, limit, status, userId });
}

/**
 * Admin: dashboard statistics across all investments.
 */
async function getInvestmentStats() {
  const [total, pending, approved, rejected, cancelled, valueAgg, pendingValueAgg] =
    await Promise.all([
      getInvestmentModel().count(),
      getInvestmentModel().count({ where: { status: "PENDING" } }),
      getInvestmentModel().count({ where: { status: "APPROVED" } }),
      getInvestmentModel().count({ where: { status: "REJECTED" } }),
      getInvestmentModel().count({ where: { status: "CANCELLED" } }),
      getInvestmentModel().aggregate({
        where:    { status: "APPROVED" },
        _sum:     { totalAmount: true },
      }),
      getInvestmentModel().aggregate({
        where:    { status: "PENDING" },
        _sum:     { totalAmount: true },
      }),
    ]);

  // Count properties that are fully sold out (purchasedUnits >= totalUnits)
  const soldOutProperties = await getPropertyModel().count({
    where: {
      totalUnits:     { gt: 0 },
      purchasedUnits: { gte: prisma.property.fields?.totalUnits ?? 0 },
    },
  });

  return {
    totalInvestments:     total,
    pendingInvestments:   pending,
    approvedInvestments:  approved,
    rejectedInvestments:  rejected,
    cancelledInvestments: cancelled,
    totalValueApproved:   valueAgg._sum.totalAmount    || 0,
    totalValuePending:    pendingValueAgg._sum.totalAmount || 0,
  };
}

module.exports = {
  // User
  createInvestment,
  cancelInvestment,
  getUserInvestments,
  getUserInvestmentById,
  // Admin
  approveInvestment,
  rejectInvestment,
  getAllInvestments,
  getInvestmentById,
  getInvestmentsByProperty,
  getInvestmentsByUser,
  getInvestmentStats,
};
