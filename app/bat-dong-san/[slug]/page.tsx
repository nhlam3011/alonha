"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { PropertyCard } from "@/components/listings/PropertyCard";
import type { ListingCardData } from "@/components/listings/PropertyCard";

function formatPrice(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} Tỷ VND`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)} Triệu VND`;
  return value.toLocaleString("vi-VN") + " VND";
}

function hasCoordinates(latitude?: number | null, longitude?: number | null): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude);
}

type ListingDetail = {
  id: string;
  slug: string;
  title: string;
  status?: string;
  description: string | null;
  listingType: string;
  price: number;
  pricePerSqm: number | null;
  area: number;
  bedrooms: number | null;
  bathrooms: number | null;
  direction: string | null;
  legalStatus: string | null;
  furniture: string | null;
  amenities: string[] | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  showPhone: boolean;
  isVip: boolean;
  isVerified: boolean;
  hasVideo: boolean;
  has360Tour: boolean;
  viewCount: number;
  images: { url: string; caption: string | null; isPrimary: boolean }[];
  province: { id: string; name: string } | null;
  district: { id: string; name: string } | null;
  ward: { id: string; name: string } | null;
  owner?: { id: string; name: string; avatar: string | null; phone?: string | null } | null;
};

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80";

export default function ListingDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [similar, setSimilar] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [saved, setSaved] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compared, setCompared] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summarizedDesc, setSummarizedDesc] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [analyzing, setAnalyzing] = useState(false);
  const [sentiment, setSentiment] = useState<{
    sentiment: string; score: number; keyPoints: string[]; summary: string;
  } | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/listings/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setListing(data);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!listing?.id) return;
    fetch(`/api/ai/recommend?listingId=${listing.id}&limit=4`)
      .then((r) => r.json())
      .then((res) => res.data && setSimilar(res.data))
      .catch(() => { });
  }, [listing?.id]);

  async function toggleSave() {
    if (!listing?.id) return;
    if (!session) {
      window.location.href = `/dang-nhap?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (saved) {
      await fetch(`/api/favorites?listingId=${listing.id}`, { method: "DELETE" });
      setSaved(false);
    } else {
      await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId: listing.id }) });
      setSaved(true);
    }
  }

  async function addToCompare() {
    if (!listing?.id || compareLoading) return;
    setCompareLoading(true);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Không thể thêm vào so sánh.");
        return;
      }
      setCompared(true);
      window.dispatchEvent(new CustomEvent("compare-updated"));
    } catch {
      alert("Không thể thêm vào so sánh.");
    } finally {
      setCompareLoading(false);
    }
  }

  async function submitContact(e: React.FormEvent) {
    e.preventDefault();
    if (!listing?.id) return;
    setFormLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, name: form.name, phone: form.phone, message: form.message || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setFormSent(true);
        setForm({ name: "", phone: "", message: "" });
      } else alert(data.error || "Gửi thất bại");
    } finally {
      setFormLoading(false);
    }
  }

  if (loading || !listing) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        {loading ? <span className="text-[var(--muted-foreground)]">Đang tải...</span> : <span className="text-[var(--muted-foreground)]">Không tìm thấy tin.</span>}
      </div>
    );
  }

  const images = listing.images?.length ? listing.images : [{ url: PLACEHOLDER_IMG, caption: null, isPrimary: true }];
  // Địa chỉ đầy đủ: chi tiết + phường/xã + quận/huyện + tỉnh/thành phố
  const addressParts = [
    listing.address?.trim(),
    listing.ward?.name,
    listing.district?.name,
    listing.province?.name,
  ].filter(Boolean) as string[];
  const addressStr = addressParts.length ? addressParts.join(", ") : "";
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
  if (Array.isArray(listing.amenities) && listing.amenities.length) amenities.push(...listing.amenities);
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
          <Link href="/" className="hover:text-[var(--primary)]">Trang chủ</Link>
          <span>/</span>
          <Link href="/bat-dong-san" className="hover:text-[var(--primary)]">Bất động sản</Link>
          <span>/</span>
          <span className="line-clamp-1 text-[var(--foreground)]">{listing.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* Mosaic gallery: 1 large + 4 small */}
            <div className="relative grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              <div className="relative col-span-4 row-span-2 min-h-[240px] sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:h-full">
                <div className="relative aspect-[4/3] h-full min-h-[240px] sm:absolute sm:inset-0">
                  {/* Dùng <img> để chấp nhận mọi domain ảnh mà không phải cấu hình next/image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[0]?.url ?? PLACEHOLDER_IMG}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <Link
                  href="#"
                  className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-3 py-2 text-sm font-medium text-white hover:bg-black/80 sm:bottom-4 sm:right-4"
                >
                  Xem tất cả ảnh
                </Link>
              </div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="relative aspect-[4/3] hidden sm:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[i]?.url ?? PLACEHOLDER_IMG}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Title, price, address */}
            <h1 className="mt-6 text-xl font-bold text-[var(--foreground)] sm:text-2xl">{listing.title}</h1>
            <p className="mt-2 text-2xl font-bold text-[var(--primary)]">
              {listing.price === 0 ? "Thỏa thuận" : formatPrice(listing.price)}
            </p>
            {listing.pricePerSqm != null && listing.pricePerSqm > 0 && (
              <p className="text-sm text-[var(--muted-foreground)]">Đơn giá: {formatPrice(listing.pricePerSqm)}/m²</p>
            )}
            {addressStr && (
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <span>📍</span>
                {addressStr}
              </p>
            )}

            {/* 3 stat boxes */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
                <p className="text-2xl font-bold text-[var(--primary)]">{listing.bedrooms ?? "—"}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Phòng ngủ</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
                <p className="text-2xl font-bold text-[var(--primary)]">{listing.bathrooms ?? "—"}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Phòng tắm</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
                <p className="text-2xl font-bold text-[var(--primary)]">{listing.area} m²</p>
                <p className="text-sm text-[var(--muted-foreground)]">Diện tích</p>
              </div>
            </div>

            {/* Mô tả chi tiết */}
            <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Mô tả chi tiết</h2>
                  {summarizedDesc && (
                    <span className="rounded-full bg-[var(--primary-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--primary)]">
                      AI
                    </span>
                  )}
                </div>
                {listing.description && listing.description.length > 100 && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (summarizedDesc) {
                        setShowSummary(!showSummary);
                        return;
                      }
                      setSummarizing(true);
                      try {
                        const res = await fetch("/api/nlp/summarize", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ description: listing.description, maxLength: 300 }),
                        });
                        const data = await res.json();
                        if (data.summary) {
                          setSummarizedDesc(data.summary);
                          setShowSummary(true);
                        }
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setSummarizing(false);
                      }
                    }}
                    disabled={summarizing}
                    className="flex items-center gap-1 rounded-lg bg-[var(--primary-light)] px-3 py-1.5 text-xs font-medium text-[var(--primary)] hover:opacity-80 disabled:opacity-50"
                  >
                    {summarizing ? "Đang tóm tắt..." : summarizedDesc ? (showSummary ? "Xem đầy đủ" : "Xem tóm tắt") : "Tóm tắt AI"}
                  </button>
                )}
              </div>
              <div className="mt-3 text-[var(--muted-foreground)]">
                {showSummary && summarizedDesc ? (
                  <p className="whitespace-pre-line">{summarizedDesc}</p>
                ) : (
                  <>
                    {descExpanded || !showMore ? (
                      <p className="whitespace-pre-line">{descFull || "Chưa có mô tả."}</p>
                    ) : (
                      <p className="whitespace-pre-line">{descShort}</p>
                    )}
                    {showMore && (
                      <button
                        type="button"
                        onClick={() => setDescExpanded(true)}
                        className="mt-2 text-sm font-medium text-[var(--primary)] hover:underline"
                      >
                        Xem thêm
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* NLP Sentiment Analysis */}
            {listing.description && listing.description.length > 50 && (
              <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">Phân tích NLP</h2>
                    <span className="rounded-full bg-[var(--primary-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--primary)]">AI</span>
                  </div>
                  {!sentiment && (
                    <button
                      type="button"
                      disabled={analyzing}
                      onClick={async () => {
                        setAnalyzing(true);
                        try {
                          const res = await fetch("/api/nlp/sentiment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ text: listing.description }),
                          });
                          const data = await res.json();
                          if (data.sentiment) setSentiment(data);
                        } catch (e) { console.error(e); }
                        finally { setAnalyzing(false); }
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-[var(--primary-light)] px-3 py-1.5 text-xs font-medium text-[var(--primary)] hover:opacity-80 disabled:opacity-50"
                    >
                      {analyzing ? (
                        <><span className="size-3 animate-spin rounded-full border border-[var(--primary)] border-t-transparent" /> Đang phân tích...</>
                      ) : (
                        <>🧠 Phân tích cảm xúc</>
                      )}
                    </button>
                  )}
                </div>

                {sentiment ? (
                  <div className="mt-4 space-y-4">
                    {/* Score bar */}
                    <div className="flex items-center gap-3">
                      <span className={sentiment.sentiment === "POSITIVE" ? "badge-success" : sentiment.sentiment === "NEGATIVE" ? "badge-destructive" : "badge"}>
                        {sentiment.sentiment === "POSITIVE" ? "Tích cực" : sentiment.sentiment === "NEGATIVE" ? "Tiêu cực" : "Trung tính"}
                      </span>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-[var(--muted)]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.round(((sentiment.score + 1) / 2) * 100)}%`,
                              backgroundColor: sentiment.score > 0.3 ? "var(--primary)" : sentiment.score < -0.3 ? "var(--accent)" : "var(--muted-foreground)",
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[var(--foreground)]">{(sentiment.score * 100).toFixed(0)}%</span>
                    </div>

                    {/* Key points */}
                    {sentiment.keyPoints.length > 0 && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {sentiment.keyPoints.map((point, i) => {
                          const isPositive = point.startsWith("positive:");
                          const text = point.replace(/^(positive|negative):/, "").trim();
                          return (
                            <div key={i} className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-2.5">
                              <span className={`mt-0.5 shrink-0 text-xs ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                                {isPositive ? "✓" : "✕"}
                              </span>
                              <span className="text-xs text-[var(--foreground)]">{text}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Summary */}
                    {sentiment.summary && (
                      <p className="rounded-lg bg-[var(--muted)] p-3 text-sm leading-relaxed text-[var(--foreground)]">
                        {sentiment.summary}
                      </p>
                    )}
                  </div>
                ) : !analyzing ? (
                  <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                    Phân tích cảm xúc mô tả tin đăng bằng AI để xác định điểm mạnh, điểm yếu.
                  </p>
                ) : null}
              </section>
            )}

            {/* Tiện ích & Đặc điểm */}
            <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Tiện ích & Đặc điểm</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {allAmenities.map((a) => (
                  <span key={a} className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm">
                    {a}
                  </span>
                ))}
              </div>
            </section>

            {/* Vị trí + map */}
            <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
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
                <div className="mt-4 flex aspect-video items-center justify-center rounded-xl bg-[var(--background)] text-[var(--muted-foreground)]">
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
            <div className="sticky top-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white overflow-hidden ring-2 ring-[var(--border)]">
                  {listing.owner?.avatar ? (
                    <img src={listing.owner.avatar} alt={listing.owner?.name || listing.contactName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-semibold">{(listing.owner?.name || listing.contactName).charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{listing.owner?.name || listing.contactName}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Môi giới / Chủ tin</p>
                </div>
              </div>

              {(() => {
                const displayPhone = listing.owner?.phone || listing.contactPhone || "";
                if (!displayPhone) return null;
                const maskedPhone = displayPhone.length >= 7 ? displayPhone.slice(0, 4) + " *** ***" : displayPhone;

                return showPhone ? (
                  <a href={`tel:${displayPhone}`} className="mt-4 block text-center text-lg font-semibold text-[var(--primary)]">
                    {displayPhone}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!session) {
                        window.location.href = `/dang-nhap?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
                        return;
                      }
                      setShowPhone(true);
                    }}
                    className="mt-4 w-full rounded-xl bg-[var(--primary)] py-3 font-semibold text-white hover:bg-[var(--primary-hover)]"
                  >
                    {maskedPhone} (Hiện số)
                  </button>
                );
              })()}

              {(() => {
                const displayPhone = listing.owner?.phone || listing.contactPhone || "";
                if (!displayPhone) return null;
                return (
                  <a
                    href={`https://zalo.me/${displayPhone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-3 font-medium hover:bg-[var(--background)]"
                  >
                    Chat Zalo
                  </a>
                );
              })()}

              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">HOẶC LIÊN HỆ LẠI</p>
                {formSent ? (
                  <p className="mt-2 text-sm text-[var(--primary)]">Đã gửi yêu cầu. Chúng tôi sẽ liên hệ bạn sớm.</p>
                ) : (
                  <form onSubmit={submitContact} className="mt-3 space-y-3">
                    <input
                      type="text"
                      placeholder="Họ tên"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="form-input"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Số điện thoại"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="form-input"
                      required
                    />
                    <textarea
                      placeholder="Tôi quan tâm..."
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      rows={2}
                      className="form-input"
                    />
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="btn-primary w-full justify-center py-3"
                    >
                      {formLoading ? "Đang gửi..." : "Gửi yêu cầu"}
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-4 rounded-lg bg-[var(--background)] p-3 text-xs text-[var(--muted-foreground)]">
                Bạn đang xem tin đăng của thành viên. Hãy liên hệ trực tiếp hoặc gửi form để được tư vấn. Alonha không thu phí khi bạn liên hệ.
              </div>

              <Link href={`/dat-lich-xem?listingId=${listing.id}`} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--primary)] py-3 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-light)]">
                Đặt lịch xem nhà
              </Link>
              <button type="button" onClick={toggleSave} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-3 text-sm font-medium hover:bg-[var(--background)]">
                {saved ? "Đã lưu" : "Lưu tin yêu thích"}
              </button>
              <button
                type="button"
                onClick={addToCompare}
                disabled={compareLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-3 text-sm font-medium hover:bg-[var(--background)] disabled:opacity-70"
              >
                {compareLoading ? "Đang thêm..." : compared ? "Đã thêm so sánh" : "Thêm vào so sánh"}
              </button>
              <Link href="/cong-cu/so-sanh" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-3 text-sm font-medium hover:bg-[var(--background)]">
                Xem danh sách so sánh
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
