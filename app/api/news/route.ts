import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const RSS_SOURCES = [
    {
        id: "vietnamplus",
        name: "VietnamPlus",
        url: "https://www.vietnamplus.vn/rss/kinhte/batdongsan-372.rss",
        category: "thi-truong",
    },
    {
        id: "vnexpress",
        name: "VnExpress",
        url: "https://vnexpress.net/rss/bat-dong-san.rss",
        category: "thi-truong",
    },
    {
        id: "cafef",
        name: "CafeF",
        url: "https://cafef.vn/bat-dong-san.rss",
        category: "thi-truong",
    },
    {
        id: "vnbusiness",
        name: "VNBusiness",
        url: "https://vnbusiness.vn/rss/bat-dong-san.rss",
        category: "thi-truong",
    },
];

// const AUTO_CRAWL_INTERVAL_MINUTES = 30;

type RSSItem = {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    source: string;
    sourceId: string;
    category: string;
    imageUrl?: string;
    allImages?: string[];
};

function extractImages(itemContent: string, description?: string, sourceUrl?: string): { mainImage: string | undefined; allImages: string[] } {
    const images: string[] = [];
    let mainImage: string | undefined;
    const baseUrl = sourceUrl || "https://vietnamplus.vn";

    const addImage = (url: string) => {
        if (!url) return;
        const resolvedUrl = resolveImageUrl(baseUrl, url);
        if (resolvedUrl && isValidImageUrl(resolvedUrl)) {
            images.push(resolvedUrl);
            if (!mainImage) mainImage = resolvedUrl;
        }
    };

    const mediaContentRegex = /<media:content[^>]+url=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = mediaContentRegex.exec(itemContent)) !== null) {
        addImage(match[1]);
    }

    const mediaThumbRegex = /<media:thumbnail[^>]+url=["']([^"']+)["'][^>]*>/gi;
    while ((match = mediaThumbRegex.exec(itemContent)) !== null) {
        addImage(match[1]);
    }

    const enclosureRegex = /<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image\//gi;
    while ((match = enclosureRegex.exec(itemContent)) !== null) {
        addImage(match[1]);
    }

    const descContent = description || "";
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    while ((match = imgRegex.exec(descContent)) !== null) {
        addImage(match[1]);
    }

    const dataSrcRegex = /data-src=["']([^"']+)["']|background-image:url\(["']?([^"')]+)["']?\)/gi;
    while ((match = dataSrcRegex.exec(descContent)) !== null) {
        addImage(match[1] || match[2]);
    }

    const ogImageRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi;
    while ((match = ogImageRegex.exec(descContent)) !== null) {
        addImage(match[1] || match[2]);
    }

    const itunesImageRegex = /<itunes:image[^>]+href=["']([^"']+)["']/gi;
    while ((match = itunesImageRegex.exec(itemContent)) !== null) {
        addImage(match[1]);
    }

    const contentEncodedRegex = /<content:encoded>([\s\S]*?)<\/content:encoded>/gi;
    const contentMatch = contentEncodedRegex.exec(itemContent);
    if (contentMatch) {
        const contentHtml = contentMatch[1];
        const contentImgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        while ((match = contentImgRegex.exec(contentHtml)) !== null) {
            addImage(match[1]);
        }
        const contentDataSrcRegex = /data-src=["']([^"']+)["']/gi;
        while ((match = contentDataSrcRegex.exec(contentHtml)) !== null) {
            addImage(match[1]);
        }
    }

    const uniqueImages = [...new Set(images)].slice(0, 10);

    return { mainImage, allImages: uniqueImages };
}

function isValidImageUrl(url: string): boolean {
    if (!url) return false;
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("//")) return false;
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"];
    const hasExtension = validExtensions.some(ext => url.toLowerCase().includes(ext));
    const isFromCDN = url.includes("Unsplash") || url.includes("cloudfront") || url.includes("akamai") || url.includes("imgproxy") || url.includes("vietnamplus") || url.includes("vnecdn");
    const isNotPlaceholder = !url.includes("spacer") && !url.includes("blank") && !url.includes("1x1");
    return (hasExtension || isFromCDN) && isNotPlaceholder;
}

function resolveImageUrl(baseUrl: string, imageUrl: string): string {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
    }
    if (imageUrl.startsWith("//")) {
        return "https:" + imageUrl;
    }
    try {
        return new URL(imageUrl, baseUrl).href;
    } catch {
        return "";
    }
}

