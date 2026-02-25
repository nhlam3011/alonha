import { NextResponse } from "next/server";
import type { Prisma, PropertyCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toListingCard, listingSelectCard, slugify } from "@/lib/listings";
import { listingSearchSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";
import { detectProvinceInKeyword } from "@/lib/provinces";

const APPROVED = "APPROVED";

/**
 * Normalize text: bỏ dấu tiếng Việt, lowercase, đ -> d
 * Dùng để so sánh keyword không dấu với slug (đã slugified)
 */
function normalizeToSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

/**
 * Kiểm tra text có chứa ký tự có dấu tiếng Việt không
 */
function hasVietnameseDiacritics(text: string): boolean {
  // Check if the normalized version differs from the original (lowercased)
  const lower = text.toLowerCase();
  const normalized = normalizeToSlug(text);
  return lower !== normalized;
}

function mapCategoryParamToEnum(category: string | null | undefined): PropertyCategory | null {
  if (!category) return null;
  const value = category.trim();
  if (!value) return null;

  // Hỗ trợ cả enum trực tiếp từ DB (CAN_HO_CHUNG_CU, ...) và slug trên FE (can-ho-chung-cu, ...).
  const upper = value.toUpperCase() as PropertyCategory;
  const enumValues: PropertyCategory[] = [
    "CAN_HO_CHUNG_CU",
    "NHA_RIENG",
    "NHA_MAT_PHONG",
    "DAT_NEN",
    "KHO_NHA_XUONG",
    "BDS_KHAC",
  ];
  if (enumValues.includes(upper)) return upper;

  const slug = value.toLowerCase();
  switch (slug) {
    case "can-ho-chung-cu":
      return "CAN_HO_CHUNG_CU";
    case "nha-rieng":
      return "NHA_RIENG";
    case "nha-mat-phong":
      return "NHA_MAT_PHONG";
    case "dat-nen":
      return "DAT_NEN";
    case "kho-nha-xuong":
      return "KHO_NHA_XUONG";
    // Một số loại chi tiết hơn được gom vào nhóm BDS_KHAC trong DB.
    case "biet-thu":
    case "van-phong":
    case "mat-bang":
    case "bds-khac":
      return "BDS_KHAC";
    default:
      return null;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      raw[key] = value;
    });

    const query = listingSearchSchema.parse(raw);
    const {
      keyword,
      aiQuery, // hiện tại chỉ dùng để truyền qua tracking, chưa lọc riêng
      loaiHinh = "sale",
      category,
      provinceId,
      districtId,
      wardId,
      priceMin,
      priceMax,
      areaMin,
      areaMax,
      bedrooms,
      bathrooms,
      direction,
      legalStatus,
      projectId,
      sort = "newest",
      page,
      limit,
    } = query;

    const andConditions: Prisma.ListingWhereInput[] = [];

    // Từ khóa: tìm trong tiêu đề, mô tả, địa chỉ và slug.
    // Hỗ trợ tìm không dấu: nếu keyword không có dấu tiếng Việt,
    // chuyển thành dạng slug và tìm trong trường slug (đã được slugify khi tạo tin).
    // Ngoài ra, nhận diện tên tỉnh/thành trong keyword để lọc theo provinceName.
    const effectiveKeyword = (keyword || "").trim();
    if (effectiveKeyword) {
      const keywordHasDiacritics = hasVietnameseDiacritics(effectiveKeyword);

      if (keywordHasDiacritics) {
        // Keyword có dấu: tìm trực tiếp trong title, description, address, provinceName, wardName
        andConditions.push({
          OR: [
            { title: { contains: effectiveKeyword, mode: "insensitive" } },
            { description: { contains: effectiveKeyword, mode: "insensitive" } },
            { address: { contains: effectiveKeyword, mode: "insensitive" } },
            { provinceName: { contains: effectiveKeyword, mode: "insensitive" } },
            { wardName: { contains: effectiveKeyword, mode: "insensitive" } },
            { slug: { contains: effectiveKeyword, mode: "insensitive" } },
          ],
        });
      } else {
        // Keyword không dấu (VD: "ha noi", "ho chi minh", "da nang")
        // 1. Phát hiện tên tỉnh/thành trong keyword
        const provinceDetection = await detectProvinceInKeyword(effectiveKeyword);

        if (provinceDetection) {
          // Tìm thấy tên tỉnh/thành -> lọc theo provinceName
          andConditions.push({
            provinceName: { contains: provinceDetection.provinceName, mode: "insensitive" },
          });

          // Nếu còn keyword phụ (ví dụ "can ho" từ "can ho ha noi") -> tìm trong slug/title
          const remaining = provinceDetection.remainingKeyword;
          if (remaining && remaining.length >= 2) {
            const remainingSlug = remaining.replace(/\s+/g, "-");
            const remainingParts: string[] = remaining.split(/\s+/).filter(Boolean);

            const orConditions: Prisma.ListingWhereInput[] = [
              { slug: { contains: remainingSlug, mode: "insensitive" } },
              { title: { contains: remaining, mode: "insensitive" } },
            ];

            if (remainingParts.length > 1) {
              orConditions.push({
                AND: remainingParts.map((part) => ({
                  slug: { contains: part, mode: "insensitive" as const },
                })),
              });
              orConditions.push({
                AND: remainingParts.map((part) => ({
                  title: { contains: part, mode: "insensitive" as const },
                })),
              });
              orConditions.push({
                AND: remainingParts.map((part) => ({
                  description: { contains: part, mode: "insensitive" as const },
                })),
              });
            }

            andConditions.push({ OR: orConditions });
          }
        } else {
          // Không phát hiện tỉnh/thành -> tìm bằng slug thông thường
          const slugKeyword = normalizeToSlug(effectiveKeyword).replace(/\s+/g, "-");
          const keywordParts: string[] = normalizeToSlug(effectiveKeyword).split(/\s+/).filter(Boolean);

          const orConditions: Prisma.ListingWhereInput[] = [
            // Tìm trực tiếp (trường hợp data không có dấu)
            { title: { contains: effectiveKeyword, mode: "insensitive" } },
            { address: { contains: effectiveKeyword, mode: "insensitive" } },
            // Tìm trong slug (slug đã được normalize không dấu)
            { slug: { contains: slugKeyword, mode: "insensitive" } },
          ];

          // Nếu keyword có nhiều từ, tìm từng phần trong slug
          if (keywordParts.length > 1) {
            orConditions.push({
              AND: keywordParts.map((part) => ({
                slug: { contains: part, mode: "insensitive" as const },
              })),
            });
            orConditions.push({
              AND: keywordParts.map((part) => ({
                title: { contains: part, mode: "insensitive" as const },
              })),
            });
            // Tìm trong provinceName + wardName (normalized)
            orConditions.push({
              AND: keywordParts.map((part) => ({
                OR: [
                  { slug: { contains: part, mode: "insensitive" as const } },
                  { address: { contains: part, mode: "insensitive" as const } },
                ],
              })),
            });
          }

          andConditions.push({ OR: orConditions });
        }
      }
    }

    // Loại hình: mua bán / cho thuê
    if (loaiHinh === "sale") {
      andConditions.push({ listingType: "SALE" });
    } else if (loaiHinh === "rent") {
      andConditions.push({ listingType: "RENT" });
    }

    // Loại BĐS
    const categoryEnum = mapCategoryParamToEnum(category);
    if (categoryEnum) {
      andConditions.push({ category: categoryEnum });
    }

    // Lọc theo tỉnh/phường theo đúng mã code từ API v2
    if (wardId) {
      andConditions.push({ wardCode: String(wardId).trim() } as any);
    } else {
      if (provinceId) {
        const provinceCode = String(provinceId).trim();
        andConditions.push({
          provinceCode,
        } as any);
      }
    }

    // Dự án
    if (projectId) {
      andConditions.push({ projectId: String(projectId).trim() });
    }

    // Giá
    if (priceMin != null || priceMax != null) {
      const priceFilter: { gte?: number; lte?: number } = {};
      if (typeof priceMin === "number") priceFilter.gte = priceMin;
      if (typeof priceMax === "number") priceFilter.lte = priceMax;
      andConditions.push({ price: priceFilter });
    }

    // Diện tích
    if (areaMin != null || areaMax != null) {
      const areaFilter: { gte?: number; lte?: number } = {};
      if (typeof areaMin === "number") areaFilter.gte = areaMin;
      if (typeof areaMax === "number") areaFilter.lte = areaMax;
      andConditions.push({ area: areaFilter });
    }

    // Phòng ngủ / tắm
    if (typeof bedrooms === "number") {
      andConditions.push({ bedrooms: { gte: bedrooms } });
    }
    if (typeof bathrooms === "number") {
      andConditions.push({ bathrooms: { gte: bathrooms } });
    }

    // Hướng
    if (direction) {
      andConditions.push({
        direction: { contains: direction.trim(), mode: "insensitive" },
      });
    }

    // Pháp lý
    if (legalStatus) {
      andConditions.push({
        legalStatus: { contains: legalStatus.trim(), mode: "insensitive" },
      });
    }

    const where: Prisma.ListingWhereInput = {
      status: APPROVED,
      publishedAt: { not: null },
      AND: andConditions.length > 0 ? andConditions : undefined,
    };

    const orderBy: Prisma.ListingOrderByWithRelationInput[] = [];
    if (sort === "price-asc") {
      orderBy.push({ isVip: "desc" }, { price: "asc" }, { publishedAt: "desc" });
    } else if (sort === "price-desc") {
      orderBy.push({ isVip: "desc" }, { price: "desc" }, { publishedAt: "desc" });
    } else if (sort === "area-asc") {
      orderBy.push({ isVip: "desc" }, { area: "asc" }, { publishedAt: "desc" });
    } else if (sort === "area-desc") {
      orderBy.push({ isVip: "desc" }, { area: "desc" }, { publishedAt: "desc" });
    } else {
      // Tin VIP và mới nhất ưu tiên
      orderBy.push({ isVip: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" });
    }

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 50 ? limit : 12;
    const skip = (safePage - 1) * safeLimit;

    const [rows, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take: safeLimit,
        select: listingSelectCard,
      }),
      prisma.listing.count({ where }),
    ]);

    const data = rows.map((row) => toListingCard(row as any));
    return NextResponse.json({ data, total, page: safePage, limit: safeLimit });
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json({ error: "Không thể tải danh sách bất động sản." }, { status: 500 });
  }
}

