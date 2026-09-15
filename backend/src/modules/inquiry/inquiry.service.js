const prisma = require("../../config/db");

/**
 * Create a new inquiry (Public endpoint)
 */
async function createInquiry(data) {
  const { firstName, lastName, email, areaOfInterest, message } = data;

  const inquiry = await prisma.contactInquiry.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      areaOfInterest: areaOfInterest.trim(),
      message: message.trim(),
      status: "NEW",
    },
  });

  return inquiry;
}

/**
 * Get all inquiries with pagination, searching, and status filtering (Admin)
 */
async function getAllInquiries({ page = 1, limit = 10, search = "", status = "" }) {
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = (pageNumber - 1) * pageSize;

  const where = {};

  if (status && ["NEW", "CONTACTED", "RESOLVED"].includes(status.toUpperCase())) {
    where.status = status.toUpperCase();
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { firstName: { contains: term, mode: "insensitive" } },
      { lastName: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { areaOfInterest: { contains: term, mode: "insensitive" } },
      { message: { contains: term, mode: "insensitive" } },
    ];
  }

  const [inquiries, totalFiltered, totalAll, newCount, contactedCount, resolvedCount] =
    await Promise.all([
      prisma.contactInquiry.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.contactInquiry.count({ where }),
      prisma.contactInquiry.count(),
      prisma.contactInquiry.count({ where: { status: "NEW" } }),
      prisma.contactInquiry.count({ where: { status: "CONTACTED" } }),
      prisma.contactInquiry.count({ where: { status: "RESOLVED" } }),
    ]);

  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;

  return {
    inquiries,
    pagination: {
      total: totalFiltered,
      page: pageNumber,
      limit: pageSize,
      totalPages,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    },
    stats: {
      total: totalAll,
      new: newCount,
      contacted: contactedCount,
      resolved: resolvedCount,
    },
  };
}

/**
 * Get inquiry by ID (Admin)
 */
async function getInquiryById(id) {
  const inquiry = await prisma.contactInquiry.findUnique({
    where: { id },
  });

  if (!inquiry) {
    const error = new Error("Inquiry not found");
    error.statusCode = 404;
    throw error;
  }

  return inquiry;
}

/**
 * Update inquiry status (Admin)
 */
async function updateInquiryStatus(id, status) {
  const existing = await prisma.contactInquiry.findUnique({
    where: { id },
  });

  if (!existing) {
    const error = new Error("Inquiry not found");
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.contactInquiry.update({
    where: { id },
    data: { status },
  });

  return updated;
}

/**
 * Delete inquiry (Admin)
 */
async function deleteInquiry(id) {
  const existing = await prisma.contactInquiry.findUnique({
    where: { id },
  });

  if (!existing) {
    const error = new Error("Inquiry not found");
    error.statusCode = 404;
    throw error;
  }

  await prisma.contactInquiry.delete({
    where: { id },
  });

  return { id };
}

module.exports = {
  createInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry,
};
