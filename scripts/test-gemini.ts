import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

async function test() {
    if (!apiKey) {
        console.error("GEMINI_API_KEY is not set");
        return;
    }

    console.log(`Testing Gemini with model: ${modelName}`);

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        console.log("Response:", result.response.text());
    } catch (error) {
        console.error("Error calling Gemini:", error);
    }
}

test();
