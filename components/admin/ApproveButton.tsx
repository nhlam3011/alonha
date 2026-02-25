"use client";

import { useState } from "react";

export function ApproveButton({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/approve`, { method: "POST" });
      if (res.ok) setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) return <span className="text-sm text-green-600">Đã duyệt</span>;
  return (
    <button
      type="button"
      onClick={handleApprove}
      disabled={loading}
      className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "..." : "Duyệt"}
    </button>
  );
}
