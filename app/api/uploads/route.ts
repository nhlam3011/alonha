import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file !== 'object' || !('arrayBuffer' in file)) {
      return NextResponse.json({ error: "Thiếu file upload hoặc định dạng không hợp lệ." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!buffer.length) {
      return NextResponse.json({ error: "File trống." }, { status: 400 });
    }

    const fileName = (file as any)?.name || "image.jpg";
    const mimeType = (file as any)?.type || "image/jpeg";

    const media = await prisma.media.create({
      data: {
        fileName,
        mimeType,
        data: buffer,
      },
      select: { id: true }
    });

    const url = `/api/media/${media.id}`;
    return NextResponse.json({ url });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ 
      error: "Không thể upload ảnh vào database lúc này.",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
