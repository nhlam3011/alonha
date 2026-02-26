"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Types
interface Notification {
    id: string;
    type: string;
    title: string;
    content: string;
    link?: string;
    isRead: boolean;
    emailSent: boolean;
    createdAt: string;
    readAt?: string;
}

interface NotificationSettings {
    [key: string]: any;
}

type TabType = "all" | "unread" | "settings";

// Icons mapped for notifications (lucide-react equivalents using inline SVGs for stability)
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>;
const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const MessageCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>;
const WalletIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>;
const AlertTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
const BellIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>;
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const PinIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" /></svg>;
const Trash2Icon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>;
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12" /></svg>;
const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;

// Notification type icons configuration
const getNotificationIconInfo = (type: string) => {
    const iconMap: Record<string, { icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string; bg: string }> = {
        LISTING_APPROVED: { icon: CheckCircleIcon, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        LISTING_REJECTED: { icon: XCircleIcon, color: "text-red-500", bg: "bg-red-500/10" },
        LISTING_NEW: { icon: HomeIcon, color: "text-blue-500", bg: "bg-blue-500/10" },
        LISTING_EXPIRING: { icon: ClockIcon, color: "text-orange-500", bg: "bg-orange-500/10" },
        APPOINTMENT_NEW: { icon: CalendarIcon, color: "text-purple-500", bg: "bg-purple-500/10" },
        APPOINTMENT_CONFIRMED: { icon: CheckCircleIcon, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        APPOINTMENT_CANCELLED: { icon: XCircleIcon, color: "text-red-500", bg: "bg-red-500/10" },
        LEAD_NEW: { icon: UserIcon, color: "text-[var(--primary)]", bg: "bg-[var(--primary)]/10" },
        LEAD_REPLY: { icon: MessageCircleIcon, color: "text-[var(--primary)]", bg: "bg-[var(--primary)]/10" },
        PAYMENT_SUCCESS: { icon: WalletIcon, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        PAYMENT_FAILED: { icon: AlertTriangleIcon, color: "text-red-500", bg: "bg-red-500/10" },
        SYSTEM: { icon: BellIcon, color: "text-[var(--foreground)]", bg: "bg-[var(--muted)]/20" },
        SAVED_SEARCH_MATCH: { icon: SearchIcon, color: "text-blue-500", bg: "bg-blue-500/10" },
    };
    return iconMap[type] || { icon: PinIcon, color: "text-[var(--foreground)]", bg: "bg-[var(--muted)]/20" };
};

// Format date
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

export default function NotificationsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = (searchParams?.get("tab") as TabType) || "all";

    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [total, setTotal] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            const params = new URLSearchParams();
            if (activeTab === "unread") params.set("unreadOnly", "true");
            params.set("limit", "20");
            params.set("offset", "0");

            const res = await fetch(`/api/notifications?${params}`);
            const data = await res.json();

            if (data.notifications) {
                setNotifications(data.notifications);
                setTotal(data.total);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    }, [session?.user?.id, activeTab]);

    // Fetch settings
    const fetchSettings = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            const res = await fetch("/api/notifications/settings");
            const data = await res.json();
            setSettings(data);
        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    }, [session?.user?.id]);

    // Initial load
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/dang-nhap?callbackUrl=/tai-khoan/thong-bao");
            return;
        }

        if (status === "authenticated") {
            setLoading(true);
            Promise.all([fetchNotifications(), fetchSettings()]).finally(() => {
                setLoading(false);
            });
        }
    }, [status, router, fetchNotifications, fetchSettings]);

    // Fetch when tab changes
    useEffect(() => {
        if (status === "authenticated") {
            if (activeTab === "settings") {
                fetchSettings();
            } else {
                fetchNotifications();
            }
        }
    }, [activeTab, fetchNotifications, fetchSettings, status]);

    // Mark as read
    const handleMarkAsRead = async (notificationId: string) => {
        try {
            const res = await fetch("/api/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId }),
            });

            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
                    )
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    // Mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            const res = await fetch("/api/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAll: true }),
            });

            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    // Delete notification
    const handleDelete = async (notificationId: string) => {
        try {
            const res = await fetch(`/api/notifications?id=${notificationId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                const deleted = notifications.find((n) => n.id === notificationId);
                setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
                if (deleted && !deleted.isRead) {
                    setUnreadCount((prev) => Math.max(0, prev - 1));
                }
                setTotal((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    // Update settings
    const handleUpdateSettings = async (key: string, value: boolean) => {
        if (!settings) return;

        setSubmitting(true);
        try {
            const res = await fetch("/api/notifications/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [key]: value }),
            });

            if (res.ok) {
                const data = await res.json();
                setSettings(data.settings);
            }
        } catch (error) {
            console.error("Error updating settings:", error);
        } finally {
            setSubmitting(false);
        }
    };

    // Render toggle
    const renderToggle = (key: string, label: string, icon: React.ReactNode) => {
        const isEnabled = settings && typeof settings[key] === 'boolean' ? settings[key] : false;
        return (
            <div key={key} className="flex items-center justify-between py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/30 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                        {icon}
                    </div>
                    <span className="text-[var(--foreground)] font-medium text-sm">{label}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => handleUpdateSettings(String(key), e.target.checked)}
                        disabled={submitting || !settings?.emailEnabled}
                        className="sr-only peer"
                    />
                    <div className={`relative w-11 h-6 rounded-full transition-colors ${isEnabled ? "bg-[var(--primary)]" : "bg-[var(--muted)]/30"} ${!settings?.emailEnabled ? "opacity-50" : "peer-focus:ring-4 peer-focus:ring-[var(--primary)]/20"}`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isEnabled ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                </label>
            </div>
        );
    };

    if (status === "loading" || loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-[var(--muted)]/20 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-64 bg-[var(--muted)]/20 rounded animate-pulse mb-8"></div>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
                        <div className="text-[var(--muted-foreground)] font-medium">Đang tải thông báo...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] flex items-center gap-3">
                        <span className="w-1.5 h-8 rounded-full bg-[var(--primary)] block"></span>
                        Thông báo
                    </h1>
                    <p className="mt-2 text-[var(--muted-foreground)] text-sm">
                        Quản lý hoạt động tài khoản và cài đặt nhận email từ hệ thống.
                    </p>
                </div>
                {unreadCount > 0 && activeTab !== "settings" && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm px-4 py-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] font-medium hover:bg-[var(--primary)] hover:text-white transition-colors flex flex-shrink-0 items-center gap-2"
                    >
                        <CheckIcon className="w-4 h-4" />
                        Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            {/* Segmented Tabs */}
            <div className="inline-flex bg-[var(--muted)]/10 p-1.5 rounded-xl border border-[var(--border)] w-full sm:w-auto overflow-x-auto custom-scrollbar">
                <button
                    onClick={() => setActiveTab("all")}
                    className={`flex-1 sm:flex-none px-5 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === "all"
                        ? "bg-[var(--background)] shadow-sm text-[var(--primary)]"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                >
                    <BellIcon className="w-4 h-4" />
                    Tất cả
                    {total > 0 && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === "all" ? "bg-[var(--primary)]/10" : "bg-[var(--muted)]/20"}`}>
                            {total}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("unread")}
                    className={`flex-1 sm:flex-none px-5 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === "unread"
                        ? "bg-[var(--background)] shadow-sm text-red-500"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                >
                    <AlertTriangleIcon className="w-4 h-4" />
                    Chưa đọc
                    {unreadCount > 0 && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === "unread" ? "bg-red-500/10 text-red-500" : "bg-red-500 text-white"}`}>
                            {unreadCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("settings")}
                    className={`flex-1 sm:flex-none px-5 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === "settings"
                        ? "bg-[var(--background)] shadow-sm text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                >
                    <SettingsIcon className="w-4 h-4" />
                    Cài đặt
                </button>
            </div>

            {/* Content */}
            {activeTab === "settings" ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md p-6 sm:p-8 max-w-2xl">
                    <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">
                        Tùy chỉnh thông báo
                    </h2>

                    {/* Email toggle Master */}
                    <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-[var(--primary)]/10 to-transparent border border-[var(--primary)]/20 mb-8">
                        <div>
                            <p className="font-bold text-[var(--foreground)]">Nhận thông báo qua email</p>
                            <p className="text-sm text-[var(--muted-foreground)] mt-1">Gửi thông báo quan trọng đến <span className="font-medium text-[var(--primary)]">{session?.user?.email}</span></p>
                        </div>
                        <button
                            onClick={() => settings && handleUpdateSettings("emailEnabled", !settings.emailEnabled)}
                            disabled={submitting}
                            className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer ${settings?.emailEnabled ? "bg-[var(--primary)]" : "bg-[var(--muted)]/30"
                                }`}
                        >
                            <span
                                className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${settings?.emailEnabled ? "translate-x-5" : "translate-x-0"
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Notification types */}
                    <div className={`space-y-4 transition-opacity duration-300 ${!settings?.emailEnabled ? "opacity-50 pointer-events-none" : ""}`}>
                        <p className="font-semibold text-[var(--foreground)]">
                            Chi tiết loại thông báo:
                        </p>

                        <div className="grid gap-3">
                            {[
                                { key: "listingApproved", label: "Tin đăng được duyệt", icon: <CheckCircleIcon className="w-4 h-4" /> },
                                { key: "listingRejected", label: "Tin đăng bị từ chối", icon: <XCircleIcon className="w-4 h-4" /> },
                                { key: "listingNew", label: "Tin đăng mới", icon: <HomeIcon className="w-4 h-4" /> },
                                { key: "listingExpiring", label: "Tin đăng sắp hết hạn", icon: <ClockIcon className="w-4 h-4" /> },
                                { key: "appointmentNew", label: "Lịch xem nhà mới", icon: <CalendarIcon className="w-4 h-4" /> },
                                { key: "leadNew", label: "Khách hàng tiềm năng mới", icon: <UserIcon className="w-4 h-4" /> },
                                { key: "payment", label: "Thanh toán", icon: <WalletIcon className="w-4 h-4" /> },
                                { key: "savedSearch", label: "Tin phù hợp với tìm kiếm", icon: <SearchIcon className="w-4 h-4" /> },
                            ].map((item) => renderToggle(item.key, item.label, item.icon))}
                        </div>
                    </div>
                </div>
            ) : notifications.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md p-16 text-center max-w-3xl mx-auto mt-10 shadow-sm">
                    <div className="w-24 h-24 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-6">
                        <BellIcon className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
                        {activeTab === "unread" ? "Bạn đã đọc hết thông báo!" : "Chưa có thông báo nào"}
                    </h3>
                    <p className="text-[var(--muted-foreground)]">
                        {activeTab === "unread"
                            ? "Thật tuyệt vời, không có thông tin nào bị bỏ lỡ."
                            : "Các cập nhật về tin đăng, lịch hẹn và hệ thống sẽ xuất hiện tại đây."}
                    </p>
                    <Link
                        href="/"
                        className="inline-flex mt-8 px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[var(--primary)]/20"
                    >
                        Khám phá Bất Động Sản
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => {
                        const IconInfo = getNotificationIconInfo(notification.type);
                        const Icon = IconInfo.icon;

                        return (
                            <div
                                key={notification.id}
                                className={`group relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${notification.isRead
                                    ? "border-[var(--border)] bg-[var(--card)]/50 hover:bg-[var(--card)]"
                                    : "border-[var(--primary)]/30 bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10"
                                    }`}
                            >
                                {/* Unread indicator bar */}
                                {!notification.isRead && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary)]" />
                                )}

                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${IconInfo.bg} ${IconInfo.color}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pt-1">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 mb-2">
                                            <h3
                                                className={`text-base ${notification.isRead
                                                    ? "text-[var(--foreground)] font-medium"
                                                    : "text-[var(--foreground)] font-bold"
                                                    }`}
                                            >
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-[var(--muted-foreground)] shrink-0 flex items-center gap-1 font-medium bg-[var(--background)] px-2 py-1 rounded-md">
                                                <ClockIcon className="w-3 h-3" />
                                                {formatDate(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className={`text-sm ${notification.isRead ? "text-[var(--muted-foreground)]" : "text-[var(--foreground)]/90"}`}>
                                            {notification.content}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            {notification.link && (
                                                <Link
                                                    href={notification.link}
                                                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                                                    className="inline-flex items-center gap-1.5 text-sm text-[var(--primary)] font-medium hover:underline px-3 py-1.5 rounded-lg hover:bg-[var(--primary)]/10 transition-colors"
                                                >
                                                    <SearchIcon className="w-4 h-4" />
                                                    Xem chi tiết
                                                </Link>
                                            )}
                                            {!notification.isRead && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-lg hover:bg-[var(--muted)]/10 transition-colors"
                                                >
                                                    <CheckIcon className="w-4 h-4" />
                                                    Đánh dấu đã đọc
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(notification.id)}
                                                className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ml-auto sm:ml-0"
                                            >
                                                <Trash2Icon className="w-4 h-4" />
                                                <span className="hidden sm:inline">Xóa</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
