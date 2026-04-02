import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.listing.findMany({
    where: { category: "NHA_RIENG" },
    select: { title: true, price: true, status: true, publishedAt: true }
  });
  console.log(JSON.stringify(listings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
