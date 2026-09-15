const prisma = require("../../config/db");
const { generateAgreementPdf, generateInvoicePdf } = require("../../utils/pdfGenerator");
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

/**
 * Updates the 'investors' count on a property by counting unique users 
 * who have an active investment (APPROVED or PARTIAL_PAID) in it.
 */
async function updatePropertyInvestorsCount(tx, propertyId) {
  const uniqueInvestors = await tx.investment.groupBy({
    by: ['userId'],
    where: {
      propertyId,
      status: { in: ["APPROVED", "PARTIAL_PAID"] }
    }
  });

  await tx.property.update({
    where: { id: propertyId },
    data: { investors: uniqueInvestors.length }
  });
}

/**
 * Automatically transitions a property to SOLD or AVAILABLE
 * based on the updated property object returned from a prior update call.
 * Accepts the full updatedProperty so no extra DB read is needed.
 */
async function syncPropertyStatus(tx, updatedProperty) {
  const { id, purchasedUnits, totalUnits, status } = updatedProperty;

  if (purchasedUnits >= totalUnits && ["AVAILABLE", "COMING_SOON"].includes(status)) {
    await tx.property.update({
      where: { id },
      data: { status: "SOLD" },
    });
  } else if (purchasedUnits < totalUnits && status === "SOLD") {
    await tx.property.update({
      where: { id },
      data: { status: "AVAILABLE" },
    });
  }
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
  // Pre-fetch user and property outside the transaction
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
    const finalTotalAmount = Math.ceil(units * unitPriceAtTime);
    
    const targetReturnAtTime = property.targetReturn || 0;
    const promisedReturnAmount = finalTotalAmount * (targetReturnAtTime / 100);

    // Create the investment record
    const investment = await tx.investment.create({
      data: {
        propertyId,
        userId,
        units,
        unitPriceAtTime,
        totalAmount: finalTotalAmount,
        paymentProofs: paymentProofUrl ? [paymentProofUrl] : [],
        signatureBase64: signatureBase64 || null,
        placeOfSignature: placeOfSignature || null,
        agreementUrl: null, // Agreement is generated on APPROVAL
        status: "PENDING",
        targetReturnAtTime,
        promisedReturnAmount,
      },
      include: {
        property: { select: { id: true, title: true, location: true, perUnitPrice: true } },
        user:     { select: { id: true, fullName: true, phone: true, email: true } },
      },
    });

    // Lock units by incrementing purchasedUnits counter
    const updatedPropCreate = await tx.property.update({
      where: { id: propertyId },
      data:  { purchasedUnits: { increment: units } },
    });
    await syncPropertyStatus(tx, updatedPropCreate);

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
    const finalTotalAmount = Math.ceil(units * unitPriceAtTime);
    
    const targetReturnAtTime = property.targetReturn || 0;
    const promisedReturnAmount = finalTotalAmount * (targetReturnAtTime / 100);

    // Generate Invoice PDF for this cash payment
    let newInvoiceUrl = null;
    try {
      const dateObj = new Date();
      const invoiceData = {
        invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: dateObj.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
        userFullName: user.fullName || "User",
        userEmail: user.email,
        userPhone: user.phone || "",
        propertyTitle: property.title || "Property",
        propertyLocation: property.location,
        units: units,
        unitPriceAtTime: unitPriceAtTime,
        totalAmount: finalTotalAmount,
        previousPaidAmount: 0,
        currentPaymentAmount: finalTotalAmount,
        remainingBalance: 0,
        paymentHistory: [{ date: dateObj.toISOString(), amount: finalTotalAmount }]
      };
      const invoiceBuffer = await generateInvoicePdf(invoiceData);
      const filename = `invoice_onbehalf_${userId}_${Date.now()}.pdf`;
      newInvoiceUrl = await storageService.uploadFile(
        invoiceBuffer,
        filename,
        "application/pdf",
        "invoices"
      );
    } catch (err) {
      console.error("Failed to generate invoice PDF:", err.message);
    }

    const paymentHistoryItem = {
      date: new Date().toISOString(),
      amount: finalTotalAmount,
      invoiceUrl: newInvoiceUrl,
    };

    // Create the investment record
    const investment = await tx.investment.create({
      data: {
        propertyId,
        userId,
        units,
        unitPriceAtTime,
        totalAmount: finalTotalAmount,
        paidAmount: finalTotalAmount,
        paymentProofs: ["admin_cash"],
        paymentRef: "CASH",
        paymentHistory: [paymentHistoryItem],
        invoices: newInvoiceUrl ? [newInvoiceUrl] : [],
        signatureBase64: null,
        placeOfSignature: null,
        agreementUrl: null, // User must sign later
        status: "APPROVED",
        targetReturnAtTime,
        promisedReturnAmount,
        adminRemark: `Created on behalf of user by admin ${adminId}`,
      },
      include: {
        property: { select: { id: true, title: true, location: true, perUnitPrice: true } },
        user:     { select: { id: true, fullName: true, phone: true, email: true } },
      },
    });

    // Lock units
    const updatedPropOnBehalf = await tx.property.update({
      where: { id: propertyId },
      data:  { purchasedUnits: { increment: units } },
    });
    await syncPropertyStatus(tx, updatedPropOnBehalf);

    // Mark user as having purchased a property
    await tx.user.update({
      where: { id: userId },
      data: { hasPurchasedProperty: true },
    });

    return investment;
  }, { timeout: 20000 });
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
      data: { 
        agreementUrl,
        signatureBase64,
        placeOfSignature 
      }
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
    const updatedPropCancel = await tx.property.update({
      where: { id: investment.propertyId },
      data:  { purchasedUnits: { decrement: investment.units } },
    });
    await syncPropertyStatus(tx, updatedPropCancel);

    return updated;
  });
}

