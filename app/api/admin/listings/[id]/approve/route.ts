import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyListingApproved } from "@/lib/notifications";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const existing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, title: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy tin đăng." }, { status: 404 });
  }
  if (existing.status === "DRAFT") {
    return NextResponse.json(
      { error: "Tin nháp là dữ liệu riêng của người đăng, không thuộc luồng duyệt admin." },
      { status: 400 },
    );
  }
  await prisma.listing.update({
    where: { id },
    data: { status: "APPROVED", publishedAt: new Date() },
  });

  // Gửi thông báo cho người đăng
  await notifyListingApproved(id, existing.title);

  return NextResponse.json({ ok: true });
}
