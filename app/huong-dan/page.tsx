import Link from "next/link";

const steps = [
  "Tạo tài khoản và hoàn thiện hồ sơ cá nhân.",
  "Tìm kiếm bất động sản bằng bộ lọc hoặc AI gợi ý.",
  "Lưu tin quan tâm, so sánh và đặt lịch xem nhà.",
  "Kiểm tra pháp lý, thương lượng và giao dịch an toàn.",
];

export default function GuidePage() {
  return (
    <div className="layout-container page-section">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Hướng dẫn sử dụng</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Bắt đầu nhanh với các bước cơ bản để tìm, lưu và giao dịch bất động sản trên AloNha.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
          <ol className="space-y-4">
            {steps.map((item, idx) => (
              <li
                key={item}
                className="flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)] text-sm font-bold text-[var(--primary)]">
                  {idx + 1}
                </span>
                <span className="text-base text-[var(--foreground)] pt-1">{item}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 pt-6 border-t border-[var(--border)]">
            <Link
              href="/cong-cu"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"
            >
              Khám phá thêm công cụ hỗ trợ giao dịch
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
