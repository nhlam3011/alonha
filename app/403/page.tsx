import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Không có quyền truy cập</h1>
      <p className="mt-2 text-center text-[var(--muted)]">
        Trang này chỉ dành cho quản trị viên hoặc tài khoản có quyền tương ứng.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white hover:bg-[var(--primary-hover)]"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
