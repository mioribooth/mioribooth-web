import { redis } from "@/lib/redis";

// Log transaksi dari aplikasi booth (WPF): sesi, tambahan cetak, ganci.
// Dipakai untuk transparansi bagi hasil dengan EO. Disimpan di Redis:
//   boothlog:{id}      -> satu kejadian (JSON)
//   boothlog:events    -> sorted set, score = waktu kejadian (ms), member = id
// Id dibuat oleh aplikasi booth (GUID), jadi kirim ulang kejadian yang sama aman (tidak dobel).

// session_adjust = koreksi harga sesi (harga khusus) dari operator, nilainya selisih dan bisa negatif.
export const BOOTH_LOG_TYPES = [
  "session",
  "extra_print",
  "keychain",
  "print_failed",
  "session_adjust",
] as const;
export type BoothLogType = (typeof BOOTH_LOG_TYPES)[number];

export type BoothLogEntry = {
  id: string;
  time: string; // ISO 8601
  type: BoothLogType;
  sessionId: string;
  eventId: string;
  eventName: string;
  packageName: string;
  payment: string; // QRIS (aplikasi) | QRIS Statis (di luar aplikasi) | Voucher
  copies: number;
  amount: number;
  note: string;
};

// Booth ada di WITA (Tarakan, Kalimantan Utara). Sama dengan konstanta di API pembukuan.
export const INDONESIA_UTC_OFFSET_HOURS = 8;

const EVENTS_KEY = "boothlog:events";
const OFFSET_MS = INDONESIA_UTC_OFFSET_HOURS * 60 * 60 * 1000;

function clampText(value: unknown, max: number) {
  return String(value ?? "").slice(0, max);
}

function clampInt(value: unknown, min: number, max: number) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

// Validasi + bersihkan satu kejadian dari booth. Mengembalikan null kalau tidak valid.
export function sanitizeBoothLogEntry(raw: any): BoothLogEntry | null {
  if (!raw || typeof raw !== "object") return null;

  const id = clampText(raw.id, 64).trim();
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return null;

  const type = String(raw.type ?? "") as BoothLogType;
  if (!BOOTH_LOG_TYPES.includes(type)) return null;

  const timeMs = Date.parse(String(raw.time ?? ""));
  if (Number.isNaN(timeMs)) return null;
  // Tolak waktu yang jelas ngawur (jam komputer booth salah).
  if (timeMs > Date.now() + 24 * 60 * 60 * 1000) return null;
  if (timeMs < Date.now() - 400 * 24 * 60 * 60 * 1000) return null;

  return {
    id,
    time: new Date(timeMs).toISOString(),
    type,
    sessionId: clampText(raw.sessionId, 80),
    eventId: clampText(raw.eventId, 80),
    eventName: clampText(raw.eventName, 120),
    packageName: clampText(raw.package ?? raw.packageName, 120),
    payment: clampText(raw.payment, 20),
    copies: clampInt(raw.copies, 0, 999),
    // Hanya koreksi harga yang boleh negatif (selisih terhadap nilai sesi yang sudah tercatat).
    amount: clampInt(raw.amount, type === "session_adjust" ? -50_000_000 : 0, 50_000_000),
    note: clampText(raw.note, 160),
  };
}

// Simpan satu kejadian. Return true kalau baru, false kalau id itu sudah ada.
export async function saveBoothLogEntry(entry: BoothLogEntry) {
  const created = await redis.set(`boothlog:${entry.id}`, entry, { nx: true });

  // zadd idempoten (member + score sama = tidak berubah), jadi aman dipanggil ulang.
  await redis.zadd(EVENTS_KEY, {
    score: Date.parse(entry.time),
    member: entry.id,
  });

  return created !== null;
}

// ----- Tanggal (WITA) -----

export function toIndonesiaDateString(date: Date) {
  const local = new Date(date.getTime() + OFFSET_MS);
  return local.toISOString().slice(0, 10); // yyyy-MM-dd
}

// Awal hari WITA (00:00) untuk "yyyy-MM-dd" -> ms UTC.
export function indonesiaDayStartMs(dateOnly: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!match) return null;

  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) - OFFSET_MS;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getBoothLogRange(startMs: number, endMsExclusive: number) {
  const ids = await redis.zrange<string[]>(EVENTS_KEY, startMs, endMsExclusive - 1, {
    byScore: true,
  });

  if (!ids || ids.length === 0) return [] as BoothLogEntry[];

  const entries: BoothLogEntry[] = [];

  // MGET per 200 id supaya request ke Redis tidak kebesaran.
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200).map((id) => `boothlog:${id}`);
    const rows = await redis.mget<(BoothLogEntry | null)[]>(...chunk);

    for (const row of rows) if (row) entries.push(row);
  }

  return entries.sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
}

// ----- Rekap -----

export type BoothLogSummary = {
  sessions: number;
  qrisSessions: number;
  voucherSessions: number;
  staticQrisSessions: number;
  extraPrintCopies: number;
  keychainCopies: number;
  sessionAmount: number;
  extraPrintAmount: number;
  keychainAmount: number;
  totalAmount: number;
  printFailures: number;
};

// Aturan hitung SAMA dengan SessionLogService.Summarize di aplikasi booth.
export function summarizeBoothLog(entries: BoothLogEntry[]): BoothLogSummary {
  const sessions = entries.filter((e) => e.type === "session");
  const extra = entries.filter((e) => e.type === "extra_print");
  const keychain = entries.filter((e) => e.type === "keychain");
  const adjusts = entries.filter((e) => e.type === "session_adjust");

  const sum = (list: BoothLogEntry[], key: "copies" | "amount") =>
    list.reduce((total, e) => total + e[key], 0);

  // Pemasukan sesi = nilai sesi + koreksi harga khusus (selisih, bisa negatif).
  const sessionAmount = sum(sessions, "amount") + sum(adjusts, "amount");
  const extraPrintAmount = sum(extra, "amount");
  const keychainAmount = sum(keychain, "amount");

  return {
    sessions: sessions.length,
    qrisSessions: sessions.filter((e) => e.payment === "QRIS").length,
    voucherSessions: sessions.filter((e) => e.payment === "Voucher").length,
    // QRIS statis fisik, dibayar di luar aplikasi (tidak diverifikasi aplikasi).
    staticQrisSessions: sessions.filter((e) => e.payment !== "QRIS" && e.payment !== "Voucher").length,
    extraPrintCopies: sum(extra, "copies"),
    keychainCopies: sum(keychain, "copies"),
    sessionAmount,
    extraPrintAmount,
    keychainAmount,
    totalAmount: sessionAmount + extraPrintAmount + keychainAmount,
    printFailures: entries.filter((e) => e.type === "print_failed").length,
  };
}

// Rekap harian untuk `days` hari yang berakhir di `endDate` (yyyy-MM-dd), terlama dulu.
export function summarizeByDay(entries: BoothLogEntry[], endDate: string, days: number) {
  const endStart = indonesiaDayStartMs(endDate);
  if (endStart === null) return [];

  return Array.from({ length: days }).map((_, index) => {
    const dayStart = endStart - (days - 1 - index) * DAY_MS;
    const dayEntries = entries.filter((e) => {
      const t = Date.parse(e.time);
      return t >= dayStart && t < dayStart + DAY_MS;
    });

    return {
      date: toIndonesiaDateString(new Date(dayStart)),
      ...summarizeBoothLog(dayEntries),
    };
  });
}
