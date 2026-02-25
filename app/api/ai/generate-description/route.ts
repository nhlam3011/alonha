import { NextResponse } from "next/server";
import { callGeminiChat } from "@/lib/ai";

type GenerateDescriptionInput = {
  title?: unknown;
  listingType?: unknown;
  category?: unknown;
  price?: unknown;
  area?: unknown;
  bedrooms?: unknown;
  bathrooms?: unknown;
  direction?: unknown;
  legalStatus?: unknown;
  address?: unknown;
  provinceName?: unknown;
  districtName?: unknown;
  keywords?: unknown;
  tone?: unknown;
  targetAudience?: unknown;
};

function toSafeText(value: unknown): string {
  return typeof value === "string" ? value.slice(0, 500) : "";
}

function toPositiveNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

const CATEGORY_LABEL: Record<string, string> = {
  CAN_HO_CHUNG_CU: "Căn hộ chung cư",
  NHA_RIENG: "Nhà riêng",
  NHA_MAT_PHONG: "Nhà mặt phố",
  DAT_NEN: "Đất nền",
  KHO_NHA_XUONG: "Kho/nhà xưởng",
  BDS_KHAC: "Bất động sản khác",
};

function formatPrice(value: number | null) {
  if (value == null || !Number.isFinite(value) || value <= 0) return "chưa cập nhật";
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} tỷ`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)} triệu`;
  return `${Math.round(value).toLocaleString("vi-VN")} đ`;
}

function buildFallbackDescription(input: {
  title: string;
  listingType: string;
  categoryLabel: string;
  priceText: string;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  direction: string;
  legalStatus: string;
  locationText: string;
  keywords: string;
  targetAudience: string;
}) {
  const parts: string[] = [];
  parts.push(
    `${input.listingType} ${input.categoryLabel.toLowerCase()} ${
      input.title ? `"${input.title}"` : ""
    } tại ${input.locationText || "khu vực thuận tiện"}, mức giá ${input.priceText}.`.replace(/\s+/g, " ").trim()
  );
  if (input.area != null && input.area > 0) {
    parts.push(`Diện tích sử dụng khoảng ${input.area} m², bố trí không gian tối ưu.`);
  }
  if (input.bedrooms != null || input.bathrooms != null) {
    parts.push(
      `Công năng gồm ${input.bedrooms ?? "—"} phòng ngủ và ${input.bathrooms ?? "—"} phòng tắm, phù hợp nhu cầu ở thực.`
    );
  }
  if (input.direction || input.legalStatus) {
    const spec = [
      input.direction ? `hướng ${input.direction}` : "",
      input.legalStatus ? `pháp lý ${input.legalStatus}` : "",
    ]
      .filter(Boolean)
      .join(", ");
    if (spec) parts.push(`Thông tin nổi bật: ${spec}.`);
  }
  if (input.keywords) {
    parts.push(`Điểm cộng thêm: ${input.keywords}.`);
  }
  if (input.targetAudience) {
    parts.push(`Bất động sản đặc biệt phù hợp với ${input.targetAudience.toLowerCase()}.`);
  }
  parts.push("Liên hệ để xem thực tế và nhận thêm thông tin chi tiết.");
  return parts.join("\n");
}

