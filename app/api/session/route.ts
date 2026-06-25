import { NextResponse } from "next/server";
import { redis, type BoothSession } from "@/lib/sessionStore";

type BoothSessionWithMirror = BoothSession & {
  mirror?: boolean;
};

function readMirrorValue(body: Record<string, any>, fallback = false) {
  return Boolean(
    body.mirror ??
      body.isMirror ??
      body.isMirrored ??
      body.mirrorEnabled ??
      body.cameraMirror ??
      body.filterSettings?.mirror ??
      fallback
  );
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sessionId =
      body.localSessionId ||
      body.sessionId ||
      `MIORI-${Date.now()}`;

    const existing = await redis.get<BoothSessionWithMirror>(`session:${sessionId}`);

    const framePhoto = typeof body.framePhoto === "string" ? body.framePhoto : existing?.framePhoto || "";
    const singlePhotos = normalizeStringArray(body.singlePhotos).length > 0
      ? normalizeStringArray(body.singlePhotos)
      : existing?.singlePhotos || [];
    const gif = typeof body.gif === "string" ? body.gif : existing?.gif || "";
    const liveFrameVideo = typeof body.liveFrameVideo === "string"
      ? body.liveFrameVideo
      : existing?.liveFrameVideo || "";

    const session: BoothSessionWithMirror = {
      ...(existing || {}),
      sessionId,
      framePhoto,
      singlePhotos,
      gif,
      liveFrameVideo,
      livePhotos: [],
      mirror: readMirrorValue(body, existing?.mirror || false),
      uploadStatus: {
        frame: Boolean(framePhoto),
        single: singlePhotos.length > 0,
        singles: singlePhotos.length > 0,
        gif: Boolean(gif),
        live: Boolean(liveFrameVideo),
        ...(body.uploadStatus || {}),
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