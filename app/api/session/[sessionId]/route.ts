import { NextResponse } from "next/server";
import { redis, type BoothSession } from "@/lib/sessionStore";

type BoothSessionWithMirror = BoothSession & {
  mirror?: boolean;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await redis.get<BoothSessionWithMirror>(`session:${sessionId}`);

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

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Session tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    const updatedSession: BoothSessionWithMirror = {
      ...existing,

      framePhoto:
        body.framePhoto !== undefined ? body.framePhoto : existing.framePhoto,

      singlePhotos:
        body.singlePhotos !== undefined
          ? body.singlePhotos
          : existing.singlePhotos,

      gif: body.gif !== undefined ? body.gif : existing.gif,

      liveFrameVideo:
        body.liveFrameVideo !== undefined
          ? body.liveFrameVideo
          : existing.liveFrameVideo,

      livePhotos:
        body.livePhotos !== undefined ? body.livePhotos : existing.livePhotos,

      mirror: body.mirror !== undefined ? body.mirror : existing.mirror,

      uploadStatus: {
        ...existing.uploadStatus,
        ...(body.uploadStatus || {}),
      },
    };

    await redis.set(sessionKey, updatedSession);

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
