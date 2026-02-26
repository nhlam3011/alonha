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

    const inp = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

    return (
        <>
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 mb-6">{error}</div>}

            <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
                {/* Form */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden h-fit">
                    <div className="border-b border-[var(--border)] px-5 py-3.5">
                        <h2 className="font-semibold text-[var(--foreground)]">{form.key ? "Cập nhật" : "Thêm cấu hình"}</h2>
                    </div>
                    <form onSubmit={saveConfig} className="p-5 space-y-3.5">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Key (Khóa)</label>
                            <input required value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value }))} placeholder="site.title" className={`${inp} font-mono`} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Loại dữ liệu</label>
                            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as ConfigType }))} className={inp}>
                                <option value="string">String</option>
                                <option value="number">Number</option>
                                <option value="json">JSON</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Giá trị</label>
                            <textarea rows={6} value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder={form.type === "json" ? '{"key": "value"}' : "Nhập giá trị..."} className={`${inp} font-mono`} />
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                {saving ? "Đang lưu..." : "Lưu cấu hình"}
                            </button>
                            <button type="button" onClick={() => setForm(INITIAL)} className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--muted)]">Hủy</button>
                        </div>
                    </form>
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
