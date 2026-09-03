const investmentService = require("./investment.service");
const { successResponse, errorResponse } = require("../../utils/apiResponse");

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
    const { units }      = req.body;
    const userId         = req.user.id;

    const investment = await investmentService.createInvestment(userId, propertyId, Number(units));
    return successResponse(res, 201, investment, "Investment created successfully. Awaiting admin approval.");
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
    const { status } = req.query;

    const result = await investmentService.getUserInvestments(userId, { page, limit, status });
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
 * GET /admin/investments
 * Query: ?page=&limit=&status=&propertyId=&userId=
 */
async function getAllInvestments(req, res, next) {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { status, propertyId, userId } = req.query;

    const result = await investmentService.getAllInvestments({ page, limit, status, propertyId, userId });
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
    const { status } = req.query;

    const result = await investmentService.getInvestmentsByProperty(propertyId, { page, limit, status });
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
    const { status } = req.query;

    const result = await investmentService.getInvestmentsByUser(userId, { page, limit, status });
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

    const investment = await investmentService.approveInvestment(adminId, id);
    return successResponse(res, 200, investment, "Investment approved successfully.");
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
    const { remark } = req.body;

    const investment = await investmentService.rejectInvestment(adminId, id, remark);
    return successResponse(res, 200, investment, "Investment rejected successfully.");
  } catch (err) {
    handleError(res, err, next);
  }
}

module.exports = {
  // User
  createInvestment,
  cancelInvestment,
  getUserInvestments,
  getUserInvestmentById,
  // Admin
  getAllInvestments,
  getInvestmentStats,
  getInvestmentById,
  getInvestmentsByProperty,
  getInvestmentsByUser,
  approveInvestment,
  rejectInvestment,
};
