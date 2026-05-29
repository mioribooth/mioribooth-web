import { NextResponse } from "next/server";
import {
  createSessionId,
  redis,
  type BoothSession,
} from "@/lib/sessionStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sessionId = createSessionId();

    const newSession: BoothSession = {
      sessionId,
      framePhoto: body.framePhoto || "",
      singlePhotos: body.singlePhotos || [],
      gif: body.gif || "",
      livePhotos: body.livePhotos || [],
      createdAt: new Date().toISOString(),
    };

    await redis.set(`session:${sessionId}`, newSession, {
      ex: 60 * 60 * 24 * 30,
    });

    await redis.zadd("gallery:sessions", {
      score: Date.now(),
      member: sessionId,
    });

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://mioribooth-web.vercel.app";

    return NextResponse.json({
      success: true,
      sessionId,
      downloadUrl: `${siteUrl}/download/${sessionId}`,
      session: newSession,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat session",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Session API aktif memakai Upstash Redis",
  });
}