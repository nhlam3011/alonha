import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["AGENT", "ADMIN"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as string;
  if (!role || !ALLOWED.includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = session.user.id;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [wallet, listings, newLeadsCount] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }).then((w) => w ?? prisma.wallet.create({ data: { userId } })),
    prisma.listing.findMany({
      where: { ownerId: userId, status: "APPROVED", publishedAt: { not: null } },
      select: { viewCount: true },
    }),
    prisma.lead.count({ where: { agentId: userId, createdAt: { gte: weekAgo } } }),
  ]);

  const activeListingsCount = listings.length;
  const totalViewCount = listings.reduce((s, l) => s + l.viewCount, 0);

  return NextResponse.json({
    balance: Number(wallet.balance),
    activeListingsCount,
    totalViewCount,
    newLeadsCount,
  });
}
