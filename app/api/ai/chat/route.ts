import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { callGeminiChat, type ChatMessage } from "@/lib/ai";

const FALLBACK_ANSWER =
  "Xin chào! Tôi là trợ lý ảo Alonha. Hiện tại tôi chưa thể kết nối tới mô hình AI, nhưng vẫn có thể hướng dẫn bạn về cách dùng nền tảng và các bước giao dịch an toàn.";

type SearchFilters = {
  keyword?: string | null;
  listingType?: "SALE" | "RENT" | null;
  category?: string | null;
  bedrooms?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  areaMin?: number | null;
  areaMax?: number | null;
  province?: string | null;
  district?: string | null;
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

  const rawHistory = conversation?.messages ?? [];
  const historyMessages: ChatMessage[] = rawHistory.slice(-10).map((m) => ({
    role: (m.role === "assistant" ? "assistant" : "user") as ChatMessage["role"],
    content: m.content,
  }));

  const currentContext = (conversation?.context as any) || {};
  const previousFilters = currentContext.filters || {};

  const systemPrompt = `Bạn là trợ lý AI thông minh, thân thiện của nền tảng Bất động sản AloNha tại Việt Nam.
Nhiệm vụ: Phân tích tin nhắn và lịch sử trò chuyện để xác định ý định: "search" (tìm mua/thuê nhà), "compare" (so sánh), "recommend" (gợi ý), hoặc "chat" (tư vấn/giải đáp).

BỘ LỌC TÌM KIẾM HIỆN TẠI:
${JSON.stringify(previousFilters, null, 2)}

QUAN TRỌNG VỀ LỊCH SỬ TRÒ CHUYỆN:
- Khi khách hàng đưa ra yêu cầu mới (ví dụ thêm mức giá, đổi khu vực, thêm số phòng), bạn PHẢI kế thừa toàn bộ các giá trị của bộ lọc hiện tại ở trên.
- Nếu yêu cầu mới mâu thuẫn với bộ lọc cũ (ví dụ: khách nói 'trên 10 tỷ' khi bộ lọc cũ là 'dưới 5 tỷ'), bạn PHẢI tự động xoá bộ lọc cũ mâu thuẫn đó.
- Nếu khách đổi từ 'mua' (SALE) sang 'thuê' (RENT) hoặc ngược lại, bạn PHẢI xoá bỏ toàn bộ các bộ lọc về giá cũ (priceMin, priceMax) vì quy mô giá thuê và giá bán rất khác nhau.
- Bạn phải trả về một JSON object chứa bộ lọc ĐẦY ĐỦ (gồm cả cũ và mới đã được gộp lại). Tuyệt đối không được bỏ sót các tiêu chí cũ trừ khi chúng mâu thuẫn hoặc khách chủ động yêu cầu xóa bỏ.

OUTPUT: Một JSON object duy nhất (không có markdown), cấu trúc:
{
  "intent": "search" | "chat" | "compare" | "recommend",
  "filters": { ... }, // Trả về bộ lọc cập nhật đầy đủ nếu intent="search" hoặc "recommend"
  "reply": "...",     // Câu trả lời tự nhiên.
  "compareIds": [...] 
}

QUY TẮC BỘ LỌC (filters):
1. category: 'can-ho-chung-cu', 'nha-rieng', 'nha-mat-phong', 'dat-nen', 'kho-nha-xuong', 'bds-khac'.
2. keyword: CỰC KỲ HẠN CHẾ. Tuyệt đối KHÔNG đưa loại nhà (như 'căn hộ', 'nhà'), địa danh (như 'Hà Nội'), hay các từ 'mua', 'bán', 'kinh doanh', 'đầu tư', 'giá' vào keyword. Chỉ dùng keyword nếu khách tìm tên dự án (VD: 'Vinhomes', 'Times City') hoặc đặc điểm cực kỳ riêng biệt.
3. priceMin/priceMax: Dải giá (VNĐ). Khách nói "> 10 tỷ" -> priceMin: 10000000000.
4. listingType: Mặc định là 'SALE' trừ khi khách nói là 'thuê'.
5. province/district: Chỉ điền nếu khách nói rõ địa điểm. Không tự ý đoán.
6. FORMAT: Khi giải thích các bước hoặc liệt kê, bạn PHẢI sử dụng danh sách có đánh số (1., 2., 3.) và mỗi mục phải nằm trên một dòng mới để giao diện hiển thị đẹp hơn.`;

  let aiResponse: AIIntentResponse | null = null;
  let replyContent = FALLBACK_ANSWER;
  let searchResults: any[] | undefined;

  try {
    const llmMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...historyMessages,
      { role: "user", content: message },
    ];

    const rawAiReply = await callGeminiChat(llmMessages, { maxTokens: 2000, temperature: 0.2 });

    try {
      const match = rawAiReply.match(/\{[\s\S]*\}/);
      if (match) {
        aiResponse = JSON.parse(match[0]);
      } else {
        const cleanJson = rawAiReply.replace(/```json/gi, "").replace(/```/g, "").trim();
        aiResponse = JSON.parse(cleanJson);
      }
    } catch (e) {
      aiResponse = { intent: "chat", reply: rawAiReply };
    }

    if ((aiResponse?.intent === "search" || aiResponse?.intent === "recommend") && aiResponse.filters) {
      const f = aiResponse.filters;
      const where: any = {
        status: "APPROVED",
        publishedAt: { not: null },
      };

      if (f.listingType) {
        // If switching between SALE and RENT, clear old price filters
        if (previousFilters.listingType && previousFilters.listingType !== f.listingType) {
          delete where.price;
          // Also update the filters object so AI doesn't keep them in context
          delete f.priceMin;
          delete f.priceMax;
        }
        where.listingType = f.listingType;
      }
      
      // Map category slugs to Enum
      if (f.category) {
        const catMap: Record<string, string> = {
          "can-ho-chung-cu": "CAN_HO_CHUNG_CU",
          "nha-rieng": "NHA_RIENG",
          "nha-mat-phong": "NHA_MAT_PHONG",
          "dat-nen": "DAT_NEN",
          "kho-nha-xuong": "KHO_NHA_XUONG",
          "bds-khac": "BDS_KHAC",
          "biet-thu": "NHA_RIENG",
          "van-phong": "BDS_KHAC"
        };
        const mapped = catMap[f.category];
        if (mapped) where.category = mapped;
      }

      if (f.bedrooms) where.bedrooms = f.bedrooms;
      
      // Build Price range with contradiction check
      if (f.priceMin != null || f.priceMax != null) {
        where.price = {};
        if (f.priceMin != null) where.price.gte = f.priceMin;
        if (f.priceMax != null) where.price.lte = f.priceMax;
        
        // If contradiction (Min > Max), prioritize the most recent intent (usually the one mentioned last)
        if (f.priceMin != null && f.priceMax != null && f.priceMin > f.priceMax) {
          // If the message contains "trên" or ">", prioritize Min. If "dưới" or "<", prioritize Max.
          if (message.includes("trên") || message.includes(">") || message.includes("hơn")) {
            delete where.price.lte;
          } else {
            delete where.price.gte;
          }
        }
      }

      // Build Area range with contradiction check
      if (f.areaMin != null || f.areaMax != null) {
        where.area = {};
        if (f.areaMin != null) where.area.gte = f.areaMin;
        if (f.areaMax != null) where.area.lte = f.areaMax;
        
        if (f.areaMin != null && f.areaMax != null && f.areaMin > f.areaMax) {
           delete where.area.lte; // Default to Min if contradictory
        }
      }

      if (f.province) {
        const prov = f.province.replace(/Thành phố|Tỉnh/gi, '').trim();
        where.provinceName = { contains: prov, mode: "insensitive" };
      }
      if (f.district) {
        const dist = f.district.replace(/Quận|Huyện|Thị xã/gi, '').trim();
        where.address = { contains: dist, mode: "insensitive" };
      }

      if (f.keyword && f.keyword.length > 1) {
        const kw = f.keyword.trim();
        // Skip common generic keywords that AI might hallucinate
        const genericTerms = ["mua", "bán", "nhà", "cần", "tìm", "đầu tư", "kinh doanh", "giá", "tỷ", "triệu"];
        const isGeneric = genericTerms.some(term => kw.toLowerCase() === term || kw.toLowerCase().includes("mua nhà") || kw.toLowerCase().includes("kinh doanh"));
        
        if (!isGeneric) {
          where.OR = [
            { title: { contains: kw, mode: "insensitive" } },
            { address: { contains: kw, mode: "insensitive" } },
          ];
        }
      }

      let [listings, total] = await Promise.all([
        prisma.listing.findMany({
          where,
          orderBy: { publishedAt: "desc" },
          take: 10,
          select: {
            id: true,
            slug: true,
            title: true,
            price: true,
            area: true,
            bedrooms: true,
            bathrooms: true,
            address: true,
          },
        }),
        prisma.listing.count({ where }),
      ]);

      // STAGE 2 RETRY: If no results found and there was a keyword, try again without the keyword
      if (total === 0 && where.OR) {
        delete where.OR;
        [listings, total] = await Promise.all([
          prisma.listing.findMany({
            where,
            orderBy: { publishedAt: "desc" },
            take: 10,
            select: {
              id: true,
              slug: true,
              title: true,
              price: true,
              area: true,
              bedrooms: true,
              bathrooms: true,
              address: true,
            },
          }),
          prisma.listing.count({ where }),
        ]);
      }

      // STAGE 3 RETRY: If still no results and there was a category, try again without the category
      // (This handles cases where AI hallucinated a too-specific category)
      if (total === 0 && where.category) {
        delete where.category;
        [listings, total] = await Promise.all([
          prisma.listing.findMany({
            where,
            orderBy: { publishedAt: "desc" },
            take: 10,
            select: {
              id: true,
              slug: true,
              title: true,
              price: true,
              area: true,
              bedrooms: true,
              bathrooms: true,
              address: true,
            },
          }),
          prisma.listing.count({ where }),
        ]);
      }

      searchResults = listings.map((l) => ({
        ...l,
        price: Number(l.price),
      }));

      if (total > 0) {
        replyContent = aiResponse.reply || `Tìm thấy ${total} kết quả phù hợp.`;
      } else {
        replyContent = `Tiếc quá, hiện tại mình chưa tìm thấy bất động sản nào khớp hoàn toàn với yêu cầu này. Bạn có thể thử nới rộng khoảng giá hoặc khu vực xem sao nhé!`;
      }
    } else if (aiResponse?.intent === "compare") {
      replyContent = aiResponse.reply || "Để so sánh, bạn vui lòng cung cấp tên hoặc link của các bất động sản cần so sánh nhé!";
    } else {
      replyContent = aiResponse?.reply || FALLBACK_ANSWER;
    }

  } catch (error) {
    console.error("Chatbot Error:", error);
    replyContent = "Hiện tại hệ thống đang bận, bạn vui lòng thử lại sau nhé.";
  }

  if (sessionId) {
    try {
      const convId = conversation?.id;
      if (convId) {
        // Embed results in content for persistence
        const assistantContent = searchResults && searchResults.length > 0
          ? `${replyContent}\n\n[RESULTS_JSON:${JSON.stringify(searchResults)}]`
          : replyContent;

        await prisma.chatbotMessage.createMany({
          data: [
            { conversationId: convId, role: "user", content: message },
            { conversationId: convId, role: "assistant", content: assistantContent },
          ],
        });

        if (aiResponse?.filters) {
          await prisma.chatbotConversation.update({
            where: { id: convId },
            data: {
              context: {
                ...currentContext,
                filters: aiResponse.filters
              }
            }
          });
        }
      }
    } catch (e) {
      console.error("Failed to save chat history:", e);
    }
  }

  return NextResponse.json({ reply: replyContent, results: searchResults });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) return NextResponse.json({ messages: [] });

  try {
    const conversation = await prisma.chatbotConversation.findFirst({
      where: { sessionId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!conversation) return NextResponse.json({ messages: [] });

    const messages = conversation.messages.map(m => {
      let content = m.content;
      let results: any[] | undefined;

      // Extract results from content if present
      const match = content.match(/\[RESULTS_JSON:(.*)\]/);
      if (match) {
        try {
          results = JSON.parse(match[1]);
          content = content.replace(/\[RESULTS_JSON:.*\]/, "").trim();
        } catch (e) { }
      }

      return {
        role: m.role,
        content,
        results,
        timestamp: m.createdAt.getTime()
      };
    });

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ messages: [] });
  }
}