function parseRSS(xml: string, source: typeof RSS_SOURCES[0]): RSSItem[] {
    const items: RSSItem[] = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemContent = match[1];

        let title = "";
        const titleCdataMatch = /<title>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/title>/i.exec(itemContent);
        if (titleCdataMatch) {
            title = titleCdataMatch[1].trim();
        } else {
            const titleNormalMatch = /<title>([\s\S]*?)<\/title>/i.exec(itemContent);
            if (titleNormalMatch) title = titleNormalMatch[1].trim();
        }

        let link = "";
        const linkMatch = /<link>([\s\S]*?)<\/link>/i.exec(itemContent);
        if (linkMatch) link = linkMatch[1].trim();

        let description = "";
        const descCdataMatch = /<description>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/description>/i.exec(itemContent);
        if (descCdataMatch) {
            description = descCdataMatch[1].trim();
        } else {
            const descNormalMatch = /<description>([\s\S]*?)<\/description>/i.exec(itemContent);
            if (descNormalMatch) description = descNormalMatch[1].trim();
        }

        description = description.replace(/<[^>]*>/g, "").trim();

        const { mainImage, allImages } = extractImages(itemContent, description, source.url);

        const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(itemContent);
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : "";

        const guidMatch = /<guid[^>]*>([\s\S]*?)<\/guid>/i.exec(itemContent);
        const originalId = guidMatch ? guidMatch[1].trim() : link;

        if (title && link) {
            items.push({
                title,
                link,
                description: description.substring(0, 500),
                pubDate,
                source: source.name,
                sourceId: source.id,
                category: source.category,
                imageUrl: mainImage,
                allImages,
            });
        }
    }

    return items;
}

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

function autoCategorize(title: string, description: string): string {
    const content = `${title} ${description}`.toLowerCase();

    const categoryKeywords: Record<string, string[]> = {
        "thi-truong": ["thị trường", "giá bán", "giá thuê", "xu hướng", "dự báo", "tăng trưởng", "biến động", "điều chỉnh", "sụt giảm", "hồi phục", "nhu cầu", "cung cầu"],
        "doanh-nghiep": ["doanh nghiệp", "công ty", "ceo", "lãnh đạo", "đầu tư", "niêm yết", "ipo", "cổ phần", "lợi nhuận", "doanh thu"],
        "du-an": ["dự án", "quy hoạch", "khu đô thị", "khu dân cư", "khu phức hợp", "cao ốc", "xây dựng", "khởi công", "hoàn thành", "bàn giao", "mở bán"],
        "tai-chinh": ["tài chính", "ngân hàng", "lãi suất", "vay mua", "thế chấp", "tín dụng", "huy động", "cho vay", "trái phiếu"],
        "ha-tang": ["hạ tầng", "giao thông", "đường cao tốc", "cầu", "hầm", "sân bay", "cảng", "metro", "bến xe", "nâng cấp", "mở rộng"],
        "chinh-sach": ["chính sách", "luật", "quy định", "thủ tục", "pháp lý", "giấy phép", "sổ đỏ", "sổ hồng", "thuế", "phí"],
        "cam-nang": ["cẩm nang", "hướng dẫn", "mua nhà", "bán nhà", "cho thuê", "đầu tư", "kinh nghiệm", "thủ thuật", "mẹo", "lưu ý", "cần biết"],
        "phong-thuy": ["phong thủy", "hướng nhà", "hướng cửa", "tọa độ", "bài trí", "màu sắc", "ngũ hành", "sinh khí"],
    };

    const scores: Record<string, number> = {};

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        scores[category] = 0;
        for (const keyword of keywords) {
            if (content.includes(keyword)) {
                const titleMatches = title.toLowerCase().includes(keyword) ? 2 : 1;
                scores[category] += titleMatches;
            }
        }
    }

    let maxScore = 0;
    let bestCategory = "thi-truong";

    for (const [category, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            bestCategory = category;
        }
    }

    return maxScore > 0 ? bestCategory : "thi-truong";
}

function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        "thi-truong": "Thị trường",
        "doanh-nghiep": "Doanh nghiệp",
        "du-an": "Dự án",
        "tai-chinh": "Tài chính",
        "ha-tang": "Hạ tầng",
        "chinh-sach": "Chính sách",
        "cam-nang": "Cẩm nang",
        "phong-thuy": "Phong thủy",
    };
    return labels[category] || "Tin tức";
}

