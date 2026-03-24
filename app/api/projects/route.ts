import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PROJECT_IMAGE = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 12, 100);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const sort = searchParams.get("sort") || "newest";
  const provinceId = searchParams.get("provinceId");
  const status = searchParams.get("status");

  const skip = (page - 1) * limit;

  let orderBy: any = { createdAt: "desc" };
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

  const where: any = {};
  const andConditions: any[] = [];

  const keyword = searchParams.get("keyword")?.trim();
  if (keyword) {
    const keywordParts = keyword.split(/\s+/).filter(Boolean);
    const orConditions: any[] = [
      { name: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
      { address: { contains: keyword, mode: "insensitive" } },
      { developer: { contains: keyword, mode: "insensitive" } },
    ];
    if (keywordParts.length > 1) {
      orConditions.push({
        AND: keywordParts.map((p) => ({ name: { contains: p, mode: "insensitive" } })),
      });
    }
    andConditions.push({ OR: orConditions });
  }

  if (status === "dang-ban") andConditions.push({ isActive: true });
  if (provinceId) andConditions.push({ provinceCode: provinceId.trim() });

  if (andConditions.length > 0) where.AND = andConditions;

  const projects = await prisma.project.findMany({
    where,
    orderBy,
    skip,
    take: limit,
    include: {
      _count: { select: { listings: true } },
    },
  });

  const total = await prisma.project.count({ where });

  if (projects.length > 0) {
    return NextResponse.json({
      data: projects.map((p) => ({
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
        provinceCode: p.provinceCode,
        provinceName: p.provinceName,
        districtCode: p.districtCode,
        districtName: p.districtName,
        wardCode: p.wardCode,
        wardName: p.wardName,
      })),
      total,
      page,
      limit,
    });
  }

  return NextResponse.json({
    data: [],
    total: 0,
    page,
    limit,
  });
}
