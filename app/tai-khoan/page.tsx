import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Greeting } from "./Greeting";

// Inline SVGs for action cards
const BellIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>;
const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>;
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>;
const ScaleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></svg>;
const TrendingUpIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>;
const BriefcaseIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const UserCogIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="18" cy="15" r="3" /><path d="M18 12v-2" /><path d="M18 18v2" /><path d="m15.27 13.5-1.73-1" /><path d="m20.73 16.5-1.73-1" /><path d="m15.27 16.5 1.73-1" /><path d="m20.73 13.5-1.73 1" /><path d="M12 17a5 5 0 0 0-10 0" /><circle cx="7" cy="9" r="4" /></svg>;

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/dang-nhap?callbackUrl=/tai-khoan");
  }

  const role = session.user.role as string;
  const isAgent = role && ["AGENT", "BUSINESS", "ADMIN"].includes(role);
  const roleLabel = role === "ADMIN" ? "Quản trị viên" : role === "AGENT" ? "Môi giới" : role === "BUSINESS" ? "Doanh nghiệp BĐS" : "Khách xem tin";
  const getRoleColor = () => {
    if (role === "ADMIN") return "bg-red-500/10 text-red-600 border-red-500/20";
    if (role === "BUSINESS") return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    if (role === "AGENT") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-[var(--card)]/50 backdrop-blur-xl border border-[var(--border)] p-8 sm:p-10">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-transparent blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-gradient-to-tr from-[var(--secondary)]/20 to-transparent blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center overflow-hidden ring-4 ring-[var(--background)] shadow-xl transition-transform duration-300 group-hover:scale-105">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt={session.user.name ?? ""} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white uppercase tracking-wider">
                  {(session.user.name?.[0] ?? "U")}
                </span>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[var(--background)] rounded-full p-1.5 shadow-sm">
              <div className="w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[var(--background)] animate-pulse"></div>
            </div>
          </div>

          <div className="text-center sm:text-left flex-1 mt-2">
            <Greeting name={session.user.name} />
            <p className="text-[var(--muted-foreground)] mb-4">{session.user.email}</p>
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getRoleColor()} shadow-sm`}>
              {roleLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Main Actions - Bento Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-[var(--primary)] block"></span>
              Công cụ quản lý
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Card 1 */}
            <Link
              href="/tai-khoan/thong-bao"
              className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm p-5 hover:border-[var(--primary)]/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)] hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BellIcon className="w-24 h-24 -mt-8 -mr-8 text-[var(--primary)]" />
              </div>
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                  <BellIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-[var(--foreground)] mb-1">Thông báo</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Cập nhật tin tức và thông báo mới nhất</p>
              </div>
            </Link>

            {/* Card 2 */}
            <Link
              href="/tai-khoan/yeu-thich"
              className="group relative overflow-hidden rounded-2xl border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary)]/10 to-transparent p-5 hover:border-[var(--primary)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(var(--primary-rgb),0.1)] hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <HeartIcon className="w-24 h-24 -mt-8 -mr-8 text-[var(--primary)]" />
              </div>
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md shadow-[var(--primary)]/20">
                  <HeartIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-[var(--primary)] mb-1">Tin đã lưu</h3>
                <p className="text-sm text-[var(--foreground)]/80">Xem nhanh các BĐS bạn đã quan tâm</p>
              </div>
            </Link>

            {/* Card 3 */}
            <Link
              href="/tai-khoan/lich-hen"
              className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm p-5 hover:border-[var(--primary)]/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)] hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CalendarIcon className="w-24 h-24 -mt-8 -mr-8 text-[var(--primary)]" />
              </div>
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-[var(--foreground)] mb-1">Lịch hẹn xem nhà</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Quản lý các cuộc hẹn với môi giới</p>
              </div>
            </Link>

            {/* Card 4 */}
            <Link
              href="/cong-cu/so-sanh"
              className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm p-5 hover:border-[var(--primary)]/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)] hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ScaleIcon className="w-24 h-24 -mt-8 -mr-8 text-[var(--primary)]" />
              </div>
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
                  <ScaleIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-[var(--foreground)] mb-1">So sánh bất động sản</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Đặt các tin cạnh nhau để dễ chọn lựa</p>
              </div>
            </Link>

            {/* Card 5 - Cài đặt tài khoản */}
            <Link
              href="/tai-khoan/cai-dat"
              className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm p-5 hover:border-[var(--primary)]/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)] hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <UserCogIcon className="w-24 h-24 -mt-8 -mr-8 text-[var(--primary)]" />
              </div>
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                  <UserCogIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-[var(--foreground)] mb-1">Cài đặt tài khoản</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Đổi mật khẩu, ảnh đại diện, thông tin cá nhân</p>
              </div>
            </Link>

            {/* Role specific action */}
            {!isAgent ? (
              <Link
                href="/nang-cap-tai-khoan"
                className="group col-span-1 sm:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] p-6 hover:shadow-lg hover:shadow-[var(--primary)]/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute -right-4 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute right-10 bottom-0 text-white/10 transform rotate-12 scale-[3] pointer-events-none group-hover:scale-[3.5] transition-transform duration-500">
                  <TrendingUpIcon className="w-24 h-24" />
                </div>
                <div className="relative z-10 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                    <TrendingUpIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Nâng cấp tài khoản Môi Giới</h3>
                    <p className="text-white/80 text-sm">Đăng tin không giới hạn, tiếp cận hàng ngàn khách hàng tiềm năng và quản lý chuyên nghiệp.</p>
                  </div>
                </div>
              </Link>
            ) : (
              <Link
                href="/moi-gioi"
                className="group col-span-1 sm:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--primary)] to-emerald-500 p-6 hover:shadow-lg hover:shadow-[var(--primary)]/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute -right-4 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute right-10 bottom-0 text-white/10 transform rotate-12 scale-[3] pointer-events-none group-hover:scale-[3.5] transition-transform duration-500">
                  <BriefcaseIcon className="w-24 h-24" />
                </div>
                <div className="relative z-10 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                    <BriefcaseIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Quản lý tin đăng & Hệ thống</h3>
                    <p className="text-white/80 text-sm">Truy cập bảng điều khiển dành cho {roleLabel.toLowerCase()} để quản lý hoạt động kinh doanh.</p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Info/Support Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-[var(--secondary)] block"></span>
              Gợi ý hữu ích
            </h2>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--secondary)]/5 rounded-full blur-3xl -mr-10 -mt-10"></div>

            <ul className="space-y-5 relative z-10">
              <li className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                  <CheckCircleIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)] text-sm mb-1">So sánh trước khi chốt</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Lưu lại các bất động sản và sử dụng công cụ so sánh để đưa ra quyết định tốt nhất.</p>
                </div>
              </li>

              <li className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                  <CheckCircleIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)] text-sm mb-1">Tính toán tài chính</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Sử dụng công cụ tính vay mua nhà để cân đối dòng tiền hàng tháng hiệu quả.</p>
                </div>
              </li>

              <li className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                  <CheckCircleIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)] text-sm mb-1">Đặt lịch xem nhà</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Chủ động đặt lịch xem trực tiếp qua hệ thống để AloNha hỗ trợ bạn tốt nhất.</p>
                </div>
              </li>

              <li className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                  <CheckCircleIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)] text-sm mb-1">Liên hệ chuyên viên</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Đừng ngại để lại tin nhắn hay gọi điện trực tiếp cho môi giới để làm rõ thông tin.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
