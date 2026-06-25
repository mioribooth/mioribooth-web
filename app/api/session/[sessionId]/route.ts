import { NextResponse } from "next/server";
import { redis, type BoothSession } from "@/lib/sessionStore";

type BoothSessionWithMirror = BoothSession & {
  mirror?: boolean;
};

function hasMirrorField(body: Record<string, any>) {
  return (
    body.mirror !== undefined ||
    body.isMirror !== undefined ||
    body.isMirrored !== undefined ||
    body.mirrorEnabled !== undefined ||
    body.cameraMirror !== undefined ||
    body.filterSettings?.mirror !== undefined
  );
}

function readMirrorValue(body: Record<string, any>, fallback = false) {
  if (!hasMirrorField(body)) return fallback;

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

function normalizeStringArray(value: unknown, fallback: string[] = []) {
  if (value === undefined) return fallback;
  if (value === null) return [];

  if (!Array.isArray(value)) return fallback;

  return value.filter(
    (item): item is string => typeof item === "string" && item.trim() !== ""
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await redis.get<BoothSessionWithMirror>(
      `session:${sessionId}`
    );

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Session tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil session.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();

    const sessionKey = `session:${sessionId}`;
    const existing = await redis.get<BoothSessionWithMirror>(sessionKey);

    const baseSession: BoothSessionWithMirror = existing || {
      sessionId,
      framePhoto: "",
      singlePhotos: [],
      gif: "",
      liveFrameVideo: "",
      livePhotos: [],
      mirror: false,
      uploadStatus: {},
      createdAt: new Date().toISOString(),
    };

    const framePhoto =
      body.framePhoto === undefined
        ? baseSession.framePhoto
        : body.framePhoto === null
          ? ""
          : String(body.framePhoto || "");

    const singlePhotos = normalizeStringArray(
      body.singlePhotos,
      baseSession.singlePhotos || []
    );

    const gif =
      body.gif === undefined
        ? baseSession.gif
        : body.gif === null
          ? ""
          : String(body.gif || "");

    const liveFrameVideo =
      body.liveFrameVideo === undefined
        ? baseSession.liveFrameVideo
        : body.liveFrameVideo === null
          ? ""
          : String(body.liveFrameVideo || "");

    const updatedSession: BoothSessionWithMirror = {
      ...baseSession,
      framePhoto,
      singlePhotos,
      gif,
      liveFrameVideo,
      livePhotos: [],
      mirror: readMirrorValue(body, baseSession.mirror || false),
      uploadStatus: {
        ...(baseSession.uploadStatus || {}),
        frame: Boolean(framePhoto),
        single: singlePhotos.length > 0,
        singles: singlePhotos.length > 0,
        gif: Boolean(gif),
        live: Boolean(liveFrameVideo),
        ...(body.uploadStatus || {}),
      },
    };

    await redis.set(sessionKey, updatedSession);

    await redis.zadd("gallery:sessions", {
      score: Date.now(),
      member: sessionId,
    });

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error("UPDATE_SESSION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal update session.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}