import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/listings";

const ALLOWED = ["AGENT", "BUSINESS", "ADMIN"];

async function ensureAgent() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = session.user.role as string;
  if (!role || !ALLOWED.includes(role)) return null;
  return session;
}

function normalizeString(value: unknown, max = 500) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function normalizeOptionalNumber(value: unknown) {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function normalizeOptionalInt(value: unknown) {
  const n = normalizeOptionalNumber(value);
  if (n == null) return null;
  return Math.max(0, Math.round(n));
}

function normalizeLatitude(value: unknown) {
  const n = normalizeOptionalNumber(value);
  if (n == null || n < -90 || n > 90) return null;
  return Number(n.toFixed(7));
}

function normalizeLongitude(value: unknown) {
  const n = normalizeOptionalNumber(value);
  if (n == null || n < -180 || n > 180) return null;
  return Number(n.toFixed(7));
}

function normalizeImages(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim().slice(0, 2000) : ""))
    .filter(Boolean)
    .slice(0, 20);
}

export async function GET(req: Request) {
  const session = await ensureAgent();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "Thiếu id nháp." }, { status: 400 });

  // Cho phép lấy cả tin đã đăng để edit (APPROVED, PENDING, REJECTED, HIDDEN)
  const listing = await prisma.listing.findFirst({
    where: {
      id,
      ownerId: session.user.id,
      status: { in: ["DRAFT", "APPROVED", "PENDING", "REJECTED", "HIDDEN"] },
    },
    include: {
      images: {
        orderBy: { order: "asc" },
        select: { url: true },
      },
    },
  });
  if (!listing) return NextResponse.json({ error: "Không tìm thấy tin đăng." }, { status: 404 });

  // Trả về thêm status để FE biết đây là tin đã đăng hay nháp
  const isEditMode = listing.status !== "DRAFT";

  return NextResponse.json({
    data: {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      listingType: listing.listingType,
      category: listing.category,
      price: Number(listing.price),
      area: listing.area,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      direction: listing.direction,
      legalStatus: listing.legalStatus,
      // amenities được lưu tạm trong JSON, nhưng nếu schema DB chưa có sẽ luôn là undefined
      // nên chỉ đọc an toàn qua cast Record.
      amenities: Array.isArray((listing as Record<string, unknown>).amenities)
        ? (listing as Record<string, unknown>).amenities
        : [],
      address: listing.address,
      latitude: listing.latitude,
      longitude: listing.longitude,
      // Gán lại cho FE theo đúng cấu trúc form hiện tại
      provinceId: listing.provinceCode,
      districtId: null,
      wardId: listing.wardCode,
      contactName: listing.contactName,
      contactPhone: listing.contactPhone,
      contactEmail: listing.contactEmail,
      imageUrls: listing.images.map((img) => img.url),
      updatedAt: listing.updatedAt.toISOString(),
      status: listing.status,
      isEditMode,
      projectId: listing.projectId,
    },
  });
}

