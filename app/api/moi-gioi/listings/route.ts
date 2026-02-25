import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });
  }
  const list = await prisma.listing.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, title: true, status: true, viewCount: true, createdAt: true },
  });
  const data = list.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }));
  return NextResponse.json({ data });
}
