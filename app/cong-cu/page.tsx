import Link from "next/link";

const tools = [
  {
    href: "/cong-cu/tinh-vay",
    title: "Tính lãi vay",
    desc: "Ước tính tiền trả hàng tháng, tổng lãi và lịch trả nợ chi tiết.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/cong-cu/so-sanh",
    title: "So sánh BĐS",
    desc: "So sánh trực tiếp các tin đăng về giá, diện tích, pháp lý.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: "/cong-cu/phong-thuy",
    title: "Xem phong thủy",
    desc: "Tra cứu Cung Mệnh Bát Trạch và hướng nhà phù hợp.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function ToolsPage() {
  return (
    <div className="layout-container page-section">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">Công cụ hỗ trợ</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">Các công cụ hữu ích cho quá trình tìm kiếm bất động sản</p>
        </div>

        {/* Tool Cards */}
        <div className="grid gap-5 sm:grid-cols-3">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--primary)]/30 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
                {t.icon}
              </div>
              <h2 className="mb-1 text-lg font-bold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                {t.title}
              </h2>
              <p className="flex-1 text-sm text-[var(--muted-foreground)]">{t.desc}</p>
              <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-[var(--primary)] opacity-0 transition-opacity group-hover:opacity-100">
                Sử dụng
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </span>
            </Link>
          ))}
        </div>

        {/* Notice */}
        <div className="mt-8 flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Lưu ý</h3>
            <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
              Kết quả tính toán và tra cứu chỉ mang tính chất tham khảo. Vui lòng liên hệ chuyên gia để được tư vấn chính xác.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
