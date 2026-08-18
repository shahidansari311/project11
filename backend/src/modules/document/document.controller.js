const documentService = require("./document.service");
const { successResponse, errorResponse } = require("../../utils/apiResponse");

/**
 * POST /user/document
 * User uploads or re-uploads a document.
 */
async function uploadDocument(req, res, next) {
  try {
    // Document APIs are for users only — admin cannot upload documents on behalf of themselves
    if (req.user.role === "admin") {
      return errorResponse(res, 403, "Document upload is only available for users. Please use a User access token.");
    }

    const userId = req.user.id;
    const { documentType, frontImageUrl, backImageUrl, documentUrl } = req.body;

    const result = await documentService.uploadOrReuploadDocument(userId, {
      documentType,
      frontImageUrl,
      backImageUrl,
      documentUrl,
    });

    return successResponse(res, 200, result.document, result.message);
  } catch (err) {
    if (err.message && err.message.includes("Foreign key constraint")) {
      return errorResponse(res, 400, "Invalid user. Please login with a valid User account to upload documents.");
    }
    next(err);
  }
}

/**
 * GET /user/document
 * User checks status and remarks of uploaded documents.
 */
async function getDocumentStatus(req, res, next) {
  try {
    const userId = req.user.id;
    const { documentType } = req.query;

    const documents = await documentService.getUserDocumentStatus(userId, documentType);

    return successResponse(
      res,
      200,
      documents,
      "Document status and remarks retrieved successfully"
    );
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/documents
 * Admin: Get all users with document upload overview (uploaded vs pending/not uploaded).
 */
async function adminGetAllUsersDocumentsOverview(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search || "";
    const status = req.query.status;
    const documentType = req.query.documentType;
    const verificationStatus = req.query.verificationStatus;

    const result = await documentService.adminGetAllUsersDocumentsOverview({
      page,
      limit,
      search,
      status,
      documentType,
      verificationStatus,
    });

    return successResponse(res, 200, result, "Users document overview retrieved successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/users/:userId/documents
 * Admin: Get specific user's documents and status by User ID.
 */
async function adminGetUserDocumentsById(req, res, next) {
  try {
    const { userId } = req.params;
    const result = await documentService.adminGetUserDocumentsById(userId);

    return successResponse(res, 200, result, "User documents retrieved successfully");
  } catch (err) {
    if (err.message && err.message.includes("not found")) {
      return errorResponse(res, 404, err.message);
    }
    next(err);
  }
}

/**
 * POST /admin/document/:id/verify
 * Admin: Verify document (APPROVE or REJECT) with optional remark.
 */
async function adminVerifyDocument(req, res, next) {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;

    const updatedDoc = await documentService.adminVerifyDocument(id, { status, remark });

    return successResponse(
      res,
      200,
      updatedDoc,
      `Document has been ${status.toLowerCase()} successfully`
    );
  } catch (err) {
    if (err.message && err.message.includes("not found")) {
      return errorResponse(res, 404, err.message);
    }
    next(err);
  }
}

/**
 * POST /admin/users/:userId/document
 * Admin: Upload document for a specific user (automatically verified, isUploadedByAdmin = true).
 */
async function adminUploadUserDocument(req, res, next) {
  try {
    const { userId } = req.params;
    const { documentType, frontImageUrl, backImageUrl, documentUrl, remark } = req.body;

    const result = await documentService.adminUploadUserDocument(userId, {
      documentType,
      frontImageUrl,
      backImageUrl,
      documentUrl,
      remark,
    });

    return successResponse(res, 200, result.document, result.message);
  } catch (err) {
    if (err.message && err.message.includes("not found")) {
      return errorResponse(res, 404, err.message);
    }
    next(err);
  }
}

module.exports = {
  uploadDocument,
  getDocumentStatus,
  adminGetAllUsersDocumentsOverview,
  adminGetUserDocumentsById,
  adminVerifyDocument,
  adminUploadUserDocument,
};
