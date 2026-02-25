import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardChart } from "@/components/dashboard/DashboardChart";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  // Parallel data fetching
  const [userCount, listingCount, pendingCount, projectCount, packageCount, lockedUserCount] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "PENDING" } }),
    prisma.project.count(),
    prisma.servicePackage.count(),
    prisma.user.count({ where: { isLocked: true } }),
  ]);

  // Date formatting
  const nowLabel = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Mock data for charts (In a real app, these would come from the DB with complex aggregation)
  const userGrowthData = [
    { label: "T2", value: Math.max(0, Math.floor(userCount * 0.8)) },
    { label: "T3", value: Math.max(0, Math.floor(userCount * 0.85)) },
    { label: "T4", value: Math.max(0, Math.floor(userCount * 0.9)) },
    { label: "T5", value: Math.max(0, Math.floor(userCount * 0.92)) },
    { label: "T6", value: Math.max(0, Math.floor(userCount * 0.95)) },
    { label: "T7", value: Math.max(0, Math.floor(userCount * 0.98)) },
    { label: "CN", value: userCount },
  ];

  const listingGrowthData = [
    { label: "T2", value: Math.max(0, Math.floor(listingCount * 0.7)) },
    { label: "T3", value: Math.max(0, Math.floor(listingCount * 0.75)) },
    { label: "T4", value: Math.max(0, Math.floor(listingCount * 0.8)) },
    { label: "T5", value: Math.max(0, Math.floor(listingCount * 0.85)) },
    { label: "T6", value: Math.max(0, Math.floor(listingCount * 0.9)) },
    { label: "T7", value: Math.max(0, Math.floor(listingCount * 0.95)) },
    { label: "CN", value: listingCount },
  ];

  return (
    <div className="page-container">
      {/* Header Section */}
      <div className="page-header">
        <div className="page-header-content">
          <p className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider">{nowLabel}</p>
          <h1 className="page-title">Tổng quan</h1>
        </div>
        {pendingCount > 0 && (
          <Link
            href="/admin/listings?status=PENDING"
            className="btn btn-primary btn-md"
          >
            <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{pendingCount} Tin chờ duyệt</span>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        <DashboardStats
          label="Người dùng"
          value={userCount}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          }
          color="indigo"
          href="/admin/users"
          className="hover:shadow-indigo-500/10"
        />
        <DashboardStats
          label="Tổng tin đăng"
          value={listingCount}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          }
          color="emerald"
          href="/admin/listings"
          className="hover:shadow-emerald-500/10"
        />
        <DashboardStats
          label="Tin chờ duyệt"
          value={pendingCount}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          }
          color="amber"
          href="/admin/listings?status=PENDING"
          className="hover:shadow-amber-500/10"
          trend={pendingCount > 0 ? { value: pendingCount, label: "cần xử lý", positive: false } : undefined}
        />
        <DashboardStats
          label="Tài khoản bị khóa"
          value={lockedUserCount}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          }
          color="rose"
          href="/admin/users?locked=1"
          className="hover:shadow-rose-500/10"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardChart
          title="Tăng trưởng người dùng (7 ngày gần nhất)"
          data={userGrowthData}
          type="bar"
          color="#6366f1" // Indigo-500
          height={300}
        />
        <DashboardChart
          title="Tin đăng mới (7 ngày gần nhất)"
          data={listingGrowthData}
          type="bar"
          color="#10b981" // Emerald-500
          height={300}
        />
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-[var(--foreground)]">Truy cập nhanh</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Listing Management */}
          <Link href="/admin/listings" className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 className="font-bold text-[var(--foreground)]">Quản lý tin đăng</h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Duyệt, chỉnh sửa, xóa tin</p>
          </Link>

          {/* User Management */}
          <Link href="/admin/users" className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="font-bold text-[var(--foreground)]">Quản lý người dùng</h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Phân quyền, khóa tài khoản</p>
          </Link>

          {/* Project Management */}
          <Link href="/admin/projects" className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5 transition-all">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h3 className="font-bold text-[var(--foreground)]">Quản lý dự án</h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Thông tin dự án BĐS</p>
          </Link>

          {/* System Settings */}
          <Link href="/admin/settings" className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-slate-500/50 hover:shadow-lg hover:shadow-slate-500/5 transition-all">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h3 className="font-bold text-[var(--foreground)]">Cài đặt hệ thống</h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Cấu hình chung</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
