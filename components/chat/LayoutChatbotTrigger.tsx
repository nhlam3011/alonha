"use client";

import { usePathname } from "next/navigation";
import { ChatbotTrigger } from "./ChatbotTrigger";

// Ẩn chatbot AI ở các khu vực đã có khung nhắn tin riêng:
// - /admin: quản lý làm việc với môi giới
// - /moi-gioi: khu vực portal dành cho môi giới
const HIDE_CHATBOT_PATH_PREFIXES = ["/admin", "/moi-gioi"];

export function LayoutChatbotTrigger() {
  const pathname = usePathname();
  const hide =
    pathname && HIDE_CHATBOT_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (hide) return null;

  return <ChatbotTrigger />;
}

