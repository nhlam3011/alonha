import { NextResponse } from "next/server";
import { callGeminiChat } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provinceName, wardName } = body;

    if (!provinceName) {
      return NextResponse.json({ error: "Thiếu thông tin tỉnh/thành" }, { status: 400 });
    }

    const listingCount = await prisma.listing.count({
      where: {
        status: "APPROVED",
        provinceName: { contains: provinceName, mode: "insensitive" },
      },
    });

    const avgPrice = await prisma.listing.aggregate({
      where: {
        status: "APPROVED",
        provinceName: { contains: provinceName, mode: "insensitive" },
        listingType: "SALE",
      },
      _avg: { price: true, pricePerSqm: true, area: true },
      _count: { id: true },
    });

    const categoryBreakdown = await prisma.listing.groupBy({
      by: ["category"],
      where: {
        status: "APPROVED",
        provinceName: { contains: provinceName, mode: "insensitive" },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const marketSummary = `
Thống kê thị trường ${wardName ? `${wardName}, ` : ""}${provinceName}:
- Tổng tin đăng đã duyệt: ${listingCount}
- Giá trung bình: ${avgPrice._avg.price ? Number(avgPrice._avg.price).toLocaleString("vi-VN") + "đ" : "N/A"}
- Đơn giá trung bình: ${avgPrice._avg.pricePerSqm ? Number(avgPrice._avg.pricePerSqm).toLocaleString("vi-VN") + "đ/m²" : "N/A"}
- Diện tích TB: ${avgPrice._avg.area ? Math.round(Number(avgPrice._avg.area)) + "m²" : "N/A"}
- Phân loại: ${categoryBreakdown.map((c) => `${c.category}: ${c._count.id}`).join(", ")}
`;

    const prompt = `
Bạn là chuyên gia phân tích đô thị và bất động sản Việt Nam.
Hãy đánh giá tổng hợp khu vực ${wardName ? `${wardName}, ` : ""}${provinceName}, Việt Nam.

${marketSummary}

Trả về JSON hợp lệ (không markdown):
{
  "locationName": "${wardName ? `${wardName}, ` : ""}${provinceName}",
  "overallScore": <1-10 điểm tổng>,
  "scores": {
    "anNinh": { "score": <1-10>, "label": "An ninh", "desc": "Mô tả ngắn" },
    "giaoThong": { "score": <1-10>, "label": "Giao thông", "desc": "Mô tả ngắn" },
    "giaoDuc": { "score": <1-10>, "label": "Giáo dục", "desc": "Mô tả ngắn" },
    "yTe": { "score": <1-10>, "label": "Y tế", "desc": "Mô tả ngắn" },
    "thuongMai": { "score": <1-10>, "label": "Thương mại", "desc": "Mô tả ngắn" },
    "moiTruong": { "score": <1-10>, "label": "Môi trường", "desc": "Mô tả ngắn" },
    "tienIch": { "score": <1-10>, "label": "Tiện ích", "desc": "Mô tả ngắn" },
    "giaTri": { "score": <1-10>, "label": "Giá trị BĐS", "desc": "Mô tả ngắn" }
  },
  "highlights": ["Điểm nổi bật 1", "Điểm nổi bật 2", "Điểm nổi bật 3"],
  "concerns": ["Điểm cần lưu ý 1", "Điểm cần lưu ý 2"],
  "summary": "Tóm tắt đánh giá tổng quan trong 3-4 câu",
  "suitableFor": ["Gia đình trẻ", "Nhà đầu tư", "Người về hưu"],
  "nearbyLandmarks": ["Địa điểm 1", "Địa điểm 2", "Địa điểm 3"]
}

Đánh giá dựa trên kiến thức thực tế về khu vực tại Việt Nam. Nếu là khu vực trung tâm thành phố lớn thì điểm an ninh, giao thông, tiện ích thường cao.
`;

    const raw = await callGeminiChat(
      [
        { role: "system", content: "Bạn là chuyên gia phân tích đô thị Việt Nam. Chỉ trả về JSON hợp lệ." },
        { role: "user", content: prompt },
      ],
      { maxTokens: 1500, temperature: 0.3 }
    );

    const json = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());

    return NextResponse.json({
      success: true,
      data: {
        ...json,
        marketStats: {
          listingCount,
          avgPrice: avgPrice._avg.price ? Number(avgPrice._avg.price) : null,
          avgPricePerSqm: avgPrice._avg.pricePerSqm ? Number(avgPrice._avg.pricePerSqm) : null,
        },
      },
    });
  } catch (error) {
    console.error("Neighborhood score error:", error);
    return NextResponse.json({ error: "Không thể phân tích khu vực. Vui lòng thử lại." }, { status: 500 });
  }
}
