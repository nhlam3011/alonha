import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["AGENT", "BUSINESS", "ADMIN"];

async function ensureAgent() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = session.user.role as string;
  if (!role || !ALLOWED.includes(role)) return null;
  return session;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await ensureAgent();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { isRead?: boolean };
  if (typeof body.isRead !== "boolean") {
    return NextResponse.json({ error: "Trường isRead phải là boolean." }, { status: 400 });
  }

  const lead = await prisma.lead.findFirst({
    where: { id, agentId: session.user.id },
    select: { id: true },
  });
  if (!lead) return NextResponse.json({ error: "Không tìm thấy lead." }, { status: 404 });

  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: { isRead: body.isRead },
    select: { id: true, isRead: true },
  });
  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await ensureAgent();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id, agentId: session.user.id },
    select: { id: true },
  });
  if (!lead) return NextResponse.json({ error: "Không tìm thấy lead." }, { status: 404 });

  await prisma.lead.delete({ where: { id: lead.id } });
  return NextResponse.json({ ok: true });
}
