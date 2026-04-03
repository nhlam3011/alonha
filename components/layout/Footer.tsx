"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useConfig } from "@/components/providers/ConfigProvider";

const footerLinks = {
  explore: [
    { href: "/bat-dong-san?loaiHinh=sale", label: "Mua bán" },
    { href: "/bat-dong-san?loaiHinh=rent", label: "Cho thuê" },
    { href: "/du-an", label: "Dự án" },
    { href: "/tim-kiem?view=map", label: "Bản đồ" },
  ],
  tools: [
    { href: "/cong-cu/tinh-vay", label: "Tính lãi vay" },
    { href: "/cong-cu/dinh-gia", label: "Định giá BĐS" },
    { href: "/cong-cu/so-sanh", label: "So sánh BĐS" },
    { href: "/cong-cu/dau-tu", label: "Phân tích đầu tư" },
    { href: "/cong-cu/phong-thuy", label: "Phong thủy" },
  ],
  support: [
    { href: "/lien-he", label: "Liên hệ" },
    { href: "/huong-dan", label: "Hướng dẫn" },
    { href: "/dieu-khoan", label: "Điều khoản" },
    { href: "/chinh-sach", label: "Chính sách" },
  ],
};

function FooterCollapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border)] sm:border-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 sm:px-0 py-4 sm:cursor-default sm:py-0 sm:pointer-events-none"
      >
        <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>
        <svg
          className={`block size-4 text-[var(--muted-foreground)] transition-transform duration-300 sm:hidden ${isOpen ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 sm:max-h-none px-3 sm:px-0 ${isOpen ? "max-h-96 pb-4" : "max-h-0 sm:mt-4"}`}>
        <ul className="space-y-3">
          {children}
        </ul>
      </div>
    </div>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { get } = useConfig();

  const companyName = get("company_name", "AloNha. Cu Tien Nam");
  const footerDesc = get("footer_description", "Nền tảng bất động sản thông minh ứng dụng AI, giúp bạn tìm kiếm và kết nối nhanh chóng.");
  const supportEmail = get("contact_email");

  const socialLinksDynamic = [
    { href: get("social_facebook", "#"), label: "Facebook" },
    { href: get("social_tiktok", "#"), label: "TikTok" },
    { href: get("social_instagram", "#"), label: "Instagram" },
    { href: get("social_zalo", "#"), label: "Zalo" },
  ].filter(s => s.href && s.href !== "#");

  useEffect(() => {
    // Initial theme detection
    const initialTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(initialTheme);

    // Watch for class changes on <html>
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <footer className="relative overflow-hidden border-t border-[var(--border)]">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 orb orb-blue -translate-x-1/2 -translate-y-1/2 opacity-30" />
      <div className="absolute bottom-0 right-0 w-96 h-96 orb orb-cyan translate-x-1/2 translate-y-1/2 opacity-20" />

      {/* Main Footer */}
      <div className="layout-container relative z-10 py-16">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2.5 group mb-4">
              <div className="relative w-32 h-10 bg-[var(--logo-bg)] rounded-md p-1">
                <Image
                  src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"}
                  alt="AloNha"
                  fill
                  sizes="128px"
                  className="object-contain relative z-10"
                />
              </div>
            </Link>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-sm mb-6">
              {footerDesc}
            </p>

            {/* Social Links */}
            <div className="flex flex-wrap items-center gap-2">
              {socialLinksDynamic.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
                >
                  {social.label}
                </a>
              ))}
              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}`}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
                >
                  Email
                </a>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 sm:gap-8 lg:gap-12">
              <FooterCollapsible title="Khám phá">
                {footerLinks.explore.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </FooterCollapsible>

              <FooterCollapsible title="Công cụ">
                {footerLinks.tools.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </FooterCollapsible>

              <FooterCollapsible title="Hỗ trợ">
                {footerLinks.support.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </FooterCollapsible>
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
              © {currentYear} <span className="font-bold text-[var(--foreground)]">{companyName}</span>
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
