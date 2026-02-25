"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";

type UserRole = "USER" | "BROKER" | "ADMIN";

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatar: string | null;
  createdAt: string;
  isActive: boolean;
  isLocked: boolean;
};

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
};

const ROLE_CONFIG: Record<UserRole, { label: string; className: string }> = {
  USER: { label: "Người dùng", className: "badge" },
  BROKER: { label: "Môi giới", className: "badge-primary" },
  ADMIN: { label: "Quản trị viên", className: "badge-warning" },
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState<UserRow | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  async function loadUsers(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (keyword.trim()) params.set("keyword", keyword.trim());
      if (roleFilter !== "ALL") params.set("role", roleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`, { signal });
      const data = (await res.json().catch(() => ({}))) as { data?: UserRow[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Không thể tải danh sách người dùng.");
      setRows(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadUsers(controller.signal);
    return () => controller.abort();
  }, [keyword, roleFilter]);

  async function updateUserRole(id: string, newRole: UserRole) {
    const config = ROLE_CONFIG[newRole] || ROLE_CONFIG.USER;
    if (!confirm(`Đổi vai trò người dùng này sang ${config.label}?`)) return;
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role: newRole }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Không thể cập nhật vai trò.");
      setRows((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật thất bại.");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleLockUser(id: string, currentLock: boolean) {
    const action = currentLock ? "Mở khóa" : "Khóa";
    if (!confirm(`${action} tài khoản này?`)) return;
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isLocked: !currentLock }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || `Không thể ${action} tài khoản.`);
      setRows((prev) => prev.map((u) => (u.id === id ? { ...u, isLocked: !currentLock } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : `${action} thất bại.`);
    } finally {
      setSavingId(null);
    }
  }

  // --- Chat Logic ---
  async function openChat(user: UserRow) {
    setChatUser(user);
    setChatOpen(true);
    setLoadingChat(true);
    try {
      const res = await fetch(`/api/chat/messages?userId=${user.id}`);
      const data = (await res.json().catch(() => ({}))) as { data?: ChatMessage[] };
      if (res.ok && Array.isArray(data.data)) {
        setMessages(data.data);
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    } finally {
      setLoadingChat(false);
    }
  }

  async function sendMsg(e: React.FormEvent) {
    e.preventDefault();
    if (!chatUser || !msgInput.trim()) return;
    const content = msgInput.trim();
    const tempId = Date.now().toString();
    const newMsg: ChatMessage = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      senderId: session?.user?.id || "admin",
    };
    setMessages((prev) => [...prev, newMsg]);
    setMsgInput("");

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: chatUser.id, content }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Handle error quietly
    }
  }

  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatOpen]);

  // Derived Stats
  const total = rows.length;
  const brokers = rows.filter(r => r.role === "BROKER").length;
  const admins = rows.filter(r => r.role === "ADMIN").length;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Quản lý người dùng</h1>
          <p className="page-subtitle">
            Xem, chỉnh sửa vai trò và quản lý trạng thái tài khoản hệ thống.
          </p>
        </div>
        <div className="page-actions">
          <button
            onClick={() => loadUsers()}
            className="btn btn-outline btn-md"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid dashboard-grid-3">
        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Tổng người dùng</p>
              <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Môi giới</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{brokers}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Quản trị viên</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{admins}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-row">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              className="filter-input !pl-10"
            />
          </div>
          <div className="w-full sm:w-64">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "ALL" | UserRole)}
              className="filter-input cursor-pointer"
            >
              <option value="ALL">Tất cả vai trò</option>
              {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-container">
        {error && (
          <div className="px-4 sm:px-6 py-3 bg-rose-50 border-b border-rose-100 text-rose-600 dark:bg-rose-900/20 dark:border-rose-900/30 text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">Đang tải danh sách người dùng...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-state py-16">
            <div className="empty-state-icon">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="empty-state-title">Không tìm thấy người dùng</h3>
            <p className="empty-state-description">
              Không có kết quả nào phù hợp với tìm kiếm của bạn. Hãy thử thay đổi từ khóa hoặc bộ lọc.
            </p>
            <button
              onClick={() => { setKeyword(""); setRoleFilter("ALL"); }}
              className="mt-4 font-medium text-[var(--primary)] hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-[45%] text-left">Người dùng</th>
                  <th className="w-[15%]">Vai trò</th>
                  <th className="w-[15%]">Trạng thái</th>
                  <th className="w-[25%]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const roleConfig = ROLE_CONFIG[u.role] || ROLE_CONFIG.USER;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[var(--muted)] border border-[var(--border)]">
                            {u.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={u.avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[var(--muted-foreground)] font-bold text-sm bg-gradient-to-tr from-blue-500 to-violet-500 text-white uppercase">
                                {u.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-[var(--foreground)] truncate">{u.name}</span>
                            <span className="text-xs text-[var(--muted-foreground)] truncate">{u.email}</span>
                            {u.phone && <span className="text-xs text-[var(--muted-foreground)]">{u.phone}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={roleConfig.className}>
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="text-center">
                        {u.isLocked ? (
                          <span className="badge-destructive">
                            Đã khóa
                          </span>
                        ) : (
                          <span className="badge-success">
                            Hoạt động
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        <UserActionDropdown
                          user={u}
                          savingId={savingId}
                          onChat={openChat}
                          onUpdateRole={updateUserRole}
                          onToggleLock={toggleLockUser}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {chatOpen && chatUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="flex h-[600px] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-[var(--card)] shadow-2xl ring-1 ring-black/10">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] p-4 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--muted)] border border-[var(--border)]">
                    {chatUser.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={chatUser.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[var(--accent-foreground)] font-bold text-sm">
                        {chatUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-slate-800"></div>
                </div>
                <div>
                  <h3 className="font-bold text-[var(--foreground)] leading-none">{chatUser.name}</h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {(ROLE_CONFIG[chatUser.role] || ROLE_CONFIG.USER).label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                title="Đóng chat"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-[var(--background)] p-4 space-y-4 scroll-smooth">
              {loadingChat ? (
                <div className="flex justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                  <div className="h-16 w-16 bg-[var(--muted)] rounded-full flex items-center justify-center mb-3">
                    <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <p className="text-sm">Bắt đầu trò chuyện với {chatUser.name}</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMyMsg = m.senderId === session?.user?.id;
                  return (
                    <div key={m.id} className={`flex ${isMyMsg ? "justify-end" : "justify-start"}`}>
                      {!isMyMsg && (
                        <div className="mr-2 h-6 w-6 rounded-full bg-[var(--muted)] overflow-hidden shrink-0 self-end mb-1">
                          {chatUser.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={chatUser.avatar} className="h-full w-full object-cover" alt="" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[8px] font-bold">{chatUser.name.charAt(0)}</div>
                          )}
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMyMsg
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-bl-none"
                        }`}>
                        <p>{m.content}</p>
                        <p className={`mt-1 text-[10px] text-right ${isMyMsg ? "text-blue-100" : "text-[var(--muted-foreground)]"}`}>
                          {new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-[var(--border)] bg-[var(--card)] p-3 sm:p-4">
              <form onSubmit={sendMsg} className="flex gap-2 items-end">
                <textarea
                  autoFocus
                  rows={1}
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMsg(e);
                    }
                  }}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 max-h-32 resize-none rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all custom-scrollbar"
                />
                <button
                  type="submit"
                  disabled={!msgInput.trim()}
                  className="h-11 w-11 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  <svg className="h-5 w-5 transform rotate-90 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Action Dropdown (same pattern as listings page) ─── */
