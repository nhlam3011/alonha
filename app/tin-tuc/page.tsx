import { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { NewsClientFilters, NewsPagination } from "./ClientFilters";

export const metadata: Metadata = {
  title: "Tin tức Bất động sản | AloNha",
  description: "Cập nhật tin tức thị trường bất động sản mới nhất, chính sách, cẩm nang và dự án.",
};

// --- RSS Logic ---
const RSS_SOURCES = [
  { id: "vnexpress", name: "VnExpress BĐS", url: "https://vnexpress.net/rss/bat-dong-san.rss", category: "thi-truong" },
  { id: "cafef", name: "CafeF BĐS", url: "https://cafef.vn/bat-dong-san.rss", category: "thi-truong" },
  { id: "dantri", name: "Dân trí BĐS", url: "https://dantri.com.vn/bat-dong-san.rss", category: "thi-truong" },
  { id: "batdongsan", name: "Batdongsan.com.vn", url: "https://batdongsan.com.vn/rss/tin-tuc.rss", category: "cam-nang" },
];

type RSSItem = { title: string; link: string; description: string; pubDate: string; source: string; sourceId: string; category: string; imageUrl?: string; };

function parseRSS(xml: string, source: typeof RSS_SOURCES[0]): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemContent = match[1];
    const titleMatch = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i.exec(itemContent);
    const title = titleMatch ? (titleMatch[1] || titleMatch[2] || "").trim() : "";

    const linkMatch = /<link>(.*?)<\/link>/i.exec(itemContent);
    const link = linkMatch ? linkMatch[1].trim() : "";

    const descMatch = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/i.exec(itemContent);
    let description = descMatch ? (descMatch[1] || descMatch[2] || "").trim() : "";
    description = description.replace(/<[^>]*>/g, "").trim();

    let imageUrl: string | undefined;
    const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(descMatch?.[1] || "");
    if (imgMatch) imageUrl = imgMatch[1];
    const enclosureMatch = /<enclosure[^>]+url=["']([^"']+)["']/i.exec(itemContent);
    if (enclosureMatch) imageUrl = enclosureMatch[1];

    const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/i.exec(itemContent);
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : "";

    if (title && link) {
      items.push({ title, link, description: description.substring(0, 300), pubDate, source: source.name, sourceId: source.id, category: source.category, imageUrl });
    }
  }
  return items;
}

function generateSlug(title: string) {
  return title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").substring(0, 100);
}
function generateId(link: string) {
  const hash = link.split("").reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
  return Math.abs(hash).toString(36);
}
function getCategoryLabel(category: string) {
  const labels: Record<string, string> = { "thi-truong": "Thị trường", "chinh-sach": "Chính sách", "cam-nang": "Cẩm nang", "du-an": "Dự án", "phong-thuy": "Phong thủy" };
  return labels[category] || "Tin tức";
}
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80";
function getDefaultImage(index: number) {
  const images = [
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
    "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80",
  ];
  return images[index % images.length];
}

type NewsArticle = {
  id: string; slug: string; title: string; excerpt: string; category: string; categoryLabel: string;
  imageUrl: string; author: string; publishedAt: string; readTime: number; views: number; sourceUrl?: string;
  source?: string; sourceId?: string;
};

