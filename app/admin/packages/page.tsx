import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PackagesClient } from "./PackagesClient";

export default async function AdminPackagesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;

  const packages = await prisma.servicePackage.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      price: true,
      durationDays: true,
      isActive: true,
      sortOrder: true,
      _count: { select: { listingServices: true } },
    },
  });

  const initialRows = packages.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    durationDays: p.durationDays,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
    usageCount: p._count.listingServices,
  }));

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Gói dịch vụ VIP</h1>
          <p className="page-subtitle">Cấu hình gói dịch vụ, giá bán và thời hạn.</p>
        </div>
      </div>

      <PackagesClient initialRows={initialRows} />
    </div>
  );
}
