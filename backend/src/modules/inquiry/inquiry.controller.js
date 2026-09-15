const inquiryService = require("./inquiry.service");
const { successResponse, errorResponse } = require("../../utils/apiResponse");

/**
 * Public: Submit Direct Inquiry from Landing Page
 */
async function submitInquiry(req, res, next) {
  try {
    const inquiry = await inquiryService.createInquiry(req.body);
    return successResponse(
      res,
      201,
      inquiry,
      "Your inquiry has been submitted successfully. Our team will contact you shortly."
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Get all inquiries with pagination, searching, and status filter
 */
async function getInquiries(req, res, next) {
  try {
    const { page, limit, search, status } = req.query;
    const result = await inquiryService.getAllInquiries({
      page,
      limit,
      search,
      status,
    });
    return successResponse(res, 200, result, "Inquiries fetched successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Get single inquiry by ID
 */
async function getInquiryById(req, res, next) {
  try {
    const { id } = req.params;
    const inquiry = await inquiryService.getInquiryById(id);
    return successResponse(res, 200, inquiry, "Inquiry details fetched successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Update inquiry status
 */
async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await inquiryService.updateInquiryStatus(id, status);
    return successResponse(res, 200, updated, "Inquiry status updated successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Delete inquiry
 */
async function deleteInquiry(req, res, next) {
  try {
    const { id } = req.params;
    const result = await inquiryService.deleteInquiry(id);
    return successResponse(res, 200, result, "Inquiry deleted successfully");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitInquiry,
  getInquiries,
  getInquiryById,
  updateStatus,
  deleteInquiry,
};
