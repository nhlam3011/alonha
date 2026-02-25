import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });
  const list = await prisma.viewingAppointment.findMany({
    where: { userId: session.user.id },
    orderBy: { schedule: "desc" },
    include: { listing: { select: { title: true, slug: true } } },
  });
  const data = list.map((a) => ({
    id: a.id,
    listingId: a.listingId,
    listingTitle: a.listing?.title,
    listingSlug: a.listing?.slug,
    scheduledAt: a.schedule.toISOString(),
    status: a.status,
    note: a.note,
  }));
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { listingId, fullName, phone, email, note, schedule } = body;
  if (!listingId || !fullName || !phone || !schedule) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing) return NextResponse.json({ error: "Tin không tồn tại" }, { status: 404 });
  await prisma.viewingAppointment.create({
    data: {
      listingId,
      userId: session.user.id,
      agentId: listing.ownerId,
      fullName: String(fullName).slice(0, 200),
      phone: String(phone).slice(0, 20),
      email: email ? String(email).slice(0, 200) : null,
      note: note ? String(note).slice(0, 500) : null,
      schedule: new Date(schedule),
    },
  });
  return NextResponse.json({ ok: true });
}
