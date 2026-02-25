import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="layout-container page-section">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Liên hệ</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Đội ngũ hỗ trợ luôn sẵn sàng đồng hành cùng bạn
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-[var(--primary-light)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Hotline</p>
              </div>
              <p className="text-xl font-bold text-[var(--foreground)]">1900 6868</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">8:00 - 21:00 hàng ngày</p>
            </div>
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-[var(--primary-light)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Email</p>
              </div>
              <p className="text-xl font-bold text-[var(--foreground)]">support@alonha.vn</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Phản hồi trong 24h</p>
            </div>
          </div>

          <div className="mt-6 p-5 rounded-xl bg-[var(--surface)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[var(--primary-light)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Trụ sở chính</p>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Tầng 8, Tòa nhà ABC, 123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh
            </p>
          </div>

          <div className="mt-8">
            <Link
              href="/dang-tin"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:bg-[var(--primary-dark)] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" x2="12" y1="18" y2="12" />
                <line x1="9" x2="15" y1="15" y2="12" />
              </svg>
              Đăng tin ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
