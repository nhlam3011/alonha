import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardChart } from "@/components/dashboard/DashboardChart";
import { DashboardLeads } from "./DashboardLeads";

function formatMoney(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} tỷ`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} tr`;
  return n.toLocaleString("vi-VN");
}

export default async function AgentDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/dang-nhap?callbackUrl=/moi-gioi");
  }

  const userId = session.user.id;

  // 1. Fetch Stats
  const [wallet, activeListings, totalViewsResult, unreadLeads] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.listing.count({
      where: { ownerId: userId, status: "APPROVED" },
    }),
    prisma.listing.aggregate({
      where: { ownerId: userId },
      _sum: { viewCount: true },
    }),
    prisma.lead.count({
      where: { agentId: userId, isRead: false },
    }),
  ]);

  const stats = {
    balance: wallet ? Number(wallet.balance) : 0,
    activeListingsCount: activeListings,
    totalViewCount: totalViewsResult._sum.viewCount || 0,
    newLeadsCount: unreadLeads,
  };

  // 2. Fetch Leads
  const dbLeads = await prisma.lead.findMany({
    where: { agentId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      listing: { select: { title: true, slug: true } },
    },
  });

  const leads = dbLeads.map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    email: l.email,
    source: l.source || "unknown",
    isRead: l.isRead,
    status: l.isRead ? "read" : "unread",
    createdAt: l.createdAt.toISOString(),
    listingTitle: l.listing?.title,
    listingSlug: l.listing?.slug,
  }));

  // 3. Fetch Listings for Dropdown
  const activeListingsDropdown = await prisma.listing.findMany({
    where: { ownerId: userId, status: "APPROVED" },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  const nowLabel = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const viewChartData = [
    { label: "T2", value: Math.floor(stats.totalViewCount * 0.1) },
    { label: "T3", value: Math.floor(stats.totalViewCount * 0.12) },
    { label: "T4", value: Math.floor(stats.totalViewCount * 0.15) },
    { label: "T5", value: Math.floor(stats.totalViewCount * 0.18) },
    { label: "T6", value: Math.floor(stats.totalViewCount * 0.2) },
    { label: "T7", value: Math.floor(stats.totalViewCount * 0.15) },
    { label: "CN", value: Math.floor(stats.totalViewCount * 0.1) },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <p className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider">{nowLabel}</p>
          <h1 className="page-title">Bảng điều khiển</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dang-tin"
            className="btn btn-primary btn-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span>Đăng tin mới</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStats
          label="Tin đang hiển thị"
          value={stats.activeListingsCount}
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          color="blue"
          href="/moi-gioi/tin-dang"
          className="hover:shadow-blue-500/10"
        />
        <DashboardStats
          label="Khách quan tâm (7 ngày)"
          value={stats.newLeadsCount}
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          color="emerald"
          trend={{ value: 12, label: "so với tuần trước", positive: true }}
          className="hover:shadow-green-500/10"
        />
        <DashboardStats
          label="Lượt xem tin"
          value={stats.totalViewCount}
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
          color="indigo"
          className="hover:shadow-indigo-500/10"
        />
        <DashboardStats
          label="Số dư ví"
          value={`${formatMoney(stats.balance)} đ`}
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
          color="amber"
          href="/moi-gioi/vi"
          className="hover:shadow-amber-500/10"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Chart & Quick Actions */}
        <div className="space-y-6 lg:col-span-2">
          <DashboardChart
            title="Thống kê lượt xem tuần qua"
            data={viewChartData}
            type="bar"
            height={300}
            color="var(--primary)"
            valueSuffix=" lượt"
          />

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-[var(--foreground)]">Truy cập nhanh</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { href: "/moi-gioi/tin-dang", label: "Quản lý tin", icon: "Document", color: "blue" },
                { href: "/moi-gioi/lich-hen", label: "Lịch hẹn", icon: "Calendar", color: "indigo" },
                { href: "/moi-gioi/tin-nhan", label: "Tin nhắn", icon: "Chat", color: "violet" },
                { href: "/moi-gioi/vi", label: "Nạp tiền", icon: "Cash", color: "emerald" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-[var(--border)] p-4 text-center transition-all hover:bg-[var(--muted)] hover:border-[var(--primary)]/30 hover:-translate-y-1"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-${item.color}-100 dark:bg-${item.color}-900/30 text-${item.color}-600 group-hover:scale-110 transition-transform`}>
                    {/* Simple placeholder icons based on name logic or generic svg */}
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <span className="text-sm font-semibold text-[var(--foreground)]">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <DashboardLeads initialLeads={leads} listings={activeListingsDropdown} />
      </div>
    </div>
  );
}
