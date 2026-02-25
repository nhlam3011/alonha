"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

type ListingStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "HIDDEN";
type ListingRow = {
  id: string;
  slug: string;
  title: string;
  status: ListingStatus;
  price: number;
  viewCount: number;
  createdAt: string;
  publishedAt: string | null;
  owner: { id: string; name: string; email: string | null };
};

const STATUS_CONFIG: Record<ListingStatus, { label: string; className: string; icon: any }> = {
  PENDING: {
    label: "Chờ duyệt",
    className: "badge-warning",
    icon: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  APPROVED: {
    label: "Đã duyệt",
    className: "badge-success",
    icon: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
  },
  REJECTED: {
    label: "Từ chối",
    className: "badge-destructive",
    icon: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
  },
  EXPIRED: {
    label: "Hết hạn",
    className: "badge",
    icon: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  HIDDEN: {
    label: "Đang ẩn",
    className: "badge",
    icon: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
  },
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ActionDropdown({ listing, savingId, onUpdateStatus, onDelete }: any) {
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

  const isBusy = savingId === listing.id;
  const s = listing.status;
  const actions = [];

  if (s !== "APPROVED") actions.push({ label: "Duyệt tin", onClick: () => onUpdateStatus(listing.id, "APPROVED"), color: "emerald", icon: "Check" });
  if (s !== "REJECTED") actions.push({ label: "Từ chối", onClick: () => onUpdateStatus(listing.id, "REJECTED"), color: "rose", icon: "X" });
  if (s !== "HIDDEN") actions.push({ label: "Ẩn tin", onClick: () => onUpdateStatus(listing.id, "HIDDEN"), color: "gray", icon: "EyeOff" });
  if (s !== "PENDING" && s !== "APPROVED") actions.push({ label: "Chờ duyệt lại", onClick: () => onUpdateStatus(listing.id, "PENDING"), color: "sky", icon: "Clock" });

  const handleDelete = () => {
    if (confirm("Bạn có chắc chắn muốn xóa tin này vĩnh viễn?")) {
      onDelete(listing.id);
    }
  }

  return (
    <div ref={ref} className="relative inline-block text-left">
      <div className="flex items-center gap-2">
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
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                disabled={isBusy}
                onClick={() => { setOpen(false); a.onClick(); }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors 
                    ${a.color === 'emerald' ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' :
                    a.color === 'rose' ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20' :
                      a.color === 'sky' ? 'text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20' :
                        'text-[var(--foreground)] hover:bg-[var(--muted)]'
                  }`}
              >
                {/* Icons placeholder */}
                {a.label}
              </button>
            ))}
            <div className="my-1 h-px bg-[var(--border)]" />
            <button
              type="button"
              disabled={isBusy}
              onClick={() => { setOpen(false); handleDelete(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
            >
              Xóa vĩnh viễn
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [status, setStatus] = useState<"ALL" | ListingStatus>((searchParams.get("status") as ListingStatus | "ALL") || "ALL");
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ limit: "100" });
    const q = keyword.trim();
    if (q) params.set("keyword", q);
    if (status !== "ALL") params.set("status", status);
    return params.toString();
  }, [keyword, status]);

  // Sync URL with state
  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (status !== "ALL") params.set("status", status);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [keyword, status, pathname, router]);


  const loadListings = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/listings?${queryString}`, { signal });
      const data = (await res.json().catch(() => ({}))) as { data?: ListingRow[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Không thể tải danh sách tin.");
      setRows(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const controller = new AbortController();
    loadListings(controller.signal);
    return () => controller.abort();
  }, [loadListings]);

  async function updateStatus(id: string, nextStatus: ListingStatus) {
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        data?: { id: string; status: ListingStatus; publishedAt: string | null };
        error?: string;
      };
      if (!res.ok || !data.data) throw new Error(data.error || "Không thể cập nhật tin.");
      setRows((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: data.data!.status, publishedAt: data.data!.publishedAt }
            : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật tin.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteListing(id: string) {
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/listings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Không thể xóa tin.");
      setRows((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa tin.");
    } finally {
      setSavingId(null);
    }
  }

  const pendingCount = rows.filter(r => r.status === "PENDING").length;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Quản lý tin đăng</h1>
          <p className="page-subtitle">
            Tổng hợp tất cả tin đăng bất động sản trên hệ thống.
          </p>
        </div>
        <div className="page-actions">
          <button
            onClick={() => loadListings()}
            className="btn btn-outline btn-md"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Làm mới
          </button>
          {pendingCount > 0 && (
            <button
              onClick={() => setStatus("PENDING")}
              className="btn btn-primary btn-md"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-200 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white"></span>
              </span>
              {pendingCount} Tin chờ duyệt
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-row">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề, người đăng..."
              className="filter-input !pl-10"
            />
          </div>
          <div className="w-full sm:w-64">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="filter-input cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Đã từ chối</option>
              <option value="EXPIRED">Hết hạn</option>
              <option value="HIDDEN">Đã ẩn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="card-container">
        {error && (
          <div className="px-4 sm:px-6 py-3 bg-rose-50 border-b border-rose-100 text-rose-600 dark:bg-rose-900/20 dark:border-rose-900/30 text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">Đang tải dữ liệu...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-state py-16">
            <div className="empty-state-icon">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 className="empty-state-title">Không tìm thấy tin đăng</h3>
            <p className="empty-state-description">
              Không có tin đăng nào phù hợp với bộ lọc hiện tại. Hãy thử thay đổi từ khóa hoặc trạng thái.
            </p>
            <button
              onClick={() => { setKeyword(""); setStatus("ALL"); }}
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
                  <th className="w-[35%] text-left">Tin đăng</th>
                  <th className="w-[12%]">Trạng thái</th>
                  <th className="w-[18%]">Người đăng</th>
                  <th className="w-[15%]">Giá & Lượt xem</th>
                  <th className="w-[20%]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const statusConfig = STATUS_CONFIG[row.status] || STATUS_CONFIG.HIDDEN;

                  return (
                    <tr key={row.id}>
                      <td>
                        <Link href={`/bat-dong-san/${row.slug}`} className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] line-clamp-2 transition-colors mb-1 block" target="_blank">
                          {row.title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          <span title={row.id} className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded">#{row.id.slice(0, 8)}</span>
                          <span>•</span>
                          <span>{formatDate(row.createdAt)}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={statusConfig.className}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex flex-col min-w-0 text-left">
                            <span className="font-medium text-[var(--foreground)] truncate text-sm">{row.owner.name || "Unknown"}</span>
                            <span className="text-xs text-[var(--muted-foreground)] truncate">{row.owner.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-[var(--primary)] text-sm">
                            {row.price > 0 ? `${row.price.toLocaleString('vi-VN')} ₫` : 'Thỏa thuận'}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            {row.viewCount} xem
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <ActionDropdown
                          listing={row}
                          savingId={savingId}
                          onUpdateStatus={updateStatus}
                          onDelete={deleteListing}
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
    </div>
  );
}
