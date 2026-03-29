"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type CompareListing = {
  id: string; slug: string; title: string; listingType: "SALE" | "RENT";
  price: number; pricePerSqm: number | null; area: number;
  bedrooms: number | null; bathrooms: number | null; imageUrl: string | null;
  status: string; address: string | null; location: string | null;
  direction: string | null; legalStatus: string | null; furniture: string | null;
  projectName: string | null; viewCount: number; createdAt: string;
};
type CompareItem = { id: string; listingId: string; order: number; listing: CompareListing };
type CompareResponse = { data?: CompareItem[]; total?: number; maxItems?: number; error?: string; message?: string };

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80";

function formatPrice(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value === 0) return "Thỏa thuận";
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} tỷ`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)} triệu`;
  return value.toLocaleString("vi-VN");
}

function parseSlug(raw: string): string {
  const input = raw.trim();
  if (!input) return "";
  if (input.startsWith("http://") || input.startsWith("https://")) {
    try {
      const url = new URL(input);
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("bat-dong-san");
      if (idx >= 0 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);
      return decodeURIComponent(parts[parts.length - 1] ?? "");
    } catch { return ""; }
  }
  const cleaned = input.replace(/^\/+|\/+$/g, "");
  if (cleaned.includes("/")) {
    const parts = cleaned.split("/").filter(Boolean);
    const idx = parts.indexOf("bat-dong-san");
    if (idx >= 0 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);
    return decodeURIComponent(parts[parts.length - 1] ?? "");
  }
  return decodeURIComponent(cleaned);
}

