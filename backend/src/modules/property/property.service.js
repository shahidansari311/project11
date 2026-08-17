const prisma = require("../../config/db");

/**
 * Create a new property listing.
 * Called by admin only.
 */
async function createProperty({
  title,
  description,
  images,
  location,
  status,
  targetReturn,
  minInvestment,
  totalPrice,
  totalSize,
  category,
}) {
  const property = await prisma.property.create({
    data: {
      title,
      description,
      images,       // String[] — array of image URLs
      location,
      status:       status ?? "AVAILABLE",
      targetReturn,
      minInvestment,
      investors:    0,  // always starts at 0
      totalPrice,
      totalSize,
      category,
    },
  });

  return property;
}

async function updateProperty(id, data) {
  const existingProperty = await prisma.property.findUnique({ where: { id } });
  if (!existingProperty) {
    throw new Error("Property not found with the provided ID");
  }

  const updatedProperty = await prisma.property.update({
    where: { id },
    data,
  });

  return updatedProperty;
}

async function deleteProperty(id) {
  const existingProperty = await prisma.property.findUnique({ where: { id } });
  if (!existingProperty) {
    throw new Error("Property not found with the provided ID");
  }

  await prisma.property.delete({ where: { id } });

  return { success: true, message: "Property deleted successfully" };
}

module.exports = {
  createProperty,
  updateProperty,
  deleteProperty,
};
