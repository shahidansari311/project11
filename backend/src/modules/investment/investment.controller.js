const investmentService = require("./investment.service");
const storageService = require("../../services/storage.service");
const { successResponse, errorResponse } = require("../../utils/apiResponse");

const { sendPushNotification } = require("../../services/push.service");

// ─── Helpers ───────────────────────────────────────────────────────────────


function handleError(res, err, next) {
  const msg = err.message || "";
  if (msg.includes("not found"))               return errorResponse(res, 404, msg);
  if (msg.includes("not authorised"))          return errorResponse(res, 403, msg);
  if (msg.includes("not available") ||
      msg.includes("Only PENDING") ||
      msg.includes("You requested") ||
      msg.includes("not been set up"))         return errorResponse(res, 400, msg);
  next(err);
}

// ─── User Controllers ──────────────────────────────────────────────────────

/**
 * POST /user/property/:propertyId/invest
 * Body: { units: number }
 */
async function createInvestment(req, res, next) {
  try {
    const { propertyId } = req.params;
    const { units, paymentProofUrl, signatureBase64, placeOfSignature } = req.body || {};
    const userId         = req.user.id;

    const investment = await investmentService.createInvestment(
      userId, 
      propertyId, 
      Number(units),
      paymentProofUrl,
      signatureBase64,
      placeOfSignature
    );
    
    // Send push notification asynchronously
    sendPushNotification(
      userId, 
      "Purchase Pending", 
      `Your request to purchase ${units} unit(s) has been received and is pending admin approval.`
    );

    return successResponse(res, 201, investment, "Investment created successfully. Awaiting admin approval.");
  } catch (err) {
    handleError(res, err, next);
  }
}

/**
 * POST /user/investments/:id/sign
 * Body: { signatureBase64, placeOfSignature }
 */
async function signAdminInvestment(req, res, next) {
  try {
    const { id } = req.params;
    const { signatureBase64, placeOfSignature } = req.body || {};
    const userId = req.user.id;

    const investment = await investmentService.signAdminInvestment(
      userId,
      id,
      signatureBase64,
      placeOfSignature
    );

    return successResponse(res, 200, investment, "Agreement signed successfully.");
  } catch (err) {
    handleError(res, err, next);
  }
}

/**
 * DELETE /user/investments/:id
 * Cancels a PENDING investment (releases locked units).
 */
async function cancelInvestment(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const investment = await investmentService.cancelInvestment(userId, id);
    return successResponse(res, 200, investment, "Investment cancelled successfully.");
  } catch (err) {
    handleError(res, err, next);
  }
}

/**
 * GET /user/investments
 * Query: ?page=1&limit=20&status=PENDING
 */