/**
 * Get all investments belonging to a user (with pagination & optional status filter).
 */
async function getUserInvestments(userId, { page = 1, limit = 20, status, search } = {}) {
  const skip  = (page - 1) * limit;
  const where = { userId };
  if (status) where.status = status;
  
  if (search && search.trim() !== "") {
    where.property = {
      title: { contains: search, mode: 'insensitive' }
    };
  }

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
    investments: investments.map(enrichInvestment),
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
          purchasedUnits: true, images: true, targetReturn: true, termPeriodYears: true,
        },
      },
      user: { select: { id: true, fullName: true, phone: true, email: true } },
    },
  });

  if (!investment) throw new Error("Investment not found");
  if (investment.userId !== userId) throw new Error("You are not authorised to view this investment");

  return enrichInvestment(investment);
}

function enrichInvestment(investment) {
  if (!investment) return investment;

  let remainingTermString = null;
  let isMatured = false;
  let currentValuation = investment.totalAmount;

  let effectiveMaturityDate = investment.maturityDate;
  if (!effectiveMaturityDate && investment.createdAt && investment.property && investment.property.termPeriodYears) {
    const fallbackDate = new Date(investment.createdAt);
    fallbackDate.setFullYear(fallbackDate.getFullYear() + investment.property.termPeriodYears);
    effectiveMaturityDate = fallbackDate;
  }

  if (effectiveMaturityDate) {
    const now = new Date();
    const maturity = new Date(effectiveMaturityDate);
    
    if (now >= maturity) {
      isMatured = true;
      remainingTermString = "0 Years, 0 Months, 0 Days";
    } else {
      let years = maturity.getFullYear() - now.getFullYear();
      let months = maturity.getMonth() - now.getMonth();
      let days = maturity.getDate() - now.getDate();

      if (days < 0) {
        months -= 1;
        // get days in previous month
        const prevMonth = new Date(maturity.getFullYear(), maturity.getMonth(), 0);
        days += prevMonth.getDate();
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      remainingTermString = `${years} Years, ${months} Months, ${days} Days`;
    }

    if (investment.promisedReturnAmount) {
      currentValuation = investment.totalAmount + investment.promisedReturnAmount;
    } else if (investment.property && investment.property.targetReturn) {
      // Fallback for old investments
      const targetReturnDecimal = investment.property.targetReturn / 100;
      currentValuation = investment.totalAmount + (investment.totalAmount * targetReturnDecimal);
    }
  }

  return {
    ...investment,
    date: investment.createdAt, // Added explicitly for API response
    maturityDate: effectiveMaturityDate,
    remainingTermString,
    isMatured,
    currentValuation,
  };
}

// ---------------------------------------------------------------------------
// Admin-facing services
// ---------------------------------------------------------------------------

/**
 * Admin approves a PENDING investment.
 * Updates user.hasPurchasedProperty = true and increments property.investors count.
 * purchasedUnits stays as-is (already counted on creation).
 */
async function approveInvestment(adminId, investmentId, amountReceived) {
  return prisma.$transaction(async (tx) => {
    const investment = await tx.investment.findUnique({
      where: { id: investmentId },
      include: { user: true, property: true },
    });

    if (!investment) throw new AppError("Investment not found", 404);
    if (!["PENDING", "PARTIAL_PAID"].includes(investment.status)) {
      throw new AppError(`Only PENDING or PARTIAL_PAID investments can receive payments (current status: ${investment.status})`, 400);
    }

    const received = Number(amountReceived) || 0;
    
    if (received < 0) {
      throw new AppError("Amount received cannot be negative.", 400);
    }

    const remainingAmount = investment.totalAmount - investment.paidAmount;
    if (received > remainingAmount) {
      throw new AppError(`Amount received (₹${received}) cannot be greater than the remaining balance (₹${remainingAmount}).`, 400);
    }

    const newPaidAmount = investment.paidAmount + received;
    
    // Determine status based on cumulative payment
    const finalStatus = newPaidAmount >= investment.totalAmount ? "APPROVED" : "PARTIAL_PAID";
    
    // If approved, calculate maturity date and generate agreement PDF
    let maturityDate = null;
    let newAgreementUrl = null;

    const property = investment.property;
    if (finalStatus === "APPROVED" && property && property.termPeriodYears) {
      const d = new Date();
      d.setFullYear(d.getFullYear() + property.termPeriodYears);
      maturityDate = d;
    }

    // Generate PDF if not yet generated and user has signed
    if (finalStatus === "APPROVED" && !investment.agreementUrl && investment.signatureBase64 && investment.placeOfSignature) {
      try {
        const pdfBuffer = await generateAgreementPdf({
          userName: investment.user.fullName || "User",
          userEmail: investment.user.email || "N/A",
          userPhone: investment.user.phone || "N/A",
          propertyTitle: property?.title || "Property",
          units: investment.units,
          totalAmount: investment.totalAmount,
          placeOfSignature: investment.placeOfSignature,
          signatureBase64: investment.signatureBase64
        });

        const filename = `agreement_${investment.userId}_${investment.propertyId}_${Date.now()}.pdf`;
        newAgreementUrl = await storageService.uploadFile(
          pdfBuffer,
          filename,
          "application/pdf",
          "agreements"
        );
      } catch (err) {
        console.error("Failed to generate agreement PDF on approval:", err.message);
        // Non-fatal, admin can still approve, PDF generation might fail
      }
    }

    let existingHistory = [];
    if (investment.paymentHistory) {
      try {
        existingHistory = typeof investment.paymentHistory === 'string' 
          ? JSON.parse(investment.paymentHistory) 
          : investment.paymentHistory;
        if (!Array.isArray(existingHistory)) existingHistory = [];
      } catch (e) {
        existingHistory = [];
      }
    }

    // Generate Invoice PDF for this specific approved payment
    let newInvoiceUrl = null;
    if (received > 0) {
      try {
        const dateObj = new Date();
        const invoiceData = {
          invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: dateObj.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
          userFullName: investment.user.fullName || "User",
          userEmail: investment.user.email,
          userPhone: investment.user.phone || "",
          propertyTitle: property?.title || "Property",
          propertyLocation: property?.location || "",
          units: investment.units,
          unitPriceAtTime: investment.unitPriceAtTime,
          totalAmount: investment.totalAmount,
          previousPaidAmount: investment.paidAmount,
          currentPaymentAmount: received,
          remainingBalance: investment.totalAmount - newPaidAmount,
          paymentHistory: [...existingHistory, { date: dateObj.toISOString(), amount: received }]
        };
        const invoiceBuffer = await generateInvoicePdf(invoiceData);
        const filename = `invoice_${investmentId}_${Date.now()}.pdf`;
        newInvoiceUrl = await storageService.uploadFile(
          invoiceBuffer,
          filename,
          "application/pdf",
          "invoices"
        );
      } catch (err) {
        console.error("Failed to generate invoice PDF:", err.message);
      }
    }

    if (received > 0) {
      existingHistory.push({
        date: new Date().toISOString(),
        amount: received,
        invoiceUrl: newInvoiceUrl,
      });
    }
    
    const newInvoices = investment.invoices || [];
    if (newInvoiceUrl) {
      newInvoices.push(newInvoiceUrl);
    }

    const updated = await tx.investment.update({
      where: { id: investmentId },
      data:  { 
        status: finalStatus,
        paidAmount: newPaidAmount,
        paymentHistory: existingHistory,
        invoices: newInvoices,
        ...(maturityDate && { maturityDate }),
        ...(newAgreementUrl && { agreementUrl: newAgreementUrl })
      },
      include: {
        property: { select: { id: true, title: true, location: true } },
        user:     { select: { id: true, fullName: true, phone: true, email: true } },
      },
    });

    // Mark user as having purchased property (if not already)
    await tx.user.update({
      where: { id: investment.userId },
      data:  { hasPurchasedProperty: true },
    });

    // Dynamically update unique investors count
    await updatePropertyInvestorsCount(tx, investment.propertyId);

    return updated;
  }, { timeout: 20000 });
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
    const updatedPropReject = await tx.property.update({
      where: { id: investment.propertyId },
      data:  { purchasedUnits: { decrement: investment.units } },
    });
    await syncPropertyStatus(tx, updatedPropReject);

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
    where.OR = [
      {
        user: {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }
      },
      {
        property: {
          title: { contains: search, mode: 'insensitive' }
        }
      }
    ];
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
    
    return enrichInvestment({
      ...inv,
      user: {
        ...userWithoutDocs,
        profileImage: userWithoutDocs.profileUrl,
        isVerified
      }
    });
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
  return enrichInvestment(investment);
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

  const [
    total,
    pending,
    approved,
    rejected,
    cancelled,
    partialPaid,
    refundRequested,
    refunded,
    withdrawalRequested,
    withdrawn,
    valueAgg,
    pendingValueAgg,
    recentInvestments
  ] = await Promise.all([
    getInvestmentModel().count(),
    getInvestmentModel().count({ where: { status: "PENDING" } }),
    getInvestmentModel().count({ where: { status: "APPROVED" } }),
    getInvestmentModel().count({ where: { status: "REJECTED" } }),
    getInvestmentModel().count({ where: { status: "CANCELLED" } }),
    getInvestmentModel().count({ where: { status: "PARTIAL_PAID" } }),
    getInvestmentModel().count({ where: { status: "REFUND_REQUESTED" } }),
    getInvestmentModel().count({ where: { status: "REFUNDED" } }),
    getInvestmentModel().count({ where: { status: "WITHDRAWAL_REQUESTED" } }),
    getInvestmentModel().count({ where: { status: "WITHDRAWN" } }),
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
    partialPaidInvestments: partialPaid,
    refundRequestedInvestments: refundRequested,
    refundedInvestments: refunded,
    withdrawalRequestedInvestments: withdrawalRequested,
    withdrawnInvestments: withdrawn,
    totalValueApproved:   valueAgg._sum.totalAmount    || 0,
    totalValuePending:    pendingValueAgg._sum.totalAmount || 0,
    monthlyTrends
  };
}

/**
 * User uploads new payment proof for remaining amount
 */
async function payRemainingInvestment(userId, investmentId, paymentProofUrl) {
  const investment = await getInvestmentModel().findUnique({ where: { id: investmentId } });
  if (!investment) throw new AppError("Investment not found", 404);
  if (investment.userId !== userId) throw new AppError("Not authorized", 403);
  if (investment.status !== "PARTIAL_PAID") {
    throw new AppError("You can only pay remaining balance on partially paid investments", 400);
  }

  const newProofs = investment.paymentProofs ? [...investment.paymentProofs, paymentProofUrl] : [paymentProofUrl];

  return getInvestmentModel().update({
    where: { id: investmentId },
    data: {
      status: "PENDING",
      paymentProofs: newProofs,
    },
    include: { property: { select: { title: true } } },
  });
}

/**
 * User requests a refund for a partially paid investment
 */
async function requestRefund(userId, investmentId, refundBankDetails) {
  const investment = await getInvestmentModel().findUnique({ where: { id: investmentId } });
  if (!investment) throw new AppError("Investment not found", 404);
  if (investment.userId !== userId) throw new AppError("Not authorized", 403);
  if (investment.status !== "PARTIAL_PAID") {
    throw new AppError("You can only request a refund on partially paid investments", 400);
  }

  return getInvestmentModel().update({
    where: { id: investmentId },
    data: {
      status: "REFUND_REQUESTED",
      refundBankDetails,
    },
  });
}

/**
 * User requests withdrawal after the investment term has matured
 */
async function requestWithdrawal(userId, investmentId, refundBankDetails) {
  const investment = await getInvestmentModel().findUnique({ 
    where: { id: investmentId },
    include: {
      property: true
    }
  });
  if (!investment) throw new AppError("Investment not found", 404);
  if (investment.userId !== userId) throw new AppError("Not authorized", 403);
  if (investment.status !== "APPROVED") {
    throw new AppError("You can only request withdrawal for APPROVED investments", 400);
  }
  if (!investment.maturityDate || new Date() < new Date(investment.maturityDate)) {
    throw new AppError("Investment has not matured yet", 400);
  }

  return getInvestmentModel().update({
    where: { id: investmentId },
    data: {
      status: "WITHDRAWAL_REQUESTED",
      refundBankDetails,
      adminRemark: "User requested withdrawal upon maturity"
    },
  });
}

/**
 * Admin processes the refund and releases units
 */
async function processRefund(adminId, investmentId, refundProofUrl) {
  return prisma.$transaction(async (tx) => {
    const investment = await tx.investment.findUnique({
      where: { id: investmentId },
    });

    if (!investment) throw new AppError("Investment not found", 404);
    if (investment.status !== "REFUND_REQUESTED") {
      throw new AppError(`Cannot refund investment with status: ${investment.status}`, 400);
    }

    const updated = await tx.investment.update({
      where: { id: investmentId },
      data: { status: "REFUNDED", refundProofUrl },
    });

    // Release units back to property
    const updatedPropRefund = await tx.property.update({
      where: { id: investment.propertyId },
      data: { purchasedUnits: { decrement: investment.units } },
    });
    await syncPropertyStatus(tx, updatedPropRefund);
    
    // Dynamically update unique investors count
    await updatePropertyInvestorsCount(tx, investment.propertyId);

    return updated;
  });
}

/**
 * Admin processes the withdrawal and releases units
 */
async function processWithdrawal(adminId, investmentId, paymentProofUrl) {
  return prisma.$transaction(async (tx) => {
    const investment = await tx.investment.findUnique({
      where: { id: investmentId },
    });

    if (!investment) throw new AppError("Investment not found", 404);
    if (investment.status !== "WITHDRAWAL_REQUESTED") {
      throw new AppError(`Cannot process withdrawal for investment with status: ${investment.status}`, 400);
    }

    const updated = await tx.investment.update({
      where: { id: investmentId },
      // Re-using refundProofUrl to store the withdrawal payment proof
      data: { status: "WITHDRAWN", refundProofUrl: paymentProofUrl },
    });

    // Release units back to property
    const updatedPropWithdraw = await tx.property.update({
      where: { id: investment.propertyId },
      data: { purchasedUnits: { decrement: investment.units } },
    });
    await syncPropertyStatus(tx, updatedPropWithdraw);
    
    // Dynamically update unique investors count
    await updatePropertyInvestorsCount(tx, investment.propertyId);

    return updated;
  });
}

async function calculateInvestmentAmount(propertyId, units) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw new AppError("Property not found", 404);

  const exactAmount = units * property.perUnitPrice;
  const finalAmount = Math.ceil(exactAmount);

  return {
    propertyId,
    units,
    perUnitPrice: property.perUnitPrice,
    exactAmount,
    finalAmount,
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
  getInvestmentById,
  getInvestmentsByProperty,
  getInvestmentsByUser,
  approveInvestment,
  rejectInvestment,
  payRemainingInvestment,
  requestRefund,
  processRefund,
  getInvestmentStats,
  requestWithdrawal,
  processWithdrawal,
  calculateInvestmentAmount,
};
