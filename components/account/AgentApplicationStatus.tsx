"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type AgentApp = {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    idCardNumber: string;
    dateOfBirth: string | null;
    address: string;
    currentAddress: string | null;
    education: string | null;
    experience: string | null;
    currentJob: string | null;
    status: string;
    adminNote: string | null;
    interviewDate: string | null;
    interviewLocation: string | null;
    createdAt: string;
    updatedAt: string;
};

const statusConfig: Record<string, {
    label: string;
    color: string;
    bgGradient: string;
    icon: string;
    description: string;
}> = {
    PENDING: {
        label: "Đang chờ duyệt",
        color: "text-amber-600 dark:text-amber-400",
        bgGradient: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
        icon: "⏳",
        description: "Hồ sơ của bạn đang được xem xét"
    },
    REVIEWING: {
        label: "Đang xem xét",
        color: "text-blue-600 dark:text-blue-400",
        bgGradient: "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
        icon: "🔍",
        description: "Quản trị viên đang xem xét hồ sơ"
    },
    INTERVIEW: {
        label: "Hẹn phỏng vấn",
        color: "text-indigo-600 dark:text-indigo-400",
        bgGradient: "from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30",
        icon: "📅",
        description: "Vui lòng đến địa điểm phỏng vấn đúng hẹn"
    },
    APPROVED: {
        label: "Đã duyệt",
        color: "text-emerald-600 dark:text-emerald-400",
        bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
        icon: "✅",
        description: "Chúc mừng! Bạn đã trở thành môi giới"
    },
    REJECTED: {
        label: "Từ chối",
        color: "text-red-600 dark:text-red-400",
        bgGradient: "from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30",
        icon: "❌",
        description: "Hồ sơ không được chấp nhận. Bạn có thể đăng ký lại."
    },
};

export function AgentApplicationStatus() {
    const [app, setApp] = useState<AgentApp | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/agent-application")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data.data) && data.data.length > 0) {
                    const active = data.data.find((a: any) =>
                        ["PENDING", "REVIEWING", "INTERVIEW", "APPROVED", "REJECTED"].includes(a.status)
                    );
                    if (active) setApp(active);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-32 bg-[var(--muted)]/20 rounded-2xl"></div>
            </div>
        );
    }

    if (!app) {
        // Show registration CTA
        return (
            <Link
                href="/dang-ky-moi-gioi"
                className="group col-span-1 sm:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] p-6 hover:shadow-lg hover:shadow-[var(--primary)]/20 transition-all duration-300 hover:-translate-y-1"
            >
                <div className="absolute -right-4 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute right-10 bottom-0 text-white/10 transform rotate-12 scale-[3] pointer-events-none group-hover:scale-[3.5] transition-transform duration-500">
                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                </div>
                <div className="relative z-10 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Đăng ký trở thành Môi giới</h3>
                        <p className="text-white/80 text-sm">Đăng tin không giới hạn, tiếp cận hàng ngàn khách hàng tiềm năng.</p>
                    </div>
                </div>
            </Link>
        );
    }

    // Show application status
    const status = statusConfig[app.status] || statusConfig.PENDING;

    return (
        <div className={`col-span-1 sm:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br ${status.bgGradient} border border-[var(--border)] p-6`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--primary)]/10 to-transparent rounded-full -mr-16 -mt-16"></div>

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/80 dark:bg-black/20 flex items-center justify-center text-2xl">
                            {status.icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[var(--foreground)]">Đơn đăng ký Môi giới</h3>
                            <p className={`text-sm font-medium ${status.color}`}>{status.label}</p>
                        </div>
                    </div>
                    <Link
                        href="/dang-ky-moi-gioi"
                        className="text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] underline underline-offset-2"
                    >
                        Xem chi tiết
                    </Link>
                </div>

                <p className={`text-sm mb-4 ${status.color}`}>{status.description}</p>

                {/* Quick info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/50 dark:bg-black/10 rounded-lg p-3">
                        <p className="text-[var(--muted-foreground)] text-xs">Ngày nộp</p>
                        <p className="font-medium">{new Date(app.createdAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                    {app.interviewDate && (
                        <div className="bg-white/50 dark:bg-black/10 rounded-lg p-3">
                            <p className="text-[var(--muted-foreground)] text-xs">Lịch hẹn</p>
                            <p className="font-medium text-indigo-600 dark:text-indigo-400">
                                {new Date(app.interviewDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                            </p>
                        </div>
                    )}
                </div>

                {app.status === "REJECTED" && (
                    <Link
                        href="/dang-ky-moi-gioi"
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Đăng ký lại
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Link>
                )}

                {app.status === "APPROVED" && (
                    <Link
                        href="/moi-gioi"
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        Đến trang quản lý
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Link>
                )}
            </div>
        </div>
    );
}
