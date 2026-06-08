import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const frames = await prisma.frameTemplate.findMany({
      where: {
        isActive: true,
      },
      include: {
        layers: {
          orderBy: {
            zIndex: "asc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      frames,
    });
  } catch (error) {
    console.error("GET_PUBLIC_FRAMES_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil frame active.",
      },
      { status: 500 }
    );
  }
}
