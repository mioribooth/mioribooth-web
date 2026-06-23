import { NextResponse } from "next/server";
import { redis, type BoothSession } from "@/lib/sessionStore";

type BoothSessionWithMirror = BoothSession & {
  mirror?: boolean;
};

function readMirrorValue(body: Record<string, any>, fallback?: boolean) {
  if (
    body.mirror === undefined &&
    body.isMirror === undefined &&
    body.isMirrored === undefined &&
    body.mirrorEnabled === undefined &&
    body.cameraMirror === undefined &&
    body.filterSettings?.mirror === undefined
  ) {
    return fallback;
  }

  return Boolean(
    body.mirror ??
      body.isMirror ??
      body.isMirrored ??
      body.mirrorEnabled ??
      body.cameraMirror ??
      body.filterSettings?.mirror ??
      fallback ??
      false
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
      mirror: readMirrorValue(body),
      uploadStatus: {},
      createdAt: new Date().toISOString(),
    };

    const updatedSession: BoothSessionWithMirror = {
      ...baseSession,

      framePhoto:
        body.framePhoto !== undefined ? body.framePhoto : baseSession.framePhoto,

      singlePhotos:
        body.singlePhotos !== undefined
          ? body.singlePhotos
          : baseSession.singlePhotos,

      gif: body.gif !== undefined ? body.gif : baseSession.gif,

      liveFrameVideo:
        body.liveFrameVideo !== undefined
          ? body.liveFrameVideo
          : baseSession.liveFrameVideo,

      livePhotos:
        body.livePhotos !== undefined ? body.livePhotos : baseSession.livePhotos,

      mirror: readMirrorValue(body, baseSession.mirror) ?? baseSession.mirror,

      uploadStatus: {
        ...baseSession.uploadStatus,
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
