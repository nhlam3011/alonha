import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, phone: true, avatar: true, role: true, passwordHash: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Không trả passwordHash ra ngoài
  const { passwordHash, ...rest } = user;
  return NextResponse.json({ ...rest, hasPassword: !!passwordHash });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });

  // Kiểm tra phone trùng
  if (parsed.data.phone) {
    const existing = await prisma.user.findFirst({
      where: { phone: parsed.data.phone, id: { not: session.user.id } },
    });
    if (existing) return NextResponse.json({ error: "Số điện thoại đã được dùng bởi tài khoản khác" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(parsed.data.name != null && { name: parsed.data.name }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone || null }),
      ...(parsed.data.avatar !== undefined && { avatar: parsed.data.avatar }),
    },
    select: { id: true, email: true, name: true, phone: true, avatar: true },
  });
  return NextResponse.json({ message: "Cập nhật thành công", user });
}

// PUT: đổi mật khẩu
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } });
  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Tài khoản đăng nhập qua mạng xã hội, không thể đổi mật khẩu" }, { status: 400 });
  }

  const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isValid) return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 400 });

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash: newHash } });
  return NextResponse.json({ message: "Đổi mật khẩu thành công" });
}
