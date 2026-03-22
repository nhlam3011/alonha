import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

export type ProjectCardData = {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    developer: string | null;
    totalArea: number | null;
    imageUrl: string | null;
    isActive: boolean;
    listingCount?: number;
};

type ViewMode = "grid" | "list";

type Props = {
    project: ProjectCardData;
    viewMode?: ViewMode;
};

const DEFAULT_PROJECT_IMAGE = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80";

export function ProjectCard({ project, viewMode = "grid" }: Props) {
    const href = `/du-an/${project.slug}`;
    const img = project.imageUrl || DEFAULT_PROJECT_IMAGE;

    return (
        <Link
            href={href}
            className={`group rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden shadow-sm transition-all duration-300 hover:border-[var(--primary)] hover:shadow-lg ${viewMode === "list" ? "flex w-full" : "flex flex-col"
                }`}
        >
            {/* Image Container */}
            <div
                className={`relative overflow-hidden bg-[var(--muted)] ${viewMode === "list" ? "w-32 sm:w-48 shrink-0 aspect-auto" : "aspect-video"
                    }`}
            >
                <ImageWithFallback
                    src={img}
                    alt={project.name}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    loading="lazy"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />

                {/* Status Badge */}
                {project.isActive && (
                    <span className="absolute top-2 left-2 rounded-lg px-2 py-1 bg-emerald-500 shadow-emerald-500/30 shadow-lg text-white text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm">
                        Đang bán
                    </span>
                )}
            </div>

            {/* Content */}
            <div className={`p-4 sm:p-5 flex flex-col justify-between ${viewMode === "list" ? "flex-1 min-w-0" : ""}`}>
                <div>
                    <h3 className="font-semibold text-[15px] sm:text-base leading-snug text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                        {project.name}
                    </h3>

                    {/* Address */}
                    {project.address && (
                        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] line-clamp-1 mt-2">
                            <svg className="inline-block mr-1.5 h-4 w-4 text-[var(--primary)] align-middle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {project.address}
                        </p>
                    )}

                    {/* Developer */}
                    {project.developer && (
                        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] line-clamp-1 mt-1.5">
                            <svg className="inline-block mr-1.5 h-4 w-4 text-[var(--primary)] align-middle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {project.developer}
                        </p>
                    )}
                </div>

                {/* Footer Stats */}
                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs sm:text-sm">
                    <span className="flex items-center gap-1.5 text-[var(--primary)] font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        {project.listingCount || 0} tin đăng
                    </span>

                    {project.totalArea && (
                        <span className="flex items-center gap-1.5 font-medium text-[var(--foreground)] bg-[var(--muted)] px-2.5 py-1 rounded-md">
                            {project.totalArea.toLocaleString()} ha
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
