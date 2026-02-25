import { NextResponse } from "next/server";
import { callGeminiChat } from "@/lib/ai";

type SummarizeBody = {
  description: string;
  maxLength?: number;
};

export async function POST(req: Request) {
  const body: SummarizeBody = await req.json().catch(() => ({}));
  const { description = "", maxLength = 100 } = body;

  if (!description) {
    return NextResponse.json({ error: "Thiếu description" }, { status: 400 });
  }

  const text = description.slice(0, 5000);

  try {
    const systemPrompt = `Bạn là chuyên gia viết mô tả bất động sản tiếng Việt. Hãy tóm tắt ngắn gọn, súc tích.`;

    const userPrompt = `
Hãy tóm tắt mô tả bất động sản sau thành khoảng ${maxLength}-120 ký tự, giữ lại thông tin quan trọng (vị trí, diện tích, số phòng, tiện ích):

${text}

Viết đoạn văn ngắn hoàn chỉnh, có ý nghĩa. Không cần JSON hay markdown.`;

    const summary = await callGeminiChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 500 }
    );

    console.log("Raw AI response:", summary);

    // Clean up response - remove any markdown formatting
    const cleanedSummary = summary
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/^["']|["']$/g, "")
      .trim();

    return NextResponse.json({
      summary: cleanedSummary.slice(0, maxLength + 20), // Allow slight overflow
      originalLength: description.length,
      summaryLength: cleanedSummary.length,
    });
  } catch (e) {
    console.error("Summarize error:", e);
    return NextResponse.json({
      summary: description.slice(0, maxLength),
      originalLength: description.length,
      summaryLength: Math.min(description.length, maxLength),
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
