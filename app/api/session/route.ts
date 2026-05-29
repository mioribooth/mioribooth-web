import { NextResponse } from "next/server";
import { createSessionId, sessions, type BoothSession } from "@/lib/sessionStore";

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

    sessions.set(sessionId, newSession);

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
    total: sessions.size,
    sessions: Array.from(sessions.values()),
  });
}