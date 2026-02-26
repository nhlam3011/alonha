"use client";

import { ReactNode } from "react";

type UnifiedFilterBarProps = {
    children: ReactNode;
    sortOptions?: { value: string; label: string }[];
    activeSort?: string;
    onSortChange?: (val: string) => void;
    // Cho phép đẩy vào thêm children ở cuối (nút Reset filter v.v.)
    appendRight?: ReactNode;
};

export function UnifiedFilterBar({
    children,
    sortOptions,
    activeSort,
    onSortChange,
    appendRight,
}: UnifiedFilterBarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2 py-2 w-full relative">
            {/* Container chứa các filter component (select, dropdown) do cha truyền vào */}
            {children}

            <div className="ml-auto flex shrink-0 items-center gap-2 md:pl-2 md:border-l border-[var(--border)] bg-[var(--background)] z-10">
                {sortOptions && sortOptions.length > 0 && onSortChange && (
                    <select
                        value={activeSort || ""}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="filter-select !shadow-none !border-none bg-transparent hover:!border-none focus:!border-none focus:!ring-0 min-w-[120px]"
                    >
                        {sortOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                )}
                {appendRight}
            </div>
        </div>
    );
}