export async function POST(req: Request) {
  const session = await ensureAgent();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await req.json().catch(() => ({}))) as {
      id?: string;
      title?: unknown;
      description?: unknown;
      listingType?: unknown;
      category?: unknown;
      price?: unknown;
      area?: unknown;
      bedrooms?: unknown;
      bathrooms?: unknown;
      direction?: unknown;
      legalStatus?: unknown;
      amenities?: unknown;
      address?: unknown;
      latitude?: unknown;
      longitude?: unknown;
      provinceId?: unknown; // mã tỉnh (province_code) từ API v2
      districtId?: unknown;
      wardId?: unknown; // mã phường/xã (code) từ API v2
      provinceName?: unknown;
      wardName?: unknown;
      contactName?: unknown;
      contactPhone?: unknown;
      contactEmail?: unknown;
      imageUrls?: unknown;
      projectId?: unknown;
    };

    const draftId = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;
    const title = normalizeString(body.title, 500) ?? "Tin nháp chưa đặt tiêu đề";
    const listingType = body.listingType === "RENT" ? ("RENT" as const) : ("SALE" as const);
    const category =
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim()
        : "BDS_KHAC";
    const images = normalizeImages(body.imageUrls);
    const latitude = normalizeLatitude(body.latitude);
    const longitude = normalizeLongitude(body.longitude);

    const contactPhone =
      normalizeString(body.contactPhone, 20) ??
      (typeof (session.user as { phone?: string }).phone === "string"
        ? (session.user as { phone?: string }).phone!.slice(0, 20)
        : "Đang cập nhật");

    const data = {
      title,
      description: normalizeString(body.description, 5000),
      listingType,
      category: category as
        | "CAN_HO_CHUNG_CU"
        | "NHA_RIENG"
        | "NHA_MAT_PHONG"
        | "DAT_NEN"
        | "KHO_NHA_XUONG"
        | "BDS_KHAC",
      status: "DRAFT" as const,
      price: normalizeOptionalNumber(body.price) ?? 0,
      area: normalizeOptionalNumber(body.area) ?? 0,
      bedrooms: normalizeOptionalInt(body.bedrooms),
      bathrooms: normalizeOptionalInt(body.bathrooms),
      direction: normalizeString(body.direction, 100),
      legalStatus: normalizeString(body.legalStatus, 200),
      // Không set fields 'amenities' để tránh lỗi Unknown argument nếu DB schema chưa có cột này.
      address: normalizeString(body.address, 500),
      latitude: latitude != null && longitude != null ? latitude : null,
      longitude: latitude != null && longitude != null ? longitude : null,
      // Lưu trực tiếp mã tỉnh/thành & phường/xã theo API v2
      provinceCode:
        typeof body.provinceId === "string" && body.provinceId.trim()
          ? body.provinceId.trim().slice(0, 20)
          : null,
      provinceName: normalizeString(body.provinceName, 200),
      wardCode:
        typeof body.wardId === "string" && body.wardId.trim()
          ? body.wardId.trim().slice(0, 20)
          : null,
      wardName: normalizeString(body.wardName, 200),
      contactName: normalizeString(body.contactName, 200) ?? session.user.name ?? "Người đăng",
      contactPhone,
      contactEmail: normalizeString(body.contactEmail, 200),
      ownerId: session.user.id,
      publishedAt: null,
      projectId: typeof body.projectId === "string" && body.projectId.trim() ? body.projectId.trim() : null,
    };

    let listing:
      | {
        id: string;
        slug: string;
      }
      | null = null;

    if (draftId) {
      const existing = await prisma.listing.findFirst({
        where: { id: draftId, ownerId: session.user.id, status: "DRAFT" },
        select: { id: true },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "Không tìm thấy bản nháp hợp lệ (hoặc nháp không thuộc tài khoản hiện tại)." },
          { status: 404 },
        );
      }

      listing = await prisma.listing.update({
        where: { id: existing.id },
        data: {
          ...data,
          status: "DRAFT",
        },
        select: { id: true, slug: true },
      });
      await prisma.listingImage.deleteMany({ where: { listingId: existing.id } });
    } else {
      const baseSlug = `${slugify(title || "tin-nhap") || "tin-nhap"}-${Date.now().toString(36)}`;
      listing = await prisma.listing.create({
        data: {
          ...data,
          slug: baseSlug,
          status: "DRAFT",
        },
        select: { id: true, slug: true },
      });
    }

    if (images.length && listing) {
      await prisma.listingImage.createMany({
        data: images.map((url, idx) => ({
          listingId: listing.id,
          url,
          order: idx,
          isPrimary: idx === 0,
        })),
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: listing.id,
        slug: listing.slug,
      },
    });
  } catch (error) {
    console.error("SAVE_DRAFT_ERROR", error);
    return NextResponse.json(
      { error: "Không thể lưu nháp (lỗi hệ thống). Vui lòng thử lại sau ít phút." },
      { status: 500 },
    );
  }
}

