"use client";

import { useEffect, useState } from "react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

type Factor = { name: string; impact: "positive" | "negative" | "neutral"; desc: string };
type PriceResult = {
  estimatedPrice: number;
  estimatedPricePerSqm: number;
  priceRange: { min: number; max: number };
  confidence: number;
  vsAreaAverage: string;
  priceTrend: string;
  factors: Factor[];
  investmentRating: number;
  summary: string;
  recommendation: string;
  dataPoints: number;
};

const CATEGORY_OPTIONS = [
  { value: "CAN_HO_CHUNG_CU", label: "Căn hộ / Chung cư" },
  { value: "NHA_RIENG", label: "Nhà riêng" },
  { value: "NHA_MAT_PHONG", label: "Nhà mặt phố" },
  { value: "DAT_NEN", label: "Đất nền" },
  { value: "KHO_NHA_XUONG", label: "Kho / Nhà xưởng" },
  { value: "BDS_KHAC", label: "BĐS khác" },
];

const DIRECTION_OPTIONS = ["Đông", "Tây", "Nam", "Bắc", "Đông Nam", "Đông Bắc", "Tây Nam", "Tây Bắc"];
const CONDITION_OPTIONS = ["Mới xây", "Cũ cần sửa", "Đang sử dụng tốt", "Bàn giao thô", "Đầy đủ nội thất"];

function fmtPrice(v: number) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)} tỷ`;
  if (v >= 1e6) return `${Math.round(v / 1e6)} triệu`;
  return v.toLocaleString("vi-VN");
}

function fmtPricePerSqm(v: number) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)} tỷ/m²`;
  if (v >= 1e6) return `${Math.round(v / 1e6)} triệu/m²`;
  return `${v.toLocaleString("vi-VN")} đ/m²`;
}

