import { NextResponse } from "next/server";
import { isBoothAuthorized } from "@/lib/boothAuth";
import { sanitizeBoothLogEntry, saveBoothLogEntry } from "@/lib/boothLogStore";

// Dipanggil aplikasi booth (WPF) untuk mengirim log transaksi: sesi, tambahan cetak, ganci.
// Body: { entries: [{ id, time, type, sessionId, eventId, eventName, package, payment, copies, amount, note }] }
// Aman dikirim ulang: id yang sama tidak akan tercatat dua kali.
// Header x-booth-key harus sama dengan BOOTH_API_KEY di Vercel (kalau BOOTH_API_KEY diset).
const MAX_BATCH = 200;

export async function POST(request: Request) {
  try {
    if (!isBoothAuthorized(request)) {
      return NextResponse.json({ success: false, message: "Tidak diizinkan." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const rawEntries: unknown[] = Array.isArray(body?.entries) ? body.entries : [];

    if (rawEntries.length === 0) {
      return NextResponse.json({ success: true, accepted: [], rejected: [], created: 0 });
    }

    if (rawEntries.length > MAX_BATCH) {
      return NextResponse.json(
        { success: false, message: `Maksimal ${MAX_BATCH} entri per kiriman.` },
        { status: 400 }
      );
    }

    // `accepted` = id yang sudah aman tersimpan di server (baru ATAU sudah ada sebelumnya),
    // booth boleh menandainya terkirim. `rejected` = bentuknya tidak valid, tidak akan pernah
    // diterima kalau dikirim ulang, jadi booth juga boleh berhenti mengirimnya.
    const accepted: string[] = [];
    const rejected: string[] = [];
    let created = 0;

    for (const raw of rawEntries) {
      const entry = sanitizeBoothLogEntry(raw);

      if (!entry) {
        const id = (raw as any)?.id;
        if (typeof id === "string") rejected.push(id);
        continue;
      }

      if (await saveBoothLogEntry(entry)) created++;
      accepted.push(entry.id);
    }

    return NextResponse.json({ success: true, accepted, rejected, created });
  } catch (error) {
    console.error("BOOTH_LOG_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menyimpan log transaksi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
