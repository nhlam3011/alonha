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

    // Fetch messages when agent is selected
    useEffect(() => {
        if (!selectedAgentId) {
            setChatMessages([]);
            return;
        }

        setChatLoading(true);
        fetch(`/api/chat/messages?userId=${selectedAgentId}`)
            .then((r) => r.json())
            .then((res) => {
                if (Array.isArray(res.data)) {
                    setChatMessages(res.data);
                }
                setChatLoading(false);

                // Scroll to bottom
                setTimeout(() => {
                    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
            })
            .catch(() => setChatLoading(false));
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
        <div className="h-[calc(100vh-64px)] flex bg-[var(--background)]">
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
                                            <p>{msg.content}</p>
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
                            <div className="flex gap-2">
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
