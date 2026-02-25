"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function AccountPage() {
  const { data: session, status } = useSession();
  if (status === "loading") return <div className="p-8 text-center text-[var(--muted)]">Đang tải...</div>;

  const role = session?.user?.role as string;
  const isAgent = role && ["AGENT", "BUSINESS", "ADMIN"].includes(role);
  const roleLabel = role === "ADMIN" ? "Quản trị viên" : role === "AGENT" ? "Môi giới" : role === "BUSINESS" ? "Doanh nghiệp BĐS" : "Khách xem tin";

  return (
    <div className="layout-container page-section space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Tài khoản của tôi</h1>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Quản lý thông tin cá nhân, tin đã lưu, lịch hẹn xem nhà và các công cụ hỗ trợ.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-2xl font-semibold text-white overflow-hidden ring-4 ring-[var(--border)]">
              {session?.user?.image ? (
                <img src={session.user.image} alt={session.user.name ?? ""} className="w-full h-full object-cover" />
              ) : (
                (session?.user?.name?.[0] ?? "U").toUpperCase()
              )}
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)]">{session?.user?.name}</p>
              <p className="text-sm text-[var(--muted)]">{session?.user?.email}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Loại tài khoản: {roleLabel}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/tai-khoan/yeu-thich"
              className="flex items-center justify-between rounded-lg bg-[var(--primary-light)] px-4 py-3 text-sm font-medium text-[var(--primary)] hover:opacity-90"
            >
              <span>Tin đã lưu</span>
              <span className="text-xs text-[var(--muted)]">Xem nhanh BĐS yêu thích</span>
            </Link>
            <Link
              href="/tai-khoan/lich-hen"
              className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3 text-sm font-medium hover:bg-[var(--background)]"
            >
              <span>Lịch hẹn xem nhà</span>
              <span className="text-xs text-[var(--muted)]">Quản lý các cuộc hẹn với môi giới</span>
            </Link>
            <Link
              href="/cong-cu/so-sanh"
              className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3 text-sm font-medium hover:bg-[var(--background)]"
            >
              <span>So sánh bất động sản</span>
              <span className="text-xs text-[var(--muted)]">Đặt các tin cạnh nhau để so sánh</span>
            </Link>
            {!isAgent ? (
              <Link
                href="/nang-cap-tai-khoan"
                className="flex items-center justify-between rounded-lg border border-[var(--primary)] px-4 py-3 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-light)]"
              >
                <span>Nâng cấp môi giới</span>
                <span className="text-xs text-[var(--muted)]">Đăng tin và quản lý khách hàng</span>
              </Link>
            ) : (
              <Link
                href="/moi-gioi"
                className="flex items-center justify-between rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white hover:opacity-90"
              >
                <span>Quản lý tin đăng</span>
                <span className="text-xs text-white/80">Trang dành cho môi giới / doanh nghiệp</span>
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Gợi ý sử dụng AloNha hiệu quả</h2>
          <ul className="mt-3 space-y-2">
            <li>• Lưu lại các bất động sản tiềm năng và so sánh trước khi quyết định.</li>
            <li>• Sử dụng công cụ tính lãi vay để cân đối khả năng tài chính.</li>
            <li>• Đặt lịch xem nhà trực tiếp từ trang chi tiết bất động sản.</li>
            <li>• Trao đổi với môi giới qua Zalo/điện thoại để làm rõ thông tin.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
