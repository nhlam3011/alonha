import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const AGENT_ROLES = ["AGENT", "BUSINESS", "ADMIN"];

export default async function DangTinLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/dang-nhap?callbackUrl=/dang-tin");
  }
  const role = (session.user as { role?: string }).role;
  if (!role || !AGENT_ROLES.includes(role)) {
    redirect("/nang-cap-tai-khoan");
  }

  return <>{children}</>;
}
