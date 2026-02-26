"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const NEWS_CATEGORIES = [
    { value: "", label: "Tất cả" },
    { value: "thi-truong", label: "Thị trường" },
    { value: "chinh-sach", label: "Chính sách" },
    { value: "cam-nang", label: "Cẩm nang" },
    { value: "du-an", label: "Dự án" },
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

    const selectedCategory = searchParams.get("category") ?? "";
    const selectedSource = searchParams.get("source") ?? "";
    const sort = searchParams.get("sort") ?? "newest";

    const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);

    const updateFilters = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([k, v]) => {
            if (v === null || v === "") params.delete(k);
            else params.set(k, v);
        });
        if (!updates.page) params.delete("page");
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)] shadow-sm">
            <div className="layout-container px-4 py-3 md:px-10">
                <div className="flex items-center gap-4 mb-3">
                    <h1 className="text-xl font-bold text-[var(--foreground)]">Tin tức</h1>
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="text-lg font-bold text-[var(--foreground)]">
                            {total.toLocaleString("vi-VN")}
                        </span>
                        <span className="text-sm text-[var(--muted-foreground)]">bài viết</span>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mb-3">
                    {NEWS_CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => updateFilters({ category: cat.value })}
                            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${selectedCategory === cat.value
                                    ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                                    : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]"
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                    <select
                        value={selectedSource}
                        onChange={(e) => updateFilters({ source: e.target.value })}
                        className="filter-select h-9 w-auto min-w-[140px] rounded-full !py-1.5 !px-3 !text-xs bg-[var(--card)] text-[var(--foreground)]"
                    >
                        <option value="">Tất cả nguồn</option>
                        {sources.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    <div className="ml-auto flex shrink-0 items-center gap-2 relative z-10">
                        <select
                            value={sort}
                            onChange={(e) => updateFilters({ sort: e.target.value })}
                            className="filter-select h-9 w-auto rounded-full !py-1.5 !px-3 !text-xs bg-[var(--card)] text-[var(--foreground)]"
                        >
                            {SORT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <div className="hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-0.5 sm:flex">
                            <button
                                onClick={() => {
                                    setViewMode("grid");
                                    document.cookie = `news_viewMode=grid; path=/; max-age=31536000`;
                                    router.refresh();
                                }}
                                className={`rounded-md p-1.5 ${viewMode === "grid" ? "bg-[var(--primary-light)] text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}
                            >
                                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            </button>
                            <button
                                onClick={() => {
                                    setViewMode("list");
                                    document.cookie = `news_viewMode=list; path=/; max-age=31536000`;
                                    router.refresh();
                                }}
                                className={`rounded-md p-1.5 ${viewMode === "list" ? "bg-[var(--primary-light)] text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}
                            >
                                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                            </button>
                        </div>
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
                className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-40"
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
                className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-40"
            >
                <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
    );
}