export async function POST(req: Request) {
  const body: GenerateDescriptionInput = await req.json().catch(() => ({}));

  const {
    title,
    listingType,
    category,
    price,
    area,
    bedrooms,
    bathrooms,
    direction,
    legalStatus,
    address,
    provinceName,
    districtName,
    keywords,
    tone,
    targetAudience,
  } = body || {};

  const safeTitle = toSafeText(title);
  const safeArea = toPositiveNumber(area);
  const safePrice = toPositiveNumber(price);
  const safeBedrooms = toPositiveNumber(bedrooms);
  const safeBathrooms = toPositiveNumber(bathrooms);
  const safeDirection = toSafeText(direction);
  const safeLegalStatus = toSafeText(legalStatus);
  const safeAddress = toSafeText(address);
  const safeProvince = toSafeText(provinceName);
  const safeDistrict = toSafeText(districtName);
  const safeKeywords = toSafeText(keywords);
  const safeTone = toSafeText(tone) || "chuyên nghiệp, đáng tin cậy";
  const safeAudience = toSafeText(targetAudience) || "gia đình trẻ hoặc người mua ở thực";
  const categoryRaw = toSafeText(category).toUpperCase();
  const categoryLabel = CATEGORY_LABEL[categoryRaw] || toSafeText(category) || "Bất động sản";
  const listingTypeLabel = listingType === "RENT" ? "Cho thuê" : "Bán";
  const locationText = [safeAddress, safeDistrict, safeProvince].filter(Boolean).join(", ");
  const priceText = formatPrice(safePrice);

  const prompt = `
Bạn là AI viết nội dung tin đăng bất động sản cho nền tảng Alonha tại Việt Nam.
Yêu cầu:
- Viết bằng tiếng Việt, giọng ${safeTone}, rõ ràng, không phóng đại quá mức.
- Ưu tiên thông tin thực tế: vị trí, diện tích, tiện ích, pháp lý, phù hợp với người mua/thuê.
- Không bịa đặt tiện ích không được đề cập.
- Không chèn số điện thoại.
- Tránh dùng emoji.
- Kết thúc bằng 1 câu kêu gọi hành động nhẹ nhàng.
- Chỉ dựa vào dữ liệu được cung cấp dưới đây.

Thông tin tin đăng:
- Tiêu đề: ${safeTitle}
- Loại giao dịch: ${listingTypeLabel}
- Loại BĐS: ${categoryLabel}
- Mức giá: ${priceText}
- Diện tích: ${safeArea != null ? `${safeArea} m²` : ""}
- Số phòng ngủ: ${safeBedrooms != null ? safeBedrooms : ""}
- Số phòng tắm: ${safeBathrooms != null ? safeBathrooms : ""}
- Hướng: ${safeDirection}
- Pháp lý: ${safeLegalStatus}
- Địa chỉ chi tiết: ${safeAddress}
- Khu vực: ${safeProvince} ${safeDistrict}
- Từ khóa / điểm nổi bật: ${safeKeywords}
- Đối tượng mục tiêu: ${safeAudience}

Yêu cầu kết quả:
1) Trả về "Mô tả đề xuất" dài 5-8 câu, chia 2-3 đoạn ngắn để dễ đọc.
2) Sau mô tả, thêm dòng "Tiêu đề gợi ý: ..."
3) Sau đó thêm dòng "Điểm nhấn: ..." gồm 3 ý ngắn cách nhau bằng dấu " | ".
`;

  try {
    const description = await callGeminiChat(
      [
        {
          role: "system",
          content:
            "Bạn là chuyên gia copywriting trong lĩnh vực bất động sản tại Việt Nam, hỗ trợ viết mô tả tin đăng rõ ràng, trung thực.",
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 380 }
    );

    const cleaned = description.trim();
    return NextResponse.json({
      description:
        cleaned ||
        buildFallbackDescription({
          title: safeTitle,
          listingType: listingTypeLabel,
          categoryLabel,
          priceText,
          area: safeArea,
          bedrooms: safeBedrooms,
          bathrooms: safeBathrooms,
          direction: safeDirection,
          legalStatus: safeLegalStatus,
          locationText,
          keywords: safeKeywords,
          targetAudience: safeAudience,
        }),
    });
  } catch {
    const fallback = buildFallbackDescription({
      title: safeTitle,
      listingType: listingTypeLabel,
      categoryLabel,
      priceText,
      area: safeArea,
      bedrooms: safeBedrooms,
      bathrooms: safeBathrooms,
      direction: safeDirection,
      legalStatus: safeLegalStatus,
      locationText,
      keywords: safeKeywords,
      targetAudience: safeAudience,
    });

    return NextResponse.json({
      description:
        fallback ||
        "Nhập đầy đủ thông tin và từ khóa, hệ thống sẽ gợi ý mô tả chi tiết cho tin đăng của bạn.",
    });
  }
}

