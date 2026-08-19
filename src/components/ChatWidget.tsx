"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, RotateCcw } from "lucide-react";
import { BrainLogo } from "@/components/BrainLogo";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "chat_history";
const MAX_HISTORY = 40;
const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hallo! Ich helfe dir gerne bei Fragen zur AI Asset Factory Brain. Was möchtest du wissen?",
};

function loadMessages(): Message[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [INITIAL_MESSAGE];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as Message[];
  } catch { /* ignore */ }
  return [INITIAL_MESSAGE];
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const capped = messages.slice(-MAX_HISTORY);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(capped)); } catch { /* quota */ }
  }, [messages]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  function clearHistory() {
    sessionStorage.removeItem(STORAGE_KEY);
    setMessages([INITIAL_MESSAGE]);
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const updated: Message[] = [...messages, { role: "user", content: text }];
    setMessages(updated);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setMessages((prev) => [...prev, { role: "assistant", content: data.error ?? "Keine Antwort erhalten." }]);
        return;
      }

      // Streaming: add empty placeholder, hide spinner
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setLoading(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload) as { text?: string; error?: string };
            if (parsed.error) {
              setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "assistant", content: parsed.error! },
              ]);
              break;
            }
            if (parsed.text) {
              setMessages((prev) => {
                const msgs = [...prev];
                msgs[msgs.length - 1] = {
                  ...msgs[msgs.length - 1],
                  content: msgs[msgs.length - 1].content + parsed.text,
                };
                return msgs;
              });
            }
          } catch { /* ignore malformed SSE lines */ }
        }
      }
    } catch (err) {
      clearTimeout(timeout);
      const msg = err instanceof Error && err.name === "AbortError"
        ? "Die Anfrage hat zu lange gedauert. Bitte versuche es erneut."
        : "Verbindungsfehler. Bitte versuche es erneut.";
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          return [...prev.slice(0, -1), { role: "assistant", content: msg }];
        }
        return [...prev, { role: "assistant", content: msg }];
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      {open && (
        <div className="w-80 bg-[var(--surface-card)] rounded-2xl shadow-2xl border border-[var(--border)] flex flex-col overflow-hidden"
          style={{ height: "420px" }}>
          {/* Header — same gradient as hero: orange→blue in light, pink→blue in dark */}
          <div className="bg-gradient-to-r from-[#E8956D] to-[#1B7FD4] px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center p-1">
                <BrainLogo variant="white" id="chat-header" className="w-full h-full" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-none">Brain Assistent</p>
                <p className="text-white/60 text-xs mt-0.5">Frag mich alles</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearHistory} title="Verlauf löschen"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30 transition">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setOpen(false)} title="Schließen"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-[var(--surface-page)]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[var(--accent)] text-white rounded-br-sm"
                    : "bg-[var(--surface-card)] text-[var(--text-secondary)] border border-[var(--border)] rounded-bl-sm shadow-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                  <Loader2 className="w-4 h-4 text-[var(--text-muted)] animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-[var(--border-subtle)] bg-[var(--surface-card)] shrink-0 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
              placeholder="Frage eingeben…"
              className="flex-1 text-sm bg-[var(--surface-raised)] rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent)]/30 text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]"
              disabled={loading}
            />
            <button
              onClick={() => void send()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 flex items-center justify-center transition shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E8956D] to-[#1B7FD4] shadow-lg hover:shadow-xl hover:opacity-90 transition-all flex items-center justify-center text-white"
        aria-label="Assistent öffnen"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
    </div>
  );
}
