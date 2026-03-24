"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { UnifiedSearchHeader } from "@/components/filters/UnifiedSearchHeader";
import { UnifiedFilterBar } from "@/components/filters/UnifiedFilterBar";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useState } from "react";

type Province = { id: string; code?: string; name: string };

const STATUS_OPTIONS = [
    { value: "", label: "Tất cả" },
    { value: "dang-ban", label: "Đang bán" },
    { value: "sap-ban", label: "Sắp bán" },
    { value: "da-ban", label: "Đã bán" },
    { value: "dang-cho-thue", label: "Đang cho thuê" },
];

const AREA_PRESETS = [
    { value: "", label: "Tất cả" },
    { value: "0-1", label: "< 1 ha" },
    { value: "1-5", label: "1-5 ha" },
    { value: "5-10", label: "5-10 ha" },
    { value: "10-20", label: "10-20 ha" },
    { value: "20-50", label: "20-50 ha" },
    { value: "50-100", label: "50-100 ha" },
    { value: "100-", label: "> 100 ha" },
];

const SORT_OPTIONS = [
    { value: "newest", label: "Mới nhất" },
    { value: "oldest", label: "Cũ nhất" },
    { value: "name-asc", label: "Tên A-Z" },
    { value: "name-desc", label: "Tên Z-A" },
    { value: "listings-desc", label: "Nhiều tin nhất" },
    { value: "area-desc", label: "Diện tích lớn" },
];

