"use client";

import { useMemo, useState } from "react";

function fmtBillion(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} tỷ`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} triệu`;
  return n.toLocaleString("vi-VN");
}

type Method = "equal_installment" | "equal_principal";

export default function LoanCalculatorPage() {
  const [principal, setPrincipal] = useState(2_000_000_000);
  const [years, setYears] = useState(20);
  const [rateYear, setRateYear] = useState(8.5);
  const [method, setMethod] = useState<Method>("equal_installment");
  const [showSchedule, setShowSchedule] = useState(false);

  const months = years * 12;
  const rateMonth = rateYear / 100 / 12;

  const schedule = useMemo(() => {
    const rows: { month: number; principal: number; interest: number; payment: number; balance: number }[] = [];
    let balance = principal;
    if (method === "equal_installment") {
      const pmt = rateMonth > 0
        ? principal * (rateMonth * Math.pow(1 + rateMonth, months)) / (Math.pow(1 + rateMonth, months) - 1)
        : principal / months;
      for (let i = 1; i <= months; i++) {
        const interest = balance * rateMonth;
        const prinPay = pmt - interest;
        balance = Math.max(balance - prinPay, 0);
        rows.push({ month: i, principal: prinPay, interest, payment: pmt, balance });
      }
    } else {
      const prinPay = principal / months;
      for (let i = 1; i <= months; i++) {
        const interest = balance * rateMonth;
        balance = Math.max(balance - prinPay, 0);
        rows.push({ month: i, principal: prinPay, interest, payment: prinPay + interest, balance });
      }
    }
    return rows;
  }, [principal, months, rateMonth, method]);

  const totalPayment = schedule.reduce((s, r) => s + r.payment, 0);
  const totalInterest = totalPayment - principal;
  const monthlyFirst = schedule[0]?.payment ?? 0;
  const principalPct = totalPayment > 0 ? (principal / totalPayment) * 100 : 0;
  const interestPct = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;

  const yearlyRows = useMemo(() => {
    const result: { year: number; principal: number; interest: number; payment: number; endBalance: number }[] = [];
    for (let y = 0; y < years; y++) {
      const slice = schedule.slice(y * 12, (y + 1) * 12);
      result.push({
        year: y + 1,
        principal: slice.reduce((s, r) => s + r.principal, 0),
        interest: slice.reduce((s, r) => s + r.interest, 0),
        payment: slice.reduce((s, r) => s + r.payment, 0),
        endBalance: slice[slice.length - 1]?.balance ?? 0,
      });
    }
    return result;
  }, [schedule, years]);

  return (
    <div className="space-y-6">
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-[var(--foreground)] lg:text-3xl">Tính lãi suất vay</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Ước tính lịch trả nợ chi tiết dựa trên số tiền, thời hạn và lãi suất.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              <div className="border-b border-[var(--border)] px-5 py-3">
                <h2 className="text-sm font-bold text-[var(--foreground)]">Thông tin khoản vay</h2>
              </div>
              <div className="space-y-5 p-5">
                {/* Số tiền vay */}
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Số tiền vay</span>
                    <span className="font-bold text-[var(--primary)]">{fmtBillion(principal)}</span>
                  </div>
                  <input type="range" min={100_000_000} max={20_000_000_000} step={100_000_000} value={principal}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[var(--muted)] accent-[var(--primary)]" />
                  <div className="mt-1 flex justify-between text-xs text-[var(--muted-foreground)]"><span>100tr</span><span>20 tỷ</span></div>
                </div>
                {/* Thời hạn */}
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Thời hạn</span>
                    <span className="font-bold text-[var(--foreground)]">{years} năm</span>
                  </div>
                  <input type="range" min={1} max={35} step={1} value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[var(--muted)] accent-[var(--primary)]" />
                  <div className="mt-1 flex justify-between text-xs text-[var(--muted-foreground)]"><span>1 năm</span><span>35 năm</span></div>
                </div>
                {/* Lãi suất */}
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Lãi suất</span>
                    <span className="font-bold text-[var(--foreground)]">{rateYear}%/năm</span>
                  </div>
                  <input type="range" min={1} max={20} step={0.1} value={rateYear}
                    onChange={(e) => setRateYear(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[var(--muted)] accent-[var(--primary)]" />
                  <div className="mt-1 flex justify-between text-xs text-[var(--muted-foreground)]"><span>1%</span><span>20%</span></div>
                </div>
                {/* Phương thức */}
                <div>
                  <p className="mb-2 text-sm text-[var(--muted-foreground)]">Phương thức</p>
                  <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-[var(--muted)] p-1">
                    <button type="button" onClick={() => setMethod("equal_installment")}
                      className={`rounded-md px-2 py-2 text-xs font-semibold transition-all ${method === "equal_installment" ? "bg-[var(--card)] text-[var(--primary)] shadow" : "text-[var(--muted-foreground)]"}`}>
                      Dư nợ giảm dần
                    </button>
                    <button type="button" onClick={() => setMethod("equal_principal")}
                      className={`rounded-md px-2 py-2 text-xs font-semibold transition-all ${method === "equal_principal" ? "bg-[var(--card)] text-[var(--primary)] shadow" : "text-[var(--muted-foreground)]"}`}>
                      Gốc đều
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-8 space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--primary-light)] p-4">
                <p className="text-xs font-medium text-[var(--primary)]">Trả tháng đầu</p>
                <p className="mt-1 text-xl font-extrabold text-[var(--primary)]">{fmtBillion(monthlyFirst)}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <p className="text-xs font-medium text-[var(--muted-foreground)]">Tổng lãi</p>
                <p className="mt-1 text-xl font-extrabold text-[var(--foreground)]">{fmtBillion(totalInterest)}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <p className="text-xs font-medium text-[var(--muted-foreground)]">Tổng gốc + lãi</p>
                <p className="mt-1 text-xl font-extrabold text-[var(--foreground)]">{fmtBillion(totalPayment)}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Cơ cấu khoản vay</p>
              <div className="flex items-center gap-5">
                {/* Donut */}
                <div className="relative h-20 w-20 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="var(--muted)" strokeWidth="4" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="var(--primary)" strokeWidth="4"
                      strokeDasharray={`${principalPct * 0.88} ${(100 - principalPct) * 0.88}`} strokeLinecap="round"
                      className="transition-all duration-500" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-extrabold text-[var(--foreground)]">{principalPct.toFixed(0)}%</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">Gốc</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <div className="mb-0.5 flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]"><span className="h-2 w-2 rounded-full bg-[var(--primary)]" />Gốc</span>
                      <span className="font-bold text-[var(--foreground)]">{fmtBillion(principal)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${principalPct}%` }} /></div>
                  </div>
                  <div>
                    <div className="mb-0.5 flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]"><span className="h-2 w-2 rounded-full bg-[var(--accent)]" />Lãi</span>
                      <span className="font-bold text-[var(--foreground)]">{fmtBillion(totalInterest)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${interestPct}%` }} /></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Toggle */}
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <button type="button" onClick={() => setShowSchedule(!showSchedule)}
                className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-[var(--muted)]/50">
                <span className="text-sm font-bold text-[var(--foreground)]">Chi tiết lịch trả nợ</span>
                <svg className={`h-4 w-4 text-[var(--muted-foreground)] transition-transform ${showSchedule ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showSchedule && (
                <div className="border-t border-[var(--border)]">
                  <div className="overflow-x-auto max-h-[400px] scrollbar-thin">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-[var(--muted)]">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-[var(--foreground)]">Năm</th>
                          <th className="px-4 py-2 text-right font-semibold text-[var(--primary)]">Gốc</th>
                          <th className="px-4 py-2 text-right font-semibold text-[var(--accent)]">Lãi</th>
                          <th className="px-4 py-2 text-right font-semibold text-[var(--foreground)]">Tổng</th>
                          <th className="hidden px-4 py-2 text-right font-semibold text-[var(--muted-foreground)] sm:table-cell">Dư nợ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {yearlyRows.map((r) => (
                          <tr key={r.year} className="transition-colors hover:bg-[var(--muted)]/30">
                            <td className="px-4 py-2 font-medium text-[var(--foreground)]">Năm {r.year}</td>
                            <td className="px-4 py-2 text-right text-[var(--primary)]">{fmtBillion(r.principal)}</td>
                            <td className="px-4 py-2 text-right text-[var(--accent)]">{fmtBillion(r.interest)}</td>
                            <td className="px-4 py-2 text-right font-bold text-[var(--foreground)]">{fmtBillion(r.payment)}</td>
                            <td className="hidden px-4 py-2 text-right text-[var(--muted-foreground)] sm:table-cell">{fmtBillion(r.endBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-xs italic text-[var(--muted-foreground)]">
              * Kết quả chỉ mang tính tham khảo. Lãi suất thực tế tùy thuộc chính sách ngân hàng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
