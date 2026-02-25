import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    // Check if it's a fallback province-based project
    // Check for project ID format or existence if needed, but remove the province logic
    if (slug.startsWith("province-")) {
        return NextResponse.json(
            { error: "Dự án không tồn tại" },
            { status: 404 }
        );
    }

    // Get actual project from database
    const project = await prisma.project.findUnique({
        where: { slug },
        include: {
            _count: { select: { listings: true } },
        },
    });

    if (!project) {
        return NextResponse.json(
            { error: "Không tìm thấy dự án" },
            { status: 404 }
        );
    }

    return NextResponse.json({
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        address: project.address,
        developer: project.developer,
        totalArea: project.totalArea,
        imageUrl: project.imageUrl,
        isActive: project.isActive,
        listingCount: project._count.listings,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
    });
}
