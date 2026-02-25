"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Item = {
  id: string; listingTitle?: string; listingSlug?: string;
  customerName: string; customerPhone: string; scheduledAt: string;
  status: string; note: string | null;
};

const statusLabel: Record<string, string> = { PENDING: "Chờ xác nhận", CONFIRMED: "Đã xác nhận", COMPLETED: "Hoàn thành", CANCELLED: "Đã hủy" };
const statusClass: Record<string, string> = { PENDING: "badge-warning", CONFIRMED: "badge-primary", COMPLETED: "badge-success", CANCELLED: "badge" };

export default function MoiGioiLichHenPage() {
  const { status } = useSession();
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");

  const todayLabel = useMemo(() => new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }), []);

  useEffect(() => {
    if (status !== "authenticated") return;
    setError(null);
    fetch("/api/moi-gioi/appointments")
      .then(r => r.json())
      .then(res => res.data && setList(res.data))
      .catch(() => setError("Không thể tải danh sách lịch hẹn."))
      .finally(() => setLoading(false));
  }, [status]);

  async function updateStatus(id: string, s: "CONFIRMED" | "COMPLETED" | "CANCELLED") {
    setSavingId(id); setError(null);
    try {
      const res = await fetch(`/api/moi-gioi/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Lỗi.");
      setList(prev => prev.map(i => i.id === id ? { ...i, status: s } : i));
    } catch (err: any) { setError(err?.message); }
    finally { setSavingId(null); }
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--muted-foreground)]">Bạn cần đăng nhập.</p>
          <Link href="/dang-nhap" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Đăng nhập</Link>
        </div>
      </div>
    );
  }

  const filtered = filter === "ALL" ? list : list.filter(a => a.status === filter);
  const counts = { ALL: list.length, PENDING: list.filter(a => a.status === "PENDING").length, CONFIRMED: list.filter(a => a.status === "CONFIRMED").length, COMPLETED: list.filter(a => a.status === "COMPLETED").length };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">{todayLabel}</p>
          <h1 className="page-title">Lịch hẹn xem nhà</h1>
          <p className="page-subtitle">Theo dõi và cập nhật trạng thái các lịch xem nhà.</p>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-[var(--muted)]/50 rounded-lg w-fit">
        {[
          { key: "ALL", label: "Tất cả", count: counts.ALL },
          { key: "PENDING", label: "Chờ", count: counts.PENDING },
          { key: "CONFIRMED", label: "Đã XN", count: counts.CONFIRMED },
          { key: "COMPLETED", label: "Xong", count: counts.COMPLETED },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === t.key ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card-container p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">Đang tải...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-container p-12 text-center">
          <p className="text-[var(--muted-foreground)]">Chưa có lịch hẹn nào.</p>
        </div>
      ) : (
        /* Mobile: cards, Desktop: table */
        <>
          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {filtered.map(a => (
              <div key={a.id} className="card-container p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    {a.listingSlug ? (
                      <Link href={`/bat-dong-san/${a.listingSlug}`} className="font-semibold text-[var(--foreground)] hover:text-blue-600 text-sm line-clamp-1">{a.listingTitle || "Tin đăng"}</Link>
                    ) : (
                      <span className="text-sm text-[var(--muted-foreground)]">{a.listingTitle || "—"}</span>
                    )}
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {new Date(a.scheduledAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span className={statusClass[a.status] || "badge"}>{statusLabel[a.status] || a.status}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-[var(--foreground)]">{a.customerName}</span>
                  <a href={`tel:${a.customerPhone}`} className="text-blue-600 text-xs">{a.customerPhone}</a>
                </div>
                <div className="flex gap-2">
                  {a.status === "PENDING" && <button disabled={savingId === a.id} onClick={() => updateStatus(a.id, "CONFIRMED")} className="btn btn-primary btn-sm flex-1">Xác nhận</button>}
                  {(a.status === "PENDING" || a.status === "CONFIRMED") && <button disabled={savingId === a.id} onClick={() => updateStatus(a.id, "COMPLETED")} className="btn btn-outline btn-sm flex-1">Hoàn thành</button>}
                  {a.status !== "CANCELLED" && a.status !== "COMPLETED" && <button disabled={savingId === a.id} onClick={() => updateStatus(a.id, "CANCELLED")} className="btn btn-outline btn-sm text-rose-600 border-rose-200 hover:bg-rose-50">Hủy</button>}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block card-container overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tin đăng</th>
                    <th>Khách hàng</th>
                    <th>Thời gian</th>
                    <th className="text-center">Trạng thái</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id}>
                      <td>
                        {a.listingSlug ? (
                          <Link href={`/bat-dong-san/${a.listingSlug}`} className="font-medium text-[var(--foreground)] hover:text-blue-600 line-clamp-1 max-w-[200px] block">{a.listingTitle || "Tin đăng"}</Link>
                        ) : (
                          <span className="text-[var(--muted-foreground)]">{a.listingTitle || "—"}</span>
                        )}
                      </td>
                      <td>
                        <p className="font-medium text-[var(--foreground)]">{a.customerName}</p>
                        <a href={`tel:${a.customerPhone}`} className="text-xs text-blue-600 hover:underline">{a.customerPhone}</a>
                      </td>
                      <td className="text-[var(--muted-foreground)]">
                        {new Date(a.scheduledAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "numeric", year: "numeric" })}
                      </td>
                      <td className="text-center">
                        <span className={statusClass[a.status] || "badge"}>{statusLabel[a.status] || a.status}</span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {a.status === "PENDING" && <button disabled={savingId === a.id} onClick={() => updateStatus(a.id, "CONFIRMED")} className="btn btn-primary btn-sm">Xác nhận</button>}
                          {(a.status === "PENDING" || a.status === "CONFIRMED") && <button disabled={savingId === a.id} onClick={() => updateStatus(a.id, "COMPLETED")} className="btn btn-outline btn-sm">Hoàn thành</button>}
                          {a.status !== "CANCELLED" && a.status !== "COMPLETED" && <button disabled={savingId === a.id} onClick={() => updateStatus(a.id, "CANCELLED")} className="btn btn-outline btn-sm text-rose-600 border-rose-200 hover:bg-rose-50">Hủy</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