export default function PriceEstimatePage() {
  const [provinces, setProvinces] = useState<Array<{ code?: string; id: string; name: string }>>([]);
  const [wards, setWards] = useState<Array<{ code: number; name: string }>>([]);

  const [category, setCategory] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [wardName, setWardName] = useState("");
  const [area, setArea] = useState(80);
  const [bedrooms, setBedrooms] = useState(2);
  const [direction, setDirection] = useState("");
  const [condition, setCondition] = useState("");
  const [listingType, setListingType] = useState("sale");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PriceResult | null>(null);

  useEffect(() => {
    fetch("/api/provinces").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setProvinces(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!provinceId) { setWards([]); return; }
    fetch(`/api/wards?provinceCode=${encodeURIComponent(provinceId)}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setWards(d); else setWards([]); })
      .catch(() => setWards([]));
  }, [provinceId]);

  const selectedProvince = provinces.find((p) => p.code === provinceId || p.id === provinceId);

  async function handleEstimate() {
    if (!category || !provinceId || !area) {
      setError("Vui lòng chọn đầy đủ loại BĐS, tỉnh/thành và diện tích");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/price-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          provinceName: selectedProvince?.name || provinceId,
          wardName,
          area,
          bedrooms,
          direction: direction || null,
          condition: condition || null,
          listingType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi");
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể phân tích");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">AI Định giá BĐS</h1>
        <p className="mt-2 text-sm sm:text-base text-[var(--muted-foreground)]">Nhập thông tin bất động sản để AI ước tính giá trị thực và phân tích thị trường.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form Panel */}
        <div className="lg:col-span-4">
          <div className="card-container">
            <div className="card-header">
              <h2 className="text-sm font-bold text-[var(--foreground)]">Thông tin BĐS</h2>
            </div>
            <div className="card-body space-y-4">
              {/* Loại giao dịch */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Loại giao dịch</label>
                <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-[var(--muted)] p-1">
                  {["sale", "rent"].map((t) => (
                    <button key={t} onClick={() => setListingType(t)}
                      className={`rounded-md px-2 py-2 text-xs font-semibold transition-all ${listingType === t ? "bg-[var(--card)] text-[var(--primary)] shadow-sm" : "text-[var(--muted-foreground)]"}`}>
                      {t === "sale" ? "Mua bán" : "Cho thuê"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loại BĐS */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Loại BĐS *</label>
                <SearchableSelect
                  options={CATEGORY_OPTIONS.map(c => ({ value: c.value, label: c.label }))}
                  value={category}
                  onChange={setCategory}
                  placeholder="Chọn loại BĐS"
                />
              </div>

              {/* Tỉnh/Thành */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Tỉnh/Thành *</label>
                <SearchableSelect
                  options={provinces.map(p => ({ value: p.code || p.id, label: p.name }))}
                  value={provinceId}
                  onChange={(v) => { setProvinceId(v); setWardName(""); }}
                  placeholder="Chọn tỉnh/thành"
                />
              </div>

              {/* Phường/Xã */}
              {provinceId && wards.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Phường/Xã</label>
                  <SearchableSelect
                    options={wards.map(w => ({ value: w.name, label: w.name }))}
                    value={wardName}
                    onChange={setWardName}
                    placeholder="Tất cả"
                  />
                </div>
              )}

              {/* Diện tích */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Diện tích *</label>
                  <span className="text-sm font-bold text-[var(--primary)]">{area} m²</span>
                </div>
                <input type="range" min={10} max={500} step={5} value={area} onChange={(e) => setArea(Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[var(--muted)] accent-[var(--primary)]" />
                <div className="mt-1 flex justify-between text-[10px] text-[var(--muted-foreground)]"><span>10m²</span><span>500m²</span></div>
              </div>

              {/* Phòng ngủ */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Phòng ngủ</label>
                  <span className="text-sm font-bold text-[var(--foreground)]">{bedrooms} PN</span>
                </div>
                <input type="range" min={0} max={10} step={1} value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[var(--muted)] accent-[var(--primary)]" />
              </div>

              {/* Hướng & Tình trạng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Hướng nhà</label>
                  <SearchableSelect
                    options={DIRECTION_OPTIONS.map(d => ({ value: d, label: d }))}
                    value={direction}
                    onChange={setDirection}
                    placeholder="Không chọn"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Tình trạng</label>
                  <SearchableSelect
                    options={CONDITION_OPTIONS.map(c => ({ value: c, label: c }))}
                    value={condition}
                    onChange={setCondition}
                    placeholder="Không chọn"
                  />
                </div>
              </div>

              {error && <p className="text-xs font-medium text-[var(--destructive)]">{error}</p>}

              <button onClick={handleEstimate} disabled={loading}
                className="btn-primary w-full !rounded-lg !py-2.5 text-sm disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    AI đang phân tích...
                  </span>
                ) : "Định giá ngay"}
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-8 space-y-5">
          {loading && (
            <div className="card-container">
              <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                <p className="text-sm font-semibold text-[var(--foreground)]">AI đang phân tích dữ liệu thị trường...</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">Quá trình này có thể mất 10-30 giây</p>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="card-container">
              <div className="empty-state py-16 sm:py-20">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary-light)] text-[var(--primary)]">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h3 className="empty-state-title">Nhập thông tin BĐS</h3>
                <p className="empty-state-description">Điền thông tin bên trái và bấm &quot;Định giá ngay&quot; để AI phân tích giá trị thực</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-5 animate-fade-in-up">
              {/* Main Price Card */}
              <div className="card-container bg-gradient-to-br from-[var(--primary-light)] to-[var(--card)]">
                <div className="card-body">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Giá ước tính</p>
                      <p className="mt-1 text-3xl sm:text-4xl font-extrabold text-[var(--primary)]">{fmtPrice(result.estimatedPrice)}</p>
                      <p className="mt-1 text-xs sm:text-sm text-[var(--muted-foreground)]">{fmtPricePerSqm(result.estimatedPricePerSqm)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="badge-success">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Độ tin cậy: {result.confidence}%
                      </span>
                      <span className="badge-primary">{result.dataPoints} dữ liệu</span>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                      <span>{fmtPrice(result.priceRange.min)}</span>
                      <span>{fmtPrice(result.priceRange.max)}</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-[var(--muted)]">
                      <div className="absolute inset-y-0 left-[20%] right-[20%] rounded-full bg-[var(--primary)]/30" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-[var(--primary)] shadow-lg border-2 border-white" />
                    </div>
                    <p className="mt-1 text-center text-[10px] text-[var(--muted-foreground)]">Khoảng giá ước tính</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "vs Mặt bằng", value: result.vsAreaAverage },
                  { label: "Xu hướng giá", value: result.priceTrend },
                  { label: "Đánh giá", value: `${result.investmentRating}/5 ⭐` },
                ].map((s) => (
                  <div key={s.label} className="card-container">
                    <div className="card-body text-center py-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">{s.label}</p>
                      <p className="mt-1 text-sm font-bold text-[var(--foreground)]">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Factors */}
              {result.factors?.length > 0 && (
                <div className="card-container">
                  <div className="card-body">
                    <h3 className="text-sm font-bold text-[var(--foreground)] mb-3">Yếu tố ảnh hưởng</h3>
                    <div className="space-y-2">
                      {result.factors.map((f, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-lg bg-[var(--muted)] p-3">
                          <div className={`mt-0.5 h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${f.impact === "positive" ? "bg-emerald-100 text-emerald-600" : f.impact === "negative" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                            {f.impact === "positive" ? "↑" : f.impact === "negative" ? "↓" : "─"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--foreground)]">{f.name}</p>
                            <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">{f.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Summary & Recommendation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-container">
                  <div className="card-body">
                    <h3 className="text-sm font-bold text-[var(--foreground)] mb-2">Tóm tắt phân tích</h3>
                    <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{result.summary}</p>
                  </div>
                </div>
                <div className="card-container border-[var(--primary)]/30 bg-[var(--primary-light)]">
                  <div className="card-body">
                    <h3 className="text-sm font-bold text-[var(--primary)] mb-2">Khuyến nghị</h3>
                    <p className="text-sm leading-relaxed text-[var(--foreground)]">{result.recommendation}</p>
                  </div>
                </div>
              </div>

              <p className="text-center text-[10px] italic text-[var(--muted-foreground)]">* Kết quả được AI phân tích dựa trên dữ liệu thị trường. Chỉ mang tính tham khảo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
