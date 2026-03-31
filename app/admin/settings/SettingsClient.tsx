"use client";

import { useState } from "react";
import React from "react";

export type ConfigType = "string" | "json" | "number";
export type ConfigItem = { id: string; key: string; value: string | null; type: ConfigType };
type ConfigForm = { key: string; value: string; type: ConfigType };

const INITIAL: ConfigForm = { key: "", value: "", type: "string" };

export function SettingsClient({ initialConfigs }: { initialConfigs: ConfigItem[] }) {
    const [rows, setRows] = useState<ConfigItem[]>(initialConfigs);
    const [form, setForm] = useState<ConfigForm>(INITIAL);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function saveConfig(e: React.FormEvent) {
        e.preventDefault(); setSaving(true); setError(null);
        try {
            const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: form.key, value: form.value || null, type: form.type }) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.data) throw new Error(data.error || "Lỗi lưu.");
            setRows(prev => {
                const found = prev.find(i => i.key === data.data!.key);
                if (!found) return [...prev, data.data!].sort((a, b) => a.key.localeCompare(b.key));
                return prev.map(i => i.key === data.data!.key ? data.data! : i);
            });
            setForm(INITIAL);
        } catch (err: any) { setError(err?.message); }
        finally { setSaving(false); }
    }

    async function removeConfig(key: string) {
        if (!confirm(`Xóa "${key}"?`)) return;
        setSaving(true); setError(null);
        try {
            const res = await fetch("/api/admin/settings", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
            if (!res.ok) throw new Error("Lỗi xóa.");
            setRows(p => p.filter(i => i.key !== key));
            if (form.key === key) setForm(INITIAL);
        } catch (err: any) { setError(err?.message); }
        finally { setSaving(false); }
    }

    const SUGGESTED_KEYS = [
        { key: "hero_background", label: "Ảnh nền Hero (Trang chủ)", type: "string" as ConfigType },
        { key: "register_background", label: "Ảnh nền trang Đăng ký", type: "string" as ConfigType },
        { key: "login_background", label: "Ảnh nền trang Đăng nhập", type: "string" as ConfigType },
        { key: "site_title", label: "Tiêu đề trang web", type: "string" as ConfigType },
        { key: "site_logo_light", label: "Link Logo trang web (Chế độ sáng)", type: "string" as ConfigType },
        { key: "site_logo_dark", label: "Link Logo trang web (Chế độ tối)", type: "string" as ConfigType },
        { key: "support_phone", label: "Số điện thoại hỗ trợ", type: "string" as ConfigType },
        { key: "footer_text", label: "Văn bản dưới chân trang", type: "string" as ConfigType },
        { key: "social_facebook", label: "Link Facebook", type: "string" as ConfigType },
        { key: "social_instagram", label: "Link Instagram", type: "string" as ConfigType },
        { key: "social_tiktok", label: "Link Tiktok", type: "string" as ConfigType },
        { key: "social_youtube", label: "Link Youtube", type: "string" as ConfigType },
    ];

    const inp = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

    return (
        <>
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 mb-6">{error}</div>}

            <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
                {/* Form & Config Selection */}
                <div className="space-y-6 h-fit">
                    {/* Quick Selection Dropdown */}
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
                        <div className="border-b border-[var(--border)] px-5 py-3.5 bg-[var(--muted)]/20">
                            <h2 className="font-semibold text-[var(--foreground)] text-sm flex items-center gap-2">
                                <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                Chọn tham số cấu hình
                            </h2>
                        </div>
                        <div className="p-5">
                            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Khóa có sẵn trong mã nguồn</label>
                            <select
                                className={`${inp} cursor-pointer`}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) return;
                                    const suggest = SUGGESTED_KEYS.find(s => s.key === val);
                                    const existing = rows.find(r => r.key === val);
                                    setForm({
                                        key: val,
                                        value: existing?.value || "",
                                        type: existing?.type || suggest?.type || "string"
                                    });
                                }}
                                value={SUGGESTED_KEYS.some(s => s.key === form.key) ? form.key : ""}
                            >
                                <option value="">-- Chọn một khóa để cấu hình --</option>
                                {SUGGESTED_KEYS.map(s => (
                                    <option key={s.key} value={s.key}>
                                        {s.label} ({s.key})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
                        <div className="border-b border-[var(--border)] px-5 py-3.5 flex items-center justify-between">
                            <h2 className="font-semibold text-[var(--foreground)]">{form.key ? "Chi tiết cấu hình" : "Thêm cấu hình mới"}</h2>
                            {form.key && <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full dark:bg-blue-900/40 dark:text-blue-300">Đang chọn: {form.key}</span>}
                        </div>
                        <form onSubmit={saveConfig} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-[var(--foreground)] mb-1.5 flex items-center gap-1.5">
                                    Key (Khóa định danh)
                                </label>
                                <input required value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value }))} placeholder="site_title..." className={`${inp} font-mono`} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-1.5 flex items-center gap-1.5">
                                        Loại dữ liệu
                                    </label>
                                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as ConfigType }))} className={inp}>
                                        <option value="string">String (Văn bản/URL)</option>
                                        <option value="number">Number (Số)</option>
                                        <option value="json">JSON (Cấu trúc phức tạp)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[var(--foreground)] mb-1.5 flex items-center gap-1.5">
                                    Giá trị cấu hình
                                </label>
                                <textarea rows={6} value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder={form.type === "json" ? '{"key": "value"}' : "Nhập giá trị tại đây..."} className={`${inp} font-mono text-xs`} />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all active:scale-[0.98]">
                                    {saving ? "Đang xử lý..." : form.key && rows.find(r => r.key === form.key) ? "Cập nhật ngay" : "Lưu cấu hình"}
                                </button>
                                <button type="button" onClick={() => setForm(INITIAL)} className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-medium hover:bg-[var(--muted)] transition-colors">Hủy</button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden h-fit">
                    <div className="border-b border-[var(--border)] px-5 py-3.5">
                        <h2 className="font-semibold text-[var(--foreground)]">Danh sách cấu hình</h2>
                    </div>
                    {rows.length === 0 ? (
                        <div className="p-12 text-center text-[var(--muted-foreground)]">Chưa có cấu hình.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[500px] text-sm text-left">
                                <thead>
                                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                                        <th className="px-4 py-3 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wider">Key</th>
                                        <th className="px-4 py-3 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wider w-16">Type</th>
                                        <th className="px-4 py-3 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wider">Value</th>
                                        <th className="px-4 py-3 w-20" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {rows.map(item => (
                                        <tr key={item.key} className="hover:bg-[var(--muted)]/20 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-sm text-blue-600 dark:text-blue-400">{item.key}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex rounded bg-[var(--muted)] px-1.5 py-0.5 text-[11px] font-mono text-[var(--muted-foreground)]">{item.type}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="max-w-[250px] truncate font-mono text-xs text-[var(--muted-foreground)] bg-[var(--background)] p-1.5 rounded border border-[var(--border)]">{item.value || "null"}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => setForm({ key: item.key, value: item.value || "", type: item.type })} className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]" title="Sửa">
                                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button onClick={() => removeConfig(item.key)} className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20" title="Xóa">
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
