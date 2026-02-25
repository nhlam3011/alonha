import type { Listing, ListingImage } from "@prisma/client";
import type { ListingCardData } from "@/components/listings/PropertyCard";

type ListingWithRelations = Listing & {
  images: (Pick<ListingImage, "url" | "isPrimary">)[];
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function toListingCard(listing: ListingWithRelations): ListingCardData {
  const primaryImage = listing.images.find((i) => i.isPrimary) ?? listing.images[0];
  // Địa chỉ đầy đủ: chi tiết + phường/xã + tỉnh/thành phố (theo schema mới dùng provinceName/wardName)
  const addressParts = [
    listing.address?.trim(),
    listing.wardName?.trim(),
    listing.provinceName?.trim(),
  ].filter(Boolean) as string[];

  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    price: Number(listing.price),
    pricePerSqm: listing.pricePerSqm ? Number(listing.pricePerSqm) : null,
    area: listing.area,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    address: addressParts.length ? addressParts.join(", ") : listing.address ?? null,
    latitude: listing.latitude,
    longitude: listing.longitude,
    imageUrl: primaryImage?.url ?? null,
    listingType: listing.listingType,
    isVip: listing.isVip,
    vipLevel: listing.vipLevel,
    isVerified: listing.isVerified,
    hasVideo: listing.hasVideo,
    has360Tour: listing.has360Tour,
    viewCount: listing.viewCount,
    createdAt: listing.createdAt,
  };
}

export const listingSelectCard = {
  id: true,
  slug: true,
  title: true,
  price: true,
  pricePerSqm: true,
  area: true,
  bedrooms: true,
  bathrooms: true,
  address: true,
  provinceName: true,
  wardName: true,
  latitude: true,
  longitude: true,
  listingType: true,
  isVip: true,
  vipLevel: true,
  isVerified: true,
  hasVideo: true,
  has360Tour: true,
  viewCount: true,
  createdAt: true,
  images: {
    select: { url: true, isPrimary: true },
    orderBy: { order: "asc" },
    take: 1,
  },
} as const;
