/**
 * fix-investment-backfill.js
 * 
 * One-time migration script to backfill totalUnits, perUnitPrice, and
 * purchasedUnits on all existing Property records after the schema migration.
 * 
 * Run with: node fix-investment-backfill.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const properties = await prisma.property.findMany();
  console.log(`Found ${properties.length} properties to backfill.`);

  let updated = 0;
  let skipped = 0;

  for (const p of properties) {
    // totalSize may have been stored as a string like "2000 sq ft" before migration
    const areaFloat = typeof p.totalSize === "number"
      ? p.totalSize
      : parseFloat(String(p.totalSize).replace(/[^0-9.]/g, ""));

    if (!areaFloat || areaFloat <= 0) {
      console.warn(`  ⚠  Skipping property "${p.title}" (${p.id}) — invalid totalSize: ${p.totalSize}`);
      skipped++;
      continue;
    }

    const totalUnits   = Math.max(1, Math.floor(p.totalPrice / areaFloat));
    const perUnitPrice = p.totalPrice / totalUnits;

    // Count actually-purchased units from approved + pending investments
    const purchasedUnits = await prisma.investment
      .aggregate({
        where: { propertyId: p.id, status: { in: ["PENDING", "APPROVED"] } },
        _sum:  { units: true },
      })
      .then((r) => r._sum.units || 0);

    await prisma.property.update({
      where: { id: p.id },
      data: {
        totalSize:      areaFloat,
        totalUnits,
        perUnitPrice,
        purchasedUnits,
        minInvestment:  perUnitPrice,
      },
    });

    console.log(`  ✓  "${p.title}" → totalUnits=${totalUnits}, perUnitPrice=₹${perUnitPrice.toFixed(2)}, purchasedUnits=${purchasedUnits}`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
