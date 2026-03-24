"use client";

import { usePathname } from "next/navigation";
import { ChatbotTrigger } from "./ChatbotTrigger";

const HIDE_CHATBOT_PATH_PREFIXES = ["/admin", "/moi-gioi"];

export function LayoutChatbotTrigger() {
  const pathname = usePathname();
  const hide =
    pathname && HIDE_CHATBOT_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (hide) return null;

  return <ChatbotTrigger />;
}

