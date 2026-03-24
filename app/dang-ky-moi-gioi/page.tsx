"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type AppStatus = {
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
  referralSource: string | null;
  selfIntro: string | null;
  status: string;
  adminNote: string | null;
  interviewDate: string | null;
  interviewLocation: string | null;
  createdAt: string;
  updatedAt: string;
};

const STEPS = ["personal", "experience", "terms"] as const;
const STEP_LABELS = { personal: "Thông tin cá nhân", experience: "Kinh nghiệm", terms: "Điều khoản" };

export default function RegisterAgentPage() {
  const { data: session, status: authStatus } = useSession();
  const [step, setStep] = useState<(typeof STEPS)[number]>("personal");
  const [existingApp, setExistingApp] = useState<AppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "", phone: "", email: "", idCardNumber: "", dateOfBirth: "",
    address: "", currentAddress: "", education: "", experience: "",
    currentJob: "", referralSource: "", selfIntro: "", agreedTerms: false,
  });

  const set = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  useEffect(() => {
    if (authStatus !== "authenticated") { setLoading(false); return; }
    fetch("/api/agent-application")
      .then(r => r.json())
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const active = res.data.find((a: any) => ["PENDING", "REVIEWING", "INTERVIEW"].includes(a.status));
          if (active) setExistingApp(active);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));

    if (session?.user) {
      setForm(p => ({
        ...p,
        fullName: p.fullName || (session.user as any)?.name || "",
        email: p.email || (session.user as any)?.email || "",
      }));
    }
  }, [authStatus, session]);

  const validate = () => {
    if (step === "personal") {
      if (!form.fullName.trim()) return "Vui lòng nhập họ tên đầy đủ.";
      if (!form.phone.trim()) return "Vui lòng nhập số điện thoại.";
      if (!form.email.trim()) return "Vui lòng nhập email.";
      if (!form.idCardNumber.trim()) return "Vui lòng nhập số CCCD/CMND.";
      if (!form.address.trim()) return "Vui lòng nhập địa chỉ thường trú.";
    }
    if (step === "terms" && !form.agreedTerms) {
      return "Vui lòng đồng ý với điều khoản hợp đồng.";
    }
    return null;
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const handleBack = () => {
    setError("");
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/agent-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gửi đơn thất bại.");
      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/20">
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Yêu cầu đăng nhập</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Vui lòng đăng nhập trước khi đăng ký trở thành môi giới.</p>
        <Link href="/dang-nhap?callbackUrl=/dang-ky-moi-gioi" className="mt-6 inline-block rounded-xl bg-[var(--primary)] px-8 py-3 font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  if ((session?.user as any)?.role === "AGENT") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Bạn đã là Môi giới!</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Tài khoản của bạn đã được cấp quyền môi giới.</p>
        <Link href="/moi-gioi" className="mt-6 inline-block rounded-xl bg-[var(--primary)] px-8 py-3 font-bold text-white hover:opacity-90 transition-opacity">
          Đến trang quản lý →
        </Link>
      </div>
    );
  }

  if (existingApp) {
    const statusMap: Record<string, { label: string; color: string; icon: string }> = {
      PENDING: { label: "Đang chờ duyệt", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800", icon: "⏳" },
      REVIEWING: { label: "Đang xem xét", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800", icon: "🔍" },
      INTERVIEW: { label: "Hẹn phỏng vấn", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800", icon: "📅" },
      APPROVED: { label: "Đã duyệt", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", icon: "✅" },
      REJECTED: { label: "Từ chối", color: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800", icon: "❌" },
    };
    const s = statusMap[existingApp.status] || statusMap.PENDING;

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Đơn đăng ký Môi giới</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Xem chi tiết trạng thái và thông tin hồ sơ của bạn</p>
        </div>

        <div className={`rounded-2xl border p-6 ${s.color} mb-6`}>
          <div className="text-center">
            <span className="text-4xl">{s.icon}</span>
            <h2 className="mt-4 text-xl font-bold">{s.label}</h2>
            <p className="mt-2 text-sm opacity-80">
              Đơn đăng ký của bạn {existingApp.status === "APPROVED" ? "đã được duyệt" : existingApp.status === "REJECTED" ? "không được chấp nhận" : "đang được xử lý"}. {existingApp.status !== "APPROVED" && existingApp.status !== "REJECTED" && "Chúng tôi sẽ liên hệ sớm nhất."}
            </p>
          </div>
        </div>

        {/* Thông tin hồ sơ đã nộp */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 mb-6">
          <h3 className="font-bold text-lg text-[var(--foreground)] mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Thông tin hồ sơ đã nộp
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div><span className="text-[var(--muted-foreground)]">Họ tên:</span><p className="font-medium">{existingApp.fullName}</p></div>
            <div><span className="text-[var(--muted-foreground)]">SĐT:</span><p className="font-medium">{existingApp.phone}</p></div>
            <div><span className="text-[var(--muted-foreground)]">Email:</span><p className="font-medium">{existingApp.email}</p></div>
            <div><span className="text-[var(--muted-foreground)]">CCCD:</span><p className="font-medium font-mono">{existingApp.idCardNumber}</p></div>
            {existingApp.dateOfBirth && <div><span className="text-[var(--muted-foreground)]">Ngày sinh:</span><p className="font-medium">{new Date(existingApp.dateOfBirth).toLocaleDateString("vi-VN")}</p></div>}
            {existingApp.currentJob && <div><span className="text-[var(--muted-foreground)]">Công việc:</span><p className="font-medium">{existingApp.currentJob}</p></div>}
            {existingApp.education && <div><span className="text-[var(--muted-foreground)]">Trình độ:</span><p className="font-medium">{existingApp.education}</p></div>}
            {existingApp.experience && <div><span className="text-[var(--muted-foreground)]">Kinh nghiệm:</span><p className="font-medium">{existingApp.experience}</p></div>}
          </div>
          <div className="mt-4"><span className="text-[var(--muted-foreground)] text-sm">Địa chỉ thường trú:</span><p className="font-medium text-sm">{existingApp.address}</p></div>
          {existingApp.currentAddress && <div className="mt-2"><span className="text-[var(--muted-foreground)] text-sm">Địa chỉ hiện tại:</span><p className="font-medium text-sm">{existingApp.currentAddress}</p></div>}
          {existingApp.referralSource && <div className="mt-2"><span className="text-[var(--muted-foreground)] text-sm">Nguồn giới thiệu:</span><p className="font-medium text-sm">{existingApp.referralSource}</p></div>}
          {existingApp.selfIntro && <div className="mt-2"><span className="text-[var(--muted-foreground)] text-sm">Giới thiệu bản thân:</span><p className="font-medium text-sm leading-relaxed">{existingApp.selfIntro}</p></div>}
        </div>

        {/* Lịch hẹn phỏng vấn */}
        {existingApp.interviewDate && (
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-6 mb-6">
            <h3 className="font-bold text-indigo-700 dark:text-indigo-300 mb-3 flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Lịch hẹn phỏng vấn
            </h3>
            <div className="text-sm">
              <p className="font-semibold text-indigo-800 dark:text-indigo-200">
                📅 {new Date(existingApp.interviewDate).toLocaleString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
              {existingApp.interviewLocation && <p className="mt-2 text-indigo-700 dark:text-indigo-300">📍 {existingApp.interviewLocation}</p>}
            </div>
          </div>
        )}

        {/* Ghi chú từ admin */}
        {existingApp.adminNote && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30 p-6 mb-6">
            <h3 className="font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
              Ghi chú từ Quản trị viên
            </h3>
            <p className="text-sm text-[var(--foreground)] leading-relaxed">{existingApp.adminNote}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Lịch sử
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">Ngày nộp đơn:</span>
              <span className="font-medium">{new Date(existingApp.createdAt).toLocaleString("vi-VN")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">Cập nhật cuối:</span>
              <span className="font-medium">{new Date(existingApp.updatedAt).toLocaleString("vi-VN")}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-lg">
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Gửi đơn thành công!</h1>
        <p className="mt-3 text-[var(--muted-foreground)] max-w-sm mx-auto">
          Đơn đăng ký của bạn đã được tiếp nhận. Quản trị viên sẽ xem xét và liên hệ bạn trong thời gian sớm nhất.
        </p>
        <Link href="/" className="mt-8 inline-block rounded-xl bg-[var(--primary)] px-8 py-3 font-bold text-white hover:opacity-90 transition-opacity">
          Về trang chủ
        </Link>
      </div>
    );
  }

  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/20">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Đăng ký trở thành Môi giới</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-md mx-auto">
          Điền đầy đủ thông tin để gửi hồ sơ. Sau khi duyệt, bạn sẽ được mời phỏng vấn tại văn phòng.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => { if (i <= stepIdx) setStep(s); }}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${i === stepIdx
                ? "bg-[var(--primary)] text-white shadow-lg shadow-blue-500/20"
                : i < stepIdx
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {i < stepIdx ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
            </button>
            {i < STEPS.length - 1 && <div className={`w-8 h-0.5 mx-1 ${i < stepIdx ? "bg-emerald-400" : "bg-[var(--border)]"}`} />}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Form Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-sm">
        {step === "personal" && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-sm">1</span>
              Thông tin cá nhân
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Họ tên đầy đủ <span className="text-red-500">*</span></label>
                <input value={form.fullName} onChange={e => set("fullName", e.target.value)} required className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all" placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} required className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all" placeholder="0912 345 678" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Email <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} required className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Số CCCD/CMND <span className="text-red-500">*</span></label>
                <input value={form.idCardNumber} onChange={e => set("idCardNumber", e.target.value)} required className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all" placeholder="012345678901" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Ngày sinh</label>
                <input type="date" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Công việc hiện tại</label>
                <input value={form.currentJob} onChange={e => set("currentJob", e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all" placeholder="Nhân viên kinh doanh" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Địa chỉ thường trú <span className="text-red-500">*</span></label>
              <input value={form.address} onChange={e => set("address", e.target.value)} required className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all" placeholder="123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Địa chỉ hiện tại</label>
              <input value={form.currentAddress} onChange={e => set("currentAddress", e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all" placeholder="Nếu khác địa chỉ thường trú" />
            </div>
          </div>
        )}

        {step === "experience" && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 text-sm">2</span>
              Kinh nghiệm & Trình độ
            </h2>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Trình độ học vấn</label>
              <select value={form.education} onChange={e => set("education", e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all">
                <option value="">-- Chọn --</option>
                <option value="THPT">Trung học phổ thông</option>
                <option value="Trung cấp">Trung cấp</option>
                <option value="Cao đẳng">Cao đẳng</option>
                <option value="Đại học">Đại học</option>
                <option value="Sau đại học">Sau đại học</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Kinh nghiệm bất động sản</label>
              <select value={form.experience} onChange={e => set("experience", e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all">
                <option value="">-- Chọn --</option>
                <option value="Chưa có">Chưa có kinh nghiệm</option>
                <option value="Dưới 1 năm">Dưới 1 năm</option>
                <option value="1-3 năm">1 - 3 năm</option>
                <option value="3-5 năm">3 - 5 năm</option>
                <option value="Trên 5 năm">Trên 5 năm</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Biết đến Alonha qua đâu?</label>
              <select value={form.referralSource} onChange={e => set("referralSource", e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all">
                <option value="">-- Chọn --</option>
                <option value="Facebook">Facebook</option>
                <option value="Google">Google</option>
                <option value="Bạn bè giới thiệu">Bạn bè giới thiệu</option>
                <option value="Sự kiện">Sự kiện BĐS</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Giới thiệu bản thân</label>
              <textarea value={form.selfIntro} onChange={e => set("selfIntro", e.target.value)} rows={4} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all resize-none" placeholder="Chia sẻ về bản thân, lý do muốn trở thành môi giới, mục tiêu nghề nghiệp..." />
            </div>
          </div>
        )}

        {step === "terms" && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 text-sm">3</span>
              Điều khoản Hợp đồng
            </h2>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-5 max-h-[400px] overflow-y-auto text-sm text-[var(--foreground)] space-y-4 leading-relaxed">
              <h3 className="font-bold text-base">ĐIỀU KHOẢN HỢP ĐỒNG MÔI GIỚI BẤT ĐỘNG SẢN</h3>

              <div>
                <h4 className="font-semibold">Điều 1: Quyền và Nghĩa vụ của Môi giới</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-[var(--muted-foreground)]">
                  <li>Được quyền đăng tin bất động sản trên nền tảng Alonha.</li>
                  <li>Sử dụng các công cụ quản lý tin đăng, ví điện tử, và gói dịch vụ VIP.</li>
                  <li>Tuân thủ quy định về đăng tin: thông tin chính xác, không vi phạm pháp luật.</li>
                  <li>Không sử dụng thông tin khách hàng cho mục đích ngoài giao dịch BĐS.</li>
                  <li>Chịu trách nhiệm về tính chính xác của thông tin bất động sản đăng tải.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">Điều 2: Quy trình Duyệt Hồ sơ</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-[var(--muted-foreground)]">
                  <li>Hồ sơ sau khi gửi sẽ được quản trị viên xem xét trong vòng 3-5 ngày làm việc.</li>
                  <li>Ứng viên có thể được mời phỏng vấn trực tiếp tại văn phòng hoặc trực tuyến.</li>
                  <li>Quyết định cuối cùng thuộc về ban quản trị Alonha.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">Điều 3: Phí Dịch vụ</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-[var(--muted-foreground)]">
                  <li>Đăng ký tài khoản môi giới hoàn toàn miễn phí.</li>
                  <li>Các gói dịch vụ VIP, đẩy tin sẽ được thanh toán qua ví điện tử trên nền tảng.</li>
                  <li>Phí dịch vụ có thể thay đổi theo chính sách của công ty.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">Điều 4: Bảo mật Thông tin</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-[var(--muted-foreground)]">
                  <li>Thông tin cá nhân của môi giới được bảo mật theo Luật An ninh mạng Việt Nam.</li>
                  <li>Alonha cam kết không chia sẻ thông tin cá nhân cho bên thứ ba không liên quan.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">Điều 5: Vi phạm và Xử lý</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-[var(--muted-foreground)]">
                  <li>Đăng tin sai sự thật, spam, hoặc vi phạm pháp luật sẽ bị cảnh cáo hoặc khoá tài khoản.</li>
                  <li>Alonha có quyền thu hồi quyền môi giới nếu vi phạm điều khoản.</li>
                </ul>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.agreedTerms}
                onChange={e => set("agreedTerms", e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-[var(--border)] accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--foreground)] leading-snug">
                Tôi đã đọc, hiểu và <strong>đồng ý</strong> với tất cả các điều khoản hợp đồng nêu trên. Tôi cam kết cung cấp thông tin chính xác và tuân thủ quy định của Alonha.
              </span>
            </label>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {stepIdx > 0 ? (
            <button onClick={handleBack} className="flex items-center gap-1 rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Quay lại
            </button>
          ) : <div />}

          {stepIdx < STEPS.length - 1 ? (
            <button onClick={handleNext} className="flex items-center gap-1 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20">
              Tiếp tục
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || !form.agreedTerms} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50">
              {submitting ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Đang gửi...</>
              ) : (
                <>Gửi hồ sơ đăng ký</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: "📋", title: "Bước 1", desc: "Gửi hồ sơ đăng ký online" },
          { icon: "🤝", title: "Bước 2", desc: "Phỏng vấn tại văn phòng" },
          { icon: "🎉", title: "Bước 3", desc: "Trở thành môi giới Alonha" },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
            <span className="text-2xl">{item.icon}</span>
            <p className="mt-2 text-sm font-bold text-[var(--foreground)]">{item.title}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
