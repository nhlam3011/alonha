import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    const listingsWithProject = await prisma.listing.findMany({
        where: { projectId: { not: null } },
        select: { id: true, title: true, projectId: true, status: true },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    return NextResponse.json({ listingsWithProject });
}
