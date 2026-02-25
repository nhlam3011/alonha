import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    const total = await prisma.listing.count({ where: { status: "APPROVED" } });
    const listings = await prisma.listing.findMany({
        where: { status: "APPROVED" },
        take: 3,
        select: { title: true, address: true, provinceName: true, price: true }
    });

    return NextResponse.json({ total, listings });
}
