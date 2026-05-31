import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { redis, type BoothSession } from "@/lib/sessionStore";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Session ID tidak ditemukan." },
        { status: 400 }
      );
    }

    const sessionKey = `session:${sessionId}`;
    const session = await redis.get<BoothSession>(sessionKey);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session tidak ditemukan." },
        { status: 404 }
      );
    }

    const filesToDelete = [
      session.framePhoto,
      session.gif,
      ...(session.singlePhotos || []),
      ...(session.livePhotos || []),
    ].filter(Boolean) as string[];

    await Promise.allSettled(filesToDelete.map((fileUrl) => del(fileUrl)));

    await redis.del(sessionKey);
    await redis.zrem("gallery:sessions", sessionId);

    return NextResponse.json({
      success: true,
      message: "Session dan file berhasil dihapus.",
      sessionId,
      deletedFiles: filesToDelete.length,
    });
  } catch (error) {
    console.error("DELETE_GALLERY_SESSION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghapus session.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}