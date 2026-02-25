import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });
  }
  const list = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      listing: {
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
        },
      },
    },
  });
  const { toListingCard } = await import("@/lib/listings");
  const data = list.map((f) => toListingCard(f.listing));
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });
  }
  const { listingId } = await req.json().catch(() => ({}));
  if (!listingId) return NextResponse.json({ error: "Thiếu listingId" }, { status: 400 });
  await prisma.favorite.upsert({
    where: {
      userId_listingId: { userId: session.user.id, listingId },
    },
    create: { userId: session.user.id, listingId },
    update: {},
  });
  await prisma.listing.update({
    where: { id: listingId },
    data: { saveCount: { increment: 1 } },
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "Thiếu listingId" }, { status: 400 });
  await prisma.favorite.deleteMany({
    where: { userId: session.user.id, listingId },
  });
  await prisma.listing.update({
    where: { id: listingId },
    data: { saveCount: { decrement: 1 } },
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}
