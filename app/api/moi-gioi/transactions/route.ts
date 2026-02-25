import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["AGENT", "BUSINESS", "ADMIN"];

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as string;
  if (!role || !ALLOWED.includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });
  if (!wallet) return NextResponse.json({ data: [], total: 0, page: 1, limit: 10 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
  const keyword = searchParams.get("keyword")?.trim();

  const where: { walletId: string; description?: { contains: string; mode: "insensitive" } } = { walletId: wallet.id };
  if (keyword) where.description = { contains: keyword, mode: "insensitive" };

  const [list, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  const data = list.map((t) => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    balanceAfter: t.balanceAfter != null ? Number(t.balanceAfter) : null,
    status: t.status,
    description: t.description,
    paymentMethod: t.paymentMethod,
    createdAt: t.createdAt.toISOString(),
  }));

  return NextResponse.json({ data, total, page, limit });
}
