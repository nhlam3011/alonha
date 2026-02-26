import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["AGENT", "ADMIN"];

async function ensureAgent() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = session.user.role as string;
  if (!role || !ALLOWED.includes(role)) return null;
  return session;
}

export async function POST(req: Request) {
  const session = await ensureAgent();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { packageId?: string };
  const packageId = body.packageId?.trim();
  if (!packageId) {
    return NextResponse.json({ error: "Thiếu packageId." }, { status: 400 });
  }

  const pkg = await prisma.servicePackage.findUnique({
    where: { id: packageId },
    select: { id: true, name: true, price: true, isActive: true },
  });
  if (!pkg || !pkg.isActive) {
    return NextResponse.json({ error: "Gói dịch vụ không khả dụng." }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    let wallet = await tx.wallet.findUnique({ where: { userId: session.user.id } });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { userId: session.user.id },
      });
    }

    const currentBalance = Number(wallet.balance);
    const packagePrice = Number(pkg.price);
    if (currentBalance < packagePrice) {
      return {
        ok: false as const,
        currentBalance,
        packagePrice,
      };
    }

    const newBalance = currentBalance - packagePrice;
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: "VIP_PACKAGE",
        amount: packagePrice,
        balanceAfter: newBalance,
        status: "COMPLETED",
        referenceId: pkg.id,
        description: `Mua gói dịch vụ: ${pkg.name}`,
        completedAt: new Date(),
      },
    });

    return {
      ok: true as const,
      balance: newBalance,
      transactionId: transaction.id,
    };
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: "Số dư ví không đủ để mua gói.",
        balance: result.currentBalance,
        packagePrice: result.packagePrice,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    balance: result.balance,
    transactionId: result.transactionId,
  });
}
