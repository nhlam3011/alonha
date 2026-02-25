const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const c = await prisma.listing.count({ where: { status: "APPROVED" } });
  console.log("Approved listings:", c);
  const l = await prisma.listing.findMany({ where: { status: "APPROVED" }, take: 2, select: { title: true, address: true, provinceName: true, price: true } });
  console.log(l);
}
run();