export function ProjectClientFilters({
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
    const status = searchParams.get("status") ?? "";
    const sort = searchParams.get("sort") ?? "newest";
    const provinceId = searchParams.get("provinceId") ?? "";
    const areaMin = searchParams.get("areaMin") ?? "";
    const areaMax = searchParams.get("areaMax") ?? "";
    const developer = searchParams.get("developer") ?? "";

    const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);
    const [aiLoading, setAiLoading] = useState(false);
    const [moreFiltersOpen, setMoreFiltersOpen] = useState(false); // Renamed filtersOpen to moreFiltersOpen

    const updateFilters = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([k, v]) => {
            if (v === null || v === "") params.delete(k);
            else params.set(k, v);
        });
        if (!updates.page) params.delete("page");

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleSearch = async (val: string) => {
        const q = val.trim();
        if (!q) {
            router.push(pathname, { scroll: false });
            return;
        }
        setAiLoading(true);
        try {
            const res = await fetch("/api/ai/search-parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: q, mode: "project" }),
            });
            const data = await res.json();

            const params = new URLSearchParams();
            if (data.keyword) params.set("keyword", data.keyword);
            if (data.provinceName) {
                const matched = provinces.find(
                    (p) =>
                        p.name.toLowerCase().includes(data.provinceName.toLowerCase()) ||
                        data.provinceName.toLowerCase().includes(p.name.toLowerCase())
                );
                if (matched) params.set("provinceId", matched.code || matched.id);
            }
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        } catch {
            const params = new URLSearchParams();
            params.set("keyword", q);
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        } finally {
            setAiLoading(false);
        }
    };

    const resetAll = () => {
        router.push(pathname, { scroll: false });
    };

    const activeChips: { label: string; onClear: () => void }[] = [];
    if (keyword) activeChips.push({ label: `"${keyword}"`, onClear: () => updateFilters({ keyword: null }) });
    const selectedProvince = provinces.find((p) => p.id === provinceId || p.code === provinceId);
    if (selectedProvince) activeChips.push({ label: selectedProvince.name, onClear: () => updateFilters({ provinceId: null }) });
    if (status) activeChips.push({ label: STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status, onClear: () => updateFilters({ status: null }) });
    if (areaMin || areaMax) {
        const areaLabel = areaMin && areaMax ? `${areaMin}-${areaMax} ha` : areaMin ? `> ${areaMin} ha` : `< ${areaMax} ha`;
        activeChips.push({ label: areaLabel, onClear: () => updateFilters({ areaMin: null, areaMax: null }) });
    }
    if (developer) activeChips.push({ label: developer, onClear: () => updateFilters({ developer: null }) });

    // Placeholder for buildMapLink, as it was not provided in the instruction
    const buildMapLink = () => {
        const params = new URLSearchParams(searchParams.toString());
        return `/tim-kiem?${params.toString()}`;
    };

    return (
        <>
            <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)] shadow-sm">
                <div className="layout-container px-4 md:px-10">
                    <UnifiedSearchHeader
                        tabs={[{ value: "du-an", label: "Dự án BĐS", colorClass: "bg-[var(--primary)] text-primary-foreground shadow-sm" }]}
                        activeTab="du-an"
                        onTabChange={() => { }}
                        total={total}
                        loading={false}
                        unitLabel="dự án"
                        viewMode={viewMode}
                        onViewChange={(mode) => {
                            if (mode === "grid" || mode === "list") {
                                setViewMode(mode);
                                document.cookie = `project_viewMode=${mode}; path=/; max-age=31536000`;
                                router.refresh();
                            }
                        }}
                        keyword={keyword}
                        onSearch={handleSearch}
                        aiLoading={aiLoading}
                        searchPlaceholder="Tìm kiếm dự án bất động sản..."
                    />

                    <UnifiedFilterBar>
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 w-full">
                            {/* Trạng thái */}
                            <SearchableSelect
                                options={STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
                                value={status}
                                onChange={(val) => updateFilters({ status: val })}
                                placeholder="Trạng thái"
                                variant="filter"
                                className="min-w-[110px] !text-xs h-9"
                            />

                            {/* Tỉnh/thành */}
                            <SearchableSelect
                                options={provinces.map(p => ({ value: p.code || p.id, label: p.name }))}
                                value={provinceId}
                                onChange={(val) => updateFilters({ provinceId: val })}
                                placeholder="Tỉnh/thành"
                                variant="filter"
                                className="min-w-[120px] !text-xs h-9"
                            />

                            {/* Sắp xếp */}
                            <select
                                value={sort}
                                onChange={(e) => updateFilters({ sort: e.target.value })}
                                className="filter-select !shadow-none !border-none bg-transparent hover:!border-none focus:!border-none focus:!ring-0 min-w-[120px]"
                            >
                                {SORT_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>

                            {/* Nút Lọc thêm */}
                            <div className="flex items-center gap-2">
                            <button
                                onClick={() => setMoreFiltersOpen((o) => !o)}
                                className={`flex shrink-0 items-center justify-center gap-1.5 rounded-full border h-10 px-5 text-sm font-medium transition ${moreFiltersOpen || status || provinceId
                                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                                    : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--primary)]/50"
                                    }`}
                            >
                                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                Lọc thêm
                            </button>

                            <Link
                                href={buildMapLink()}
                                className="flex md:hidden shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] h-10 px-5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                            >
                                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /></svg>
                                Bản đồ
                            </Link>
                        </div>
                        </div>
                    </UnifiedFilterBar>

                    {/* Panel lọc mở rộng */}
                    {moreFiltersOpen && ( // Changed filtersOpen to moreFiltersOpen
                        <div className="border-t border-[var(--border)] py-3 animate-fade-in-up">
                            <div className="flex flex-wrap items-end gap-4">
                                {/* Diện tích */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Diện tích</label>
                                    <SearchableSelect
                                        options={AREA_PRESETS.map(a => ({ value: a.value, label: a.label }))}
                                        value={areaMin === "" && areaMax === "" ? "" : `${areaMin}-${areaMax}`}
                                        onChange={(val) => {
                                            if (val === "") {
                                                updateFilters({ areaMin: null, areaMax: null });
                                            } else {
                                                const [min, max] = val.split("-");
                                                updateFilters({ areaMin: min || null, areaMax: max || null });
                                            }
                                        }}
                                        placeholder="Diện tích"
                                        variant="filter"
                                        className="min-w-[120px] !text-xs h-9"
                                    />
                                </div>

                                {/* Chủ đầu tư */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Chủ đầu tư</label>
                                    <input
                                        type="text"
                                        value={developer}
                                        onChange={(e) => updateFilters({ developer: e.target.value || null })}
                                        placeholder="Tìm chủ đầu tư..."
                                        className="min-w-[160px] text-xs h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                                    />
                                </div>

                                {/* Nút reset */}
                                <button
                                    onClick={resetAll}
                                    className="mb-0.5 rounded-lg px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    Xoá tất cả
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {activeChips.length > 0 && (
                <div className="layout-container px-4 pt-4 pb-2 md:px-10">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-[var(--muted-foreground)]">Đang lọc:</span>
                        {activeChips.map((chip) => (
                            <span key={chip.label} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-sm font-semibold text-[var(--primary)] border border-[var(--primary)]/20 shadow-sm">
                                {chip.label}
                                <button onClick={chip.onClear} className="ml-0.5 rounded-full p-0.5 transition hover:bg-[var(--primary)]/20 hover:text-red-500">
                                    <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </span>
                        ))}
                        <button onClick={resetAll} className="ml-1 rounded-full text-xs font-semibold text-red-500 hover:text-red-600 underline underline-offset-2 transition-colors">
                            Xoá tất cả
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export function ProjectPagination({ total, currentPage, limit = 12 }: { total: number; currentPage: number; limit?: number }) {
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
