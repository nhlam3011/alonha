import { NextResponse } from "next/server";
import type { ListingStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["AGENT", "BUSINESS", "ADMIN"];
const EDITABLE_STATUSES: ListingStatus[] = ["PENDING", "HIDDEN", "DRAFT", "REJECTED", "APPROVED"];

async function ensureAgent() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = session.user.role as string;
  if (!role || !ALLOWED.includes(role)) return null;
  return session;
}

function isEditableStatus(status: string | undefined): status is ListingStatus {
  return !!status && EDITABLE_STATUSES.includes(status as ListingStatus);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await ensureAgent();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  if (!isEditableStatus(body.status)) {
    return NextResponse.json({ error: "Trạng thái cập nhật không hợp lệ." }, { status: 400 });
  }

  const listing = await prisma.listing.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true, publishedAt: true },
  });
  if (!listing) return NextResponse.json({ error: "Không tìm thấy tin đăng." }, { status: 404 });

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data: {
      status: body.status,
      ...(body.status === "PENDING" ? { publishedAt: null } : {}),
    },
    select: { id: true, status: true, publishedAt: true },
  });

  return NextResponse.json({
    data: {
      ...updated,
      publishedAt: updated.publishedAt ? updated.publishedAt.toISOString() : null,
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await ensureAgent();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const listing = await prisma.listing.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true, status: true },
  });
  if (!listing) return NextResponse.json({ error: "Không tìm thấy tin đăng." }, { status: 404 });

  if (listing.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Chỉ được xóa bản nháp. Các tin đã gửi cần admin duyệt để xóa khỏi hệ thống." },
      { status: 400 },
    );
  }

  await prisma.listing.delete({ where: { id: listing.id } });
  return NextResponse.json({ ok: true });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await ensureAgent();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    description?: string;
    listingType?: "SALE" | "RENT";
    category?: string;
    price?: number;
    pricePerSqm?: number | null;
    area?: number;
    bedrooms?: number | null;
    bathrooms?: number | null;
    direction?: string | null;
    legalStatus?: string | null;
    furniture?: string | null;
    address?: string | null;
    provinceId?: string | null;
    provinceName?: string | null;
    wardId?: string | null;
    wardName?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string | null;
    projectId?: string | null;
    images?: string[];
  };

  const listing = await prisma.listing.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true, status: true },
  });
  if (!listing) return NextResponse.json({ error: "Không tìm thấy tin đăng." }, { status: 404 });

  // Cho phép sửa tin APPROVED, nhưng sau khi sửa sẽ chuyển về PENDING để admin duyệt lại
  const shouldRequireReapproval = listing.status === "APPROVED";

  const updateData: any = {};
  if (body.title) updateData.title = String(body.title).slice(0, 500);
  if (body.description !== undefined) updateData.description = body.description;
  if (body.listingType) updateData.listingType = body.listingType === "RENT" ? "RENT" : "SALE";
  if (body.category) {
    const validCategories = ["CAN_HO_CHUNG_CU", "NHA_RIENG", "NHA_MAT_PHONG", "DAT_NEN", "KHO_NHA_XUONG", "BDS_KHAC"];
    if (validCategories.includes(body.category)) {
      updateData.category = body.category;
    }
  }
  if (typeof body.price === "number") updateData.price = body.price;
  if (body.pricePerSqm !== undefined) updateData.pricePerSqm = body.pricePerSqm;
  if (typeof body.area === "number") updateData.area = body.area;
  if (body.bedrooms !== undefined) updateData.bedrooms = body.bedrooms;
  if (body.bathrooms !== undefined) updateData.bathrooms = body.bathrooms;
  if (body.direction !== undefined) updateData.direction = body.direction;
  if (body.legalStatus !== undefined) updateData.legalStatus = body.legalStatus;
  if (body.furniture !== undefined) updateData.furniture = body.furniture;
  if (body.address !== undefined) updateData.address = body.address;
  if (body.provinceId !== undefined) updateData.provinceCode = body.provinceId ? String(body.provinceId).trim() : null;
  if (body.provinceName !== undefined) updateData.provinceName = body.provinceName ? String(body.provinceName).slice(0, 200) : null;
  if (body.wardId !== undefined) updateData.wardCode = body.wardId ? String(body.wardId).trim() : null;
  if (body.wardName !== undefined) updateData.wardName = body.wardName ? String(body.wardName).slice(0, 200) : null;
  if (body.latitude !== undefined) updateData.latitude = body.latitude;
  if (body.longitude !== undefined) updateData.longitude = body.longitude;
  if (body.contactName) updateData.contactName = String(body.contactName).slice(0, 200);
  if (body.contactPhone) updateData.contactPhone = String(body.contactPhone).slice(0, 20);
  if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail;
  if (body.projectId !== undefined) updateData.projectId = body.projectId ? String(body.projectId).trim() : null;

  // Nếu sửa tin APPROVED, chuyển về PENDING và xóa publishedAt
  if (shouldRequireReapproval) {
    updateData.status = "PENDING";
    updateData.publishedAt = null;
  }

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data: updateData,
    select: { id: true, status: true, slug: true },
  });

  // Cập nhật ảnh nếu có
  if (Array.isArray(body.images)) {
    await prisma.listingImage.deleteMany({ where: { listingId: listing.id } });
    if (body.images.length > 0) {
      await prisma.listingImage.createMany({
        data: body.images.slice(0, 20).map((url: string, i: number) => ({
          listingId: listing.id,
          url: String(url).slice(0, 2000),
          order: i,
          isPrimary: i === 0,
        })),
      });
    }
  }

  return NextResponse.json({
    data: {
      ...updated,
      requiresReapproval: shouldRequireReapproval,
    },
  });
}
