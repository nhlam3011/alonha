import { NextResponse } from "next/server";
import { callGeminiChat } from "@/lib/ai";

/**
 * Parse câu tìm kiếm tự nhiên thành các filter params bằng Gemini AI.
 */
export async function POST(req: Request) {
    let query = "";
    let mode = "listing";
    try {
        const body = await req.json();
        query = (body.query ?? "").trim().slice(0, 300);
        mode = body.mode ?? "listing";

        if (!query) {
            return NextResponse.json({ keyword: "" });
        }

        if (mode === "project") {
            const prompt = `
Bạn là AI chuyên phân tích câu tìm kiếm dự án bất động sản tiếng Việt.
Phân tích câu sau và trả về JSON. Chỉ trả về JSON hợp lệ, không kèm markdown.

Câu: "${query}"

JSON Template:
{
  "keyword": "Từ khóa tên dự án (bỏ tên tỉnh/thành nếu đã trích xuất)",
  "provinceName": "Tên tỉnh/thành phố đầy đủ tiếng Việt có dấu, hoặc null"
}
`;

            const raw = await callGeminiChat(
                [
                    { role: "system", content: "Chỉ trả về JSON hợp lệ, không markdown." },
                    { role: "user", content: prompt },
                ],
                { maxTokens: 200, temperature: 0.1 }
            );

            const json = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
            return NextResponse.json({
                keyword: json.keyword || query,
                provinceName: json.provinceName || null,
            });
        }

        // mode = "listing"
        const prompt = `
Bạn là AI chuyên phân tích câu tìm kiếm bất động sản tiếng Việt.
Phân tích câu sau và trả về JSON. Chỉ trả về JSON hợp lệ, không kèm markdown.

Câu: "${query}"

Quy tắc:
- "loaiHinh": "sale" (mua bán) hoặc "rent" (cho thuê). null nếu không rõ.
- "category": một trong các giá trị sau (hoặc null nếu không rõ):
  "can-ho-chung-cu" | "nha-rieng" | "nha-mat-phong" | "dat-nen" | "kho-nha-xuong" | "bds-khac"
  Lưu ý: "căn hộ", "chung cư" → "can-ho-chung-cu"; "nhà riêng", "nhà phố" → "nha-rieng"; "đất nền" → "dat-nen"
- "provinceName": Tên tỉnh/thành phố đầy đủ tiếng Việt có dấu (ví dụ "Hà Nội", "TP. Hồ Chí Minh"), hoặc null.
- "bedrooms": số phòng ngủ (số nguyên), hoặc null.
- "priceMin", "priceMax": giá bằng VNĐ (số nguyên). Ví dụ: "dưới 3 tỷ" → priceMax: 3000000000. null nếu không rõ.
- "areaMin", "areaMax": diện tích m² (số nguyên), hoặc null.
- "keyword": Phần từ khóa còn lại sau khi đã trích xuất các thông tin trên (tên tòa nhà, khu vực, dự án...). Nếu không còn gì rõ ràng thì để "".

JSON Template:
{
  "loaiHinh": null,
  "category": null,
  "provinceName": null,
  "bedrooms": null,
  "priceMin": null,
  "priceMax": null,
  "areaMin": null,
  "areaMax": null,
  "keyword": ""
}
`;

        const raw = await callGeminiChat(
            [
                { role: "system", content: "Chỉ trả về JSON hợp lệ, không markdown." },
                { role: "user", content: prompt },
            ],
            { maxTokens: 300, temperature: 0.1 }
        );

        const json = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());

        return NextResponse.json({
            loaiHinh: json.loaiHinh || null,
            category: json.category || null,
            provinceName: json.provinceName || null,
            bedrooms: json.bedrooms ?? null,
            priceMin: json.priceMin ?? null,
            priceMax: json.priceMax ?? null,
            areaMin: json.areaMin ?? null,
            areaMax: json.areaMax ?? null,
            keyword: json.keyword || "",
        });
    } catch (error) {
        console.error("AI search parse error:", error);
        // Fallback: trả về keyword thô để tìm thủ công
        return NextResponse.json({ keyword: query || "" });
    }
}
