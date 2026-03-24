import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    console.log("Upload request received:", {
      name: (file as any)?.name || "not-a-file",
      type: (file as any)?.type || typeof file,
      size: (file as any)?.size || "N/A"
    });

    if (!file || typeof file !== 'object' || !('arrayBuffer' in file)) {
      return NextResponse.json({ error: "Thiếu file upload hoặc định dạng không hợp lệ." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!buffer.length) {
      return NextResponse.json({ error: "File trống." }, { status: 400 });
    }

    // Cloudinary upload if configured
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        const { v2: cloudinary } = await import("cloudinary");
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: "auto", folder: "alonha" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        const url = (uploadResult as any).secure_url;
        console.log("Uploaded to Cloudinary:", url);
        return NextResponse.json({ url });
      } catch (cloudError) {
        console.error("Cloudinary upload error, falling back to local:", cloudError);
      }
    }

    // Local fallback
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const originalName = (file as any)?.name || "image";
    const ext = path.extname(originalName) || ".jpg";
    const safeExt = ext.length <= 10 ? ext : ".jpg";
    const fileName = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}${safeExt}`;
    const filePath = path.join(uploadsDir, fileName);

    console.log("Writing to local:", filePath);
    await fs.writeFile(filePath, buffer);

    const url = `/uploads/${fileName}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload image error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : "No stack"
    });
    return NextResponse.json({ 
      error: "Không thể upload ảnh lúc này.",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

