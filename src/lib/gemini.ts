import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Analyzes a PDF file to extract page count and color profile.
 * Note: For 100% accuracy, we will combine this with client-side PDF.js page counting.
 */
export async function analyzePDFContent(fileBase64: string, fileName: string) {
    if (!apiKey) {
        throw new Error("Gemini API key is missing");
    }

    const prompt = `
    You are a professional print shop assistant. Analyze the metadata and content of this PDF file named "${fileName}".
    
    Tasks:
    1. Determine the EXACT total number of pages if possible.
    2. Detect if the document contains color elements or is strictly Black & White.
    3. Suggest if it should be printed single-sided or double-sided (e.g., if it's a long report, suggest double-sided).

    Return ONLY a JSON object like this:
    {
      "pageCount": number,
      "isColor": boolean,
      "printSuggestion": "string",
      "estimatedComplexity": "low|medium|high"
    }
  `;

    try {
        const result = await geminiModel.generateContent([
            prompt,
            {
                inlineData: {
                    data: fileBase64,
                    mimeType: "application/pdf"
                }
            }
        ]);

        const responseText = result.response.text();
        // Extract JSON from response (Gemini sometimes adds ```json blocks)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("Could not parse AI response");
    } catch (error) {
        console.error("Gemini PDF Analysis Error:", error);
        throw error;
    }
}
