import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["AGENT", "BUSINESS", "ADMIN"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as string;
  if (!role || !ALLOWED.includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
  });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId: session.user.id },
    });
  }
  return NextResponse.json({
    balance: Number(wallet.balance),
    currency: wallet.currency,
  });
}
