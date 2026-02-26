import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PropertyCard } from "@/components/listings/PropertyCard";
import { toListingCard } from "@/lib/listings";

const DEFAULT_PROJECT_IMAGE = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;

    if (slug.startsWith("province-")) {
        return { title: "Dự án không tồn tại | AloNha" };
    }

    const project = await prisma.project.findUnique({
        where: { slug },
        select: { name: true, description: true, imageUrl: true },
    });

    if (!project) return { title: "Không tìm thấy dự án | AloNha" };

    return {
        title: `${project.name} | AloNha`,
        description: project.description ? project.description.slice(0, 160) : `Thông tin dự án ${project.name} trên AloNha.`,
        openGraph: {
            title: project.name,
            description: project.description?.slice(0, 160) || "",
            images: project.imageUrl ? [project.imageUrl] : [],
        },
    };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    if (slug.startsWith("province-")) {
        notFound();
    }

    const project = await prisma.project.findUnique({
        where: { slug },
        include: {
            _count: { select: { listings: true } },
        },
    });

    if (!project) {
        notFound();
    }

    // Lấy các bài đăng thuộc dự án
    const listingsDb = await prisma.listing.findMany({
        where: { projectId: project.id, status: "APPROVED", publishedAt: { not: null } },
        take: 12,
        orderBy: { publishedAt: "desc" },
        include: {
            images: { orderBy: { order: "asc" }, take: 1 },
        },
    });
    const listings = listingsDb.map(toListingCard);

    return (
        <div className="layout-container page-section">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm mb-6">
                <Link href="/" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                    Trang chủ
                </Link>
                <span className="text-[var(--muted-foreground)]">/</span>
                <Link href="/du-an" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={project.imageUrl || DEFAULT_PROJECT_IMAGE}
                        alt={project.name}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                    {!project.imageUrl && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/50 to-transparent pointer-events-none">
                            <span className="text-white/80 text-lg drop-shadow-md">Hình ảnh dự án minh họa</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Project Info Grid */}
            <div className="grid gap-8 lg:grid-cols-3 mb-12">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description */}
                    <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">Giới thiệu dự án</h2>
                        {project.description ? (
                            <div className="prose prose-slate max-w-none prose-p:text-[var(--foreground)]">
                                <p className="whitespace-pre-line">{project.description}</p>
                            </div>
                        ) : (
                            <p className="text-[var(--muted-foreground)]">
                                Thông tin chi tiết về dự án đang được cập nhật.
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
                                <p className="text-[var(--muted-foreground)]">Chưa có tin đăng nào cho dự án này</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Project Info Card */}
                    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
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
                                    <p className="font-medium text-[var(--foreground)]">{project._count.listings} tin</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Card */}
                    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm sticky top-24">
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
