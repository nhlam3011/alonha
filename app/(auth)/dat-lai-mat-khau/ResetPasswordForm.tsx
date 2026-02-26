"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Icons
const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>;
const LockIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>;
const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>;
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const KeyIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" /></svg>;

export default function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailFromQuery = searchParams?.get("email") ?? "";

    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (password.length < 6) {
            setError("Mật khẩu phải có ít nhất 6 ký tự.");
            return;
        }
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
                setError(data.error || "Đặt lại mật khẩu thất bại. Mã OTP có thể đã hết hạn.");
                setLoading(false);
                return;
            }
            setSuccess(true);
            setTimeout(() => router.push("/dang-nhap?reset=1"), 2000);
        } catch {
            setError("Đã xảy ra lỗi. Thử lại sau.");
            setLoading(false);
        }
    }

    if (!mounted) return null;

    if (success) {
        return (
            <div className="text-center animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm ring-8 ring-emerald-500/5">
                    <CheckCircleIcon className="w-10 h-10" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4 tracking-tight">
                    Mật khẩu đã được đặt lại!
                </h1>
                <p className="text-[var(--muted-foreground)] mb-8 leading-relaxed">
                    Tuyệt vời! Mật khẩu của bạn đã được cập nhật thành công. Đang chuyển hướng đến trang đăng nhập...
                </p>
                <div className="h-1 w-full bg-[var(--border)] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-[shimmer_2s_linear_forwards] w-full" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mb-6">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <KeyIcon className="w-6 h-6 lg:w-8 lg:h-8" />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--foreground)] mb-2 tracking-tight">
                    Đặt lại mật khẩu
                </h1>
                <p className="text-sm sm:text-base text-[var(--muted-foreground)]">
                    {emailFromQuery
                        ? <>Nhập mã OTP đã gửi đến <span className="font-medium text-[var(--foreground)]">{emailFromQuery}</span> và mật khẩu mới.</>
                        : "Nhập mã OTP đã gửi đến email và mật khẩu mới của bạn."
                    }
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
                        <svg className="w-5 h-5 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-4">
                    {/* OTP Code */}
                    <div>
                        <label htmlFor="code" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                            Mã OTP (6 ký tự)
                        </label>
                        <input
                            id="code"
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            required
                            placeholder="● ● ● ● ● ●"
                            maxLength={6}
                            className="w-full px-4 py-3.5 text-center text-xl font-bold tracking-[0.5em] rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/40 placeholder:tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                            Mật khẩu mới
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--muted-foreground)] group-focus-within:text-[var(--primary)] transition-colors">
                                <LockIcon className="w-5 h-5" />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Ít nhất 6 ký tự"
                                className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                        {/* Strength */}
                        {password && (
                            <div className="mt-2 flex gap-1.5">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${password.length >= i * 3 ? (password.length >= 9 ? "bg-emerald-500" : password.length >= 6 ? "bg-amber-500" : "bg-red-400") : "bg-[var(--muted)]/20"}`} />
                                ))}
                                <span className="text-xs text-[var(--muted-foreground)] ml-1">
                                    {password.length >= 9 ? "Mạnh" : password.length >= 6 ? "Trung bình" : "Yếu"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || code.length < 6 || password.length < 6}
                    className="group relative w-full flex items-center justify-center gap-2 py-3.5 px-4 text-sm font-bold text-white bg-[var(--primary)] rounded-xl hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--primary)]/25"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Đang xử lý...
                        </>
                    ) : (
                        <>
                            Đặt lại mật khẩu
                            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center pt-8 border-t border-[var(--border)]">
                <Link href="/dang-nhap" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    Trở lại đăng nhập
                </Link>
            </div>
        </>
    );
}
