import { NextResponse } from "next/server";
import { redis, type BoothSession } from "@/lib/sessionStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      framePhoto = "",
      singlePhotos = [],
      gif = "",
      livePhotos = [],
      localSessionId = "",
    } = body;

    const sessionId = localSessionId || `MIORI-${Date.now()}`;

    const session: BoothSession = {
      sessionId,
      framePhoto,
      singlePhotos,
      gif,
      livePhotos,
      createdAt: new Date().toISOString(),
    };

    await redis.set(`session:${sessionId}`, session);

    await redis.zadd("gallery:sessions", {
      score: Date.now(),
      member: sessionId,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://mioribooth-web.vercel.app";

    return NextResponse.json({
      success: true,
      sessionId,
      downloadUrl: `${baseUrl}/download/${sessionId}`,
      session,
    });
  } catch (error) {
    console.error("CREATE_SESSION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat session download.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}