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
        </div>
      </div>

      {/* Render Client Component with Server initial data */}
      <ListingManagementClient initialListings={listings} />
    </div>
  );
}
