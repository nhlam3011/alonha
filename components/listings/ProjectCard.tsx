import Link from "next/link";

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
                <img
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
                        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-2 flex items-start gap-1.5 line-clamp-1">
                            <svg className="shrink-0 mt-0.5 text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{project.address}</span>
                        </p>
                    )}

                    {/* Developer */}
                    {project.developer && (
                        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1.5 flex items-start gap-1.5 line-clamp-1">
                            <svg className="shrink-0 mt-0.5 text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 21h18" />
                                <path d="M5 21V7l8-4 8 4v14" />
                                <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
                            </svg>
                            <span>{project.developer}</span>
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
                            {project.totalArea.toLocaleString()} m²
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
