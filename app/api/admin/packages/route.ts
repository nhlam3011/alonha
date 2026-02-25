import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/listings";

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

function normalizeCode(code: string) {
  return code.toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

function parseNonNegativeInt(value: unknown, fallback: number): number {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function parsePositiveIntOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.floor(n));
}

export async function GET() {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await prisma.servicePackage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { listingServices: true } } },
  });

  return NextResponse.json({
    data: data.map((item) => ({
      ...item,
      price: Number(item.price),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      usageCount: item._count.listingServices,
    })),
  });
}

export async function POST(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = normalizeText(body.name);
  if (!name) return NextResponse.json({ error: "Tên gói là bắt buộc" }, { status: 400 });

  const requestedCode = normalizeText(body.code);
  const code = normalizeCode(requestedCode ?? slugify(name).replace(/-/g, "_"));
  if (!code) return NextResponse.json({ error: "Mã gói không hợp lệ" }, { status: 400 });

  const existing = await prisma.servicePackage.findUnique({ where: { code }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "Mã gói đã tồn tại" }, { status: 409 });

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Giá gói không hợp lệ" }, { status: 400 });
  }

  const created = await prisma.servicePackage.create({
    data: {
      code,
      name,
      description: normalizeText(body.description),
      price,
      durationDays: parsePositiveIntOrNull(body.durationDays),
      sortOrder: parseNonNegativeInt(body.sortOrder, 0),
      isActive: typeof body.isActive === "boolean" ? body.isActive : true,
    },
  });

  return NextResponse.json({
    data: {
      ...created,
      price: Number(created.price),
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      usageCount: 0,
    },
  });
}

export async function PATCH(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = normalizeText(body.id);
  if (!id) return NextResponse.json({ error: "Thiếu ID gói" }, { status: 400 });

  const existing = await prisma.servicePackage.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy gói" }, { status: 404 });

  const data: Prisma.ServicePackageUpdateInput = {};
  if ("name" in body) {
    const name = normalizeText(body.name);
    if (!name) return NextResponse.json({ error: "Tên gói không hợp lệ" }, { status: 400 });
    data.name = name;
  }
  if ("description" in body) data.description = normalizeText(body.description);
  if ("code" in body) {
    const code = normalizeCode(normalizeText(body.code) || "");
    if (!code) return NextResponse.json({ error: "Mã gói không hợp lệ" }, { status: 400 });
    const duplicate = await prisma.servicePackage.findUnique({ where: { code }, select: { id: true } });
    if (duplicate && duplicate.id !== existing.id) {
      return NextResponse.json({ error: "Mã gói đã tồn tại" }, { status: 409 });
    }
    data.code = code;
  }
  if ("price" in body) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Giá gói không hợp lệ" }, { status: 400 });
    }
    data.price = price;
  }
  if ("durationDays" in body) {
    data.durationDays = parsePositiveIntOrNull(body.durationDays);
  }
  if ("sortOrder" in body) {
    data.sortOrder = parseNonNegativeInt(body.sortOrder, 0);
  }
  if ("isActive" in body && typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Không có dữ liệu cập nhật" }, { status: 400 });
  }

  const updated = await prisma.servicePackage.update({
    where: { id: existing.id },
    data,
    include: { _count: { select: { listingServices: true } } },
  });

  return NextResponse.json({
    data: {
      ...updated,
      price: Number(updated.price),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      usageCount: updated._count.listingServices,
    },
  });
}

export async function DELETE(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { id?: string };
  const id = body.id?.trim();
  if (!id) return NextResponse.json({ error: "Thiếu ID gói" }, { status: 400 });

  const usageCount = await prisma.listingService.count({ where: { servicePackageId: id } });
  if (usageCount > 0) {
    return NextResponse.json(
      { error: `Gói đã được áp dụng ${usageCount} lần, không thể xóa.` },
      { status: 400 }
    );
  }

  await prisma.servicePackage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
