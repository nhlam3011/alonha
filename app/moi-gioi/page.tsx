"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardChart } from "@/components/dashboard/DashboardChart";

type DashboardData = {
  balance: number;
  activeListingsCount: number;
  totalViewCount: number;
  newLeadsCount: number;
};

type LeadRow = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  source: string;
  isRead: boolean;
  status: string;
  createdAt: string;
  listingTitle?: string;
  listingSlug?: string;
};

type ListingOption = {
  id: string;
  title: string;
};

type NewLeadForm = {
  listingId: string;
  name: string;
  phone: string;
  email: string;
  message: string;
};

const INITIAL_LEAD_FORM: NewLeadForm = {
  listingId: "",
  name: "",
  phone: "",
  email: "",
  message: "",
};

function formatMoney(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} tỷ`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} tr`;
  return n.toLocaleString("vi-VN");
}

export default function AgentDashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [search, setSearch] = useState("");
  const [showAddLead, setShowAddLead] = useState(false);
  const [form, setForm] = useState<NewLeadForm>(INITIAL_LEAD_FORM);
  const [loading, setLoading] = useState(true);
  const [savingNewLead, setSavingNewLead] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    loadDashboard(controller.signal);
    return () => controller.abort();
  }, [status]);

  async function loadDashboard(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, leadsRes, listingsRes] = await Promise.all([
        fetch("/api/moi-gioi/dashboard", { signal }),
        fetch("/api/moi-gioi/leads", { signal }),
        fetch("/api/moi-gioi/listings", { signal }),
      ]);

      const statsJson = (await statsRes.json().catch(() => ({})));
      const leadsJson = (await leadsRes.json().catch(() => ({})));
      const listingsJson = (await listingsRes.json().catch(() => ({})));

      if (!statsRes.ok) throw new Error(statsJson.error || "Không thể tải số liệu tổng quan.");
      if (!leadsRes.ok) throw new Error(leadsJson.error || "Không thể tải danh sách khách hàng.");
      if (!listingsRes.ok) throw new Error(listingsJson.error || "Không thể tải danh sách tin.");

      setStats(statsJson);
      setLeads(Array.isArray(leadsJson.data) ? leadsJson.data : []);
      setListings(
        Array.isArray(listingsJson.data)
          ? listingsJson.data.map((item: any) => ({ id: item.id, title: item.title }))
          : []
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.listingTitle || "").toLowerCase().includes(q)
    );
  }, [leads, search]);

  const nowLabel = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const viewChartData = useMemo(() => {
    const total = stats?.totalViewCount || 0;
    // Mock distribution for demo
    return [
      { label: "T2", value: Math.floor(total * 0.1) },
      { label: "T3", value: Math.floor(total * 0.12) },
      { label: "T4", value: Math.floor(total * 0.15) },
      { label: "T5", value: Math.floor(total * 0.18) },
      { label: "T6", value: Math.floor(total * 0.2) },
      { label: "T7", value: Math.floor(total * 0.15) },
      { label: "CN", value: Math.floor(total * 0.1) },
    ];
  }, [stats?.totalViewCount]);

  async function createLead(e: React.FormEvent) {
    e.preventDefault();
    setSavingNewLead(true);
    setError(null);
    try {
      const res = await fetch("/api/moi-gioi/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({})));
      if (!res.ok || !data.data) throw new Error(data.error || "Không thể tạo khách hàng.");
      setLeads((prev) => [data.data, ...prev]);
      setForm(INITIAL_LEAD_FORM);
      setShowAddLead(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo khách hàng.");
    } finally {
      setSavingNewLead(false);
    }
  }

  async function toggleLeadRead(lead: LeadRow) {
    const newStatus = !lead.isRead;
    try {
      // Optimistic update
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, isRead: newStatus } : l));

      await fetch(`/api/moi-gioi/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: newStatus }),
      });
    } catch (err) {
      // Revert on error
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, isRead: !newStatus } : l));
    }
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
          <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)]">Yêu cầu đăng nhập</h2>
        <p className="mt-2 text-[var(--muted-foreground)]">Vui lòng đăng nhập tài khoản môi giới để truy cập.</p>
        <Link href="/dang-nhap" className="mt-6 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <p className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider">{nowLabel}</p>
          <h1 className="page-title">Bảng điều khiển</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dang-tin"
            className="btn btn-primary btn-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span>Đăng tin mới</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStats
          label="Tin đang hiển thị"
          value={stats?.activeListingsCount ?? 0}
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          color="blue"
          href="/moi-gioi/tin-dang"
          className="hover:shadow-blue-500/10"
        />
        <DashboardStats
          label="Khách quan tâm (7 ngày)"
          value={stats?.newLeadsCount ?? 0}
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          color="emerald"
          trend={{ value: 12, label: "so với tuần trước", positive: true }}
          className="hover:shadow-green-500/10"
        />
        <DashboardStats
          label="Lượt xem tin"
          value={stats?.totalViewCount ?? 0}
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
          color="indigo"
          className="hover:shadow-indigo-500/10"
        />
        <DashboardStats
          label="Số dư ví"
          value={`${stats ? formatMoney(stats.balance) : "0"} đ`}
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
          color="amber"
          href="/moi-gioi/vi"
          className="hover:shadow-amber-500/10"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Chart & Quick Actions */}
        <div className="space-y-6 lg:col-span-2">
          <DashboardChart
            title="Thống kê lượt xem tuần qua"
            data={viewChartData}
            type="bar"
            height={300}
            color="var(--primary)"
            valueSuffix=" lượt"
          />

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-[var(--foreground)]">Truy cập nhanh</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { href: "/moi-gioi/tin-dang", label: "Quản lý tin", icon: "Document", color: "blue" },
                { href: "/moi-gioi/lich-hen", label: "Lịch hẹn", icon: "Calendar", color: "indigo" },
                { href: "/moi-gioi/tin-nhan", label: "Tin nhắn", icon: "Chat", color: "violet" },
                { href: "/moi-gioi/vi", label: "Nạp tiền", icon: "Cash", color: "emerald" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-[var(--border)] p-4 text-center transition-all hover:bg-[var(--muted)] hover:border-[var(--primary)]/30 hover:-translate-y-1"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-${item.color}-100 dark:bg-${item.color}-900/30 text-${item.color}-600 group-hover:scale-110 transition-transform`}>
                    {/* Simple placeholder icons based on name logic or generic svg */}
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <span className="text-sm font-semibold text-[var(--foreground)]">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: CRM / Leads */}
        <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm lg:col-span-1 h-fit">
          <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
            <div>
              <h3 className="font-bold text-[var(--foreground)]">Khách hàng mới</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Quản lý lead từ tin đăng</p>
            </div>
            <button
              onClick={() => setShowAddLead(!showAddLead)}
              className="rounded-lg bg-[var(--muted)] p-2 text-[var(--foreground)] hover:bg-[var(--primary)] hover:text-white transition-colors"
              title="Thêm khách hàng thủ công"
            >
              <svg className={`h-5 w-5 transition-transform ${showAddLead ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          <div className="p-4">
            {showAddLead ? (
              <form onSubmit={createLead} className="space-y-4 animate-in slide-in-from-top-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--muted-foreground)]">Tin đăng quan tâm</label>
                  <select
                    required
                    value={form.listingId}
                    onChange={(e) => setForm((prev) => ({ ...prev, listingId: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition-all"
                  >
                    <option value="">-- Chọn tin đăng --</option>
                    {listings.map((item) => (
                      <option key={item.id} value={item.id}>{item.title}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--muted-foreground)]">Họ tên</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition-all"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--muted-foreground)]">Số điện thoại</label>
                    <input
                      required
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--muted-foreground)]">Ghi chú</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition-all"
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingNewLead}
                  className="w-full rounded-xl bg-[var(--primary)] py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {savingNewLead ? "Đang lưu..." : "Lưu thông tin"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <svg className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input
                    type="text"
                    placeholder="Tìm kiếm khách hàng..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition-all"
                  />
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="mb-2 rounded-full bg-[var(--muted)] p-3 cursor-pointer hover:bg-[var(--muted)]/80" onClick={() => setShowAddLead(true)}>
                        <svg className="h-6 w-6 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)]">Chưa có khách hàng nào</p>
                    </div>
                  ) : (
                    filteredLeads.map((l) => (
                      <div key={l.id} className={`group relative rounded-xl border p-3 transition-all hover:shadow-md ${l.isRead ? 'card-container' : 'border-blue-200 bg-blue-50'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-sm text-[var(--foreground)] line-clamp-1">{l.name}</p>
                          <span className="text-[10px] text-[var(--muted-foreground)] whitespace-nowrap ml-2">
                            {new Date(l.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mb-2">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          {l.phone}
                        </div>
                        {l.listingTitle && (
                          <div className="flex items-start gap-1.5 text-[11px] text-blue-600 bg-blue-100 p-1.5 rounded-lg mb-2">
                            <svg className="h-3 w-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            <span className="line-clamp-2 leading-tight">{l.listingTitle}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <a
                            href={`tel:${l.phone}`}
                            className="flex items-center justify-center h-7 w-7 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                            title="Gọi điện"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          </a>
                          <button
                            onClick={() => toggleLeadRead(l)}
                            className={`text-[10px] font-medium px-2 py-1.5 rounded-lg border transition-colors ${l.isRead ? 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]' : 'border-blue-200 bg-white text-blue-600 hover:bg-blue-50'}`}
                          >
                            {l.isRead ? 'Đã xử lý' : 'Đánh dấu đã xem'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
