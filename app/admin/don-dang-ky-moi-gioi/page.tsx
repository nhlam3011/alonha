"use client";

import { useEffect, useState } from "react";

type Application = {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    idCardNumber: string;
    dateOfBirth: string | null;
    address: string;
    currentAddress: string | null;
    education: string | null;
    experience: string | null;
    currentJob: string | null;
    referralSource: string | null;
    selfIntro: string | null;
    agreedTerms: boolean;
    status: string;
    adminNote: string | null;
    interviewDate: string | null;
    interviewLocation: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string;
        email: string | null;
        avatar: string | null;
        role: string;
        phone: string | null;
        createdAt: string;
        lastLoginAt: string | null;
    };
};

const STATUS_MAP: Record<string, { label: string; class: string }> = {
    PENDING: { label: "Chờ duyệt", class: "badge-warning" },
    REVIEWING: { label: "Đang xem xét", class: "badge-primary" },
    INTERVIEW: { label: "Hẹn phỏng vấn", class: "badge" },
    APPROVED: { label: "Đã duyệt", class: "badge-success" },
    REJECTED: { label: "Từ chối", class: "badge-destructive" },
};

export default function AdminAgentApplicationsPage() {
    const [apps, setApps] = useState<Application[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Application | null>(null);
    const [processing, setProcessing] = useState(false);
    const [adminNote, setAdminNote] = useState("");
    const [interviewDate, setInterviewDate] = useState("");
    const [interviewLocation, setInterviewLocation] = useState("");
    const [message, setMessage] = useState("");

    async function fetchApps() {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page) });
        if (filterStatus) params.set("status", filterStatus);
        const res = await fetch(`/api/admin/agent-applications?${params}`);
        const data = await res.json();
        setApps(data.data || []);
        setTotal(data.total || 0);
        setLoading(false);
    }

    useEffect(() => { fetchApps(); }, [page, filterStatus]);

    async function handleAction(action: string) {
        if (!selected) return;

        const confirmMsg: Record<string, string> = {
            approve: "Xác nhận DUYỆT ứng viên này và cấp quyền Môi giới?",
            reject: "Xác nhận TỪ CHỐI đơn đăng ký này?",
            interview: "Xác nhận đặt LỊCH HẸN phỏng vấn?",
        };
        if (confirmMsg[action] && !window.confirm(confirmMsg[action])) return;

        setProcessing(true);
        setMessage("");
        try {
            const res = await fetch("/api/admin/agent-applications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicationId: selected.id,
                    action,
                    adminNote: adminNote || undefined,
                    interviewDate: interviewDate || undefined,
                    interviewLocation: interviewLocation || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage(data.message || "Cập nhật thành công!");
            setSelected(null);
            fetchApps();
        } catch (e: any) {
            setMessage(`Lỗi: ${e.message}`);
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-content">
                    <h1 className="page-title">Đơn đăng ký Môi giới</h1>
                    <p className="page-subtitle">Xem xét hồ sơ, hẹn phỏng vấn và duyệt ứng viên môi giới.</p>
                </div>
            </div>

            {message && (
                <div className={`rounded-xl border p-3 text-sm mb-4 ${message.startsWith("Lỗi") ? "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"}`}>
                    {message}
                </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
                {["", "PENDING", "REVIEWING", "INTERVIEW", "APPROVED", "REJECTED"].map(s => (
                    <button
                        key={s}
                        onClick={() => { setFilterStatus(s); setPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === s ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
                    >
                        {s ? STATUS_MAP[s]?.label || s : "Tất cả"}
                    </button>
                ))}
                <span className="ml-auto text-sm text-[var(--muted-foreground)]">{total} đơn</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_450px]">
                {/* List */}
                <div className="card-container overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th className="w-1/3 px-6 py-4 text-left">Ứng viên</th>
                                    <th className="px-6 py-4 text-left">SĐT</th>
                                    <th className="px-6 py-4 text-left">CCCD</th>
                                    <th className="px-6 py-4 text-left text-center">Kinh nghiệm</th>
                                    <th className="px-6 py-4 text-left text-center">Trạng thái</th>
                                    <th className="px-6 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]/50">
                                {loading ? (
                                    <tr><td colSpan={6} className="py-16 text-center text-[var(--muted-foreground)]">Đang tải...</td></tr>
                                ) : apps.length === 0 ? (
                                    <tr><td colSpan={6} className="py-16 text-center text-[var(--muted-foreground)]">Không có đơn nào</td></tr>
                                ) : apps.map(app => (
                                    <tr 
                                        key={app.id} 
                                        className={`cursor-pointer transition-all duration-200 group ${selected?.id === app.id ? "bg-[var(--primary)]/10 shadow-[inset_4px_0_0_0_var(--primary)]" : "hover:bg-slate-50 dark:hover:bg-white/5"}`}
                                        onClick={() => { 
                                            setSelected(app); 
                                            setAdminNote(app.adminNote || ""); 
                                            setInterviewDate(app.interviewDate?.slice(0, 16) || ""); 
                                            setInterviewLocation(app.interviewLocation || ""); 
                                        }}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                                                    {app.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-[15px] text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors truncate">{app.fullName}</p>
                                                    <p className="text-xs text-[var(--muted-foreground)] truncate">{app.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-medium whitespace-nowrap">{app.phone}</td>
                                        <td className="px-6 py-5 text-sm font-mono text-[var(--muted-foreground)] whitespace-nowrap">{app.idCardNumber}</td>
                                        <td className="px-6 py-5 text-sm text-center whitespace-nowrap">{app.experience || "—"}</td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                                app.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                app.status === 'REVIEWING' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                                app.status === 'INTERVIEW' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                                                app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                'bg-red-500/10 text-red-600 dark:text-red-400'
                                            }`}>
                                                {STATUS_MAP[app.status]?.label || app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className={`inline-flex w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selected?.id === app.id ? "bg-[var(--primary)] border-[var(--primary)] shadow-md shadow-blue-500/20" : "border-[var(--border)] group-hover:border-[var(--primary)]/50"}`}>
                                                {selected?.id === app.id && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {total > 10 && (
                        <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn btn-outline btn-sm">Trước</button>
                            <span className="px-3 py-1 text-sm text-[var(--muted-foreground)]">Trang {page}/{Math.ceil(total / 10)}</span>
                            <button disabled={page >= Math.ceil(total / 10)} onClick={() => setPage(p => p + 1)} className="btn btn-outline btn-sm">Sau</button>
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden h-fit sticky top-4">
                    {selected ? (
                        <div>
                            <div className="p-6 border-b border-[var(--border)] bg-gradient-to-br from-[var(--muted)]/50 to-[var(--background)]">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-blue-500/20">
                                        {selected.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-lg text-[var(--foreground)] truncate">{selected.fullName}</h3>
                                        <p className="text-sm text-[var(--muted-foreground)] truncate">{selected.email}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            selected.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                            selected.status === 'REVIEWING' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                            selected.status === 'INTERVIEW' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                                            selected.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                            'bg-red-500/10 text-red-600 dark:text-red-400'
                                        }`}>
                                            {STATUS_MAP[selected.status]?.label}
                                        </span>
                                        <p className="text-[10px] text-[var(--muted-foreground)]">ID: {selected.id.slice(-8).toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
                                {/* Thông tin tài khoản người dùng */}
                                <div className="rounded-xl bg-[var(--primary)]/10 p-4 border border-[var(--primary)]/20 shadow-sm">
                                    <h4 className="font-bold text-[var(--primary)] mb-3 flex items-center gap-2">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        Thông tin tài khoản
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div><span className="text-[var(--muted-foreground)]">Tên đăng nhập:</span><p className="font-bold">{selected.user.name}</p></div>
                                        <div><span className="text-[var(--muted-foreground)]">Email:</span><p className="font-bold">{selected.user.email || "—"}</p></div>
                                        <div><span className="text-[var(--muted-foreground)]">SĐT tài khoản:</span><p className="font-bold">{selected.user.phone || "—"}</p></div>
                                        <div><span className="text-[var(--muted-foreground)]">Vai trò hiện tại:</span><p className="font-bold">{selected.user.role}</p></div>
                                        <div><span className="text-[var(--muted-foreground)]">Ngày tạo:</span><p className="font-bold">{new Date(selected.user.createdAt).toLocaleDateString("vi-VN")}</p></div>
                                        <div><span className="text-[var(--muted-foreground)]">Đăng nhập cuối:</span><p className="font-bold">{selected.user.lastLoginAt ? new Date(selected.user.lastLoginAt).toLocaleDateString("vi-VN") : "—"}</p></div>
                                    </div>
                                </div>

                                {/* Thông tin hồ sơ đăng ký */}
                                <div className="rounded-xl border border-[var(--border)] p-4">
                                    <h4 className="font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        Hồ sơ đăng ký
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><span className="text-[var(--muted-foreground)]">Họ tên:</span><p className="font-medium">{selected.fullName}</p></div>
                                        <div><span className="text-[var(--muted-foreground)]">SĐT:</span><p className="font-medium">{selected.phone}</p></div>
                                        <div><span className="text-[var(--muted-foreground)]">Email:</span><p className="font-medium">{selected.email}</p></div>
                                        <div><span className="text-[var(--muted-foreground)]">CCCD:</span><p className="font-medium font-mono">{selected.idCardNumber}</p></div>
                                        {selected.dateOfBirth && <div><span className="text-[var(--muted-foreground)]">Ngày sinh:</span><p className="font-medium">{new Date(selected.dateOfBirth).toLocaleDateString("vi-VN")}</p></div>}
                                        {selected.currentJob && <div><span className="text-[var(--muted-foreground)]">Công việc:</span><p className="font-medium">{selected.currentJob}</p></div>}
                                        {selected.education && <div><span className="text-[var(--muted-foreground)]">Học vấn:</span><p className="font-medium">{selected.education}</p></div>}
                                        {selected.experience && <div><span className="text-[var(--muted-foreground)]">KN BĐS:</span><p className="font-medium">{selected.experience}</p></div>}
                                    </div>

                                    <div className="mt-3"><span className="text-[var(--muted-foreground)]">Địa chỉ thường trú:</span><p className="font-medium">{selected.address}</p></div>
                                    {selected.currentAddress && <div className="mt-2"><span className="text-[var(--muted-foreground)]">Địa chỉ hiện tại:</span><p className="font-medium">{selected.currentAddress}</p></div>}
                                    {selected.referralSource && <div className="mt-2"><span className="text-[var(--muted-foreground)]">Nguồn:</span><p className="font-medium">{selected.referralSource}</p></div>}
                                    {selected.selfIntro && <div className="mt-2"><span className="text-[var(--muted-foreground)]">Giới thiệu:</span><p className="font-medium leading-relaxed">{selected.selfIntro}</p></div>}
                                </div>

                                {/* Timeline */}
                                <div className="rounded-xl border border-[var(--border)] p-4">
                                    <h4 className="font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Timeline
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[var(--muted-foreground)]">Ngày nộp đơn:</span>
                                            <span className="font-medium">{new Date(selected.createdAt).toLocaleString("vi-VN")}</span>
                                        </div>
                                        {selected.reviewedAt && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-[var(--muted-foreground)]">Ngày xử lý:</span>
                                                <span className="font-medium">{new Date(selected.reviewedAt).toLocaleString("vi-VN")}</span>
                                            </div>
                                        )}
                                        {selected.interviewDate && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-[var(--muted-foreground)]">Ngày hẹn PV:</span>
                                                <span className="font-medium text-indigo-600">{new Date(selected.interviewDate).toLocaleString("vi-VN")}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-[var(--muted-foreground)]">Cập nhật cuối:</span>
                                            <span className="font-medium">{new Date(selected.updatedAt).toLocaleString("vi-VN")}</span>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-[var(--border)]" />

                                {/* Admin actions */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase mb-1">Ghi chú admin</label>
                                        <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] resize-none" placeholder="Ghi chú nội bộ..." />
                                    </div>

                                    {(selected.status === "PENDING" || selected.status === "REVIEWING") && (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase mb-1">Ngày hẹn phỏng vấn</label>
                                                <input type="datetime-local" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase mb-1">Địa điểm</label>
                                                <input value={interviewLocation} onChange={e => setInterviewLocation(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" placeholder="Văn phòng Alonha, 123 Đường ABC..." />
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border)] mt-4">
                                        {selected.status === "PENDING" && (
                                            <button onClick={() => handleAction("review")} disabled={processing} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
                                                Xem xét
                                            </button>
                                        )}
                                        {(selected.status === "PENDING" || selected.status === "REVIEWING") && (
                                            <button onClick={() => handleAction("interview")} disabled={processing || !interviewDate} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
                                                Hẹn PV
                                            </button>
                                        )}
                                        {(selected.status === "REVIEWING" || selected.status === "INTERVIEW") && (
                                            <button onClick={() => handleAction("approve")} disabled={processing} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
                                                ✓ Duyệt
                                            </button>
                                        )}
                                        {selected.status !== "APPROVED" && selected.status !== "REJECTED" && (
                                            <button onClick={() => handleAction("reject")} disabled={processing} className="py-2.5 px-4 rounded-xl border-2 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-all hover:border-red-300 disabled:opacity-50">
                                                Từ chối
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="mb-4 rounded-full bg-[var(--muted)] p-4">
                                <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <p className="text-sm text-[var(--muted-foreground)]">Chọn một đơn để xem chi tiết</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
