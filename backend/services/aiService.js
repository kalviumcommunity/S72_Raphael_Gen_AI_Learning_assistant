import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Initialize client with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Choose model (update name if you want gemini-2.0-flash-exp or gemini-1.5-pro etc.)
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function askGemini(prompt) {
  try {
    const result = await model.generateContent(prompt);

    // Get the plain text output
    const text = result.response.text();

    return text || "Sorry, I couldn’t generate a response.";
  } catch (error) {
    console.error("askGemini error:", error);
    throw error;
  }
}
