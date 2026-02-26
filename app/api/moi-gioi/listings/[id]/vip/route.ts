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

function deriveVipLevel(code: string): string {
  const c = code.toLowerCase();
  if (c.includes("diamond") || c.includes("kim_cuong") || c.includes("kimcuong")) return "diamond";
  if (c.includes("gold") || c.includes("vang")) return "gold";
  if (c.includes("silver") || c.includes("bac")) return "silver";
  return "vip";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await ensureAgent();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: listingId } = await params;
  if (!listingId) {
    return NextResponse.json({ error: "Thiếu ID tin đăng." }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as { packageId?: string };
  const packageId = body.packageId?.trim();
  if (!packageId) {
    return NextResponse.json({ error: "Thiếu packageId." }, { status: 400 });
  }

  const [listing, pkg] = await Promise.all([
    prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, title: true, ownerId: true, status: true, topExpiresAt: true },
    }),
    prisma.servicePackage.findUnique({
      where: { id: packageId },
      select: { id: true, code: true, name: true, price: true, durationDays: true, isActive: true },
    }),
  ]);

  if (!listing || listing.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Không tìm thấy tin đăng hợp lệ." }, { status: 404 });
  }
  if (listing.status !== "APPROVED") {
    return NextResponse.json({ error: "Chỉ có thể nâng VIP cho tin đang hiển thị." }, { status: 400 });
  }
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

    const now = new Date();
    const baseStart =
      listing.topExpiresAt && listing.topExpiresAt > now ? listing.topExpiresAt : now;
    const durationDays = pkg.durationDays ?? 30;
    const millis = durationDays * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(baseStart.getTime() + millis);

    const newBalance = currentBalance - packagePrice;

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    const vipLevel = deriveVipLevel(pkg.code);

    await tx.listing.update({
      where: { id: listing.id },
      data: {
        isVip: true,
        vipLevel,
        topExpiresAt: expiresAt,
      },
    });

    const listingService = await tx.listingService.create({
      data: {
        listingId: listing.id,
        servicePackageId: pkg.id,
        startsAt: baseStart,
        expiresAt,
      },
    });

    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: "VIP_PACKAGE",
        amount: packagePrice,
        balanceAfter: newBalance,
        status: "COMPLETED",
        referenceId: listingService.id,
        description: `Mua gói VIP "${pkg.name}" cho tin: ${listing.title}`,
        completedAt: new Date(),
      },
    });

    return {
      ok: true as const,
      balance: newBalance,
      transactionId: transaction.id,
      expiresAt,
      vipLevel,
    };
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: "Số dư ví không đủ để nâng VIP cho tin.",
        balance: result.currentBalance,
        packagePrice: result.packagePrice,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    balance: result.balance,
    transactionId: result.transactionId,
    expiresAt: result.expiresAt.toISOString(),
    vipLevel: result.vipLevel,
  });
}

