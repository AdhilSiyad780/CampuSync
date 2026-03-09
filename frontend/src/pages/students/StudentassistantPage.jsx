import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  BookOpen,
  Calculator,
  FlaskConical,
  Globe,
  Lightbulb,
  RotateCcw,
  ChevronDown,
  User,
} from "lucide-react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

const SUGGESTED_PROMPTS = [
  { icon: Calculator, text: "Explain quadratic equations with examples", color: "text-violet-500" },
  { icon: FlaskConical, text: "How does photosynthesis work?", color: "text-emerald-500" },
  { icon: Globe, text: "What caused World War I?", color: "text-amber-500" },
  { icon: BookOpen, text: "Help me understand Shakespeare's Romeo and Juliet", color: "text-rose-500" },
  { icon: Lightbulb, text: "Tips for solving word problems in math", color: "text-sky-500" },
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-5">
      <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-md">
        <Sparkles size={14} className="text-white" />
      </div>
      <div className="bg-white border border-slate-100 rounded-3xl rounded-bl-md px-5 py-4 shadow-sm">
        <div className="flex gap-1.5 items-center h-4">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";

  // Render markdown-like formatting: bold **text**, code `text`, numbered lists
  const formatText = (text) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      // Bold
      line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Inline code
      line = line.replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded-md text-[13px] font-mono">$1</code>');
      // Bullet list
      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        line = `<span class="flex gap-2"><span class="text-indigo-400 shrink-0 mt-0.5">•</span><span>${line.trim().slice(2)}</span></span>`;
      }
      // Numbered list
      const numMatch = line.trim().match(/^(\d+)\.\s(.+)/);
      if (numMatch) {
        line = `<span class="flex gap-2"><span class="text-indigo-400 font-bold shrink-0 min-w-[1.2rem]">${numMatch[1]}.</span><span>${numMatch[2]}</span></span>`;
      }
      return (
        <span
          key={i}
          className="block"
          style={{ marginBottom: line.trim() === "" ? "0.5rem" : undefined }}
          dangerouslySetInnerHTML={{ __html: line || "&nbsp;" }}
        />
      );
    });
  };

  return (
    <div className={`flex items-end gap-3 mb-5 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
          isUser
            ? "bg-slate-800"
            : "bg-gradient-to-br from-indigo-500 to-violet-600"
        }`}
      >
        {isUser ? (
          <User size={14} className="text-white" />
        ) : (
          <Sparkles size={14} className="text-white" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-3xl px-5 py-4 shadow-sm text-sm leading-relaxed ${
          isUser
            ? "bg-slate-800 text-white rounded-br-md"
            : "bg-white border border-slate-100 text-slate-700 rounded-bl-md"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="space-y-0.5">{formatText(msg.content)}</div>
        )}
      </div>
    </div>
  );
}

export default function StudentAIAssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.user_type !== "student") navigate("/student/login");

  const studentName = user?.fullname?.split(" ")[0] || "Student";

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollBtn(!nearBottom);
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setError("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await api.post("student/ai-assistant/", {
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages([...newMessages, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      const msg = err.response?.data?.error || "Something went wrong. Please try again.";
      setError(msg);
      // Remove the user message so they can retry
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError("");
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-[#F4F6FB]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>
              StudyBuddy
            </h1>
            <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse" />
              AI Tutor · Always here to help
            </span>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-50"
          >
            <RotateCcw size={13} />
            New Chat
          </button>
        )}
      </header>

      {/* MESSAGES AREA */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-0 relative"
      >
        <div className="max-w-2xl mx-auto py-6">

          {/* WELCOME STATE */}
          {isEmpty && (
            <div className="text-center mb-8 pt-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-indigo-200">
                <Sparkles size={36} className="text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                Hey {studentName}! 👋
              </h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                I'm your AI study buddy. Ask me anything — from maths to history, I'll help you understand it step by step.
              </p>

              {/* Suggested prompts */}
              <div className="mt-8 grid gap-2 text-left">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center mb-1">
                  Try asking...
                </p>
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p.text)}
                    className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-left hover:border-indigo-300 hover:shadow-sm transition-all group"
                  >
                    <p.icon size={16} className={`${p.color} shrink-0`} />
                    <span className="text-sm text-slate-600 font-medium group-hover:text-slate-800 transition-colors">
                      {p.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MESSAGES */}
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

          {loading && <TypingIndicator />}

          {/* ERROR */}
          {error && (
            <div className="flex justify-center mb-4">
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-2 text-xs font-semibold">
                {error}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* SCROLL TO BOTTOM BTN */}
      {showScrollBtn && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={scrollToBottom}
            className="bg-white border border-slate-200 shadow-lg rounded-full p-2 hover:bg-slate-50 transition-all"
          >
            <ChevronDown size={18} className="text-slate-500" />
          </button>
        </div>
      )}

      {/* INPUT BAR */}
      <div className="bg-white border-t border-slate-100 px-4 py-4 shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-3xl px-4 py-3 focus-within:border-indigo-300 focus-within:shadow-md focus-within:shadow-indigo-50 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your studies..."
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 resize-none outline-none leading-relaxed min-h-[24px] max-h-[140px] font-medium disabled:opacity-60"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
            >
              <Send size={15} className="text-white ml-0.5" />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
            Press <kbd className="bg-slate-100 px-1 rounded text-[10px]">Enter</kbd> to send · <kbd className="bg-slate-100 px-1 rounded text-[10px]">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}