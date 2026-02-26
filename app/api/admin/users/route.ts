import { NextResponse } from "next/server";
import type { Prisma, UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROLES: UserRole[] = ["USER", "AGENT", "ADMIN"];

function isValidRole(role: string | null): role is UserRole {
  return !!role && ROLES.includes(role as UserRole);
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
  const role = searchParams.get("role");
  const locked = searchParams.get("locked");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));

  const where: Prisma.UserWhereInput = {};
  if (keyword) {
    where.OR = [
      { email: { contains: keyword, mode: "insensitive" } },
      { name: { contains: keyword, mode: "insensitive" } },
      { phone: { contains: keyword } },
    ];
  }
  if (isValidRole(role)) {
    where.role = role;
  }
  if (locked === "1") where.isLocked = true;
  if (locked === "0") where.isLocked = false;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isLocked: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    data: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
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
    role?: string;
    isLocked?: boolean;
  };
  const id = body.id?.trim();
  if (!id) return NextResponse.json({ error: "Thiếu ID người dùng" }, { status: 400 });

  const data: Prisma.UserUpdateInput = {};
  if (body.role != null) {
    if (!isValidRole(body.role)) {
      return NextResponse.json({ error: "Vai trò không hợp lệ" }, { status: 400 });
    }
    if (id === session.user.id && body.role !== "ADMIN") {
      return NextResponse.json({ error: "Không thể tự hạ quyền ADMIN" }, { status: 400 });
    }
    data.role = body.role;
  }
  if (typeof body.isLocked === "boolean") {
    if (id === session.user.id && body.isLocked) {
      return NextResponse.json({ error: "Không thể tự khóa tài khoản" }, { status: 400 });
    }
    data.isLocked = body.isLocked;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Không có dữ liệu cập nhật" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isLocked: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    data: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      lastLoginAt: updated.lastLoginAt ? updated.lastLoginAt.toISOString() : null,
    },
  });
}
