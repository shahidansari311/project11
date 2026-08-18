const prisma = require("../../config/db");

// Helper to access UserDocument model safely
const getDocumentModel = () => {
  const model = prisma.userDocument || prisma.UserDocument;
  if (!model) {
    throw new Error("UserDocument model not found on Prisma Client. Please run 'npx prisma generate'.");
  }
  return model;
};

/**
 * Upload or Re-upload document for a user.
 * If document of same documentType exists, it updates the existing entry and resets status to PENDING.
 */
async function uploadOrReuploadDocument(userId, { documentType = "KYC", documentUrl, documentNo }) {
  const docModel = getDocumentModel();
  const normalizedType = documentType.trim().toUpperCase();

  const existingDoc = await docModel.findFirst({
    where: {
      userId,
      documentType: normalizedType,
    },
  });

  if (existingDoc) {
    // Re-upload case: update existing document and reset status to PENDING
    const updatedDoc = await docModel.update({
      where: { id: existingDoc.id },
      data: {
        documentUrl,
        documentNo: documentNo !== undefined ? documentNo : existingDoc.documentNo,
        status: "PENDING",
        remark: "Re-uploaded, pending verification",
      },
    });

    return {
      document: updatedDoc,
      isReupload: true,
      message: "Document re-uploaded successfully and submitted for review",
    };
  }

  // First time upload case: create new document record
  const newDoc = await docModel.create({
    data: {
      userId,
      documentType: normalizedType,
      documentUrl,
      documentNo: documentNo || null,
      status: "PENDING",
      remark: "Uploaded, pending verification",
    },
  });

  return {
    document: newDoc,
    isReupload: false,
    message: "Document uploaded successfully and submitted for review",
  };
}

/**
 * Get user's document status and remarks.
 */
async function getUserDocumentStatus(userId, documentType) {
  const docModel = getDocumentModel();

  const where = { userId };
  if (documentType) {
    where.documentType = documentType.trim().toUpperCase();
  }

  const documents = await docModel.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return documents;
}

/**
 * Admin updates document status and sets remarks.
 */
async function adminUpdateDocumentStatus(documentId, { status, remark }) {
  const docModel = getDocumentModel();

  const existingDoc = await docModel.findUnique({
    where: { id: documentId },
  });

  if (!existingDoc) {
    throw new Error("Document not found with the provided ID");
  }

  const updatedDoc = await docModel.update({
    where: { id: documentId },
    data: {
      status,
      remark: remark !== undefined ? remark : existingDoc.remark,
    },
  });

  return updatedDoc;
}

/**
 * Admin gets all documents submitted by all users (for review).
 */
async function adminGetAllUserDocuments({ status, page = 1, limit = 20 } = {}) {
  const docModel = getDocumentModel();
  const skip = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;

  const [documents, total] = await Promise.all([
    docModel.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    docModel.count({ where }),
  ]);

  return {
    documents,
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

module.exports = {
  uploadOrReuploadDocument,
  getUserDocumentStatus,
  adminUpdateDocumentStatus,
  adminGetAllUserDocuments,
};
