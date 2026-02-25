import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }
    const { token, password } = parsed.data;
    const otp = await prisma.otpCode.findFirst({
      where: { code: token, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!otp?.userId) {
      return NextResponse.json({ error: "Mã OTP không hợp lệ hoặc đã hết hạn" }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: otp.userId },
        data: { passwordHash },
      }),
      prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } }),
    ]);
    return NextResponse.json({ message: "Đổi mật khẩu thành công" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi xử lý" }, { status: 500 });
  }
}
