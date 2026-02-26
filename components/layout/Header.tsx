"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
  { href: "/bat-dong-san", label: "Bất động sản" },
  { href: "/tim-kiem", label: "Bản đồ" },
  { href: "/du-an", label: "Dự án" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/cong-cu", label: "Công cụ" },
];

const CAN_POST_LISTING = ["AGENT", "BUSINESS", "ADMIN"];
function canPostListing(role?: string) {
  return !!role && CAN_POST_LISTING.includes(role);
}

export function Header() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef<number>(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const role = session?.user?.role as string | undefined;
  const isAgentPortalUser = canPostListing(role);
  const isAdminUser = role === "ADMIN";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 10);
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${hidden ? "-translate-y-full" : "translate-y-0"
        }`}
    >
      {/* Navbar container */}
      <div
        className={`transition-all duration-500 ${scrolled
          ? "bg-[var(--background)]/80 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.08)] border-b border-[var(--border)]/60"
          : "bg-[var(--background)]"
          }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-[64px] lg:h-[72px]">

            {/* ========== Logo ========== */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="relative w-9 h-9 lg:w-10 lg:h-10 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="AloNha"
                  fill
                  sizes="40px"
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl lg:text-[22px] font-extrabold tracking-tight">
                <span className="text-[var(--foreground)]">Alo</span>
                <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">Nha</span>
              </span>
            </Link>

            {/* ========== Desktop Nav — Center ========== */}
            <nav className="hidden lg:flex items-center gap-1 bg-[var(--muted)]/60 rounded-full px-2 py-1.5 mx-6">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-4 py-1.5 text-[15px] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)] rounded-full transition-all duration-200 whitespace-nowrap"
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* ========== Right Actions ========== */}
            <div className="flex items-center gap-1.5 sm:gap-2">

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Đăng tin CTA */}
              {canPostListing(session?.user?.role) && (
                <Link
                  href="/dang-tin"
                  className="hidden sm:inline-flex items-center gap-1.5 h-10 px-5 text-sm font-bold text-white rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:shadow-lg hover:shadow-[var(--primary)]/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Đăng tin
                </Link>
              )}

              {/* User Button */}
              {status === "loading" ? (
                <div className="w-10 h-10 rounded-full bg-[var(--muted)] animate-pulse" />
              ) : session?.user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex items-center rounded-full transition-all duration-200 ${userMenuOpen
                      ? "lg:border-[var(--primary)]/40 lg:bg-[var(--primary)]/5 lg:shadow-md"
                      : "lg:border-[var(--border)] lg:hover:border-[var(--primary)]/30 lg:hover:shadow-md lg:bg-[var(--card)]"
                      } w-9 h-9 justify-center lg:w-auto lg:h-10 lg:pl-1 lg:pr-3 lg:justify-start lg:gap-2 lg:border-2`}
                  >
                    <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ring-2 ring-[var(--border)]">
                      {session.user.image ? (
                        <img src={session.user.image} alt={session.user.name ?? ""} className="w-full h-full object-cover" />
                      ) : (
                        session.user.name?.[0]?.toUpperCase() ?? "U"
                      )}
                    </div>
                    <span className="hidden lg:block text-sm font-semibold text-[var(--foreground)] max-w-[100px] truncate">
                      {session.user.name}
                    </span>
                    <svg className={`hidden lg:block w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-3 w-56 rounded-2xl bg-[var(--card)] border border-[var(--border)] py-2 shadow-2xl shadow-black/10 animate-fade-in">
                      {/* User card */}
                      <div className="flex items-center gap-3 px-4 py-3 mx-2 mb-1 rounded-xl bg-gradient-to-r from-[var(--primary)]/5 to-[var(--secondary)]/5 border border-[var(--border)]/50">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white overflow-hidden ring-2 ring-[var(--border)]">
                          {session.user.image ? (
                            <img src={session.user.image} alt={session.user.name ?? ""} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-sm font-semibold">{session.user.name?.[0]?.toUpperCase() ?? "U"}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[var(--foreground)] truncate">{session.user.name}</p>
                          <p className="text-[11px] text-[var(--muted-foreground)] truncate mt-0.5">{session.user.email}</p>
                        </div>
                      </div>

                      <div className="py-1">
                        {isAgentPortalUser ? (
                          <>
                            <MenuLink href="/moi-gioi" label="Bảng điều khiển" onClick={() => setUserMenuOpen(false)} />
                            <MenuLink href="/moi-gioi/tin-dang" label="Quản lý tin đăng" onClick={() => setUserMenuOpen(false)} />
                            <MenuLink href="/moi-gioi/vi" label="Ví tiền" onClick={() => setUserMenuOpen(false)} />
                          </>
                        ) : (
                          <>
                            <MenuLink href="/tai-khoan" label="Tài khoản của tôi" onClick={() => setUserMenuOpen(false)} />
                            <MenuLink href="/tai-khoan/yeu-thich" label="Tin đã lưu" onClick={() => setUserMenuOpen(false)} />
                            <MenuLink href="/tai-khoan/lich-hen" label="Lịch hẹn" onClick={() => setUserMenuOpen(false)} />
                            <MenuLink href="/nang-cap-tai-khoan" label="Nâng cấp môi giới" onClick={() => setUserMenuOpen(false)} />
                          </>
                        )}
                        {isAdminUser && (
                          <MenuLink href="/admin" label="Trang quản trị" onClick={() => setUserMenuOpen(false)} />
                        )}
                      </div>

                      <div className="border-t border-[var(--border)] mx-2 pt-1 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            signOut({ callbackUrl: "/dang-nhap" });
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/dang-nhap"
                  className="hidden sm:inline-flex items-center h-10 px-5 text-sm font-semibold text-[var(--foreground)] border-2 border-[var(--border)] rounded-full hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-md transition-all duration-200"
                >
                  Đăng nhập
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-[var(--muted)] transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-[18px] h-[18px] text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========== Mobile Menu ========== */}
      {mobileOpen && (
        <div className="lg:hidden px-4 pb-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl shadow-black/10 overflow-hidden animate-slide-down mt-2">
            {/* Nav links */}
            <nav className="p-3 space-y-0.5">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-4 py-3 text-[15px] font-semibold text-[var(--foreground)] rounded-xl hover:bg-[var(--muted)] transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Auth / Post */}
            <div className="px-3 pb-3 space-y-2">
              {!session?.user && (
                <Link
                  href="/dang-nhap"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center py-3 text-sm font-bold text-[var(--primary)] rounded-xl border-2 border-[var(--primary)]/20 hover:bg-[var(--primary)] hover:text-white transition-all"
                >
                  Đăng nhập
                </Link>
              )}

              {canPostListing(session?.user?.role) && (
                <Link
                  href="/dang-tin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] shadow-lg shadow-[var(--primary)]/20 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Đăng tin ngay
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block mx-2 px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] rounded-xl transition-colors"
    >
      {label}
    </Link>
  );
}
