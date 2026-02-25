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
    { label: "Loại", render: (item: CompareItem) => (<span className={item.listing.listingType === "SALE" ? "badge-primary" : "badge-sale"}>{item.listing.listingType === "SALE" ? "Bán" : "Cho thuê"}</span>) },
    { label: "Giá", render: (item: CompareItem) => <span className="font-bold text-[var(--primary)]">{formatPrice(item.listing.price)}</span> },
    { label: "Đơn giá/m²", render: (item: CompareItem) => <span className="text-[var(--foreground)]">{item.listing.pricePerSqm ? `${formatPrice(item.listing.pricePerSqm)}/m²` : "—"}</span> },
    { label: "Diện tích", render: (item: CompareItem) => <span className="font-medium text-[var(--foreground)]">{item.listing.area} m²</span> },
    { label: "PN / PT", render: (item: CompareItem) => <span className="text-[var(--foreground)]">{item.listing.bedrooms ?? "—"} / {item.listing.bathrooms ?? "—"}</span> },
    { label: "Hướng", render: (item: CompareItem) => <span className="text-[var(--foreground)]">{item.listing.direction || "—"}</span> },
    { label: "Pháp lý", render: (item: CompareItem) => <span className="text-[var(--foreground)]">{item.listing.legalStatus || "—"}</span> },
    { label: "Địa chỉ", render: (item: CompareItem) => <span className="line-clamp-2 text-xs text-[var(--muted-foreground)]" title={item.listing.address || ""}>{item.listing.address || "—"}</span> },
  ], []);

  return (
    <div className="layout-container py-6 lg:py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/cong-cu" className="group mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)]">
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Công cụ
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="text-2xl font-extrabold text-[var(--foreground)] lg:text-3xl">So sánh bất động sản</h1>
            {items.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--muted-foreground)]">Đang so sánh:</span>
                <span className="font-bold text-[var(--primary)]">{items.length}/{maxItems}</span>
                <div className="h-1.5 w-16 rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${(items.length / maxItems) * 100}%` }} /></div>
              </div>
            )}
          </div>
        </div>

        {/* Add Form */}
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <form onSubmit={handleAddBySlug}>
            <label className="mb-2 block text-xs font-medium text-[var(--muted-foreground)]">Thêm BĐS để so sánh</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted-foreground)]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Dán link hoặc nhập mã tin..."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <button type="submit" disabled={submitting || items.length >= maxItems}
                className="btn-primary whitespace-nowrap !rounded-lg !px-5 !py-2 text-sm disabled:opacity-50">
                {submitting ? "Đang thêm..." : "Thêm"}
              </button>
            </div>
            {notice && <p className="mt-1.5 text-xs font-medium text-[var(--primary)]">{notice}</p>}
            {error && <p className="mt-1.5 text-xs font-medium text-[var(--accent)]">{error}</p>}
          </form>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
            <p className="text-sm text-[var(--muted-foreground)]">Đang tải...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-14 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)]">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h3 className="mb-1 font-semibold text-[var(--foreground)]">Chưa có BĐS nào</h3>
            <p className="mx-auto mb-4 max-w-xs text-sm text-[var(--muted-foreground)]">Thêm tin đăng bằng link hoặc nút so sánh trên trang danh sách</p>
            <Link href="/bat-dong-san" className="btn-outline !py-2 text-sm">Xem danh sách</Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button type="button" onClick={handleClearAll} disabled={!!removingId}
                className="text-xs font-medium text-[var(--accent)] hover:underline disabled:opacity-50">Xóa tất cả</button>
            </div>
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[700px] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 w-32 border-b border-r border-[var(--border)] bg-[var(--background)] p-3 text-left text-xs font-semibold text-[var(--foreground)] shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                        Tiêu chí
                      </th>
                      {items.map((item) => (
                        <th key={item.id} className="min-w-[220px] border-b border-l border-[var(--border)] bg-[var(--background)] p-3 text-left align-top">
                          <div className="group relative">
                            <button onClick={() => handleRemove(item.listingId)}
                              className="absolute -right-1 -top-1 z-20 rounded-full border border-[var(--border)] bg-[var(--card)] p-1 text-[var(--muted-foreground)] opacity-0 shadow-sm hover:text-[var(--accent)] group-hover:opacity-100" title="Xóa">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <Link href={`/bat-dong-san/${item.listing.slug}`} className="block">
                              <div className="relative mb-2 aspect-[16/10] overflow-hidden rounded-lg bg-[var(--muted)]">
                                <Image src={item.listing.imageUrl || PLACEHOLDER_IMAGE} alt={item.listing.title} fill sizes="250px" className="object-cover" />
                              </div>
                              <h3 className="line-clamp-2 text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--primary)]">{item.listing.title}</h3>
                            </Link>
                          </div>
                        </th>
                      ))}
                      {Array.from({ length: Math.max(0, maxItems - items.length) }).map((_, i) => (
                        <th key={`empty-${i}`} className="min-w-[220px] border-b border-l border-[var(--border)] bg-[var(--muted)]/10 p-3">
                          <div className="flex min-h-[120px] items-center justify-center rounded-lg border-2 border-dashed border-[var(--border)] text-xs text-[var(--muted-foreground)]">Trống</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map((row, idx) => (
                      <tr key={row.label} className={idx % 2 === 1 ? "bg-[var(--muted)]/15" : ""}>
                        <th className="sticky left-0 border-r border-[var(--border)] bg-inherit p-3 text-left text-xs font-medium text-[var(--muted-foreground)] shadow-[2px_0_4px_rgba(0,0,0,0.04)]">{row.label}</th>
                        {items.map((item) => (<td key={`${row.label}-${item.id}`} className="border-l border-[var(--border)] p-3 text-sm">{row.render(item)}</td>))}
                        {Array.from({ length: Math.max(0, maxItems - items.length) }).map((_, i) => (<td key={`e-${i}`} className="border-l border-[var(--border)] bg-[var(--muted)]/10 p-3" />))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
