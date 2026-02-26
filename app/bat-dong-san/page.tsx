import { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma, PropertyCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toListingCard, listingSelectCard } from "@/lib/listings";
import { detectProvinceInKeyword } from "@/lib/provinces";
import { PropertyCard } from "@/components/listings/PropertyCard";
import { ClientFilters, ClientPagination } from "./ClientFilters";

export const metadata: Metadata = {
  title: "Tìm kiếm Bất động sản | AloNha",
  description: "Tìm kiếm, mua bán và cho thuê các loại hình bất động sản trên toàn quốc.",
};

const APPROVED = "APPROVED";

function normalizeToSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function hasVietnameseDiacritics(text: string): boolean {
  const lower = text.toLowerCase();
  const normalized = normalizeToSlug(text);
  return lower !== normalized;
}

function mapCategoryParamToEnum(category: string | null | undefined): PropertyCategory | null {
  if (!category) return null;
  const value = category.trim();
  if (!value) return null;

  const upper = value.toUpperCase() as PropertyCategory;
  const enumValues: PropertyCategory[] = [
    "CAN_HO_CHUNG_CU", "NHA_RIENG", "NHA_MAT_PHONG", "DAT_NEN", "KHO_NHA_XUONG", "BDS_KHAC",
  ];
  if (enumValues.includes(upper)) return upper;

  const slug = value.toLowerCase();
  switch (slug) {
    case "can-ho-chung-cu": return "CAN_HO_CHUNG_CU";
    case "nha-rieng": return "NHA_RIENG";
    case "nha-mat-phong": return "NHA_MAT_PHONG";
    case "dat-nen": return "DAT_NEN";
    case "kho-nha-xuong": return "KHO_NHA_XUONG";
    case "biet-thu":
    case "van-phong":
    case "mat-bang":
    case "bds-khac": return "BDS_KHAC";
    default: return null;
  }
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const viewMode = (cookieStore.get("viewMode")?.value as "grid" | "list") || "grid";

  // Parse params
  const keyword = typeof params.keyword === "string" ? params.keyword : "";
  const loaiHinh = typeof params.loaiHinh === "string" ? params.loaiHinh : "sale";
  const category = typeof params.category === "string" ? params.category : "";
  const provinceId = typeof params.provinceId === "string" ? params.provinceId : "";
  const wardId = typeof params.wardId === "string" ? params.wardId : "";
  const projectId = typeof params.projectId === "string" ? params.projectId : "";

  const priceMin = typeof params.priceMin === "string" ? Number(params.priceMin) : undefined;
  const priceMax = typeof params.priceMax === "string" ? Number(params.priceMax) : undefined;
  const areaMin = typeof params.areaMin === "string" ? Number(params.areaMin) : undefined;
  const areaMax = typeof params.areaMax === "string" ? Number(params.areaMax) : undefined;

  const bedroomsStr = typeof params.bedrooms === "string" ? params.bedrooms.replace('+', '') : "";
  const bedrooms = bedroomsStr ? Number(bedroomsStr) : undefined;

  const bathroomsStr = typeof params.bathrooms === "string" ? params.bathrooms.replace('+', '') : "";
  const bathrooms = bathroomsStr ? Number(bathroomsStr) : undefined;

  const direction = typeof params.direction === "string" ? params.direction : "";
  const legalStatus = typeof params.legalStatus === "string" ? params.legalStatus : "";
  const sort = typeof params.sort === "string" ? params.sort : "newest";

  const page = typeof params.page === "string" ? Math.max(1, Number(params.page)) : 1;
  const limit = 12;

  // Build Prisma Query
  const andConditions: Prisma.ListingWhereInput[] = [];

  const effectiveKeyword = keyword.trim();
  if (effectiveKeyword) {
    const keywordHasDiacritics = hasVietnameseDiacritics(effectiveKeyword);
    if (keywordHasDiacritics) {
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
      const provinceDetection = await detectProvinceInKeyword(effectiveKeyword);
      if (provinceDetection) {
        andConditions.push({
          provinceName: { contains: provinceDetection.provinceName, mode: "insensitive" },
        });

        const remaining = provinceDetection.remainingKeyword;
        if (remaining && remaining.length >= 2) {
          const remainingSlug = remaining.replace(/\s+/g, "-");
          const remainingParts = remaining.split(/\s+/).filter(Boolean);
          const orConditions: Prisma.ListingWhereInput[] = [
            { slug: { contains: remainingSlug, mode: "insensitive" } },
            { title: { contains: remaining, mode: "insensitive" } },
          ];

          if (remainingParts.length > 1) {
            orConditions.push({ AND: remainingParts.map((part) => ({ slug: { contains: part, mode: "insensitive" } })) });
            orConditions.push({ AND: remainingParts.map((part) => ({ title: { contains: part, mode: "insensitive" } })) });
            orConditions.push({ AND: remainingParts.map((part) => ({ description: { contains: part, mode: "insensitive" } })) });
          }
          andConditions.push({ OR: orConditions });
        }
      } else {
        const slugKeyword = normalizeToSlug(effectiveKeyword).replace(/\s+/g, "-");
        const keywordParts = normalizeToSlug(effectiveKeyword).split(/\s+/).filter(Boolean);

        const orConditions: Prisma.ListingWhereInput[] = [
          { title: { contains: effectiveKeyword, mode: "insensitive" } },
          { address: { contains: effectiveKeyword, mode: "insensitive" } },
          { slug: { contains: slugKeyword, mode: "insensitive" } },
        ];

        if (keywordParts.length > 1) {
          orConditions.push({ AND: keywordParts.map((part) => ({ slug: { contains: part, mode: "insensitive" } })) });
          orConditions.push({ AND: keywordParts.map((part) => ({ title: { contains: part, mode: "insensitive" } })) });
          orConditions.push({
            AND: keywordParts.map((part) => ({
              OR: [
                { slug: { contains: part, mode: "insensitive" } },
                { address: { contains: part, mode: "insensitive" } },
              ],
            })),
          });
        }
        andConditions.push({ OR: orConditions });
      }
    }
  }

  if (loaiHinh === "sale") andConditions.push({ listingType: "SALE" });
  else if (loaiHinh === "rent") andConditions.push({ listingType: "RENT" });

  const categoryEnum = mapCategoryParamToEnum(category);
  if (categoryEnum) andConditions.push({ category: categoryEnum });

  if (wardId) andConditions.push({ wardCode: String(wardId).trim() } as any);
  else if (provinceId) andConditions.push({ provinceCode: String(provinceId).trim() } as any);

  if (projectId) andConditions.push({ projectId: String(projectId).trim() });

  if (priceMin != null || priceMax != null) {
    const priceFilter: { gte?: number; lte?: number } = {};
    if (priceMin) priceFilter.gte = priceMin;
    if (priceMax) priceFilter.lte = priceMax;
    andConditions.push({ price: priceFilter });
  }

  if (areaMin != null || areaMax != null) {
    const areaFilter: { gte?: number; lte?: number } = {};
    if (areaMin) areaFilter.gte = areaMin;
    if (areaMax) areaFilter.lte = areaMax;
    andConditions.push({ area: areaFilter });
  }

  if (bedrooms) andConditions.push({ bedrooms: { gte: bedrooms } });
  if (bathrooms) andConditions.push({ bathrooms: { gte: bathrooms } });
  if (direction) andConditions.push({ direction: { contains: direction.trim(), mode: "insensitive" } });
  if (legalStatus) andConditions.push({ legalStatus: { contains: legalStatus.trim(), mode: "insensitive" } });

  const where: Prisma.ListingWhereInput = {
    status: APPROVED,
    publishedAt: { not: null },
    AND: andConditions.length > 0 ? andConditions : undefined,
  };

  const orderBy: Prisma.ListingOrderByWithRelationInput[] = [];
  if (sort === "price-asc") orderBy.push({ isVip: "desc" }, { price: "asc" }, { publishedAt: "desc" });
  else if (sort === "price-desc") orderBy.push({ isVip: "desc" }, { price: "desc" }, { publishedAt: "desc" });
  else if (sort === "area-asc") orderBy.push({ isVip: "desc" }, { area: "asc" }, { publishedAt: "desc" });
  else if (sort === "area-desc") orderBy.push({ isVip: "desc" }, { area: "desc" }, { publishedAt: "desc" });
  else orderBy.push({ isVip: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" });

  const skip = (page - 1) * limit;

  // Cấu hình Base URL linh hoạt cho môi trường Vercel khi fetch API Server-side
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

  // Lấy danh sách Provinces để fill vào filter 
  const provincesRes = await fetch(`${baseUrl}/api/provinces`, {
    next: { revalidate: 3600 }
  }).catch((e) => {
    console.error("Fetch provinces error:", e);
    return null;
  });
  const provinces = provincesRes ? await provincesRes.json() : [];

  const [rows, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: listingSelectCard,
    }),
    prisma.listing.count({ where }),
  ]);

  const listings = rows.map((row) => toListingCard(row as any));

  return (
    <div className="min-h-screen bg-[var(--background)] pb-10">
      <ClientFilters total={total} provinces={provinces} initialViewMode={viewMode} />

      <div className="layout-container px-4 md:px-10 pt-6">
        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)]/50 py-24 shadow-sm">
            <div className="flex size-20 items-center justify-center rounded-full bg-[var(--primary)]/10">
              <svg className="size-10 text-[var(--primary)]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.3-4.3" /></svg>
            </div>
            <p className="mt-5 text-xl font-bold text-[var(--foreground)]">Không tìm thấy bất động sản</p>
            <p className="mt-2 max-w-md text-center text-[var(--muted-foreground)] leading-relaxed">Bộ lọc của bạn hiện không khớp với tin đăng nào. Vui lòng thử thay đổi điều kiện hoặc mở rộng khu vực tìm kiếm.</p>
          </div>
        ) : (
          <>
            <div className={viewMode === "list" ? "flex flex-col gap-4 w-full items-center" : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
              {listings.map((listing) => (
                <div key={listing.id} className={viewMode === "list" ? "w-full max-w-[1000px]" : "w-full"}>
                  <PropertyCard listing={listing} viewMode={viewMode} />
                </div>
              ))}
            </div>

            <ClientPagination total={total} currentPage={page} limit={limit} />
          </>
        )}
      </div>
    </div>
  );
}
