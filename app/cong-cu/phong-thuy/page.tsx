"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";

type Gender = "male" | "female";
type CungMenh = "Khảm" | "Khôn" | "Chấn" | "Tốn" | "Ly" | "Càn" | "Đoài" | "Cấn";

const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

const NGU_HANH: Record<CungMenh, string> = {
  Khảm: "Thủy", Khôn: "Thổ", Chấn: "Mộc", Tốn: "Mộc",
  Ly: "Hỏa", Càn: "Kim", Đoài: "Kim", Cấn: "Thổ",
};
const NHOM_TRACH: Record<CungMenh, string> = {
  Khảm: "Đông Tứ", Chấn: "Đông Tứ", Tốn: "Đông Tứ", Ly: "Đông Tứ",
  Càn: "Tây Tứ", Khôn: "Tây Tứ", Đoài: "Tây Tứ", Cấn: "Tây Tứ",
};

type HuongInfo = { sao: string; loai: "Cát" | "Hung"; desc: string };

const BAT_TRACH: Record<CungMenh, Record<string, HuongInfo>> = {
  Khảm: { "Bắc": { sao: "Phục Vị", loai: "Cát", desc: "Bản mệnh" }, "Đông Nam": { sao: "Sinh Khí", loai: "Cát", desc: "Tài lộc" }, "Đông": { sao: "Thiên Y", loai: "Cát", desc: "Sức khỏe" }, "Nam": { sao: "Diên Niên", loai: "Cát", desc: "Hôn nhân" }, "Tây": { sao: "Họa Hại", loai: "Hung", desc: "Tiểu nhân" }, "Tây Bắc": { sao: "Lục Sát", loai: "Hung", desc: "Tình cảm" }, "Đông Bắc": { sao: "Ngũ Quỷ", loai: "Hung", desc: "Tai họa" }, "Tây Nam": { sao: "Tuyệt Mệnh", loai: "Hung", desc: "Hung nhất" } },
  Khôn: { "Tây Nam": { sao: "Phục Vị", loai: "Cát", desc: "Bản mệnh" }, "Đông Bắc": { sao: "Sinh Khí", loai: "Cát", desc: "Tài lộc" }, "Tây": { sao: "Thiên Y", loai: "Cát", desc: "Sức khỏe" }, "Tây Bắc": { sao: "Diên Niên", loai: "Cát", desc: "Hôn nhân" }, "Đông": { sao: "Họa Hại", loai: "Hung", desc: "Tiểu nhân" }, "Nam": { sao: "Lục Sát", loai: "Hung", desc: "Tình cảm" }, "Đông Nam": { sao: "Ngũ Quỷ", loai: "Hung", desc: "Tai họa" }, "Bắc": { sao: "Tuyệt Mệnh", loai: "Hung", desc: "Hung nhất" } },
  Chấn: { "Đông": { sao: "Phục Vị", loai: "Cát", desc: "Bản mệnh" }, "Nam": { sao: "Sinh Khí", loai: "Cát", desc: "Tài lộc" }, "Bắc": { sao: "Thiên Y", loai: "Cát", desc: "Sức khỏe" }, "Đông Nam": { sao: "Diên Niên", loai: "Cát", desc: "Hôn nhân" }, "Tây Nam": { sao: "Họa Hại", loai: "Hung", desc: "Tiểu nhân" }, "Đông Bắc": { sao: "Lục Sát", loai: "Hung", desc: "Tình cảm" }, "Tây Bắc": { sao: "Ngũ Quỷ", loai: "Hung", desc: "Tai họa" }, "Tây": { sao: "Tuyệt Mệnh", loai: "Hung", desc: "Hung nhất" } },
  Tốn: { "Đông Nam": { sao: "Phục Vị", loai: "Cát", desc: "Bản mệnh" }, "Bắc": { sao: "Sinh Khí", loai: "Cát", desc: "Tài lộc" }, "Nam": { sao: "Thiên Y", loai: "Cát", desc: "Sức khỏe" }, "Đông": { sao: "Diên Niên", loai: "Cát", desc: "Hôn nhân" }, "Tây Bắc": { sao: "Họa Hại", loai: "Hung", desc: "Tiểu nhân" }, "Tây": { sao: "Lục Sát", loai: "Hung", desc: "Tình cảm" }, "Tây Nam": { sao: "Ngũ Quỷ", loai: "Hung", desc: "Tai họa" }, "Đông Bắc": { sao: "Tuyệt Mệnh", loai: "Hung", desc: "Hung nhất" } },
  Ly: { "Nam": { sao: "Phục Vị", loai: "Cát", desc: "Bản mệnh" }, "Đông": { sao: "Sinh Khí", loai: "Cát", desc: "Tài lộc" }, "Đông Nam": { sao: "Thiên Y", loai: "Cát", desc: "Sức khỏe" }, "Bắc": { sao: "Diên Niên", loai: "Cát", desc: "Hôn nhân" }, "Đông Bắc": { sao: "Họa Hại", loai: "Hung", desc: "Tiểu nhân" }, "Tây Nam": { sao: "Lục Sát", loai: "Hung", desc: "Tình cảm" }, "Tây": { sao: "Ngũ Quỷ", loai: "Hung", desc: "Tai họa" }, "Tây Bắc": { sao: "Tuyệt Mệnh", loai: "Hung", desc: "Hung nhất" } },
  Càn: { "Tây Bắc": { sao: "Phục Vị", loai: "Cát", desc: "Bản mệnh" }, "Tây": { sao: "Sinh Khí", loai: "Cát", desc: "Tài lộc" }, "Đông Bắc": { sao: "Thiên Y", loai: "Cát", desc: "Sức khỏe" }, "Tây Nam": { sao: "Diên Niên", loai: "Cát", desc: "Hôn nhân" }, "Đông Nam": { sao: "Họa Hại", loai: "Hung", desc: "Tiểu nhân" }, "Bắc": { sao: "Lục Sát", loai: "Hung", desc: "Tình cảm" }, "Đông": { sao: "Ngũ Quỷ", loai: "Hung", desc: "Tai họa" }, "Nam": { sao: "Tuyệt Mệnh", loai: "Hung", desc: "Hung nhất" } },
  Đoài: { "Tây": { sao: "Phục Vị", loai: "Cát", desc: "Bản mệnh" }, "Tây Bắc": { sao: "Sinh Khí", loai: "Cát", desc: "Tài lộc" }, "Tây Nam": { sao: "Thiên Y", loai: "Cát", desc: "Sức khỏe" }, "Đông Bắc": { sao: "Diên Niên", loai: "Cát", desc: "Hôn nhân" }, "Bắc": { sao: "Họa Hại", loai: "Hung", desc: "Tiểu nhân" }, "Đông Nam": { sao: "Lục Sát", loai: "Hung", desc: "Tình cảm" }, "Nam": { sao: "Ngũ Quỷ", loai: "Hung", desc: "Tai họa" }, "Đông": { sao: "Tuyệt Mệnh", loai: "Hung", desc: "Hung nhất" } },
  Cấn: { "Đông Bắc": { sao: "Phục Vị", loai: "Cát", desc: "Bản mệnh" }, "Tây Nam": { sao: "Sinh Khí", loai: "Cát", desc: "Tài lộc" }, "Tây Bắc": { sao: "Thiên Y", loai: "Cát", desc: "Sức khỏe" }, "Tây": { sao: "Diên Niên", loai: "Cát", desc: "Hôn nhân" }, "Nam": { sao: "Họa Hại", loai: "Hung", desc: "Tiểu nhân" }, "Đông": { sao: "Lục Sát", loai: "Hung", desc: "Tình cảm" }, "Bắc": { sao: "Ngũ Quỷ", loai: "Hung", desc: "Tai họa" }, "Đông Nam": { sao: "Tuyệt Mệnh", loai: "Hung", desc: "Hung nhất" } },
};

