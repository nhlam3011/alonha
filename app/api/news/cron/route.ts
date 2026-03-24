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

        const { mainImage, allImages } = extractImages(itemContent, descMatch?.[1], source.url);

        const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/i.exec(itemContent);
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : "";

        const guidMatch = /<guid[^>]*>(.*?)<\/guid>/i.exec(itemContent);
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

async function crawlAndSaveNews(): Promise<{ newArticles: number; updatedArticles: number }> {
    let newCount = 0;
    let updateCount = 0;

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
                                views: existing.views + Math.floor(Math.random() * 5),
                                updatedAt: new Date(),
                            },
                        });
                        updateCount++;
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
                        newCount++;
                    }
                } catch (error) {
                    console.error(`Error saving article:`, error);
                }
            }
        } catch (error) {
            console.error(`Error fetching ${rssSource.url}:`, error);
        }
    }

    return { newArticles: newCount, updatedArticles: updateCount };
}

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        console.log("Starting news crawl...");
        const startTime = Date.now();

        const result = await crawlAndSaveNews();

        const duration = Date.now() - startTime;

        console.log(`News crawl completed in ${duration}ms. New: ${result.newArticles}, Updated: ${result.updatedArticles}`);

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const deletedOld = await prisma.news.deleteMany({
            where: {
                crawledAt: { lt: ninetyDaysAgo },
                isFeatured: false,
                views: { lt: 500 }, // Preserve articles with 500+ views
            },
        });

        if (deletedOld.count > 0) {
            console.log(`Deleted ${deletedOld.count} old articles`);
        }

        return NextResponse.json({
            success: true,
            message: "News crawl completed",
            newArticles: result.newArticles,
            updatedArticles: result.updatedArticles,
            deletedOldArticles: deletedOld.count,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error in news cron:", error);
        return NextResponse.json(
            { error: "Failed to crawl news" },
            { status: 500 }
        );
    }
}
