import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["AGENT", "ADMIN"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as string;
  if (!role || !ALLOWED.includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const list = await prisma.viewingAppointment.findMany({
    where: { agentId: session.user.id },
    orderBy: { schedule: "desc" },
    include: {
      listing: { select: { id: true, title: true, slug: true } },
      user: { select: { name: true, email: true } },
    },
  });

  const data = list.map((a) => ({
    id: a.id,
    listingId: a.listingId,
    listingTitle: a.listing?.title,
    listingSlug: a.listing?.slug,
    customerName: a.fullName,
    customerPhone: a.phone,
    scheduledAt: a.schedule.toISOString(),
    status: a.status,
    note: a.note,
  }));

  return NextResponse.json({ data });
}
