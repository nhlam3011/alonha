"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

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

export function DashboardLeads({ initialLeads, listings }: { initialLeads: LeadRow[]; listings: ListingOption[] }) {
    const [leads, setLeads] = useState<LeadRow[]>(initialLeads);
    const [search, setSearch] = useState("");
    const [showAddLead, setShowAddLead] = useState(false);
    const [form, setForm] = useState<NewLeadForm>(INITIAL_LEAD_FORM);
    const [savingNewLead, setSavingNewLead] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    return (
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
                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

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
    );
}
