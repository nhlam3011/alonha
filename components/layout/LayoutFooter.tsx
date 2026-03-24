 "use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

const HIDE_FOOTER_PATH_PREFIXES = ["/admin", "/moi-gioi", "/tai-khoan", "/dang-tin"];

export function LayoutFooter() {
  const pathname = usePathname();
  const hideFooter = pathname && HIDE_FOOTER_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (hideFooter) {
    return null;
  }

  return <Footer />;
}