export default function ComparePage() {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [maxItems, setMaxItems] = useState(3);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCompare = useCallback(async (signal?: AbortSignal) => {
    if (!signal?.aborted) setLoading(true);
    try {
      const response = await fetch("/api/compare", { signal });
      const data = (await response.json().catch(() => ({}))) as CompareResponse;
      if (signal?.aborted) return;
      if (!response.ok) { setError(data.error || "Không thể tải danh sách."); setItems([]); return; }
      setItems(Array.isArray(data.data) ? data.data : []);
      setMaxItems(data.maxItems ?? 3);
      setError(null);
    } catch {
      if (!signal?.aborted) { setError("Không thể tải danh sách."); setItems([]); }
    } finally { if (!signal?.aborted) setLoading(false); }
  }, []);

  useEffect(() => { const c = new AbortController(); void loadCompare(c.signal); return () => c.abort(); }, [loadCompare]);
  useEffect(() => { const sync = () => { void loadCompare(); }; window.addEventListener("compare-updated", sync); return () => window.removeEventListener("compare-updated", sync); }, [loadCompare]);

  async function handleAddBySlug(e: React.FormEvent) {
    e.preventDefault();
    const slug = parseSlug(input);
    if (!slug) { setError("Nhập slug hoặc link hợp lệ."); return; }
    setSubmitting(true); setNotice(null); setError(null);
    try {
      const response = await fetch("/api/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
      const data = (await response.json().catch(() => ({}))) as CompareResponse;
      if (!response.ok) { setError(data.error || "Không thể thêm."); return; }
      setInput(""); setNotice(data.message || "Đã thêm.");
      window.dispatchEvent(new CustomEvent("compare-updated")); await loadCompare();
    } catch { setError("Không thể thêm."); } finally { setSubmitting(false); }
  }

  async function handleRemove(listingId: string) {
    if (removingId) return; setRemovingId(listingId); setError(null);
    try {
      const response = await fetch(`/api/compare?listingId=${encodeURIComponent(listingId)}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as CompareResponse;
      if (!response.ok) { setError(data.error || "Không thể xóa."); return; }
      window.dispatchEvent(new CustomEvent("compare-updated")); await loadCompare();
    } catch { setError("Không thể xóa."); } finally { setRemovingId(null); }
  }

  async function handleClearAll() {
    if (!items.length || removingId) return;
    if (!window.confirm("Xóa toàn bộ?")) return;
    setRemovingId("all"); setError(null);
    try {
      const response = await fetch("/api/compare", { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as CompareResponse;
      if (!response.ok) { setError(data.error || "Không thể xóa."); return; }
      setNotice("Đã xóa."); window.dispatchEvent(new CustomEvent("compare-updated")); await loadCompare();
    } catch { setError("Không thể xóa."); } finally { setRemovingId(null); }
  }

  const compareRows = useMemo(() => [
    { label: "Loại", render: (item: CompareItem) => (<span className={item.listing.listingType === "SALE" ? "badge-sale" : "badge-rent"}>{item.listing.listingType === "SALE" ? "Bán" : "Cho thuê"}</span>) },
    { label: "Giá", render: (item: CompareItem) => <span className="text-base font-bold text-[var(--primary)]">{formatPrice(item.listing.price)}</span> },
    { label: "Đơn giá/m²", render: (item: CompareItem) => <span className="text-sm text-[var(--foreground)]">{item.listing.pricePerSqm ? `${formatPrice(item.listing.pricePerSqm)}/m²` : "—"}</span> },
    { label: "Diện tích", render: (item: CompareItem) => <span className="text-sm font-medium text-[var(--foreground)]">{item.listing.area} m²</span> },
    { label: "Phòng ngủ / Tắm", render: (item: CompareItem) => <span className="text-sm text-[var(--foreground)]">{item.listing.bedrooms ?? "—"} / {item.listing.bathrooms ?? "—"}</span> },
    { label: "Hướng", render: (item: CompareItem) => <span className="text-sm text-[var(--foreground)]">{item.listing.direction || "—"}</span> },
    { label: "Pháp lý", render: (item: CompareItem) => <span className="text-sm text-[var(--foreground)]">{item.listing.legalStatus || "—"}</span> },
    { label: "Địa chỉ", render: (item: CompareItem) => <span className="line-clamp-2 text-xs text-[var(--muted-foreground)]" title={item.listing.address || ""}>{item.listing.address || "—"}</span> },
  ], []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">So sánh bất động sản</h1>
        <p className="mt-2 text-sm sm:text-base text-[var(--muted-foreground)]">Cùng lúc đối chiếu các tin đăng để tìm ra lựa chọn tối ưu.</p>
      </div>

      {/* Add Form */}
      <div className="card-container">
        <div className="card-body">
          <form onSubmit={handleAddBySlug}>
            <label className="mb-2 block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Thêm BĐS để so sánh</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted-foreground)]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Dán link hoặc nhập mã tin..."
                  className="form-input !pl-9 !py-2.5 text-sm" />
              </div>
              <button type="submit" disabled={submitting || items.length >= maxItems}
                className="btn-primary !rounded-lg !px-5 !py-2.5 text-sm whitespace-nowrap disabled:opacity-50 shrink-0">
                {submitting ? "Đang thêm..." : "Thêm"}
              </button>
            </div>
            {notice && <p className="mt-1.5 text-xs font-medium text-emerald-600">{notice}</p>}
            {error && <p className="mt-1.5 text-xs font-medium text-[var(--destructive)]">{error}</p>}
          </form>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card-container">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
            <p className="text-sm text-[var(--muted-foreground)]">Đang tải...</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="card-container">
          <div className="empty-state py-16">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)]">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h3 className="empty-state-title">Chưa có BĐS nào</h3>
            <p className="empty-state-description">Thêm tin đăng bằng link hoặc nút so sánh trên trang danh sách</p>
            <Link href="/bat-dong-san" className="btn-outline !py-2 text-sm mt-4">Xem danh sách</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)]">Chi tiết so sánh</h2>
            <button type="button" onClick={handleClearAll} disabled={!!removingId}
              className="flex items-center gap-1 text-sm font-medium text-[var(--destructive)] hover:underline disabled:opacity-50">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Xóa tất cả
            </button>
          </div>
          <div className="card-container overflow-hidden">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[640px] sm:min-w-0 border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 w-[120px] sm:w-[140px] border-b border-r border-[var(--border)] bg-[var(--background)] p-3 sm:p-4 text-left text-xs sm:text-sm font-bold text-[var(--foreground)]">
                      Tiêu chí
                    </th>
                    {items.map((item) => (
                      <th key={item.id} className="w-[200px] sm:w-[260px] border-b border-l border-[var(--border)] bg-[var(--background)] p-3 sm:p-4 text-left align-top">
                        <div className="group relative flex h-full flex-col">
                          <button onClick={() => handleRemove(item.listingId)}
                            className="absolute -right-1 -top-1 z-20 rounded-full bg-[var(--background)] p-1.5 text-[var(--muted-foreground)] opacity-0 shadow-sm transition-opacity hover:bg-[var(--destructive)] hover:text-white group-hover:opacity-100" title="Xóa">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          <Link href={`/bat-dong-san/${item.listing.slug}`} className="flex flex-col gap-2">
                            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-[var(--muted)]">
                              <Image src={item.listing.imageUrl || PLACEHOLDER_IMAGE} alt={item.listing.title} fill sizes="(max-width: 768px) 100vw, 260px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                            </div>
                            <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold leading-tight text-[var(--foreground)] group-hover:text-[var(--primary)]">{item.listing.title}</h3>
                          </Link>
                        </div>
                      </th>
                    ))}
                    {Array.from({ length: Math.max(0, maxItems - items.length) }).map((_, i) => (
                      <th key={`empty-${i}`} className="w-[200px] sm:w-[260px] border-b border-l border-[var(--border)] bg-[var(--muted)]/10 p-3 sm:p-4">
                        <div className="flex h-[120px] sm:h-[160px] w-full items-center justify-center rounded-lg border-2 border-dashed border-[var(--border)] text-xs sm:text-sm font-medium text-[var(--muted-foreground)]">Cột trống</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {compareRows.map((row) => (
                    <tr key={row.label} className="bg-[var(--background)] transition-colors hover:bg-[var(--muted)]/20">
                      <th className="sticky left-0 z-10 border-r border-[var(--border)] bg-[var(--background)] p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-[var(--muted-foreground)]">{row.label}</th>
                      {items.map((item) => (<td key={`${row.label}-${item.id}`} className="border-l border-[var(--border)] p-3 sm:p-4 text-sm">{row.render(item)}</td>))}
                      {Array.from({ length: Math.max(0, maxItems - items.length) }).map((_, i) => (<td key={`e-${i}`} className="border-l border-[var(--border)] bg-[var(--muted)]/10 p-3 sm:p-4" />))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
