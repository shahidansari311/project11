const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Investment" ADD COLUMN "paymentHistory" JSONB NOT NULL DEFAULT '[]'::jsonb;`);
    console.log("Added paymentHistory");
  } catch (e) { console.log(e.message); }
  
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Investment" ADD COLUMN "invoices" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];`);
    console.log("Added invoices");
  } catch (e) { console.log(e.message); }
  
  console.log("Done");
}
main().catch(console.error).finally(() => prisma.$disconnect());