// Lunar calendar utilities
function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12); const y = yy + 4800 - a; const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  return jd;
}
function newMoon(k: number): number {
  const T = k / 1236.85; const T2 = T * T; const T3 = T2 * T; const dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr) - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 += 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 -= 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 -= 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 += 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat = T < -11 ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3 : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Jd1 + C1 - deltat;
}
function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525; const T2 = T * T; const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr; L -= Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return L;
}
function getSunLongitude(d: number, tz: number) { return Math.floor(sunLongitude(d - 0.5 - tz / 24) / Math.PI * 6); }
function getNewMoonDay(k: number, tz: number) { return Math.floor(newMoon(k) + 0.5 + tz / 24); }
function getLunarMonth11(yy: number, tz: number) {
  const off = jdFromDate(31, 12, yy) - 2415021; const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, tz); if (getSunLongitude(nm, tz) >= 9) nm = getNewMoonDay(k - 1, tz); return nm;
}
function getLeapMonthOffset(a11: number, tz: number) {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0, i = 1, arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
  do { last = arc; i++; arc = getSunLongitude(getNewMoonDay(k + i, tz), tz); } while (arc !== last && i < 14);
  return i - 1;
}
function convertSolar2Lunar(dd: number, mm: number, yy: number, tz: number): [number, number, number, boolean] {
  const dayNumber = jdFromDate(dd, mm, yy); const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, tz); if (monthStart > dayNumber) monthStart = getNewMoonDay(k, tz);
  let a11 = getLunarMonth11(yy, tz); let b11 = a11; let lunarYear: number;
  if (a11 >= monthStart) { lunarYear = yy; a11 = getLunarMonth11(yy - 1, tz); } else { lunarYear = yy + 1; b11 = getLunarMonth11(yy + 1, tz); }
  const lunarDay = dayNumber - monthStart + 1; const diff = Math.floor((monthStart - a11) / 29);
  let lunarLeap = false; let lunarMonth = diff + 11;
  if (b11 - a11 > 365) { const lmo = getLeapMonthOffset(a11, tz); if (diff >= lmo) { lunarMonth = diff + 10; if (diff === lmo) lunarLeap = true; } }
  if (lunarMonth > 12) lunarMonth -= 12; if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return [lunarDay, lunarMonth, lunarYear, lunarLeap];
}
function getCanChi(lunarYear: number): string { return `${THIEN_CAN[(lunarYear + 6) % 10]} ${DIA_CHI[(lunarYear + 8) % 12]}`; }
function digitSum(n: number): number { let s = Math.abs(n); while (s > 9) { let sum = 0; while (s > 0) { sum += s % 10; s = Math.floor(s / 10); } s = sum; } return s; }
function calcCungMenh(lunarYear: number, gender: Gender): CungMenh {
  const A = digitSum(lunarYear % 100);
  let q: number;
  if (lunarYear < 2000) { q = gender === "male" ? digitSum(10 - A) : digitSum(5 + A); }
  else { q = gender === "male" ? (9 - A || 9) : digitSum(6 + A); }
  if (q === 5) return gender === "male" ? "Khôn" : "Cấn";
  const map: Record<number, CungMenh> = { 1: "Khảm", 2: "Khôn", 3: "Chấn", 4: "Tốn", 6: "Càn", 7: "Đoài", 8: "Cấn", 9: "Ly" };
  return map[q] || "Khảm";
}

