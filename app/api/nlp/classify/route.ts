import { NextResponse } from "next/server";
import { callGeminiChat } from "@/lib/ai";

type ClassifyBody = {
  title?: string;
  description?: string;
};

const CATEGORIES = [
  { slug: "can-ho-chung-cu", label: "Căn hộ chung cư" },
  { slug: "nha-rieng", label: "Nhà riêng" },
  { slug: "nha-mat-phong", label: "Nhà mặt phố" },
  { slug: "dat-nen", label: "Đất nền" },
  { slug: "biet-thu", label: "Biệt thự" },
  { slug: "van-phong", label: "Văn phòng" },
  { slug: "mat-bang", label: "Mặt bằng" },
  { slug: "kho-nha-xuong", label: "Kho nhà xưởng" },
  { slug: "bds-khac", label: "BĐS khác" },
];

const LISTING_TYPES = [
  { value: "SALE", label: "Mua bán" },
  { value: "RENT", label: "Cho thuê" },
];

const AMENITIES = [
  { slug: "wc", label: "Nhà vệ sinh" },
  { slug: "balcony", label: "Ban công" },
  { slug: "garden", label: "Sân vườn" },
  { slug: "parking", label: "Chỗ để xe" },
  { slug: "furniture", label: "Nội thất" },
  { slug: "security", label: "An ninh" },
  { slug: "pool", label: "Hồ bơi" },
  { slug: "gym", label: "Gym" },
  { slug: "elevator", label: "Thang máy" },
  { slug: "basement", label: "Hầm để xe" },
  { slug: "backhouse", label: "Nhà trọ" },
];

const DIRECTIONS = [
  "Đông", "Tây", "Nam", "Bắc", "Đông Bắc", "Tây Bắc", "Đông Nam", "Tây Nam"
];

export async function POST(req: Request) {
  const body: ClassifyBody = await req.json().catch(() => ({}));
  const { title = "", description = "" } = body;

  if (!title && !description) {
    return NextResponse.json({ error: "Thiếu title hoặc description" }, { status: 400 });
  }

  const text = `${title}. ${description}`.slice(0, 2000);

  try {
    const systemPrompt = `Bạn là chuyên gia phân loại bất động sản tại Việt Nam. Nhiệm vụ là phân tích mô tả tin đăng và trích xuất các thông tin cấu trúc.`;

    const userPrompt = `
Phân tích tin đăng bất động sản sau đây và trả về JSON:
"""${text}"""

YÊU CẦU:
1. category: Xác định loại BĐS (slug tiếng Việt, không dấu):
${CATEGORIES.map(c => `- ${c.slug}: ${c.label}`).join("\n")}

2. listingType: Xác định mua bán hay cho thuê:
- SALE: Mua bán
- RENT: Cho thuê

3. amenities: Trích xuất các tiện ích có trong mô tả:
${AMENITIES.map(a => `- ${a.slug}: ${a.label}`).join("\n")}

4. direction: Xác định hướng nhà (nếu có):
${DIRECTIONS.map(d => `- ${d}`).join("\n")}

5. suggestedTags: Đề xuất tags phù hợp (tối đa 5 tags ngắn gọn)

Trả về JSON:
{
  "category": "can-ho-chung-cu",
  "listingType": "SALE",
  "amenities": ["furniture", "parking", "elevator"],
  "direction": "Đông",
  "suggestedTags": ["view sông", "gần trường học", "nội thất cao cấp"]
}
`;

    const raw = await callGeminiChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 500 }
    );

    let jsonText = raw.trim();
    const first = jsonText.indexOf("{");
    const last = jsonText.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      jsonText = jsonText.slice(first, last + 1);
    }

    const parsed = JSON.parse(jsonText);

    return NextResponse.json({
      category: parsed.category || null,
      listingType: parsed.listingType || null,
      amenities: Array.isArray(parsed.amenities) ? parsed.amenities : [],
      direction: parsed.direction || null,
      suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : [],
    });
  } catch (e) {
    return NextResponse.json({
      error: "Không thể phân loại tin đăng",
      category: null,
      listingType: null,
      amenities: [],
      direction: null,
      suggestedTags: [],
    });
  }
}
