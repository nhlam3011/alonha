"use client";

import { Suspense, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PropertyCard } from "@/components/listings/PropertyCard";
import type { ListingCardData } from "@/components/listings/PropertyCard";
import type { MapListingPoint } from "@/components/maps/ListingMarkersMap";

const UnifiedSearchHeader = dynamic(() => import("@/components/filters/UnifiedSearchHeader").then(mod => mod.UnifiedSearchHeader), { ssr: false });
const UnifiedFilterBar = dynamic(() => import("@/components/filters/UnifiedFilterBar").then(mod => mod.UnifiedFilterBar), { ssr: false });
import { SearchableSelect } from "@/components/ui/SearchableSelect";

const ListingMarkersMap = dynamic(
  () => import("@/components/maps/ListingMarkersMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[var(--muted)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
          <span className="text-sm text-[var(--muted-foreground)]">Đang tải bản đồ...</span>
        </div>
      </div>
    ),
  },
);

function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
}

// ── Filter options ──
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listContainerRef = useRef<HTMLDivElement>(null);
  const listingRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const keyword = searchParams.get("keyword") || "";
  const aiQuery = searchParams.get("aiQuery") || "";
  const loaiHinh = searchParams.get("loaiHinh") ?? searchParams.get("loai-hinh") ?? "sale";
  const initialView = searchParams.get("view") === "map" ? "map" : "split";
  const [viewMode, setViewMode] = useState<"split" | "list" | "map">(initialView);
  const [isMobile, setIsMobile] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState<Array<{ id: string; code?: string; name: string }>>([]);
  const [wards, setWards] = useState<Array<{ code: number; name: string; province_code: number }>>([]);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  const displayQuery = keyword || aiQuery;
  const [searchInput, setSearchInput] = useState(displayQuery);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");
  const [flyToLocation, setFlyToLocation] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const provinceId = searchParams.get("provinceId") ?? "";
  const wardId = searchParams.get("wardId") ?? "";
  const priceMin = searchParams.get("priceMin") ?? "";
  const priceMax = searchParams.get("priceMax") ?? "";
  const areaMin = searchParams.get("areaMin") ?? "";
  const areaMax = searchParams.get("areaMax") ?? "";
  const bedrooms = searchParams.get("bedrooms") ?? "";
  const direction = searchParams.get("direction") ?? "";
  const legalStatus = searchParams.get("legalStatus") ?? "";

  // ── Responsive ──
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && viewMode === "split") setViewMode("list");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [viewMode]);

  useEffect(() => {
    fetch("/api/provinces").then(r => r.json()).then(d => { if (Array.isArray(d)) setProvinces(d); }).catch(() => { });
  }, []);

  useEffect(() => {
    if (!provinceId) { setWards([]); return; }
    const province = provinces.find((p) => p.id === provinceId || p.code === provinceId);
    const code = province?.code ?? provinceId;
    fetch(`/api/wards?provinceCode=${encodeURIComponent(String(code))}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setWards(data); else setWards([]); })
      .catch(() => setWards([]));
  }, [provinceId, provinces]);

  // ── Fetch listings ──
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams(searchParams.toString());
        if (!q.has("loaiHinh") && q.has("loai-hinh")) {
          q.set("loaiHinh", q.get("loai-hinh") || "sale");
          q.delete("loai-hinh");
        }
        if (!q.has("limit")) q.set("limit", "50");
        const res = await fetch(`/api/listings?${q.toString()}`);
        const data = await res.json();
        if (data && Array.isArray(data.data)) { setListings(data.data); setTotal(data.total || 0); }
        else { setListings([]); setTotal(0); }
      } catch { setListings([]); setTotal(0); }
      finally { setLoading(false); }
    };
    // Debounce the fetch slightly to prevent rapid flickering on filter changes
    const timeoutId = setTimeout(() => {
      fetchListings();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [searchParams]);

  const scrollToListing = useCallback((id: string) => {
    const el = listingRefs.current.get(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setSelectedListingId(id);
      setTimeout(() => setSelectedListingId(null), 2000);
    }
  }, []);

  // ── AI Search ──
  const handleAiSearch = async (term: string) => {
    const q = term.trim();
    if (!q) return;
    setAiLoading(true);
    setAiExplanation("");
    setFlyToLocation(null);
    try {
      const res = await fetch("/api/ai/search-intent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json().catch(() => ({}));
      const filters = data?.filters || {};
      const params = new URLSearchParams();

      let baseKeyword = typeof filters.keyword === "string" ? filters.keyword.trim() : "";
      if (filters.district) {
        const nd = normalizeText(filters.district);
        if (!normalizeText(baseKeyword).includes(nd)) baseKeyword = `${baseKeyword} ${filters.district}`.trim();
      }
      if (baseKeyword) params.set("keyword", baseKeyword);
      if (filters.loaiHinh) params.set("loaiHinh", filters.loaiHinh);
      if (filters.category) params.set("category", filters.category);
      if (filters.priceMin) params.set("priceMin", String(filters.priceMin));
      if (filters.priceMax) params.set("priceMax", String(filters.priceMax));
      if (filters.areaMin) params.set("areaMin", String(filters.areaMin));
      if (filters.areaMax) params.set("areaMax", String(filters.areaMax));
      if (filters.bedrooms) params.set("bedrooms", String(filters.bedrooms));

      if (filters.province) {
        const np = normalizeText(filters.province);
        const match = provinces.find(p => { const n = normalizeText(p.name); return n.includes(np) || np.includes(n); });
        if (match) params.set("provinceId", match.id);
        else if (!normalizeText(baseKeyword).includes(np)) params.set("keyword", `${baseKeyword} ${filters.province}`.trim());
      }
      if (data.explanation) setAiExplanation(data.explanation);

      const locationParts: string[] = [];
      if (filters.district) locationParts.push(filters.district);
      if (filters.province) locationParts.push(filters.province);
      if (locationParts.length > 0) {
        locationParts.push("Vietnam");
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=vi&q=${encodeURIComponent(locationParts.join(", "))}`, { headers: { "User-Agent": "alonha-app" } });
          const geoData = await geoRes.json();
          if (Array.isArray(geoData) && geoData.length > 0) {
            setFlyToLocation({ lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon), zoom: filters.district ? 14 : 11 });
          }
        } catch { }
      }
      router.push(`/tim-kiem?${params.toString()}`);
    } catch { } finally { setAiLoading(false); }
  };

  // ── Map data ──
  const mapListings: MapListingPoint[] = useMemo(
    () => listings
      .map(l => ({
        id: l.id, slug: l.slug, title: l.title, address: l.address,
        price: typeof l.price === "string" ? parseFloat(l.price) : Number(l.price),
        area: l.area ?? null, bedrooms: l.bedrooms ?? null, bathrooms: l.bathrooms ?? null,
        listingType: l.listingType, latitude: l.latitude ?? 0, longitude: l.longitude ?? 0,
        imageUrl: l.imageUrl,
      }))
      .filter(l => l.latitude !== 0 && l.longitude !== 0),
    [listings]
  );

  const showList = viewMode === "split" || viewMode === "list";
  const showMap = viewMode === "split" || viewMode === "map";

  const updateParam = (key: string, val: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (val) p.set(key, val); else p.delete(key);
    router.push(`/tim-kiem?${p.toString()}`);
  };

  const handleAiSearchSubmit = (val: string) => {
    if (val !== displayQuery) {
      handleAiSearch(val);
    }
  };

  // Active filter chips 
  const activeChips: { label: string; onClear: () => void }[] = [];
  const selectedProvince = provinces.find((p) => p.id === provinceId || p.code === provinceId);
  if (selectedProvince) activeChips.push({ label: selectedProvince.name, onClear: () => { const p = new URLSearchParams(searchParams.toString()); p.delete("provinceId"); p.delete("wardId"); router.push(`/tim-kiem?${p.toString()}`); } });
  if (category) activeChips.push({ label: CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? category, onClear: () => { updateParam("category", ""); } });
  if (priceMin || priceMax) activeChips.push({ label: `Giá: ${compactPrice(priceMin, priceMax)}`, onClear: () => { const p = new URLSearchParams(searchParams.toString()); p.delete("priceMin"); p.delete("priceMax"); router.push(`/tim-kiem?${p.toString()}`); } });
  if (areaMin || areaMax) activeChips.push({ label: `DT: ${areaMin || "0"}-${areaMax || "∞"} m²`, onClear: () => { const p = new URLSearchParams(searchParams.toString()); p.delete("areaMin"); p.delete("areaMax"); router.push(`/tim-kiem?${p.toString()}`); } });
  if (bedrooms) activeChips.push({ label: `${bedrooms}+ PN`, onClear: () => { updateParam("bedrooms", ""); } });
  if (direction) activeChips.push({ label: `Hướng ${direction}`, onClear: () => { updateParam("direction", ""); } });
  if (legalStatus) activeChips.push({ label: legalStatus, onClear: () => { updateParam("legalStatus", ""); } });

  function resetAll() {
    router.push(`/tim-kiem?loaiHinh=${loaiHinh}`);
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--background)] relative overflow-hidden" style={{ paddingTop: 0 }}>
      {/* ── Ambient Background Glow ── */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[var(--primary)]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--secondary)]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* ═══ TOP BAR (Unified Components) ═══ */}
      <div className="shrink-0 z-30 relative bg-[var(--background)] border-b border-[var(--border)] shadow-sm">
        <div className="px-4 md:px-6">
          <UnifiedSearchHeader
            tabs={[
              { value: "sale", label: "Mua bán", colorClass: "bg-[var(--primary)] text-primary-foreground shadow-sm" },
              { value: "rent", label: "Cho thuê", colorClass: "bg-[var(--primary)] text-primary-foreground shadow-sm" }
            ]}
            activeTab={loaiHinh}
            onTabChange={(val) => {
              router.push(`/tim-kiem?loaiHinh=${val}${category ? `&category=${category}` : ""}`);
            }}
            total={total}
            loading={loading}
            unitLabel="tin đăng"
            viewMode={viewMode === "split" ? "list" : viewMode} // Mapping view mode for header
            onViewChange={(mode) => {
              if (mode === "grid" || mode === "list") setViewMode(isMobile ? "list" : "split");
              else if (mode as string === "map") setViewMode("map");
            }}
            showMapButton={false}
            keyword={displayQuery}
            onSearch={handleAiSearchSubmit}
            searchPlaceholder="Tìm kiếm bất động sản bằng AI..."
          />

          <UnifiedFilterBar
            sortOptions={SORT_OPTIONS}
            activeSort={sort}
            onSortChange={(val) => updateParam("sort", val)}
            appendRight={
              <div className="hidden lg:flex items-center p-1 rounded-full bg-[var(--card)] border border-[var(--border)] shrink-0 shadow-inner ml-auto">
                {(["split", "list", "map"] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    className={`flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium transition-all ${viewMode === m ? "bg-[var(--primary)] text-primary-foreground shadow-md" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5"}`}
                    title={m === "split" ? "Chia đôi" : m === "list" ? "Danh sách" : "Bản đồ"}
                  >
                    {m === "split" && <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="18" rx="1.5" /><rect x="14" y="3" width="7" height="18" rx="1.5" /></svg> <span className="hidden xl:inline">Chia màn</span></>}
                    {m === "list" && <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1.5" /><circle cx="4" cy="12" r="1.5" /><circle cx="4" cy="18" r="1.5" /></svg> <span className="hidden xl:inline">Danh sách</span></>}
                    {m === "map" && <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" strokeLinejoin="round" /></svg> <span className="hidden xl:inline">Bản đồ</span></>}
                  </button>
                ))}
              </div>
            }
          >
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full">
              {/* Loại hình bất động sản (Category) */}
              <select
                value={category}
                onChange={(e) => updateParam("category", e.target.value)}
                className="filter-select !py-1.5 !px-3 !text-xs h-9 min-w-[120px] rounded-full bg-[var(--card)] text-[var(--foreground)] dark:bg-[var(--card)] dark:text-[var(--foreground)]"
              >
                {CATEGORY_OPTIONS.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>

              {/* Tỉnh/thành */}
              <SearchableSelect
                options={provinces.map(p => ({ value: p.code ?? p.id, label: p.name }))}
                value={provinceId}
                onChange={(val) => { const p = new URLSearchParams(searchParams.toString()); if (val) p.set("provinceId", val); else p.delete("provinceId"); p.delete("wardId"); router.push(`/tim-kiem?${p.toString()}`); }}
                placeholder="Tỉnh/thành"
                variant="filter"
                className="min-w-[120px] !text-xs h-9"
              />

              {/* Phường/xã */}
              {provinceId && wards.length > 0 && (
                <SearchableSelect
                  options={wards.map(w => ({ value: String(w.code), label: w.name }))}
                  value={wardId}
                  onChange={(val) => updateParam("wardId", val)}
                  placeholder="Phường/xã"
                  variant="filter"
                  className="min-w-[120px] !text-xs h-9"
                />
              )}

              {/* Khoảng giá */}
              <select
                value={`${priceMin}-${priceMax}`}
                onChange={(e) => {
                  const val = e.target.value;
                  const p = new URLSearchParams(searchParams.toString());
                  if (val === "-") { p.delete("priceMin"); p.delete("priceMax"); }
                  else { const [min, max] = val.split("-"); if (min) p.set("priceMin", min); else p.delete("priceMin"); if (max) p.set("priceMax", max); else p.delete("priceMax"); }
                  router.push(`/tim-kiem?${p.toString()}`);
                }}
                className="filter-select !py-1.5 !px-3 !text-xs h-9 min-w-[120px] rounded-full bg-[var(--card)] text-[var(--foreground)] dark:bg-[var(--card)] dark:text-[var(--foreground)]"
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
                  const p = new URLSearchParams(searchParams.toString());
                  if (val === "-") { p.delete("areaMin"); p.delete("areaMax"); }
                  else { const [min, max] = val.split("-"); if (min) p.set("areaMin", min); else p.delete("areaMin"); if (max) p.set("areaMax", max); else p.delete("areaMax"); }
                  router.push(`/tim-kiem?${p.toString()}`);
                }}
                className="filter-select !py-1.5 !px-3 !text-xs h-9 min-w-[120px] rounded-full bg-[var(--card)] text-[var(--foreground)] dark:bg-[var(--card)] dark:text-[var(--foreground)]"
              >
                <option value="-">Diện tích</option>
                {AREA_PRESETS.filter(p => p.label !== "Tất cả").map((a) => (
                  <option key={a.label} value={`${a.min}-${a.max}`}>{a.label}</option>
                ))}
              </select>
            </div>

            {/* Bộ lọc thêm Toggle */}
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className={`flex shrink-0 items-center justify-center gap-1.5 rounded-full border h-9 px-4 text-xs font-medium transition ${filtersOpen || direction || legalStatus || bedrooms
                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/50"
                }`}
            >
              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              Lọc thêm
            </button>
          </UnifiedFilterBar>

          {/* More filters panel */}
          {filtersOpen && (
            <div className="border-t border-[var(--border)] py-3 animate-fade-in-up">
              <div className="flex flex-wrap items-end gap-5">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Phòng ngủ</label>
                  <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] p-[3px]">
                    {BEDROOM_OPTIONS.map((b) => (
                      <button
                        key={b.value}
                        onClick={() => updateParam("bedrooms", b.value)}
                        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${bedrooms === b.value
                          ? "bg-[var(--primary)] text-primary-foreground shadow-sm"
                          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                          }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Hướng</label>
                  <select value={direction} onChange={(e) => updateParam("direction", e.target.value)} className="filter-select min-w-[130px] text-sm bg-[var(--card)] text-[var(--foreground)] dark:bg-[var(--card)] dark:text-[var(--foreground)]">
                    <option value="">Tất cả hướng</option>
                    {DIRECTION_OPTIONS.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Pháp lý</label>
                  <select value={legalStatus} onChange={(e) => updateParam("legalStatus", e.target.value)} className="filter-select min-w-[130px] text-sm bg-[var(--card)] text-[var(--foreground)] dark:bg-[var(--card)] dark:text-[var(--foreground)]">
                    <option value="">Tất cả</option>
                    {LEGAL_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Active filter chips ── */}
        {activeChips.length > 0 && (
          <div className="px-4 pb-3 md:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[var(--muted-foreground)] mr-1">Đang lọc:</span>
              {activeChips.map((chip) => (
                <span key={chip.label} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-sm font-semibold text-[var(--primary)] border border-[var(--primary)]/20 shadow-sm">
                  {chip.label}
                  <button onClick={chip.onClear} className="ml-1 rounded-full p-0.5 transition hover:bg-[var(--primary)]/20 hover:text-[var(--destructive)]">
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
              <button onClick={resetAll} className="ml-2 rounded-full border-none text-sm font-semibold text-[var(--destructive)] transition hover:text-red-600 underline underline-offset-2">
                Xoá tất cả
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats & AI Explanation ── */}
      <div className="flex flex-col z-20 shrink-0">
        <div className={`overflow-hidden bg-[var(--card)] transition-all duration-300 ease-in-out border-b border-[var(--border)] ${aiExplanation ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 border-transparent'}`}>
          <div className="flex items-center gap-2 px-4 py-3 bg-[var(--primary)]/5 text-sm md:text-base">
            <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <span className="text-[var(--primary)] font-semibold flex-1 leading-snug break-words">AI đã lọc: {aiExplanation}</span>
            <button onClick={() => setAiExplanation("")} className="w-8 h-8 flex items-center justify-center text-[var(--primary)]/50 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-full transition-colors text-xl">×</button>
          </div>
        </div>

        {/* Removed stats text total.toLocaleString from here, keeping it inside active tabs / list panel below or leave out. We can put it back as a small bar if needed */}
        {mapListings.length > 0 && mapListings.length < total && (
          <div className="px-5 py-2 text-sm bg-[var(--card)] text-[var(--muted-foreground)] border-b border-[var(--border)] font-medium">
            Hiển thị {mapListings.length} mốc trên bản đồ / {total} kết quả phù hợp
          </div>
        )}
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* ── List Panel ── */}
        {showList && (
          <div
            ref={listContainerRef}
            className={`flex flex-col bg-[var(--background)] ${viewMode === "split"
              ? "w-full md:w-[380px] lg:w-[420px] xl:w-[460px] md:border-r border-[var(--border)]"
              : "w-full"
              } ${viewMode === "list" ? "" : "hidden md:flex"}`}
          >
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                      <div className="h-40 bg-[var(--muted)]" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 w-2/3 rounded-lg bg-[var(--muted)]" />
                        <div className="h-5 w-1/3 rounded-lg bg-[var(--primary)]/20" />
                        <div className="flex gap-3">
                          <div className="h-3 w-14 rounded bg-[var(--muted)]" />
                          <div className="h-3 w-10 rounded bg-[var(--muted)]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-5">
                    <svg className="w-9 h-9 text-[var(--primary)]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeWidth={2} d="m21 21-4.3-4.3" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Không tìm thấy kết quả</h3>
                  <p className="text-base text-[var(--muted-foreground)] text-center max-w-xs leading-relaxed">Thử tìm kiếm với từ khóa khác hoặc mở rộng bộ lọc</p>
                  <button onClick={() => router.push("/tim-kiem")} className="mt-5 px-6 py-3 bg-[var(--primary)] text-primary-foreground rounded-xl text-base font-semibold hover:opacity-90 transition-opacity shadow-md">
                    Xóa bộ lọc
                  </button>
                </div>
              ) : (
                <div className={`p-3 gap-3 ${viewMode === "list" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col"}`}>
                  {listings.map(listing => (
                    <div
                      key={listing.id}
                      ref={el => { if (el) listingRefs.current.set(listing.id, el); }}
                      className={`transition-all duration-300 ${selectedListingId === listing.id ? "ring-2 ring-[var(--primary)] rounded-2xl scale-[1.01]" : ""}`}
                    >
                      <PropertyCard listing={listing} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Map Panel ── */}
        {showMap && (
          <div className={`${viewMode === "split" ? "hidden md:block" : ""} flex-1 relative`}>
            <ListingMarkersMap
              listings={mapListings}
              selectedListingId={selectedListingId}
              onSelectListing={scrollToListing}
              flyToLocation={flyToLocation}
            />
          </div>
        )}

        {/* ── Mobile FAB: toggle list/map ── */}
        <button
          onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
          className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-6 py-3.5 rounded-full bg-[var(--foreground)] text-[var(--background)] shadow-2xl font-bold text-base transition-all active:scale-95"
        >
          {viewMode === "map" ? (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /></svg>
              Danh sách
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /></svg>
              Bản đồ
            </>
          )}
        </button>
      </div>
    </div>
  );
}
