import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PropertyCard } from "@/components/listings/PropertyCard";
import { toListingCard } from "@/lib/listings";
import { PhoneContact, ActionButtons, ContactSidebar, AIFeatures, ImageGallery } from "./ClientComponents";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80";

function formatPrice(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} Tỷ VND`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)} Triệu VND`;
  return value.toLocaleString("vi-VN") + " VND";
}

function hasCoordinates(latitude?: number | null, longitude?: number | null): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const listing = await prisma.listing.findUnique({
    where: { slug },
    select: { title: true, description: true, images: { take: 1, orderBy: { order: "asc" } } },
  });

  if (!listing) return { title: "Không tìm thấy bất động sản" };

  return {
    title: `${listing.title} | AloNha`,
    description: listing.description ? listing.description.slice(0, 160) : "Thông tin chi tiết bất động sản trên AloNha.",
    openGraph: {
      title: listing.title,
      description: listing.description?.slice(0, 160) || "",
      images: listing.images[0] ? [listing.images[0].url] : [],
    },
  };
}

export default async function ListingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { order: "asc" } },
      project: true,
      owner: { select: { id: true, name: true, avatar: true, phone: true } },
    },
  });

  if (!listing) {
    notFound();
  }

  if (listing.status !== "APPROVED") {
    const session = await auth();
    const role = session?.user?.role as string | undefined;
    const isAdmin = role === "ADMIN";
    const isOwner = !!session?.user?.id && session.user.id === listing.ownerId;
    if (!isAdmin && !isOwner) {
      notFound();
    }
  } else {
    await prisma.listing.update({
      where: { id: listing.id },
      data: { viewCount: { increment: 1 } },
    });
  }

  const similarListingsDb = await prisma.listing.findMany({
    where: {
      status: "APPROVED",
      publishedAt: { not: null },
      id: { not: listing.id },
      category: listing.category,
      listingType: listing.listingType,
    },
    orderBy: { viewCount: "desc" },
    take: 4,
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
    },
  });
  const similar = similarListingsDb.map(toListingCard);

  const images = listing.images?.length > 0 ? listing.images : [{ url: PLACEHOLDER_IMG, caption: null, isPrimary: true }];
  const addressParts = [
    listing.address?.trim(),
    listing.wardName?.trim(),
    listing.provinceName?.trim(),
  ].filter(Boolean) as string[];
  const addressStr = addressParts.length > 0 ? addressParts.join(", ") : "";
  const hasExactCoordinates = hasCoordinates(listing.latitude, listing.longitude);
  const mapQuery = hasExactCoordinates
    ? `${listing.latitude},${listing.longitude}`
    : addressStr || listing.title;
  const mapEmbedUrl = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`
    : null;
  const googleMapsUrl = mapQuery
    ? hasExactCoordinates
      ? `https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : null;

  const amenities: string[] = [];
  if (Array.isArray(listing.amenities)) {
    amenities.push(...(listing.amenities as string[]));
  }
  if (listing.furniture) amenities.push(listing.furniture);
  if (listing.direction) amenities.push(`Hướng ${listing.direction}`);
  if (listing.legalStatus) amenities.push(listing.legalStatus);
  const allAmenities = [...new Set(amenities)];

  const descShort = listing.description ? (listing.description.length > 300 ? listing.description.slice(0, 300) + "…" : listing.description) : "";
  const descFull = listing.description || "";
  const showMore = descFull.length > 300;
  const isNonPublicStatus = !!listing.status && listing.status !== "APPROVED";
  const statusLabelMap: Record<string, string> = {
    DRAFT: "Nháp",
    PENDING: "Chờ duyệt",
    REJECTED: "Bị từ chối",
    HIDDEN: "Đang ẩn",
    EXPIRED: "Hết hạn",
  };

  const displayPhone = listing.owner?.phone || listing.contactPhone || "";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {isNonPublicStatus && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Tin này đang ở trạng thái <strong>{statusLabelMap[listing.status || ""] || listing.status}</strong>. Chỉ quản trị viên hoặc chủ tin mới xem được.
          </div>
        )}
        {/* Breadcrumbs */}
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-[var(--muted-foreground)]">
          <Link href="/" className="hover:text-[var(--primary)] transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link href="/bat-dong-san" className="hover:text-[var(--primary)] transition-colors">Bất động sản</Link>
          <span>/</span>
          <span className="line-clamp-1 text-[var(--foreground)]">{listing.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* Mosaic gallery */}
            <ImageGallery images={images as any} title={listing.title} />

            {/* Title, price, address */}
            <h1 className="mt-6 text-xl font-bold text-[var(--foreground)] sm:text-2xl">{listing.title}</h1>
            <p className="mt-2 text-2xl font-bold text-[var(--primary)]">
              {Number(listing.price) === 0 ? "Thỏa thuận" : formatPrice(Number(listing.price))}
            </p>
            {listing.pricePerSqm != null && Number(listing.pricePerSqm) > 0 && (
              <p className="text-sm text-[var(--muted-foreground)]">Đơn giá: {formatPrice(Number(listing.pricePerSqm))}/m²</p>
            )}
            {addressStr && (
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <span>📍</span>
                {addressStr}
              </p>
            )}

            {/* 3 stat boxes */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-[var(--primary)]">{listing.bedrooms ?? "—"}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Phòng ngủ</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-[var(--primary)]">{listing.bathrooms ?? "—"}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Phòng tắm</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-[var(--primary)]">{listing.area} m²</p>
                <p className="text-sm text-[var(--muted-foreground)]">Diện tích</p>
              </div>
            </div>

            <AIFeatures description={listing.description || ""} descShort={descShort} descFull={descFull} showMore={showMore} />

            {/* Tiện ích & Đặc điểm */}
            <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Tiện ích & Đặc điểm</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {allAmenities.length > 0 ? (
                  allAmenities.map((a) => (
                    <span key={a} className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm">
                      {a}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--muted-foreground)]">Chưa cập nhật tiện ích.</span>
                )}
              </div>
            </section>

            {/* Vị trí + map */}
            <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Vị trí</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{addressStr || "—"}</p>
              {mapEmbedUrl ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)]">
                  <iframe
                    title={`Bản đồ vị trí ${listing.title}`}
                    src={mapEmbedUrl}
                    className="h-72 w-full border-0 sm:h-[360px]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : (
                <div className="mt-4 flex aspect-video items-center justify-center rounded-xl bg-[var(--background)] text-[var(--muted-foreground)] border border-dashed border-[var(--border)]">
                  Chưa có dữ liệu vị trí để hiển thị bản đồ.
                </div>
              )}
              {!hasExactCoordinates && mapEmbedUrl && (
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Vị trí đang hiển thị theo địa chỉ mô tả, có thể chênh lệch nhỏ so với thực tế.
                </p>
              )}
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  Mở Google Maps
                </a>
              )}
            </section>

            {/* BĐS tương tự */}
            {similar.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Bất động sản tương tự</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {similar.map((s) => (
                    <PropertyCard key={s.id} listing={s} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar: Liên hệ */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white overflow-hidden ring-2 ring-[var(--border)] shadow-md">
                  {listing.owner?.avatar ? (
                    <ImageWithFallback
                      src={listing.owner.avatar}
                      alt={listing.owner?.name || listing.contactName}
                      className="h-full w-full object-cover"
                      fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(listing.owner?.name || listing.contactName)}&background=random`}
                    />
                  ) : (
                    <span className="text-lg font-semibold">{(listing.owner?.name || listing.contactName).charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{listing.owner?.name || listing.contactName}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Môi giới / Chủ tin</p>
                </div>
              </div>

              <PhoneContact displayPhone={displayPhone} />

              <ContactSidebar listingId={listing.id} />

              <div className="mt-4 rounded-lg bg-[var(--background)] p-3 text-xs text-[var(--muted-foreground)] border border-[var(--border)]">
                Bạn đang xem tin đăng của thành viên. Hãy liên hệ trực tiếp hoặc gửi form để được tư vấn. Alonha không thu phí khi bạn liên hệ.
              </div>

              <Link href={`/dat-lich-xem?listingId=${listing.id}`} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--primary)] py-3 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors">
                Đặt lịch xem nhà
              </Link>

              <ActionButtons listingId={listing.id} />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
