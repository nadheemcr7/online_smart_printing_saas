import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Analyzes a document description to estimate printing details.
 */
export async function analyzeDocument(fileDescription: string) {
    if (!apiKey) {
        console.error("Gemini API key is missing");
        return null;
    }

    const prompt = `
    Analyze this document description and provide:
    1. Total number of pages.
    2. Estimated color vs B/W percentage.
    3. Suggestions for printing (e.g., Double-sided, Glossy).
    
    Document Description: ${fileDescription}
    
    Return the response in JSON format.
  `;

    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        return null;
    }
}
