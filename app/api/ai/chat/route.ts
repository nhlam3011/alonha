import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { callGeminiChat, type ChatMessage } from "@/lib/ai";

const FALLBACK_ANSWER =
  "Xin chào! Tôi là trợ lý ảo Alonha. Hiện tại tôi chưa thể kết nối tới mô hình AI, nhưng vẫn có thể hướng dẫn bạn về cách dùng nền tảng và các bước giao dịch an toàn.";

type SearchFilters = {
  keyword: string | null;
  listingType: "SALE" | "RENT" | null;
  category: string | null;
  bedrooms: number | null;
  priceMin: number | null;
  priceMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  province: string | null;
  district: string | null;
};

type AIIntentResponse = {
  intent: "search" | "chat" | "compare" | "recommend";
  filters?: SearchFilters;
  reply?: string;
  compareIds?: string[];
};

function formatPriceVnd(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} tỷ`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)} triệu`;
  return value.toLocaleString("vi-VN") + " đ";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const message = String(body.message ?? "").trim().slice(0, 500);
  const sessionId = String(body.sessionId ?? "").slice(0, 100);

  if (!message) {
    return NextResponse.json({ reply: FALLBACK_ANSWER });
  }

  // 1. Get or Create Conversation
  let conversation = sessionId
    ? await prisma.chatbotConversation
      .findFirst({
        where: { sessionId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
      .catch(() => null)
    : null;

  if (!conversation && sessionId) {
    conversation = await prisma.chatbotConversation
      .create({
        data: { sessionId, context: { lastMessage: message } },
        include: { messages: true },
      })
      .catch(() => null);
  }

  // 2. Prepare History for AI
  // Limit to last 10 messages to save tokens but keep context
  const rawHistory = conversation?.messages ?? [];
  const historyMessages: ChatMessage[] = rawHistory.slice(-10).map((m) => ({
    role: (m.role === "assistant" ? "assistant" : "user") as ChatMessage["role"],
    content: m.content,
  }));

  // 3. Define System Prompt for Intent Classification & Extraction
  const systemPrompt = `Bạn là trợ lý AI thông minh, thân thiện của nền tảng Bất động sản AloNha tại Việt Nam.
Nhiệm vụ: Phân tích tin nhắn và lịch sử trò chuyện để xác định ý định: "search" (tìm mua/thuê nhà), "compare" (so sánh), "recommend" (gợi ý), hoặc "chat" (tư vấn/giải đáp).

OUTPUT: Một JSON object duy nhất (không có markdown), cấu trúc:
{
  "intent": "search" | "chat" | "compare" | "recommend",
  "filters": { ... }, // Chỉ có nếu intent="search" hoặc "recommend"
  "reply": "...",     // BẮT BUỘC có. Câu trả lời giao tiếp tự nhiên với khách hàng.
  "compareIds": [...] // Chỉ có nếu intent="compare"
}

HƯỚNG DẪN CHI TIẾT CÁCH TRẢ LỜI CỦA "reply":
Luôn trả lời tự nhiên, thân thiện (xưng "mình" - gọi "bạn"). Khéo léo lồng ghép AloNha vào.
1. NẾU Ý ĐỊNH = "search" HOẶC "recommend":
   - Bạn PHẢI tạo ra một dòng "reply" tự nhiên, VÍ DỤ: "AloNha đã tìm thấy một vài bất động sản ở {Khu Vực} phù hợp với yêu cầu của bạn nè. Tham khảo ngay nhé!"
   - Định dạng "filters":
     - keyword: Từ khóa tìm kiếm.
     - listingType: "SALE" hoặc "RENT".
     - category: 'can-ho-chung-cu', 'nha-rieng', 'dat-nen', 'biet-thu', 'shophouse'.
     - province/district: Chuẩn tiếng Việt có dấu. VD: "Hà Nội", "Quận 1".
     - priceMin/priceMax: Dải giá (VNĐ). Khách nói "2 tỷ" -> min:1.8 tỷ, max: 2.2 tỷ.
     - areaMin/areaMax: Diện tích (m2).
     - bedrooms: Số phòng ngủ.

2. NẾU Ý ĐỊNH = "chat":
   - Tự do trò chuyện. Tư vấn chi tiết, có chuyên môn nghiệp vụ về pháp lý, hướng nhà, thủ tục, phong thủy, thông tin thị trường bất động sản.
   - Reply phải đủ dài để trả lời câu hỏi, format đoạn văn thân thiện, dùng emoji phù hợp.

3. NẾU Ý ĐỊNH = "compare":
   - "reply": Trả lời so sánh hoặc nhắc khách hàng cấp link.

VÍ DỤ:
User: "Tìm chung cư 2 ngủ ở Cầu Giấy giá tầm 3 tỷ"
Output: {
  "intent": "search",
  "reply": "Dạ mình đã lọc được một vài căn hộ chung cư 2 phòng ngủ khu vực Cầu Giấy quanh mức giá 3 tỷ cho bạn rồi đây. Bạn xem chi tiết bên dưới nhé \uD83D\uDC47",
  "filters": { "listingType": "SALE", "category": "can-ho-chung-cu", "province": "Hà Nội", "district": "Cầu Giấy", "bedrooms": 2, "priceMin": 2500000000, "priceMax": 3500000000 }
}

User: "Sổ hồng và sổ đỏ khác nhau thế nào?"
Output: {
  "intent": "chat",
  "reply": "Chào bạn, sổ hồng và sổ đỏ là cách gọi phổ biến dựa trên màu sắc của giấy chứng nhận...\n\n- **Sổ đỏ**: Mẫu cũ, cấp cho đất nông nghiệp, đất lâm nghiệp...\n- **Sổ hồng**: Thường cấp cho đất ở đô thị, nhà ở... \nHiện nay theo quy định, 2 loại này có giá trị pháp lý tương đương nhau nhé!",
  "filters": null
}`;

  let aiResponse: AIIntentResponse | null = null;
  let replyContent = FALLBACK_ANSWER;
  let searchResults: any[] | undefined;

  try {
    // 4. Call Gemini
    const llmMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...historyMessages,
      { role: "user", content: message },
    ];

    // Force formatting in prompt usually works, but setting output format via API checking is hard in this generic function.
    // relying on prompt instructions for JSON.
    const rawAiReply = await callGeminiChat(llmMessages, { maxTokens: 2000, temperature: 0.2 });

    // Parse JSON
    try {
      // Extract everything between first { and last }
      const match = rawAiReply.match(/\{[\s\S]*\}/);
      if (match) {
        aiResponse = JSON.parse(match[0]);
      } else {
        // clean any residual markdown
        const cleanJson = rawAiReply.replace(/```json/gi, "").replace(/```/g, "").trim();
        aiResponse = JSON.parse(cleanJson);
      }
    } catch (e) {
      console.error("Failed to parse AI JSON:", rawAiReply);
      // Fallback if AI fails to give JSON: treat as chat using raw text if it looks like conversation, or error.
      aiResponse = { intent: "chat", reply: rawAiReply };
    }

    if (aiResponse?.intent === "search" && aiResponse.filters) {
      // 5. Handle Search Intent
      const f = aiResponse.filters;
      const where: Prisma.ListingWhereInput = {
        status: "APPROVED",
        publishedAt: { not: null },
      };

      if (f.listingType) where.listingType = f.listingType;
      // Convert number to compatible Prisma Decimal format if needed, though Prisma accepts numbers for Decimal
      if (f.bedrooms) where.bedrooms = f.bedrooms;
      if (f.priceMin != null) where.price = { gte: f.priceMin };
      if (f.priceMax != null) {
        where.price = { ...(typeof where.price === 'object' ? where.price : {}), lte: f.priceMax };
      }
      if (f.areaMin != null) where.area = { gte: f.areaMin };
      if (f.areaMax != null) {
        where.area = { ...(typeof where.area === 'object' ? where.area : {}), lte: f.areaMax };
      }

      // Strict Province/District Filter by Name (References)
      if (f.province) {
        const provWords = f.province.replace(/Thành phố|Tỉnh/gi, '').trim();
        where.provinceName = { contains: provWords, mode: "insensitive" };
      }
      if (f.district) {
        const distWords = f.district.replace(/Quận|Huyện|Thị xã/gi, '').trim();
        where.address = { contains: distWords, mode: "insensitive" };
      }

      // Keyword fallback
      if (f.keyword) {
        const kw = f.keyword.trim();
        where.OR = [
          { title: { contains: kw, mode: "insensitive" } },
          { address: { contains: kw, mode: "insensitive" } },
        ];
      }

      // Execute Query
      const [listings, total] = await Promise.all([
        prisma.listing.findMany({
          where,
          orderBy: { publishedAt: "desc" },
          take: 4,
          select: {
            id: true,
            slug: true,
            title: true,
            price: true,
            area: true,
            bedrooms: true,
            bathrooms: true,
            address: true,
            provinceName: true,
            // district: { select: { name: true } },
          },
        }),
        prisma.listing.count({ where }),
      ]);

      searchResults = listings.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        price: Number(l.price),
        area: l.area,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        address: l.address,
      }));

      // Generate Reply based on results
      if (total > 0) {
        replyContent = aiResponse.reply || `Tìm thấy ${total} bất động sản phù hợp. Xem ngay bên dưới nhé!`;
      } else {
        replyContent = aiResponse.reply || `Tiếc quá, hiện tại mình chưa tìm thấy bất động sản nào khớp hoàn toàn với yêu cầu này. Bạn thử nới rộng khoảng giá hoặc khu vực xem sao nhé!`;
      }
    } else if (aiResponse?.intent === "recommend" && aiResponse.filters) {
      // 5b. Handle Recommend Intent - similar to search but with recommendations
      const f = aiResponse.filters;
      const where: Prisma.ListingWhereInput = {
        status: "APPROVED",
        publishedAt: { not: null },
      };

      if (f.listingType) where.listingType = f.listingType;
      if (f.bedrooms) where.bedrooms = { gte: f.bedrooms - 1, lte: f.bedrooms + 1 };
      if (f.priceMax != null) where.price = { lte: f.priceMax };
      if (f.province) {
        const provWords = f.province.replace(/Thành phố|Tỉnh/gi, '').trim();
        where.provinceName = { contains: provWords, mode: "insensitive" };
      }
      if (f.district) {
        const distWords = f.district.replace(/Quận|Huyện|Thị xã/gi, '').trim();
        where.address = { contains: distWords, mode: "insensitive" };
      }
      if (f.keyword) {
        const kw = f.keyword.trim();
        where.OR = [
          { title: { contains: kw, mode: "insensitive" } },
          { address: { contains: kw, mode: "insensitive" } },
        ];
      }

      const [listings, total] = await Promise.all([
        prisma.listing.findMany({
          where,
          orderBy: { publishedAt: "desc" },
          take: 5,
          select: {
            id: true,
            slug: true,
            title: true,
            price: true,
            area: true,
            bedrooms: true,
            bathrooms: true,
            address: true,
            provinceName: true,
          },
        }),
        prisma.listing.count({ where }),
      ]);

      searchResults = listings.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        price: Number(l.price),
        area: l.area,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        address: l.address,
      }));

      if (total > 0) {
        replyContent = aiResponse.reply || `Dựa trên nhu cầu của bạn, mình gợi ý ${total} bất động sản tốt nhất:`;
      } else {
        replyContent = "Mình chưa tìm được bất động sản phù hợp với tiêu chí này. Bạn có muốn điều chỉnh yêu cầu không?";
      }
    } else if (aiResponse?.intent === "compare") {
      // 5c. Handle Compare Intent
      replyContent = aiResponse.reply || "Để so sánh, bạn vui lòng cung cấp tên hoặc link của các bất động sản cần so sánh nhé!";
    } else {
      // 6. Handle Chat Intent
      replyContent = aiResponse?.reply || FALLBACK_ANSWER;
    }

  } catch (error) {
    console.error("Chatbot Error:", error);
    replyContent = "Hiện tại hệ thống đang bận, bạn vui lòng thử lại sau nhé.";
  }

  // 7. Save Conversation History
  if (sessionId) {
    try {
      const convId = conversation?.id; // Reuse existing id
      if (convId) {
        await prisma.chatbotMessage.createMany({
          data: [
            { conversationId: convId, role: "user", content: message },
            { conversationId: convId, role: "assistant", content: replyContent },
          ],
        });
      }
    } catch (e) {
      // ignore logging errors
    }
  }

  return NextResponse.json({ reply: replyContent, results: searchResults });
}
