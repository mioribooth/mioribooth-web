import { NextResponse } from "next/server";
import {
  getBoothLogRange,
  indonesiaDayStartMs,
  summarizeBoothLog,
  summarizeByDay,
  toIndonesiaDateString,
} from "@/lib/boothLogStore";

// Untuk halaman admin /admin/transaction.
// GET /api/admin/booth-log?date=yyyy-MM-dd   (default: hari ini, WITA)
// Mengembalikan rekap hari itu, rincian kejadian, dan rekap 7 hari yang berakhir di tanggal itu.
const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_DAYS = 7;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const today = toIndonesiaDateString(new Date());
    const requested = searchParams.get("date") || today;
    const date = indonesiaDayStartMs(requested) === null ? today : requested;

    const dayStart = indonesiaDayStartMs(date)!;
    const trendStart = dayStart - (TREND_DAYS - 1) * DAY_MS;

    const entries = await getBoothLogRange(trendStart, dayStart + DAY_MS);

    const dayEntries = entries.filter((e) => {
      const t = Date.parse(e.time);
      return t >= dayStart && t < dayStart + DAY_MS;
    });

    return NextResponse.json({
      success: true,
      date,
      today,
      summary: summarizeBoothLog(dayEntries),
      entries: dayEntries,
      trend: summarizeByDay(entries, date, TREND_DAYS),
    });
  } catch (error) {
    console.error("GET_BOOTH_LOG_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil log transaksi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
