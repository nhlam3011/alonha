import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  explore: [
    { href: "/bat-dong-san?loaiHinh=sale", label: "Mua bán" },
    { href: "/bat-dong-san?loaiHinh=rent", label: "Cho thuê" },
    { href: "/du-an", label: "Dự án" },
    { href: "/tim-kiem?view=map", label: "Bản đồ" },
  ],
  tools: [
    { href: "/cong-cu/tinh-vay", label: "Tính lãi vay" },
    { href: "/cong-cu/so-sanh", label: "So sánh BĐS" },
    { href: "/cong-cu/phong-thuy", label: "Phong thủy" },
  ],
  support: [
    { href: "/lien-he", label: "Liên hệ" },
    { href: "/huong-dan", label: "Hướng dẫn" },
    { href: "/dieu-khoan", label: "Điều khoản" },
    { href: "/chinh-sach", label: "Chính sách" },
  ],
};

const socialLinks = [
  { href: "#", label: "TikTok" },
  { href: "#", label: "Instagram" },
  { href: "#", label: "Zalo" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-[var(--border)]">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 orb orb-blue -translate-x-1/2 -translate-y-1/2 opacity-30" />
      <div className="absolute bottom-0 right-0 w-96 h-96 orb orb-cyan translate-x-1/2 translate-y-1/2 opacity-20" />

      {/* Main Footer */}
      <div className="layout-container relative z-10 py-16">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group mb-4">
              <div className="relative w-10 h-10">
                <Image
                  src="/logo.png"
                  alt="AloNha"
                  fill
                  sizes="40px"
                  className="object-contain relative z-10"
                />
              </div>
              <span className="text-xl font-bold">
                <span className="text-[var(--foreground)]">Alo</span>
                <span className="gradient-text">Nha</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-xs mb-6">
              Nền tảng bất động sản thông minh ứng dụng AI, giúp bạn tìm kiếm và kết nối nhanh chóng.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              {/* Explore */}
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">Khám phá</h3>
                <ul className="space-y-3">
                  {footerLinks.explore.map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tools */}
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">Công cụ</h3>
                <ul className="space-y-3">
                  {footerLinks.tools.map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">Hỗ trợ</h3>
                <ul className="space-y-3">
                  {footerLinks.support.map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Newsletter */}
            <div className="mt-12 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-[var(--foreground)] mb-1">Đăng ký nhận tin</h4>
                  <p className="text-sm text-[var(--muted-foreground)]">Nhận thông tin bất động sản mới nhất mỗi tuần</p>
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                  <input
                    type="email"
                    placeholder="Email của bạn"
                    className="flex-1 sm:w-64 px-4 py-3 text-sm bg-[var(--card)] border border-[var(--border)] rounded-xl focus:border-[var(--primary)] focus:outline-none transition-colors"
                  />
                  <button className="px-6 py-3 text-sm font-bold text-white rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] transition-colors whitespace-nowrap">
                    Đăng ký
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[var(--border)] relative z-10">
        <div className="layout-container py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[var(--muted-foreground)] text-center sm:text-left">
              © {currentYear} <span className="font-bold text-[var(--foreground)]">AloNha</span>. Cu Tien Nam
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-[var(--muted-foreground)]">Online</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
