import { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:8000/api";

export default function AdvisorChat({ results, formData }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const autoSummaryRef = useRef(false); // useRef prevents double-fire in React StrictMode
  const bottomRef = useRef(null);

  // Auto-run cliff summary as soon as component mounts with results
  useEffect(() => {
    if (results && formData && !autoSummaryRef.current) {
      autoSummaryRef.current = true;
      runAdvisor(null);
    }
  }, [results, formData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function runAdvisor(userQuestion) {
    if (streaming) return;

    if (userQuestion) {
      setMessages((prev) => [
        ...prev,
        { role: "user", text: userQuestion },
      ]);
    }

    // Add empty advisor message to stream into
    setMessages((prev) => [
      ...prev,
      { role: "advisor", text: "", loading: true },
    ]);
    setStreaming(true);

    const body = {
      gross_income: formData?.gross_income ?? results?.gross_income,
      household_size: formData?.household_size ?? 1,
      state: formData?.state ?? "NC",
      employment_type: formData?.employment_type ?? "full_time",
      has_children: formData?.has_children ?? false,
      cliff_probability: null,
      user_question: userQuestion ?? null,
    };

    try {
      const response = await fetch(`${API_BASE}/advisor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail ?? `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") { done = true; break; }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "advisor") {
                  updated[updated.length - 1] = {
                    ...last,
                    text: last.text + parsed.text,
                    loading: false,
                  };
                }
                return updated;
              });
            }
          } catch (parseErr) {
            // skip malformed chunk
          }
        }
      }

      // Flush any partial chunk left in buffer after stream closes
      buffer += decoder.decode(); // flush TextDecoder
      if (buffer.startsWith("data: ")) {
        const data = buffer.slice(6).trim();
        if (data && data !== "[DONE]") {
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "advisor") {
                  updated[updated.length - 1] = { ...last, text: last.text + parsed.text, loading: false };
                }
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "advisor",
          text: `Sorry, something went wrong: ${err.message}`,
          loading: false,
          error: true,
        };
        return updated;
      });
    } finally {
      setStreaming(false);
      setInput("");
    }
  }

  function handleSend() {
    const q = input.trim();
    if (!q || streaming) return;
    runAdvisor(q);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-8 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-cliff-600 flex items-center justify-center text-white font-bold text-lg">
          G
        </div>
        <div>
          <h2 className="text-lg font-bold text-cliff-900">CliffSafe Advisor</h2>
          <p className="text-xs text-gray-400">Powered by Gemini AI — uses your actual numbers</p>
        </div>
      </div>

      {/* Message thread */}
      <div className="bg-gray-50 rounded-xl p-5 min-h-[200px] max-h-[420px] overflow-y-auto flex flex-col space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 m-auto">
            Analyzing your cliff situation…
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm rounded-2xl px-4 py-3 max-w-[85%] whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-white border border-gray-200 text-gray-700 self-end rounded-tr-sm"
                : msg.error
                ? "bg-red-50 border border-red-200 text-red-700 self-start rounded-tl-sm"
                : "bg-cliff-600 text-white self-start rounded-tl-sm"
            }`}
          >
            {msg.loading && !msg.text ? (
              <span className="flex gap-1 items-center">
                <span className="w-2 h-2 rounded-full bg-white opacity-60 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-white opacity-60 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-white opacity-60 animate-bounce [animation-delay:300ms]" />
              </span>
            ) : (
              msg.text
            )}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={streaming}
          placeholder={streaming ? "Gemini is responding…" : "Ask about your cliff situation…"}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cliff-400 disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          onClick={handleSend}
          disabled={streaming || !input.trim()}
          className="bg-cliff-600 hover:bg-cliff-700 disabled:bg-cliff-200 disabled:text-cliff-400 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
