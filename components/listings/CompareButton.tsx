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
    >
      {loading ? "Đang thêm..." : added ? "Đã thêm so sánh" : compact ? "So sánh" : "Thêm so sánh"}
    </button>
  );
}
