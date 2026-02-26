"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export type SelectOption = {
    value: string;
    label: string;
};

type SearchableSelectProps = {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    /** "form" = taller, rounded-lg for forms. "filter" = compact pill style like filter-select */
    variant?: "form" | "filter";
    className?: string;
};

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "-- Chọn --",
    disabled = false,
    variant = "form",
    className = "",
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!containerRef.current || !dropdownRef.current) return;
            // NextJS Portal renders node outside containerRef
            const isOutsideContainer = !containerRef.current.contains(e.target as Node);
            const isOutsideDropdown = !dropdownRef.current.contains(e.target as Node);

            if (isOutsideContainer && isOutsideDropdown) {
                setOpen(false);
                setSearch("");
            }
        };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Focus input when opened
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

    const normalize = useCallback(
        (str: string) =>
            str
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/đ/g, "d")
                .replace(/Đ/g, "D"),
        []
    );

    const filtered = search.trim()
        ? options.filter((o) => normalize(o.label).includes(normalize(search)))
        : options;

    const handleSelect = (val: string) => {
        onChange(val);
        setOpen(false);
        setSearch("");
    };

    const isFilter = variant === "filter";

    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const updateCoords = useCallback(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    }, []);

    useEffect(() => {
        if (open) {
            updateCoords();
            window.addEventListener("scroll", updateCoords, true);
            window.addEventListener("resize", updateCoords);
            return () => {
                window.removeEventListener("scroll", updateCoords, true);
                window.removeEventListener("resize", updateCoords);
            };
        }
    }, [open, updateCoords]);

    const dropdownNode = open ? (
        <div
            ref={dropdownRef}
            className="ss-dropdown"
            style={{
                position: "fixed",
                top: coords.top - window.scrollY,
                left: coords.left - window.scrollX,
                width: Math.max(220, coords.width),
                zIndex: 99999
            }}
        >
            {/* Search input */}
            <div className="ss-search-wrap">
                <svg className="ss-search-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="ss-search-input"
                    onKeyDown={(e) => {
                        if (e.key === "Escape") { setOpen(false); setSearch(""); }
                        if (e.key === "Enter" && filtered.length === 1) { handleSelect(filtered[0].value); }
                    }}
                />
                {search && (
                    <button onClick={() => setSearch("")} className="ss-search-clear">×</button>
                )}
            </div>

            {/* Options list */}
            <div className="ss-options">
                {filtered.length === 0 ? (
                    <div className="ss-empty">Không tìm thấy kết quả</div>
                ) : (
                    filtered.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelect(opt.value)}
                            className={`ss-option ${opt.value === value ? "ss-option-active" : ""}`}
                        >
                            {opt.label}
                            {opt.value === value && (
                                <svg className="ss-check" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    ) : null;

    return (
        <div ref={containerRef} className={`searchable-select ${isFilter ? "ss-filter" : "ss-form"} ${className}`}>
            {/* Trigger */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => { if (!disabled) { updateCoords(); setOpen((o) => !o); } }}
                className={`ss-trigger ${isFilter ? "ss-trigger-filter" : "ss-trigger-form"} ${disabled ? "ss-disabled" : ""}`}
                title={selectedLabel || placeholder}
            >
                <span className={`ss-trigger-text ${!value ? "ss-placeholder" : ""}`}>
                    {selectedLabel || placeholder}
                </span>
                <svg className="ss-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8l4 4 4-4" />
                </svg>
            </button>

            {/* Dropdown */}
            {typeof window !== "undefined" && dropdownNode ? createPortal(dropdownNode, document.body) : null}
        </div>
    );
}
