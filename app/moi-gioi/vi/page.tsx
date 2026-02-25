"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type WalletData = { balance: number };
type TransactionRow = { id: string; type: string; amount: number; status: string; description: string | null; createdAt: string };
type PackageItem = { id: string; code: string; name: string; description: string | null; price: number; durationDays: number | null };
type ListingOption = { id: string; title: string; slug: string; status: string };

function formatVnd(n: number): string {
  return new Intl.NumberFormat("vi-VN", { style: 'currency', currency: 'VND' }).format(n);
}

const DEPOSIT_PRESETS = [500000, 1000000, 2000000, 5000000, 10000000, 20000000];

export default function WalletPage() {
  const { status } = useSession();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string>("");
  const [depositTab, setDepositTab] = useState<"qr" | "transfer">("qr");
  const [depositAmount, setDepositAmount] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [txKeyword, setTxKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshWallet(signal?: AbortSignal) {
    const res = await fetch("/api/moi-gioi/wallet", { signal });
    const data = (await res.json().catch(() => ({})));
    if (!res.ok) throw new Error(data.error || "Không thể tải số dư ví.");
    setWallet({ balance: Number(data.balance || 0) });
  }

  async function refreshPackages(signal?: AbortSignal) {
    const res = await fetch("/api/service-packages", { signal });
    const data = (await res.json().catch(() => ({})));
    if (!res.ok) throw new Error(data.error || "Không thể tải gói dịch vụ.");
    setPackages(Array.isArray(data) ? data : []);
  }

  async function refreshTransactions(page: number, keyword: string, signal?: AbortSignal) {
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (keyword.trim()) params.set("keyword", keyword.trim());
    const res = await fetch(`/api/moi-gioi/transactions?${params.toString()}`, { signal });
    const data = (await res.json().catch(() => ({})));
    if (!res.ok) throw new Error(data.error || "Không thể tải lịch sử giao dịch.");
    setTransactions(Array.isArray(data.data) ? data.data : []);
    setTxTotal(typeof data.total === "number" ? data.total : 0);
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([refreshWallet(controller.signal), refreshPackages(controller.signal)])
      .catch((err) => setError(err instanceof Error ? err.message : "Không thể tải dữ liệu ví."))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    fetch("/api/moi-gioi/listings", { signal: controller.signal })
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res.data)) {
          const approved = res.data.filter((l: any) => l.status === "APPROVED");
          setListings(approved);
          if (!selectedListingId && approved.length > 0) {
            setSelectedListingId(approved[0].id);
          }
        }
      })
      .catch(() => { });
    return () => controller.abort();
  }, [status, selectedListingId]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    setTxLoading(true);
    refreshTransactions(txPage, txKeyword, controller.signal)
      .catch(() => { })
      .finally(() => setTxLoading(false));
    return () => controller.abort();
  }, [status, txPage, txKeyword]);

  async function handleDeposit() {
    const amount = Number(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Vui lòng nhập số tiền nạp hợp lệ.");
      return;
    }
    setProcessing(true);
    setMessage(null);
    setError(null);
    try {
      const method = depositTab === "qr" ? "QR" : "TRANSFER";
      const res = await fetch("/api/moi-gioi/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method }),
      });
      const data = (await res.json().catch(() => ({})));
      if (!res.ok) throw new Error(data.error || "Nạp tiền thất bại.");
      await refreshWallet();
      setTxPage(1);
      setTxKeyword("");
      await refreshTransactions(1, "");
      setDepositAmount("");
      setMessage("Nạp tiền thành công (mô phỏng).");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nạp tiền thất bại.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleBuyPackage(pkg: PackageItem) {
    if (!selectedListingId) {
      setError("Vui lòng chọn tin đăng muốn nâng VIP.");
      return;
    }
    setProcessing(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/moi-gioi/listings/${selectedListingId}/vip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });
      const data = (await res.json().catch(() => ({})));
      if (!res.ok) throw new Error(data.error || "Mua gói thất bại.");
      await refreshWallet();
      setTxPage(1);
      setTxKeyword("");
      await refreshTransactions(1, "");
      setMessage(`Đã mua gói "${pkg.name}" cho tin đăng thành công.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mua gói thất bại.");
    } finally {
      setProcessing(false);
    }
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
          <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)]">Yêu cầu đăng nhập</h2>
        <p className="mt-2 text-[var(--muted-foreground)]">Vui lòng đăng nhập tài khoản môi giới để truy cập.</p>
        <Link href="/dang-nhap" className="mt-6 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;
  const monthNow = new Date().getMonth();
  const now = new Date();

  // Calculate stats securely
  const depositThisMonth = transactions
    .filter((t) => t.type === "DEPOSIT" && new Date(t.createdAt).getMonth() === now.getMonth() && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);

  const spendThisMonth = transactions
    .filter((t) => t.type !== "DEPOSIT" && new Date(t.createdAt).getMonth() === now.getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Ví Môi Giới</h1>
          <p className="page-subtitle">
            Quản lý tài chính, nạp tiền và thanh toán dịch vụ.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-[var(--muted)]/20 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-500/10">
              <div className="relative z-10">
                <div className="flex items-center justify-between opacity-80 mb-4">
                  <p className="text-sm font-medium">Số dư khả dụng</p>
                  <div className="p-1.5 bg-white/10 rounded-lg">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  </div>
                </div>
                <p className="text-3xl font-bold tracking-tight">{formatVnd(balance)}</p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href="#nap-tien" className="px-4 py-2 bg-white text-blue-600 text-sm font-bold rounded-xl shadow-lg shadow-black/5 hover:bg-blue-50 transition-colors">
                    + Nạp ngay
                  </Link>
                </div>
              </div>
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 mb-4">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <p className="text-sm font-medium text-[var(--muted-foreground)]">Đã nạp tháng {monthNow + 1}</p>
                <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{formatVnd(depositThisMonth)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 mb-4">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6 6" /></svg>
                </div>
                <p className="text-sm font-medium text-[var(--muted-foreground)]">Đã chi tiêu tháng {monthNow + 1}</p>
                <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{formatVnd(spendThisMonth)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Services Packages */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">Gói dịch vụ VIP</h2>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">Nâng cấp tin để tiếp cận khách hàng tốt hơn</p>
                </div>

                {/* Listing Selector */}
                <div className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-xl p-1.5 shadow-sm">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] pl-2 uppercase">Tin:</label>
                  <select
                    value={selectedListingId}
                    onChange={(e) => setSelectedListingId(e.target.value)}
                    className="bg-transparent text-sm font-medium outline-none text-[var(--foreground)] max-w-[200px] truncate cursor-pointer"
                  >
                    <option value="" disabled>-- Chọn tin đăng --</option>
                    {listings.length === 0 ? (
                      <option value="" disabled>Không có tin đang hiển thị</option>
                    ) : (
                      listings.map((l) => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))
                    )}
                  </select>
                  {selectedListingId && (
                    <Link
                      href={`/bat-dong-san/${listings.find((l) => l.id === selectedListingId)?.slug ?? ""}`}
                      target="_blank"
                      className="flex items-center justify-center h-7 w-7 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--primary)] hover:text-white transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </Link>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {packages.length > 0 ? (
                  packages.slice(0, 4).map((pkg, i) => {
                    const isPopular = i === 1; // Mock popular logic
                    return (
                      <div
                        key={pkg.id}
                        className={`relative group rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col ${isPopular
                          ? 'border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-900/10 dark:to-[var(--card)] dark:border-indigo-800 ring-1 ring-indigo-500/20'
                          : 'border-[var(--border)] bg-[var(--card)]'
                          }`}
                      >
                        {isPopular && (
                          <div className="absolute top-0 right-0 -mr-px -mt-px rounded-bl-xl rounded-tr-xl bg-indigo-600 px-3 py-1 text-[10px] font-bold text-white shadow-sm uppercase tracking-wider">
                            Phổ biến
                          </div>
                        )}

                        <div className="mb-4">
                          <h3 className={`text-lg font-bold ${isPopular ? 'text-indigo-700 dark:text-indigo-400' : 'text-[var(--foreground)]'}`}>
                            {pkg.name}
                          </h3>
                          <p className="text-sm text-[var(--muted-foreground)] mt-1 line-clamp-2 h-10">
                            {pkg.description || "Gói dịch vụ cao cấp giúp tăng hiển thị tin đăng của bạn."}
                          </p>
                        </div>

                        <div className="mt-auto pt-4 border-t border-[var(--border)] border-dashed">
                          <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-2xl font-bold text-[var(--foreground)]">{formatVnd(pkg.price)}</span>
                            <span className="text-xs text-[var(--muted-foreground)]">/ tin</span>
                          </div>
                          <button
                            onClick={() => handleBuyPackage(pkg)}
                            disabled={processing || !selectedListingId}
                            className={`w-full py-3 rounded-xl text-sm font-bold shadow-lg transition-all ${isPopular
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/25'
                              : 'bg-white border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] dark:bg-transparent'
                              } disabled:opacity-50 disabled:shadow-none`}
                          >
                            {processing ? 'Đang xử lý...' : 'Mua ngay'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-[var(--border)]">
                    <p className="text-[var(--muted-foreground)]">Chưa có gói dịch vụ nào.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Quick Deposit */}
            <section id="nap-tien" className="h-fit space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-6 sticky top-4">
                <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">Nạp tiền nhanh</h2>

                {/* Tabs */}
                <div className="flex p-1 bg-[var(--muted)] rounded-xl mb-6">
                  <button
                    onClick={() => setDepositTab("qr")}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${depositTab === 'qr' ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
                  >
                    QR Code
                  </button>
                  <button
                    onClick={() => setDepositTab("transfer")}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${depositTab === 'transfer' ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
                  >
                    Chuyển khoản
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2 block">Số tiền muốn nạp</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-4 pr-12 py-3 text-lg font-bold outline-none focus:border-[var(--primary)] transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--muted-foreground)]">VNĐ</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {DEPOSIT_PRESETS.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setDepositAmount(String(amount))}
                        className="py-2 px-1 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs font-medium hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                      >
                        {amount >= 1e6 ? `${amount / 1e6}tr` : `${amount / 1e3}k`}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleDeposit}
                    disabled={processing || !depositAmount}
                    className="w-full py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
                  >
                    {processing ? 'Đang xử lý...' : 'Tiến hành thanh toán'}
                  </button>
                </div>

                <div className="mt-6 flex items-start gap-3 p-3 rounded-xl bg-[var(--muted)]/50 text-xs text-[var(--muted-foreground)]">
                  <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p>Vui lòng ghi đúng <strong>Nội dung chuyển khoản</strong> để hệ thống tự động cộng tiền vào ví của bạn.</p>
                </div>
              </div>
            </section>
          </div>

          {/* Transaction History */}
          <section id="lich-su-giao-dich" className="card-container overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--muted)]/30">
              <h2 className="font-bold text-[var(--foreground)]">Lịch sử giao dịch</h2>
              <div className="relative w-full sm:w-64">
                <input
                  value={txKeyword}
                  onChange={(e) => { setTxKeyword(e.target.value); setTxPage(1); }}
                  placeholder="Tìm mã giao dịch..."
                  className="filter-input pl-9"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-[12%]">Mã GD</th>
                    <th className="w-[18%]">Thời gian</th>
                    <th className="w-[30%] text-left">Nội dung</th>
                    <th className="w-[18%]">Số tiền</th>
                    <th className="w-[22%]">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {txLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[var(--muted-foreground)]">Đang tải dữ liệu...</td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[var(--muted-foreground)]">Chưa có giao dịch nào</td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="font-mono text-xs text-[var(--muted-foreground)]">{t.id.slice(0, 8)}</td>
                        <td>
                          {new Date(t.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          <span className="text-[var(--muted-foreground)] text-xs ml-2">
                            {new Date(t.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="text-left font-medium text-sm">{t.description || "Không có mô tả"}</td>
                        <td className={`text-center font-bold text-sm ${t.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-[var(--foreground)]'}`}>
                          {t.type === 'DEPOSIT' ? '+' : '-'}{formatVnd(t.amount)}
                        </td>
                        <td className="text-center">
                          <span className={t.status === 'COMPLETED' ? 'badge-success' : t.status === 'FAILED' ? 'badge-destructive' : 'badge-warning'}>
                            {t.status === 'COMPLETED' ? 'Thành công' : t.status === 'FAILED' ? 'Thất bại' : 'Đang xử lý'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {txTotal > 10 && (
              <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
                <button
                  disabled={txPage <= 1}
                  onClick={() => setTxPage(p => p - 1)}
                  className="btn btn-outline btn-sm"
                >
                  Trước
                </button>
                <button
                  disabled={txPage >= Math.ceil(txTotal / 10)}
                  onClick={() => setTxPage(p => p + 1)}
                  className="btn btn-outline btn-sm"
                >
                  Sau
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
