"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

const navItems = [
  { href: "/tai-khoan", label: "Tài khoản" },
  { href: "/tai-khoan/yeu-thich", label: "Tin đã lưu" },
  { href: "/cong-cu/so-sanh", label: "So sánh BĐS" },
  { href: "/tai-khoan/lich-hen", label: "Lịch hẹn" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = session?.user?.role as string | undefined;
  const redirectPath =
    role === "ADMIN" ? "/admin" : role && ["AGENT", "BUSINESS"].includes(role) ? "/moi-gioi" : null;

  useEffect(() => {
    if (status === "authenticated" && redirectPath) {
      router.replace(redirectPath);
    }
  }, [status, redirectPath, router]);

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-[var(--muted-foreground)]">Đang tải...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-[var(--muted-foreground)]">Bạn cần đăng nhập để xem trang này.</p>
        <Link
          href="/dang-nhap?callbackUrl=/tai-khoan"
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:opacity-90"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (status === "authenticated" && redirectPath) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-[var(--muted-foreground)]">Đang chuyển trang...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="layout-container py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full shrink-0 lg:w-64">
            <div className="sticky top-24 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              {/* User Info */}
              <div className="p-5 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center">
                    <span className="text-sm font-semibold text-white uppercase">
                      {session?.user?.name?.[0] ?? "U"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? "bg-[var(--accent)] text-[var(--primary)]"
                          : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
