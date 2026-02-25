"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { LayoutFooter } from "@/components/layout/LayoutFooter";
import { LayoutChatbotTrigger } from "@/components/chat/LayoutChatbotTrigger";

const HIDE_CHROME_PREFIXES = ["/admin", "/moi-gioi"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = HIDE_CHROME_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      {/* Background decorative elements */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div
          className="absolute -left-24 -top-32 size-[30rem] rounded-full blur-3xl opacity-10 transition-opacity duration-300"
          style={{ background: "var(--primary)" }}
        />
        <div
          className="absolute -right-28 -top-24 size-[28rem] rounded-full blur-3xl opacity-10 transition-opacity duration-300"
          style={{ background: "var(--accent)" }}
        />
        <div
          className="absolute -bottom-32 left-1/2 -translate-x-1/2 size-[40rem] rounded-full blur-3xl opacity-5 transition-opacity duration-300"
          style={{ background: "var(--primary)" }}
        />
      </div>

      {!hideChrome && <Header />}
      <main className={`relative flex-1 ${!hideChrome ? "pt-20" : ""}`}>{children}</main>
      {!hideChrome && <LayoutFooter />}
      <LayoutChatbotTrigger />
    </div>
  );
}
