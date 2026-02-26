import { Suspense } from "react";
import Link from "next/link";
import { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập | AloNha",
  description: "Đăng nhập hệ thống để sử dụng các tính năng.",
};

const BG_IMAGE = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex selection:bg-[var(--primary)] selection:text-white relative">

      {/* ── Mobile: ảnh mờ làm background ── */}
      <div
        className="absolute inset-0 lg:hidden bg-cover bg-center"
        style={{ backgroundImage: `url('${BG_IMAGE}')` }}
      />
      <div className="absolute inset-0 lg:hidden bg-black/60 backdrop-blur-sm" />

      {/* ── Desktop: Left Column ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-neutral-900 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transform hover:scale-105 transition-transform duration-[20s] ease-out"
          style={{ backgroundImage: `url('${BG_IMAGE}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
        <div className="absolute inset-0 bg-[var(--primary)]/20 mix-blend-multiply" />

        {/* Content — căn giữa */}
        <div className="relative z-10 flex flex-col items-start justify-center p-12 xl:p-20 w-full">
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Chìa khóa mở cửa<br />tổ ấm tương lai của bạn.
          </h2>
          <p className="text-lg text-white/80 max-w-md font-medium leading-relaxed">
            Hàng ngàn bất động sản chất lượng đang chờ đón. Đăng nhập để lưu lại những lựa chọn tuyệt vời nhất.
          </p>
        </div>
      </div>

      {/* ── Right Column: Form ── */}
      <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-16 xl:p-24 min-h-screen">
        <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-700">


          {/* Card wrapper trên mobile */}
          <div className="lg:contents">
            <div className="bg-[var(--background)] rounded-2xl p-6 shadow-2xl lg:p-0 lg:bg-transparent lg:shadow-none">
              <div className="mb-7 lg:mb-10 text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--foreground)] mb-2 tracking-tight">
                  Chào mừng trở lại
                </h1>
                <p className="text-sm sm:text-base text-[var(--muted-foreground)]">
                  Vui lòng đăng nhập để tiếp tục hành trình của bạn.
                </p>
              </div>

              <Suspense fallback={
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
                </div>
              }>
                <LoginForm />
              </Suspense>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
