"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Icons
const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>;
const MailIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
const KeyIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" /></svg>;
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [devCode, setDevCode] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

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
            if (data.code) {
                setDevCode(`Mã OTP (chỉ dev): ${data.code}`);
            }
        } catch {
            setError("Đã xảy ra lỗi. Thử lại sau.");
        }
        setLoading(false);
    }

    if (!mounted) return null;

    if (sent) {
        return (
            <div className="text-center animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm ring-8 ring-emerald-500/5">
                    <CheckCircleIcon className="w-10 h-10" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4 tracking-tight">
                    Mã đã được gửi!
                </h1>
                <p className="text-[var(--muted-foreground)] mb-8 leading-relaxed">
                    Chúng tôi đã gửi một mã OTP gồm 6 chữ số đến email <span className="font-medium text-[var(--foreground)]">{email}</span>. Vui lòng kiểm tra hộp thư đến hoặc mục thư rác.
                </p>

                {devCode && (
                    <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl text-sm font-mono text-left">
                        {devCode}
                    </div>
                )}

                <Link
                    href={`/dat-lai-mat-khau?email=${encodeURIComponent(email)}`}
                    className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 text-sm font-bold text-white bg-[var(--primary)] rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--primary)]/25"
                >
                    Nhập mã bảo mật
                    <ArrowRightIcon className="w-4 h-4" />
                </Link>

                <p className="mt-8 text-sm text-[var(--muted-foreground)]">
                    Không nhận được email? <button onClick={() => setSent(false)} className="font-bold text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors">Thử lại</button>
                </p>
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
                    Quên mật khẩu?
                </h1>
                <p className="text-sm sm:text-base text-[var(--muted-foreground)]">
                    Nhập địa chỉ email liên kết với tài khoản của bạn để nhận mã khôi phục.
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
                    {/* Email Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--muted-foreground)] group-focus-within:text-[var(--primary)] transition-colors">
                            <MailIcon className="w-5 h-5" />
                        </div>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Địa chỉ Email của bạn"
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !email}
                    className="group relative w-full flex items-center justify-center gap-2 py-3.5 px-4 text-sm font-bold text-white bg-[var(--primary)] rounded-xl hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--primary)]/25"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Đang gửi mã...
                        </>
                    ) : (
                        <>
                            Gửi mã khôi phục
                            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            {/* Footer Info */}
            <div className="mt-8 text-center pt-8 border-t border-[var(--border)]">
                <Link href="/dang-nhap" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    Trở lại đăng nhập
                </Link>
            </div>
        </>
    );
}
