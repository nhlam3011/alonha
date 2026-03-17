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

    // Fetch agents
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

    // Fetch conversations
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

    // Fetch messages when agent is selected
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

    // Polling mỗi 3s để nhận tin nhắn mới (realtime)
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

    // Upload hình ảnh
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

    // Xóa lịch sử trò chuyện
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

    // Get agent info from agents list or conversations
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

    return (
        <div className="flex bg-[var(--background)] h-[calc(100vh-120px)] overflow-hidden rounded-2xl border border-[var(--border)]">
            {/* Sidebar - Agent List */}
            <div className="w-80 border-r border-[var(--border)] flex flex-col">
                <div className="p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-bold text-[var(--foreground)]">Tin nhắn</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">Nhắn tin với môi giới</p>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-[var(--muted-foreground)]">Đang tải...</div>
                    ) : agents.length === 0 ? (
                        <div className="p-4 text-center text-[var(--muted-foreground)]">Chưa có môi giới nào</div>
                    ) : (
                        agents.map((agent) => {
                            const conv = conversations.find(c => c.agentId === agent.id);
                            const isSelected = selectedAgentId === agent.id;

                            return (
                                <button
                                    key={agent.id}
                                    onClick={() => setSelectedAgentId(agent.id)}
                                    className={`w-full p-4 flex items-start gap-3 hover:bg-[var(--muted)] transition-colors text-left ${isSelected ? "bg-[var(--muted)]" : ""
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold flex-shrink-0">
                                        {agent.avatar ? (
                                            <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            agent.name?.charAt(0)?.toUpperCase() || "?"
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-[var(--foreground)] truncate">{agent.name}</span>
                                            {conv && (
                                                <span className="text-xs text-[var(--muted-foreground)]">{formatDate(conv.lastMessageAt)}</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-[var(--muted-foreground)] truncate">{agent.email}</p>
                                        {conv && (
                                            <p className="text-xs text-[var(--muted-foreground)] truncate mt-1">{conv.lastMessage}</p>
                                        )}
                                    </div>
                                    {conv && conv.unreadCount > 0 && (
                                        <span className="w-5 h-5 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center flex-shrink-0">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedAgentId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
                            {(() => {
                                const agent = getAgentInfo(selectedAgentId);
                                return agent ? (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold">
                                            {agent.avatar ? (
                                                <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                agent.name?.charAt(0)?.toUpperCase() || "?"
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-[var(--foreground)]">{agent.name}</div>
                                            <div className="text-sm text-[var(--muted-foreground)]">{agent.email}</div>
                                        </div>
                                    </>
                                ) : null;
                            })()}
                            {chatMessages.length > 0 && (
                                <button
                                    onClick={handleClearHistory}
                                    className="ml-auto p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                                    title="Xóa lịch sử trò chuyện"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {chatLoading ? (
                                <div className="text-center text-[var(--muted-foreground)]">Đang tải tin nhắn...</div>
                            ) : chatMessages.length === 0 ? (
                                <div className="text-center text-[var(--muted-foreground)]">Chưa có tin nhắn nào</div>
                            ) : (
                                chatMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[70%] px-4 py-2 rounded-2xl ${msg.isMe
                                                ? "bg-[var(--primary)] text-white"
                                                : "bg-[var(--muted)] text-[var(--foreground)]"
                                                }`}
                                        >
                                            {/* Hiển thị hình ảnh nếu có */}
                                            {msg.imageUrl && (
                                                <div className="mb-2">
                                                    <img
                                                        src={msg.imageUrl}
                                                        alt="Hình ảnh"
                                                        className="max-w-full rounded-lg max-h-60 object-cover cursor-pointer"
                                                        onClick={() => msg.imageUrl ? window.open(msg.imageUrl, '_blank') : undefined}
                                                    />
                                                </div>
                                            )}
                                            {/* Hiển thị nội dung text */}
                                            {msg.content && <p>{msg.content}</p>}
                                            <p className={`text-xs mt-1 ${msg.isMe ? "text-white/70" : "text-[var(--muted-foreground)]"}`}>
                                                {formatTime(msg.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-[var(--border)]">
                            <div className="flex gap-2 items-center">
                                {/* Nút gửi hình ảnh */}
                                <label className="p-3 rounded-xl hover:bg-[var(--muted)] cursor-pointer transition-colors text-[var(--muted-foreground)] hover:text-[var(--primary)]">
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
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={chatSending || !chatInput.trim()}
                                    className="px-6 py-2 bg-[var(--primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {chatSending ? "..." : "Gửi"}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-[var(--muted-foreground)]">
                        Chọn một môi giới để nhắn tin
                    </div>
                )}
            </div>
        </div>
    );
}
