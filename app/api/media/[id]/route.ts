import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return new Response("Not Found", { status: 404 });
    }

    return new Response(media.data, {
      headers: {
        "Content-Type": media.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Media serving error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
