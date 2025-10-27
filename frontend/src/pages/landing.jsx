import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const [mode, setMode] = useState("url"); // url | text
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();

  // ✅ Load saved input values from localStorage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem("landing_url");
    const savedContent = localStorage.getItem("landing_content");
    const savedQuestion = localStorage.getItem("landing_question");
    if (savedUrl) setUrl(savedUrl);
    if (savedContent) setContent(savedContent);
    if (savedQuestion) setQuestion(savedQuestion);
  }, []);

  // ✅ Save input values to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("landing_url", url);
  }, [url]);

  useEffect(() => {
    localStorage.setItem("landing_content", content);
  }, [content]);

  useEffect(() => {
    localStorage.setItem("landing_question", question);
  }, [question]);

  // ✅ Check login status on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      setShowWelcome(true);
      // Auto-hide the popup after 3 seconds
      const timer = setTimeout(() => setShowWelcome(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAsk = async () => {
    if (!question.trim()) {
      setAnswer("⚠️ Please enter a question.");
      return;
    }

    setLoading(true);
    setAnswer("");

    try {
      let prompt = question.trim();
      if (mode === "url" && url.trim()) prompt += `\nBased on this URL: ${url.trim()}`;
      if (mode === "text" && content.trim()) prompt += `\nBased on this content: ${content.trim()}`;

      const res = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error(await res.text() || "Server error");

      const data = await res.json();
      setAnswer(data.answer || "🤔 No answer returned.");
    } catch (err) {
      console.error("Frontend error:", err);
      setAnswer("❌ Something went wrong while contacting the AI.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Format AI response text
  const formatAnswer = (text) => {
    if (!text) return null;

    const lines = text.split("\n");
    const formattedContent = [];
    const emojiMap = {
      Key: "🔑",
      Important: "⚠️",
      Tip: "💡",
      Note: "📝",
      Example: "📌",
      Conclusion: "✅",
      Question: "❓",
    };

    const addEmojis = (line) => {
      for (const key in emojiMap) {
        if (line.includes(key)) line = line.replace(key, `${emojiMap[key]} ${key}`);
      }
      return line;
    };

    lines.forEach((line, index) => {
      if (!line.trim()) {
        formattedContent.push(<br key={`br-${index}`} />);
        return;
      }

      let formattedLineText = line.replace(/^\*\s+/, "• ");
      formattedLineText = addEmojis(formattedLineText);

      if (formattedLineText.includes("**") && !formattedLineText.includes("***")) {
        const parts = formattedLineText.split(/(\*\*[^*]+\*\*)/g);
        const formattedLine = parts.map((part, partIndex) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={`bold-${index}-${partIndex}`} className="text-indigo-300 text-xl">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });
        formattedContent.push(
          <div key={`heading-${index}`} className="mt-4 mb-2">
            {formattedLine}
          </div>
        );
      } else if (formattedLineText.includes("***")) {
        const cleanLine = formattedLineText.replace(/\*\*\*/g, "").trim();
        const [title, ...description] = cleanLine.split(":");
        formattedContent.push(
          <div key={`subitem-${index}`} className="ml-4 mb-2 text-lg">
            <span className="text-yellow-300 font-semibold">• {title}:</span>
            {description.length > 0 && (
              <span className="text-gray-200 ml-2">{description.join(":")}</span>
            )}
          </div>
        );
      } else if (/^\d+\./.test(formattedLineText.trim())) {
        formattedContent.push(
          <div key={`numbered-${index}`} className="ml-4 mb-1 text-gray-200 text-lg">
            {formattedLineText.trim()}
          </div>
        );
      } else if (formattedLineText.startsWith("• ")) {
        formattedContent.push(
          <div key={`bullet-${index}`} className="ml-4 mb-1 text-gray-200 text-lg">
            {formattedLineText}
          </div>
        );
      } else {
        formattedContent.push(
          <div key={`para-${index}`} className="mb-2 text-gray-200 text-lg">
            {formattedLineText}
          </div>
        );
      }
    });

    return formattedContent;
  };

  return (
    <div className={`h-screen bg-gray-900 text-gray-100 flex flex-col overflow-hidden relative`}>
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-indigo-400">🧠 Gen AI Reading Assistant</h1>
        {!isLoggedIn && (
          <button
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500 transform hover:scale-105 transition-all duration-200"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-96 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setMode("url")}
                className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  mode === "url" ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                URL
              </button>
              <button
                onClick={() => setMode("text")}
                className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  mode === "text" ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Text
              </button>
            </div>

            {/* Inputs */}
            {mode === "url" ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Webpage URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full border border-gray-600 bg-gray-900 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-medium text-gray-300 mb-2">Webpage Content</label>
                <textarea
                  placeholder="Paste full webpage content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 w-full border border-gray-600 bg-gray-900 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all resize-none"
                  style={{ minHeight: "200px" }}
                />
              </div>
            )}

            {/* Question Input */}
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-medium text-gray-300 mb-2">Your Question</label>
              <textarea
                placeholder="Ask me something..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="flex-1 w-full border border-gray-600 bg-gray-900 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all resize-none"
                style={{ minHeight: "120px" }}
              />
            </div>
          </div>

          <div className="p-6 border-t border-gray-700">
            <button
              onClick={handleAsk}
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Thinking..." : "Ask AI"}
            </button>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center animate-pulse">
                <div className="text-6xl mb-4">⏳</div>
                <h3 className="text-xl font-semibold text-indigo-300">Thinking...</h3>
                <p className="text-gray-400">The AI is generating your answer</p>
              </div>
            </div>
          ) : answer ? (
            <div className="flex-1 overflow-y-auto flex flex-col justify-between">
              <div className="p-8 max-w-none flex-1">
                <div className="mb-6 pb-4 border-b border-gray-700">
                  <h2 className="text-2xl font-bold text-indigo-300">Answer</h2>
                </div>
                <div className="text-gray-200 leading-relaxed text-lg">{formatAnswer(answer)}</div>
              </div>

              {/* ✅ Take Quiz Button */}
              <div className="p-6 border-t border-gray-800 flex justify-center">
                <button
                  onClick={() => {
                    if (isLoggedIn) navigate("/quiz");
                    else navigate("/login");
                  }}
                  className="px-8 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105"
                >
                  🧩 Take a Quiz
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold mb-2">Ready to Help!</h3>
                <p className="text-gray-400">
                  Enter a URL or paste content, ask your question, and I'll provide detailed answers.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
