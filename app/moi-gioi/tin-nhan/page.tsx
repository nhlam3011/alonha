"use client";

import { useEffect, useMemo, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
  customerId?: string | null;
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
  imageUrl?: string | null;
  createdAt: string;
  isMe: boolean;
};

export default function TinNhanPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <TinNhanContent />
    </Suspense>
  );
}

function TinNhanContent() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId");

  const [items, setItems] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [supportAdmin, setSupportAdmin] = useState<SupportAdmin | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string, name: string, isSupport?: boolean } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatSending, setChatSending] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedRecipientRef = useRef<{ id: string, name: string, isSupport?: boolean } | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Sync ref with state
  useEffect(() => {
    selectedRecipientRef.current = selectedRecipient;
  }, [selectedRecipient]);

  // Fetch leads
  useEffect(() => {
    fetch("/api/moi-gioi/leads")
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res.data)) {
          setItems(res.data);
          // If deep linked, select that lead
          if (initialUserId) {
            const lead = res.data.find((l: LeadItem) => l.customerId === initialUserId);
            if (lead) {
              setSelectedRecipient({ id: lead.customerId!, name: lead.name });
            }
          }
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [initialUserId]);

  // Fetch support admin
  useEffect(() => {
    fetch("/api/chat/support-admin")
      .then((r) => r.json())
      .then((res) => {
        if (res?.data?.id) {
          const adminData = res.data;
          setSupportAdmin(adminData);
          const admin = { id: adminData.id, name: "Hỗ trợ đối tác", isSupport: true };
          // Only select support if no other recipient is selected
          if (!initialUserId) {
            setSelectedRecipient(admin);
          }
        }
      })
      .catch(() => { });
  }, [initialUserId]);

  // Load messages when recipient changes
  useEffect(() => {
    if (!selectedRecipient) return;

    setChatLoading(true);
    setChatMessages([]);
    conversationIdRef.current = null;

    fetch(`/api/chat/messages?userId=${encodeURIComponent(selectedRecipient.id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.conversationId) conversationIdRef.current = data.conversationId;
        if (Array.isArray(data.data)) {
          setChatMessages(data.data.map((m: any) => ({ ...m, isMe: m.isMe ?? false })));
        }
      })
      .catch(() => { })
      .finally(() => setChatLoading(false));
  }, [selectedRecipient]);

  // Polling mỗi 3s để nhận tin nhắn mới (realtime)
  useEffect(() => {
    const interval = setInterval(async () => {
      const recipientId = selectedRecipientRef.current?.id;
      if (!recipientId) return;
      try {
        const url = conversationIdRef.current
          ? `/api/chat/messages?conversationId=${encodeURIComponent(conversationIdRef.current)}`
          : `/api/chat/messages?userId=${encodeURIComponent(recipientId)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.conversationId) conversationIdRef.current = data.conversationId;
        if (Array.isArray(data.data)) {
          setChatMessages((prev) => {
            // Chỉ cập nhật nếu có tin mới
            if (data.data.length !== prev.length || (data.data.length > 0 && data.data[data.data.length - 1].id !== prev[prev.length - 1]?.id)) {
              return data.data.map((m: any) => ({ ...m, isMe: m.isMe ?? false }));
            }
            return prev;
          });
        }
      } catch { }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  async function sendChatMessage() {
    if (!selectedRecipient) return;
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
        body: JSON.stringify({ userId: selectedRecipient.id, content }),
      });
      const data = (await res.json().catch(() => ({})));
      if (!res.ok || !data.data) {
        throw new Error(data.error || "Không thể gửi tin nhắn.");
      }
      // Lưu conversationId cho polling
      if (data.conversationId) conversationIdRef.current = data.conversationId;
    } catch {
      // Rollback in real app
    } finally {
      setChatSending(false);
    }
  }

  // Upload hình ảnh
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedRecipient) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Hình ảnh không được vượt quá 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Upload ảnh lên server
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Không thể tải ảnh lên');
      }

      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url || uploadData.data?.url;

      if (!imageUrl) {
        throw new Error('Không lấy được URL ảnh');
      }

      // Gửi tin nhắn với hình ảnh
      const tempId = Date.now().toString();
      const newMsg: ChatMessage = { id: tempId, content: '', imageUrl, createdAt: new Date().toISOString(), isMe: true };
      setChatMessages(prev => [...prev, newMsg]);

      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedRecipient.id, content: '', imageUrl }),
      });
      const data = (await res.json().catch(() => ({})));
      if (!res.ok || !data.data) {
        throw new Error(data.error || "Không thể gửi tin nhắn.");
      }
      if (data.conversationId) conversationIdRef.current = data.conversationId;
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gửi ảnh');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  }

  // Xóa lịch sử trò chuyện
  async function handleClearHistory() {
    if (!conversationIdRef.current) {
      alert('Chưa có cuộc trò chuyện nào');
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện không?')) {
      return;
    }

    try {
      const res = await fetch(`/api/chat/messages?conversationId=${conversationIdRef.current}&clearAll=true`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Không thể xóa lịch sử');
      }

      setChatMessages([]);
      alert('Đã xóa lịch sử trò chuyện');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa lịch sử');
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
            {/* Support Admin Item */}
            {supportAdmin && (
              <div
                onClick={() => setSelectedRecipient({ id: supportAdmin.id, name: "Hỗ trợ đối tác", isSupport: true })}
                className={`p-4 cursor-pointer border-b border-[var(--border)] transition-colors flex items-start gap-4 ${selectedRecipient?.id === supportAdmin.id ? 'bg-[var(--primary)]/10' : 'hover:bg-[var(--muted)]/40'}`}
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[var(--foreground)]">Hỗ trợ đối tác</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">Đội ngũ kỹ thuật Alonha</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
                <p className="mt-3 text-sm text-[var(--muted-foreground)]">Đang tải danh sách...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-xs text-[var(--muted-foreground)]">Không tìm thấy khách hàng</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => item.customerId && setSelectedRecipient({ id: item.customerId, name: item.name })}
                    className={`group p-4 cursor-pointer transition-colors flex items-start gap-4 ${selectedRecipient?.id === item.customerId ? 'bg-[var(--primary)]/10' : 'hover:bg-[var(--muted)]/40'} ${!item.customerId ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    title={!item.customerId ? "Khách hàng dãng vãng - không thể nhắn tin trực tiếp" : ""}
                  >
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
                        <div className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          {item.phone}
                        </div>
                      </div>
                      {item.listingTitle && (
                        <div className="flex items-center gap-1 text-[10px] text-blue-600 truncate mb-2">
                          <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                          <span className="truncate">{item.listingTitle}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className={item.status === 'Mới' ? 'badge-primary' : 'badge'}>
                          {item.status}
                        </span>
                        {!item.customerId && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Khách vãng lai</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat Area */}
        <div className="flex flex-col bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden min-h-0 h-full">
          {/* Chat Header */}
          <div className="p-4 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
              {selectedRecipient ? (
                <>
                  <div className="relative">
                    <div className={`h-10 w-10 flex items-center justify-center rounded-full text-white shadow-md ${selectedRecipient.isSupport ? 'bg-indigo-600' : 'bg-[var(--primary)]'}`}>
                      {selectedRecipient.isSupport ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      ) : selectedRecipient.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900"></span>
                  </div>
                  <div>
                    <h2 className="font-bold text-[var(--foreground)]">{selectedRecipient.name}</h2>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                      <p className="text-xs text-[var(--muted-foreground)]">Trực tuyến</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 opacity-50">
                  <div className="h-10 w-10 rounded-full bg-[var(--muted)]" />
                  <div className="h-4 w-32 bg-[var(--muted)] rounded" />
                </div>
              )}
            </div>
            {chatMessages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                title="Xóa lịch sử trò chuyện"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--muted)]/10 scroll-smooth">
            {!selectedRecipient ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                <div className="h-16 w-16 bg-[var(--muted)] rounded-2xl flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">Chọn người nhận để bắt đầu chat</h3>
              </div>
            ) : chatLoading ? (
              <div className="flex flex-col items-center justify-center h-full opacity-60">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                <div className="h-16 w-16 bg-[var(--muted)] rounded-2xl flex items-center justify-center mb-4 rotate-3">
                  <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">Bắt đầu trò chuyện với {selectedRecipient.name}</h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-1 max-w-[240px]">Gửi tin nhắn để bắt đầu cuộc hội thoại.</p>
              </div>
            ) : (
              chatMessages.map((m) => (
                <div key={m.id} className={`flex ${m.isMe ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300 group`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${m.isMe
                    ? "bg-[var(--primary)] text-white rounded-br-none"
                    : "bg-white dark:bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-bl-none"
                    }`}>
                    {m.imageUrl && (
                      <div className="mb-2">
                        <img
                          src={m.imageUrl}
                          alt="Hình ảnh"
                          className="max-w-full rounded-lg max-h-60 object-cover cursor-pointer"
                          onClick={() => m.imageUrl && window.open(m.imageUrl, '_blank')}
                        />
                      </div>
                    )}
                    {m.content && <p className="leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>}
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
              <label className="p-3 rounded-2xl hover:bg-[var(--muted)] cursor-pointer transition-colors text-[var(--muted-foreground)] hover:text-[var(--primary)]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage || !selectedRecipient}
                  className="hidden"
                />
                {uploadingImage ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                )}
              </label>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                disabled={chatSending || !selectedRecipient}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] pl-4 pr-12 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={chatSending || !chatInput.trim() || !selectedRecipient}
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
