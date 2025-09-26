"use client";
import { useState } from "react";
import { MessageCircle } from "lucide-react"; // icon (needs lucide-react)

export default function ChatWidget() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // toggle chat window

  async function send() {
    if (!input.trim()) return;
    const msg = input.trim();
    setHistory((h) => [...h, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ollama-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setHistory((h) => [
        ...h,
        { role: "assistant", text: data.answer ?? (data.error || "No reply") },
      ]);
    } catch {
      setHistory((h) => [
        ...h,
        { role: "assistant", text: "Error contacting model" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Floating button (bottom-right) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat box */}
      {open && (
        <div className="fixed bottom-20 right-5 w-80 max-h-[500px] flex flex-col border rounded shadow-lg bg-white">
          <div className="flex justify-between items-center p-2 border-b bg-blue-600 text-white rounded-t">
            <span>AI Chatbot</span>
            <button onClick={() => setOpen(false)} className="text-sm">
              ✕
            </button>
          </div>

          {/* Chat history */}
          <div className="flex-1 overflow-auto p-2 bg-gray-50">
            {history.map((m, i) => (
              <div
                key={i}
                className={`my-1 ${
                  m.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <span
                  className={`inline-block px-3 py-2 rounded ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {m.text}
                </span>
              </div>
            ))}
          </div>

          {/* Input box */}
          <div className="flex gap-2 p-2 border-t">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="flex-1 border p-2 rounded text-sm"
              placeholder="Type..."
            />
            <button
              onClick={send}
              disabled={loading}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
