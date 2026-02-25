 "use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

// Các khu vực không cần footer: trang quản trị, bảng điều khiển môi giới, tài khoản người dùng, trang đăng tin
const HIDE_FOOTER_PATH_PREFIXES = ["/admin", "/moi-gioi", "/tai-khoan", "/dang-tin"];

export function LayoutFooter() {
  const pathname = usePathname();
  const hideFooter = pathname && HIDE_FOOTER_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (hideFooter) {
    return null;
  }

  return <Footer />;
}

