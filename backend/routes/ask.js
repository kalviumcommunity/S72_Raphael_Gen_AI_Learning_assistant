import express from "express";
import { askGemini } from "../services/aiService.js";
import axios from "axios";
import { JSDOM } from "jsdom";

const router = express.Router();

router.post("/ask", async (req, res) => {
  const { question, url, content, prompt } = req.body;

  if (!question && !prompt) {
    return res.status(400).json({ error: "Question or prompt is required" });
  }





// Helper function to fetch and extract text from webpage
async function fetchWebContent(url) {
  const response = await axios.get(url, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  const dom = new JSDOM(response.data);
  const document = dom.window.document;
  
  // Remove script and style elements
  const scripts = document.querySelectorAll('script, style');
  scripts.forEach(script => script.remove());
  
  // Extract text content
  const textContent = document.body.textContent || document.body.innerText || '';
  
  // Clean up whitespace and limit length
  return textContent
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 10000); // Limit to prevent token overflow
}

export default router;