import Link from "next/link";
import { CompareButton } from "@/components/listings/CompareButton";

export type ListingCardData = {
  id: string;
  slug: string;
  title: string;
  price: number;
  pricePerSqm?: number | null;
  area: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl: string | null;
  listingType: "SALE" | "RENT";
  isVip?: boolean;
  vipLevel?: string | null;
  isVerified?: boolean;
  hasVideo?: boolean;
  has360Tour?: boolean;
  viewCount?: number;
  createdAt?: Date;
};

type ViewMode = "grid" | "list";

type Props = {
  listing: ListingCardData;
  viewMode?: ViewMode;
};

const placeholderImage = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80";

function formatPrice(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} tỷ`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)} tr`;
  return value.toLocaleString("vi-VN");
}

function timeAgo(date?: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;
  return `${Math.floor(months / 12)} năm trước`;
}

export function PropertyCardSkeleton({ viewMode = "grid" }: { viewMode?: ViewMode }) {
  if (viewMode === "list") {
    return (
      <article className="flex w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] animate-pulse">
        <div className="relative shrink-0 aspect-square w-28 sm:w-[132px] bg-[var(--muted)]" />
        <div className="min-w-0 flex flex-1 flex-col gap-2 px-3 py-3 sm:py-3.5">
          <div className="h-4 w-3/4 rounded bg-[var(--muted)]" />
          <div className="h-5 w-1/2 rounded bg-[var(--primary-light)]" />
          <div className="mt-2 flex gap-3">
            <div className="h-3 w-16 rounded bg-[var(--muted)]" />
            <div className="h-3 w-12 rounded bg-[var(--muted)]" />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="card flex h-full flex-col overflow-hidden animate-pulse">
      <div className="relative aspect-[4/3] shrink-0 bg-[var(--muted)]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="h-6 w-2/3 rounded bg-[var(--primary-light)]" />
        <div className="mt-3 h-4 w-full rounded bg-[var(--muted)]" />
        <div className="mt-2 h-4 w-3/4 rounded bg-[var(--muted)]" />
        <div className="mt-4 flex gap-2 border-y border-[var(--border)] py-3">
          <div className="h-4 w-16 rounded bg-[var(--muted)]" />
          <div className="h-4 w-12 rounded bg-[var(--muted)]" />
          <div className="h-4 w-12 rounded bg-[var(--muted)]" />
        </div>
        <div className="mt-4 h-3 w-full rounded bg-[var(--muted)]" />
      </div>
    </article>
  );
}

export function PropertyCard({ listing, viewMode = "grid" }: Props) {
  const href = `/bat-dong-san/${listing.slug}`;
  const img = listing.imageUrl || placeholderImage;

  const badges = [];
  if (listing.isVip) badges.push({ label: "VIP", className: "badge-vip" });
  if (listing.isVerified) badges.push({ label: "Đã xác thực", className: "badge-success" });
  if (listing.hasVideo) badges.push({ label: "Video", className: "badge-primary" });
  if (listing.has360Tour) badges.push({ label: "360°", className: "badge-secondary" });

  if (viewMode === "list") {
    return (
      <article className="group flex w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-all duration-300 hover:border-[var(--primary)]/50 hover:shadow-lg hover:-translate-y-0.5">
        <Link
          href={href}
          className="relative shrink-0 overflow-hidden bg-[var(--muted)] aspect-square w-28 sm:w-[132px]"
        >
          <img
            src={img}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className={`absolute bottom-2 right-2 rounded-lg px-2 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm ${listing.listingType === "SALE" ? "bg-emerald-500 shadow-emerald-500/30" : "bg-blue-500 shadow-blue-500/30"}`}>
            {listing.listingType === "SALE" ? "Bán" : "Thuê"}
          </span>
        </Link>
        <div className="min-w-0 flex flex-1 flex-col gap-1.5 px-3 py-3 sm:gap-2 sm:py-3.5">
          <Link href={href} className="block">
            <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-[var(--foreground)] transition-colors duration-200 group-hover:text-[var(--primary)]">
              {listing.title}
            </h3>
            <div className="mb-1 flex items-center gap-2">
              <p className="text-base font-bold text-[var(--primary)] price-vnd">
                {listing.price === 0 ? "Thỏa thuận" : formatPrice(listing.price)}
              </p>
              {listing.pricePerSqm && listing.pricePerSqm > 0 && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  {formatPrice(listing.pricePerSqm)}/m²
                </p>
              )}
            </div>
          </Link>

          <div className="flex flex-col gap-1.5 flex-1 relative">
            <div className="absolute top-0 right-0 z-20 md:opacity-0 md:-translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 opacity-100 translate-y-0 transition-all duration-300 drop-shadow-md">
              <CompareButton listingId={listing.id} compact className="inline-flex items-center justify-center rounded-lg bg-[var(--card)] px-2.5 py-1.5 text-xs font-bold text-[var(--foreground)] transition-transform hover:scale-105 border border-[var(--border)]" />
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1 font-semibold text-[var(--foreground)]">
                <svg className="size-3.5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                {listing.area} m²
              </span>
              {listing.bedrooms != null && (
                <span className="flex items-center gap-1">
                  <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="font-medium text-[var(--foreground)]">{listing.bedrooms}</span> PN
                </span>
              )}
              {listing.bathrooms != null && (
                <span className="flex items-center gap-1">
                  <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="font-medium text-[var(--foreground)]">{listing.bathrooms}</span> WC
                </span>
              )}
            </div>

            {listing.address && (
              <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 mt-auto pt-1">
                <svg className="inline-block mr-1 h-3.5 w-3.5 text-[var(--primary)] align-text-bottom" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.address}
              </p>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 hover:border-[var(--primary)]/30">
      {/* Image Container */}
      <Link href={href} className="relative aspect-[4/3] shrink-0 overflow-hidden bg-[var(--muted)]">
        <img
          src={img}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {badges.map((b, idx) => (
            <span
              key={b.label}
              className={`${b.className} shadow-lg animate-fade-in-up`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {b.label}
            </span>
          ))}
        </div>

        {/* Type Badge */}
        <span className="absolute bottom-3 left-3 rounded-lg bg-[var(--card)] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--foreground)] shadow-lg transition-transform duration-300 group-hover:scale-105">
          {listing.listingType === "SALE" ? "Đang bán" : "Cho thuê"}
        </span>

        {/* Compare Button */}
        <div className="absolute right-3 bottom-3 z-20 md:opacity-0 md:translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0 opacity-100 translate-x-0 transition-all duration-300 shadow-lg">
          <CompareButton
            listingId={listing.id}
            compact
            className="inline-flex items-center justify-center rounded-lg bg-[var(--card)] px-2.5 py-1.5 text-xs font-bold text-[var(--foreground)] transition-transform hover:scale-105 border border-[var(--border)]"
          />
        </div>
      </Link>

      {/* Content */}
      <Link href={href} className="flex min-h-0 flex-1 flex-col p-5">
        {/* Price */}
        <div className="mb-2 flex items-baseline gap-2">
          <p className="text-xl font-extrabold text-[var(--primary)] price-vnd tracking-tight">
            {listing.price === 0 ? "Thỏa thuận" : formatPrice(listing.price)}
          </p>
          {listing.pricePerSqm && listing.pricePerSqm > 0 && (
            <p className="text-xs text-[var(--muted-foreground)]">
              ~{formatPrice(listing.pricePerSqm)}/m²
            </p>
          )}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 min-h-[2.75rem] text-[15px] font-semibold leading-snug text-[var(--foreground)] transition-colors duration-200 group-hover:text-[var(--primary)]">
          {listing.title}
        </h3>

        {/* Features & Address */}
        <div className="mt-4 flex flex-col border-y border-[var(--border)] py-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
              <svg className="size-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {listing.area} m²
            </span>
            {listing.bedrooms != null && (
              <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-medium text-[var(--foreground)]">{listing.bedrooms}</span>
                <span className="text-xs">PN</span>
              </span>
            )}
            {listing.bathrooms != null && (
              <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="font-medium text-[var(--foreground)]">{listing.bathrooms}</span>
                <span className="text-xs">WC</span>
              </span>
            )}
          </div>

          {listing.address && (
            <div className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-1 text-left pr-2">
              <svg className="inline-block mr-1.5 size-4 text-[var(--primary)] align-text-bottom" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {listing.address}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-3">
          <span className="text-xs text-[var(--muted-foreground)] font-medium flex items-center gap-1">
            <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timeAgo(listing.createdAt)}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] transition-all duration-200 group-hover:gap-2">
            Xem chi tiết
            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </span>
        </div>
      </Link>
    </article>
  );
}
