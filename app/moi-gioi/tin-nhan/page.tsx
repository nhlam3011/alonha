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
  unreadCount?: number;
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
  listingTitle?: string;
  listingSlug?: string;
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

  useEffect(() => {
    selectedRecipientRef.current = selectedRecipient;
  }, [selectedRecipient]);

  useEffect(() => {
    fetch("/api/moi-gioi/leads")
      .then((r) => r.json())
      .then(async (res) => {
        if (Array.isArray(res.data)) {
          setItems(res.data);
          if (initialUserId) {
            const lead = res.data.find((l: LeadItem) => l.customerId === initialUserId);
            if (lead) {
              setSelectedRecipient({ id: lead.customerId!, name: lead.name });
            } else {
              // Not found in leads, try to fetch user info directly
              try {
                const userRes = await fetch(`/api/users/${initialUserId}`);
                const userData = await userRes.json();
                if (userData.user) {
                  const newUser = { id: userData.user.id, name: userData.user.name || "Người dùng" };
                  setSelectedRecipient(newUser);
                  // Optionally add to items list to show in sidebar
                  setItems(prev => [
                    {
                      id: `temp-${userData.user.id}`,
                      name: userData.user.name || "Người dùng",
                      phone: userData.user.phone || "---",
                      email: userData.user.email,
                      source: "Chat trực tiếp",
                      status: "Mới",
                      createdAt: new Date().toISOString(),
                      customerId: userData.user.id
                    },
                    ...prev
                  ]);
                }
              } catch (e) {
                console.error("Fetch user info error:", e);
              }
            }
          }
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [initialUserId]);

  useEffect(() => {
    fetch("/api/chat/support-admin")
      .then((r) => r.json())
      .then((res) => {
        if (res?.data?.id) {
          const adminData = res.data;
          setSupportAdmin(adminData);
          const admin = { id: adminData.id, name: "Hỗ trợ đối tác", isSupport: true };
          if (!initialUserId) {
            setSelectedRecipient(admin);
          }
        }
      })
      .catch(() => { });
  }, [initialUserId]);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  async function sendChatMessage() {
    if (!selectedRecipient) return;
    const content = chatInput.trim();
    if (!content) return;
    setChatSending(true);

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
      if (data.conversationId) conversationIdRef.current = data.conversationId;
    } catch {
    } finally {
      setChatSending(false);
    }
  }

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

  const handleDeleteLead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa khách hàng này khỏi danh sách?")) return;

    try {
      const res = await fetch(`/api/moi-gioi/leads?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        const lead = items.find((item) => item.id === id);
        if (lead?.customerId === selectedRecipient?.id) {
          setSelectedRecipient(null);
        }
      } else {
        alert("Xóa khách hàng thất bại");
      }
    } catch (error) {
      alert("Lỗi khi xóa khách hàng");
    }
  };

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

  async function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          // Tạo sự kiện giả để tái sử dụng handleImageUpload hoặc gọi trực tiếp logic upload
          const mockEvent = {
            target: {
              files: [file],
              value: ''
            }
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          handleImageUpload(mockEvent);
        }
      }
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 h-[calc(100vh-100px)] md:h-[calc(100vh-140px)] flex flex-col overflow-hidden">
      <header className={`flex-none ${selectedRecipient ? 'hidden md:block' : 'block'}`}>
        <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Tin nhắn & Liên hệ</h1>
      </header>

      <div className="flex-1 flex gap-6 min-h-0 relative">
        {/* Left Column: Leads List */}
        <div className={`flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-sm shadow-sm overflow-hidden min-h-0 z-20 
          ${selectedRecipient ? 'hidden md:flex md:w-[350px] lg:w-[400px]' : 'flex w-full'}`}>
          {/* Toolbar */}
          <div className="p-4 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md sticky top-0">
            <div className="relative w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm khách hàng..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
              />
              <svg className="absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>

          {/* List content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-dots-pattern">
            {/* Support Admin Item */}
            {supportAdmin && (
              <div
                onClick={() => setSelectedRecipient({ id: supportAdmin.id, name: "Hỗ trợ đối tác", isSupport: true })}
                className={`p-4 cursor-pointer border-b border-[var(--border)]/50 transition-all flex items-start gap-4 ${selectedRecipient?.id === supportAdmin.id ? 'bg-[var(--primary)]/10 ring-1 ring-inset ring-[var(--primary)]/20' : 'hover:bg-[var(--primary)]/5'}`}
              >
                <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">Hỗ trợ đối tác</h3>
                  <p className="text-xs text-[var(--muted-foreground)] opacity-80">Đội ngũ kỹ thuật Alonha</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 opacity-50">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center opacity-40">
                <p className="text-xs font-medium">Không tìm thấy khách hàng</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]/50">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => item.customerId && setSelectedRecipient({ id: item.customerId, name: item.name })}
                    className={`group relative p-4 cursor-pointer transition-all flex items-start gap-4 border-b border-[var(--border)]/30 ${selectedRecipient?.id === item.customerId ? 'bg-[var(--primary)]/10 ring-1 ring-inset ring-[var(--primary)]/20' : 'hover:bg-[var(--primary)]/5'} ${!item.customerId ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    title={!item.customerId ? "Khách hàng vãng lai - không thể nhắn tin" : ""}
                  >
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-[var(--primary)] to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white/10">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-bold truncate group-hover:text-[var(--primary)] transition-colors ${item.unreadCount && item.unreadCount > 0 ? "text-[var(--foreground)]" : "text-[var(--foreground)]/80"}`}>{item.name}</h3>
                        <span className={`text-[10px] font-medium tabular-nums ${item.unreadCount && item.unreadCount > 0 ? "text-[var(--primary)] font-bold" : "text-[var(--muted-foreground)]"}`}>
                          {new Date(item.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--muted-foreground)] mb-1.5 opacity-80 font-medium">
                        <div className="flex items-center gap-1">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          {item.phone}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ring-1 ring-inset ${item.status === 'Mới' ? 'bg-green-500/10 text-green-600 ring-green-500/20' : 'bg-[var(--muted)] text-[var(--muted-foreground)] ring-[var(--border)]'}`}>
                            {item.status}
                          </span>
                          {!item.customerId && <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/20">Vãng lai</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleDeleteLead(e, item.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[var(--muted-foreground)] hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Xóa khách hàng"
                          >
                            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          {item.unreadCount && item.unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-bold text-white shadow-sm shadow-[var(--primary)]/20">
                              {item.unreadCount > 99 ? "99+" : item.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat Area */}
        <div className={`flex flex-col bg-[var(--background)]/30 backdrop-blur-sm rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden min-h-0 flex-1 h-full
          ${!selectedRecipient ? 'hidden md:flex' : 'flex'}`}>
          {/* Chat Header */}
          <div className="p-3 md:p-4 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md flex items-center justify-between shadow-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedRecipient(null)}
                className="md:hidden p-2 -ml-1 rounded-xl hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
                title="Quay lại danh sách"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>

              {selectedRecipient ? (
                <>
                  <div className="relative">
                    <div className={`h-10 w-10 flex items-center justify-center rounded-xl text-white font-bold shadow-lg ${selectedRecipient.isSupport ? 'bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-500/20' : 'bg-gradient-to-br from-[var(--primary)] to-blue-600 shadow-[var(--primary)]/20'}`}>
                      {selectedRecipient.isSupport ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      ) : selectedRecipient.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-[var(--background)]"></span>
                  </div>
                  <div>
                    <h2 className="font-bold text-[var(--foreground)] leading-tight">{selectedRecipient.name}</h2>
                    <div className="flex items-center gap-1.5 opacity-70">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                      <p className="text-[10px] font-bold uppercase tracking-wider">Đang xem</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 opacity-30">
                  <div className="h-10 w-10 rounded-xl bg-[var(--muted)]" />
                  <div className="h-4 w-32 bg-[var(--muted)] rounded" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedRecipient(null)}
                className="p-2 rounded-xl hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
                title="Thay đổi người nhận"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              {chatMessages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 transition-colors"
                  title="Xóa lịch sử trò chuyện"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dots-pattern scroll-smooth custom-scrollbar">
            {!selectedRecipient ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                <div className="h-20 w-20 bg-[var(--muted)] rounded-[40px] flex items-center justify-center mb-6 ring-1 ring-[var(--border)]">
                  <svg className="h-10 w-10 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Trung tâm tin nhắn</h3>
                <p className="text-sm max-w-xs">Chọn khách hàng từ danh sách để bắt đầu trao đổi chi tiết.</p>
              </div>
            ) : chatLoading ? (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                <div className="h-20 w-20 bg-[var(--muted)] rounded-[40px] flex items-center justify-center mb-6 ring-1 ring-[var(--border)] rotate-3">
                  <svg className="h-10 w-10 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Bắt đầu trò chuyện</h3>
                <p className="text-sm max-w-xs">Gửi tin nhắn đầu tiên cho {selectedRecipient.name} ngay bây giờ.</p>
              </div>
            ) : (
              chatMessages.map((m) => (
                <div key={m.id} className={`flex ${m.isMe ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300 group`}>
                  <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative ${m.isMe
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-none"
                    : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-bl-none"
                    }`}>
                    {m.imageUrl && (
                      <div className="mb-2 -mx-1">
                        <img
                          src={m.imageUrl}
                          alt="Hình ảnh"
                          className="max-w-full rounded-xl max-h-80 object-cover cursor-zoom-in hover:opacity-95 transition-all"
                          onClick={() => m.imageUrl && window.open(m.imageUrl, '_blank')}
                        />
                      </div>
                    )}
                    {m.content && (
                      (() => {
                        const match = m.content.match(/^\[Từ tin đăng:\s*([a-zA-Z0-9_-]+)\]([\s\S]*)$/i);
                        if (match) {
                          const listingId = match[1];
                          const restText = match[2].trim();
                          const title = m.listingTitle || "Xem thông tin Bất động sản";
                          const href = m.listingSlug ? `/bat-dong-san/${m.listingSlug}` : `/bat-dong-san/${listingId}`;
                          return (
                            <div className="flex flex-col gap-2">
                              <Link
                                href={href}
                                target="_blank"
                                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all no-underline group shadow-sm ${m.isMe
                                  ? "bg-white/20 border-white/30 hover:bg-white/30 text-white"
                                  : "bg-white dark:bg-black/20 border-[var(--border)] hover:bg-slate-50 dark:hover:bg-black/40 text-[var(--foreground)]"
                                  }`}
                              >
                                <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${m.isMe ? "bg-white/20 text-white" : "bg-[var(--primary)]/10 text-[var(--primary)]"
                                  }`}>
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-bold truncate transition-colors ${m.isMe ? "" : "group-hover:text-[var(--primary)]"}`} title={title}>{title}</p>
                                  <p className={`text-[11px] truncate mt-0.5 ${m.isMe ? "text-blue-100" : "text-[var(--muted-foreground)]"}`}>Mã tin: {listingId}</p>
                                </div>
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${m.isMe ? "bg-white/20" : "bg-[var(--primary)]/10 text-[var(--primary)]"
                                  }`}>
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </div>
                              </Link>
                              {restText && <p className="leading-relaxed whitespace-pre-wrap break-words">{restText}</p>}
                            </div>
                          );
                        }
                        return <p className="leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>;
                      })()
                    )}
                    <div className={`flex items-center gap-1 mt-1 ${m.isMe ? "justify-end" : "justify-start"}`}>
                      <p className={`text-[9px] font-medium uppercase tracking-wider ${m.isMe ? "text-blue-100/80" : "text-[var(--muted-foreground)]"}`}>
                        {new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {m.isMe && (
                        <svg className="h-2.5 w-2.5 text-blue-200" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 md:p-4 bg-[var(--card)]/50 border-t border-[var(--border)] backdrop-blur-md">
            <form
              onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }}
              className="relative flex items-end gap-2 max-w-4xl mx-auto"
            >
              <label className="p-2.5 md:p-3 rounded-2xl hover:bg-[var(--primary)]/10 cursor-pointer transition-all text-[var(--muted-foreground)] hover:text-[var(--primary)] bg-[var(--muted)]/50 mb-0.5">
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
                  <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                )}
              </label>
              <div className="flex-1 relative flex items-center">
                <textarea
                  rows={1}
                  value={chatInput}
                  onPaste={handlePaste}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  placeholder="Nhập tin nhắn..."
                  disabled={chatSending || !selectedRecipient}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all resize-none max-h-32 overflow-hidden"
                />
              </div>
              <button
                type="submit"
                disabled={chatSending || !chatInput.trim() || !selectedRecipient}
                className="p-3 md:px-6 bg-[var(--primary)] text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex-shrink-0 mb-0.5"
              >
                {chatSending ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <span className="hidden md:block">Gửi</span>
                    <svg className="h-5 w-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
