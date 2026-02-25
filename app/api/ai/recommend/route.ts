import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toListingCard } from "@/lib/listings";

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");
  const limit = Math.min(Number(searchParams.get("limit")) || 6, 12);

  const where: Record<string, unknown> = { status: "APPROVED", publishedAt: { not: null } };
  if (listingId) where.id = { not: listingId };

  let orderBy: { publishedAt?: "desc" } | { viewCount?: "desc" } = { publishedAt: "desc" };
  if (listingId) {
    const current = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { category: true, listingType: true, provinceCode: true },
    });
    if (current) {
      where.category = current.category;
      where.listingType = current.listingType;
      orderBy = { viewCount: "desc" };
    }
  }

  if (session?.user?.id && listingId) {
    await prisma.userBehavior.create({
      data: { userId: session.user.id, listingId, action: "view" },
    }).catch(() => {});
  }

  const list = await prisma.listing.findMany({
    where,
    orderBy,
    take: limit,
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
    },
  });
  const data = list.map((l) => toListingCard(l));
  return NextResponse.json({ data });
}
