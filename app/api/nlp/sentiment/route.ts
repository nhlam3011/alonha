import { NextResponse } from "next/server";
import { callGeminiChat } from "@/lib/ai";

type SentimentBody = {
  text: string;
};

export async function POST(req: Request) {
  const body: SentimentBody = await req.json().catch(() => ({}));
  const { text = "" } = body;

  if (!text) {
    return NextResponse.json({ error: "Thiếu text" }, { status: 400 });
  }

  const inputText = text.slice(0, 3000);

  try {
    const systemPrompt = `Bạn là chuyên gia phân tích cảm xúc (sentiment analysis) cho đánh giá bất động sản tiếng Việt.`;

    const userPrompt = `
Phân tích cảm xúc của đánh giá sau đây và trả về JSON:

"""${inputText}"""

YÊU CẦU:
- sentiment: Xác định cảm xúc chính
  - POSITIVE: Đánh giá tích cực, hài lòng
  - NEGATIVE: Đánh giá tiêu cực, không hài lòng
  - NEUTRAL: Đánh giá trung tính

- score: Điểm cảm xúc từ -1 (rất tiêu cực) đến 1 (rất tích cực)

- keyPoints: Các điểm quan trọng được đề cập (tối đa 5)
  - Nếu là điểm tích cực: thêm prefix "positive:"
  - Nếu là điểm tiêu cực: thêm prefix "negative:"

- summary: Tóm tắt ngắn gọn đánh giá (1-2 câu)

Trả về JSON:
{
  "sentiment": "POSITIVE",
  "score": 0.8,
  "keyPoints": [
    "positive:Vị trí thuận tiện",
    "positive:Nội thất đẹp",
    "negative:Giá hơi cao"
  ],
  "summary": "Khách hàng hài lòng với vị trí và nội thất nhưng thấy giá hơi cao so với thị trường."
}
`;

    const raw = await callGeminiChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 400 }
    );

    let jsonText = raw.trim();
    const first = jsonText.indexOf("{");
    const last = jsonText.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      jsonText = jsonText.slice(first, last + 1);
    }

    const parsed = JSON.parse(jsonText);

    return NextResponse.json({
      sentiment: parsed.sentiment || "NEUTRAL",
      score: typeof parsed.score === "number" ? parsed.score : 0,
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      summary: parsed.summary || "",
    });
  } catch (e) {
    return NextResponse.json({
      sentiment: "NEUTRAL",
      score: 0,
      keyPoints: [],
      summary: "",
    });
  }
}
