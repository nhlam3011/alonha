import { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { ProjectCard } from "@/components/listings/ProjectCard";
import { ProjectClientFilters, ProjectPagination } from "./ClientFilters";

export const metadata: Metadata = {
  title: "Danh sách Dự án Bất động sản | AloNha",
  description: "Khám phá các dự án bất động sản nổi bật, căn hộ chung cư, khu đô thị trên toàn quốc.",
};

export default async function ProjectsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.searchParams;
  const cookieStore = await cookies();
  const viewMode = (cookieStore.get("project_viewMode")?.value as "grid" | "list") || "grid";

  const keyword = typeof params.keyword === "string" ? params.keyword.trim() : "";
  const provinceId = typeof params.provinceId === "string" ? params.provinceId : "";
  const status = typeof params.status === "string" ? params.status : "";
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  const limit = 12;
  const page = typeof params.page === "string" ? Math.max(1, Number(params.page)) : 1;
  const skip = (page - 1) * limit;

  let orderBy: Prisma.ProjectOrderByWithRelationInput | Prisma.ProjectOrderByWithRelationInput[] = { createdAt: "desc" };
  switch (sort) {
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "name-asc":
      orderBy = { name: "asc" };
      break;
    case "name-desc":
      orderBy = { name: "desc" };
      break;
    case "listings-desc":
      orderBy = { listings: { _count: "desc" } };
      break;
    case "area-desc":
      orderBy = { totalArea: "desc" };
      break;
  }

  const andConditions: Prisma.ProjectWhereInput[] = [];

  if (keyword) {
    const keywordParts = keyword.split(/\s+/).filter(Boolean);
    const orConditions: Prisma.ProjectWhereInput[] = [
      { name: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
      { address: { contains: keyword, mode: "insensitive" } },
      { developer: { contains: keyword, mode: "insensitive" } },
    ];
    if (keywordParts.length > 1) {
      orConditions.push({
        AND: keywordParts.map((p) => ({ name: { contains: p, mode: "insensitive" as const } })),
      });
      orConditions.push({
        AND: keywordParts.map((p) => ({
          OR: [
            { name: { contains: p, mode: "insensitive" as const } },
            { description: { contains: p, mode: "insensitive" as const } },
          ],
        })),
      });
    }
    andConditions.push({ OR: orConditions });
  }

  if (status === "dang-ban") andConditions.push({ isActive: true });
  else if (status === "sap-ban") andConditions.push({ isActive: false });

  if (provinceId) {
    andConditions.push({ provinceCode: provinceId.trim() } as any);
  }

  const where: Prisma.ProjectWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

  const provincesRes = await fetch(`${baseUrl}/api/provinces`, {
    next: { revalidate: 3600 }
  }).catch((e) => {
    console.error("Fetch provinces error:", e);
    return null;
  });
  const provinces = provincesRes ? await provincesRes.json() : [];

  const [dbProjects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        _count: { select: { listings: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  const projects = dbProjects.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    address: p.address,
    developer: p.developer,
    totalArea: p.totalArea,
    imageUrl: p.imageUrl,
    isActive: p.isActive,
    listingCount: p._count.listings,
  }));

  return (
    <div className="min-h-screen bg-[var(--background)] pb-10">
      <ProjectClientFilters total={total} provinces={provinces} initialViewMode={viewMode} />

      <div className="layout-container px-4 md:px-10 pt-6">
        {projects.length > 0 ? (
          <>
            <div className={viewMode === "list" ? "flex flex-col gap-4 max-w-5xl mx-auto" : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project as any} viewMode={viewMode} />
              ))}
            </div>

            <ProjectPagination total={total} currentPage={page} limit={limit} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)]/50 py-24 shadow-sm">
            <div className="flex size-20 items-center justify-center rounded-full bg-[var(--primary)]/10">
              <svg className="size-10 text-[var(--primary)]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <p className="mt-5 text-xl font-bold text-[var(--foreground)]">Không tìm thấy dự án</p>
            <p className="mt-2 max-w-md text-center text-[var(--muted-foreground)] leading-relaxed">Không tìm thấy dự án nào ứng với bộ lọc của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
}
