"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CATEGORY_OPTIONS = [
  { value: "", label: "Tất cả loại" },
  { value: "can-ho-chung-cu", label: "Căn hộ" },
  { value: "nha-rieng", label: "Nhà riêng" },
  { value: "biet-thu", label: "Biệt thự" },
  { value: "dat-nen", label: "Đất nền" },
  { value: "van-phong", label: "Văn phòng" },
  { value: "mat-bang", label: "Mặt bằng" },
  { value: "nha-mat-pho", label: "Nhà mặt phố" },
];

const PRICE_RANGES = [
  { value: "", label: "Mọi mức giá" },
  { value: "0-500000000", label: "< 500 triệu" },
  { value: "500000000-1000000000", label: "500tr - 1 tỷ" },
  { value: "1000000000-3000000000", label: "1 - 3 tỷ" },
  { value: "3000000000-5000000000", label: "3 - 5 tỷ" },
  { value: "5000000000-10000000000", label: "5 - 10 tỷ" },
  { value: "10000000000-", label: "> 10 tỷ" },
];

type SearchType = "sale" | "rent";

type Province = { id: string; code?: string; name: string };

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findProvinceCode(provinces: Province[], name: string): string | null {
  const normalized = normalizeForMatch(name);
  const match = provinces.find(
    (p) =>
      normalizeForMatch(p.name) === normalized ||
      normalizeForMatch(p.name).includes(normalized) ||
      normalized.includes(normalizeForMatch(p.name))
  );
  return match ? (match.code || match.id) : null;
}

export function HeroSearch({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const [type, setType] = useState<SearchType>("sale");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [showAiSearch, setShowAiSearch] = useState(true);

  const [isListening, setIsListening] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);

  useEffect(() => {
    fetch("/api/provinces")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setProvinces(data); })
      .catch(() => { });
  }, []);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Trình duyệt của bạn không hỗ trợ tìm kiếm bằng giọng nói.");
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (showAiSearch) {
        setAiQuery(transcript);
      } else {
        setKeyword(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const buildParams = (overrides?: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    params.set("loaiHinh", type);
    if (category) params.set("category", category);
    if (priceRange) {
      const [min, max] = priceRange.split("-");
      if (min) params.set("priceMin", min);
      if (max) params.set("priceMax", max);
    }
    if (overrides) {
      Object.entries(overrides).forEach(([k, v]) => {
        if (v === null || v === "") params.delete(k);
        else params.set(k, v);
      });
    }
    return params;
  };

  const searchHref = () => `/bat-dong-san?${buildParams().toString()}`;

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/search-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        const filters = data.filters || {};
        const params = new URLSearchParams();

        if (filters.keyword) params.set("keyword", filters.keyword);
        if (filters.category) params.set("category", filters.category);
        if (filters.loaiHinh) params.set("loaiHinh", filters.loaiHinh);
        else params.set("loaiHinh", type);

        if (filters.priceMin) params.set("priceMin", filters.priceMin.toString());
        if (filters.priceMax) params.set("priceMax", filters.priceMax.toString());
        if (filters.areaMin) params.set("areaMin", filters.areaMin.toString());
        if (filters.areaMax) params.set("areaMax", filters.areaMax.toString());
        if (filters.bedrooms) params.set("bedrooms", filters.bedrooms.toString());

        if (filters.province) {
          const provCode = findProvinceCode(provinces, filters.province);
          if (provCode) params.set("provinceId", provCode);
          else {
            const existing = params.get("keyword");
            params.set("keyword", [existing, filters.province].filter(Boolean).join(" "));
          }
        }

        if (filters.district) {
          const existing = params.get("keyword");
          params.set("keyword", [existing, filters.district].filter(Boolean).join(" "));
        }

        params.set("aiQuery", aiQuery.trim());
        router.push(`/bat-dong-san?${params.toString()}`);
      } else {
        router.push(`/bat-dong-san?keyword=${encodeURIComponent(aiQuery.trim())}&loaiHinh=${type}&aiQuery=${encodeURIComponent(aiQuery.trim())}`);
      }
    } catch (e) {
      console.error("AI Search failed", e);
      router.push(`/bat-dong-san?keyword=${encodeURIComponent(aiQuery.trim())}&loaiHinh=${type}&aiQuery=${encodeURIComponent(aiQuery.trim())}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className={`rounded-3xl p-5 sm:p-7 shadow-2xl transition-all duration-300 ${embedded ? 'bg-[var(--card)]/90 backdrop-blur-xl border border-[var(--border)]' : 'glass'}`}>
        {/* Tabs */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mb-5">
          <button
            type="button"
            onClick={() => setType("sale")}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${type === "sale"
              ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
          >
            Mua bán
          </button>
          <button
            type="button"
            onClick={() => setType("rent")}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${type === "rent"
              ? "bg-[var(--secondary)] text-white shadow-lg shadow-[var(--secondary)]/30"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
          >
            Cho thuê
          </button>
          <button
            type="button"
            onClick={() => setShowAiSearch(!showAiSearch)}
            className="hidden"
          ></button>
        </div>

        {!showAiSearch ? (
          <>
            {/* Main Search */}
            <div className="relative mb-4 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Nhập địa điểm, dự án hoặc từ khóa..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(searchHref())}
                  className="w-full h-12 pl-10 pr-12 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-medium"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>

                {/* Voice button */}
                <button
                  onClick={startListening}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10'}`}
                  title="Tìm kiếm bằng giọng nói"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
              <Link
                href={searchHref()}
                className="h-12 px-8 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap shadow-md"
              >
                Tìm Kiếm
              </Link>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 px-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="h-11 px-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
              >
                {PRICE_RANGES.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          /* AI Search Panel */
          <div className="p-1 animate-fade-in">
            <div className="flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400 mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Tìm nhà bằng AI (thử: "Biệt thự sân vườn giá dưới 10 tỷ...")
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 group">
                <input
                  type="text"
                  placeholder="VD: Căn hộ 2 phòng ngủ gần quận 7, giá dưới 3 tỷ..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
                  className="w-full h-12 pl-4 pr-12 rounded-xl bg-[var(--background)] border-2 border-violet-200 dark:border-violet-900/50 text-[var(--foreground)] text-sm focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-[var(--muted-foreground)]/70 font-medium"
                />
                <button
                  onClick={startListening}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20'}`}
                  title="Mô tả bằng giọng nói"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
              <button
                onClick={handleAiSearch}
                disabled={isAiLoading || !aiQuery.trim()}
                className="h-12 px-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shadow-lg shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center min-w-[120px]"
              >
                {isAiLoading ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : (
                  "Tìm kiếm"
                )}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mr-1">Gợi ý:</span>
              {[
                "Biệt thự sân vườn Long An",
                "Chung cư 2PN Quận 7 dưới 4 tỷ",
                "Nhà phố mặt tiền kinh doanh Q1",
                "Đất nền thổ cư sổ sẵn",
                "Phòng trọ sinh viên giá rẻ"
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setAiQuery(q)}
                  className="px-3 py-1.5 rounded-full bg-[var(--muted)]/50 text-[var(--muted-foreground)] border border-[var(--border)] hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/40 dark:hover:text-violet-300 transition-all text-xs font-semibold whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
