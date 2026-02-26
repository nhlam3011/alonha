"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

export type ListingStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "HIDDEN";

export type ListingRow = {
    id: string;
    slug: string;
    title: string;
    status: ListingStatus;
    viewCount: number;
    createdAt: string;
};

const STATUS_CONFIG: Record<ListingStatus, { label: string; className: string; icon: any }> = {
    DRAFT: {
        label: "Nháp",
        className: "badge",
        icon: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
    },
    PENDING: {
        label: "Chờ duyệt",
        className: "badge-warning",
        icon: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    APPROVED: {
        label: "Đang hiển thị",
        className: "badge-success",
        icon: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    REJECTED: {
        label: "Bị từ chối",
        className: "badge-destructive",
        icon: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    EXPIRED: {
        label: "Hết hạn",
        className: "badge-pending",
        icon: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    HIDDEN: {
        label: "Đang ẩn",
        className: "badge",
        icon: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
    },
};

const STATUS_FILTER_ITEMS: { value: "ALL" | ListingStatus; label: string }[] = [
    { value: "ALL", label: "Tất cả" },
    { value: "APPROVED", label: "Đang hiển thị" },
    { value: "PENDING", label: "Chờ duyệt" },
    { value: "DRAFT", label: "Nháp" },
    { value: "HIDDEN", label: "Đang ẩn" },
    { value: "REJECTED", label: "Từ chối" },
    { value: "EXPIRED", label: "Hết hạn" },
];

function ActionDropdown({ listing, savingId, onUpdateStatus, onDeleteDraft, onRequestDelete }: any) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", close);
        // Ensure dropdown is visible
        if (ref.current) {
            // Optional: scroll into view logic if needed, but usually complicates things with fixed headers
        }
        return () => document.removeEventListener("mousedown", close);
    }, [open]);

    const isBusy = savingId === listing.id;
    const s = listing.status;
    const actions = [];

    if (s === "APPROVED") {
        actions.push({ label: "Sửa tin", onClick: () => window.location.href = `/dang-tin?editId=${listing.id}`, variant: "default" });
        actions.push({ label: "Ẩn tin", onClick: () => onUpdateStatus(listing.id, "HIDDEN"), variant: "default" });
        actions.push({ label: "Yêu cầu xóa", onClick: () => onRequestDelete(listing.id), variant: "danger" });
    } else if (s === "DRAFT") {
        actions.push({ label: "Gửi duyệt", onClick: () => onUpdateStatus(listing.id, "PENDING"), variant: "success" });
        actions.push({ label: "Sửa nháp", onClick: () => window.location.href = `/dang-tin?draftId=${listing.id}`, variant: "default" });
        actions.push({ label: "Xóa nháp", onClick: () => onDeleteDraft(listing.id), variant: "danger" });
    } else {
        actions.push({ label: "Sửa tin", onClick: () => window.location.href = `/dang-tin?editId=${listing.id}`, variant: "default" });
        if (s === "HIDDEN" || s === "REJECTED") {
            actions.push({ label: "Gửi duyệt lại", onClick: () => onUpdateStatus(listing.id, "PENDING"), variant: "success" });
        }
        actions.push({ label: "Yêu cầu xóa", onClick: () => onRequestDelete(listing.id), variant: "danger" });
    }

    return (
        <div ref={ref} className="relative inline-block text-left">
            <div className="flex items-center gap-2 justify-end">
                <Link
                    href={`/bat-dong-san/${listing.slug}`}
                    target="_blank"
                    className="hidden sm:inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] transition-colors shadow-sm"
                >
                    Xem
                </Link>
                <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => setOpen((v) => !v)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--primary-hover)]/90 disabled:opacity-50 transition-all shadow-sm shadow-[var(--primary)]/20"
                >
                    {isBusy ? (
                        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        <>
                            Thao tác
                            <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </>
                    )}
                </button>
            </div>

            {open && (
                <div className="absolute right-0 z-30 mt-2 w-40 origin-top-right overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-1">
                        {actions.map((a, i) => (
                            <button
                                key={i}
                                type="button"
                                disabled={isBusy}
                                onClick={() => { setOpen(false); a.onClick(); }}
                                className={`flex w-full items-center px-3 py-2 text-left text-xs font-medium rounded-lg transition-colors disabled:opacity-50 
                    ${a.variant === "danger" ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" :
                                        a.variant === "success" ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" :
                                            "text-[var(--foreground)] hover:bg-[var(--muted)]"}`}
                            >
                                {a.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function ListingManagementClient({ initialListings }: { initialListings: ListingRow[] }) {
    const searchParams = useSearchParams();
    const statusFromQuery = searchParams.get("status");

    const [listings, setListings] = useState<ListingRow[]>(initialListings);
    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | ListingStatus>(
        (statusFromQuery as ListingStatus) || "ALL"
    );

    const [savingId, setSavingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (statusFromQuery && statusFromQuery in STATUS_CONFIG) {
            setStatusFilter(statusFromQuery as ListingStatus);
        }
    }, [statusFromQuery]);

    const filtered = useMemo(() => {
        const q = keyword.trim().toLowerCase();
        return listings.filter((item) => {
            const matchKeyword = q
                ? item.title.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q)
                : true;
            const matchStatus = statusFilter === "ALL" ? true : item.status === statusFilter;
            return matchKeyword && matchStatus;
        });
    }, [listings, keyword, statusFilter]);

    const summary = useMemo(() => {
        const s = { total: listings.length, draft: 0, pending: 0, approved: 0, hidden: 0, expired: 0, rejected: 0 };
        listings.forEach((l) => {
            if (l.status === "DRAFT") s.draft++;
            else if (l.status === "PENDING") s.pending++;
            else if (l.status === "APPROVED") s.approved++;
            else if (l.status === "HIDDEN") s.hidden++;
            else if (l.status === "EXPIRED") s.expired++;
            else if (l.status === "REJECTED") s.rejected++;
        });
        return s;
    }, [listings]);

    async function updateStatus(id: string, nextStatus: "HIDDEN" | "PENDING") {
        setSavingId(id);
        setError(null);
        try {
            const res = await fetch(`/api/moi-gioi/listings/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
            });
            const data = (await res.json().catch(() => ({}))) as { data?: { status: ListingStatus }; error?: string };
            if (!res.ok || !data.data) throw new Error(data.error || "Không thể cập nhật trạng thái.");
            setListings((prev) =>
                prev.map((item) => (item.id === id ? { ...item, status: data.data!.status } : item))
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể cập nhật trạng thái.");
        } finally {
            setSavingId(null);
        }
    }

    async function deleteListing(id: string) {
        if (!confirm("Xóa bản nháp này? Hành động không thể hoàn tác.")) return;
        setSavingId(id);
        setError(null);
        try {
            const res = await fetch(`/api/moi-gioi/listings/${id}`, { method: "DELETE" });
            const data = (await res.json().catch(() => ({}))) as { error?: string };
            if (!res.ok) throw new Error(data.error || "Không thể xóa tin đăng.");
            setListings((prev) => prev.filter((item) => item.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể xóa tin đăng.");
        } finally {
            setSavingId(null);
        }
    }

    function requestDelete(id: string) {
        if (!confirm("Gửi yêu cầu xóa tin đăng này tới admin? Tin sẽ được ẩn khỏi người dùng cho tới khi xử lý.")) return;
        void updateStatus(id, "HIDDEN");
    }

    return (
        <>
            {/* Summary Cards */}
            <div className="dashboard-grid dashboard-grid-4">
                <div className="dashboard-card">
                    <p className="text-sm font-medium text-[var(--muted-foreground)]">Tổng số tin</p>
                    <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{summary.total}</p>
                </div>
                <div className="dashboard-card">
                    <p className="text-sm font-medium text-[var(--muted-foreground)]">Đang hiển thị</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-600">{summary.approved}</p>
                </div>
                <div className="dashboard-card">
                    <p className="text-sm font-medium text-[var(--muted-foreground)]">Chờ duyệt</p>
                    <p className="mt-2 text-2xl font-bold text-amber-600">{summary.pending}</p>
                </div>
                <div className="dashboard-card">
                    <p className="text-sm font-medium text-[var(--muted-foreground)]">Tin nháp</p>
                    <p className="mt-2 text-2xl font-bold text-slate-600">{summary.draft}</p>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 mt-6 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Main Content */}
            <div className="card-container min-h-[500px] flex flex-col mt-6">
                {/* Toolbar */}
                <div className="border-b border-[var(--border)] p-4 bg-[var(--muted)]/30">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Filter Tabs */}
                        <div className="flex flex-wrap gap-2">
                            {STATUS_FILTER_ITEMS.map(item => {
                                const isActive = statusFilter === item.value;
                                const count = item.value === 'ALL' ? summary.total :
                                    item.value === 'APPROVED' ? summary.approved :
                                        item.value === 'PENDING' ? summary.pending :
                                            item.value === 'DRAFT' ? summary.draft :
                                                item.value === 'HIDDEN' ? summary.hidden :
                                                    item.value === 'REJECTED' ? summary.rejected :
                                                        item.value === 'EXPIRED' ? summary.expired : 0;

                                if (count === 0 && item.value !== 'ALL' && item.value !== 'APPROVED') return null;

                                return (
                                    <button
                                        key={item.value}
                                        onClick={() => setStatusFilter(item.value)}
                                        className={`
                      inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                      ${isActive
                                                ? 'bg-[var(--primary)] text-white shadow-md'
                                                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80 hover:text-[var(--foreground)]'}
                    `}
                                    >
                                        {item.label}
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white text-[var(--primary)]' : 'bg-[var(--background)]'}`}>
                                            {count}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Search */}
                        <div className="relative w-full lg:w-64 shrink-0">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="Tìm theo mã tin, tiêu đề..."
                                className="filter-input pl-9"
                            />
                        </div>
                    </div>
                </div>

                {/* Table Area */}
                <div className="flex-1 overflow-x-auto">
                    {filtered.length === 0 ? (
                        <div className="empty-state py-20">
                            <div className="empty-state-icon">
                                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </div>
                            <h3 className="empty-state-title">Không tìm thấy tin đăng</h3>
                            <p className="empty-state-description">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                            <button
                                onClick={() => { setStatusFilter("ALL"); setKeyword(""); }}
                                className="mt-4 font-medium text-[var(--primary)] hover:underline"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th className="w-[40%] text-left">Tin đăng</th>
                                    <th className="w-[12%]">Trạng thái</th>
                                    <th className="w-[12%]">Thống kê</th>
                                    <th className="w-[14%]">Ngày đăng</th>
                                    <th className="w-[22%]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((row) => {
                                    const statusConfig = STATUS_CONFIG[row.status] || STATUS_CONFIG.HIDDEN;

                                    return (
                                        <tr key={row.id} className="group">
                                            <td>
                                                <Link href={`/bat-dong-san/${row.slug}`} target="_blank" className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] text-sm line-clamp-2 transition-colors mb-1">
                                                    {row.title}
                                                </Link>
                                                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                                                    <span className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded">#{row.id.slice(0, 8)}</span>
                                                    <span>/</span>
                                                    <span className="truncate max-w-[200px]">{row.slug}</span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className={statusConfig.className}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-1.5 text-[var(--foreground)] font-medium text-sm">
                                                    <svg className="h-3.5 w-3.5 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    {row.viewCount}
                                                </div>
                                            </td>
                                            <td className="text-center text-sm text-[var(--muted-foreground)]">
                                                {new Date(row.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </td>
                                            <td className="text-center">
                                                <ActionDropdown
                                                    listing={row}
                                                    savingId={savingId}
                                                    onUpdateStatus={updateStatus}
                                                    onDeleteDraft={deleteListing}
                                                    onRequestDelete={requestDelete}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
