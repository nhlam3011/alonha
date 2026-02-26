"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    {
        href: "/cong-cu",
        title: "Tổng quan",
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        ),
    },
    {
        href: "/cong-cu/tinh-vay",
        title: "Tính lãi vay",
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        href: "/cong-cu/so-sanh",
        title: "So sánh BĐS",
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    },
    {
        href: "/cong-cu/phong-thuy",
        title: "Xem phong thủy",
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
];

export default function ToolsNavigation() {
    const pathname = usePathname();

    return (
        <div className="sticky top-20 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2 lg:p-3 shadow-sm">
            <div className="mb-3 hidden px-3 pt-2 lg:block">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Thực đơn công cụ</h2>
            </div>
            <nav className="flex overflow-x-auto lg:flex-col lg:overflow-visible gap-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${isActive
                                    ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20"
                                    : "text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                                }`}
                        >
                            <div className={`flex items-center justify-center transition-colors ${isActive ? "text-white" : "text-[var(--muted-foreground)]"}`}>
                                {item.icon}
                            </div>
                            <span className="whitespace-nowrap">{item.title}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
