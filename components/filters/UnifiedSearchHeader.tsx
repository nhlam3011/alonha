"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

type UnifiedSearchHeaderProps = {
    // Toggle loại hình, vd: Mua bán / Cho thuê hoặc Đang bán / Sắp bán
    tabs?: { value: string; label: string; colorClass?: string }[];
    activeTab?: string;
    onTabChange?: (val: string) => void;

    // Search input
    keyword?: string;
    onSearch?: (val: string) => void;
    aiLoading?: boolean;
    searchPlaceholder?: string;

    // Count
    total?: number;
    loading?: boolean;
    unitLabel?: string;
    hideCount?: boolean;

    // Buttons View mode
    viewMode?: "grid" | "list" | "map" | "split";
    onViewChange?: (mode: "grid" | "list" | "map" | "split") => void;
    showMapButton?: boolean;
    mapLink?: string;
    viewToggleContent?: React.ReactNode;
};

export function UnifiedSearchHeader({
    tabs,
    activeTab,
    onTabChange,
    keyword = "",
    onSearch,
    aiLoading = false,
    searchPlaceholder = "Tìm kiếm...",
    total = 0,
    loading = false,
    unitLabel = "tin đăng",
    hideCount = false,
    viewMode,
    onViewChange,
    showMapButton = false,
    mapLink,
    viewToggleContent,
}: UnifiedSearchHeaderProps) {
    const router = useRouter();

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && onSearch) {
                onSearch(e.currentTarget.value);
            }
        },
        [onSearch]
    );

    return (
        <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
            {/* ─── Left: Tabs & Count ─── */}
            <div className="flex items-center gap-4">
                {tabs && tabs.length > 0 && (
                    <div className="flex rounded-xl border border-[var(--border)] bg-[var(--card)] p-1">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.value;
                            return (
                                <button
                                    key={tab.value}
                                    onClick={() => onTabChange?.(tab.value)}
                                    className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${isActive
                                        ? tab.colorClass || "bg-[var(--primary)] text-white shadow-sm"
                                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {!hideCount && (
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <span className="text-base sm:text-xl font-bold text-[var(--foreground)]">
                            {loading ? "..." : total.toLocaleString("vi-VN")}
                        </span>
                        <span className="text-xs sm:text-sm text-[var(--muted-foreground)] whitespace-nowrap">{unitLabel}</span>
                    </div>
                )}
            </div>

            {/* ─── Right: Search & View Modes ─── */}
            <div className="flex flex-1 items-center justify-end gap-3 min-w-0 md:max-w-md lg:max-w-max">
                {onSearch && (
                    <div className="relative flex-1 min-w-0 md:max-w-md lg:max-w-lg">
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            defaultValue={keyword}
                            onKeyDown={handleKeyDown}
                            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] pl-10 pr-16 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        />
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                        <button
                            disabled={aiLoading}
                            onClick={() => {
                                const input = document.querySelector('input[placeholder="' + searchPlaceholder + '"]') as HTMLInputElement;
                                if (input) onSearch(input.value);
                            }}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 rounded-lg bg-[var(--primary)] px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                        >
                            {aiLoading ? "..." : "Tìm"}
                        </button>
                    </div>
                )}

                {/* Nút Xem thẻ / Danh sách dạng Group (Chỉ show khi có onViewChange và không phải mode có mapLink đặc thù) */}
                {viewToggleContent ? (
                    viewToggleContent
                ) : onViewChange && (
                    <div className="hidden md:flex rounded-xl border border-[var(--border)] bg-[var(--card)] p-0.5 shrink-0">
                        <button
                            onClick={() => onViewChange("grid")}
                            className={`rounded-md p-1.5 transition ${viewMode === "grid" ? "bg-[var(--primary-light)] text-[var(--primary)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                }`}
                        >
                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onViewChange("list")}
                            className={`rounded-md p-1.5 transition ${viewMode === "list" || viewMode === "split" ? "bg-[var(--primary-light)] text-[var(--primary)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                }`}
                        >
                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Nút Xem Bản Đồ riêng biệt */}
                {showMapButton && mapLink && (
                    <Link
                        href={mapLink}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 h-10 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    >
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                            <line x1="8" y1="2" x2="8" y2="18" />
                            <line x1="16" y1="6" x2="16" y2="22" />
                        </svg>
                        Bản đồ
                    </Link>
                )}
            </div>
        </div>
    );
}
