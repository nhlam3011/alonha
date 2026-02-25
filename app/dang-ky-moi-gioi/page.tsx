"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterAgentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || undefined, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "object" ? "Dữ liệu không hợp lệ" : (data.error || "Đăng ký thất bại"));
        setLoading(false);
        return;
      }
      router.push("/dang-nhap?registered=agent");
    } catch {
      setError("Đã xảy ra lỗi. Thử lại sau.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Đăng ký tài khoản Môi giới</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Tài khoản Môi giới dùng để đăng tin bất động sản, quản lý tin, nạp ví và xem thống kê.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)]">
            Họ tên / Tên công ty
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-[var(--foreground)]">
            Số điện thoại
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)]">
            Mật khẩu (tối thiểu 6 ký tự)
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--primary)] py-2.5 font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Đăng ký Môi giới"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Đã có tài khoản?{" "}
        <Link href="/dang-nhap" className="font-medium text-[var(--primary)] hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
