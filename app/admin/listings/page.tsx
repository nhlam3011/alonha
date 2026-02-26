import { prisma } from "@/lib/prisma";
import { ListingsAdminClient, ListingRow, ListingStatus } from "./ListingsAdminClient";
import { Prisma } from "@prisma/client";

export default async function AdminListingsPage(props: {
  searchParams: Promise<{ keyword?: string; status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const keyword = searchParams.keyword || "";
  const status = searchParams.status || "ALL";

  const whereClause: Prisma.ListingWhereInput = {};

  if (status !== "ALL") {
    whereClause.status = status as ListingStatus;
  }

  if (keyword) {
    whereClause.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { id: { contains: keyword } },
    ];
  }

  const dbListings = await prisma.listing.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  const listings: ListingRow[] = dbListings.map(l => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    status: l.status as ListingStatus,
    price: l.price ? Number(l.price) : 0,
    viewCount: l.viewCount,
    createdAt: l.createdAt.toISOString(),
    publishedAt: l.publishedAt?.toISOString() || null,
    owner: {
      id: l.owner.id,
      name: l.owner.name,
      email: l.owner.email,
    }
  }));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Quản lý tin đăng</h1>
          <p className="page-subtitle">
            Tổng hợp tất cả tin đăng bất động sản trên hệ thống.
          </p>
        </div>
      </div>

      <ListingsAdminClient initialListings={listings} />
    </div>
  );
}
