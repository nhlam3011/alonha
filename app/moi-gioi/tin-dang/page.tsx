import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ListingManagementClient, ListingRow, ListingStatus } from "./ListingManagementClient";

export default async function TinDangPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/dang-nhap?callbackUrl=/moi-gioi/tin-dang");
  }

  const userId = session.user.id;

  // Fetch db directly on server
  const dbListings = await prisma.listing.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      viewCount: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" },
  });

  const listings: ListingRow[] = dbListings.map(l => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    status: l.status as ListingStatus,
    viewCount: l.viewCount,
    createdAt: l.createdAt.toISOString()
  }));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Quản lý tin đăng</h1>
          <p className="page-subtitle">
            Theo dõi, chỉnh sửa và quản lý trạng thái hiển thị của các tin đăng.
          </p>
        </div>
        <Link
          href="/dang-tin"
          className="btn btn-primary btn-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span>Đăng tin mới</span>
        </Link>
      </div>

      {/* Render Client Component with Server initial data */}
      <ListingManagementClient initialListings={listings} />
    </div>
  );
}
