"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type FavoriteButtonProps = {
  listingId: string;
  className?: string;
  compact?: boolean;
};

// Global cache for favorite listing IDs to avoid duplicate fetches
const favoriteCache: { ids?: string[], promise?: Promise<string[]> } = {};

async function fetchFavoriteIds(): Promise<string[]> {
  if (favoriteCache.ids) return favoriteCache.ids;
  if (favoriteCache.promise) return favoriteCache.promise;
  favoriteCache.promise = fetch("/api/favorites").then(r => r.json()).then(data => {
    favoriteCache.ids = data.data?.map((item: any) => item.id) || [];
    return favoriteCache.ids!;
  }).catch(() => []);
  return favoriteCache.promise;
}

export function FavoriteButton({ listingId, className, compact = false }: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (session) {
      fetchFavoriteIds().then(ids => {
        if (ids.includes(listingId)) setAdded(true);
      });
    }
  }, [session, listingId]);

  async function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      window.location.href = `/dang-nhap?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    if (loading) return;
    setLoading(true);
    try {
      if (added) {
        const response = await fetch(`/api/favorites?listingId=${listingId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          window.alert("Không thể xóa khỏi danh sách yêu thích.");
          return;
        }
        setAdded(false);
        if (favoriteCache.ids) {
          favoriteCache.ids = favoriteCache.ids.filter(id => id !== listingId);
        }
      } else {
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId }),
        });
        if (!response.ok) {
          window.alert("Không thể thêm vào danh sách yêu thích.");
          return;
        }
        setAdded(true);
        if (favoriteCache.ids && !favoriteCache.ids.includes(listingId)) {
          favoriteCache.ids.push(listingId);
        }
      }
      window.dispatchEvent(new CustomEvent("favorite-updated"));
    } catch {
      window.alert("Có lỗi xảy ra.");
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
        className
          ? `${className} ${added ? '!border-rose-500 !text-rose-500' : ''} ${loading ? "opacity-70" : ""}`
          : `inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition ${
              added
                ? "border-rose-500 text-rose-500 bg-[var(--card)]"
                : "border-[var(--border)] text-[var(--foreground)] bg-[var(--card)] hover:bg-[var(--background)]"
            } ${loading ? "opacity-70" : ""}`
      }
      title={added ? "Đã yêu thích" : "Yêu thích"}
    >
      {loading ? (
        <svg className="size-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : added ? (
        <svg className="size-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
      <span className={`${compact ? "hidden sm:inline ml-1.5" : "ml-1.5"}`}>
        {loading ? "Đang xử lý..." : added ? "Đã yêu thích" : compact ? "Yêu thích" : "Lưu tin"}
      </span>
    </button>
  );
}
