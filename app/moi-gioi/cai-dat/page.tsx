"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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
    </div>
  );
}
