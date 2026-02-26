import { prisma } from "@/lib/prisma";
import { ProjectsClient, ProjectRow } from "./ProjectsClient";

export default async function AdminProjectsPage() {
  const dbProjects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { listings: true }
      }
    }
  });

  const projects: ProjectRow[] = dbProjects.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    address: p.address,
    developer: p.developer,
    totalArea: p.totalArea,
    imageUrl: p.imageUrl,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    listingCount: p._count.listings,
    provinceCode: p.provinceCode,
    provinceName: p.provinceName,
    districtCode: p.districtCode,
    districtName: p.districtName,
    wardCode: p.wardCode,
    wardName: p.wardName,
  }));

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Quản lý dự án</h1>
          <p className="page-subtitle">Thêm mới và cập nhật danh mục dự án bất động sản.</p>
        </div>
      </div>

      <ProjectsClient initialProjects={projects} />
    </div>
  );
}
