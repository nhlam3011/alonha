"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Đặt lại mật khẩu thất bại");
        setLoading(false);
        return;
      }
      router.push("/dang-nhap?reset=1");
    } catch {
      setError("Đã xảy ra lỗi. Thử lại sau.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 bg-[var(--background)]">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Đặt lại mật khẩu</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">Nhập mã OTP đã gửi đến email và mật khẩu mới.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div className="rounded-lg bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)]">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="code" className="form-label">
            Mã OTP
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder="6 ký tự"
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor="password" className="form-label">
            Mật khẩu mới (tối thiểu 6 ký tự)
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="form-input"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center py-2.5"
        >
          {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </button>
      </form>
      <Link href="/dang-nhap" className="mt-4 block text-sm text-[var(--primary)] hover:underline">
        ← Quay lại đăng nhập
      </Link>
    </div>
  );
}
