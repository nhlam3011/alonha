import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MoiGioiClientLayout } from "@/components/moi-gioi/MoiGioiClientLayout";

const AGENT_ROLES = ["AGENT", "BUSINESS", "ADMIN"];

export default async function MoiGioiLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/dang-nhap?callbackUrl=/moi-gioi");
  }
  const role = (session.user as { role?: string }).role;
  if (!role || !AGENT_ROLES.includes(role)) {
    redirect("/nang-cap-tai-khoan");
  }

  return <MoiGioiClientLayout>{children}</MoiGioiClientLayout>;
}
