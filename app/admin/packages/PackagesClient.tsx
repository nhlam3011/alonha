"use client";

import React, { useState } from "react";

export type PackageRow = {
    id: string;
    code: string;
    name: string;
    description: string | null;
    price: number;
    durationDays: number | null;
    isActive: boolean;
    sortOrder: number;
    usageCount: number;
};

type PackageForm = {
    id: string | null;
    code: string;
    name: string;
    description: string;
    price: string;
    durationDays: string;
    sortOrder: string;
    isActive: boolean;
};

const INITIAL: PackageForm = {
    id: null, code: "", name: "", description: "",
    price: "", durationDays: "", sortOrder: "0", isActive: true,
};

function toForm(i: PackageRow): PackageForm {
    return {
        id: i.id, code: i.code, name: i.name,
        description: i.description || "",
        price: String(i.price),
        durationDays: i.durationDays != null ? String(i.durationDays) : "",
        sortOrder: String(i.sortOrder),
        isActive: i.isActive,
    };
}

export function PackagesClient({ initialRows }: { initialRows: PackageRow[] }) {
    const [rows, setRows] = useState<PackageRow[]>(initialRows);
    const [form, setForm] = useState<PackageForm>(INITIAL);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const inp = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault(); setSaving(true); setError(null);
        try {
            const payload = {
                ...(form.id ? { id: form.id } : {}),
                code: form.code || undefined,
                name: form.name,
                description: form.description || null,
                price: Number(form.price),
                durationDays: form.durationDays ? Number(form.durationDays) : null,
                sortOrder: Number(form.sortOrder || 0),
                isActive: form.isActive,
            };
            const res = await fetch("/api/admin/packages", {
                method: form.id ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.data) throw new Error(data.error || "Lỗi lưu.");
            if (form.id) setRows(p => p.map(i => i.id === form.id ? data.data! : i));
            else setRows(p => [...p, data.data!].sort((a, b) => a.sortOrder - b.sortOrder));
            setForm(INITIAL);
        } catch (err: any) { setError(err?.message); }
        finally { setSaving(false); }
    }

    async function handleDelete(id: string) {
        if (!confirm("Xóa gói này?")) return;
        setSaving(true); setError(null);
        try {
            const res = await fetch("/api/admin/packages", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Lỗi xóa.");
            setRows(p => p.filter(i => i.id !== id));
            if (form.id === id) setForm(INITIAL);
        } catch (err: any) { setError(err?.message); }
        finally { setSaving(false); }
    }

    async function toggleActive(item: PackageRow) {
        setSaving(true); setError(null);
        try {
            const res = await fetch("/api/admin/packages", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.data) throw new Error(data.error || "Lỗi.");
            setRows(p => p.map(r => r.id === item.id ? data.data! : r));
            if (form.id === item.id) setForm(p => ({ ...p, isActive: !item.isActive }));
        } catch (err: any) { setError(err?.message); }
        finally { setSaving(false); }
    }

    return (
        <>
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                {/* Form */}
                <div className="card-container overflow-hidden h-fit">
                    <div className="border-b border-[var(--border)] px-5 py-3.5 bg-[var(--muted)]/30">
                        <h2 className="font-semibold text-[var(--foreground)]">{form.id ? "Cập nhật gói" : "Tạo gói mới"}</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Tên gói *</label>
                            <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="VIP Kim Cương" className={inp} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Mã gói</label>
                            <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="vip_diamond" className={inp} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Giá (VNĐ) *</label>
                                <input required type="number" min={0} value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className={inp} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Thời hạn (ngày)</label>
                                <input type="number" min={1} value={form.durationDays} onChange={e => setForm(p => ({ ...p, durationDays: e.target.value }))} placeholder="Vĩnh viễn" className={inp} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Thứ tự</label>
                            <input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: e.target.value }))} className={inp} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Mô tả</label>
                            <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inp} />
                        </div>
                        <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] cursor-pointer">
                            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 rounded text-blue-600" />
                            <span className="text-sm font-medium text-[var(--foreground)]">Kích hoạt (cho phép mua)</span>
                        </label>
                        <div className="flex gap-2 pt-1">
                            <button type="submit" disabled={saving} className="btn btn-primary btn-md flex-1">
                                {saving ? "Đang lưu..." : form.id ? "Cập nhật" : "Tạo mới"}
                            </button>
                            {form.id && <button type="button" onClick={() => setForm(INITIAL)} className="btn btn-outline btn-md">Hủy</button>}
                        </div>
                    </form>
                </div>

                {/* Table */}
                <div className="card-container overflow-hidden h-fit">
                    <div className="border-b border-[var(--border)] px-5 py-3.5 bg-[var(--muted)]/30">
                        <h2 className="font-semibold text-[var(--foreground)]">Danh sách gói dịch vụ</h2>
                    </div>
                    {rows.length === 0 ? (
                        <div className="p-12 text-center text-[var(--muted-foreground)]">Chưa có gói nào.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Gói</th>
                                        <th>Giá &amp; Hạn</th>
                                        <th className="text-center">TT</th>
                                        <th className="text-right w-20" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(p => (
                                        <tr key={p.id}>
                                            <td>
                                                <p className="font-semibold text-[var(--foreground)]">{p.name}</p>
                                                <p className="text-[11px] text-[var(--muted-foreground)] font-mono">{p.code}</p>
                                            </td>
                                            <td>
                                                <p className="font-bold text-blue-600">{p.price.toLocaleString("vi-VN")} đ</p>
                                                <p className="text-[11px] text-[var(--muted-foreground)]">{p.durationDays ? `${p.durationDays} ngày` : "Vĩnh viễn"}</p>
                                            </td>
                                            <td className="text-center">
                                                <button onClick={() => toggleActive(p)} disabled={saving} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p.isActive ? "bg-emerald-500" : "bg-gray-300"}`}>
                                                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${p.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                                                </button>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => setForm(toForm(p))} className="btn btn-ghost btn-icon" title="Sửa">
                                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button onClick={() => handleDelete(p.id)} className="btn btn-ghost btn-icon text-rose-600 hover:bg-rose-50" title="Xóa">
                                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
