import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notifyNewLead } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const listingId = body.listingId as string | undefined;
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const message = body.message != null ? String(body.message).trim() : null;

    if (!listingId || !name || !phone) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ thông tin (Họ tên, Số điện thoại)." }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, ownerId: true },
    });
    if (!listing) return NextResponse.json({ error: "Không tìm thấy tin đăng." }, { status: 404 });

    const session = await auth();
    const customerId = session?.user?.id ?? null;

    const lead = await prisma.lead.create({
      data: {
        listingId: listing.id,
        agentId: listing.ownerId,
        customerId,
        name: name.slice(0, 200),
        phone: phone.slice(0, 20),
        email: body.email ? String(body.email).slice(0, 200) : null,
        message: message?.slice(0, 1000) ?? null,
        source: "detail_page",
      },
    });

    // Gửi thông báo cho môi giới
    await notifyNewLead(lead.id, name, listing.id, listing.ownerId);

    return NextResponse.json({ id: lead.id, ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gửi yêu cầu thất bại." }, { status: 500 });
  }
}
