import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const frames = await prisma.frameTemplate.findMany({
      where: { isActive: true },
      include: {
        layers: {
          orderBy: { zIndex: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, frames });
  } catch (error) {
    console.error("GET_FRAMES_ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data frame." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const frame = await prisma.frameTemplate.create({
      data: {
        name: body.name || "Frame Tanpa Nama",
        category: body.category || "CUSTOM",
        layoutType: body.layoutType || "PHOTO_STRIP",
        backgroundColor: body.backgroundColor || "#FFFFFF",
        thumbnail: body.thumbnail || null,
        preview: body.preview || null,
        isActive: body.isActive ?? true,
        layers: {
          create: Array.isArray(body.layers)
            ? body.layers.map((layer: any, index: number) => ({
                type: layer.type || "photo",
                name: layer.name || `Layer ${index + 1}`,
                visible: layer.visible ?? true,
                locked: layer.locked ?? false,
                x: Number(layer.x || 0),
                y: Number(layer.y || 0),
                width: Number(layer.width || 100),
                height: Number(layer.height || 100),
                src: layer.src || null,
                photoIndex:
                  layer.photoIndex === undefined || layer.photoIndex === null
                    ? null
                    : Number(layer.photoIndex),
                zIndex: Number(layer.zIndex ?? index),
              }))
            : [],
        },
      },
      include: {
        layers: {
          orderBy: { zIndex: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, frame });
  } catch (error) {
    console.error("POST_FRAME_ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan frame." },
      { status: 500 }
    );
  }
}
