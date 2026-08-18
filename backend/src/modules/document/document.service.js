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
async function uploadOrReuploadDocument(userId, { documentType = "AADHAAR", frontImageUrl, backImageUrl, documentUrl }) {
  const docModel = getDocumentModel();
  const normalizedType = (documentType || "AADHAAR").trim().toUpperCase();
  const primaryUrl = frontImageUrl || documentUrl;
  const backUrl = backImageUrl || null;

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
        documentType: normalizedType,
        frontImageUrl: primaryUrl,
        backImageUrl: backUrl,
        documentUrl: primaryUrl,
        status: "PENDING",
        remark: null,
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
      frontImageUrl: primaryUrl,
      backImageUrl: backUrl,
      documentUrl: primaryUrl,
      status: "PENDING",
      remark: null,
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

function formatUserDocumentOverview(user) {
  const docs = user.documents || [];
  const aadhaarDoc = docs.find((d) => (d.documentType || "").toUpperCase() === "AADHAAR");
  const panDoc = docs.find((d) => (d.documentType || "").toUpperCase() === "PAN");

  const isAadhaarApproved = aadhaarDoc?.status === "APPROVED";
  const isPanApproved = panDoc?.status === "APPROVED";

  // Verification status logic:
  // - VERIFIED: Both Aadhaar & PAN are approved
  // - UNVERIFIED: Uploaded at least one document, but not both are approved yet
  // - NOT_UPLOADED: User has not uploaded any document yet
  let verificationStatus = "NOT_UPLOADED";
  if (isAadhaarApproved && isPanApproved) {
    verificationStatus = "VERIFIED";
  } else if (docs.length > 0) {
    verificationStatus = "UNVERIFIED";
  } else {
    verificationStatus = "NOT_UPLOADED";
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    profileUrl: user.profileUrl,
    createdAt: user.createdAt,
    verificationStatus,
    documents: {
      aadhaar: aadhaarDoc
        ? {
            id: aadhaarDoc.id,
            status: aadhaarDoc.status,
            remark: aadhaarDoc.remark,
            frontImageUrl: aadhaarDoc.frontImageUrl,
            backImageUrl: aadhaarDoc.backImageUrl,
            isUploadedByAdmin: aadhaarDoc.isUploadedByAdmin,
            createdAt: aadhaarDoc.createdAt,
            updatedAt: aadhaarDoc.updatedAt,
          }
        : {
            id: null,
            status: "NOT_UPLOADED",
            remark: null,
            frontImageUrl: null,
            backImageUrl: null,
            isUploadedByAdmin: false,
            createdAt: null,
            updatedAt: null,
          },
      pan: panDoc
        ? {
            id: panDoc.id,
            status: panDoc.status,
            remark: panDoc.remark,
            frontImageUrl: panDoc.frontImageUrl,
            backImageUrl: panDoc.backImageUrl,
            isUploadedByAdmin: panDoc.isUploadedByAdmin,
            createdAt: panDoc.createdAt,
            updatedAt: panDoc.updatedAt,
          }
        : {
            id: null,
            status: "NOT_UPLOADED",
            remark: null,
            frontImageUrl: null,
            backImageUrl: null,
            isUploadedByAdmin: false,
            createdAt: null,
            updatedAt: null,
          },
    },
  };
}

/**
 * Admin: Get all users with their document status overview (uploaded vs pending/not uploaded).
 * Supports search by name/email/phone and filtering by verificationStatus (VERIFIED, UNVERIFIED, NOT_UPLOADED).
 */
async function adminGetAllUsersDocumentsOverview({
  page = 1,
  limit = 20,
  search = "",
  status,
  documentType,
  verificationStatus,
} = {}) {
  const skip = (page - 1) * limit;

  const where = {};
  const andConditions = [];

  if (search && search.trim()) {
    andConditions.push({
      OR: [
        { fullName: { contains: search.trim(), mode: "insensitive" } },
        { email: { contains: search.trim(), mode: "insensitive" } },
        { phone: { contains: search.trim(), mode: "insensitive" } },
      ],
    });
  }

  // Handle verificationStatus filter:
  // - VERIFIED: Both Aadhaar & PAN are approved
  // - UNVERIFIED: User has uploaded document(s), but not fully approved yet
  // - NOT_UPLOADED: User has not uploaded any document
  const normVerifStatus = (verificationStatus || status || "").trim().toUpperCase();

  if (
    normVerifStatus === "VERIFIED" ||
    normVerifStatus === "FULLY_VERIFIED" ||
    normVerifStatus === "FULL"
  ) {
    andConditions.push({ documents: { some: { documentType: "AADHAAR", status: "APPROVED" } } });
    andConditions.push({ documents: { some: { documentType: "PAN", status: "APPROVED" } } });
  } else if (
    normVerifStatus === "UNVERIFIED" ||
    normVerifStatus === "NOT_VERIFIED" ||
    normVerifStatus === "PENDING"
  ) {
    // Must have at least 1 document uploaded
    andConditions.push({
      documents: {
        some: {},
      },
    });
    // AND NOT both approved
    andConditions.push({
      NOT: {
        AND: [
          { documents: { some: { documentType: "AADHAAR", status: "APPROVED" } } },
          { documents: { some: { documentType: "PAN", status: "APPROVED" } } },
        ],
      },
    });
  } else if (
    normVerifStatus === "NOT_UPLOADED" ||
    normVerifStatus === "NONE"
  ) {
    // User has 0 uploaded documents
    andConditions.push({
      documents: {
        none: {},
      },
    });
  } else if (status && status.trim()) {
    const docWhere = { status: status.trim().toUpperCase() };
    if (documentType && documentType.trim()) {
      docWhere.documentType = documentType.trim().toUpperCase();
    }
    andConditions.push({
      documents: {
        some: docWhere,
      },
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        profileUrl: true,
        createdAt: true,
        documents: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const formattedUsers = users.map(formatUserDocumentOverview);

  return {
    users: formattedUsers,
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

/**
 * Admin: Get specific user's documents by user ID.
 */
async function adminGetUserDocumentsById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      profileUrl: true,
      createdAt: true,
      documents: true,
    },
  });

  if (!user) {
    throw new Error("User not found with the provided ID");
  }

  return formatUserDocumentOverview(user);
}

/**
 * Admin: Verify document (approve, reject, or request re-upload with optional remark).
 */
async function adminVerifyDocument(documentId, { status, remark }) {
  const docModel = getDocumentModel();

  const existingDoc = await docModel.findUnique({
    where: { id: documentId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
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
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return updatedDoc;
}

/**
 * Admin: Upload document for a specific user (Automatically verified/approved, isUploadedByAdmin = true).
 */
async function adminUploadUserDocument(userId, { documentType = "AADHAAR", frontImageUrl, backImageUrl, documentUrl, remark }) {
  const docModel = getDocumentModel();
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error("User not found with the provided ID");
  }

  const normalizedType = (documentType || "AADHAAR").trim().toUpperCase();
  const primaryUrl = frontImageUrl || documentUrl;
  const backUrl = backImageUrl || null;

  const existingDoc = await docModel.findFirst({
    where: {
      userId,
      documentType: normalizedType,
    },
  });

  if (existingDoc) {
    const updatedDoc = await docModel.update({
      where: { id: existingDoc.id },
      data: {
        documentType: normalizedType,
        frontImageUrl: primaryUrl,
        backImageUrl: backUrl,
        documentUrl: primaryUrl,
        status: "APPROVED", // Auto-approved when admin uploads
        isUploadedByAdmin: true,
        remark: remark || null,
      },
    });

    return {
      document: updatedDoc,
      isReupload: true,
      message: "Document uploaded and verified by Admin successfully",
    };
  }

  const newDoc = await docModel.create({
    data: {
      userId,
      documentType: normalizedType,
      frontImageUrl: primaryUrl,
      backImageUrl: backUrl,
      documentUrl: primaryUrl,
      status: "APPROVED", // Auto-approved when admin uploads
      isUploadedByAdmin: true,
      remark: remark || null,
    },
  });

  return {
    document: newDoc,
    isReupload: false,
    message: "Document uploaded and verified by Admin successfully",
  };
}

module.exports = {
  uploadOrReuploadDocument,
  getUserDocumentStatus,
  adminGetAllUsersDocumentsOverview,
  adminGetUserDocumentsById,
  adminVerifyDocument,
  adminUploadUserDocument,
};
