"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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

type NewsSource = {
  id: string;
  name: string;
};

type NewsArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
  readTime: number;
  views: number;
  sourceUrl?: string;
  source?: string;
  sourceId?: string;
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80";

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "";
  }
}

function formatViews(views: number): string {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}k`;
  }
  return String(views);
}

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 12;

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(ITEMS_PER_PAGE));
      params.set("page", String(page));
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedSource) params.set("source", selectedSource);

      const res = await fetch(`/api/news?${params.toString()}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setArticles([]);
        setTotal(0);
      } else {
        let sortedArticles = [...(data.data || [])];

        // Sort articles
        if (sort === "newest") {
          sortedArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        } else if (sort === "oldest") {
          sortedArticles.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
        } else if (sort === "popular") {
          sortedArticles.sort((a, b) => b.views - a.views);
        }

        setArticles(sortedArticles);
        setTotal(data.total || 0);

        if (data.sources) {
          setSources(data.sources);
        }
      }
    } catch (err) {
      console.error("Error fetching news:", err);
      setError("Không thể tải tin tức. Vui lòng thử lại sau.");
      setArticles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, selectedSource, sort]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedSource, sort]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1;

  // Featured article is the first one
  const featuredArticle = articles[0];
  const regularArticles = articles.slice(1);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="layout-container px-4 py-3 md:px-10">
          {/* Header with count */}
          <div className="flex items-center gap-4 mb-3">
            <h1 className="text-xl font-bold text-[var(--foreground)]">Tin tức</h1>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-lg font-bold text-[var(--foreground)]">
                {loading ? "..." : total.toLocaleString("vi-VN")}
              </span>
              <span className="text-sm text-[var(--muted-foreground)]">bài viết</span>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mb-3">
            {NEWS_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${selectedCategory === cat.value
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]"
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {/* Source filter */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="form-input h-9 w-auto min-w-[140px] rounded-full !py-1.5 !px-3 !text-xs"
            >
              <option value="">Tất cả nguồn</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="form-input h-9 w-auto rounded-full !py-1.5 !px-3 !text-xs"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <div className="hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-0.5 sm:flex">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md p-1.5 ${viewMode === "grid" ? "bg-[var(--primary-light)] text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}
                  aria-label="Grid"
                >
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-md p-1.5 ${viewMode === "list" ? "bg-[var(--primary-light)] text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}
                  aria-label="List"
                >
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="layout-container px-4 py-6 md:px-10">
        {loading ? (
          // Loading skeleton
          <div className="space-y-6">
            {/* Featured skeleton */}
            <div className="animate-pulse overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              <div className="h-64 bg-[var(--border)]/50" />
              <div className="p-6 space-y-3">
                <div className="h-4 w-20 rounded bg-[var(--border)]/50" />
                <div className="h-6 w-3/4 rounded bg-[var(--border)]/50" />
                <div className="h-4 w-full rounded bg-[var(--border)]/50" />
              </div>
            </div>
            {/* Grid skeleton */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
                  <div className="h-44 bg-[var(--border)]/50" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-20 rounded bg-[var(--border)]/50" />
                    <div className="h-5 w-2/3 rounded bg-[var(--border)]/50" />
                    <div className="h-4 w-full rounded bg-[var(--border)]/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] py-20">
            <div className="flex size-16 items-center justify-center rounded-full bg-[var(--danger-bg)]">
              <svg className="size-7 text-[var(--danger-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="mt-4 text-base font-medium text-[var(--foreground)]">Không thể tải tin tức</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{error}</p>
            <button
              onClick={() => fetchNews()}
              className="mt-4 rounded-full bg-[var(--primary)] px-6 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Thử lại
            </button>
          </div>
        ) : articles.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] py-20">
            <div className="flex size-16 items-center justify-center rounded-full bg-[var(--primary-light)]">
              <svg className="size-7 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <p className="mt-4 text-base font-medium text-[var(--foreground)]">Không có bài viết</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Chưa có bài viết nào trong danh mục này</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Featured Article */}
            {featuredArticle && (
              <ArticleCard article={featuredArticle} isFeatured />
            )}

            {/* Regular Articles */}
            <div className={viewMode === "list" ? "space-y-4" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"}>
              {regularArticles.map((article) => (
                <ArticleCard key={article.id} article={article} viewMode={viewMode} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === pageNum
                        ? "bg-[var(--primary)] text-white"
                        : "border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Article Card Component
function ArticleCard({
  article,
  isFeatured = false,
  viewMode = "grid"
}: {
  article: NewsArticle;
  isFeatured?: boolean;
  viewMode?: "grid" | "list";
}) {
  const content = (
    <>
      {/* Image */}
      <div className={`relative overflow-hidden bg-[var(--muted)] ${isFeatured ? "h-64 sm:h-80" : viewMode === "list" ? "w-48 shrink-0 aspect-auto h-32" : "aspect-video"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.imageUrl || DEFAULT_IMAGE}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {isFeatured && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        )}
      </div>

      {/* Content */}
      <div className={isFeatured ? "absolute bottom-0 left-0 right-0 p-6" : `p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
        {isFeatured ? (
          <>
            <span className="inline-block rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-medium text-white mb-3">
              {article.categoryLabel}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 line-clamp-2">
              {article.title}
            </h2>
            <p className="text-sm text-white/80 line-clamp-2 hidden sm:block">
              {article.excerpt}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-white/70">
              <span>{article.author}</span>
              <span>•</span>
              <span>{formatDate(article.publishedAt)}</span>
              <span>•</span>
              <span>{article.readTime} phút đọc</span>
            </div>
          </>
        ) : (
          <>
            <span className="inline-block rounded-full bg-[var(--primary-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--primary)] mb-2">
              {article.categoryLabel}
            </span>
            <h3 className="text-base font-semibold text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
              {article.title}
            </h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2">
              {article.excerpt}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <span>{formatDate(article.publishedAt)}</span>
              <span>•</span>
              <span>{article.readTime} phút</span>
              <span className="flex items-center gap-1 ml-auto">
                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {formatViews(article.views)}
              </span>
            </div>
          </>
        )}
      </div>
    </>
  );

  // If article has external source URL, open in new tab
  if (article.sourceUrl) {
    return (
      <a
        href={article.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:shadow-lg transition-all ${isFeatured ? "block relative" : viewMode === "list" ? "flex" : ""
          }`}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={`/tin-tuc/${article.slug}`}
      className={`group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:shadow-lg transition-all ${isFeatured ? "block relative" : viewMode === "list" ? "flex" : ""
        }`}
    >
      {content}
    </Link>
  );
}
