import { GoogleGenAI, Type } from "@google/genai";

const AI_API_KEY = process.env.API_KEY || ''; 

// In a real app, strict error handling if API key is missing.
// Here we assume it's injected.

export const geminiService = {
  analyzeCompliance: async (description: string): Promise<{ score: number; reason: string }> => {
    if (!AI_API_KEY) {
      console.warn("Gemini API Key missing");
      return { score: 0, reason: "API Key missing. Cannot analyze." };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: AI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          You are a strict University Policy Compliance Officer.
          Analyze the following student request description for academic and financial compliance.
          Description: "${description}"
          
          Return a JSON object with:
          - score: An integer from 0 to 100 representing the likelihood of approval based on clarity, academic relevance, and reasonableness.
          - reason: A concise explanation (max 20 words).
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              reason: { type: Type.STRING }
            },
            required: ["score", "reason"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      const data = JSON.parse(text);
      return { score: data.score, reason: data.reason };

    } catch (error) {
      console.error("Gemini Analysis Failed:", error);
      return { score: 0, reason: "AI analysis failed." };
    }
  }
};