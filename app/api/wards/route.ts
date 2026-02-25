import { NextResponse } from "next/server";
import { getWards } from "@/lib/provinces";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provinceCode = url.searchParams.get("provinceCode");

  try {
    const filtered = await getWards(provinceCode);
    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching wards from v2 API:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi lấy danh sách phường/xã." },
      { status: 500 },
    );
  }
}
