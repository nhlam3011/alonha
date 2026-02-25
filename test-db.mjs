import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            provinceCode: true
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
    });
    console.log("Projects:", JSON.stringify(projects, null, 2));

    const listings = await prisma.listing.findMany({
        select: {
            id: true,
            title: true,
            projectId: true,
            status: true
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
    });
    console.log("Listings:", JSON.stringify(listings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
