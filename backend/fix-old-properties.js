require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOldProperties() {
  console.log("🔍 Scanning for old properties without a price history...");
  
  const properties = await prisma.property.findMany({
    include: {
      priceHistory: true
    }
  });

  let fixedCount = 0;

  for (const property of properties) {
    if (property.priceHistory.length === 0) {
      await prisma.propertyPriceHistory.create({
        data: {
          propertyId: property.id,
          price: property.totalPrice,
          date: property.createdAt, // We use the exact date the property was originally created!
        }
      });
      fixedCount++;
      console.log(`✅ Fixed property: "${property.title}" (Added initial price: ${property.totalPrice})`);
    }
  }

  console.log(`\n🎉 All done! Fixed ${fixedCount} old properties.`);
  process.exit(0);
}

fixOldProperties().catch(e => {
  console.error("❌ An error occurred:", e);
  process.exit(1);
});
