import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["AGENT", "ADMIN"];
const ALLOWED_METHODS = ["QR", "TRANSFER"];

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

  const body = (await req.json().catch(() => ({}))) as {
    amount?: number;
    method?: string;
  };
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Số tiền nạp không hợp lệ." }, { status: 400 });
  }
  if (amount > 2_000_000_000) {
    return NextResponse.json({ error: "Số tiền nạp vượt quá giới hạn mỗi lần." }, { status: 400 });
  }

  const method = (body.method || "QR").toUpperCase();
  if (!ALLOWED_METHODS.includes(method)) {
    return NextResponse.json({ error: "Phương thức nạp không hợp lệ." }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    let wallet = await tx.wallet.findUnique({ where: { userId: session.user.id } });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { userId: session.user.id },
      });
    }

    const currentBalance = Number(wallet.balance);
    const newBalance = currentBalance + amount;

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: "DEPOSIT",
        amount,
        balanceAfter: newBalance,
        status: "COMPLETED",
        paymentMethod: method,
        description: `Nạp tiền vào ví (${method})`,
        completedAt: new Date(),
      },
    });

    return { balance: newBalance, transactionId: transaction.id };
  });

  return NextResponse.json({
    ok: true,
    balance: result.balance,
    transactionId: result.transactionId,
  });
}
