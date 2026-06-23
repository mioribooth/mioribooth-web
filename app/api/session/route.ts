import { NextResponse } from "next/server";
import { redis, type BoothSession } from "@/lib/sessionStore";

type BoothSessionWithMirror = BoothSession & {
  mirror?: boolean;
};

function readMirrorValue(body: Record<string, any>) {
  return Boolean(
    body.mirror ??
      body.isMirror ??
      body.isMirrored ??
      body.mirrorEnabled ??
      body.cameraMirror ??
      body.filterSettings?.mirror ??
      false
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      framePhoto = "",
      singlePhotos = [],
      gif = "",
      liveFrameVideo = "",
      livePhotos = [],
      localSessionId = "",
      sessionId: bodySessionId = "",
      uploadStatus = {
        frame: Boolean(framePhoto),
        live: false,
        gif: false,
        single: false,
      },
    } = body;

    const sessionId = localSessionId || bodySessionId || `MIORI-${Date.now()}`;
    const existing = await redis.get<BoothSessionWithMirror>(`session:${sessionId}`);

    const session: BoothSessionWithMirror = {
      ...(existing || {}),
      sessionId,
      framePhoto: framePhoto || existing?.framePhoto || "",
      singlePhotos: singlePhotos.length > 0 ? singlePhotos : existing?.singlePhotos || [],
      gif: gif || existing?.gif || "",
      liveFrameVideo: liveFrameVideo || existing?.liveFrameVideo || "",
      livePhotos: livePhotos.length > 0 ? livePhotos : existing?.livePhotos || [],
      mirror: readMirrorValue(body),
      uploadStatus: {
        ...(existing?.uploadStatus || {}),
        ...uploadStatus,
      },
      createdAt: existing?.createdAt || new Date().toISOString(),
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
