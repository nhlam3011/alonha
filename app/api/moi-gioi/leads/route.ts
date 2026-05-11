import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["AGENT", "ADMIN"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as string;
  if (!role || !ALLOWED.includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const list = await prisma.lead.findMany({
    where: { agentId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      source: true,
      isRead: true,
      createdAt: true,
      customerId: true,
      listing: { select: { title: true, slug: true } },
    },
  });

  const data = await Promise.all(list.map(async (l) => {
    let unreadCount = 0;
    if (l.customerId) {
      unreadCount = await prisma.chatMessage.count({
        where: {
          conversation: {
            OR: [
              { user1Id: l.customerId, user2Id: session.user.id },
              { user1Id: session.user.id, user2Id: l.customerId }
            ]
          },
          senderId: l.customerId,
          readAt: null
        }
      });
    }

    return {
      id: l.id,
      name: l.name,
      phone: l.phone,
      email: l.email,
      source: l.source || "Liên hệ",
      isRead: l.isRead,
      status: l.isRead ? "Đã xem" : "Mới",
      createdAt: l.createdAt.toISOString(),
      listingTitle: l.listing?.title,
      listingSlug: l.listing?.slug,
      customerId: l.customerId,
      unreadCount
    };
  }));

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as string;
  if (!role || !ALLOWED.includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    listingId?: string;
    name?: string;
    phone?: string;
    email?: string;
    message?: string;
  };
  const listingId = body.listingId?.trim();
  const name = body.name?.trim();
  const phone = body.phone?.trim();

  if (!listingId || !name || !phone) {
    return NextResponse.json(
      { error: "Thiếu thông tin bắt buộc (listingId, name, phone)." },
      { status: 400 }
    );
  }

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, ownerId: session.user.id },
    select: { id: true, title: true, slug: true },
  });
  if (!listing) return NextResponse.json({ error: "Tin đăng không tồn tại hoặc không thuộc bạn." }, { status: 404 });

  const lead = await prisma.lead.create({
    data: {
      listingId: listing.id,
      agentId: session.user.id,
      name: name.slice(0, 200),
      phone: phone.slice(0, 20),
      email: body.email?.trim() ? body.email.trim().slice(0, 200) : null,
      message: body.message?.trim() ? body.message.trim().slice(0, 1000) : null,
      source: "manual_crm",
      isRead: true,
    },
  });

  return NextResponse.json({
    data: {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      source: lead.source || "CRM",
      status: lead.isRead ? "Đã xem" : "Mới",
      createdAt: lead.createdAt.toISOString(),
      listingTitle: listing.title,
      listingSlug: listing.slug,
      customerId: lead.customerId,
    },
  });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const lead = await prisma.lead.findUnique({
    where: { id },
  });

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (lead.agentId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.lead.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Lead deleted successfully" });
}
