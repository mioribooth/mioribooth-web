import { NextResponse } from "next/server";
import { redis, type BoothSession } from "@/lib/sessionStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const key = searchParams.get("key");
  const adminKey = process.env.GALLERY_ADMIN_KEY;

  if (!adminKey || key !== adminKey) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const sessionIds = await redis.zrange<string[]>(
    "gallery:sessions",
    0,
    99,
    {
      rev: true,
    }
  );

  const sessions = await Promise.all(
    sessionIds.map(async (sessionId) => {
      return await redis.get<BoothSession>(`session:${sessionId}`);
    })
  );

  return NextResponse.json({
    success: true,
    total: sessions.filter(Boolean).length,
    sessions: sessions.filter(Boolean),
  });
}