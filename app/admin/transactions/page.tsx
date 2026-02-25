import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: 'currency', currency: 'VND' }).format(amount);
}

export default async function AdminTransactionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;

  const transactions = await prisma.transaction.findMany({
    where: { type: { in: ["DEPOSIT", "VIP_PACKAGE"] } },
    include: {
      wallet: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalDeposit = transactions
    .filter(t => t.type === "DEPOSIT" && t.status === "COMPLETED")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalSpend = transactions
    .filter(t => t.type !== "DEPOSIT" && t.status === "COMPLETED")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Lịch sử giao dịch</h1>
          <p className="page-subtitle">
            Theo dõi dòng tiền nạp và chi tiêu dịch vụ của toàn hệ thống.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-grid dashboard-grid-3">
        <div className="dashboard-card">
          <p className="text-sm text-[var(--muted-foreground)]">Tổng giao dịch</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{transactions.length}</p>
        </div>
        <div className="dashboard-card">
          <p className="text-sm text-[var(--muted-foreground)]">Tổng nạp thành công</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatVnd(totalDeposit)}</p>
        </div>
        <div className="dashboard-card">
          <p className="text-sm text-[var(--muted-foreground)]">Tổng chi tiêu dịch vụ</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{formatVnd(totalSpend)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="card-container overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-[18%]">Thời gian</th>
                <th className="w-[14%]">Loại</th>
                <th className="w-[16%]">Số tiền</th>
                <th className="w-[30%] text-left">Người dùng</th>
                <th className="w-[22%]">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[var(--muted-foreground)]">
                    Chưa có giao dịch nào phát sinh.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const user = t.wallet.user;
                  const isDeposit = t.type === "DEPOSIT";

                  return (
                    <tr key={t.id}>
                      <td>
                        <span className="text-[var(--foreground)] text-sm">
                          {t.createdAt.toLocaleDateString("vi-VN")}
                        </span>
                        <span className="text-[var(--muted-foreground)] text-xs ml-1.5">
                          {t.createdAt.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={isDeposit ? "badge-primary" : "badge-secondary"}>
                          {isDeposit ? "Nạp tiền" : "Thanh toán"}
                        </span>
                      </td>
                      <td className={`text-center font-semibold text-sm ${isDeposit ? "text-emerald-600" : "text-[var(--foreground)]"}`}>
                        {isDeposit ? "+" : "-"}{formatVnd(Number(t.amount))}
                      </td>
                      <td>
                        <p className="font-medium text-[var(--foreground)] text-sm">{user?.name || "—"}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{user?.email || "—"}</p>
                      </td>
                      <td className="text-center">
                        <span className={t.status === "COMPLETED" ? "badge-success" : t.status === "FAILED" ? "badge-destructive" : "badge-warning"}>
                          {t.status === "COMPLETED" ? "Thành công" : t.status === "FAILED" ? "Thất bại" : "Đang xử lý"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
