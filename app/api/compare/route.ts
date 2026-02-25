import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import {
  getCompareItems,
  addToCompare,
  removeFromCompare,
  CompareContext,
} from "@/lib/compare";

const COMPARE_COOKIE = "alonha_compare_session";
const MAX_COMPARE_ITEMS = 3;

async function getCompareContext(createIfMissing: boolean): Promise<CompareContext | null> {
  const session = await auth();
  if (session?.user?.id) {
    return {
      userId: session.user.id,
      sessionId: null,
      shouldSetCookie: false,
    };
  }

  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get(COMPARE_COOKIE)?.value ?? null;
  if (existingSessionId) {
    return {
      userId: null,
      sessionId: existingSessionId,
      shouldSetCookie: false,
    };
  }
  if (!createIfMissing) {
    return null;
  }

  return {
    userId: null,
    sessionId: `cmp_${nanoid(14)}`,
    shouldSetCookie: true,
  };
}

export async function GET() {
  const context = await getCompareContext(false);
  if (!context) {
    return NextResponse.json({ data: [], total: 0, maxItems: MAX_COMPARE_ITEMS });
  }

  const data = await getCompareItems(context);
  return NextResponse.json({ data, total: data.length, maxItems: MAX_COMPARE_ITEMS });
}

export async function POST(req: Request) {
  const context = await getCompareContext(true);
  if (!context) return NextResponse.json({ error: "Không thể tạo phiên so sánh." }, { status: 500 });

  const body = (await req.json().catch(() => ({}))) as { listingId?: string; slug?: string };
  const res = await addToCompare(context, body.listingId, body.slug);

  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }

  const response = NextResponse.json(res);

  if (context.shouldSetCookie && context.sessionId) {
    response.cookies.set(COMPARE_COOKIE, context.sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

export async function DELETE(req: Request) {
  const context = await getCompareContext(false);
  if (!context) return NextResponse.json({ ok: true, total: 0 });

  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId")?.trim();

  const total = await removeFromCompare(context, listingId || undefined);
  return NextResponse.json({ ok: true, total });
}
