"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Province = { id: string; code?: string; name: string };

type Project = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  developer: string | null;
  totalArea: number | null;
  imageUrl: string | null;
  isActive: boolean;
  listingCount?: number;
};

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "dang-ban", label: "Đang bán" },
  { value: "sap-ban", label: "Sắp bán" },
  { value: "da-ban", label: "Đã bán" },
  { value: "dang-cho-thue", label: "Đang cho thuê" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "name-asc", label: "Tên A-Z" },
  { value: "name-desc", label: "Tên Z-A" },
  { value: "listings-desc", label: "Nhiều tin nhất" },
  { value: "area-desc", label: "Diện tích lớn" },
];

const DEFAULT_PROJECT_IMAGE = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80";

import { UnifiedSearchHeader } from "@/components/filters/UnifiedSearchHeader";
import { UnifiedFilterBar } from "@/components/filters/UnifiedFilterBar";
import { ProjectCard } from "@/components/listings/ProjectCard";

function ProjectsContent() {
  const searchParams = useSearchParams();

  const provinceIdFromQuery = searchParams.get("provinceId") ?? "";
  const statusFromQuery = searchParams.get("status") ?? "";

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [selectedProvinceId, setSelectedProvinceId] = useState(provinceIdFromQuery);
  const [selectedStatus, setSelectedStatus] = useState(statusFromQuery);
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState<Province[]>([]);

  const ITEMS_PER_PAGE = 12;

  // Load provinces
  useEffect(() => {
    fetch("/api/provinces")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setProvinces(data))
      .catch(() => { });
  }, []);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(ITEMS_PER_PAGE));
      params.set("page", String(page));
      params.set("sort", sort);
      if (selectedProvinceId) {
        const province = provinces.find((p) => p.id === selectedProvinceId);
        params.set("provinceId", province?.code ?? selectedProvinceId);
      }
      if (selectedStatus) params.set("status", selectedStatus);

      const res = await fetch(`/api/projects?${params}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setProjects(data);
        setTotal(data.length);
      } else if (data.data) {
        setProjects(data.data);
        setTotal(data.total || data.data.length);
      } else {
        setProjects([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, sort, selectedProvinceId, selectedStatus, provinces]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedProvinceId, selectedStatus, sort]);

  // Active filter chips
  const activeChips: { label: string; onClear: () => void }[] = [];
  const selectedProvince = provinces.find((p) => p.id === selectedProvinceId);
  if (selectedProvince) {
    activeChips.push({
      label: selectedProvince.name,
      onClear: () => { setSelectedProvinceId(""); setPage(1); }
    });
  }
  if (selectedStatus) {
    activeChips.push({
      label: STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label ?? selectedStatus,
      onClear: () => { setSelectedStatus(""); setPage(1); }
    });
  }
  function resetAll() {
    setSelectedProvinceId("");
    setSelectedStatus("");
    setSort("newest");
    setPage(1);
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1;

  return (
    <div className="min-h-screen bg-[var(--background)] pb-10">
      {/* ─── Header & Filters Sticky ─── */}
      <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)] shadow-sm">
        <div className="layout-container px-4 md:px-10">
          <UnifiedSearchHeader
            tabs={[
              { value: "du-an", label: "Dự án BĐS" }
            ]}
            activeTab="du-an"
            onTabChange={() => { }}
            total={total}
            loading={loading}
            unitLabel="dự án"
            viewMode={viewMode}
            onViewChange={(mode) => { if (mode === "grid" || mode === "list") setViewMode(mode); }}
          />

          <UnifiedFilterBar
            sortOptions={SORT_OPTIONS}
            activeSort={sort}
            onSortChange={(val) => { setSort(val); setPage(1); }}
            appendRight={
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="md:hidden ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]"
              >
                {viewMode === "grid" ? (
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                ) : (
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                )}
              </button>
            }
          >
            {/* Tình trạng (Status) */}
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="filter-select min-w-[130px]"
            >
              {STATUS_OPTIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>

            {/* Tỉnh/thành */}
            <select
              value={selectedProvinceId}
              onChange={(e) => { setSelectedProvinceId(e.target.value); setPage(1); }}
              className="filter-select min-w-[120px]"
            >
              <option value="">Tỉnh/thành</option>
              {provinces.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </UnifiedFilterBar>
        </div>
      </div>

      {/* ─── Active filter chips ─── */}
      {activeChips.length > 0 && (
        <div className="layout-container px-4 pt-4 pb-2 md:px-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[var(--muted-foreground)]">Đang chọn:</span>
            {activeChips.map((chip) => (
              <span key={chip.label} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)] border border-[var(--primary)]/20 shadow-sm">
                {chip.label}
                <button onClick={chip.onClear} className="ml-0.5 rounded-full p-0.5 transition hover:bg-[var(--primary)]/20 hover:text-red-500">
                  <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </span>
            ))}
            <button onClick={resetAll} className="ml-1 rounded-full text-xs font-semibold text-red-500 hover:text-red-600 underline underline-offset-2 transition-colors">
              Xoá tất cả
            </button>
          </div>
        </div>
      )}

      {/* ─── Content ─── */}
      <div className={`layout-container px-4 md:px-10 ${activeChips.length === 0 ? "pt-6" : ""}`}>
        {loading ? (
          <div className={viewMode === "list" ? "flex flex-col gap-4 max-w-4xl mx-auto" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`animate-pulse overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] ${viewMode === "list" ? "flex" : ""}`}>
                <div className={`bg-[var(--muted)]/50 ${viewMode === "list" ? "w-40 sm:w-48 shrink-0" : "h-48"}`} />
                <div className="space-y-4 p-5 flex-1">
                  <div className="h-5 w-3/4 rounded-md bg-[var(--muted)]/50" />
                  <div className="h-6 w-1/3 rounded-md bg-[var(--primary)]/20" />
                  <div className="flex gap-4 pt-2">
                    <div className="h-4 w-16 rounded-md bg-[var(--muted)]/50" />
                    <div className="h-4 w-16 rounded-md bg-[var(--muted)]/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className={viewMode === "list" ? "flex flex-col gap-4 max-w-5xl mx-auto" : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)]/50 py-24 shadow-sm">
            <div className="flex size-20 items-center justify-center rounded-full bg-[var(--primary)]/10">
              <svg className="size-10 text-[var(--primary)]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <p className="mt-5 text-xl font-bold text-[var(--foreground)]">Không tìm thấy dự án</p>
            <p className="mt-2 max-w-md text-center text-[var(--muted-foreground)] leading-relaxed">Không tìm thấy dự án nào ứng với bộ lọc của bạn.</p>
            <button onClick={resetAll} className="mt-6 rounded-xl bg-[var(--primary)] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--primary-dark)] hover:shadow-lg hover:-translate-y-0.5">
              Xoá bộ lọc ngay
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => { setPage(Math.max(1, page - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
              className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-sm disabled:opacity-40 disabled:hover:border-[var(--border)] disabled:hover:text-inherit disabled:hover:shadow-none"
            >
              <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`inline-flex size-10 items-center justify-center rounded-full text-sm font-bold transition ${p === page
                      ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/30"
                      : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
                      }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => { setPage(Math.min(totalPages, page + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === totalPages}
              className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-sm disabled:opacity-40 disabled:hover:border-[var(--border)] disabled:hover:text-inherit disabled:hover:shadow-none"
            >
              <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-[var(--muted-foreground)]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" /></div>}>
      <ProjectsContent />
    </Suspense>
  );
}
