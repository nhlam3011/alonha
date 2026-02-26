import { prisma } from "@/lib/prisma";
import { UsersAdminClient, UserRow, UserRole } from "./UsersAdminClient";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function AdminUsersPage(props: {
  searchParams: Promise<{ keyword?: string; role?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentUserId = session.user.id;

  const searchParams = await props.searchParams;
  const keyword = searchParams.keyword || "";
  const role = searchParams.role || "ALL";

  const whereClause: Prisma.UserWhereInput = {};

  if (role !== "ALL") {
    whereClause.role = role as any;
  }

  if (keyword) {
    whereClause.OR = [
      { name: { contains: keyword, mode: "insensitive" } },
      { email: { contains: keyword, mode: "insensitive" } },
      { phone: { contains: keyword } },
    ];
  }

  // Get users for table
  const dbUsers = await prisma.user.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  const users: UserRow[] = dbUsers.map(u => ({
    id: u.id,
    name: u.name || "Unknown",
    email: u.email,
    phone: u.phone,
    role: u.role as UserRole,
    avatar: u.avatar,
    createdAt: u.createdAt.toISOString(),
    isActive: true, // Legacy field
    isLocked: !!u.isLocked,
  }));

  // Get stats
  const [totalCount, brokerCount, adminCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "AGENT" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Quản lý người dùng</h1>
          <p className="page-subtitle">
            Phân quyền, khóa tài khoản và quản lý thông tin thành viên.
          </p>
        </div>
      </div>

      <UsersAdminClient
        initialUsers={users}
        currentUserId={currentUserId}
        total={totalCount}
        brokers={brokerCount}
        admins={adminCount}
      />
    </div>
  );
}
