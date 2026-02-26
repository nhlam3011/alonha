"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

// Inline SVG Icons mapped from lucide
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const BellIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>;
const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>;
const ScaleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></svg>;
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>;
const LogOutIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>;
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m9 18 6-6-6-6" /></svg>;

const navItems = [
  { href: "/tai-khoan", label: "Tài khoản", icon: UserIcon },
  { href: "/tai-khoan/thong-bao", label: "Thông báo", icon: BellIcon },
  { href: "/tai-khoan/yeu-thich", label: "Tin đã lưu", icon: HeartIcon },
  { href: "/cong-cu/so-sanh", label: "So sánh BĐS", icon: ScaleIcon },
  { href: "/tai-khoan/lich-hen", label: "Lịch hẹn", icon: CalendarIcon },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = session?.user?.role as string | undefined;

  // Paths that should be accessible to all users (including admin/agent)
  const allowedPaths = ["/tai-khoan/thong-bao", "/tai-khoan/lich-hen"];
  const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path));

  // Calculate redirect path - null if accessing allowed paths
  let redirectPath: string | null = null;
  if (role === "ADMIN" && !isAllowedPath) {
    redirectPath = "/admin";
  } else if (role && ["AGENT", "BUSINESS"].includes(role) && !isAllowedPath) {
    redirectPath = "/moi-gioi";
  }

  useEffect(() => {
    if (status === "authenticated" && redirectPath) {
      router.replace(redirectPath);
    }
  }, [status, redirectPath, router, pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
          <div className="text-[var(--muted-foreground)] font-medium loading-dots">Đang tải</div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-4">
          <UserIcon className="h-8 w-8 text-[var(--primary)]" />
        </div>
        <p className="text-[var(--muted-foreground)] mb-6 text-center">Bạn cần đăng nhập để xem thông tin tài khoản.</p>
        <Link
          href="/dang-nhap?callbackUrl=/tai-khoan"
          className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-xl shadow-lg shadow-[var(--primary)]/20 hover:opacity-90 transition-opacity"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  if (status === "authenticated" && redirectPath) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
          <div className="text-[var(--muted-foreground)] font-medium loading-dots">Đang chuyển trang</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="layout-container py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Sidebar */}
          <aside className="w-full shrink-0 lg:w-[280px]">
            <div className="lg:sticky lg:top-24 rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md shadow-sm overflow-hidden flex flex-col lg:h-[calc(100vh-8rem)]">
              {/* User Info Header */}
              <div className="p-4 lg:p-6 border-b border-[var(--border)] bg-gradient-to-br from-[var(--primary)]/5 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center overflow-hidden ring-4 ring-[var(--background)] shadow-md">
                      {session?.user?.image ? (
                        <img src={session.user.image} alt={session.user.name ?? ""} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg lg:text-xl font-bold text-white uppercase">
                          {session?.user?.name?.[0] ?? "U"}
                        </span>
                      )}
                    </div>
                    {/* Online status indicator */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full bg-emerald-500 border-2 border-[var(--card)]"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm lg:text-base font-bold text-[var(--foreground)] truncate">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs lg:text-sm text-[var(--muted-foreground)] truncate mt-0.5">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-2 lg:p-3 flex-1 overflow-x-auto lg:overflow-x-visible overflow-y-hidden lg:overflow-y-auto custom-scrollbar flex flex-row lg:flex-col gap-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/tai-khoan" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 shrink-0 ${isActive
                        ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                        : "text-[var(--foreground)] font-medium hover:bg-[var(--muted)]/50 hover:text-[var(--primary)]"
                        }`}
                    >
                      <div className="flex items-center gap-2 lg:gap-3">
                        <span className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${isActive ? "bg-[var(--primary)]/20 text-[var(--primary)]" : "bg-[var(--muted)]/20 text-[var(--muted-foreground)] group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)]"}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="whitespace-nowrap text-sm lg:text-base">{item.label}</span>
                      </div>
                      <ChevronRightIcon className={`hidden lg:block w-4 h-4 transition-transform duration-200 ${isActive ? "text-[var(--primary)] opacity-100 translate-x-1" : "text-[var(--muted-foreground)] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[var(--primary)]"}`} />
                    </Link>
                  );
                })}
              </nav>

              {/* Footer Actions */}
              <div className="p-3 lg:p-4 border-t border-[var(--border)] bg-gradient-to-t from-[var(--muted)]/10 to-transparent">
                <Link
                  href="/api/auth/signout"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 lg:py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = '/api/auth/signout';
                  }}
                >
                  <LogOutIcon className="w-4 h-4" />
                  Đăng xuất
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