async function getUserInvestments(req, res, next) {
  try {
    const userId = req.user.id;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { status, search } = req.query;

    const result = await investmentService.getUserInvestments(userId, {
      page,
      limit,
      status,
      search,
    });
    return successResponse(res, 200, result, "Investments retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

/**
 * GET /user/investments/:id
 */
async function getUserInvestmentById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const investment = await investmentService.getUserInvestmentById(userId, id);
    return successResponse(res, 200, investment, "Investment details retrieved successfully.");
  } catch (err) {
    handleError(res, err, next);
  }
}

// ─── Admin Controllers ─────────────────────────────────────────────────────

/**
 * POST /admin/investments/buy-on-behalf
 * Body: { userId, propertyId, units }
 */
async function createInvestmentOnBehalf(req, res, next) {
  try {
    const adminId = req.user.id;
    const { userId, propertyId, units } = req.body || {};

    if (!userId || !propertyId || !units) {
      return errorResponse(res, 400, "userId, propertyId, and units are required.");
    }

    const investment = await investmentService.createInvestmentOnBehalf(
      adminId,
      userId,
      propertyId,
      Number(units)
    );

    // Send push notification to the user
    sendPushNotification(
      userId,
      "Investment Assigned \uD83C\uDF89",
      `Admin has purchased ${units} unit(s) of property on your behalf.`
    );

    return successResponse(res, 201, investment, "Investment created on behalf of user successfully.");
  } catch (err) {
    handleError(res, err, next);
  }
}

/**
 * GET /admin/investments
 * Query: ?page=&limit=&status=&propertyId=&userId=
 */
async function getAllInvestments(req, res, next) {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { status, propertyId, userId, search } = req.query;

    const result = await investmentService.getAllInvestments({
      page,
      limit,
      status,
      search,
      propertyId,
      userId,
    });
    return successResponse(res, 200, result, "All investments retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/investments/stats
 */
async function getInvestmentStats(req, res, next) {
  try {
    const stats = await investmentService.getInvestmentStats();
    return successResponse(res, 200, stats, "Investment statistics retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/investments/:id
 */
async function getInvestmentById(req, res, next) {
  try {
    const { id } = req.params;
    const investment = await investmentService.getInvestmentById(id);
    return successResponse(res, 200, investment, "Investment details retrieved successfully.");
  } catch (err) {
    handleError(res, err, next);
  }
}

/**
 * GET /admin/investments/property/:propertyId
 */
async function getInvestmentsByProperty(req, res, next) {
  try {
    const { propertyId } = req.params;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { status, search } = req.query;

    const result = await investmentService.getInvestmentsByProperty(propertyId, { page, limit, status, search });
    return successResponse(res, 200, result, "Property investments retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/investments/user/:userId
 */
async function getInvestmentsByUser(req, res, next) {
  try {
    const { userId } = req.params;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { status, search } = req.query;

    const result = await investmentService.getInvestmentsByUser(userId, { page, limit, status, search });
    return successResponse(res, 200, result, "User investments retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /admin/investments/:id/approve
 */
async function approveInvestment(req, res, next) {
  try {
    const { id }  = req.params;
    const adminId = req.user.id;
    const { amountReceived } = req.body || {}; // Default to {} if no body sent (full approval)

    const investment = await investmentService.approveInvestment(adminId, id, amountReceived);
    
    // Send push notification
    if (investment && investment.userId) {
      const isPartial = investment.status === "PARTIAL_PAID";
      sendPushNotification(
        investment.userId,
        isPartial ? "Partial Payment Accepted 💰" : "Investment Approved 🎉",
        isPartial ? `Your partial payment of ₹${amountReceived} was received. Please pay the remaining balance.` : "Your property investment has been approved!"
      );
    }

    return successResponse(res, 200, investment, "Investment processed successfully.");
  } catch (err) {
    handleError(res, err, next);
  }
}

/**
 * PATCH /admin/investments/:id/reject
 * Body: { remark?: string }
 */
async function rejectInvestment(req, res, next) {
  try {
    const { id }    = req.params;
    const adminId   = req.user.id;
    const { remark } = req.body || {};

    const investment = await investmentService.rejectInvestment(adminId, id, remark);

    // Send push notification
    if (investment && investment.userId) {
      sendPushNotification(
        investment.userId,
        "Investment Rejected ❌",
        `Your investment was rejected. Reason: ${remark || 'Not provided'}`
      );
    }

    return successResponse(res, 200, investment, "Investment rejected successfully.");
  } catch (err) {
    handleError(res, err, next);
  }
}

/**
 * POST /user/investments/:id/pay-remaining
 */
async function payRemainingInvestment(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { paymentProofUrl } = req.body || {};

    const investment = await investmentService.payRemainingInvestment(userId, id, paymentProofUrl);
    return successResponse(res, 200, investment, "Payment proof uploaded and submitted for review.");
  } catch (err) {
    handleError(res, err, next);
  }
}

/**
 * POST /user/investments/:id/refund
 */
async function requestRefund(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { refundBankDetails } = req.body || {};

    const investment = await investmentService.requestRefund(userId, id, refundBankDetails);
    return successResponse(res, 200, investment, "Refund requested successfully. Our team will process it soon.");
  } catch (err) {
    handleError(res, err, next);
  }
}

/**
 * POST /user/investments/:id/request-withdrawal
 */
async function requestWithdrawal(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { refundBankDetails } = req.body || {};

    const investment = await investmentService.requestWithdrawal(userId, id, refundBankDetails);
    return successResponse(res, 200, investment, "Withdrawal requested successfully. Our team will process it soon.");
  } catch (err) {
    handleError(res, err, next);
  }
}

/**
 * POST /admin/investments/:id/refund
 */
async function processRefund(req, res, next) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    let refundProofUrl = req.body?.refundProofUrl;

    if (req.file) {
      refundProofUrl = await storageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "refunds"
      );
    }

    if (!refundProofUrl) {
      return errorResponse(res, 400, "refundProofUrl or a file upload is required");
    }

    const investment = await investmentService.processRefund(adminId, id, refundProofUrl);
    
    // Remove agreementUrl from response
    if (investment && investment.agreementUrl) {
      delete investment.agreementUrl;
    }
    
    // Send push notification
    if (investment && investment.userId) {
      sendPushNotification(
        investment.userId,
        "Refund Processed 💸",
        "Your investment refund has been processed and units have been cancelled."
      );
    }

    return successResponse(res, 200, investment, "Refund processed and units released.");
  } catch (err) {
    handleError(res, err, next);
  }
}

/**
 * POST /admin/investments/:id/process-withdrawal
 */
async function processWithdrawal(req, res, next) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    let paymentProofUrl = req.body?.paymentProofUrl;

    if (req.file) {
      paymentProofUrl = await storageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "withdrawals"
      );
    }

    if (!paymentProofUrl) {
      return errorResponse(res, 400, "paymentProofUrl or a file upload is required");
    }

    const investment = await investmentService.processWithdrawal(adminId, id, paymentProofUrl);
    
    // Send push notification
    if (investment && investment.userId) {
      sendPushNotification(
        investment.userId,
        "Withdrawal Processed 💸",
        "Your investment withdrawal has been processed and units have been released."
      );
    }

    return successResponse(res, 200, investment, "Withdrawal processed and units released.");
  } catch (err) {
    handleError(res, err, next);
  }
}

module.exports = {
  createInvestment,
  createInvestmentOnBehalf,
  signAdminInvestment,
  getUserInvestments,
  getUserInvestmentById,
  cancelInvestment,
  getInvestmentsByProperty,
  getInvestmentsByUser,
  getInvestmentStats,
  getAllInvestments,
  getInvestmentById,
  approveInvestment,
  rejectInvestment,
  payRemainingInvestment,
  requestRefund,
  processRefund,
  requestWithdrawal,
  processWithdrawal,
};
