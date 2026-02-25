import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Trả về một admin khả dụng để môi giới có thể nhắn tin
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = String(session.user.role || "");
  const AGENT_ROLES = ["AGENT", "BUSINESS", "ADMIN"];
  if (!AGENT_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN", isLocked: false },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  });

  if (!admin) {
    return NextResponse.json(
      { error: "Hiện chưa có tài khoản quản trị để hỗ trợ." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      avatar: admin.avatar,
    },
  });
}

