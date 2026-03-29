"use client";

import { useEffect, useState } from "react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

type YearProjection = { year: number; propertyValue: number; rentalIncome: number; totalReturn: number; cumulativeROI: number };
type Risk = { name: string; level: "high" | "medium" | "low"; desc: string };
type InvestmentResult = {
  roi: { yearlyProjection: YearProjection[]; totalROI: number; annualizedROI: number; breakEvenYear: number };
  rentalYield: { grossYield: number; netYield: number; estimatedMonthlyRent: number; occupancyRate: number };
  comparison: { vsBankDeposit: string; vsGold: string; vsStock: string };
  risks: Risk[]; opportunities: string[]; recommendation: string; reasoning: string; bestStrategy: string; summary: string;
  marketData: { listingsFound: number; rentListingsFound: number; avgBuyPrice: number; avgRentPrice: number; grossYield: number };
};

const CATEGORY_OPTIONS = [
  { value: "CAN_HO_CHUNG_CU", label: "Căn hộ / Chung cư" },
  { value: "NHA_RIENG", label: "Nhà riêng" },
  { value: "NHA_MAT_PHONG", label: "Nhà mặt phố" },
  { value: "DAT_NEN", label: "Đất nền" },
  { value: "BDS_KHAC", label: "BĐS khác" },
];

