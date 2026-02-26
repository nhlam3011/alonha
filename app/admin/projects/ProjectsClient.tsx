"use client";

import { useEffect, useState } from "react";
import React from "react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

export type ProjectRow = {
    id: string; name: string; slug: string; description: string | null;
    address: string | null; developer: string | null; totalArea: number | null;
    imageUrl: string | null; isActive: boolean; createdAt: string; updatedAt: string; listingCount: number;
    provinceCode: string | null; provinceName: string | null;
    districtCode: string | null; districtName: string | null;
    wardCode: string | null; wardName: string | null;
};

export type ProjectForm = {
    id: string | null; name: string; slug: string; address: string;
    developer: string; totalArea: string; imageUrl: string; description: string; isActive: boolean;
    provinceCode: string; provinceName: string;
    districtCode: string; districtName: string;
    wardCode: string; wardName: string;
};

const INITIAL: ProjectForm = {
    id: null, name: "", slug: "", address: "", developer: "", totalArea: "", imageUrl: "", description: "", isActive: true,
    provinceCode: "", provinceName: "", districtCode: "", districtName: "", wardCode: "", wardName: ""
};

function toForm(p: ProjectRow): ProjectForm {
    return {
        id: p.id, name: p.name, slug: p.slug, address: p.address || "", developer: p.developer || "",
        totalArea: p.totalArea != null ? String(p.totalArea) : "", imageUrl: p.imageUrl || "", description: p.description || "", isActive: p.isActive,
        provinceCode: p.provinceCode || "", provinceName: p.provinceName || "",
        districtCode: p.districtCode || "", districtName: p.districtName || "",
        wardCode: p.wardCode || "", wardName: p.wardName || ""
    };
}

export function ProjectsClient({ initialProjects }: { initialProjects: ProjectRow[] }) {
    const [rows, setRows] = useState<ProjectRow[]>(initialProjects);
    const [form, setForm] = useState<ProjectForm>(INITIAL);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Location State
    const [provinces, setProvinces] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);

    // Load Provinces
    useEffect(() => {
        fetch("/api/provinces").then(r => r.json()).then(data => Array.isArray(data) && setProvinces(data)).catch(() => { });
    }, []);

    // Load Wards when Province changes
    useEffect(() => {
        if (!form.provinceCode) { setWards([]); return; }
        fetch(`/api/wards?provinceCode=${form.provinceCode}`)
            .then(r => r.json())
            .then(d => setWards(Array.isArray(d) ? d : []))
            .catch(() => setWards([]));
    }, [form.provinceCode]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault(); setSaving(true); setError(null);
        try {
            const payload = {
                ...(form.id ? { id: form.id } : {}),
                name: form.name, slug: form.slug || undefined, address: form.address || null,
                developer: form.developer || null, totalArea: form.totalArea ? Number(form.totalArea) : null,
                imageUrl: form.imageUrl || null, description: form.description || null, isActive: form.isActive,
                provinceCode: form.provinceCode || null, provinceName: form.provinceName || null,
                districtCode: form.districtCode || null, districtName: form.districtName || null,
                wardCode: form.wardCode || null, wardName: form.wardName || null,
            };
            const res = await fetch("/api/admin/projects", { method: form.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.data) throw new Error(data.error || "Lỗi lưu.");
            if (form.id) setRows(p => p.map(i => i.id === form.id ? data.data! : i));
            else setRows(p => [data.data!, ...p]);
            setForm(INITIAL);
        } catch (err: any) { setError(err?.message || "Lỗi."); }
        finally { setSaving(false); }
    }

    async function handleDelete(id: string) {
        if (!confirm("Xóa dự án này?")) return;
        setSaving(true); setError(null);
        try {
            const res = await fetch("/api/admin/projects", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Lỗi xóa.");
            setRows(p => p.filter(i => i.id !== id));
            if (form.id === id) setForm(INITIAL);
        } catch (err: any) { setError(err?.message || "Lỗi."); }
        finally { setSaving(false); }
    }

    const inp = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

    return (
        <>
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 mb-6">{error}</div>}

            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                {/* Form */}
                <div className="card-container overflow-hidden h-fit">
                    <div className="border-b border-[var(--border)] px-5 py-3.5 bg-[var(--muted)]/30">
                        <h2 className="font-semibold text-[var(--foreground)]">{form.id ? "Cập nhật" : "Thêm dự án mới"}</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Tên dự án *</label>
                            <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Vinhomes Central Park" className={inp} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Slug URL</label>
                            <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="vinhomes-central-park" className={inp} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Tỉnh / Thành</label>
                                <SearchableSelect
                                    options={provinces.map(pr => ({ value: String(pr.code), label: pr.name }))}
                                    value={form.provinceCode}
                                    onChange={(val) => {
                                        const name = provinces.find(pr => String(pr.code) === val)?.name || "";
                                        setForm(p => ({ ...p, provinceCode: val, provinceName: name, wardCode: "", wardName: "" }));
                                    }}
                                    placeholder="-- Chọn --"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Phường / Xã</label>
                                <SearchableSelect
                                    options={wards.map(w => ({ value: String(w.code), label: w.name }))}
                                    value={form.wardCode}
                                    onChange={(val) => {
                                        const name = wards.find(w => String(w.code) === val)?.name || "";
                                        setForm(p => ({ ...p, wardCode: val, wardName: name }));
                                    }}
                                    placeholder="-- Chọn --"
                                    disabled={!form.provinceCode}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Địa chỉ chi tiết</label>
                            <textarea rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className={inp} />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Hình ảnh URL</label>
                            <input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://..." className={inp} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Diện tích (ha)</label>
                                <input type="number" min={0} step="0.01" value={form.totalArea} onChange={e => setForm(p => ({ ...p, totalArea: e.target.value }))} className={inp} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Chủ đầu tư</label>
                                <input value={form.developer} onChange={e => setForm(p => ({ ...p, developer: e.target.value }))} className={inp} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Mô tả</label>
                            <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inp} />
                        </div>
                        <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] cursor-pointer">
                            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 rounded text-blue-600" />
                            <span className="text-sm font-medium text-[var(--foreground)]">Kích hoạt</span>
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
                        <h2 className="font-semibold text-[var(--foreground)]">Danh sách ({rows.length})</h2>
                    </div>
                    {rows.length === 0 ? (
                        <div className="p-12 text-center text-[var(--muted-foreground)]">Chưa có dự án nào.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Dự án</th>
                                        <th>Thông tin</th>
                                        <th className="text-center">TT</th>
                                        <th className="text-right w-20" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(p => (
                                        <tr key={p.id}>
                                            <td>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[var(--muted)] border border-[var(--border)]">
                                                        {p.imageUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-[var(--muted-foreground)]">
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-[var(--foreground)] truncate max-w-[160px]">{p.name}</p>
                                                        <p className="text-[11px] text-[var(--muted-foreground)] truncate">/{p.slug}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-xs text-[var(--muted-foreground)]">
                                                {p.provinceName && <p className="text-blue-600 dark:text-blue-400 font-medium">{p.provinceName}</p>}
                                                <p className="truncate max-w-[150px]">{p.address || "—"}</p>
                                            </td>
                                            <td className="text-center">
                                                <span className={p.isActive ? "badge-success" : "badge"}>
                                                    {p.isActive ? "ON" : "OFF"}
                                                </span>
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
