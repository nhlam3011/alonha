"use client";

import { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ScheduleViewingContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId") ?? "";
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [schedule, setSchedule] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.name) setFullName(session.user.name);
  }, [session]);

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <p className="text-[var(--muted)]">Vui lòng đăng nhập để đặt lịch xem nhà.</p>
        <Link href={`/dang-nhap?callbackUrl=${encodeURIComponent("/dat-lich-xem?listingId=" + listingId)}`} className="mt-4 inline-block font-medium text-[var(--primary)]">
          Đăng nhập
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, fullName, phone, email, note, schedule }),
      });
      if (res.ok) setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-xl font-bold text-[var(--foreground)]">Đã gửi yêu cầu</h1>
        <p className="mt-2 text-[var(--muted)]">Chủ tin sẽ liên hệ bạn để xác nhận lịch xem.</p>
        <Link href="/bat-dong-san" className="mt-4 inline-block font-medium text-[var(--primary)]">Về danh sách tin</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Đặt lịch xem nhà</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Họ tên</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Số điện thoại</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Email (tùy chọn)</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Ngày giờ xem</label>
          <input type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} required className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Ghi chú</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2" />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-[var(--primary)] py-3 font-medium text-white disabled:opacity-50">
          {loading ? "Đang gửi..." : "Gửi yêu cầu"}
        </button>
      </form>
    </div>
  );
}

export default function ScheduleViewingPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12 text-[var(--muted)]">Đang tải...</div>}>
      <ScheduleViewingContent />
    </Suspense>
  );
}
