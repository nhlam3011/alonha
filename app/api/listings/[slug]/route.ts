import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: "Thiếu slug" }, { status: 400 });

  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { order: "asc" } },
      project: true,
      owner: { select: { id: true, name: true, avatar: true, phone: true } },
    },
  });

  if (!listing) return NextResponse.json({ error: "Không tìm thấy tin" }, { status: 404 });

  if (listing.status !== "APPROVED") {
    const session = await auth();
    const role = session?.user?.role as string | undefined;
    const isAdmin = role === "ADMIN";
    const isOwner = !!session?.user?.id && session.user.id === listing.ownerId;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Không tìm thấy tin" }, { status: 404 });
    }
  }

  if (listing.status === "APPROVED") {
    await prisma.listing.update({
      where: { id: listing.id },
      data: { viewCount: { increment: 1 } },
    });
  }

  const d = listing;
  const res = {
    id: d.id,
    slug: d.slug,
    title: d.title,
    description: d.description,
    listingType: d.listingType,
    status: d.status,
    price: Number(d.price),
    pricePerSqm: d.pricePerSqm ? Number(d.pricePerSqm) : null,
    area: d.area,
    bedrooms: d.bedrooms,
    bathrooms: d.bathrooms,
    direction: d.direction,
    legalStatus: d.legalStatus,
    furniture: d.furniture,
    amenities: Array.isArray((d as Record<string, unknown>).amenities)
      ? (d as Record<string, unknown>).amenities
      : null,
    address: d.address,
    latitude: d.latitude,
    longitude: d.longitude,
    contactName: d.contactName,
    contactPhone: d.contactPhone,
    contactEmail: d.contactEmail,
    showPhone: d.showPhone,
    isVip: d.isVip,
    isVerified: d.isVerified,
    hasVideo: d.hasVideo,
    has360Tour: d.has360Tour,
    viewCount: d.status === "APPROVED" ? d.viewCount + 1 : d.viewCount,
    images: d.images.map((i) => ({ url: i.url, caption: i.caption, isPrimary: i.isPrimary })),
    // Map lại theo schema mới: chỉ còn provinceCode/provinceName, wardCode/wardName
    province: (d as any).provinceName
      ? { id: (d as any).provinceCode ?? "", name: (d as any).provinceName }
      : null,
    district: null,
    ward: (d as any).wardName
      ? { id: (d as any).wardCode ?? "", name: (d as any).wardName }
      : null,
    project: d.project ? { id: d.project.id, name: d.project.name } : null,
    owner: d.owner,
  };

  return NextResponse.json(res);
}
