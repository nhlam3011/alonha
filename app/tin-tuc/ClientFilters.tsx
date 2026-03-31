"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { UnifiedSearchHeader } from "@/components/filters/UnifiedSearchHeader";
import { UnifiedFilterBar } from "@/components/filters/UnifiedFilterBar";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

const NEWS_CATEGORIES = [
    { value: "", label: "Tất cả danh mục" },
    { value: "thi-truong", label: "Thị trường" },
    { value: "doanh-nghiep", label: "Doanh nghiệp" },
    { value: "du-an", label: "Dự án" },
    { value: "tai-chinh", label: "Tài chính" },
    { value: "ha-tang", label: "Hạ tầng" },
    { value: "chinh-sach", label: "Chính sách" },
    { value: "cam-nang", label: "Cẩm nang" },
    { value: "phong-thuy", label: "Phong thủy" },
];

const SORT_OPTIONS = [
    { value: "newest", label: "Mới nhất" },
    { value: "oldest", label: "Cũ nhất" },
    { value: "popular", label: "Phổ biến nhất" },
];

export function NewsClientFilters({
    total,
    sources,
    initialViewMode = "grid"
}: {
    total: number;
    sources: { id: string; name: string }[];
    initialViewMode?: "grid" | "list";
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const keyword = searchParams.get("keyword") ?? "";
    const selectedCategory = searchParams.get("category") ?? "";
    const selectedSource = searchParams.get("source") ?? "";
    const sort = searchParams.get("sort") ?? "newest";

    const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);
    const [aiLoading, setAiLoading] = useState(false);

    const updateFilters = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([k, v]) => {
            if (v === null || v === "") params.delete(k);
            else params.set(k, v);
        });
        if (!updates.page) params.delete("page");
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleSearch = (val: string) => {
        updateFilters({ keyword: val || null });
    };

    return (
        <div 
            className="sticky z-30 border-b border-[var(--border)] bg-[var(--background)] shadow-sm"
            style={{ top: 'var(--header-height, 72px)' }}
        >
            <div className="layout-container px-4 md:px-10">
                <UnifiedSearchHeader
                    total={total}
                    loading={false}
                    unitLabel="bài viết"
                    keyword={keyword}
                    onSearch={handleSearch}
                    aiLoading={aiLoading}
                    searchPlaceholder="Tìm kiếm tin tức..."
                />

                {/* Filter Bar Redesign */}
                <div className="flex items-center justify-between py-2 border-t border-[var(--border)] gap-4">
                    {/* Left: Category & Source Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1">
                        <SearchableSelect
                            options={NEWS_CATEGORIES}
                            value={selectedCategory}
                            onChange={(val) => updateFilters({ category: val })}
                            placeholder="Danh mục"
                            variant="filter"
                            className="min-w-[120px] !text-xs h-9"
                        />
                        <SearchableSelect
                            options={[{ value: "", label: "Tất cả nguồn" }, ...sources.map(s => ({ value: s.id, label: s.name }))]}
                            value={selectedSource}
                            onChange={(val) => updateFilters({ source: val })}
                            placeholder="Nguồn tin"
                            variant="filter"
                            className="min-w-[140px] !text-xs h-9"
                        />
                    </div>

                    {/* Right: Sort & View Toggle */}
                    <div className="flex items-center gap-4 shrink-0">
                        {/* Native Sort Dropdown */}
                        <div className="relative flex items-center group cursor-pointer">
                            <select
                                value={sort}
                                onChange={(e) => updateFilters({ sort: e.target.value })}
                                className="appearance-none bg-transparent border-none text-[15px] font-medium text-[var(--foreground)] pr-7 py-2 focus:ring-0 cursor-pointer outline-none z-10"
                            >
                                {SORT_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                            <svg className="size-4 text-[var(--muted-foreground)] absolute right-1 group-hover:text-[var(--primary)] transition-colors pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>

                        {/* View Mode Toggle */}
                        <button
                            onClick={() => {
                                const newMode = viewMode === "grid" ? "list" : "grid";
                                setViewMode(newMode);
                                document.cookie = `news_viewMode=${newMode}; path=/; max-age=31536000`;
                                router.refresh();
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white dark:bg-[var(--card)] shadow-sm hover:shadow-md hover:border-[var(--primary)] text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-all"
                            title={viewMode === "grid" ? "Chuyển sang dạng danh sách" : "Chuyển sang dạng lưới"}
                        >
                            {viewMode === "grid" ? (
                                <svg className="size-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            ) : (
                                <svg className="size-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function NewsPagination({ total, currentPage, limit = 12 }: { total: number; currentPage: number; limit?: number }) {
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
