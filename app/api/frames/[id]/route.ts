import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const frame = await prisma.frameTemplate.findUnique({
      where: { id },
      include: {
        layers: {
          orderBy: { zIndex: "asc" },
        },
      },
    });

    if (!frame) {
      return NextResponse.json(
        { success: false, message: "Frame tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, frame });
  } catch (error) {
    console.error("GET_FRAME_DETAIL_ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil detail frame." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    await prisma.frameLayer.deleteMany({
      where: { frameId: id },
    });

    const frame = await prisma.frameTemplate.update({
      where: { id },
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
    console.error("PUT_FRAME_ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Gagal update frame." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    await prisma.frameTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE_FRAME_ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus frame." },
      { status: 500 }
    );
  }
}
