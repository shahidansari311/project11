const express = require("express");
const router = express.Router();
const inquiryController = require("./inquiry.controller");
const { validate } = require("../../middlewares/validate.middleware");
const {
  createInquirySchema,
  updateInquiryStatusSchema,
} = require("./inquiry.validation");
const { verifyAuth } = require("../../middlewares/auth.middleware");
const { requireRole } = require("../../middlewares/role.middleware");

// Public route for submitting inquiries from landing page
const publicRouter = express.Router();
publicRouter.post(
  "/",
  validate(createInquirySchema),
  inquiryController.submitInquiry
);

// Admin routes for managing inquiries
const adminRouter = express.Router();
adminRouter.get(
  "/",
  verifyAuth,
  requireRole("admin"),
  inquiryController.getInquiries
);
adminRouter.get(
  "/:id",
  verifyAuth,
  requireRole("admin"),
  inquiryController.getInquiryById
);
adminRouter.patch(
  "/:id/status",
  verifyAuth,
  requireRole("admin"),
  validate(updateInquiryStatusSchema),
  inquiryController.updateStatus
);
adminRouter.delete(
  "/:id",
  verifyAuth,
  requireRole("admin"),
  inquiryController.deleteInquiry
);

module.exports = {
  publicRouter,
  adminRouter,
};