type AiDetail = {
  mucDo: string; saoTen: string; yNghia: string;
  nenDat: (string | { vat?: string; lyDo?: string })[]; khongNenDat: (string | { vat?: string; lyDo?: string })[];
  luuY: string; vatPhamHoaGiai?: string[]; mauSacPhong?: string;
};

function formatItem(item: string | { vat?: string; lyDo?: string }): string {
  if (typeof item === "string") return item;
  if (item.vat && item.lyDo) return `${item.vat} — ${item.lyDo}`;
  return item.vat || item.lyDo || JSON.stringify(item);
}

function DirectionModal({ huong, info, cungMenh, nguHanh, nhomTrach, onClose }: {
  huong: string; info: HuongInfo; cungMenh: string; nguHanh: string; nhomTrach: string; onClose: () => void;
}) {
  const isCat = info.loai === "Cát";
  const [detail, setDetail] = useState<AiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/feng-shui", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ huong, sao: info.sao, loai: info.loai, cungMenh, nguHanh, nhomTrach }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Lỗi");
        setDetail(data.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Không thể tải chi tiết");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [huong, info.sao, info.loai, cungMenh, nguHanh, nhomTrach]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-slide-up overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--foreground)]">
              {huong}
              <span className={isCat ? "badge-primary" : "badge-destructive"}>{info.sao}</span>
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">{info.desc}</p>
          </div>
          <button onClick={onClose} className="rounded-lg bg-[var(--muted)] p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
              <p className="text-sm text-[var(--muted-foreground)]">AI đang phân tích hướng {huong}...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">{error}</p>
            </div>
          ) : detail ? (
            <div className="space-y-4">
              {/* Muc do */}
              <div className="flex items-center gap-2">
                <span className={isCat ? "badge-success" : "badge-destructive"}>{detail.mucDo}</span>
                <span className="text-xs text-[var(--muted-foreground)]">{detail.saoTen}</span>
              </div>

              {/* Y nghia */}
              <div>
                <h4 className="mb-1.5 text-xs font-bold uppercase text-[var(--muted-foreground)]">Ý nghĩa</h4>
                <p className="rounded-lg bg-[var(--muted)] p-3 text-sm leading-relaxed text-[var(--foreground)]">{detail.yNghia}</p>
              </div>

              {/* Nen / Khong nen */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <h4 className="mb-2 text-xs font-bold text-[var(--primary)]">✓ Nên đặt</h4>
                  <ul className="space-y-1.5">
                    {detail.nenDat.map((item, i) => (
                      <li key={i} className="text-xs leading-relaxed text-[var(--foreground)]">• {formatItem(item)}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  <h4 className="mb-2 text-xs font-bold text-[var(--accent)]">✕ Không nên</h4>
                  <ul className="space-y-1.5">
                    {detail.khongNenDat.map((item, i) => (
                      <li key={i} className="text-xs leading-relaxed text-[var(--foreground)]">• {formatItem(item)}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Luu y */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3">
                <h4 className="mb-1 text-xs font-bold text-[var(--foreground)]">⚠ Lưu ý phong thủy</h4>
                <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">{detail.luuY}</p>
              </div>

              {/* Vat pham + Mau sac */}
              <div className="grid grid-cols-2 gap-3">
                {detail.vatPhamHoaGiai && detail.vatPhamHoaGiai.length > 0 && (
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                    <h4 className="mb-1.5 text-xs font-bold text-[var(--foreground)]">🏺 Vật phẩm gợi ý</h4>
                    <ul className="space-y-1">
                      {detail.vatPhamHoaGiai.map((item, i) => (
                        <li key={i} className="text-xs text-[var(--muted-foreground)]">• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {detail.mauSacPhong && (
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                    <h4 className="mb-1.5 text-xs font-bold text-[var(--foreground)]">🎨 Màu sắc phù hợp</h4>
                    <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">{detail.mauSacPhong}</p>
                  </div>
                )}
              </div>

              <p className="text-center text-[10px] italic text-[var(--muted-foreground)]">
                * Phân tích bởi AI dựa trên Bát Trạch Minh Cảnh. Tham khảo thêm chuyên gia.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function FengShuiPage() {
  const currentYear = new Date().getFullYear();
  const [birthDay, setBirthDay] = useState(1);
  const [birthMonth, setBirthMonth] = useState(1);
  const [birthYear, setBirthYear] = useState(1990);
  const [gender, setGender] = useState<Gender>("male");
  const [selectedHuong, setSelectedHuong] = useState<string | null>(null);

  const result = useMemo(() => {
    const [lunarDay, lunarMonth, lunarYear, lunarLeap] = convertSolar2Lunar(birthDay, birthMonth, birthYear, 7);
    const canChi = getCanChi(lunarYear);
    const cungMenh = calcCungMenh(lunarYear, gender);
    const nguHanh = NGU_HANH[cungMenh];
    const nhomTrach = NHOM_TRACH[cungMenh];
    const batTrach = BAT_TRACH[cungMenh];
    const catHuong = Object.entries(batTrach).filter(([, v]) => v.loai === "Cát");
    const hungHuong = Object.entries(batTrach).filter(([, v]) => v.loai === "Hung");
    return { lunarDay, lunarMonth, lunarYear, lunarLeap, canChi, cungMenh, nguHanh, nhomTrach, catHuong, hungHuong, batTrach };
  }, [birthDay, birthMonth, birthYear, gender]);

  const selectClass = "w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]";

  return (
    <div className="layout-container py-6 lg:py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/cong-cu" className="group mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)]">
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Công cụ
          </Link>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)] lg:text-3xl">Xem phong thủy nhà ở</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              <div className="border-b border-[var(--border)] px-5 py-3">
                <h2 className="text-sm font-bold text-[var(--foreground)]">Nhập thông tin</h2>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">Ngày sinh (Dương lịch)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                      <select value={birthDay} onChange={(e) => setBirthDay(Number(e.target.value))} className={selectClass}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (<option key={d} value={d}>{d}</option>))}
                      </select>
                      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"><svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                    </div>
                    <div className="relative">
                      <select value={birthMonth} onChange={(e) => setBirthMonth(Number(e.target.value))} className={selectClass}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (<option key={m} value={m}>{m}</option>))}
                      </select>
                      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"><svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                    </div>
                    <div className="relative">
                      <select value={birthYear} onChange={(e) => setBirthYear(Number(e.target.value))} className={selectClass}>
                        {Array.from({ length: currentYear - 1940 + 1 }, (_, i) => 1940 + i).map((y) => (<option key={y} value={y}>{y}</option>))}
                      </select>
                      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"><svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">Giới tính</label>
                  <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-[var(--muted)] p-1">
                    <button type="button" onClick={() => setGender("male")}
                      className={`rounded-md px-2 py-2 text-xs font-semibold transition-all ${gender === "male" ? "bg-[var(--card)] text-[var(--primary)] shadow" : "text-[var(--muted-foreground)]"}`}>
                      Nam
                    </button>
                    <button type="button" onClick={() => setGender("female")}
                      className={`rounded-md px-2 py-2 text-xs font-semibold transition-all ${gender === "female" ? "bg-[var(--card)] text-[var(--accent)] shadow" : "text-[var(--muted-foreground)]"}`}>
                      Nữ
                    </button>
                  </div>
                </div>
              </div>

              {/* Result */}
              <div className="border-t border-[var(--border)] p-5">
                <div className="mb-4 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Cung Mệnh</p>
                  <p className="text-3xl font-extrabold text-[var(--primary)]">{result.cungMenh}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-2.5 text-center">
                    <p className="text-[10px] font-semibold text-[var(--muted-foreground)]">Ngũ Hành</p>
                    <p className="text-base font-bold text-[var(--foreground)]">{result.nguHanh}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-2.5 text-center">
                    <p className="text-[10px] font-semibold text-[var(--muted-foreground)]">Nhóm</p>
                    <p className="text-base font-bold text-[var(--foreground)]">{result.nhomTrach}</p>
                  </div>
                </div>
                <p className="mt-2 rounded-md bg-[var(--primary-light)] p-2 text-center text-[11px] font-medium text-[var(--primary)]">
                  Âm lịch: {result.lunarDay}/{result.lunarMonth}{result.lunarLeap ? " (nhuận)" : ""}/{result.lunarYear} — <strong>{result.canChi}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Directions */}
          <div className="lg:col-span-8 space-y-5">
            {/* Good */}
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--primary-light)] px-5 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  4 Hướng Tốt (Cát)
                </h3>
                <span className="hidden text-[11px] font-medium text-[var(--muted-foreground)] sm:inline">Bấm để xem AI phân tích</span>
              </div>
              <div className="grid gap-2 p-4 sm:grid-cols-2">
                {result.catHuong.map(([huong, info]) => (
                  <button key={huong} onClick={() => setSelectedHuong(huong)}
                    className="group rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-left transition-all hover:border-[var(--primary)] hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--foreground)]">{huong}</span>
                      <span className="badge-primary">{info.sao}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{info.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Bad */}
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--muted)] px-5 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
                  <svg className="h-4 w-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  4 Hướng Xấu (Hung)
                </h3>
                <span className="hidden text-[11px] font-medium text-[var(--muted-foreground)] sm:inline">Bấm để xem cách hóa giải</span>
              </div>
              <div className="grid gap-2 p-4 sm:grid-cols-2">
                {result.hungHuong.map(([huong, info]) => (
                  <button key={huong} onClick={() => setSelectedHuong(huong)}
                    className="group rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-left transition-all hover:border-[var(--accent)] hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--foreground)]">{huong}</span>
                      <span className="badge-destructive">{info.sao}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{info.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-xs italic text-[var(--muted-foreground)]">* Bấm vào từng hướng để AI phân tích chi tiết cách bố trí và hóa giải.</p>
          </div>
        </div>

        {selectedHuong && result.batTrach[selectedHuong] && (
          <DirectionModal
            huong={selectedHuong}
            info={result.batTrach[selectedHuong]}
            cungMenh={result.cungMenh}
            nguHanh={result.nguHanh}
            nhomTrach={result.nhomTrach}
            onClose={() => setSelectedHuong(null)}
          />
        )}
      </div>
    </div>
  );
}
