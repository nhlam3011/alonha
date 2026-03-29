import Link from "next/link";

const tools = [
  {
    href: "/cong-cu/tinh-vay",
    title: "Tính lãi vay",
    desc: "Ước tính tiền trả hàng tháng, tổng lãi và lịch trả nợ chi tiết dành cho các khoản vay mua nhà, thế chấp bất động sản.",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "var(--primary)",
    bgColor: "var(--primary-light)",
  },
  {
    href: "/cong-cu/so-sanh",
    title: "So sánh BĐS",
    desc: "So sánh trực tiếp các tin đăng về giá cả, diện tích, pháp lý và thiết kế để chọn ra căn nhà ưng ý nhất.",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: "var(--accent)",
    bgColor: "var(--muted)",
  },
  {
    href: "/cong-cu/phong-thuy",
    title: "Xem phong thủy",
    desc: "Tra cứu Cung Mệnh Bát Trạch và hướng nhà phù hợp với tuổi của bạn theo quan niệm phong thủy Á Đông.",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "#16a34a",
    bgColor: "rgba(22, 163, 74, 0.1)",
  },
  {
    href: "/cong-cu/dinh-gia",
    title: "AI Định giá BĐS",
    desc: "Nhập thông tin bất động sản để AI ước tính giá trị thực, so sánh mặt bằng khu vực và phân tích xu hướng giá thị trường.",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    color: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.1)",
  },
  {
    href: "/cong-cu/diem-so-khu-vuc",
    title: "Điểm số Khu vực",
    desc: "Đánh giá tổng hợp khu vực về an ninh, giao thông, giáo dục, y tế, thương mại, môi trường và giá trị BĐS.",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: "#06b6d4",
    bgColor: "rgba(6, 182, 212, 0.1)",
  },
  {
    href: "/cong-cu/dau-tu",
    title: "AI Phân tích Đầu tư",
    desc: "Phân tích tiềm năng đầu tư: ROI, tỷ suất cho thuê, so sánh với ngân hàng/vàng/chứng khoán và chiến lược tối ưu.",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.1)",
  },
];

export default function ToolsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] lg:text-3xl">Tổng quan công cụ</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Khám phá bộ công cụ thông minh giúp bạn đưa ra quyết định chính xác hơn trong giao dịch bất động sản.</p>
      </div>

      {/* Tool Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/40 hover:shadow-xl hover:shadow-[var(--primary)]/5"
          >
            <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-20" style={{ backgroundColor: t.color }} />

            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: t.bgColor, color: t.color }}>
              {t.icon}
            </div>

            <h2 className="mb-2 text-lg font-bold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
              {t.title}
            </h2>
            <p className="flex-1 text-sm leading-relaxed text-[var(--muted-foreground)]">{t.desc}</p>

            <div className="mt-6 flex items-center text-sm font-semibold transition-colors" style={{ color: t.color }}>
              Bắt đầu ngay
              <svg className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Notice */}
      <div className="flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <h3 className="mb-1 text-sm font-bold text-[var(--foreground)]">Lưu ý quan trọng</h3>
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
            Kết quả tính toán và tra cứu từ các công cụ trên chỉ mang tính chất tham khảo dựa trên thuật toán và hệ thống dữ liệu hiện có. Bạn nên làm việc trực tiếp với chuyên gia tài chính hoặc chuyên gia phong thủy để có được tư vấn chính xác nhất.
          </p>
        </div>
      </div>
    </div>
  );
}
