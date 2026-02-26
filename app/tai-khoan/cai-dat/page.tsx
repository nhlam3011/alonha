"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ---- Icons ----
const UserIcon = (p: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const LockIcon = (p: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
const CameraIcon = (p: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
);
const CheckIcon = (p: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12" /></svg>
);
const EyeIcon = (p: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const EyeOffIcon = (p: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
);

interface Profile {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatar: string | null;
    role: string;
    hasPassword: boolean;
    createdAt: string;
}

type Tab = "profile" | "password";

export default function AccountSettingsPage() {
    const { data: session, status, update: updateSession } = useSession();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<Tab>("profile");
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    // Profile fields
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password fields
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/dang-nhap?callbackUrl=/tai-khoan/cai-dat");
        if (status === "authenticated") fetchProfile();
    }, [status]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/user/profile");
            const data = await res.json();
            setProfile(data);
            setName(data.name ?? "");
            setPhone(data.phone ?? "");
            setAvatarUrl(data.avatar ?? null);
        } catch {
            setError("Không thể tải thông tin tài khoản");
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("Ảnh tối đa 5MB");
            return;
        }
        // Preview ngay
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        // Upload
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/uploads", { method: "POST", body: formData });
            const data = await res.json();
            if (data.url) setAvatarUrl(data.url);
            else setError("Không thể upload ảnh");
        } catch {
            setError("Lỗi upload ảnh");
        } finally {
            setUploading(false);
        }
    };

    const handleProfileSave = async () => {
        if (!name.trim()) { setError("Tên không được để trống"); return; }
        setError(""); setSuccess("");
        setSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null, avatar: avatarUrl }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Lỗi cập nhật"); return; }
            setSuccess("Cập nhật thành công!");
            setProfile((prev) => prev ? { ...prev, ...data.user } : prev);
            await updateSession({ name: name.trim(), image: avatarUrl });
        } catch {
            setError("Lỗi kết nối server");
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận không khớp"); return; }
        if (newPassword.length < 6) { setError("Mật khẩu mới phải có ít nhất 6 ký tự"); return; }
        setError(""); setSuccess("");
        setSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Lỗi đổi mật khẩu"); return; }
            setSuccess("Đổi mật khẩu thành công!");
            setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        } catch {
            setError("Lỗi kết nối server");
        } finally {
            setSaving(false);
        }
    };

    const currentAvatar = avatarPreview ?? avatarUrl;
    const roleLabel: Record<string, string> = {
        ADMIN: "Quản trị viên", AGENT: "Môi giới", BUSINESS: "Doanh nghiệp BĐS",
        BUYER: "Người mua", RENTER: "Người thuê", GUEST: "Khách",
    };

    if (status === "loading" || loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-52 bg-[var(--muted)]/20 rounded animate-pulse" />
                <div className="h-64 bg-[var(--muted)]/10 rounded-2xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="border-b border-[var(--border)] pb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] flex items-center gap-3">
                    <span className="w-1.5 h-8 rounded-full bg-[var(--primary)] block" />
                    Cài đặt tài khoản
                </h1>
                <p className="mt-2 text-[var(--muted-foreground)] text-sm">Quản lý thông tin cá nhân và bảo mật tài khoản.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar: avatar + info */}
                <div className="lg:w-64 shrink-0">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md p-6 flex flex-col items-center text-center gap-4">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-[var(--background)] shadow-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                                {currentAvatar ? (
                                    <Image src={currentAvatar} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" unoptimized />
                                ) : (
                                    <span className="text-3xl font-bold text-white uppercase">{profile?.name?.[0] ?? "U"}</span>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                            >
                                {uploading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <CameraIcon />
                                )}
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </div>

                        <div>
                            <p className="font-bold text-[var(--foreground)]">{profile?.name}</p>
                            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{profile?.email}</p>
                            <span className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary)]/10 text-[var(--primary)]">
                                {roleLabel[profile?.role ?? ""] ?? profile?.role}
                            </span>
                        </div>

                        <p className="text-xs text-[var(--muted-foreground)]">
                            Tham gia {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("vi-VN") : ""}
                        </p>

                        <p className="text-xs text-[var(--muted-foreground)]/70 italic">Nhấn vào ảnh để thay đổi</p>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1">
                    {/* Tabs */}
                    <div className="inline-flex bg-[var(--muted)]/10 p-1.5 rounded-xl border border-[var(--border)] mb-6">
                        {([
                            { key: "profile", label: "Thông tin cá nhân", icon: <UserIcon /> },
                            { key: "password", label: "Đổi mật khẩu", icon: <LockIcon /> },
                        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map((t) => (
                            <button
                                key={t.key}
                                onClick={() => { setActiveTab(t.key); setError(""); setSuccess(""); }}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === t.key
                                    ? "bg-[var(--background)] shadow-sm text-[var(--primary)]"
                                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                    }`}
                            >
                                {t.icon}
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Alert */}
                    {(error || success) && (
                        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${error ? "bg-red-500/10 text-red-600 border border-red-500/20" : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"}`}>
                            {success && <CheckIcon className="w-4 h-4 shrink-0" />}
                            {error || success}
                        </div>
                    )}

                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md p-6 sm:p-8">
                        {activeTab === "profile" ? (
                            <div className="space-y-5">
                                <h2 className="text-lg font-bold text-[var(--foreground)] mb-6">Thông tin cá nhân</h2>

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-colors"
                                        placeholder="Nhập họ và tên"
                                    />
                                </div>

                                {/* Email (readonly) */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        value={profile?.email ?? ""}
                                        readOnly
                                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 text-[var(--muted-foreground)] text-sm cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">Email không thể thay đổi</p>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-colors"
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={handleProfileSave}
                                        disabled={saving || uploading}
                                        className="px-6 py-2.5 bg-[var(--primary)] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <h2 className="text-lg font-bold text-[var(--foreground)] mb-6">Đổi mật khẩu</h2>

                                {!profile?.hasPassword && (
                                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
                                        Tài khoản của bạn đăng nhập qua mạng xã hội (Google/Facebook). Tính năng đổi mật khẩu không khả dụng.
                                    </div>
                                )}

                                {/* Current password */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Mật khẩu hiện tại</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPw ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            disabled={!profile?.hasPassword}
                                            className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="Nhập mật khẩu hiện tại"
                                        />
                                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                                            {showCurrentPw ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                </div>

                                {/* New password */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Mật khẩu mới</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPw ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            disabled={!profile?.hasPassword}
                                            className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="Ít nhất 6 ký tự"
                                        />
                                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                                            {showNewPw ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                    {/* Strength indicator */}
                                    {newPassword && (
                                        <div className="mt-1.5 flex gap-1">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${newPassword.length >= i * 3 ? (newPassword.length >= 9 ? "bg-emerald-500" : newPassword.length >= 6 ? "bg-amber-500" : "bg-red-400") : "bg-[var(--muted)]/20"}`} />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Confirm password */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Xác nhận mật khẩu mới</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPw ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            disabled={!profile?.hasPassword}
                                            className={`w-full px-4 py-2.5 pr-10 rounded-xl border bg-[var(--background)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmPassword && newPassword !== confirmPassword ? "border-red-400 focus:ring-red-400/30" : "border-[var(--border)] focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"}`}
                                            placeholder="Nhập lại mật khẩu mới"
                                        />
                                        <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                                            {showConfirmPw ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="mt-1 text-xs text-red-500">Mật khẩu xác nhận không khớp</p>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={handlePasswordChange}
                                        disabled={saving || !profile?.hasPassword || !currentPassword || !newPassword || !confirmPassword}
                                        className="px-6 py-2.5 bg-[var(--primary)] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                        {saving ? "Đang đổi..." : "Đổi mật khẩu"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
