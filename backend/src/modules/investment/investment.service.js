const prisma = require("../../config/db");
const { generateAgreementPdf } = require("../../utils/pdfGenerator");
const storageService = require("../../services/storage.service");
const AppError = require("../../utils/AppError");

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
async function createInvestment(userId, propertyId, units, paymentProofUrl, signatureBase64, placeOfSignature) {
  // Pre-fetch user and property outside the transaction to generate the PDF
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const propertyInfo = await prisma.property.findUnique({ where: { id: propertyId } });

  if (!user) throw new Error("User not found");
  if (!propertyInfo) throw new Error("Property not found with the provided ID");
  if (propertyInfo.status !== "AVAILABLE") {
    throw new Error(`This property is not available for investment (status: ${propertyInfo.status})`);
  }
  if (propertyInfo.totalUnits <= 0) {
    throw new Error("This property has not been set up for unit-based investment yet");
  }

  const remainingUnitsCheck = propertyInfo.totalUnits - propertyInfo.purchasedUnits;
  if (units > remainingUnitsCheck) {
    throw new Error(`You requested ${units} units but only ${remainingUnitsCheck} unit(s) are available`);
  }

  const totalAmount = units * propertyInfo.perUnitPrice;
  let agreementUrl = null;

  // Generate and upload PDF agreement if signature is provided
  if (signatureBase64 && placeOfSignature) {
    try {
      const pdfBuffer = await generateAgreementPdf({
        userName: user.fullName || "User",
        userEmail: user.email || "N/A",
        userPhone: user.phone || "N/A",
        propertyTitle: propertyInfo.title,
        units,
        totalAmount,
        placeOfSignature,
        signatureBase64
      });

      // Upload to storage under 'agreements' folder
      const filename = `agreement_${userId}_${propertyId}_${Date.now()}.pdf`;
      agreementUrl = await storageService.uploadFile(
        pdfBuffer,
        filename,
        "application/pdf",
        "agreements"
      );
    } catch (err) {
      throw new Error("Failed to generate or upload agreement PDF: " + err.message);
    }
  }

  return prisma.$transaction(async (tx) => {
    // Re-fetch property inside transaction to ensure lock/consistency
    const property = await tx.property.findUnique({ where: { id: propertyId } });

    if (property.status !== "AVAILABLE") {
      throw new Error(`This property is not available for investment (status: ${property.status})`);
    }

    const remainingUnits = property.totalUnits - property.purchasedUnits;
    if (units > remainingUnits) {
      throw new Error(
        `You requested ${units} units but only ${remainingUnits} unit(s) are available`
      );
    }

    const unitPriceAtTime = property.perUnitPrice;
    const finalTotalAmount = units * unitPriceAtTime;

    // Create the investment record
    const investment = await tx.investment.create({
      data: {
        propertyId,
        userId,
        units,
        unitPriceAtTime,
        totalAmount: finalTotalAmount,
        paymentProofUrl,
        agreementUrl,
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
 * Admin creates an investment on behalf of a user (cash payment).
 * Status is immediately APPROVED, but agreementUrl is null until user signs.
 */
async function createInvestmentOnBehalf(adminId, userId, propertyId, units) {
  // Check if admin exists and is authorized (assuming adminId is verified upstream)
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const propertyInfo = await prisma.property.findUnique({ where: { id: propertyId } });

  if (!user) throw new AppError("User not found", 404);
  if (!propertyInfo) throw new AppError("Property not found with the provided ID", 404);
  if (propertyInfo.status !== "AVAILABLE") {
    throw new AppError(`This property is not available for investment (status: ${propertyInfo.status})`, 400);
  }

  return prisma.$transaction(async (tx) => {
    // Re-fetch inside transaction
    const property = await tx.property.findUnique({ where: { id: propertyId } });
    if (property.status !== "AVAILABLE") {
      throw new AppError(`This property is not available for investment (status: ${property.status})`, 400);
    }

    const remainingUnits = property.totalUnits - property.purchasedUnits;
    if (units > remainingUnits) {
      throw new AppError(`Requested ${units} units but only ${remainingUnits} unit(s) are available`, 400);
    }

    const unitPriceAtTime = property.perUnitPrice;
    const finalTotalAmount = units * unitPriceAtTime;

    // Create the investment record
    const investment = await tx.investment.create({
      data: {
        propertyId,
        userId,
        units,
        unitPriceAtTime,
        totalAmount: finalTotalAmount,
        paymentProofUrl: "admin_cash",
        paymentRef: "CASH",
        agreementUrl: null, // User must sign later
        status: "APPROVED",
        adminRemark: `Created on behalf of user by admin ${adminId}`,
      },
      include: {
        property: { select: { id: true, title: true, location: true, perUnitPrice: true } },
        user:     { select: { id: true, fullName: true, phone: true, email: true } },
      },
    });

    // Lock units
    await tx.property.update({
      where: { id: propertyId },
      data:  { purchasedUnits: { increment: units } },
    });

    // Mark user as having purchased a property
    await tx.user.update({
      where: { id: userId },
      data: { hasPurchasedProperty: true },
    });

    return investment;
  });
}

/**
 * User signs an existing admin-created investment that is APPROVED but missing an agreement.
 */
async function signAdminInvestment(userId, investmentId, signatureBase64, placeOfSignature) {
  const investment = await prisma.investment.findUnique({
    where: { id: investmentId },
    include: {
      property: true,
      user: true,
    }
  });

  if (!investment) throw new Error("Investment not found");
  if (investment.userId !== userId) throw new Error("Not authorised to sign this investment");
  if (investment.status !== "APPROVED") throw new Error("Investment is not approved");
  if (investment.agreementUrl) throw new Error("Agreement is already signed and generated");

  if (!signatureBase64 || !placeOfSignature) {
    throw new Error("Signature and place of signature are required");
  }

  try {
    const pdfBuffer = await generateAgreementPdf({
      userName: investment.user.fullName || "User",
      userEmail: investment.user.email || "N/A",
      userPhone: investment.user.phone || "N/A",
      propertyTitle: investment.property.title,
      units: investment.units,
      totalAmount: investment.totalAmount,
      placeOfSignature,
      signatureBase64
    });

    const filename = `agreement_${userId}_${investment.propertyId}_${Date.now()}.pdf`;
    const agreementUrl = await storageService.uploadFile(
      pdfBuffer,
      filename,
      "application/pdf",
      "agreements"
    );

    return await prisma.investment.update({
      where: { id: investmentId },
      data: { agreementUrl }
    });
  } catch (err) {
    throw new Error("Failed to generate or upload agreement PDF: " + err.message);
  }
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
async function getAllInvestments({ page = 1, limit = 20, status, search, propertyId, userId } = {}) {
  const skip  = (page - 1) * limit;
  const where = {};
  
  if (status && status !== "ALL") where.status = status;
  if (propertyId) where.propertyId = propertyId;
  if (userId)     where.userId     = userId;

  if (search && search.trim() !== "") {
    where.user = {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  const [investments, total] = await Promise.all([
    getInvestmentModel().findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        property: { select: { id: true, title: true, location: true, category: true } },
        user: { 
          select: { 
            id: true, 
            fullName: true, 
            phone: true, 
            email: true, 
            profileUrl: true,
            documents: { select: { documentType: true, status: true } }
          } 
        },
      },
    }),
    getInvestmentModel().count({ where }),
  ]);

  // Compute isVerified
  const formattedInvestments = investments.map(inv => {
    let isVerified = false;
    if (inv.user && inv.user.documents) {
      const hasAadhar = inv.user.documents.some(d => d.documentType === 'AADHAAR' && d.status === 'APPROVED');
      const hasPan = inv.user.documents.some(d => d.documentType === 'PAN' && d.status === 'APPROVED');
      isVerified = hasAadhar && hasPan;
    }
    
    // Clean up documents from response and shape the user object properly
    const { documents, ...userWithoutDocs } = inv.user || {};
    
    return {
      ...inv,
      user: {
        ...userWithoutDocs,
        profileImage: userWithoutDocs.profileUrl,
        isVerified
      }
    };
  });

  return {
    investments: formattedInvestments,
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
async function getInvestmentsByProperty(propertyId, { page = 1, limit = 20, status, search } = {}) {
  return getAllInvestments({ page, limit, status, search, propertyId });
}

/**
 * Admin: get all investments by a specific user.
 */
async function getInvestmentsByUser(userId, { page = 1, limit = 20, status, search } = {}) {
  return getAllInvestments({ page, limit, status, search, userId });
}

/**
 * Admin: dashboard statistics across all investments.
 */
async function getInvestmentStats() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [total, pending, approved, rejected, cancelled, valueAgg, pendingValueAgg, recentInvestments] =
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
      getInvestmentModel().findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { status: true, totalAmount: true, createdAt: true }
      })
    ]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendsMap = new Map();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    trendsMap.set(key, {
      month: monthNames[d.getMonth()],
      year: d.getFullYear(),
      approvedAmount: 0,
      pendingAmount: 0,
      approvedCount: 0,
      pendingCount: 0
    });
  }

  for (const inv of recentInvestments) {
    const d = new Date(inv.createdAt);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (trendsMap.has(key)) {
      const stats = trendsMap.get(key);
      if (inv.status === "APPROVED") {
        stats.approvedAmount += inv.totalAmount || 0;
        stats.approvedCount += 1;
      } else if (inv.status === "PENDING") {
        stats.pendingAmount += inv.totalAmount || 0;
        stats.pendingCount += 1;
      }
    }
  }

  const monthlyTrends = Array.from(trendsMap.values());

  return {
    totalInvestments:     total,
    pendingInvestments:   pending,
    approvedInvestments:  approved,
    rejectedInvestments:  rejected,
    cancelledInvestments: cancelled,
    totalValueApproved:   valueAgg._sum.totalAmount    || 0,
    totalValuePending:    pendingValueAgg._sum.totalAmount || 0,
    monthlyTrends
  };
}

module.exports = {
  createInvestment,
  createInvestmentOnBehalf,
  signAdminInvestment,
  cancelInvestment,
  getUserInvestments,
  getUserInvestmentById,
  getAllInvestments,
  getInvestmentStats,
  getInvestmentById,
  getInvestmentsByProperty,
  getInvestmentsByUser,
  approveInvestment,
  rejectInvestment,
};
