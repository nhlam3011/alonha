import { NextResponse } from "next/server";
import { callGeminiChat } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, provinceName, budget, investmentType, holdingPeriod } = body;

    if (!provinceName || !budget) {
      return NextResponse.json({ error: "Thiếu thông tin: provinceName và budget là bắt buộc" }, { status: 400 });
    }

    const budgetNum = Number(budget);
    const period = Number(holdingPeriod) || 5;

    const listings = await prisma.listing.findMany({
      where: {
        status: "APPROVED",
        listingType: "SALE",
        provinceName: { contains: provinceName, mode: "insensitive" },
        ...(category ? { category: category as any } : {}),
        price: { gte: budgetNum * 0.5, lte: budgetNum * 1.5 },
      },
      select: {
        price: true,
        pricePerSqm: true,
        area: true,
        bedrooms: true,
        category: true,
        wardName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    const rentListings = await prisma.listing.findMany({
      where: {
        status: "APPROVED",
        listingType: "RENT",
        provinceName: { contains: provinceName, mode: "insensitive" },
        ...(category ? { category: category as any } : {}),
      },
      select: {
        price: true,
        area: true,
        bedrooms: true,
        category: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const avgBuyPrice = listings.length > 0
      ? listings.reduce((s, l) => s + Number(l.price), 0) / listings.length
      : 0;

    const avgRentPrice = rentListings.length > 0
      ? rentListings.reduce((s, l) => s + Number(l.price), 0) / rentListings.length
      : 0;

    const grossYield = avgBuyPrice > 0 ? ((avgRentPrice * 12) / avgBuyPrice) * 100 : 0;

    const marketContext = `
Dữ liệu thị trường ${provinceName}:
- Số tin bán tìm được: ${listings.length} (giá từ ${budgetNum * 0.5 / 1e9} tỷ - ${budgetNum * 1.5 / 1e9} tỷ)
- Giá bán TB: ${avgBuyPrice > 0 ? (avgBuyPrice / 1e9).toFixed(2) + " tỷ" : "N/A"}
- Số tin cho thuê: ${rentListings.length}
- Giá thuê TB: ${avgRentPrice > 0 ? (avgRentPrice / 1e6).toFixed(1) + " triệu/tháng" : "N/A"}
- Tỷ suất cho thuê brutto: ${grossYield.toFixed(2)}%/năm
`;

    const prompt = `
Bạn là chuyên gia phân tích đầu tư bất động sản Việt Nam với 15 năm kinh nghiệm.
Hãy đưa ra phân tích đầu tư chi tiết dựa trên thông tin sau.

THÔNG TIN ĐẦU TƯ:
- Ngân sách: ${(budgetNum / 1e9).toFixed(2)} tỷ VNĐ
- Loại BĐS: ${category || "Tất cả"}
- Khu vực: ${provinceName}
- Loại đầu tư: ${investmentType === "rent" ? "Cho thuê" : investmentType === "flip" ? "Lướt sóng" : "Dài hạn"}
- Thời gian nắm giữ: ${period} năm

${marketContext}

Trả về JSON hợp lệ (không markdown):
{
  "roi": {
    "yearlyProjection": [
      { "year": 1, "propertyValue": <giá trị BĐS>, "rentalIncome": <thu nhập thuê/năm>, "totalReturn": <tổng lợi nhuận>, "cumulativeROI": <% ROI tích lũy> }
    ],
    "totalROI": <% ROI tổng sau X năm>,
    "annualizedROI": <% ROI trung bình/năm>,
    "breakEvenYear": <năm hoàn vốn>
  },
  "rentalYield": {
    "grossYield": <% tỷ suất brutto>,
    "netYield": <% tỷ suất netto sau chi phí>,
    "estimatedMonthlyRent": <triệu VNĐ/tháng>,
    "occupancyRate": <% tỷ lệ lấp đầy dự kiến>
  },
  "comparison": {
    "vsBankDeposit": "<so sánh với lãi suất ngân hàng ~6-7%/năm>",
    "vsGold": "<so sánh với đầu tư vàng>",
    "vsStock": "<so sánh với chứng khoán>"
  },
  "risks": [
    { "name": "Tên rủi ro", "level": "high/medium/low", "desc": "Mô tả" }
  ],
  "opportunities": ["Cơ hội 1", "Cơ hội 2"],
  "recommendation": "<Khuyến nghị: NÊN MUA / CÂN NHẮC / CHỜ THÊM>",
  "reasoning": "Lý do chi tiết cho khuyến nghị",
  "bestStrategy": "Chi lược đầu tư tối ưu cho trường hợp này",
  "summary": "Tóm tắt phân tích trong 3-4 câu"
}

Lưu ý:
- Tăng giá BĐS trung bình tại Việt Nam khoảng 5-10%/năm tùy khu vực
- Chi phí quản lý, bảo trì khoảng 1-2% giá trị BĐS/năm
- Tỷ lệ lấp đầy cho thuê trung bình 85-95% tại TP lớn
- Nếu khu vực là TP.HCM hoặc Hà Nội thì tiềm năng tăng giá cao hơn
`;

    const raw = await callGeminiChat(
      [
        { role: "system", content: "Bạn là chuyên gia phân tích đầu tư BĐS Việt Nam. Chỉ trả về JSON hợp lệ." },
        { role: "user", content: prompt },
      ],
      { maxTokens: 2000, temperature: 0.3 }
    );

    const json = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());

    return NextResponse.json({
      success: true,
      data: {
        ...json,
        marketData: {
          listingsFound: listings.length,
          rentListingsFound: rentListings.length,
          avgBuyPrice,
          avgRentPrice,
          grossYield,
        },
      },
    });
  } catch (error) {
    console.error("Investment analysis error:", error);
    return NextResponse.json({ error: "Không thể phân tích đầu tư. Vui lòng thử lại." }, { status: 500 });
  }
}
