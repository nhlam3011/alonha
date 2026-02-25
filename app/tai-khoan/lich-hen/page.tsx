"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Appointment = {
  id: string;
  listingId: string;
  listingTitle?: string;
  listingSlug?: string;
  scheduledAt: string;
  status: string;
  note: string | null;
};

export default function LichHenPage() {
  const [list, setList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setList(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusLabel: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    COMPLETED: "Đã hoàn thành",
    CANCELLED: "Đã hủy",
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h1 className="text-xl font-bold text-[var(--foreground)]">Lịch hẹn xem nhà</h1>
      <p className="text-body mt-1">Danh sách lịch hẹn bạn đã đặt với môi giới.</p>
      {loading ? (
        <div className="mt-6 flex justify-center py-12 text-[var(--muted)]">Đang tải...</div>
      ) : list.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] py-12 text-center text-[var(--muted)]">
          Bạn chưa có lịch hẹn nào.
          <Link href="/bat-dong-san" className="mt-2 block text-[var(--primary)] hover:underline">Xem tin đăng và đặt lịch</Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="pb-3 font-medium">Tin đăng</th>
                <th className="pb-3 font-medium">Thời gian hẹn</th>
                <th className="pb-3 font-medium">Trạng thái</th>
                <th className="pb-3 font-medium">Ghi chú</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="border-b border-[var(--border)]">
                  <td className="py-3">
                    {a.listingSlug ? (
                      <Link href={`/bat-dong-san/${a.listingSlug}`} className="font-medium text-[var(--primary)] hover:underline">
                        {a.listingTitle || "Tin đăng"}
                      </Link>
                    ) : (
                      a.listingTitle || "—"
                    )}
                  </td>
                  <td className="py-3 text-[var(--muted)]">{new Date(a.scheduledAt).toLocaleString("vi-VN")}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-[var(--background)] px-2.5 py-0.5 text-xs">{statusLabel[a.status] || a.status}</span>
                  </td>
                  <td className="py-3 text-[var(--muted)]">{a.note || "—"}</td>
                  <td className="py-3">
                    {a.listingSlug && (
                      <Link href={`/bat-dong-san/${a.listingSlug}`} className="text-[var(--primary)] hover:underline">Chi tiết</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
