import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id || String((session.user as any).role) !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 10;

    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
        prisma.agentApplication.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        role: true,
                        phone: true,
                        createdAt: true,
                        lastLoginAt: true,
                    },
                },
            },
        }),
        prisma.agentApplication.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
}

export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user?.id || String((session.user as any).role) !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const { applicationId, action, adminNote, interviewDate, interviewLocation } = body;

    if (!applicationId || !action) {
        return NextResponse.json({ error: "Thiếu applicationId hoặc action." }, { status: 400 });
    }

    const app = await prisma.agentApplication.findUnique({ where: { id: applicationId } });
    if (!app) {
        return NextResponse.json({ error: "Không tìm thấy đơn đăng ký." }, { status: 404 });
    }

    switch (action) {
        case "review": {
            const updated = await prisma.agentApplication.update({
                where: { id: applicationId },
                data: {
                    status: "REVIEWING",
                    reviewedBy: session.user.id,
                    adminNote: adminNote || app.adminNote,
                },
            });
            return NextResponse.json({ data: updated, message: "Đã chuyển sang trạng thái xem xét." });
        }

        case "interview": {
            if (!interviewDate) {
                return NextResponse.json({ error: "Vui lòng chọn ngày hẹn phỏng vấn." }, { status: 400 });
            }
            const updated = await prisma.agentApplication.update({
                where: { id: applicationId },
                data: {
                    status: "INTERVIEW",
                    interviewDate: new Date(interviewDate),
                    interviewLocation: interviewLocation || null,
                    reviewedBy: session.user.id,
                    adminNote: adminNote || app.adminNote,
                },
            });
            return NextResponse.json({ data: updated, message: "Đã hẹn phỏng vấn ứng viên." });
        }

        case "approve": {
            const [updated] = await prisma.$transaction([
                prisma.agentApplication.update({
                    where: { id: applicationId },
                    data: {
                        status: "APPROVED",
                        reviewedBy: session.user.id,
                        reviewedAt: new Date(),
                        adminNote: adminNote || app.adminNote,
                    },
                }),
                prisma.user.update({
                    where: { id: app.userId },
                    data: { role: "AGENT" },
                }),
                prisma.wallet.upsert({
                    where: { userId: app.userId },
                    update: {},
                    create: { userId: app.userId, balance: 0 },
                }),
            ]);
            return NextResponse.json({ data: updated, message: "Đã duyệt và chuyển quyền thành môi giới!" });
        }

        case "reject": {
            const updated = await prisma.agentApplication.update({
                where: { id: applicationId },
                data: {
                    status: "REJECTED",
                    reviewedBy: session.user.id,
                    reviewedAt: new Date(),
                    adminNote: adminNote || "Không đạt yêu cầu.",
                },
            });
            return NextResponse.json({ data: updated, message: "Đã từ chối đơn đăng ký." });
        }

        default:
            return NextResponse.json({ error: "Action không hợp lệ." }, { status: 400 });
    }
}
