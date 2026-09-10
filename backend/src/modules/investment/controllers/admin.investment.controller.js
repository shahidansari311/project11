const investmentService = require("../services/admin.investment.service");
const storageService = require("../../../services/storage.service");
const { successResponse, errorResponse } = require("../../../utils/apiResponse");
const { sendPushNotification } = require("../../../services/push.service");

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

async function getInvestmentStats(req, res, next) {
  try {
    const stats = await investmentService.getInvestmentStats();
    return successResponse(res, 200, stats, "Investment statistics retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getInvestmentById(req, res, next) {
  try {
    const { id } = req.params;
    const investment = await investmentService.getInvestmentById(id);
    return successResponse(res, 200, investment, "Investment details retrieved successfully.");
  } catch (err) {
    handleError(res, err, next);
  }
}

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

async function approveInvestment(req, res, next) {
  try {
    const { id }  = req.params;
    const adminId = req.user.id;
    const { amountReceived } = req.body || {};

    const investment = await investmentService.approveInvestment(adminId, id, amountReceived);
    
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

async function rejectInvestment(req, res, next) {
  try {
    const { id }    = req.params;
    const adminId   = req.user.id;
    const { remark } = req.body || {};

    const investment = await investmentService.rejectInvestment(adminId, id, remark);

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
    
    if (investment && investment.agreementUrl) {
      delete investment.agreementUrl;
    }
    
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
  createInvestmentOnBehalf,
  getAllInvestments,
  getInvestmentStats,
  getInvestmentById,
  getInvestmentsByProperty,
  getInvestmentsByUser,
  approveInvestment,
  rejectInvestment,
  processRefund,
  processWithdrawal,
};
