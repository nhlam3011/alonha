"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Icons mapped for notifications (lucide-react equivalents using inline SVGs for stability)
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>;
const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const WalletIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>;
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;

type ProfileResponse = {
  id: string; email: string | null; name: string;
  phone: string | null; avatar: string | null; role: string;
};

export default function MoiGioiCaiDatPage() {
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true); setError(null);
    fetch("/api/user/profile")
      .then(r => r.json())
      .then((data: ProfileResponse & { error?: string }) => {
        if (data.error) throw new Error(data.error);
        setName(data.name || ""); setPhone(data.phone || ""); setAvatar(data.avatar || "");
      })
      .catch(err => setError(err instanceof Error ? err.message : "Lỗi tải hồ sơ."))
      .finally(() => setLoading(false));
  }, [status]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setSavingProfile(true); setError(null); setMessage(null);
    try {
      const res = await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone: phone || null, avatar: avatar || null }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Lỗi.");
      setMessage("Cập nhật hồ sơ thành công.");
    } catch (err: any) { setError(err?.message); }
    finally { setSavingProfile(false); }
  }

  async function handleAvatarFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true); setError(null); setMessage(null);
    try {
      const formData = new FormData(); formData.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) throw new Error(data.error || "Lỗi upload.");
      setAvatar(String(data.url));
      setMessage("Đã tải ảnh, bấm Lưu để cập nhật.");
    } catch { setError("Không thể tải ảnh."); }
    finally { setUploadingAvatar(false); event.target.value = ""; }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận không khớp."); return; }
    setSavingPassword(true); setError(null); setMessage(null);
    try {
      const res = await fetch("/api/user/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Lỗi đổi mật khẩu.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setMessage(data.message || "Đổi mật khẩu thành công.");
    } catch (err: any) { setError(err?.message); }
    finally { setSavingPassword(false); }
  }

  if (status === "unauthenticated") return null;

  const inp = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  return (
    <div className="page-container max-w-4xl">
      <header>
        <h1 className="page-title">Cài đặt tài khoản</h1>
        <p className="page-subtitle">Cập nhật hồ sơ cá nhân và bảo mật.</p>
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400">{message}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden h-fit">
          <div className="border-b border-[var(--border)] px-5 py-3.5">
            <h2 className="font-semibold text-[var(--foreground)]">Thông tin hồ sơ</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Hiển thị trên các tin đăng của bạn</p>
          </div>
          <div className="p-5">
            <form onSubmit={saveProfile} className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-16 w-16 animate-pulse rounded-full bg-[var(--muted)]" />
                  <div className="h-10 animate-pulse rounded-lg bg-[var(--muted)]" />
                  <div className="h-10 animate-pulse rounded-lg bg-[var(--muted)]" />
                </div>
              ) : (
                <>
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[var(--border)] bg-[var(--muted)] group">
                      {avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                      )}
                    </div>
                    <label className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} disabled={uploadingAvatar} />
                      {uploadingAvatar ? "Đang tải..." : "Đổi ảnh"}
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Tên hiển thị</label>
                    <input required value={name} onChange={e => setName(e.target.value)} className={inp} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Số điện thoại</label>
                      <input value={phone} onChange={e => setPhone(e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Email</label>
                      <input value={session?.user?.email || ""} readOnly className={`${inp} bg-[var(--muted)]/50 text-[var(--muted-foreground)]`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">URL ảnh đại diện</label>
                    <input value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://..." className={inp} />
                  </div>
                  <button type="submit" disabled={savingProfile} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {savingProfile ? "Đang lưu..." : "Lưu hồ sơ"}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>

        {/* Password */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden h-fit">
          <div className="border-b border-[var(--border)] px-5 py-3.5">
            <h2 className="font-semibold text-[var(--foreground)]">Bảo mật</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Thay đổi mật khẩu đăng nhập</p>
          </div>
          <div className="p-5">
            <form onSubmit={changePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Mật khẩu hiện tại</label>
                <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Mật khẩu mới</label>
                <input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Xác nhận mật khẩu</label>
                <input type="password" required minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inp} />
              </div>
              <button type="submit" disabled={savingPassword} className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-50 transition-colors">
                {savingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden h-fit">
        <div className="border-b border-[var(--border)] px-5 py-3.5">
          <h2 className="font-semibold text-[var(--foreground)]">Cài đặt thông báo</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Nhận thông báo qua email</p>
        </div>
        <NotificationSettings />
      </div>
    </div>
  );
}

// Notification Settings Component
function NotificationSettings() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/notifications/settings")
      .then(r => r.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status]);

  async function updateSetting(key: string, value: boolean) {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value })
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
        setMessage("Đã cập nhật!");
        setTimeout(() => setMessage(null), 2000);
      }
    } catch { }
    setSaving(false);
  }

  if (loading || !settings) return <div className="p-5 text-sm text-[var(--muted)]">Đang tải...</div>;

  const items = [
    { key: "listingApproved", label: "Tin đăng được duyệt", icon: <CheckCircleIcon className="w-4 h-4" /> },
    { key: "listingRejected", label: "Tin đăng bị từ chối", icon: <XCircleIcon className="w-4 h-4" /> },
    { key: "listingNew", label: "Tin đăng mới", icon: <HomeIcon className="w-4 h-4" /> },
    { key: "listingExpiring", label: "Tin đăng sắp hết hạn", icon: <ClockIcon className="w-4 h-4" /> },
    { key: "appointmentNew", label: "Lịch xem nhà mới", icon: <CalendarIcon className="w-4 h-4" /> },
    { key: "leadNew", label: "Khách hàng tiềm năng mới", icon: <UserIcon className="w-4 h-4" /> },
    { key: "payment", label: "Thanh toán", icon: <WalletIcon className="w-4 h-4" /> },
    { key: "savedSearch", label: "Tin phù hợp với tìm kiếm", icon: <SearchIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="p-5">
      {message && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400">
          {message}
        </div>
      )}

      {/* Main Email Toggle */}
      <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">Nhận thông báo qua email</h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Gửi thông báo quan trọng đến <span className="text-blue-600 dark:text-blue-400">{session?.user?.email}</span></p>
          </div>
          <button
            onClick={() => updateSetting("emailEnabled", !settings.emailEnabled)}
            disabled={saving}
            className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer ${settings.emailEnabled ? "bg-[var(--primary)]" : "bg-[var(--muted)]/30"
              }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${settings.emailEnabled ? "translate-x-5" : "translate-x-0"
                }`}
            />
          </button>
        </div>
      </div>

      <div className={`space-y-4 transition-opacity duration-300 ${!settings.emailEnabled ? "opacity-50 pointer-events-none" : ""}`}>
        <p className="font-semibold text-[var(--foreground)]">Chi tiết loại thông báo:</p>

        <div className="grid gap-3">
          {items.map((item) => {
            const isEnabled = settings[item.key] === true;
            return (
              <div key={item.key} className="flex items-center justify-between py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-[var(--foreground)] font-medium text-sm">{item.label}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => updateSetting(item.key, e.target.checked)}
                    disabled={saving || !settings.emailEnabled}
                    className="sr-only peer"
                  />
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${isEnabled ? "bg-[var(--primary)]" : "bg-[var(--muted)]/30"} ${!settings.emailEnabled ? "opacity-50" : "peer-focus:ring-4 peer-focus:ring-[var(--primary)]/20"}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
