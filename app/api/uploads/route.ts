import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Thiếu file upload." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!buffer.length) {
      return NextResponse.json({ error: "File trống." }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const originalName = file.name || "image";
    const ext = path.extname(originalName) || ".jpg";
    const safeExt = ext.length <= 10 ? ext : ".jpg";
    const fileName = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}${safeExt}`;
    const filePath = path.join(uploadsDir, fileName);

    await fs.writeFile(filePath, buffer);

    const url = `/uploads/${fileName}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload image error:", error);
    return NextResponse.json({ error: "Không thể upload ảnh lúc này." }, { status: 500 });
  }
}

