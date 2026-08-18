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
    const { documentType, documentUrl, documentNo } = req.body;

    if (!documentUrl) {
      return errorResponse(res, 400, "Document file or URL is required");
    }

    const result = await documentService.uploadOrReuploadDocument(userId, {
      documentType,
      documentUrl,
      documentNo,
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

module.exports = {
  uploadDocument,
  getDocumentStatus,
};
