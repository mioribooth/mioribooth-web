import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [total, latest] = await Promise.all([
      prisma.frameTemplate.count(),
      prisma.frameTemplate.findFirst({
        orderBy: { updatedAt: "desc" },
        select: {
          updatedAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      version: latest?.updatedAt?.getTime() || 0,
    });
  } catch (error) {
    console.error("GET_FRAMES_VERSION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil frame version.",
      },
      { status: 500 }
    );
  }
}
