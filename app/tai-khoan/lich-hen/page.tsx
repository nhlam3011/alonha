import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Icons
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const MapPinIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;

const getStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING":
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Chờ xác nhận</span>;
    case "CONFIRMED":
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Đã xác nhận</span>;
    case "COMPLETED":
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Đã hoàn thành</span>;
    case "CANCELLED":
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">Đã hủy</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--muted)]/20 text-[var(--foreground)] border border-[var(--border)]">{status}</span>;
  }
};

export default async function LichHenPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/dang-nhap?callbackUrl=/tai-khoan/lich-hen");
  }

  const dsLichHen = await prisma.viewingAppointment.findMany({
    where: { userId: session.user.id },
    include: {
      listing: { select: { title: true, slug: true } },
    },
    orderBy: { schedule: "desc" },
  });

  const list = dsLichHen.map((a: any) => ({
    id: a.id,
    listingId: a.listingId,
    listingTitle: a.listing?.title,
    listingSlug: a.listing?.slug,
    scheduledAt: a.schedule.toISOString(),
    status: a.status,
    note: a.note,
  }));

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] flex items-center gap-3">
            <span className="w-1.5 h-8 rounded-full bg-[var(--primary)] block"></span>
            Lịch hẹn xem nhà
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)] text-sm">
            Quản lý danh sách các lịch hẹn bạn đã đặt với môi giới và chủ nhà.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md overflow-hidden shadow-sm">
        {list.length === 0 ? (
          <div className="p-16 text-center max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-6">
              <CalendarIcon className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Bạn chưa có lịch hẹn nào</h3>
            <p className="text-[var(--muted-foreground)] mb-8">
              Lên lịch xem những căn nhà bạn ưng ý để trực tiếp trải nghiệm và làm việc với môi giới.
            </p>
            <Link href="/bat-dong-san" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[var(--primary)]/20">
              <SearchIcon className="w-5 h-5" />
              Tìm kiếm Bất Động Sản
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[var(--muted)]/10">
                <tr className="border-b border-[var(--border)]">
                  <th className="px-6 py-4 font-semibold text-[var(--foreground)]">Tin đăng</th>
                  <th className="px-6 py-4 font-semibold text-[var(--foreground)]">Thời gian hẹn</th>
                  <th className="px-6 py-4 font-semibold text-[var(--foreground)]">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold text-[var(--foreground)]">Ghi chú</th>
                  <th className="px-6 py-4 font-semibold text-[var(--foreground)] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {list.map((a) => (
                  <tr key={a.id} className="hover:bg-[var(--muted)]/5 transition-colors group">
                    <td className="px-6 py-4">
                      {a.listingSlug ? (
                        <Link href={`/bat-dong-san/${a.listingSlug}`} className="font-medium text-[var(--primary)] hover:underline flex items-start gap-2 max-w-[250px] sm:max-w-xs truncate-2-lines whitespace-normal">
                          <MapPinIcon className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{a.listingTitle || "Tin đăng Bất Động Sản"}</span>
                        </Link>
                      ) : (
                        <span className="text-[var(--muted-foreground)] font-medium flex items-start gap-2 max-w-[250px] whitespace-normal">
                          <MapPinIcon className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{a.listingTitle || "Tin đăng hiển thị sau"}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[var(--foreground)] font-medium">
                        <ClockIcon className="w-4 h-4 text-[var(--muted-foreground)]" />
                        {new Date(a.scheduledAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                      <div className="text-[var(--muted-foreground)] text-xs mt-1 ml-6">
                        {new Date(a.scheduledAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(a.status)}
                    </td>
                    <td className="px-6 py-4 text-[var(--muted-foreground)] max-w-[200px] truncate">
                      {a.note || <span className="italic opacity-50">Không có ghi chú</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {a.listingSlug && (
                        <Link
                          href={`/bat-dong-san/${a.listingSlug}`}
                          className="inline-flex items-center justify-center px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          Xem tin
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
