// lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Small helper to match older code expectations: return a model instance
export function getLLM(modelName = "gemini-1.5-flash") {
	return genAI.getGenerativeModel({ model: modelName });
}
