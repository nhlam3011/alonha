import type { Metadata } from "next";
import Script from "next/script";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { AppShell } from "@/components/layout/AppShell";
import { ConfigProvider } from "@/components/providers/ConfigProvider";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: {
    default: "AloNha - Mua bán, cho thuê bất động sản | Tìm nhà đất nhanh",
    template: "%s | Alonha",
  },
  description:
    "Nền tảng bất động sản hàng đầu. Tìm kiếm nhà đất, căn hộ, đất nền với bộ lọc thông minh, bản đồ, AI gợi ý. Đăng tin miễn phí.",
  keywords: "bất động sản, mua bán nhà đất, cho thuê, căn hộ, đất nền, nhà phố",
  openGraph: { type: "website" },
  robots: "index, follow",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

const themeInitScript = `
(() => {
  try {
    const key = "alonha-theme";
    const stored = localStorage.getItem(key);
    const theme =
      stored === "light" || stored === "dark"
        ? stored
        : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.classList.add(theme);
  } catch {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
    document.documentElement.classList.add("light");
  }
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const configs = await prisma.systemConfig.findMany();
  const configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string | null>);

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Script id="console-protect" strategy="afterInteractive">
          {`
            (() => {
              if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;
              
              const _log = console.log;
              const _clear = console.clear;

              const notice = () => {
                _log("%cDỪNG LẠI!", "color:red;font-family:sans-serif;font-size:4rem;-webkit-text-stroke:1px black;font-weight:bold");
                _log("%cĐây là tính năng dành cho nhà phát triển. Nếu ai đó bảo bạn sao chép-dán nội dung nào đó vào đây, rất có thể họ đang cố gắng đánh cắp thông tin của bạn.", "font-size:1.5rem;font-family:sans-serif;");
              };

              // Overwrite default loggers to do nothing
              const noop = () => {};
              console.log = noop;
              console.warn = noop;
              console.error = noop;
              console.info = noop;
              console.debug = noop;

              // Clear console immediately and then periodically (fast)
              setInterval(() => {
                _clear();
                notice();
              }, 500);
            })();
          `}
        </Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-[var(--background)] text-[var(--foreground)]">
        <SessionProvider>
          <ConfigProvider configs={configMap}>
            <AppShell>{children}</AppShell>
          </ConfigProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
