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

        const prompt = `
Bạn là AI chuyên phân tích câu tìm kiếm bất động sản tiếng Việt.
Phân tích câu sau và trả về JSON. Chỉ trả về JSON hợp lệ, không kèm markdown.

Câu: "${query}"

Quy tắc trích xuất Giá (priceMin, priceMax) BẮT BUỘC (Tuân thủ theo thứ tự ưu tiên):
1. ƯU TIÊN SỐ 1 - Có từ so sánh giới hạn:
   - Nếu có từ "dưới", "thấp hơn", "tối đa", "nhỏ hơn", "<": CHỈ trích xuất priceMax = X, priceMin = null (hoặc 0). TUYỆT ĐỐI không áp dụng Rule 3.
     *Ví dụ: "dưới 12 tỷ" -> { priceMin: null, priceMax: 12000000000 }*
   - Nếu có từ "trên", "cao hơn", "từ", "tối thiểu", "lớn hơn", ">": CHỈ trích xuất priceMin = X, priceMax = null. TUYỆT ĐỐI không áp dụng Rule 3.
     *Ví dụ: "trên 5 tỷ" -> { priceMin: 5000000000, priceMax: null }*
   - Nếu có từ "đến", "tới", "trong khoảng X đến Y": Trích xuất cả priceMin và priceMax.
     *Ví dụ: "từ 3 đến 5 tỷ" -> { priceMin: 3000000000, priceMax: 5000000000 }*

2. ƯU TIÊN SỐ 2 - Không có từ so sánh (Giá ước lượng):
   - Nếu người dùng nhập "khoảng X", "tầm X", "loanh quanh X" hoặc chỉ nhắc đến một mức giá X duy nhất (ví dụ: "nhà 5 tỷ") MÀ KHÔNG kèm các từ giới hạn (dưới/trên/tối đa...):
     Hãy tự động tạo một khoảng giá linh hoạt (±20% giá trị X, tối đa ±1 tỷ) để kết quả đa dạng hơn.
     *Ví dụ: "5 tỷ" hoặc "tầm 5 tỷ" -> { priceMin: 4500000000, priceMax: 5500000000 }*

3. Định dạng: "priceMin", "priceMax" phải là số nguyên (VNĐ). "X tỷ Y triệu" (ví dụ: 5 tỷ 200 triệu) -> 5.200.000.000.

Quy tắc khác:
- "loaiHinh": "sale" (mua bán) hoặc "rent" (cho thuê). null nếu không rõ.
- "category": một trong các giá trị sau: "can-ho-chung-cu" | "nha-rieng" | "nha-mat-pho" | "dat-nen" | "kho-nha-xuong" | "biet-thu" | "bds-khac". null nếu không rõ.
  Lưu ý: Bạn phải hiểu được các biến thể không dấu, sai chính tả nhẹ (nha rieg, can ho...) để trích xuất vào category. "nhà phố" -> "nha-mat-pho".
- "provinceName": Tên tỉnh/thành phố đầy đủ tiếng Việt có dấu, hoặc null.
- "bedrooms": số phòng ngủ (số nguyên), hoặc null.
- "areaMin", "areaMax": diện tích m² (số nguyên), hoặc null.
- "keyword": Phần từ khóa còn lại sau khi đã trích xuất các thông tin trên. Nếu đã trích xuất hết ý nghĩa vào các trường khác thì để "". Tuyệt đối không để lại các từ đã được phân loại vào category/province... trong keyword.

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
        return NextResponse.json({ keyword: query || "" });
    }
}
