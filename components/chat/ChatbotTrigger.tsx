"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

type ListingResult = {
  id: string; slug: string; title: string; price: number;
  area: number; bedrooms: number | null; bathrooms: number | null; address: string | null;
};

type ChatItem = {
  role: "user" | "assistant";
  content: string;
  results?: ListingResult[];
  timestamp?: number;
};

const QUICK_PROMPTS = [
  { label: "Căn hộ 2PN dưới 4 tỷ", prompt: "Tìm căn hộ 2 phòng ngủ dưới 4 tỷ tại TP.HCM" },
  { label: "Cho thuê gần trung tâm", prompt: "Nhà cho thuê gần trung tâm khoảng 12 triệu/tháng" },
  { label: "Pháp lý đặt cọc", prompt: "Cần lưu ý pháp lý gì trước khi đặt cọc?" },
  { label: "So sánh giá BĐS", prompt: "Hướng dẫn so sánh giá bất động sản" },
];

function formatPrice(value: number) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} tỷ`;
  if (value >= 1e6) return `${Math.round(value / 1e6)} triệu`;
  return `${value.toLocaleString("vi-VN")} đ`;
}

function formatTime(ts?: number) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function ChatbotTrigger() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const idSeed = useId();
  const fallbackSessionId = `web-${idSeed.replace(/:/g, "")}`;
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  function getSessionId() {
    const key = "alonha_chat_session_id";
    if (typeof window === "undefined") return fallbackSessionId;
    try {
      const existing = window.localStorage.getItem(key);
      if (existing) return existing;
      window.localStorage.setItem(key, fallbackSessionId);
      return fallbackSessionId;
    } catch { return fallbackSessionId; }
  }

  async function send(raw?: string) {
    const content = (raw ?? message).trim();
    if (!content || loading) return;
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content, timestamp: Date.now() }]);
    if (!raw) setMessage("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, sessionId: getSessionId() }),
      });
      const data = await res.json();
      const reply = String(data.reply ?? "").trim() || "Không có phản hồi.";
      const results: ListingResult[] | undefined = Array.isArray(data.results) ? data.results : undefined;
      setMessages((prev) => [...prev, { role: "assistant", content: reply, results, timestamp: Date.now() }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Đã xảy ra lỗi. Thử lại sau.", timestamp: Date.now() }]);
    }
    setLoading(false);
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {/* Chat window */}
      {open && (
        <div className="animate-fade-in-up mb-3 flex w-[calc(100vw-2rem)] max-w-[24rem] max-h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl sm:w-[24rem]">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            <div className="relative">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[var(--card)] bg-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--foreground)]">Trợ lý AloNha</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">AI hỗ trợ tư vấn BĐS</p>
            </div>
            {hasMessages && (
              <button type="button" onClick={() => setMessages([])} title="Xóa hội thoại"
                className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-thin">
            {/* Welcome */}
            {!hasMessages && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[var(--primary-light)] text-[var(--primary)]">
                    <svg className="size-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-[var(--foreground)]">Xin chào! 👋</h3>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Tôi là trợ lý AI. Hãy hỏi về BĐS, giá, khu vực hoặc quy trình giao dịch.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((q) => (
                    <button key={q.prompt} type="button" onClick={() => void send(q.prompt)} disabled={loading}
                      className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-2.5 text-left text-[11px] font-medium text-[var(--foreground)] transition-all hover:border-[var(--primary)]/40 hover:bg-[var(--primary-light)] disabled:opacity-50">
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div key={i} className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
                    <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isUser
                      ? "rounded-br-md bg-[var(--primary)] text-white"
                      : "rounded-bl-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                      }`}>
                      <p className="whitespace-pre-line">{m.content}</p>
                    </div>
                    {/* Listing results */}
                    {!isUser && m.results && m.results.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {m.results.map((r) => (
                          <Link key={r.id} href={`/bat-dong-san/${r.slug}`}
                            className="group block rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 transition-all hover:border-[var(--primary)]/40 hover:shadow-sm">
                            <p className="text-xs font-semibold text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--primary)]">{r.title}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-xs font-bold text-[var(--primary)]">{r.price === 0 ? "Thỏa thuận" : formatPrice(r.price)}</span>
                              <span className="text-[10px] text-[var(--muted-foreground)]">{r.area}m²{r.bedrooms != null && ` · ${r.bedrooms}PN`}{r.bathrooms != null && ` · ${r.bathrooms}WC`}</span>
                            </div>
                            {r.address && <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)] line-clamp-1">{r.address}</p>}
                          </Link>
                        ))}
                      </div>
                    )}
                    <p className="mt-0.5 text-[9px] text-[var(--muted-foreground)]">{formatTime(m.timestamp)}</p>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div className="mb-3 flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                  <span className="size-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" style={{ animationDelay: "0ms" }} />
                  <span className="size-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" style={{ animationDelay: "150ms" }} />
                  <span className="size-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts for ongoing chat */}
          {hasMessages && !loading && (
            <div className="border-t border-[var(--border)] px-3 py-2">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-0.5">
                {QUICK_PROMPTS.map((q) => (
                  <button key={q.prompt} type="button" onClick={() => void send(q.prompt)}
                    className="shrink-0 rounded-full border border-[var(--border)] px-2.5 py-1 text-[10px] font-medium text-[var(--muted-foreground)] transition hover:border-[var(--primary)]/30 hover:text-[var(--primary)]">
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-[var(--border)] p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
                }}
                rows={1}
                placeholder="Nhập câu hỏi..."
                className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
              />
              <button type="button" onClick={() => void send()} disabled={loading || !message.trim()}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white transition-all hover:bg-[var(--primary-hover)] disabled:opacity-40">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="group flex size-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        aria-label="Chat">
        {open ? (
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="size-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </div>
  );
}
