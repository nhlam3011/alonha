"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";

type LeadItem = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  status: string;
  createdAt: string;
  listingTitle?: string;
  listingSlug?: string;
  note?: string;
};

type SupportAdmin = {
  id: string;
  name: string;
  email: string | null;
  avatar?: string | null;
};

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  isMe: boolean;
};

export default function TinNhanPage() {
  const [items, setItems] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [supportAdmin, setSupportAdmin] = useState<SupportAdmin | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatSending, setChatSending] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/moi-gioi/leads")
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res.data)) {
          setItems(res.data);
        } else {
          setItems([]);
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/chat/support-admin")
      .then((r) => r.json())
      .then((res) => {
        if (res?.data?.id) {
          setSupportAdmin(res.data);
          return fetch(`/api/chat/messages?userId=${encodeURIComponent(res.data.id)}`);
        }
        return null;
      })
      .then((r) => (r ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (Array.isArray(data.data)) {
          // Provide safe defaults for isMe if missing
          const safeMessages = data.data.map((m: any) => ({
            ...m,
            isMe: m.isMe ?? false
          }));
          setChatMessages(safeMessages);
        }
      })
      .catch(() => { })
      .finally(() => {
        setChatLoading(false);
      });
  }, []);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  async function sendChatMessage() {
    if (!supportAdmin) return;
    const content = chatInput.trim();
    if (!content) return;
    setChatSending(true);

    // Optimistic UI
    const tempId = Date.now().toString();
    const newMsg: ChatMessage = { id: tempId, content, createdAt: new Date().toISOString(), isMe: true };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput("");

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: supportAdmin.id, content }),
      });
      const data = (await res.json().catch(() => ({})));
      if (!res.ok || !data.data) {
        throw new Error(data.error || "Không thể gửi tin nhắn.");
      }
      // Replace optimistic message with real one if needed, or just let it be
    } catch {
      // Rollback in real app
    } finally {
      setChatSending(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.phone.includes(q) ||
        (i.email ? i.email.toLowerCase().includes(q) : false) ||
        (i.listingTitle ? i.listingTitle.toLowerCase().includes(q) : false),
    );
  }, [items, query]);

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <header className="flex-none">
        <h1 className="page-title">Tin nhắn & Liên hệ</h1>
        <p className="page-subtitle">
          Quản lý khách hàng tiềm năng và chat trực tiếp với đội ngũ hỗ trợ.
        </p>
      </header>

      <div className="flex-1 grid gap-6 lg:grid-cols-[1fr_400px] min-h-0">
        {/* Left Column: Leads List */}
        <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden min-h-0">
          {/* Toolbar */}
          <div className="p-4 border-b border-[var(--border)] bg-[var(--card)]">
            <div className="relative w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm khách hàng, số điện thoại, tin quan tâm..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
              />
              <svg className="absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>

          {/* List content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
                <p className="mt-3 text-sm text-[var(--muted-foreground)]">Đang tải danh sách...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="mb-4 rounded-full bg-[var(--muted)] p-4">
                  <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <h3 className="font-bold text-[var(--foreground)]">Chưa có liên hệ nào</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">Các liên hệ từ khách hàng sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {filtered.map((item) => (
                  <div key={item.id} className="group p-4 hover:bg-[var(--muted)]/40 transition-colors flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-[var(--foreground)] truncate">{item.name}</h3>
                        <span className="text-[10px] text-[var(--muted-foreground)] whitespace-nowrap bg-[var(--muted)] px-1.5 py-0.5 rounded">
                          {new Date(item.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] mb-1.5">
                        <a href={`tel:${item.phone}`} className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          {item.phone}
                        </a>
                        {item.listingTitle && (
                          <Link href={`/bat-dong-san/${item.listingSlug || '#'}`} className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors truncate max-w-[200px]" target="_blank">
                            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            <span className="truncate">{item.listingTitle}</span>
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={item.status === 'Mới' ? 'badge-primary' : 'badge'}>
                          {item.status}
                        </span>
                        <span className="text-[10px] text-[var(--muted-foreground)] px-2 py-0.5 rounded border border-[var(--border)]">
                          {item.source}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Support Chat */}
        <div className="flex flex-col bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden min-h-0 h-full">
          {/* Chat Header */}
          <div className="p-4 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-md">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                {supportAdmin && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900"></span>}
              </div>
              <div>
                <h2 className="font-bold text-[var(--foreground)]">Hỗ trợ đối tác</h2>
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${supportAdmin ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <p className="text-xs text-[var(--muted-foreground)]">{supportAdmin ? 'Trực tuyến' : 'Đang kết nối...'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--muted)]/10 scroll-smooth">
            {chatLoading ? (
              <div className="flex flex-col items-center justify-center h-full opacity-60">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                <div className="h-16 w-16 bg-[var(--muted)] rounded-2xl flex items-center justify-center mb-4 rotate-3">
                  <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">Kết nối với hỗ trợ viên</h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-1 max-w-[200px]">Gửi tin nhắn để được giải đáp thắc mắc về tài khoản, tin đăng...</p>
              </div>
            ) : (
              chatMessages.map((m) => (
                <div key={m.id} className={`flex ${m.isMe ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${m.isMe
                    ? "bg-[var(--primary)] text-white rounded-br-none"
                    : "bg-white dark:bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-bl-none"
                    }`}>
                    <p className="leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={`mt-1 text-[10px] text-right ${m.isMe ? "text-blue-100" : "text-[var(--muted-foreground)]"}`}>
                      {new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-[var(--card)] border-t border-[var(--border)]">
            <form
              onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }}
              className="relative flex items-end gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                disabled={chatSending || !supportAdmin}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] pl-4 pr-12 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={chatSending || !chatInput.trim() || !supportAdmin}
                className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors shadow-sm"
              >
                {chatSending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <svg className="h-5 w-5 transform rotate-90 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
