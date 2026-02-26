"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UnifiedSearchHeader } from "@/components/filters/UnifiedSearchHeader";
import { UnifiedFilterBar } from "@/components/filters/UnifiedFilterBar";
import { useState } from "react";

type Province = { id: string; code?: string; name: string };

const STATUS_OPTIONS = [
    { value: "", label: "Tất cả" },
    { value: "dang-ban", label: "Đang bán" },
    { value: "sap-ban", label: "Sắp bán" },
    { value: "da-ban", label: "Đã bán" },
    { value: "dang-cho-thue", label: "Đang cho thuê" },
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

    const status = searchParams.get("status") ?? "";
    const sort = searchParams.get("sort") ?? "newest";
    const provinceId = searchParams.get("provinceId") ?? "";

    const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);

    const updateFilters = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([k, v]) => {
            if (v === null || v === "") params.delete(k);
            else params.set(k, v);
        });
        // Reset page on filter change
        if (!updates.page) params.delete("page");

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const resetAll = () => {
        router.push(pathname, { scroll: false });
    };

    const activeChips: { label: string; onClear: () => void }[] = [];
    const selectedProvince = provinces.find((p) => p.id === provinceId || p.code === provinceId);
    if (selectedProvince) activeChips.push({ label: selectedProvince.name, onClear: () => updateFilters({ provinceId: null }) });
    if (status) activeChips.push({ label: STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status, onClear: () => updateFilters({ status: null }) });

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
                                    document.cookie = `project_viewMode=${newMode}; path=/; max-age=31536000`;
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
                        <select
                            value={status}
                            onChange={(e) => updateFilters({ status: e.target.value })}
                            className="filter-select min-w-[130px]"
                        >
                            {STATUS_OPTIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                        </select>

                        <select
                            value={provinceId}
                            onChange={(e) => updateFilters({ provinceId: e.target.value })}
                            className="filter-select min-w-[120px]"
                        >
                            <option value="">Tỉnh/thành</option>
                            {provinces.map((p) => (<option key={p.id || p.code} value={p.code || p.id}>{p.name}</option>))}
                        </select>
                    </UnifiedFilterBar>
                </div>
            </div>

            {activeChips.length > 0 && (
                <div className="layout-container px-4 pt-4 pb-2 md:px-10">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-[var(--muted-foreground)]">Đang chọn:</span>
                        {activeChips.map((chip) => (
                            <span key={chip.label} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)] border border-[var(--primary)]/20 shadow-sm">
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