function fmtPrice(v: number) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)} tỷ`;
  if (v >= 1e6) return `${Math.round(v / 1e6)} triệu`;
  return v.toLocaleString("vi-VN");
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = { high: "badge-destructive", medium: "badge-warning", low: "badge-success" };
  const labels: Record<string, string> = { high: "Cao", medium: "TB", low: "Thấp" };
  return <span className={colors[level] || "badge"}>{labels[level] || level}</span>;
}

export default function InvestmentAnalysisPage() {
  const [provinces, setProvinces] = useState<Array<{ code?: string; id: string; name: string }>>([]);
  const [provinceId, setProvinceId] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState(3_000_000_000);
  const [investmentType, setInvestmentType] = useState("longterm");
  const [holdingPeriod, setHoldingPeriod] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InvestmentResult | null>(null);

  useEffect(() => {
    fetch("/api/provinces").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setProvinces(d); }).catch(() => {});
  }, []);

  const selectedProvince = provinces.find((p) => p.code === provinceId || p.id === provinceId);

  async function handleAnalyze() {
    if (!provinceId || !budget) { setError("Vui lòng chọn tỉnh/thành và nhập ngân sách"); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/ai/investment-analysis", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provinceName: selectedProvince?.name || provinceId, category: category || null, budget, investmentType, holdingPeriod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi");
      setResult(data.data);
    } catch (err) { setError(err instanceof Error ? err.message : "Không thể phân tích"); }
    finally { setLoading(false); }
  }

  const isPositive = result?.recommendation?.includes("NÊN");
  const isNegative = result?.recommendation?.includes("CHỜ");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">AI Phân tích Đầu tư</h1>
        <p className="mt-2 text-sm sm:text-base text-[var(--muted-foreground)]">Phân tích tiềm năng đầu tư BĐS: ROI, tỷ suất cho thuê, so sánh kênh đầu tư và chiến lược tối ưu.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form */}
        <div className="lg:col-span-4">
          <div className="card-container">
            <div className="card-header"><h2 className="text-sm font-bold text-[var(--foreground)]">Thông tin đầu tư</h2></div>
            <div className="card-body space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Khu vực *</label>
                <SearchableSelect options={provinces.map(p => ({ value: p.code || p.id, label: p.name }))} value={provinceId} onChange={setProvinceId} placeholder="Chọn tỉnh/thành" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Loại BĐS</label>
                <SearchableSelect options={CATEGORY_OPTIONS.map(c => ({ value: c.value, label: c.label }))} value={category} onChange={setCategory} placeholder="Tất cả" />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Ngân sách *</label>
                  <span className="text-sm font-bold text-[var(--primary)]">{fmtPrice(budget)}</span>
                </div>
                <input type="range" min={500_000_000} max={50_000_000_000} step={100_000_000} value={budget} onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[var(--muted)] accent-[var(--primary)]" />
                <div className="mt-1 flex justify-between text-[10px] text-[var(--muted-foreground)]"><span>500tr</span><span>50 tỷ</span></div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Chiến lược</label>
                <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-[var(--muted)] p-1">
                  {[{ v: "longterm", l: "Dài hạn" }, { v: "rent", l: "Cho thuê" }, { v: "flip", l: "Lướt sóng" }].map((s) => (
                    <button key={s.v} onClick={() => setInvestmentType(s.v)}
                      className={`rounded-md px-1 py-2 text-[11px] font-semibold transition-all ${investmentType === s.v ? "bg-[var(--card)] text-[var(--primary)] shadow-sm" : "text-[var(--muted-foreground)]"}`}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Nắm giữ</label>
                  <span className="text-sm font-bold text-[var(--foreground)]">{holdingPeriod} năm</span>
                </div>
                <input type="range" min={1} max={20} step={1} value={holdingPeriod} onChange={(e) => setHoldingPeriod(Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[var(--muted)] accent-[var(--primary)]" />
              </div>
              {error && <p className="text-xs font-medium text-[var(--destructive)]">{error}</p>}
              <button onClick={handleAnalyze} disabled={loading} className="btn-primary w-full !rounded-lg !py-2.5 text-sm disabled:opacity-50">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />AI đang phân tích...</span> : "Phân tích đầu tư"}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-8 space-y-5">
          {loading && (
            <div className="card-container">
              <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                <p className="text-sm font-semibold text-[var(--foreground)]">AI đang phân tích tiềm năng đầu tư...</p>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="card-container">
              <div className="empty-state py-16 sm:py-20">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary-light)] text-[var(--primary)]">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <h3 className="empty-state-title">Nhập thông tin đầu tư</h3>
                <p className="empty-state-description">AI sẽ phân tích ROI, tỷ suất cho thuê và so sánh với các kênh đầu tư khác</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-5 animate-fade-in-up">
              {/* Recommendation Banner */}
              <div className={`card-container ${isPositive ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-[var(--card)]" : isNegative ? "border-red-300 bg-gradient-to-br from-red-50 to-[var(--card)]" : "border-amber-300 bg-gradient-to-br from-amber-50 to-[var(--card)]"}`}>
                <div className="card-body">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${isPositive ? "bg-emerald-100" : isNegative ? "bg-red-100" : "bg-amber-100"}`}>
                      {isPositive ? "✅" : isNegative ? "⚠️" : "🤔"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Khuyến nghị</p>
                      <p className="mt-1 text-lg sm:text-xl font-extrabold text-[var(--foreground)]">{result.recommendation}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">{result.reasoning}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROI Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Tổng ROI", value: `${result.roi.totalROI?.toFixed(1)}%`, color: "text-[var(--primary)]" },
                  { label: "ROI/năm", value: `${result.roi.annualizedROI?.toFixed(1)}%`, color: "text-[var(--foreground)]" },
                  { label: "Tỷ suất thuê", value: `${result.rentalYield.grossYield?.toFixed(1)}%`, color: "text-emerald-600" },
                  { label: "Hoàn vốn", value: `${result.roi.breakEvenYear} năm`, color: "text-[var(--foreground)]" },
                ].map((s) => (
                  <div key={s.label} className="card-container">
                    <div className="card-body text-center py-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">{s.label}</p>
                      <p className={`mt-1 text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rental Details */}
              <div className="card-container">
                <div className="card-body">
                  <h3 className="text-sm font-bold text-[var(--foreground)] mb-3">Chi tiết cho thuê</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Thuê ước tính", value: `${result.rentalYield.estimatedMonthlyRent} tr/tháng` },
                      { label: "Brutto", value: `${result.rentalYield.grossYield?.toFixed(2)}%/năm` },
                      { label: "Netto", value: `${result.rentalYield.netYield?.toFixed(2)}%/năm` },
                      { label: "Lấp đầy", value: `${result.rentalYield.occupancyRate}%` },
                    ].map((d) => (
                      <div key={d.label} className="rounded-lg bg-[var(--muted)] p-3 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">{d.label}</p>
                        <p className="mt-1 text-sm font-bold text-[var(--foreground)]">{d.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Yearly Projection */}
              {result.roi.yearlyProjection?.length > 0 && (
                <div className="card-container">
                  <div className="card-body">
                    <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">Dự báo theo năm</h3>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="flex items-end gap-1 px-4 sm:px-0" style={{ minWidth: result.roi.yearlyProjection.length * 44 }}>
                        {result.roi.yearlyProjection.map((y) => {
                          const maxRoi = Math.max(...result.roi.yearlyProjection.map(p => p.cumulativeROI || 1), 1);
                          return (
                            <div key={y.year} className="flex flex-1 flex-col items-center gap-1">
                              <span className="text-[9px] font-bold text-[var(--primary)]">{y.cumulativeROI?.toFixed(0)}%</span>
                              <div className="w-full rounded-t-md bg-[var(--primary)]" style={{ height: `${Math.max(8, (y.cumulativeROI / maxRoi) * 140)}px`, minHeight: 8 }} />
                              <span className="text-[9px] text-[var(--muted-foreground)]">N{y.year}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comparison */}
              <div className="card-container">
                <div className="card-body">
                  <h3 className="text-sm font-bold text-[var(--foreground)] mb-3">So sánh kênh đầu tư</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Gửi ngân hàng", desc: result.comparison.vsBankDeposit, icon: "🏦", color: "bg-blue-50" },
                      { label: "Vàng", desc: result.comparison.vsGold, icon: "🥇", color: "bg-amber-50" },
                      { label: "Chứng khoán", desc: result.comparison.vsStock, icon: "📈", color: "bg-emerald-50" },
                    ].map((ch) => (
                      <div key={ch.label} className={`rounded-xl ${ch.color} p-4`}>
                        <span className="text-lg">{ch.icon}</span>
                        <p className="mt-2 text-xs font-bold text-[var(--foreground)]">{ch.label}</p>
                        <p className="mt-1 text-[11px] text-[var(--muted-foreground)] leading-relaxed">{ch.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Risks & Opportunities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-container">
                  <div className="card-body">
                    <h3 className="text-sm font-bold text-red-600 mb-3">Rủi ro</h3>
                    <div className="space-y-2">
                      {result.risks.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg bg-[var(--muted)] p-3">
                          <RiskBadge level={r.level} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--foreground)]">{r.name}</p>
                            <p className="text-[10px] text-[var(--muted-foreground)]">{r.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="card-container">
                  <div className="card-body">
                    <h3 className="text-sm font-bold text-emerald-600 mb-3">Cơ hội</h3>
                    <ul className="space-y-2">
                      {result.opportunities.map((o, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[var(--foreground)]"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{o}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Strategy & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-container">
                  <div className="card-body">
                    <h3 className="text-sm font-bold text-[var(--foreground)] mb-2">Chiến lược tối ưu</h3>
                    <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{result.bestStrategy}</p>
                  </div>
                </div>
                <div className="card-container">
                  <div className="card-body">
                    <h3 className="text-sm font-bold text-[var(--foreground)] mb-2">Tóm tắt</h3>
                    <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{result.summary}</p>
                  </div>
                </div>
              </div>

              <p className="text-center text-[10px] italic text-[var(--muted-foreground)]">* Phân tích dựa trên dữ liệu thị trường và mô hình ước tính. Không phải lời khuyên tài chính.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