const ALLOWED_POST_ROLES = ["AGENT", "BUSINESS", "ADMIN"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });
  }
  const role = session.user.role as string;
  if (!role || !ALLOWED_POST_ROLES.includes(role)) {
    return NextResponse.json(
      { error: "Chỉ tài khoản Môi giới/Doanh nghiệp mới được đăng tin. Vui lòng nâng cấp tài khoản." },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const baseSlug = slugify(body.title || "tin-dang") + "-" + Date.now().toString(36);
    const slug = body.slug?.trim() || baseSlug;

    const draftId =
      typeof body.draftId === "string" && body.draftId.trim()
        ? body.draftId.trim()
        : null;

    const provinceCode =
      body.provinceId && String(body.provinceId).trim()
        ? String(body.provinceId).trim()
        : null;
    const provinceName =
      body.provinceName && String(body.provinceName).trim()
        ? String(body.provinceName).trim().slice(0, 200)
        : null;

    const listingData = {
      title: String(body.title || "Tin đăng").slice(0, 500),
      description: body.description ?? null,
      listingType: body.listingType === "RENT" ? ("RENT" as const) : ("SALE" as const),
      category:
        (body.category as
          | "CAN_HO_CHUNG_CU"
          | "NHA_RIENG"
          | "NHA_MAT_PHONG"
          | "DAT_NEN"
          | "KHO_NHA_XUONG"
          | "BDS_KHAC") ?? "BDS_KHAC",
      status: "PENDING" as const,
      price: Number(body.price) || 0,
      pricePerSqm: body.pricePerSqm != null ? Number(body.pricePerSqm) : null,
      area: Number(body.area) || 0,
      bedrooms: body.bedrooms != null ? Number(body.bedrooms) : null,
      bathrooms: body.bathrooms != null ? Number(body.bathrooms) : null,
      direction: body.direction ?? null,
      legalStatus: body.legalStatus ?? null,
      furniture: body.furniture ?? null,
      // BỎ amenities khỏi data để tránh lỗi Unknown argument nếu DB chưa sync cột này
      address: body.address ?? null,
      provinceCode,
      provinceName,
      wardCode: body.wardId ? String(body.wardId).trim() : null,
      wardName: body.wardName ? String(body.wardName).slice(0, 200) : null,
      latitude: body.latitude != null ? Number(body.latitude) : null,
      longitude: body.longitude != null ? Number(body.longitude) : null,
      contactName: String(body.contactName || session.user.name).slice(0, 200),
      contactPhone: String(body.contactPhone || "").slice(0, 20),
      contactEmail: body.contactEmail ?? null,
      ownerId: session.user.id,
      projectId: body.projectId ? String(body.projectId).trim() : null,
      publishedAt: null,
    };

    let listing:
      | {
        id: string;
        slug: string;
      }
      | null = null;

    if (draftId) {
      const draft = await prisma.listing.findFirst({
        where: { id: draftId, ownerId: session.user.id, status: "DRAFT" },
        select: { id: true, slug: true },
      });
      if (!draft) {
        return NextResponse.json({ error: "Không tìm thấy tin nháp để đăng." }, { status: 404 });
      }
      listing = await prisma.listing.update({
        where: { id: draft.id },
        data: listingData,
        select: { id: true, slug: true },
      });
      await prisma.listingImage.deleteMany({ where: { listingId: draft.id } });
    } else {
      listing = await prisma.listing.create({
        data: {
          slug,
          ...listingData,
        },
        select: { id: true, slug: true },
      });
    }

    if (listing && Array.isArray(body.images) && body.images.length > 0) {
      await prisma.listingImage.createMany({
        data: body.images.slice(0, 20).map((url: string, i: number) => ({
          listingId: listing.id,
          url: String(url).slice(0, 2000),
          order: i,
          isPrimary: i === 0,
        })),
      });
    }

    return NextResponse.json({ id: listing.id, slug: listing.slug });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi tạo tin" }, { status: 500 });
  }
}

