"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface ChatMessage {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  isMe: boolean;
}

interface Recipient {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export default function UserTinNhanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--muted-foreground)]">Đang tải...</div>}>
      <UserTinNhanContent />
    </Suspense>
  );
}

function UserTinNhanContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get("userId");

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  
  const selectedRecipientRef = useRef<Recipient | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedRecipientRef.current = selectedRecipient;
  }, [selectedRecipient]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, loadingChat]);

  const fetchRecipients = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/chat/messages?list=true");
      const data = await res.json();
      if (data.data) {
        setRecipients(data.data);
        
        if (deepLinkId) {
            const found = data.data.find((r: Recipient) => r.id === deepLinkId);
            if (found) setSelectedRecipient(found);
            else {
                fetchUserInfo(deepLinkId);
            }
        }
      }
    } catch (err) {
      console.error("Fetch recipients error:", err);
    } finally {
      setLoadingList(false);
    }
  }, [session?.user?.id, deepLinkId]);

  async function fetchUserInfo(userId: string) {
      try {
          const res = await fetch(`/api/users/${userId}`);
          const data = await res.json();
          if (data.user) {
              const newRec: Recipient = {
                  id: data.user.id,
                  name: data.user.name || "Người dùng",
                  avatar: data.user.avatar || null,
                  role: data.user.role || "USER"
              };
              setSelectedRecipient(newRec);
              setRecipients(prev => {
                  if (prev.find(r => r.id === userId)) return prev;
                  return [newRec, ...prev];
              });
          }
      } catch (e) {
          console.error("Fetch user info error:", e);
      }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchRecipients();
    }
  }, [status, fetchRecipients]);

  useEffect(() => {
    if (!selectedRecipient) return;

    setLoadingChat(true);
    setChatMessages([]);
    conversationIdRef.current = null;

    fetch(`/api/chat/messages?userId=${encodeURIComponent(selectedRecipient.id)}`)
      .then(r => r.json())
      .then(data => {
        if (data.conversationId) conversationIdRef.current = data.conversationId;
        if (Array.isArray(data.data)) {
          setChatMessages(data.data.map((m: any) => ({ ...m, isMe: m.isMe ?? false })));
        }
      })
      .catch(err => console.error("Fetch messages error:", err))
      .finally(() => setLoadingChat(false));
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

  async function handleSendMessage() {
    const content = messageInput.trim();
    if (!content || !selectedRecipient || sending) return;

    setSending(true);
    const tempId = Date.now().toString();
    const newMsg: ChatMessage = { id: tempId, content, createdAt: new Date().toISOString(), isMe: true };
    setChatMessages((prev) => [...prev, newMsg]);
    setMessageInput("");

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedRecipient.id, content }),
      });
      const data = await res.json();
      if (data.conversationId) conversationIdRef.current = data.conversationId;
    } catch {
      setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert("Gửi tin nhắn thất bại.");
    } finally {
      setSending(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedRecipient) return;

    if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh');
        return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch("/api/uploads", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url || uploadData.data?.url;

      if (!imageUrl) throw new Error("URL missing");

      const tempId = Date.now().toString();
      const newMsg: ChatMessage = { id: tempId, content: '', imageUrl, createdAt: new Date().toISOString(), isMe: true };
      setChatMessages((prev) => [...prev, newMsg]);

      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedRecipient.id, content: '', imageUrl }),
      });
      const data = await res.json();
      if (data.conversationId) conversationIdRef.current = data.conversationId;
    } catch (err) {
      console.error("Image upload error:", err);
      alert("Gửi ảnh thất bại.");
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  }

  if (status === "loading") return <div className="p-8 text-center text-[var(--muted-foreground)]">Đang tải...</div>;
  if (status === "unauthenticated") return <div className="p-8 text-center">Vui lòng đăng nhập để xem tin nhắn.</div>;

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col gap-6 lg:h-[calc(100vh-10rem)]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-6 flex-none">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] flex items-center gap-3">
            <span className="w-1.5 h-8 rounded-full bg-[var(--primary)] block"></span>
            Tin nhắn
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)] text-sm">
            Trao đổi trực tiếp với môi giới và quản trị viên.
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm min-h-0 h-full">
        {/* Sidebar: Conversations */}
        <div className={`w-full sm:w-80 flex flex-col border-r border-[var(--border)] bg-[var(--muted)]/5 ${selectedRecipient ? "hidden sm:flex" : "flex"}`}>
          <div className="p-4 border-b border-[var(--border)] bg-[var(--card)]">
            <h2 className="font-bold text-[var(--foreground)] text-sm uppercase tracking-wider opacity-60">Cuộc trò chuyện</h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingList ? (
              <div className="p-8 text-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent mx-auto"></div></div>
            ) : recipients.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted-foreground)] text-sm mt-10">Chưa có cuộc trò chuyện nào.</div>
            ) : (
              recipients.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRecipient(r)}
                  className={`flex w-full items-center gap-3 p-4 text-left transition-colors border-b border-[var(--border)]/30 ${
                    selectedRecipient?.id === r.id ? "bg-[var(--primary)]/10" : "hover:bg-[var(--muted)]/20"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white overflow-hidden ring-2 ring-[var(--border)]/50">
                      {r.avatar ? (
                        <img src={r.avatar} alt={r.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold">{r.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-sm font-bold text-[var(--foreground)]">{r.name}</p>
                      {r.lastMessageAt && (
                        <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">
                           {new Date(r.lastMessageAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[10px] uppercase font-semibold text-[var(--primary)] opacity-80">
                      {r.role === "ADMIN" ? "Hỗ trợ Alonha" : "Môi giới"}
                    </p>
                    {r.lastMessage && (
                      <p className="mt-1 truncate text-xs text-[var(--muted-foreground)] line-clamp-1">{r.lastMessage}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex flex-1 flex-col bg-[var(--card)] ${selectedRecipient ? "flex" : "hidden sm:flex"}`}>
          {selectedRecipient ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 bg-[var(--card)]/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedRecipient(null)} className="sm:hidden p-1 -ml-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <div className="relative">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white overflow-hidden ring-2 ring-white">
                        {selectedRecipient.avatar ? (
                          <img src={selectedRecipient.avatar} alt={selectedRecipient.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold">{selectedRecipient.name.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"></span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">{selectedRecipient.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] text-[var(--muted-foreground)]">Trực tuyến</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages List - Styled like broker-side */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--muted)]/5 scroll-smooth custom-scrollbar">
                {loadingChat ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                    <p className="text-sm">Bắt đầu trò chuyện với {selectedRecipient.name}</p>
                  </div>
                ) : (
                  chatMessages.map((m) => (
                    <div key={m.id} className={`flex ${m.isMe ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        m.isMe
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
                        {m.content && <p className="whitespace-pre-wrap leading-relaxed break-words">{m.content}</p>}
                        <p className={`mt-1.5 text-[9px] text-right ${m.isMe ? "text-blue-100" : "text-[var(--muted-foreground)]"}`}>
                          {new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area - Unifted with broker side */}
              <div className="p-3 bg-[var(--card)] border-t border-[var(--border)]">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
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
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    disabled={sending || !selectedRecipient}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] pl-4 pr-12 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageInput.trim() || !selectedRecipient}
                    className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {sending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <svg className="h-5 w-5 transform rotate-90 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-transparent to-[var(--muted)]/5 mt-10">
              <div className="mb-6 rounded-3xl bg-[var(--primary)]/10 p-6 text-[var(--primary)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)]">Tin nhắn của bạn</h3>
              <p className="mt-2 max-w-sm text-sm text-[var(--muted-foreground)] leading-relaxed">
                Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin với môi giới hoặc quản trị viên.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
