import { NextResponse } from "next/server";
import { redis, type BoothSession } from "@/lib/sessionStore";

export async function GET() {
  try {
    const sessionIds = await redis.zrange<string[]>(
      "gallery:sessions",
      0,
      99,
      {
        rev: true,
      }
    );

    if (!sessionIds || sessionIds.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        sessions: [],
      });
    }

    const sessions = await Promise.all(
      sessionIds.map(async (sessionId) => {
        try {
          return await redis.get<BoothSession>(`session:${sessionId}`);
        } catch {
          return null;
        }
      })
    );

    const validSessions = sessions.filter(Boolean);

    return NextResponse.json({
      success: true,
      total: validSessions.length,
      sessions: validSessions,
    });
  } catch (error) {
    console.error("ADMIN_GALLERY_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data gallery.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}