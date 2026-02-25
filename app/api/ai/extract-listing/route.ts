import { NextResponse } from "next/server";
import { callGeminiChat } from "@/lib/ai";

/**
 * Trích xuất thông tin BĐS từ văn bản thô
 */
export async function POST(req: Request) {
    try {
        const { text } = await req.json();
        if (!text || typeof text !== "string" || text.trim().length < 10) {
            return NextResponse.json(
                { error: "Vui lòng nhập nội dung tin đăng (tối thiểu 10 ký tự)." },
                { status: 400 }
            );
        }

        const prompt = `
Bạn là AI chuyên trích xuất dữ liệu bất động sản từ tin rao vặt tiếng Việt.
Nhiệm vụ: Phân tích đoạn văn bản dưới đây và trả về JSON cấu trúc.
Quy tắc:
- Chỉ trả về JSON, không kèm lời dẫn.
- Nếu không tìm thấy thông tin, trả về null hoặc "".
- "category" phải thuộc danh sách: CAN_HO_CHUNG_CU, NHA_RIENG, NHA_MAT_PHONG, DAT_NEN, KHO_NHA_XUONG, BDS_KHAC.
- "listingType" là SALE (bán) hoặc RENT (cho thuê). Mặc định là SALE nếu không rõ.
- "price": Chuyển về số nguyên (VNĐ). Ví dụ: 5.5 tỷ -> 5500000000.
- "area": Chuyển về số (m²).
- "provinceName", "wardName", "address": Trích xuất địa danh.

Văn bản:
"""
${text.slice(0, 2000)}
"""

JSON Template:
{
  "title": "Tiêu đề ngắn gọn gợi ý từ nội dung",
  "description": "Nội dung gốc đã được chỉnh sửa lại cho chuyên nghiệp hơn (giữ nguyên ý nghĩa)",
  "listingType": "SALE" | "RENT",
  "category": "Enum",
  "price": number | null,
  "area": number | null,
  "bedrooms": number | null,
  "bathrooms": number | null,
  "direction": "Đông" | "Tây" | "Nam" | "Bắc" | "Đông Nam" | "Đông Bắc" | "Tây Nam" | "Tây Bắc" | null,
  "legalStatus": "Sổ đỏ/Sổ hồng" | "Hợp đồng mua bán" | "Đang chờ sổ" | null,
  "address": "Địa chỉ cụ thể (tên đường/số nhà)",
  "wardName": "Tên phường/xã",
  "provinceName": "Tên tỉnh/thành phố"
}
`;

        const responseText = await callGeminiChat(
            [
                {
                    role: "system",
                    content:
                        "Bạn là trợ lý AI xử lý dữ liệu JSON. Chỉ trả về JSON hợp lệ, không có markdown formatting.",
                },
                { role: "user", content: prompt },
            ],
            { maxTokens: 1000, temperature: 0.2 }
        );

        // Clean markdown code blocks if present
        const cleanJson = responseText.replace(/```json\n?|\n?```/g, "").trim();
        const data = JSON.parse(cleanJson);

        return NextResponse.json({ data });
    } catch (error) {
        console.error("Extract listing error:", error);
        return NextResponse.json(
            { error: "Không thể phân tích nội dung. Vui lòng thử lại chi tiết hơn." },
            { status: 500 }
        );
    }
}
