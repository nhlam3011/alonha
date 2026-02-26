import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { name, email, phone, password } = parsed.data;
    const emailLower = email.toLowerCase().trim();
    const existing = await prisma.user.findFirst({
      where: { email: emailLower },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email đã được sử dụng" },
        { status: 400 }
      );
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: emailLower,
        phone: phone || null,
        passwordHash,
        role: "USER",
      },
      select: { id: true, email: true, name: true, role: true },
    });

    // Gửi email chào mừng
    if (user.email) {
      await sendWelcomeEmail(user.email, user.name);
    }

    return NextResponse.json({ user });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Lỗi đăng ký" },
      { status: 500 }
    );
  }
}
