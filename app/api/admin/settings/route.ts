import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ensureAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

const KEY_REGEX = /^[a-zA-Z0-9_.-]{2,80}$/;

export async function GET() {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const list = await prisma.systemConfig.findMany({
    orderBy: { key: "asc" },
  });
  return NextResponse.json({
    data: list,
  });
}

export async function PUT(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    key?: string;
    value?: string | null;
    type?: string;
  };
  const key = normalizeText(body.key);
  if (!key || !KEY_REGEX.test(key)) {
    return NextResponse.json(
      { error: "Key không hợp lệ (2-80 ký tự, chỉ gồm chữ/số/._-)." },
      { status: 400 }
    );
  }
  const type = normalizeText(body.type) ?? "string";
  if (!["string", "json", "number"].includes(type)) {
    return NextResponse.json({ error: "type phải là string/json/number" }, { status: 400 });
  }

  const value = body.value == null ? null : String(body.value);
  const data = await prisma.systemConfig.upsert({
    where: { key },
    update: {
      value,
      type,
    },
    create: {
      key,
      value,
      type,
    },
  });

  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { key?: string };
  const key = normalizeText(body.key);
  if (!key) return NextResponse.json({ error: "Thiếu key cần xóa" }, { status: 400 });

  await prisma.systemConfig.delete({ where: { key } });
  return NextResponse.json({ ok: true });
}