// --- Main Component ---
export default async function NewsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.searchParams;
  const cookieStore = await cookies();
  const viewMode = (cookieStore.get("news_viewMode")?.value as "grid" | "list") || "grid";

  const category = typeof params.category === "string" ? params.category : "";
  const source = typeof params.source === "string" ? params.source : "";
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  const limit = 12;
  const page = typeof params.page === "string" ? Math.max(1, parseInt(params.page)) : 1;

  // Fetch RSS data
  const fetchPromises = RSS_SOURCES
    .filter((s) => !source || s.id === source)
    .map(async (rssSource) => {
      try {
        const response = await fetch(rssSource.url, {
          headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/rss+xml" },
          next: { revalidate: 900 },
        });
        if (!response.ok) return [];
        const xml = await response.text();
        return parseRSS(xml, rssSource);
      } catch (e) {
        return [];
      }
    });

  const results = await Promise.all(fetchPromises);
  let allItems = results.flat();

  allItems.sort((a, b) => {
    const dateA = new Date(a.pubDate).getTime();
    const dateB = new Date(b.pubDate).getTime();
    return sort === "oldest" ? dateA - dateB : dateB - dateA; // popular sort is faked later
  });

  if (category) allItems = allItems.filter((item) => item.category === category);

  const total = allItems.length;
  const startIndex = (page - 1) * limit;
  const paginatedItems = allItems.slice(startIndex, startIndex + limit);

  const articles: NewsArticle[] = paginatedItems.map((item, index) => ({
    id: generateId(item.link),
    slug: generateSlug(item.title),
    title: item.title,
    excerpt: item.description,
    category: item.category,
    categoryLabel: getCategoryLabel(item.category),
    imageUrl: item.imageUrl || getDefaultImage(index),
    author: item.source,
    publishedAt: item.pubDate,
    readTime: Math.max(2, Math.ceil(item.description.length / 500)),
    views: Math.floor(Math.random() * 1000) + 100, // mock views
    sourceUrl: item.link,
    source: item.source,
    sourceId: item.sourceId,
  }));

  if (sort === "popular") {
    articles.sort((a, b) => b.views - a.views);
  }

  const featuredArticle = page === 1 && articles.length > 0 ? articles[0] : null;
  const regularArticles = page === 1 ? articles.slice(1) : articles;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <NewsClientFilters total={total} sources={RSS_SOURCES} initialViewMode={viewMode} />

      <div className="layout-container px-4 py-6 md:px-10">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] py-20">
            <div className="flex size-16 items-center justify-center rounded-full bg-[var(--primary-light)]">
              <svg className="size-7 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
            </div>
            <p className="mt-4 text-base font-medium text-[var(--foreground)]">Không có bài viết</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Chưa có bài viết nào trong danh mục này</p>
          </div>
        ) : (
          <div className="space-y-6">
            {featuredArticle && <ArticleCard article={featuredArticle} isFeatured />}

            <div className={viewMode === "list" ? "space-y-4" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"}>
              {regularArticles.map((article) => (
                <ArticleCard key={article.id} article={article} viewMode={viewMode} />
              ))}
            </div>

            <NewsPagination total={total} currentPage={page} limit={limit} />
          </div>
        )}
      </div>
    </div>
  );
}

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
  if (views >= 1000) return `${(views / 1000).toFixed(1)}k`;
  return String(views);
}

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
      <div className={`relative overflow-hidden bg-[var(--muted)] ${isFeatured ? "h-64 sm:h-80" : viewMode === "list" ? "w-48 shrink-0 aspect-auto h-32" : "aspect-video"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.imageUrl || DEFAULT_IMAGE}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {isFeatured && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />}
      </div>

      <div className={isFeatured ? "absolute bottom-0 left-0 right-0 p-6" : `p-4 flex flex-col justify-center ${viewMode === "list" ? "flex-1" : ""}`}>
        {isFeatured ? (
          <>
            <span className="inline-block rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-medium text-white mb-3">
              {article.categoryLabel}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 line-clamp-2">{article.title}</h2>
            <p className="text-sm text-white/80 line-clamp-2 hidden sm:block">{article.excerpt}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-white/70">
              <span>{article.author}</span><span>•</span><span>{formatDate(article.publishedAt)}</span><span>•</span><span>{article.readTime} phút đọc</span>
            </div>
          </>
        ) : (
          <>
            <span className="inline-block self-start rounded-full bg-[var(--primary-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--primary)] mb-2">
              {article.categoryLabel}
            </span>
            <h3 className="text-base font-semibold text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors">{article.title}</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2">{article.excerpt}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <span>{formatDate(article.publishedAt)}</span><span>•</span><span>{article.readTime} phút</span>
              <span className="flex items-center gap-1 ml-auto">
                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {formatViews(article.views)}
              </span>
            </div>
          </>
        )}
      </div>
    </>
  );

  if (article.sourceUrl) {
    return (
      <a
        href={article.sourceUrl} target="_blank" rel="noopener noreferrer"
        className={`group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:shadow-lg transition-all ${isFeatured ? "block relative" : viewMode === "list" ? "flex" : "flex flex-col"}`}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={`/tin-tuc/${article.slug}`}
      className={`group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:shadow-lg transition-all ${isFeatured ? "block relative" : viewMode === "list" ? "flex" : "flex flex-col"}`}
    >
      {content}
    </Link>
  );
}
