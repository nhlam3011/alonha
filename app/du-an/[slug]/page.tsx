"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PropertyCard } from "@/components/listings/PropertyCard";
import type { ListingCardData } from "@/components/listings/PropertyCard";

type ProjectDetail = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    address: string | null;
    developer: string | null;
    totalArea: number | null;
    imageUrl: string | null;
    isActive: boolean;
    isFallback?: boolean;
    provinceCode?: string;
    listingCount: number;
};

const DEFAULT_PROJECT_IMAGE = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80";

function ProjectDetailContent() {
    const params = useParams();
    const router = useRouter();
    const projectSlug = params.slug as string;

    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [listings, setListings] = useState<ListingCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProject() {
            setLoading(true);
            setError(null);

            try {
                // Fetch project details
                const projectRes = await fetch(`/api/projects/${projectSlug}`);
                if (!projectRes.ok) {
                    throw new Error("Không tìm thấy dự án");
                }
                const projectData = await projectRes.json();
                setProject(projectData);

                // Fetch listings for this project
                const listingsParams = new URLSearchParams();
                listingsParams.set("projectId", projectData.id);
                listingsParams.set("limit", "12");

                const listingsRes = await fetch(`/api/listings?${listingsParams}`);
                const listingsData = await listingsRes.json();

                if (listingsData.data && Array.isArray(listingsData.data)) {
                    setListings(listingsData.data);
                }
            } catch (err) {
                console.error("Error fetching project:", err);
                setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
            } finally {
                setLoading(false);
            }
        }

        if (projectSlug) {
            fetchProject();
        }
    }, [projectSlug]);

    if (loading) {
        return (
            <div className="layout-container page-section">
                {/* Header Skeleton */}
                <div className="animate-pulse">
                    <div className="h-8 w-64 bg-[var(--muted)] rounded-lg mb-2" />
                    <div className="h-4 w-48 bg-[var(--muted)] rounded-lg" />
                </div>

                {/* Image Skeleton */}
                <div className="mt-8 aspect-video bg-[var(--muted)] rounded-2xl" />

                {/* Content Skeleton */}
                <div className="mt-8 grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="h-6 w-32 bg-[var(--muted)] rounded-lg" />
                        <div className="h-4 w-full bg-[var(--muted)] rounded-lg" />
                        <div className="h-4 w-full bg-[var(--muted)] rounded-lg" />
                        <div className="h-4 w-3/4 bg-[var(--muted)] rounded-lg" />
                    </div>
                    <div className="space-y-4">
                        <div className="h-32 bg-[var(--muted)] rounded-2xl" />
                        <div className="h-32 bg-[var(--muted)] rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="layout-container page-section">
                <div className="text-center py-16">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-[var(--muted-foreground)] mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" x2="12" y1="8" y2="12" />
                        <line x1="12" x2="12.01" y1="16" y2="16" />
                    </svg>
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                        {error || "Không tìm thấy dự án"}
                    </h2>
                    <p className="text-[var(--muted-foreground)] mb-6">
                        Dự án bạn đang tìm kiếm không tồn tại hoặc đã bị xóa
                    </p>
                    <Link
                        href="/du-an"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:bg-[var(--primary-dark)] transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                        Quay lại danh sách dự án
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="layout-container page-section">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm mb-6">
                <Link href="/" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                    Trang chủ
                </Link>
                <span className="text-[var(--muted-foreground)]">/</span>
                <Link href="/du-an" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                    Dự án
                </Link>
                <span className="text-[var(--muted-foreground)]">/</span>
                <span className="text-[var(--foreground)] font-medium truncate">{project.name}</span>
            </nav>

            {/* Project Header */}
            <div className="mb-8">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--foreground)]">{project.name}</h1>
                        {project.address && (
                            <p className="text-[var(--muted-foreground)] mt-2 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                                </svg>
                                {project.address}
                            </p>
                        )}
                    </div>
                    {project.isActive && (
                        <span className="px-4 py-2 rounded-full bg-[var(--success)]/10 text-[var(--success)] text-sm font-medium">
                            Đang bán
                        </span>
                    )}
                </div>
            </div>

            {/* Project Image */}
            <div className="mb-8">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-[var(--muted)]">
                    <img
                        src={project.imageUrl || DEFAULT_PROJECT_IMAGE}
                        alt={project.name}
                        className="w-full h-full object-cover"
                    />
                    {!project.imageUrl && !project.isFallback && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/50 to-transparent">
                            <span className="text-white/80 text-lg">Hình ảnh dự án</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Project Info Grid */}
            <div className="grid gap-8 lg:grid-cols-3 mb-12">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description */}
                    <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6">
                        <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">Giới thiệu dự án</h2>
                        {project.description ? (
                            <div className="prose prose-slate max-w-none">
                                <p className="text-[var(--foreground)] whitespace-pre-line">{project.description}</p>
                            </div>
                        ) : (
                            <p className="text-[var(--muted-foreground)]">
                                {project.isFallback
                                    ? `Dự án khu vực {project.address}. Khám phá các bất động sản tại khu vực này.`
                                    : "Thông tin chi tiết về dự án đang được cập nhật."}
                            </p>
                        )}
                    </section>

                    {/* Listings */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-[var(--foreground)]">
                                Bất động sản trong khu vực
                            </h2>
                            <span className="text-sm text-[var(--muted-foreground)]">
                                {listings.length} tin đăng
                            </span>
                        </div>

                        {listings.length > 0 ? (
                            <div className="grid gap-6 sm:grid-cols-2">
                                {listings.map((listing) => (
                                    <PropertyCard key={listing.id} listing={listing} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]">
                                <p className="text-[var(--muted-foreground)]">Chưa có tin đăng nào trong khu vực này</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Project Info Card */}
                    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6">
                        <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">Thông tin dự án</h3>
                        <ul className="space-y-4">
                            {project.developer && (
                                <li className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-[var(--primary-light)]">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 21h18" />
                                            <path d="M5 21V7l8-4 8 4v14" />
                                            <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[var(--muted-foreground)]">Chủ đầu tư</p>
                                        <p className="font-medium text-[var(--foreground)]">{project.developer}</p>
                                    </div>
                                </li>
                            )}
                            {project.totalArea && (
                                <li className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-[var(--primary-light)]">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="18" height="18" x="3" y="3" rx="2" />
                                            <path d="M3 9h18" />
                                            <path d="M9 21V9" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[var(--muted-foreground)]">Tổng diện tích</p>
                                        <p className="font-medium text-[var(--foreground)]">{project.totalArea.toLocaleString()} m²</p>
                                    </div>
                                </li>
                            )}
                            <li className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-[var(--primary-light)]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--muted-foreground)]">Số tin đăng</p>
                                    <p className="font-medium text-[var(--foreground)]">{listings.length} tin</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Card */}
                    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6">
                        <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">Liên hệ</h3>
                        <div className="space-y-3">
                            <Link
                                href="/dang-tin"
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:bg-[var(--primary-dark)] transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="12" x2="12" y1="18" y2="12" />
                                    <line x1="9" x2="15" y1="15" y2="12" />
                                </svg>
                                Đăng tin ngay
                            </Link>
                            <Link
                                href="/lien-he"
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--muted)] transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                                Liên hệ tư vấn
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProjectDetailPage() {
    return (
        <Suspense fallback={
            <div className="layout-container page-section">
                <div className="animate-pulse">
                    <div className="h-8 w-64 bg-[var(--muted)] rounded-lg mb-2" />
                    <div className="h-4 w-48 bg-[var(--muted)] rounded-lg" />
                </div>
            </div>
        }>
            <ProjectDetailContent />
        </Suspense>
    );
}
