import { NextResponse } from "next/server";
import { redis, type BoothSession } from "@/lib/sessionStore";
import { normalizeEventId } from "@/lib/eventId";
import { isBoothAuthorized } from "@/lib/boothAuth";

type RouteContext = { params: Promise<{ eventId: string }> };

function clampInt(value: string | null, min: number, max: number, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(parsed)) return fallback;

  return Math.min(max, Math.max(min, parsed));
}

// Daftar sesi di sebuah acara, terbaru di atas. Publik (dipakai halaman album).
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { eventId: rawId } = await params;
    const eventId = normalizeEventId(rawId);

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: "Event tidak valid." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = clampInt(searchParams.get("limit"), 1, 100, 40);
    const offset = clampInt(searchParams.get("offset"), 0, 100000, 0);

    const key = `event:${eventId}:sessions`;
    const total = await redis.zcard(key);

    const ids =
      total > 0
        ? await redis.zrange<string[]>(key, offset, offset + limit - 1, {
            rev: true,
          })
        : [];

    const records =
      ids.length > 0
        ? await redis.mget<(BoothSession | null)[]>(
            ...ids.map((id) => `session:${id}`)
          )
        : [];

    const sessions = ids.map((id, index) => {
      const session = records[index];

      return {
        sessionId: String(id),
        framePhoto: session?.framePhoto || "",
        gif: session?.gif || "",
        createdAt: session?.createdAt || "",
        ready: Boolean(session?.framePhoto),
      };
    });

    return NextResponse.json(
      { success: true, eventId, total, sessions },
      {
        headers: {
          // Dicache CDN 5 detik: ratusan tamu yang membuka album tidak membebani Redis.
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
        },
      }
    );
  } catch (error) {
    console.error("EVENT_LIST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil album.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Daftarkan / ganti nama acara (dipanggil aplikasi booth saat mode wedding dimulai).
export async function PUT(request: Request, { params }: RouteContext) {
  try {
    if (!isBoothAuthorized(request)) {
      return NextResponse.json(
        { success: false, message: "Tidak diizinkan." },
        { status: 401 }
      );
    }

    const { eventId: rawId } = await params;
    const eventId = normalizeEventId(rawId);

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: "Event tidak valid." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim().slice(0, 80);

    const key = `event:${eventId}`;
    const existing = await redis.get<{ createdAt?: string }>(key);
    const now = new Date().toISOString();

    await redis.set(key, {
      eventId,
      name,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, eventId, name });
  } catch (error) {
    console.error("EVENT_UPDATE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menyimpan acara.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
