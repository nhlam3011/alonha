"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { PropertyCard } from "@/components/listings/PropertyCard";
import type { ListingCardData } from "@/components/listings/PropertyCard";

type Province = { id: string; code?: string; name: string };
type Ward = { code: number; name: string; province_code: number };

const CATEGORY_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "can-ho-chung-cu", label: "Căn hộ" },
  { value: "nha-rieng", label: "Nhà riêng" },
  { value: "nha-mat-phong", label: "Nhà phố" },
  { value: "dat-nen", label: "Đất nền" },
  { value: "biet-thu", label: "Biệt thự" },
  { value: "kho-nha-xuong", label: "Kho xưởng" },
];

const PRICE_PRESETS = [
  { label: "Tất cả", min: "", max: "" },
  { label: "< 2 tỷ", min: "", max: "2000000000" },
  { label: "2 - 5 tỷ", min: "2000000000", max: "5000000000" },
  { label: "5 - 10 tỷ", min: "5000000000", max: "10000000000" },
  { label: "> 10 tỷ", min: "10000000000", max: "" },
];

const AREA_PRESETS = [
  { label: "Tất cả", min: "", max: "" },
  { label: "< 50 m²", min: "", max: "50" },
  { label: "50-100 m²", min: "50", max: "100" },
  { label: "100-200 m²", min: "100", max: "200" },
  { label: "> 200 m²", min: "200", max: "" },
];

const BEDROOM_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "price-asc", label: "Giá thấp nhất" },
  { value: "price-desc", label: "Giá cao nhất" },
  { value: "area-asc", label: "Diện tích nhỏ" },
  { value: "area-desc", label: "Diện tích lớn" },
];

const DIRECTION_OPTIONS = ["Đông", "Tây", "Nam", "Bắc", "Đông Nam", "Đông Bắc", "Tây Nam", "Tây Bắc"];
const LEGAL_OPTIONS = ["Sổ đỏ", "Sổ hồng", "Hợp đồng mua bán", "Đang chờ sổ", "Giấy tờ hợp lệ"];

function compactPrice(min?: string, max?: string) {
  const fmt = (v?: string) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (n >= 1e9) return `${(n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 1)} tỷ`;
    if (n >= 1e6) return `${Math.round(n / 1e6)} tr`;
    return n.toLocaleString("vi-VN");
  };
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  if (max) return `Đến ${fmt(max)}`;
  return "";
}

import { UnifiedSearchHeader } from "@/components/filters/UnifiedSearchHeader";
import { UnifiedFilterBar } from "@/components/filters/UnifiedFilterBar";

function ListingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";
  const aiQuery = searchParams.get("aiQuery") ?? "";
  const loaiHinh = searchParams.get("loaiHinh") ?? searchParams.get("loai-hinh") ?? "sale";
  const category = searchParams.get("category") ?? "";
  const provinceIdFromQuery = searchParams.get("provinceId") ?? "";
  const wardId = searchParams.get("wardId") ?? "";
  const projectId = searchParams.get("projectId") ?? "";

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [selectedProvinceId, setSelectedProvinceId] = useState(provinceIdFromQuery);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "");
  const [areaMin, setAreaMin] = useState(searchParams.get("areaMin") ?? "");
  const [areaMax, setAreaMax] = useState(searchParams.get("areaMax") ?? "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") ?? "");
  const [bathrooms, setBathrooms] = useState(searchParams.get("bathrooms") ?? "");
  const [direction, setDirection] = useState(searchParams.get("direction") ?? "");
  const [legalStatus, setLegalStatus] = useState(searchParams.get("legalStatus") ?? "");
  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWardId, setSelectedWardId] = useState(wardId);
  const displayQuery = keyword || aiQuery;

  useEffect(() => {
    fetch("/api/provinces")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setProvinces(data))
      .catch(() => { });
  }, []);

  useEffect(() => { setSelectedWardId(wardId); }, [wardId]);

  useEffect(() => {
    if (!selectedProvinceId) { setWards([]); setSelectedWardId(""); return; }
    const province = provinces.find((p) => p.id === selectedProvinceId);
    const code = province?.code ?? selectedProvinceId;
    fetch(`/api/wards?provinceCode=${encodeURIComponent(String(code))}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setWards(data); else setWards([]); })
      .catch(() => setWards([]));
  }, [selectedProvinceId, provinces]);

  const fetchListings = useCallback(async (signal: AbortSignal) => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (aiQuery) params.set("aiQuery", aiQuery);
    params.set("loaiHinh", loaiHinh);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedProvinceId) {
      const province = provinces.find((p) => p.id === selectedProvinceId);
      params.set("provinceId", province?.code ?? selectedProvinceId);
    }
    if (selectedWardId) params.set("wardId", selectedWardId);
    if (projectId) params.set("projectId", projectId);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "12");
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    if (areaMin) params.set("areaMin", areaMin);
    if (areaMax) params.set("areaMax", areaMax);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (bathrooms) params.set("bathrooms", bathrooms);
    if (direction) params.set("direction", direction);
    if (legalStatus) params.set("legalStatus", legalStatus);
    setLoading(true);
    try {
      const res = await fetch(`/api/listings?${params.toString()}`, { signal });
      const json = await res.json();
      if (signal.aborted) return;
      if (json.data) { setListings(json.data); setTotal(json.total ?? json.data.length); }
      else { setListings([]); setTotal(0); }
    } catch {
      if (!signal.aborted) { setListings([]); setTotal(0); }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [keyword, aiQuery, loaiHinh, selectedCategory, selectedProvinceId, selectedWardId, projectId, sort, page, priceMin, priceMax, areaMin, areaMax, bedrooms, bathrooms, direction, legalStatus, provinces]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const controller = new AbortController();
    debounceRef.current = setTimeout(() => { void fetchListings(controller.signal); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); controller.abort(); };
  }, [fetchListings]);

  const totalPages = Math.ceil(total / 12) || 1;

  const activeChips: { label: string; onClear: () => void }[] = [];
  const selectedProvince = provinces.find((p) => p.id === selectedProvinceId);
  if (selectedProvince) activeChips.push({ label: selectedProvince.name, onClear: () => { setSelectedProvinceId(""); setSelectedWardId(""); setPage(1); } });
  if (selectedCategory) activeChips.push({ label: CATEGORY_OPTIONS.find((c) => c.value === selectedCategory)?.label ?? selectedCategory, onClear: () => { setSelectedCategory(""); setPage(1); } });
  if (priceMin || priceMax) activeChips.push({ label: `Giá: ${compactPrice(priceMin, priceMax)}`, onClear: () => { setPriceMin(""); setPriceMax(""); setPage(1); } });
  if (areaMin || areaMax) activeChips.push({ label: `DT: ${areaMin || "0"}-${areaMax || "∞"} m²`, onClear: () => { setAreaMin(""); setAreaMax(""); setPage(1); } });
  if (bedrooms) activeChips.push({ label: `${bedrooms}+ PN`, onClear: () => { setBedrooms(""); setPage(1); } });
  if (direction) activeChips.push({ label: `Hướng ${direction}`, onClear: () => { setDirection(""); setPage(1); } });
  if (legalStatus) activeChips.push({ label: legalStatus, onClear: () => { setLegalStatus(""); setPage(1); } });

  function resetAll() {
    setSelectedProvinceId(""); setSelectedWardId(""); setSelectedCategory("");
    setPriceMin(""); setPriceMax(""); setAreaMin(""); setAreaMax("");
    setBedrooms(""); setBathrooms(""); setDirection(""); setLegalStatus(""); setPage(1);
    router.push("/bat-dong-san");
  }

  // Helpers for building "Xem bản đồ" link
  function buildMapLink() {
    const p = new URLSearchParams();
    if (displayQuery) p.set("keyword", displayQuery);
    p.set("loaiHinh", loaiHinh);
    if (selectedCategory) p.set("category", selectedCategory);
    if (priceMin) p.set("priceMin", priceMin);
    if (priceMax) p.set("priceMax", priceMax);
    if (selectedProvinceId) { const prov = provinces.find((pp) => pp.id === selectedProvinceId); p.set("provinceId", prov?.code ?? selectedProvinceId); }
    if (selectedWardId) p.set("wardId", selectedWardId);
    if (sort !== "newest") p.set("sort", sort);
    return `/tim-kiem?${p.toString()}`;
  }

  const handleAiSearch = (val: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (val) p.set("keyword", val);
    else p.delete("keyword");
    router.push(`/bat-dong-san?${p.toString()}`);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-10">
      {/* ─── Header & Filters Sticky ─── */}
      <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)] shadow-sm">
        <div className="layout-container px-4 md:px-10">

          <UnifiedSearchHeader
            tabs={[
              { value: "sale", label: "Mua bán" },
              { value: "rent", label: "Cho thuê", colorClass: "bg-red-500 text-white shadow-sm" }
            ]}
            activeTab={loaiHinh}
            onTabChange={(val) => {
              router.push(`/bat-dong-san?loaiHinh=${val}${category ? `&category=${category}` : ""}`);
            }}
            total={total}
            loading={loading}
            unitLabel="tin đăng"
            viewMode={viewMode}
            onViewChange={(mode) => { if (mode === "grid" || mode === "list") setViewMode(mode); }}
            showMapButton={true}
            mapLink={buildMapLink()}
            keyword={displayQuery}
            onSearch={handleAiSearch}
            searchPlaceholder="Tìm kiếm bất động sản..."
          />

          {/* Thay thế phần Filter bằng UnifiedFilterBar */}
          <UnifiedFilterBar
            sortOptions={SORT_OPTIONS}
            activeSort={sort}
            onSortChange={(val) => { setSort(val); setPage(1); }}
            appendRight={
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="md:hidden ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]"
              >
                {viewMode === "grid" ? (
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                ) : (
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                )}
              </button>
            }
          >
            {/* Loại hình bất động sản (Category) */}
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="filter-select min-w-[130px]"
            >
              {CATEGORY_OPTIONS.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
            </select>

            {/* Tỉnh/thành */}
            <SearchableSelect
              options={provinces.map(p => ({ value: p.id, label: p.name }))}
              value={selectedProvinceId}
              onChange={(val) => { setSelectedProvinceId(val); setSelectedWardId(""); setPage(1); }}
              placeholder="Tỉnh/thành"
              variant="filter"
              className="min-w-[120px]"
            />

            {/* Phường/xã */}
            {selectedProvinceId && wards.length > 0 && (
              <SearchableSelect
                options={wards.map(w => ({ value: String(w.code), label: w.name }))}
                value={selectedWardId}
                onChange={(val) => { setSelectedWardId(val); setPage(1); }}
                placeholder="Phường/xã"
                variant="filter"
                className="min-w-[120px]"
              />
            )}

            {/* Khoảng giá */}
            <select
              value={`${priceMin}-${priceMax}`}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "-") { setPriceMin(""); setPriceMax(""); }
                else { const [min, max] = val.split("-"); setPriceMin(min); setPriceMax(max); }
                setPage(1);
              }}
              className="filter-select min-w-[110px]"
            >
              <option value="-">Mức giá</option>
              {PRICE_PRESETS.filter(p => p.label !== "Tất cả").map((p) => (
                <option key={p.label} value={`${p.min}-${p.max}`}>{p.label}</option>
              ))}
            </select>

            {/* Diện tích */}
            <select
              value={`${areaMin}-${areaMax}`}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "-") { setAreaMin(""); setAreaMax(""); }
                else { const [min, max] = val.split("-"); setAreaMin(min); setAreaMax(max); }
                setPage(1);
              }}
              className="filter-select min-w-[110px]"
            >
              <option value="-">Diện tích</option>
              {AREA_PRESETS.filter(p => p.label !== "Tất cả").map((a) => (
                <option key={a.label} value={`${a.min}-${a.max}`}>{a.label}</option>
              ))}
            </select>

            {/* Bộ lọc thêm Toggle */}
            <button
              onClick={() => setMoreFiltersOpen((o) => !o)}
              className={`flex shrink-0 items-center justify-center gap-1.5 rounded-full border h-9 px-4 text-xs font-medium transition ${moreFiltersOpen || direction || legalStatus || bedrooms
                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/50"
                }`}
            >
              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              Lọc thêm
            </button>
          </UnifiedFilterBar>

          {/* More filters panel */}
          {moreFiltersOpen && (
            <div className="border-t border-[var(--border)] py-3 animate-fade-in-up">
              <div className="flex flex-wrap items-end gap-5">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Phòng ngủ</label>
                  <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] p-[2px]">
                    {BEDROOM_OPTIONS.map((b) => (
                      <button
                        key={b.value}
                        onClick={() => { setBedrooms(b.value); setPage(1); }}
                        className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${bedrooms === b.value
                          ? "bg-[var(--primary)] text-white shadow-sm"
                          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                          }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Hướng</label>
                  <select value={direction} onChange={(e) => { setDirection(e.target.value); setPage(1); }} className="filter-select min-w-[130px]">
                    <option value="">Tất cả hướng</option>
                    {DIRECTION_OPTIONS.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Pháp lý</label>
                  <select value={legalStatus} onChange={(e) => { setLegalStatus(e.target.value); setPage(1); }} className="filter-select min-w-[130px]">
                    <option value="">Tất cả</option>
                    {LEGAL_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Active filter chips ─── */}
      {activeChips.length > 0 && (
        <div className="layout-container px-4 pt-5 pb-2 md:px-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-[var(--muted-foreground)] mr-1">Đang lọc:</span>
            {activeChips.map((chip) => (
              <span key={chip.label} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)] border border-[var(--primary)]/20 shadow-sm">
                {chip.label}
                <button onClick={chip.onClear} className="ml-1 rounded-full p-0.5 transition hover:bg-[var(--primary)]/20 hover:text-red-500">
                  <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </span>
            ))}
            <button onClick={resetAll} className="ml-2 rounded-full border-none text-xs font-semibold text-red-500 transition hover:text-red-600 underline underline-offset-2">
              Xoá tất cả
            </button>
          </div>
        </div>
      )}

      {/* ─── Content ─── */}
      <div className={`layout-container px-4 md:px-10 ${activeChips.length === 0 ? "pt-6" : ""}`}>
        {loading ? (
          <div className={viewMode === "list" ? "flex flex-col gap-4 max-w-4xl mx-auto" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`animate-pulse overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] ${viewMode === "list" ? "flex" : ""}`}>
                <div className={`bg-[var(--muted)]/50 ${viewMode === "list" ? "w-40 sm:w-48 shrink-0" : "h-48"}`} />
                <div className="space-y-4 p-5 flex-1">
                  <div className="h-5 w-3/4 rounded-md bg-[var(--muted)]/50" />
                  <div className="h-6 w-1/3 rounded-md bg-[var(--primary)]/20" />
                  <div className="flex gap-4 pt-2">
                    <div className="h-4 w-16 rounded-md bg-[var(--muted)]/50" />
                    <div className="h-4 w-16 rounded-md bg-[var(--muted)]/50" />
                    <div className="h-4 w-16 rounded-md bg-[var(--muted)]/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)]/50 py-24 shadow-sm">
            <div className="flex size-20 items-center justify-center rounded-full bg-[var(--primary)]/10">
              <svg className="size-10 text-[var(--primary)]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.3-4.3" /></svg>
            </div>
            <p className="mt-5 text-xl font-bold text-[var(--foreground)]">Không tìm thấy bất động sản</p>
            <p className="mt-2 max-w-md text-center text-[var(--muted-foreground)] leading-relaxed">Bộ lọc của bạn hiện không khớp với tin đăng nào. Vui lòng thử thay đổi điều kiện hoặc mở rộng khu vực tìm kiếm.</p>
            <button onClick={resetAll} className="mt-6 rounded-xl bg-[var(--primary)] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--primary-dark)] hover:shadow-lg hover:-translate-y-0.5">
              Xoá bộ lọc ngay
            </button>
          </div>
        ) : (
          <>
            <div className={viewMode === "list" ? "flex flex-col gap-4 max-w-5xl mx-auto" : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
              {listings.map((listing) => (
                <PropertyCard key={listing.id} listing={listing} viewMode={viewMode} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-sm disabled:opacity-40 disabled:hover:border-[var(--border)] disabled:hover:text-inherit disabled:hover:shadow-none"
                >
                  <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) p = i + 1;
                    else if (page <= 3) p = i + 1;
                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                    return (
                      <button
                        key={p}
                        onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className={`inline-flex size-10 items-center justify-center rounded-full text-sm font-bold transition ${p === page
                          ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/30"
                          : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
                          }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={page >= totalPages}
                  onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-sm disabled:opacity-40 disabled:hover:border-[var(--border)] disabled:hover:text-inherit disabled:hover:shadow-none"
                >
                  <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-[var(--muted-foreground)]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" /></div>}>
      <ListingsContent />
    </Suspense>
  );
}
