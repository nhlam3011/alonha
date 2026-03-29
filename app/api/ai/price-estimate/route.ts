import { NextResponse } from "next/server";
import { callGeminiChat } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, provinceName, wardName, area, bedrooms, bathrooms, direction, condition, listingType } = body;

    if (!category || !provinceName || !area) {
      return NextResponse.json({ error: "Thiếu thông tin: category, provinceName, area là bắt buộc" }, { status: 400 });
    }

    const approvedListings = await prisma.listing.findMany({
      where: {
        status: "APPROVED",
        provinceName: { contains: provinceName, mode: "insensitive" },
        category: category as any,
        area: { gte: Number(area) * 0.7, lte: Number(area) * 1.3 },
      },
      select: {
        price: true,
        pricePerSqm: true,
        area: true,
        bedrooms: true,
        provinceName: true,
        wardName: true,
        category: true,
        listingType: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const marketContext = approvedListings.length > 0
      ? `Dữ liệu thị trường từ ${approvedListings.length} tin đăng đã duyệt:\n${
          approvedListings.slice(0, 20).map((l) =>
            `- ${l.listingType === "SALE" ? "Bán" : "Cho thuê"}: ${l.area}m², ${l.bedrooms || "?"}PN, ${Number(l.price).toLocaleString("vi-VN")}đ, ${l.wardName || l.provinceName}, ${(l as any).category}`
          ).join("\n")
        }`
      : "Không có dữ liệu thị trường trực tiếp cho khu vực này.";

    const prompt = `
Bạn là chuyên gia định giá bất động sản tại Việt Nam với 20 năm kinh nghiệm.
Dựa vào thông tin BĐS và dữ liệu thị trường bên dưới, hãy đưa ra phân tích định giá chi tiết.

THÔNG TIN BĐS CẦN ĐỊNH GIÁ:
- Loại: ${category}
- Vị trí: ${wardName || ""}, ${provinceName}
- Diện tích: ${area} m²
- Phòng ngủ: ${bedrooms || "Không rõ"}
- Phòng tắm: ${bathrooms || "Không rõ"}
- Hướng: ${direction || "Không rõ"}
- Tình trạng: ${condition || "Không rõ"}
- Loại giao dịch: ${listingType === "rent" ? "Cho thuê" : "Mua bán"}

${marketContext}

Hãy trả về JSON hợp lệ (không markdown), với format:
{
  "estimatedPrice": <số nguyên VNĐ>,
  "estimatedPricePerSqm": <số nguyên VNĐ/m²>,
  "priceRange": { "min": <số>, "max": <số> },
  "confidence": <0-100>,
  "vsAreaAverage": "<so sánh với mặt bằng: cao hơn/thấp hơn X%>",
  "priceTrend": "<xu hướng giá 12 tháng gần nhất: tăng/giảm X%>",
  "factors": [
    { "name": "Tên yếu tố", "impact": "positive/negative/neutral", "desc": "Mô tả ngắn" }
  ],
  "investmentRating": <1-5 sao>,
  "summary": "Tóm tắt phân tích định giá trong 2-3 câu",
  "recommendation": "Lời khuyên cho người mua/bán"
}

Lưu ý:
- Nếu không có dữ liệu thị trường, hãy dựa trên kiến thức chung về giá BĐS tại ${provinceName}, Việt Nam
- Ước tính phải hợp lý với thực tế thị trường Việt Nam 2024-2025
- confidence phản ánh mức độ tin cậy dựa trên lượng dữ liệu có được
`;

    const raw = await callGeminiChat(
      [
        { role: "system", content: "Bạn là chuyên gia định giá BĐS Việt Nam. Chỉ trả về JSON hợp lệ." },
        { role: "user", content: prompt },
      ],
      { maxTokens: 1500, temperature: 0.3 }
    );

    const json = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());

    return NextResponse.json({
      success: true,
      data: {
        ...json,
        dataPoints: approvedListings.length,
        queryTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Price estimate error:", error);
    return NextResponse.json({ error: "Không thể phân tích định giá. Vui lòng thử lại." }, { status: 500 });
  }
}
