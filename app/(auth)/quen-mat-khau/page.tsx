"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
        setLoading(false);
        return;
      }
      setSent(true);
      if (data.code) setError(`Mã OTP (chỉ dev): ${data.code}`);
    } catch {
      setError("Đã xảy ra lỗi. Thử lại sau.");
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 bg-[var(--background)]">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Kiểm tra email</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Nếu tồn tại tài khoản với email này, bạn sẽ nhận được mã OTP. Dùng mã để đặt lại mật khẩu.
        </p>
        {error && <p className="mt-2 text-sm text-[var(--warning)]">{error}</p>}
        <Link href="/dat-lai-mat-khau" className="mt-4 inline-block font-medium text-[var(--primary)] hover:underline">
          Nhập mã OTP và đặt lại mật khẩu →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 bg-[var(--background)]">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Quên mật khẩu</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Nhập email đăng ký để nhận mã OTP đặt lại mật khẩu.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div className="rounded-lg bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)]">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center py-2.5"
        >
          {loading ? "Đang gửi..." : "Gửi mã OTP"}
        </button>
      </form>
      <Link href="/dang-nhap" className="mt-4 block text-sm text-[var(--primary)] hover:underline">
        ← Quay lại đăng nhập
      </Link>
    </div>
  );
}
