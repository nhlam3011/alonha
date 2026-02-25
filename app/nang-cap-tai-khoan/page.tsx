import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const AGENT_ROLES = ["AGENT", "BUSINESS", "ADMIN"];

export default async function UpgradeAccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/dang-nhap?callbackUrl=/nang-cap-tai-khoan");
  const role = session.user.role as string;
  if (role && AGENT_ROLES.includes(role)) redirect("/moi-gioi");

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Nâng cấp tài khoản Môi giới</h1>
      <p className="mt-4 text-[var(--muted)]">
        Tài khoản của bạn hiện là <strong>Khách xem tin</strong>. Chỉ tài khoản <strong>Môi giới</strong> hoặc <strong>Doanh nghiệp BĐS</strong> mới được đăng tin bất động sản lên Alonha.
      </p>
      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-semibold text-[var(--foreground)]">Bạn sẽ được:</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-[var(--muted)]">
          <li>Đăng tin mua bán, cho thuê không giới hạn (tin chờ duyệt)</li>
          <li>Quản lý tin đăng, chỉnh sửa, ẩn/hiện</li>
          <li>Mua gói tin VIP, Up tin để tin nổi bật</li>
          <li>Ví tiền, nạp tiền qua VNPAY/Momo</li>
          <li>Xem thống kê lượt xem, lượt click SĐT, khách hàng tiềm năng</li>
        </ul>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dang-ky-moi-gioi"
          className="rounded-xl bg-[var(--primary)] px-6 py-3 text-center font-semibold text-white hover:bg-[var(--primary-hover)]"
        >
          Đăng ký tài khoản Môi giới (email khác)
        </Link>
        <Link
          href="/bat-dong-san"
          className="rounded-xl border border-[var(--border)] px-6 py-3 text-center font-medium hover:bg-[var(--background)]"
        >
          Tiếp tục xem tin
        </Link>
      </div>
      <p className="mt-6 text-sm text-[var(--muted)]">
        Nếu bạn đã có tài khoản môi giới với email khác, hãy đăng xuất và đăng nhập bằng tài khoản đó. Liên hệ quản trị nếu cần nâng cấp tài khoản hiện tại lên Môi giới.
      </p>
    </div>
  );
}
