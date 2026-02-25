import { callGeminiChat } from "./lib/ai";

const ALLOWED_CATEGORY_SLUGS = new Set([
    "can-ho-chung-cu",
    "nha-rieng",
    "nha-mat-phong",
    "dat-nen",
    "kho-nha-xuong",
    "biet-thu",
    "van-phong",
    "mat-bang",
    "bds-khac",
]);

function normalizeCategorySlug(value: any): string | null {
    if (typeof value !== "string") return null;
    const slug = value.trim().toLowerCase();
    return ALLOWED_CATEGORY_SLUGS.has(slug) ? slug : null;
}

async function testSearchIntent(query: string) {
    const systemPrompt =
        "Bạn là trợ lý AI cho nền tảng bất động sản Alonha tại Việt Nam. Nhiệm vụ là phân tích câu mô tả nhu cầu của khách (tiếng Việt) và trích xuất các bộ lọc tìm kiếm cấu trúc. Chỉ làm việc với nhà đất tại Việt Nam.";

    const userPrompt = `
Khách mô tả nhu cầu tìm bất động sản như sau (tiếng Việt):
"""${query}"""

Hãy:
1. Hiểu rõ nhu cầu: mua/thuê (sale/rent), loại BĐS, tầm giá, diện tích, số phòng ngủ.
2. Quy đổi về bộ lọc chuẩn theo format JSON bên dưới.

YÊU CẦU:
- Chỉ trả về JSON, KHÔNG kèm giải thích bên ngoài.
- keyword: cụm từ tìm kiếm ngắn gọn, có thể là khu vực, dự án, tuyến đường hoặc mô tả chính.

STRUCT JSON ĐẦU RA:
{
  "filters": {
    "keyword": "căn hộ 2 ngủ quận 7",
    "loaiHinh": "sale",
    "category": "can-ho-chung-cu",
    "priceMin": 3000000000,
    "priceMax": 5000000000,
    "areaMin": 60,
    "areaMax": 90,
    "bedrooms": 2
  }
}
`;

    try {
        const raw = await callGeminiChat(
            [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            { maxTokens: 380 }
        );

        let jsonText = raw.trim();
        const first = jsonText.indexOf("{");
        const last = jsonText.lastIndexOf("}");
        if (first !== -1 && last !== -1 && last > first) {
            jsonText = jsonText.slice(first, last + 1);
        }

        const parsed = JSON.parse(jsonText);
        console.log("Input:", query);
        console.log("AI Result:", JSON.stringify(parsed, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

testSearchIntent("căn hộ tại Hà nội");
