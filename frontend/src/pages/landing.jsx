import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const [mode, setMode] = useState("url");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const chatEndRef = useRef(null);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ INITIAL LOAD: Load all data from localStorage once on mount
  useEffect(() => {
    const savedChats = JSON.parse(localStorage.getItem("chats") || "[]");
    const savedCurrentId = localStorage.getItem("currentChatId");
    const savedUrl = localStorage.getItem("landing_url") || "";
    const savedContent = localStorage.getItem("landing_content") || "";

    // Set all state
    setChats(savedChats);
    setUrl(savedUrl);
    setContent(savedContent);

    // Restore current chat if it exists
    if (savedCurrentId && savedChats.length > 0) {
      const activeChat = savedChats.find((c) => c.id === savedCurrentId);
      if (activeChat) {
        setCurrentChatId(savedCurrentId);
        setMessages(activeChat.messages || []);
        
        // Scroll to active chat in sidebar
        setTimeout(() => {
          const activeEl = document.getElementById(`chat-${savedCurrentId}`);
          activeEl?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
      }
    }

    setIsInitialized(true);
  }, []);

  // ✅ Save chats array to localStorage whenever it changes (after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats, isInitialized]);

  // ✅ Save current chat ID whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    if (currentChatId) {
      localStorage.setItem("currentChatId", currentChatId);
    } else {
      localStorage.removeItem("currentChatId");
    }
  }, [currentChatId, isInitialized]);

  // ✅ Save URL and content whenever they change
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("landing_url", url);
  }, [url, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("landing_content", content);
  }, [content, isInitialized]);

  // ✅ Sync messages into current chat whenever messages change
  useEffect(() => {
    if (!isInitialized || !currentChatId) return;

    setChats((prevChats) => {
      const chatExists = prevChats.find((c) => c.id === currentChatId);
      if (!chatExists) return prevChats;

      return prevChats.map((chat) =>
        chat.id === currentChatId ? { ...chat, messages } : chat
      );
    });
  }, [messages, currentChatId, isInitialized]);

  // ✅ Check login status
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      setShowWelcome(true);
      const timer = setTimeout(() => setShowWelcome(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // ✅ Create new chat
  const handleNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      name: `Chat ${chats.length + 1}`,
      messages: [],
    };
    setChats([...chats, newChat]);
    setCurrentChatId(newChat.id);
    setMessages([]);
  };

  // ✅ Switch to a different chat
  const handleSelectChat = (id) => {
    const chat = chats.find((c) => c.id === id);
    if (chat) {
      setCurrentChatId(id);
      setMessages(chat.messages || []);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  };

  // ✅ Delete a chat
  const handleDeleteChat = (id) => {
    const updated = chats.filter((c) => c.id !== id);
    setChats(updated);

    // If we deleted the current chat, switch to another one
    if (id === currentChatId) {
      const nextChat = updated[0] || null;
      setCurrentChatId(nextChat?.id || null);
      setMessages(nextChat?.messages || []);
    }
  };

  // ✅ Start editing chat name
  const handleEditChatName = (chat) => {
    setEditingChatId(chat.id);
    setEditedName(chat.name);
  };

  // ✅ Save edited chat name
  const handleSaveChatName = (chatId) => {
    const updated = chats.map((c) =>
      c.id === chatId ? { ...c, name: editedName.trim() || c.name } : c
    );
    setChats(updated);
    setEditingChatId(null);
  };

  // ✅ Handle quiz button click
  const handleQuizClick = () => {
    if (isLoggedIn) {
      // 🆕 Added: Pass the real article data to Quiz page
      navigate("/quiz", { state: { url, content } });
    } else {
      navigate("/login");
    }
  };

  // ✅ Send message to backend
  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      let systemContext = "";
      if (mode === "url" && url.trim()) {
        systemContext = `Based on this URL: ${url.trim()}`;
      }
      if (mode === "text" && content.trim()) {
        systemContext = `Based on this content: ${content.trim()}`;
      }

      const payload = {
        question: input.trim(),
        context: systemContext,
      };

      const res = await fetch("https://s72-raphael-gen-ai-learning-assistant.onrender.com//api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      const finalMessages = [
        ...updatedMessages,
        { role: "assistant", content: data.answer || "No response" },
      ];
      setMessages(finalMessages);
    } catch (err) {
      console.error("Frontend error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-gray-100 flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-indigo-400">🧠 Gen AI Chat Assistant</h1>
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
        {/* Sidebar */}
        <div ref={sidebarRef} className="w-96 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Chats</h2>
            <button
              onClick={handleNewChat}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors"
            >
              + New
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <p className="p-4 text-gray-400 text-sm">No chats yet. Create one!</p>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  id={`chat-${chat.id}`}
                  className={`flex justify-between items-center px-4 py-3 cursor-pointer transition-colors ${
                    chat.id === currentChatId
                      ? "bg-indigo-700 text-white"
                      : "hover:bg-gray-700"
                  }`}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  {editingChatId === chat.id ? (
                    <input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onBlur={() => handleSaveChatName(chat.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveChatName(chat.id);
                        if (e.key === "Escape") setEditingChatId(null);
                      }}
                      autoFocus
                      className="bg-gray-900 text-white border border-gray-600 rounded px-2 py-1 w-full text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="truncate flex-1"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleEditChatName(chat);
                      }}
                      title="Double-click to rename"
                    >
                      {chat.name}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(chat.id);
                    }}
                    className="text-gray-400 hover:text-red-400 text-sm ml-2 px-2"
                    title="Delete Chat"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Mode Selection and Input */}
          <div className="p-6 border-t border-gray-700 space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setMode("url")}
                className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  mode === "url"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                URL
              </button>
              <button
                onClick={() => setMode("text")}
                className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  mode === "text"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Text
              </button>
            </div>

            {mode === "url" ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Webpage URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full border border-gray-600 bg-gray-900 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Webpage Content
                </label>
                <textarea
                  placeholder="Paste full webpage content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full border border-gray-600 bg-gray-900 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none"
                  style={{ minHeight: "120px" }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {/* Messages Display */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold mb-2">Start a Conversation</h3>
                <p className="text-gray-400">
                  Ask anything and continue chatting naturally!
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xl px-4 py-3 rounded-2xl text-lg ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-gray-800 text-gray-200 rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input Area */}
          <div className="p-6 border-t border-gray-800 flex gap-3">
            <textarea
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 border border-gray-600 bg-gray-900 rounded-lg p-3 text-lg resize-none focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              rows={2}
            />
            <button
              onClick={handleQuizClick}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Take a Quiz
            </button>
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
