import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const listings = await prisma.listing.findMany({
    where: { status: "APPROVED", publishedAt: { not: null } },
    take: 5,
    select: { title: true, address: true, provinceName: true, price: true }
  })
  console.log(listings)
}
main()