async function crawlAndSaveNews(): Promise<number> {
    let savedCount = 0;

    for (const rssSource of RSS_SOURCES) {
        try {
            const response = await fetch(rssSource.url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; AlonhaBot/1.0)",
                    "Accept": "application/rss+xml, application/xml, text/xml",
                },
                next: { revalidate: 900 },
            });

            if (!response.ok) {
                console.error(`Failed to fetch ${rssSource.url}: ${response.status}`);
                continue;
            }

            const xml = await response.text();
            const items = parseRSS(xml, rssSource);

            for (const item of items) {
                try {
                    const existing = await prisma.news.findFirst({
                        where: {
                            OR: [
                                { sourceUrl: item.link },
                                { originalId: item.link },
                            ],
                        },
                    });

                    if (existing) {
                        await prisma.news.update({
                            where: { id: existing.id },
                            data: {
                                title: item.title,
                                excerpt: item.description,
                                imageUrl: item.imageUrl || existing.imageUrl,
                                imageUrls: item.allImages?.length ? item.allImages : existing.imageUrls,
                                views: existing.views + Math.floor(Math.random() * 10), // Increment views slightly
                                updatedAt: new Date(),
                            },
                        });
                    } else {
                        const autoCategory = autoCategorize(item.title, item.description);

                        await prisma.news.create({
                            data: {
                                sourceId: item.sourceId,
                                sourceName: item.source,
                                originalId: item.link,
                                slug: generateSlug(item.title),
                                title: item.title,
                                excerpt: item.description,
                                imageUrl: item.imageUrl,
                                imageUrls: item.allImages || [],
                                category: autoCategory,
                                categoryLabel: getCategoryLabel(autoCategory),
                                sourceUrl: item.link,
                                publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                                views: Math.floor(Math.random() * 1000) + 100,
                                isActive: true,
                            },
                        });
                        savedCount++;
                    }
                } catch (error) {
                    console.error(`Error saving article:`, error);
                }
            }
        } catch (error) {
            console.error(`Error fetching ${rssSource.url}:`, error);
        }
    }

    return savedCount;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || "";
    const source = searchParams.get("source") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const forceCrawl = searchParams.get("forceCrawl") === "true";

    try {
        const where: any = { isActive: true };

        if (category) {
            where.category = category;
        }

        if (source) {
            where.sourceId = source;
        }

        const total = await prisma.news.count({ where });

        const totalPages = Math.ceil(total / limit);
        const skip = (page - 1) * limit;

        let news = await prisma.news.findMany({
            where,
            orderBy: { publishedAt: "desc" },
            skip,
            take: limit,
        });

        if (forceCrawl) {
            await crawlAndSaveNews();

            // Refresh data after crawl
            const newTotal = await prisma.news.count({ where });
            const newNews = await prisma.news.findMany({
                where,
                orderBy: { publishedAt: "desc" },
                skip,
                take: limit,
            });

            return NextResponse.json({
                data: transformNews(newNews),
                total: newTotal,
                page,
                totalPages: Math.ceil(newTotal / limit),
                sources: RSS_SOURCES.map((s) => ({ id: s.id, name: s.name })),
            });
        }

        function transformNews(items: any[]) {
            return items.map((item, index) => ({
                id: item.id,
                slug: item.slug,
                title: item.title,
                excerpt: item.excerpt,
                category: item.category,
                categoryLabel: item.categoryLabel,
                imageUrl: item.imageUrl || getDefaultImage(index),
                author: item.author || item.sourceName,
                publishedAt: item.publishedAt?.toISOString() || item.crawledAt.toISOString(),
                readTime: Math.max(2, Math.ceil((item.excerpt?.length || 200) / 500)),
                views: item.views,
                sourceUrl: item.sourceUrl,
                source: item.sourceName,
                sourceId: item.sourceId,
                allImages: item.imageUrls,
            }));
        }

        return NextResponse.json({
            data: transformNews(news),
            total,
            page,
            totalPages,
            sources: RSS_SOURCES.map((s) => ({ id: s.id, name: s.name })),
        });
    } catch (error) {
        console.error("Error fetching news:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Failed to fetch news", details: errorMessage },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const action = body.action;

        if (action === "crawl") {
            const savedCount = await crawlAndSaveNews();
            return NextResponse.json({
                success: true,
                message: `Crawled and saved ${savedCount} new articles`,
            });
        }

        return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error in news POST:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
