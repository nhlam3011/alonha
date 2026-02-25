import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminClientLayout } from "@/components/admin/AdminClientLayout";

export default async function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/dang-nhap?callbackUrl=/admin");
  if ((session.user as { role?: string }).role !== "ADMIN") redirect("/403?reason=admin");

  return <AdminClientLayout>{children}</AdminClientLayout>;
}
