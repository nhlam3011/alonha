import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";

const OTP_EXIRY_MINUTES = 10;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
    }
    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: "Nếu email tồn tại, bạn sẽ nhận được mã OTP" });
    }
    const code = nanoid(6).toUpperCase();
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        email,
        code,
        expiresAt: new Date(Date.now() + OTP_EXIRY_MINUTES * 60 * 1000),
      },
    });
    // TODO: Gửi email thật (Resend, SendGrid...). Hiện trả code về cho dev.
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ message: "Mã OTP (chỉ dev)", code });
    }
    return NextResponse.json({ message: "Vui lòng kiểm tra email để lấy mã OTP" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi xử lý" }, { status: 500 });
  }
}
