import { NextRequest, NextResponse } from "next/server";

// RSS feed sources for Vietnamese real estate news
const RSS_SOURCES = [
    {
        id: "vnexpress",
        name: "VnExpress Bất động sản",
        url: "https://vnexpress.net/rss/bat-dong-san.rss",
        category: "thi-truong",
    },
    {
        id: "cafef",
        name: "CafeF Bất động sản",
        url: "https://cafef.vn/bat-dong-san.rss",
        category: "thi-truong",
    },
    {
        id: "dantri",
        name: "Dân trí Bất động sản",
        url: "https://dantri.com.vn/bat-dong-san.rss",
        category: "thi-truong",
    },
    {
        id: "batdongsan",
        name: "Batdongsan.com.vn",
        url: "https://batdongsan.com.vn/rss/tin-tuc.rss",
        category: "cam-nang",
    },
];

type RSSItem = {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    source: string;
    sourceId: string;
    category: string;
    imageUrl?: string;
};

// Parse RSS XML to extract items
function parseRSS(xml: string, source: typeof RSS_SOURCES[0]): RSSItem[] {
    const items: RSSItem[] = [];

    // Simple regex-based parsing (works for most RSS feeds)
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemContent = match[1];

        // Extract title
        const titleMatch = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i.exec(itemContent);
        const title = titleMatch ? (titleMatch[1] || titleMatch[2] || "").trim() : "";

        // Extract link
        const linkMatch = /<link>(.*?)<\/link>/i.exec(itemContent);
        const link = linkMatch ? linkMatch[1].trim() : "";

        // Extract description
        const descMatch = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/i.exec(itemContent);
        let description = descMatch ? (descMatch[1] || descMatch[2] || "").trim() : "";

        // Remove HTML tags from description
        description = description.replace(/<[^>]*>/g, "").trim();

        // Extract image from description or enclosure
        let imageUrl: string | undefined;
        const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(descMatch?.[1] || "");
        if (imgMatch) {
            imageUrl = imgMatch[1];
        }

        // Check for enclosure
        const enclosureMatch = /<enclosure[^>]+url=["']([^"']+)["']/i.exec(itemContent);
        if (enclosureMatch) {
            imageUrl = enclosureMatch[1];
        }

        // Extract pubDate
        const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/i.exec(itemContent);
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : "";

        if (title && link) {
            items.push({
                title,
                link,
                description: description.substring(0, 300),
                pubDate,
                source: source.name,
                sourceId: source.id,
                category: source.category,
                imageUrl,
            });
        }
    }

    return items;
}

// Generate a slug from title
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 100);
}

// Generate a unique ID from link
function generateId(link: string): string {
    const hash = link.split("").reduce((acc, char) => {
        return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);
    return Math.abs(hash).toString(36);
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || "";
    const source = searchParams.get("source") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");

    try {
        // Fetch RSS feeds in parallel
        const fetchPromises = RSS_SOURCES
            .filter((s) => !source || s.id === source)
            .map(async (rssSource) => {
                try {
                    const response = await fetch(rssSource.url, {
                        headers: {
                            "User-Agent": "Mozilla/5.0 (compatible; AlonhaBot/1.0)",
                            "Accept": "application/rss+xml, application/xml, text/xml",
                        },
                        // Cache for 15 minutes
                        next: { revalidate: 900 },
                    });

                    if (!response.ok) {
                        console.error(`Failed to fetch ${rssSource.url}: ${response.status}`);
                        return [];
                    }

                    const xml = await response.text();
                    return parseRSS(xml, rssSource);
                } catch (error) {
                    console.error(`Error fetching ${rssSource.url}:`, error);
                    return [];
                }
            });

        const results = await Promise.all(fetchPromises);
        let allItems = results.flat();

        // Sort by date (newest first)
        allItems.sort((a, b) => {
            const dateA = new Date(a.pubDate).getTime();
            const dateB = new Date(b.pubDate).getTime();
            return dateB - dateA;
        });

        // Filter by category if specified
        if (category) {
            allItems = allItems.filter((item) => item.category === category);
        }

        // Calculate pagination
        const total = allItems.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const paginatedItems = allItems.slice(startIndex, startIndex + limit);

        // Transform items for response
        const transformedItems = paginatedItems.map((item, index) => ({
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
            views: Math.floor(Math.random() * 1000) + 100,
            sourceUrl: item.link,
            source: item.source,
            sourceId: item.sourceId,
        }));

        return NextResponse.json({
            data: transformedItems,
            total,
            page,
            totalPages,
            sources: RSS_SOURCES.map((s) => ({ id: s.id, name: s.name })),
        });
    } catch (error) {
        console.error("Error fetching news:", error);
        return NextResponse.json(
            { error: "Failed to fetch news" },
            { status: 500 }
        );
    }
}

function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        "thi-truong": "Thị trường",
        "chinh-sach": "Chính sách",
        "cam-nang": "Cẩm nang",
        "du-an": "Dự án",
        "phong-thuy": "Phong thủy",
    };
    return labels[category] || "Tin tức";
}

function getDefaultImage(index: number): string {
    const images = [
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
        "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
        "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80",
    ];
    return images[index % images.length];
}
