const investmentService = require("../services/user.investment.service");
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

module.exports = {
  createInvestment,
  signAdminInvestment,
  cancelInvestment,
  getUserInvestments,
  getUserInvestmentById,
  payRemainingInvestment,
  requestRefund,
  requestWithdrawal,
};
