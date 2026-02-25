import { NextResponse } from "next/server";
import type { ListingStatus, Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUSES: ListingStatus[] = ["PENDING", "APPROVED", "REJECTED", "EXPIRED", "HIDDEN"];
const MUTABLE_STATUSES: ListingStatus[] = ["PENDING", "APPROVED", "REJECTED", "HIDDEN", "EXPIRED"];

function isValidStatus(status: string | null | undefined): status is ListingStatus {
  return !!status && STATUSES.includes(status as ListingStatus);
}

async function ensureAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword")?.trim() ?? "";
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));

  const where: Prisma.ListingWhereInput = {
    status: { not: "DRAFT" },
  };
  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { slug: { contains: keyword, mode: "insensitive" } },
      { owner: { email: { contains: keyword, mode: "insensitive" } } },
      { owner: { name: { contains: keyword, mode: "insensitive" } } },
    ];
  }
  if (isValidStatus(status)) {
    where.status = status;
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        price: true,
        viewCount: true,
        createdAt: true,
        publishedAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  return NextResponse.json({
    data: listings.map((l) => ({
      ...l,
      price: Number(l.price),
      createdAt: l.createdAt.toISOString(),
      publishedAt: l.publishedAt ? l.publishedAt.toISOString() : null,
    })),
    total,
    page,
    limit,
  });
}

export async function PATCH(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    status?: string;
  };
  const id = body.id?.trim();
  if (!id) return NextResponse.json({ error: "Thiếu ID tin đăng" }, { status: 400 });
  if (!isValidStatus(body.status) || !MUTABLE_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Trạng thái cập nhật không hợp lệ" }, { status: 400 });
  }

  const existing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, status: true, publishedAt: true },
  });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy tin đăng" }, { status: 404 });
  if (existing.status === "DRAFT") {
    return NextResponse.json(
      { error: "Tin nháp là dữ liệu riêng của người đăng, không thuộc luồng duyệt admin." },
      { status: 400 },
    );
  }

  const data: Prisma.ListingUpdateInput = { status: body.status };
  if (body.status === "APPROVED" && !existing.publishedAt) {
    data.publishedAt = new Date();
  }
  if (body.status === "PENDING" || body.status === "REJECTED") {
    data.publishedAt = null;
  }

  const updated = await prisma.listing.update({
    where: { id },
    data,
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      publishedAt: true,
    },
  });

  return NextResponse.json({
    data: {
      ...updated,
      publishedAt: updated.publishedAt ? updated.publishedAt.toISOString() : null,
    },
  });
}

export async function DELETE(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { id?: string };
  const id = body.id?.trim();
  if (!id) return NextResponse.json({ error: "Thiếu ID tin đăng" }, { status: 400 });

  const existing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy tin đăng" }, { status: 404 });

  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
