const express = require("express");
const router  = express.Router();

const userController = require("./controllers/user.investment.controller");
const adminController = require("./controllers/admin.investment.controller");
const { validate }          = require("../../middlewares/validate.middleware");
const {
  createInvestmentSchema,
  rejectInvestmentSchema,
  listInvestmentsSchema,
  requestWithdrawalSchema,
  processWithdrawalSchema,
} = require("./investment.validation");

// NOTE: Auth middleware (verifyAuth + requireRole) is applied in routes/index.js before mounting.
// These routes are split into /user/* and /admin/* in index.js.

// ─── Exported as two separate routers for clean mounting ───────────────────

const userRouter  = express.Router();
const adminRouter = express.Router();

// ─── User routes ───────────────────────────────────────────────────────────

// POST /user/property/:propertyId/invest
userRouter.post(
  "/property/:propertyId/invest",
  validate(createInvestmentSchema),
  userController.createInvestment
);

// POST /user/investments/:id/sign
userRouter.post("/investments/:id/sign", userController.signAdminInvestment);

// GET /user/investments
userRouter.get("/investments", userController.getUserInvestments);

// GET /user/investments/:id
userRouter.get("/investments/:id", userController.getUserInvestmentById);

// DELETE /user/investments/:id  (cancel)
userRouter.delete("/investments/:id", userController.cancelInvestment);

// POST /user/investments/:id/pay-remaining
userRouter.post("/investments/:id/pay-remaining", userController.payRemainingInvestment);

// POST /user/investments/:id/refund
userRouter.post("/investments/:id/refund", userController.requestRefund);

// POST /user/investments/:id/request-withdrawal
userRouter.post(
  "/investments/:id/request-withdrawal",
  validate(requestWithdrawalSchema),
  userController.requestWithdrawal
);

// ─── Admin routes ──────────────────────────────────────────────────────────

// POST /admin/investments/buy-on-behalf
adminRouter.post("/buy-on-behalf", adminController.createInvestmentOnBehalf);

// GET /admin/investments/stats  (must come before /:id to avoid param conflict)
adminRouter.get("/stats", adminController.getInvestmentStats);

// GET /admin/investments/property/:propertyId
adminRouter.get("/property/:propertyId", adminController.getInvestmentsByProperty);

// GET /admin/investments/user/:userId
adminRouter.get("/user/:userId", adminController.getInvestmentsByUser);

// GET /admin/investments  (all, with filters)
adminRouter.get("/", validate(listInvestmentsSchema), adminController.getAllInvestments);

// GET /admin/investments/:id
adminRouter.get("/:id", adminController.getInvestmentById);

// PATCH /admin/investments/:id/approve
adminRouter.patch("/:id/approve", adminController.approveInvestment);

const { documentUpload } = require("../../config/multer.config");
// POST /admin/investments/:id/refund
adminRouter.post("/:id/refund", documentUpload.single("file"), adminController.processRefund);

// PATCH /admin/investments/:id/reject
adminRouter.patch(
  "/:id/reject",
  validate(rejectInvestmentSchema),
  adminController.rejectInvestment
);

// POST /admin/investments/:id/process-withdrawal
adminRouter.post(
  "/:id/process-withdrawal",
  documentUpload.single("file"),
  adminController.processWithdrawal
);

module.exports = { userRouter, adminRouter };
