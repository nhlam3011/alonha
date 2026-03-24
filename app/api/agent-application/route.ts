import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const role = String((session.user as any).role || "USER");
    if (role === "AGENT") {
        return NextResponse.json({ error: "Bạn đã là môi giới rồi." }, { status: 400 });
    }

    const existing = await prisma.agentApplication.findFirst({
        where: {
            userId: session.user.id,
            status: { in: ["PENDING", "REVIEWING", "INTERVIEW"] },
        },
    });
    if (existing) {
        return NextResponse.json({ error: "Bạn đã có đơn đăng ký đang chờ xử lý." }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, any>;

    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const idCardNumber = String(body.idCardNumber || "").trim();
    const address = String(body.address || "").trim();

    if (!fullName || !phone || !email || !idCardNumber || !address) {
        return NextResponse.json({ error: "Vui lòng điền đầy đủ thông tin bắt buộc." }, { status: 400 });
    }

    if (!body.agreedTerms) {
        return NextResponse.json({ error: "Vui lòng đồng ý với điều khoản hợp đồng." }, { status: 400 });
    }

    const app = await prisma.agentApplication.create({
        data: {
            userId: session.user.id,
            fullName,
            phone,
            email,
            idCardNumber,
            dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
            address,
            currentAddress: body.currentAddress?.trim() || null,
            education: body.education?.trim() || null,
            experience: body.experience?.trim() || null,
            currentJob: body.currentJob?.trim() || null,
            referralSource: body.referralSource?.trim() || null,
            selfIntro: body.selfIntro?.trim() || null,
            agreedTerms: true,
            status: "PENDING",
        },
    });

    return NextResponse.json({ data: app, message: "Đơn đăng ký đã được gửi thành công!" });
}

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apps = await prisma.agentApplication.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    return NextResponse.json({ data: apps });
}
