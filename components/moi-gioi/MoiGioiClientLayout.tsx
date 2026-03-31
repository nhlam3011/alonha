"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const navItems = [
  {
    href: "/moi-gioi",
    label: "Bảng điều khiển",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: "/moi-gioi/tin-dang",
    label: "Quản lý tin đăng",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: "/moi-gioi/lich-hen",
    label: "Lịch hẹn xem nhà",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/moi-gioi/tin-nhan",
    label: "Tin nhắn & Liên hệ",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: "/moi-gioi/vi",
    label: "Ví & Giao dịch",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    href: "/moi-gioi/cai-dat",
    label: "Cài đặt tài khoản",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function MoiGioiClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const name = (session?.user?.name as string) || "Môi giới";
  const avatar = session?.user?.image as string | undefined;

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onEscape = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false);
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] transition-all duration-300 ease-in-out lg:static shadow-xl lg:shadow-none
        ${sidebarOpen ? "translate-x-0 w-[280px]" : "-translate-x-full lg:translate-x-0"}
        ${collapsed ? "lg:w-[76px]" : "lg:w-[260px]"}
        `}
      >
        {/* User Info */}
        <div className={`flex h-[88px] items-center shrink-0 justify-between px-6 ${collapsed ? "lg:justify-center lg:px-3" : ""} transition-all duration-300`}>
          <div className="flex items-center overflow-hidden min-w-0">
            <div className="relative h-11 w-11 shrink-0 transition-all duration-300">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt={name} className="h-full w-full rounded-full object-cover ring-2 ring-[var(--sidebar-bg)] border border-[var(--border)]" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-500 text-white font-bold text-base shadow-sm">
                  {name.charAt(0)}
                </div>
              )}
              <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-[3px] ring-[var(--sidebar-bg)]" />
            </div>
            <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap flex flex-col justify-center max-w-[150px] opacity-100 ml-3.5 ${collapsed ? "lg:max-w-0 lg:opacity-0 lg:ml-0" : ""}`}>
              <p className="truncate text-[15px] font-semibold text-[var(--foreground)] tracking-tight">{name}</p>
              <p className="text-[13px] text-[var(--muted-foreground)]">Môi giới viên</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 -mr-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--sidebar-hover)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 pb-4">
          <div className="h-px bg-[var(--sidebar-border)] w-full"></div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 lg:px-4 py-4 space-y-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Mobile Register Button */}
          <div className="px-2 mb-4 lg:hidden">
            <Link
              href="/dang-tin"
              className="flex items-center justify-center gap-2 rounded-[14px] bg-blue-600 px-4 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              Đăng tin mới
            </Link>
          </div>

          {navItems.map((item) => {
            const isActive = item.href === "/moi-gioi"
              ? pathname === "/moi-gioi"
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : ""}
                className={`group flex items-center rounded-[14px] transition-all duration-200
                ${isActive
                    ? "bg-blue-600 text-white dark:bg-blue-500/15 dark:text-blue-500 font-semibold shadow-md shadow-blue-500/20"
                    : "text-slate-900 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-700 dark:hover:bg-slate-700/50 dark:hover:text-slate-50 font-medium"
                  } px-4 py-3 w-full ${collapsed ? "lg:justify-center lg:p-0 lg:w-[48px] lg:h-[48px] lg:mx-auto" : ""}`}
              >
                <span className={`shrink-0 transition-colors`}>
                  {item.icon}
                </span>
                <span className={`truncate transition-all duration-300 overflow-hidden whitespace-nowrap max-w-[200px] opacity-100 ml-3.5 ${collapsed ? "lg:max-w-0 lg:opacity-0 lg:ml-0" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          <div className="my-2 h-px bg-[var(--sidebar-border)] lg:hidden mx-2 transition-all duration-300"></div>
          <Link
            href="/"
            title="Trang chủ"
            className={`lg:hidden group flex items-center rounded-[14px] py-3 text-[14px] font-medium transition-all duration-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-50 w-full px-4`}
          >
            <span className="shrink-0 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </span>
            <span className={`truncate transition-all duration-300 overflow-hidden whitespace-nowrap max-w-[200px] opacity-100 ml-3.5`}>
              Về trang chủ
            </span>
          </Link>
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t border-[var(--sidebar-border)] flex flex-row items-center justify-between ${collapsed ? "lg:flex-col lg:items-center lg:justify-center lg:gap-3" : ""}`}>
          <div className={`flex flex-1 justify-center lg:justify-start ${collapsed ? "lg:flex-initial lg:justify-center" : ""}`}>
            <div className="bg-[var(--sidebar-hover)] border border-[var(--sidebar-border)] rounded-full overflow-hidden p-0.5 inline-flex items-center justify-center">
              <ThemeToggle />
            </div>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:flex items-center justify-center h-8 w-8 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)] transition-colors shrink-0 ${collapsed ? "" : "ml-2"}`}
            title={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            <svg className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center text-sm text-[var(--muted-foreground)] truncate max-w-[200px] sm:max-w-none">
              <Link href="/moi-gioi" className="hover:text-[var(--foreground)] transition-colors truncate">Môi giới</Link>
              {pathname !== "/moi-gioi" && (
                <>
                  <svg className="w-4 h-4 mx-2 text-[var(--muted-foreground)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  <span className="text-[var(--foreground)] font-medium truncate">
                    {navItems.find(i => pathname.startsWith(i.href) && i.href !== "/moi-gioi")?.label || ""}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dang-tin"
              className="hidden lg:flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              <span className="hidden sm:inline">Đăng tin</span>
            </Link>
            <Link
              href="/"
              className="hidden lg:flex items-center gap-2 rounded-xl bg-[var(--muted)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="hidden md:inline">Trang chủ</span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
