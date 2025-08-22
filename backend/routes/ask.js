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
  try {
    let finalPrompt;
    let webContent = "";

    // 1️⃣ Zero-shot: only question provided
    if (question && !url && !content && !prompt) {
      finalPrompt = `Answer the following question clearly and concisely, using unordered (•) and ordered (1., 2., 3.) lists when appropriate. 
      Use minimal and relevant emojis to highlight points. 
      Question: ${question}`;
    }
    

      if (content) {
        contextPrompt = `Use the following content to answer the question clearly. 
                Structure your answer with unordered (•) and ordered (1., 2., 3.) lists. 
                Add minimal, relevant emojis to make key points stand out. 
                Content: ${content}
                Question: ${question}`;
      }

      finalPrompt = contextPrompt;
    }

    const answer = await askGemini(finalPrompt);
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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