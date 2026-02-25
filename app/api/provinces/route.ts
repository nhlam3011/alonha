import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProvinces } from "@/lib/provinces";

export async function GET() {
  try {
    const external = await getProvinces();

    // Lấy số lượng tin đang hiển thị theo từng tỉnh
    const listingsByProvince = await prisma.listing.groupBy({
      by: ["provinceCode"],
      where: {
        status: "APPROVED",
        publishedAt: { not: null },
        provinceCode: { not: null },
      },
      _count: { id: true },
    });

    const countMap = new Map<string, number>();
    for (const item of listingsByProvince) {
      if (item.provinceCode) {
        countMap.set(String(item.provinceCode), item._count.id);
      }
    }

    const provinces = external.map((prov) => ({
      id: String(prov.code),
      code: String(prov.code),
      name: prov.name,
      listingCount: countMap.get(String(prov.code)) || 0,
    }));

    // Sắp xếp theo số lượng tin giảm dần
    provinces.sort((a, b) => b.listingCount - a.listingCount);

    return NextResponse.json(provinces);
  } catch (error) {
    console.error("Error fetching provinces from v2 API:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi lấy danh sách tỉnh/thành." },
      { status: 500 },
    );
  }
}

