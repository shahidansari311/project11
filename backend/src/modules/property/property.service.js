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

module.exports = {
  createProperty,
};
