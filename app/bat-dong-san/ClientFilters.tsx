"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { UnifiedSearchHeader } from "@/components/filters/UnifiedSearchHeader";
import { UnifiedFilterBar } from "@/components/filters/UnifiedFilterBar";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

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

export function ClientFilters({
    total,
    provinces,
    initialViewMode = "grid"
}: {
    total: number;
    provinces: Province[];
    initialViewMode?: "grid" | "list";
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const keyword = searchParams.get("keyword") ?? "";
    const aiQuery = searchParams.get("aiQuery") ?? "";
    const displayQuery = keyword || aiQuery;
    const loaiHinh = searchParams.get("loaiHinh") ?? "sale";
    const category = searchParams.get("category") ?? "";
    const provinceId = searchParams.get("provinceId") ?? "";
    const wardId = searchParams.get("wardId") ?? "";
    const sort = searchParams.get("sort") ?? "newest";
    const priceMin = searchParams.get("priceMin") ?? "";
    const priceMax = searchParams.get("priceMax") ?? "";
    const areaMin = searchParams.get("areaMin") ?? "";
    const areaMax = searchParams.get("areaMax") ?? "";
    const bedrooms = searchParams.get("bedrooms") ?? "";
    const direction = searchParams.get("direction") ?? "";
    const legalStatus = searchParams.get("legalStatus") ?? "";

    const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);
    const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
    const [wards, setWards] = useState<Ward[]>([]);

    useEffect(() => {
        if (!provinceId) {
            setWards([]);
            return;
        }
        const currentProv = provinces.find((p) => p.id === provinceId || p.code === provinceId);
        const code = currentProv?.code ?? provinceId;
        fetch(`/api/wards?provinceCode=${encodeURIComponent(String(code))}`)
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data)) setWards(data);
                else setWards([]);
            })
            .catch(() => setWards([]));
    }, [provinceId, provinces]);

    const updateFilters = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([k, v]) => {
            if (v === null || v === "") params.delete(k);
            else params.set(k, v);
        });
        // Reset page whenever filters change
        if (!updates.page) params.delete("page");

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleAiSearch = (val: string) => updateFilters({ keyword: val });

    const resetAll = () => {
        router.push(pathname, { scroll: false });
    };

    const buildMapLink = () => {
        const p = new URLSearchParams(searchParams.toString());
        return `/tim-kiem?${p.toString()}`;
    };

    const activeChips: { label: string; onClear: () => void }[] = [];
    const selectedProvince = provinces.find((p) => p.id === provinceId || p.code === provinceId);
    if (selectedProvince) activeChips.push({ label: selectedProvince.name, onClear: () => updateFilters({ provinceId: null, wardId: null }) });
    if (category) activeChips.push({ label: CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? category, onClear: () => updateFilters({ category: null }) });
    if (priceMin || priceMax) activeChips.push({ label: `Giá: ${compactPrice(priceMin, priceMax)}`, onClear: () => updateFilters({ priceMin: null, priceMax: null }) });
    if (areaMin || areaMax) activeChips.push({ label: `DT: ${areaMin || "0"}-${areaMax || "∞"} m²`, onClear: () => updateFilters({ areaMin: null, areaMax: null }) });
    if (bedrooms) activeChips.push({ label: `${bedrooms}+ PN`, onClear: () => updateFilters({ bedrooms: null }) });
    if (direction) activeChips.push({ label: `Hướng ${direction}`, onClear: () => updateFilters({ direction: null }) });
    if (legalStatus) activeChips.push({ label: legalStatus, onClear: () => updateFilters({ legalStatus: null }) });

    return (
        <>
            <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)] shadow-sm">
                <div className="layout-container px-4 md:px-10">
                    <UnifiedSearchHeader
                        tabs={[
                            { value: "sale", label: "Mua bán", colorClass: "bg-[var(--primary)] text-primary-foreground shadow-sm" },
                            { value: "rent", label: "Cho thuê", colorClass: "bg-[var(--primary)] text-primary-foreground shadow-sm" }
                        ]}
                        activeTab={loaiHinh}
                        onTabChange={(val) => updateFilters({ loaiHinh: val })}
                        total={total}
                        loading={false}
                        unitLabel="tin đăng"
                        viewMode={viewMode}
                        onViewChange={(mode) => {
                            if (mode === "grid" || mode === "list") {
                                setViewMode(mode);
                                // Dispatch event để Server Component biết viewMode hiện tại (mặc dù hơi hacky, cách tốt nhất là dùng cookie hoặc searchParams cho viewMode)
                                // Tuy nhiên view mode thường chỉ là client state nội bộ để style danh sách
                                document.cookie = `viewMode=${mode}; path=/; max-age=31536000`;
                                router.refresh(); // Gọi lại RSC để render PropertyCard với viewMode chuẩn (nếu ta pass viewMode từ cookie vào)
                            }
                        }}
                        showMapButton={true}
                        mapLink={buildMapLink()}
                        keyword={displayQuery}
                        onSearch={handleAiSearch}
                        searchPlaceholder="Tìm kiếm bất động sản..."
                    />

                    <UnifiedFilterBar
                        sortOptions={SORT_OPTIONS}
                        activeSort={sort}
                        onSortChange={(val) => updateFilters({ sort: val })}
                        appendRight={
                            <button
                                onClick={() => {
                                    const newMode = viewMode === "grid" ? "list" : "grid";
                                    setViewMode(newMode);
                                    document.cookie = `viewMode=${newMode}; path=/; max-age=31536000`;
                                    router.refresh();
                                }}
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
                        <div className="flex items-center gap-2 flex-wrap pb-1 w-full">
                            <select
                                value={category}
                                onChange={(e) => updateFilters({ category: e.target.value })}
                                className="filter-select !py-1.5 !px-3 !text-xs h-9 min-w-[120px] rounded-full bg-[var(--card)] text-[var(--foreground)]"
                            >
                                {CATEGORY_OPTIONS.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                            </select>

                            <SearchableSelect
                                options={provinces.map(p => ({ value: p.code || p.id, label: p.name }))}
                                value={provinceId}
                                onChange={(val) => updateFilters({ provinceId: val, wardId: null })}
                                placeholder="Tỉnh/thành"
                                variant="filter"
                                className="min-w-[120px] !text-xs h-9"
                            />

                            {provinceId && wards.length > 0 && (
                                <SearchableSelect
                                    options={wards.map(w => ({ value: String(w.code), label: w.name }))}
                                    value={wardId}
                                    onChange={(val) => updateFilters({ wardId: val })}
                                    placeholder="Phường/xã"
                                    variant="filter"
                                    className="min-w-[120px] !text-xs h-9"
                                />
                            )}

                            <select
                                value={`${priceMin}-${priceMax}`}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "-") updateFilters({ priceMin: null, priceMax: null });
                                    else { const [min, max] = val.split("-"); updateFilters({ priceMin: min, priceMax: max }); }
                                }}
                                className="filter-select !py-1.5 !px-3 !text-xs h-9 min-w-[120px] rounded-full bg-[var(--card)] text-[var(--foreground)]"
                            >
                                <option value="-">Mức giá</option>
                                {PRICE_PRESETS.filter(p => p.label !== "Tất cả").map((p) => (
                                    <option key={p.label} value={`${p.min}-${p.max}`}>{p.label}</option>
                                ))}
                            </select>

                            <select
                                value={`${areaMin}-${areaMax}`}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "-") updateFilters({ areaMin: null, areaMax: null });
                                    else { const [min, max] = val.split("-"); updateFilters({ areaMin: min, areaMax: max }); }
                                }}
                                className="filter-select !py-1.5 !px-3 !text-xs h-9 min-w-[120px] rounded-full bg-[var(--card)] text-[var(--foreground)]"
                            >
                                <option value="-">Diện tích</option>
                                {AREA_PRESETS.filter(p => p.label !== "Tất cả").map((a) => (
                                    <option key={a.label} value={`${a.min}-${a.max}`}>{a.label}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => setMoreFiltersOpen((o) => !o)}
                            className={`flex shrink-0 items-center justify-center gap-1.5 rounded-full border h-10 px-5 text-sm font-medium transition ${moreFiltersOpen || direction || legalStatus || bedrooms
                                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                                : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--primary)]/50"
                                }`}
                        >
                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                            Lọc thêm
                        </button>
                    </UnifiedFilterBar>

                    {moreFiltersOpen && (
                        <div className="border-t border-[var(--border)] py-3 animate-fade-in-up">
                            <div className="flex flex-wrap items-end gap-5">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Phòng ngủ</label>
                                    <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] p-[3px]">
                                        {BEDROOM_OPTIONS.map((b) => (
                                            <button
                                                key={b.value}
                                                onClick={() => updateFilters({ bedrooms: b.value })}
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
                                    <select value={direction} onChange={(e) => updateFilters({ direction: e.target.value })} className="filter-select min-w-[130px] text-sm bg-[var(--card)] text-[var(--foreground)]">
                                        <option value="">Tất cả hướng</option>
                                        {DIRECTION_OPTIONS.map((d) => (<option key={d} value={d}>{d}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Pháp lý</label>
                                    <select value={legalStatus} onChange={(e) => updateFilters({ legalStatus: e.target.value })} className="filter-select min-w-[130px] text-sm bg-[var(--card)] text-[var(--foreground)]">
                                        <option value="">Tất cả</option>
                                        {LEGAL_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {activeChips.length > 0 && (
                <div className="layout-container px-4 pt-5 pb-3 md:px-10">
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
                        <button onClick={resetAll} className="ml-2 rounded-full border-none text-sm font-semibold text-[var(--destructive)] transition hover:text-[var(--destructive)] opacity-80 hover:opacity-100 hover:scale-105 underline underline-offset-2">
                            Xoá tất cả
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export function ClientPagination({ total, currentPage, limit = 12 }: { total: number; currentPage: number; limit?: number }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const totalPages = Math.ceil(total / limit) || 1;
    if (totalPages <= 1) return null;

    const handlePageChange = (p: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(p));
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="mt-12 flex items-center justify-center gap-2">
            <button
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-sm disabled:opacity-40"
            >
                <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) p = i + 1;
                    else if (currentPage <= 3) p = i + 1;
                    else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
                    else p = currentPage - 2 + i;

                    return (
                        <button
                            key={p}
                            onClick={() => handlePageChange(p)}
                            className={`inline-flex size-10 items-center justify-center rounded-full text-sm font-bold transition ${p === currentPage
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
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-sm disabled:opacity-40"
            >
                <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
    );
}
