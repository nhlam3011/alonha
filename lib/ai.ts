import "server-only";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

let client: GoogleGenerativeAI | null = null;

function getClient() {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  client = new GoogleGenerativeAI(apiKey);
  return client;
}

export async function callGeminiChat(messages: ChatMessage[], options?: { maxTokens?: number; temperature?: number }) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const result = await model.generateContent({
    contents,
    generationConfig: {
      temperature: options?.temperature ?? 0.4,
      maxOutputTokens: options?.maxTokens ?? 400,
    },
  });

  let reply = "";
  try {
    reply = result.response.text().trim();
  } catch (error) {
    console.error("Gemini response error:", error);
    console.error("Candidates:", JSON.stringify(result.response.candidates, null, 2));
    console.error("PromptFeedback:", JSON.stringify(result.response.promptFeedback, null, 2));
  }

  if (!reply) {
    console.error("Empty content from Gemini. Candidates:", JSON.stringify(result.response.candidates, null, 2));
    throw new Error("Empty response from Gemini");
  }

  return reply;
}

// Backwards-compatible alias name used across API routes
export async function callOpenAIChat(messages: ChatMessage[], options?: { maxTokens?: number }) {
  return callGeminiChat(messages, options);
}
