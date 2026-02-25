import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    const projects = await prisma.project.findMany({
        select: { id: true, name: true, slug: true, provinceCode: true },
        where: { isActive: true },
        take: 1
    });

    if (projects.length === 0) return NextResponse.json({ error: "No projects found" });
    const proj = projects[0];

    const user = await prisma.user.findFirst();

    // Create dummy
    const listing = await prisma.listing.create({
        data: {
            slug: `test-proj-2-${Date.now()}`,
            title: "Test Listing for " + proj.name,
            description: "Blah",
            listingType: "SALE",
            category: "CAN_HO_CHUNG_CU",
            status: "APPROVED",
            price: 1500000000,
            area: 50,
            contactName: "Admin",
            contactPhone: "0123456789",
            projectId: proj.id,
            ownerId: user?.id || "fallback",
            publishedAt: new Date(),
            provinceCode: proj.provinceCode // Inherit from project
        }
    });

    // Query it back using api/listings logic
    const listingsRes = await prisma.listing.findMany({
        where: { projectId: proj.id, status: "APPROVED" },
        select: { id: true, title: true, projectId: true }
    });

    return NextResponse.json({
        created: listing,
        queriedByProjectId: listingsRes,
        project: proj
    });
}
