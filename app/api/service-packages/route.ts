import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const list = await prisma.servicePackage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      price: true,
      durationDays: true,
    },
  });
  const data = list.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    durationDays: p.durationDays,
  }));
  return NextResponse.json(data);
}
