import { callGeminiChat } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { huong, sao, loai, cungMenh, nguHanh, nhomTrach } = body;

        if (!huong || !sao || !cungMenh) {
            return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
        }

        const prompt = `Bạn là chuyên gia phong thủy Bát Trạch. Hãy phân tích chi tiết hướng "${huong}" với sao "${sao}" (loại: ${loai}) cho người có Cung Mệnh "${cungMenh}", Ngũ Hành "${nguHanh}", nhóm "${nhomTrach}".

Trả về JSON (không markdown, không code block) với cấu trúc:
{
  "mucDo": "Mức độ tốt/xấu (ví dụ: Đại Cát, Thượng Cát, Trung Cát, Tiểu Cát, Tiểu Hung, Trung Hung, Thượng Hung, Đại Hung)",
  "saoTen": "Tên đầy đủ của sao và ý nghĩa ngắn gọn",
  "yNghia": "Phân tích chi tiết 3-4 câu về ý nghĩa hướng này đối với gia chủ, liên hệ với cung mệnh và ngũ hành của họ",
  "nenDat": ["Danh sách 4-6 thứ nên đặt/bố trí ở hướng này, mỗi mục kèm lý do ngắn"],
  "khongNenDat": ["Danh sách 3-5 thứ không nên đặt ở hướng này, mỗi mục kèm lý do ngắn"],
  "luuY": "Lời khuyên phong thủy cụ thể 2-3 câu dành riêng cho cung mệnh này, bao gồm cách hóa giải nếu là hướng xấu hoặc cách tăng cường nếu là hướng tốt",
  "vatPhamHoaGiai": ["Danh sách 2-4 vật phẩm phong thủy phù hợp để đặt ở hướng này"],
  "mauSacPhong": "Gợi ý màu sắc phù hợp cho phòng/khu vực ở hướng này"
}`;

        const response = await callGeminiChat(
            [{ role: "user", content: prompt }],
            { maxTokens: 1500, temperature: 0.3 }
        );

        // Parse JSON from response
        const cleaned = response.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const data = JSON.parse(cleaned);

        return NextResponse.json({ data });
    } catch (error) {
        console.error("Feng Shui AI error:", error);
        return NextResponse.json(
            { error: "Không thể phân tích phong thủy. Vui lòng thử lại." },
            { status: 500 }
        );
    }
}
