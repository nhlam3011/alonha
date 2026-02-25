import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany({
        select: { id: true, name: true, slug: true },
        where: { isActive: true },
        take: 1
    });

    if (projects.length === 0) {
        console.log("No projects found.");
        return;
    }

    const proj = projects[0];
    console.log("Using project:", proj);

    // Find a demo user
    const user = await prisma.user.findFirst();
    if (!user) return;

    const listing = await prisma.listing.create({
        data: {
            slug: `test-listing-${Date.now()}`,
            title: "Test Listing for Project",
            description: "Blah",
            listingType: "SALE",
            category: "CAN_HO_CHUNG_CU",
            status: "APPROVED",
            price: 1500000000,
            area: 50,
            contactName: "Admin",
            contactPhone: "0123456789",
            projectId: proj.id,
            ownerId: user.id,
            publishedAt: new Date()
        }
    });

    console.log("Created Listing:", listing);
}

main().catch(console.error).finally(() => prisma.$disconnect());