function UserActionDropdown({ user, savingId, onChat, onUpdateRole, onToggleLock }: {
  user: UserRow;
  savingId: string | null;
  onChat: (u: UserRow) => void;
  onUpdateRole: (id: string, role: UserRole) => void;
  onToggleLock: (id: string, locked: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const isBusy = savingId === user.id;

  return (
    <div ref={ref} className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChat(user)}
          className="hidden sm:inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] transition-colors shadow-sm"
        >
          Chat
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-all shadow-sm shadow-[var(--primary)]/20"
        >
          {isBusy ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <>
              Thao tác
              <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </>
          )}
        </button>
      </div>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl ring-1 ring-black/5 animate-fade-in-up">
          <div className="p-1">
            <div className="px-3 py-2 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider bg-[var(--muted)]/30">
              Đổi vai trò
            </div>
            {Object.keys(ROLE_CONFIG).map((role) => (
              role !== user.role && (
                <button
                  key={role}
                  type="button"
                  disabled={isBusy}
                  onClick={() => { setOpen(false); onUpdateRole(user.id, role as UserRole); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                >
                  <span className={`h-2 w-2 rounded-full ${role === 'ADMIN' ? 'bg-purple-500' : role === 'BROKER' ? 'bg-blue-500' : 'bg-slate-500'}`}></span>
                  Thành {ROLE_CONFIG[role as UserRole].label}
                </button>
              )
            ))}
            <div className="my-1 h-px bg-[var(--border)]" />
            <button
              type="button"
              disabled={isBusy}
              onClick={() => { setOpen(false); onToggleLock(user.id, user.isLocked); }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors ${user.isLocked ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"}`}
            >
              {user.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
            </button>
            <div className="my-1 h-px bg-[var(--border)]" />
            <button
              type="button"
              onClick={() => { setOpen(false); onChat(user); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] sm:hidden transition-colors"
            >
              Nhắn tin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
