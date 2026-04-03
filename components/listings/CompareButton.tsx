"use client";

import { useState } from "react";

type CompareButtonProps = {
  listingId: string;
  className?: string;
  compact?: boolean;
};

export function CompareButton({ listingId, className, compact = false }: CompareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        window.alert(data.error || "Không thể thêm vào danh sách so sánh.");
        return;
      }
      setAdded(true);
      window.dispatchEvent(new CustomEvent("compare-updated"));
    } catch {
      window.alert("Không thể thêm vào danh sách so sánh.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={loading}
      className={
        className ??
        `inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition ${
          added
            ? "border-[var(--success-border)] text-[var(--success-text)]"
            : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--background)]"
        } ${loading ? "opacity-70" : ""}`
      }
      style={added ? { background: "var(--success-bg)" } : undefined}
      title={added ? "Đã thêm so sánh" : "Thêm vào so sánh"}
    >
      {loading ? (
        <svg className="size-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : added ? (
        <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )}
      <span className={`${compact ? "hidden sm:inline ml-1.5" : "ml-1.5"}`}>
        {loading ? "Đang thêm..." : added ? "Đã thêm" : compact ? "So sánh" : "Thêm so sánh"}
      </span>
    </button>
  );
}
