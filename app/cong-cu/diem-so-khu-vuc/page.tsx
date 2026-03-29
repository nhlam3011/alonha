"use client";

import { useEffect, useState } from "react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

type ScoreItem = { score: number; label: string; desc: string };
type ScoreResult = {
  locationName: string;
  overallScore: number;
  scores: Record<string, ScoreItem>;
  highlights: string[];
  concerns: string[];
  summary: string;
  suitableFor: string[];
  nearbyLandmarks: string[];
  marketStats: { listingCount: number; avgPrice: number | null; avgPricePerSqm: number | null };
};

const SCORE_COLORS: Record<string, string> = {
  anNinh: "#3b82f6", giaoThong: "#f59e0b", giaoDuc: "#8b5cf6", yTe: "#ef4444",
  thuongMai: "#10b981", moiTruong: "#06b6d4", tienIch: "#f97316", giaTri: "#ec4899",
};
const SCORE_ICONS: Record<string, string> = {
  anNinh: "🛡️", giaoThong: "🚦", giaoDuc: "🎓", yTe: "🏥",
  thuongMai: "🛒", moiTruong: "🌿", tienIch: "🏢", giaTri: "💰",
};

function fmtPrice(v: number | null) {
  if (!v) return "N/A";
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)} tỷ`;
  if (v >= 1e6) return `${Math.round(v / 1e6)} triệu`;
  return v.toLocaleString("vi-VN");
}

function ScoreRing({ score, size = 72, color }: { score: number; size?: number; color: string }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score / 10;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`} strokeLinecap="round" className="transition-all duration-1000" />
    </svg>
  );
}

export default function NeighborhoodScorePage() {
  const [provinces, setProvinces] = useState<Array<{ code?: string; id: string; name: string }>>([]);
  const [wards, setWards] = useState<Array<{ code: number; name: string }>>([]);
  const [provinceId, setProvinceId] = useState("");
  const [wardName, setWardName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);

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

  async function handleAnalyze() {
    if (!provinceId) { setError("Vui lòng chọn tỉnh/thành"); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/ai/neighborhood-score", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provinceName: selectedProvince?.name || provinceId, wardName: wardName || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi");
      setResult(data.data);
    } catch (err) { setError(err instanceof Error ? err.message : "Không thể phân tích"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">Điểm số Khu vực</h1>
        <p className="mt-2 text-sm sm:text-base text-[var(--muted-foreground)]">Đánh giá tổng hợp khu vực về an ninh, giao thông, giáo dục, y tế, tiện ích và giá trị BĐS.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form */}
        <div className="lg:col-span-4">
          <div className="card-container">
            <div className="card-header"><h2 className="text-sm font-bold text-[var(--foreground)]">Chọn khu vực</h2></div>
            <div className="card-body space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Tỉnh/Thành *</label>
                <SearchableSelect
                  options={provinces.map(p => ({ value: p.code || p.id, label: p.name }))}
                  value={provinceId}
                  onChange={(v) => { setProvinceId(v); setWardName(""); }}
                  placeholder="Chọn tỉnh/thành"
                />
              </div>
              {provinceId && wards.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Phường/Xã</label>
                  <SearchableSelect
                    options={wards.map(w => ({ value: w.name, label: w.name }))}
                    value={wardName}
                    onChange={setWardName}
                    placeholder="Toàn thành phố"
                  />
                </div>
              )}
              {error && <p className="text-xs font-medium text-[var(--destructive)]">{error}</p>}
              <button onClick={handleAnalyze} disabled={loading} className="btn-primary w-full !rounded-lg !py-2.5 text-sm disabled:opacity-50">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />AI đang phân tích...</span> : "Phân tích khu vực"}
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
                <p className="text-sm font-semibold text-[var(--foreground)]">AI đang phân tích khu vực...</p>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="card-container">
              <div className="empty-state py-16 sm:py-20">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary-light)] text-[var(--primary)]">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <h3 className="empty-state-title">Chọn khu vực để phân tích</h3>
                <p className="empty-state-description">AI sẽ đánh giá tổng hợp khu vực về nhiều khía cạnh</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-5 animate-fade-in-up">
              {/* Overall Score */}
              <div className="card-container bg-gradient-to-br from-[var(--primary-light)] to-[var(--card)]">
                <div className="card-body">
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative flex items-center justify-center shrink-0">
                      <ScoreRing score={result.overallScore} size={100} color="var(--primary)" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-extrabold text-[var(--foreground)]">{result.overallScore}</span>
                        <span className="text-[10px] text-[var(--muted-foreground)]">/ 10</span>
                      </div>
                    </div>
                    <div className="text-center sm:text-left flex-1 min-w-0">
                      <h2 className="text-xl font-extrabold text-[var(--foreground)]">{result.locationName}</h2>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">{result.summary}</p>
                      {result.marketStats.listingCount > 0 && (
                        <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                          <span className="badge-primary">{result.marketStats.listingCount} tin đăng</span>
                          {result.marketStats.avgPrice && <span className="badge">TB: {fmtPrice(result.marketStats.avgPrice)}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(result.scores).map(([key, item]) => (
                  <div key={key} className="card-container">
                    <div className="card-body text-center py-4">
                      <div className="mb-1 text-lg">{SCORE_ICONS[key] || "📊"}</div>
                      <div className="relative mx-auto mb-2 flex items-center justify-center">
                        <ScoreRing score={item.score} size={52} color={SCORE_COLORS[key] || "var(--primary)"} />
                        <span className="absolute text-sm font-bold text-[var(--foreground)]">{item.score}</span>
                      </div>
                      <p className="text-[11px] font-bold text-[var(--foreground)]">{item.label}</p>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--muted-foreground)] line-clamp-2">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Highlights & Concerns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-container">
                  <div className="card-body">
                    <h3 className="text-sm font-bold text-emerald-600 mb-3 flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Điểm nổi bật
                    </h3>
                    <ul className="space-y-2">
                      {result.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[var(--foreground)]"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{h}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="card-container">
                  <div className="card-body">
                    <h3 className="text-sm font-bold text-amber-600 mb-3 flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Lưu ý
                    </h3>
                    <ul className="space-y-2">
                      {result.concerns.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[var(--foreground)]"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Suitable For & Landmarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-container">
                  <div className="card-body">
                    <h3 className="text-sm font-bold text-[var(--foreground)] mb-3">Phù hợp với</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.suitableFor.map((s, i) => <span key={i} className="badge-primary">{s}</span>)}
                    </div>
                  </div>
                </div>
                <div className="card-container">
                  <div className="card-body">
                    <h3 className="text-sm font-bold text-[var(--foreground)] mb-3">Địa điểm lân cận</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.nearbyLandmarks.map((l, i) => <span key={i} className="badge">{l}</span>)}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-center text-[10px] italic text-[var(--muted-foreground)]">* Đánh giá được AI tổng hợp từ dữ liệu thị trường và kiến thức khu vực. Chỉ mang tính tham khảo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
