import { NextResponse } from "next/server";
import type { AppointmentStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["AGENT", "ADMIN"];
const APPOINTMENT_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

async function ensureAgent() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = session.user.role as string;
  if (!role || !ALLOWED.includes(role)) return null;
  return session;
}

function isValidStatus(status: string | undefined): status is AppointmentStatus {
  return !!status && APPOINTMENT_STATUSES.includes(status as AppointmentStatus);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await ensureAgent();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  if (!isValidStatus(body.status)) {
    return NextResponse.json({ error: "Trạng thái lịch hẹn không hợp lệ." }, { status: 400 });
  }

  const appointment = await prisma.viewingAppointment.findFirst({
    where: { id, agentId: session.user.id },
    select: { id: true },
  });
  if (!appointment) return NextResponse.json({ error: "Không tìm thấy lịch hẹn." }, { status: 404 });

  const updated = await prisma.viewingAppointment.update({
    where: { id: appointment.id },
    data: { status: body.status },
    select: { id: true, status: true, updatedAt: true },
  });

  return NextResponse.json({
    data: {
      ...updated,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}
