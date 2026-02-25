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

function parseOptionalNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

async function buildUniqueSlug(name: string, requestedSlug?: string | null, ignoreId?: string) {
  const base = slugify(requestedSlug || name) || `du-an-${Date.now().toString(36)}`;
  let candidate = base;
  let counter = 1;
  while (true) {
    const existing = await prisma.project.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === ignoreId) return candidate;
    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

export async function GET() {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { listings: true } } },
  });

  return NextResponse.json({
    data: projects.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      listingCount: p._count.listings,
    })),
  });
}

export async function POST(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = normalizeText(body.name);
  if (!name) return NextResponse.json({ error: "Tên dự án là bắt buộc" }, { status: 400 });

  const slug = await buildUniqueSlug(name, normalizeText(body.slug));
  const created = await prisma.project.create({
    data: {
      name,
      slug,
      address: normalizeText(body.address),
      description: normalizeText(body.description),
      developer: normalizeText(body.developer),
      imageUrl: normalizeText(body.imageUrl),
      totalArea: parseOptionalNumber(body.totalArea),
      provinceCode: normalizeText(body.provinceCode),
      provinceName: normalizeText(body.provinceName),
      districtCode: normalizeText(body.districtCode),
      districtName: normalizeText(body.districtName),
      wardCode: normalizeText(body.wardCode),
      wardName: normalizeText(body.wardName),
      isActive: typeof body.isActive === "boolean" ? body.isActive : true,
    },
  });

  return NextResponse.json({
    data: {
      ...created,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      listingCount: 0,
    },
  });
}

export async function PATCH(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = normalizeText(body.id);
  if (!id) return NextResponse.json({ error: "Thiếu ID dự án" }, { status: 400 });

  const existing = await prisma.project.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy dự án" }, { status: 404 });

  const data: Prisma.ProjectUpdateInput = {};
  if ("name" in body) {
    const name = normalizeText(body.name);
    if (!name) return NextResponse.json({ error: "Tên dự án không hợp lệ" }, { status: 400 });
    data.name = name;
  }
  if ("slug" in body || ("name" in body && !("slug" in body))) {
    const slug = await buildUniqueSlug(
      normalizeText(body.name) || existing.name,
      normalizeText(body.slug),
      existing.id
    );
    data.slug = slug;
  }
  if ("address" in body) data.address = normalizeText(body.address);
  if ("description" in body) data.description = normalizeText(body.description);
  if ("developer" in body) data.developer = normalizeText(body.developer);
  if ("imageUrl" in body) data.imageUrl = normalizeText(body.imageUrl);
  if ("isActive" in body && typeof body.isActive === "boolean") data.isActive = body.isActive;
  if ("totalArea" in body) {
    data.totalArea = parseOptionalNumber(body.totalArea);
  }
  if ("provinceCode" in body) data.provinceCode = normalizeText(body.provinceCode);
  if ("provinceName" in body) data.provinceName = normalizeText(body.provinceName);
  if ("districtCode" in body) data.districtCode = normalizeText(body.districtCode);
  if ("districtName" in body) data.districtName = normalizeText(body.districtName);
  if ("wardCode" in body) data.wardCode = normalizeText(body.wardCode);
  if ("wardName" in body) data.wardName = normalizeText(body.wardName);

  const updated = await prisma.project.update({
    where: { id: existing.id },
    data,
    include: { _count: { select: { listings: true } } },
  });

  return NextResponse.json({
    data: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      listingCount: updated._count.listings,
    },
  });
}

export async function DELETE(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { id?: string };
  const id = body.id?.trim();
  if (!id) return NextResponse.json({ error: "Thiếu ID dự án" }, { status: 400 });

  const linkedListingCount = await prisma.listing.count({ where: { projectId: id } });
  if (linkedListingCount > 0) {
    return NextResponse.json(
      { error: `Dự án đang được dùng bởi ${linkedListingCount} tin đăng, không thể xóa.` },
      { status: 400 }
    );
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
