"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useSession } from "next-auth/react";

type AgentItem = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    role: string;
    createdAt: string;
};

type ChatMessage = {
    id: string;
    content: string;
    imageUrl?: string | null;
    createdAt: string;
    isMe: boolean;
};

type ConversationWithAgent = {
    id: string;
    agentId: string;
    agentName: string;
    agentEmail: string;
    agentAvatar: string | null;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
};

export default function AdminTinNhanPage() {
    const { data: session } = useSession();
    const [agents, setAgents] = useState<AgentItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [conversations, setConversations] = useState<ConversationWithAgent[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatSending, setChatSending] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/admin/users?role=AGENT")
            .then((r) => r.json())
            .then((res) => {
                if (Array.isArray(res.data)) {
                    setAgents(res.data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetch("/api/admin/chat/conversations")
            .then((r) => r.json())
            .then((res) => {
                if (Array.isArray(res.data)) {
                    setConversations(res.data);
                }
            })
            .catch(() => { });
    }, []);

    const conversationIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!selectedAgentId) {
            setChatMessages([]);
            conversationIdRef.current = null;
            return;
        }

        setChatLoading(true);
        fetch(`/api/chat/messages?userId=${selectedAgentId}`)
            .then((r) => r.json())
            .then((res) => {
                if (Array.isArray(res.data)) {
                    setChatMessages(res.data);
                }
                if (res.conversationId) conversationIdRef.current = res.conversationId;
                setChatLoading(false);

                setTimeout(() => {
                    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
            })
            .catch(() => setChatLoading(false));
    }, [selectedAgentId]);

    useEffect(() => {
        if (!selectedAgentId) return;
        const interval = setInterval(async () => {
            try {
                const url = conversationIdRef.current
                    ? `/api/chat/messages?conversationId=${encodeURIComponent(conversationIdRef.current)}`
                    : `/api/chat/messages?userId=${encodeURIComponent(selectedAgentId)}`;
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
    }, [selectedAgentId]);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !selectedAgentId) return;

        setChatSending(true);
        try {
            const res = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: selectedAgentId,
                    content: chatInput.trim(),
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.data) {
                    setChatMessages((prev) => [...prev, data.data]);
                    setChatInput("");
                    if (data.conversationId) conversationIdRef.current = data.conversationId;
                    setTimeout(() => {
                        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                }
            }
        } catch (e) {
            console.error("Send message failed", e);
        } finally {
            setChatSending(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedAgentId) return;

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
                body: JSON.stringify({ userId: selectedAgentId, content: '', imageUrl }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.conversationId) conversationIdRef.current = data.conversationId;
                setTimeout(() => {
                    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
            }
        } catch (err: any) {
            alert(err.message || 'Lỗi khi gửi ảnh');
        } finally {
            setUploadingImage(false);
            e.target.value = '';
        }
    };

    const handleClearHistory = async () => {
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
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return "Hôm nay";
        if (days === 1) return "Hôm qua";
        return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    };

    const getAgentInfo = (agentId: string) => {
        const agent = agents.find(a => a.id === agentId);
        if (agent) return agent;

        const conv = conversations.find(c => c.agentId === agentId);
        if (conv) {
            return {
                id: conv.agentId,
                name: conv.agentName,
                email: conv.agentEmail,
                avatar: conv.agentAvatar,
            };
        }
        return null;
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                if (file) {
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
    };

    return (
        <div className="flex bg-[var(--background)] h-[calc(100vh-120px)] md:h-[calc(100vh-140px)] overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm backdrop-blur-sm">
            {/* Sidebar - Agent List */}
            <div className={`w-full md:w-80 border-r border-[var(--border)] flex flex-col bg-[var(--card)]/50 ${selectedAgentId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Tin nhắn</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">Nhắn tin với môi giới</p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                            <p className="mt-2 text-sm text-[var(--muted-foreground)]">Đang tải...</p>
                        </div>
                    ) : agents.length === 0 ? (
                        <div className="p-8 text-center text-[var(--muted-foreground)]">
                            <div className="mb-3 flex justify-center">
                                <svg className="h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            Chưa có môi giới nào
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--border)]/50">
                            {agents.map((agent) => {
                                const conv = conversations.find(c => c.agentId === agent.id);
                                const isSelected = selectedAgentId === agent.id;

                                return (
                                    <button
                                        key={agent.id}
                                        onClick={() => setSelectedAgentId(agent.id)}
                                        className={`w-full p-4 flex items-start gap-3 hover:bg-[var(--primary)]/5 transition-all text-left group ${isSelected ? "bg-[var(--primary)]/10 ring-1 ring-inset ring-[var(--primary)]/20" : ""
                                            }`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-blue-600 flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-105 transition-transform">
                                                {agent.avatar ? (
                                                    <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-2xl object-cover" />
                                                ) : (
                                                    agent.name?.charAt(0)?.toUpperCase() || "?"
                                                )}
                                            </div>
                                            {conv && conv.unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[var(--background)] animate-pulse">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">{agent.name}</span>
                                                {conv && (
                                                    <span className="text-[10px] font-medium text-[var(--muted-foreground)] tabular-nums">{formatDate(conv.lastMessageAt)}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[var(--muted-foreground)] truncate">{agent.email}</p>
                                            {conv && (
                                                <p className="text-xs text-[var(--muted-foreground)] truncate mt-1.5 opacity-80 line-clamp-1">{conv.lastMessage}</p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-[var(--background)]/30 backdrop-blur-sm ${!selectedAgentId ? 'hidden md:flex' : 'flex'}`}>
                {selectedAgentId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-3 md:p-4 border-b border-[var(--border)] flex items-center gap-3 bg-[var(--card)]/80 backdrop-blur-md sticky top-0 z-10 shadow-sm transition-all duration-300">
                            <button
                                onClick={() => setSelectedAgentId(null)}
                                className="p-2 -ml-1 rounded-xl hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors group"
                            >
                                <svg className={`h-6 w-6 transition-transform group-active:-translate-x-1 ${!selectedAgentId ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={selectedAgentId ? "M15 19l-7-7 7-7" : "M4 6h16M4 12h16M4 18h16"} />
                                </svg>
                            </button>

                            {(() => {
                                const agent = getAgentInfo(selectedAgentId);
                                return agent ? (
                                    <>
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                                            {agent.avatar ? (
                                                <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-xl object-cover" />
                                            ) : (
                                                agent.name?.charAt(0)?.toUpperCase() || "?"
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-[var(--foreground)] truncate leading-tight">{agent.name}</div>
                                            <div className="text-[10px] md:text-xs text-[var(--muted-foreground)] truncate font-medium">{agent.email}</div>
                                        </div>
                                    </>
                                ) : null;
                            })()}
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

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-dots-pattern">
                            {chatLoading ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-50">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                                </div>
                            ) : chatMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                                    <div className="h-16 w-16 bg-[var(--muted)] rounded-3xl flex items-center justify-center mb-4">
                                        <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                    </div>
                                    <p className="text-sm font-medium">Bắt đầu cuộc trò chuyện mới</p>
                                </div>
                            ) : (
                                chatMessages.map((msg, idx) => (
                                    <div
                                        key={msg.id || idx}
                                        className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"} animate-in slide-in-from-bottom-2 duration-300`}
                                    >
                                        <div
                                            className={`max-w-[85%] md:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm relative group ${msg.isMe
                                                ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-none"
                                                : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-bl-none"
                                                }`}
                                        >
                                            {/* Hiển thị hình ảnh nếu có */}
                                            {msg.imageUrl && (
                                                <div className="mb-2 -mx-1">
                                                    <img
                                                        src={msg.imageUrl}
                                                        alt="Hình ảnh"
                                                        className="max-w-full rounded-xl max-h-80 object-cover cursor-zoom-in hover:opacity-95 transition-opacity"
                                                        onClick={() => msg.imageUrl ? window.open(msg.imageUrl, '_blank') : undefined}
                                                    />
                                                </div>
                                            )}
                                            {/* Hiển thị nội dung text */}
                                            {msg.content && <p className="text-[13px] md:text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                                            <div className={`flex items-center gap-1 mt-1 ${msg.isMe ? "justify-end" : "justify-start"}`}>
                                                <p className={`text-[9px] font-medium uppercase tracking-wider ${msg.isMe ? "text-blue-100/80" : "text-[var(--muted-foreground)]"}`}>
                                                    {formatTime(msg.createdAt)}
                                                </p>
                                                {msg.isMe && (
                                                    <svg className="h-2.5 w-2.5 text-blue-200" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 md:p-4 border-t border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md">
                            <div className="flex gap-2 items-end max-w-4xl mx-auto">
                                {/* Nút gửi hình ảnh */}
                                <label className="p-2.5 md:p-3 rounded-2xl hover:bg-[var(--primary)]/10 cursor-pointer transition-all text-[var(--muted-foreground)] hover:text-[var(--primary)] bg-[var(--muted)]/50 flex-shrink-0 mb-0.5 shadow-sm">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage || !selectedAgentId}
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
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Nhập tin nhắn..."
                                        className="w-full px-4 py-3 max-h-32 rounded-2xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all resize-none overflow-hidden shadow-sm shadow-black/5"
                                    />
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={chatSending || !chatInput.trim()}
                                    className="p-3 md:px-6 bg-[var(--primary)] text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex-shrink-0 mb-0.5 shadow-sm"
                                >
                                    {chatSending ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <>
                                            <span className="hidden md:block">Gửi</span>
                                            <svg className="h-5 w-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[var(--muted-foreground)] p-8 text-center bg-dots-pattern opacity-60">
                        <div className="h-24 w-24 bg-[var(--muted)]/50 rounded-[40px] flex items-center justify-center mb-6 ring-1 ring-[var(--border)]">
                            <svg className="h-10 w-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Trung tâm tin nhắn</h3>
                        <p className="text-sm max-w-xs">Chọn một môi giới từ danh sách bên trái để bắt đầu trao đổi hoặc hỗ trợ.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
