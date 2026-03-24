import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    console.log("Starting upload request handling...");
    const formData = await req.formData();
    const file = formData.get("file");

    console.log("File extracted from formData:", {
      name: (file as any)?.name || "not-a-file",
      type: (file as any)?.type || typeof file,
      size: (file as any)?.size || "N/A"
    });

    if (!file || typeof file !== 'object' || !('arrayBuffer' in file)) {
      console.error("Invalid file or missing file in formData");
      return NextResponse.json({ error: "Thiếu file upload hoặc định dạng không hợp lệ." }, { status: 400 });
    }

    console.log("Converting file to arrayBuffer...");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!buffer.length) {
      console.error("File buffer is empty");
      return NextResponse.json({ error: "File trống." }, { status: 400 });
    }

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      console.log("Attempting Cloudinary upload...");
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
              if (error) {
                console.error("Cloudinary upload_stream error:", error);
                reject(error);
              }
              else {
                console.log("Cloudinary upload_stream success");
                resolve(result);
              }
            }
          ).end(buffer);
        });

        const url = (uploadResult as any).secure_url;
        console.log("Uploaded successfully to Cloudinary:", url);
        return NextResponse.json({ url });
      } catch (cloudError) {
        console.error("Cloudinary upload process failed:", cloudError);
        console.log("Falling back to local storage...");
      }
    }

    console.log("Handling local fallback...");
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    console.log("Ensuring directory exists:", uploadsDir);
    await fs.mkdir(uploadsDir, { recursive: true });

    const originalName = (file as any)?.name || "image";
    const ext = path.extname(originalName) || ".jpg";
    const safeExt = ext.length <= 10 ? ext : ".jpg";
    const fileName = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}${safeExt}`;
    const filePath = path.join(uploadsDir, fileName);

    console.log("Attempting to write file to local path:", filePath);
    await fs.writeFile(filePath, buffer);

    const url = `/uploads/${fileName}`;
    console.log("Cloudinary configured but failed or not used, local URL:", url);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("CRITICAL UPLOAD ERROR:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : "No stack"
    });
    return NextResponse.json({ 
      error: "Không thể upload ảnh lúc này.",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

