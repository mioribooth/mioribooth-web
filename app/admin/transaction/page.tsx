"use client";

import { useCallback, useEffect, useState } from "react";

type BoothLogEntry = {
  id: string;
  time: string;
  type: "session" | "extra_print" | "keychain" | "print_failed" | "session_adjust";
  sessionId: string;
  eventName: string;
  packageName: string;
  payment: string;
  copies: number;
  amount: number;
  note: string;
};

type Summary = {
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

type TrendDay = Summary & { date: string };

type ApiPayload = {
  success: boolean;
  message?: string;
  date: string;
  today: string;
  summary: Summary;
  entries: BoothLogEntry[];
  trend: TrendDay[];
};

const EMPTY_SUMMARY: Summary = {
  sessions: 0,
  qrisSessions: 0,
  voucherSessions: 0,
  staticQrisSessions: 0,
  extraPrintCopies: 0,
  keychainCopies: 0,
  sessionAmount: 0,
  extraPrintAmount: 0,
  keychainAmount: 0,
  totalAmount: 0,
  printFailures: 0,
};

const TYPE_LABEL: Record<BoothLogEntry["type"], string> = {
  session: "Sesi",
  extra_print: "Tambahan cetak",
  keychain: "Ganci",
  print_failed: "Cetak gagal",
  session_adjust: "Koreksi harga",
};

const TYPE_STYLE: Record<BoothLogEntry["type"], string> = {
  session: "bg-blue-50 text-[#4263FF]",
  extra_print: "bg-violet-50 text-violet-600",
  keychain: "bg-pink-50 text-pink-600",
  print_failed: "bg-rose-50 text-rose-600",
  session_adjust: "bg-amber-50 text-amber-700",
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

// Semua jam ditampilkan dalam WITA (UTC+8), sama dengan zona booth, apa pun zona browser admin.
function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Makassar",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatDateLabel(dateOnly: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${dateOnly}T00:00:00Z`));
  } catch {
    return dateOnly;
  }
}

function shortDay(dateOnly: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${dateOnly}T00:00:00Z`));
  } catch {
    return dateOnly;
  }
}

function shiftDate(dateOnly: string, days: number) {
  const d = new Date(`${dateOnly}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function csvCell(value: string | number) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default function AdminTransactionPage() {
  const [date, setDate] = useState<string>("");
  const [today, setToday] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [entries, setEntries] = useState<BoothLogEntry[]>([]);
  const [trend, setTrend] = useState<TrendDay[]>([]);

  const load = useCallback(async (target?: string) => {
    setLoading(true);
    setError("");

    try {
      const query = target ? `?date=${encodeURIComponent(target)}` : "";
      const response = await fetch(`/api/admin/booth-log${query}`, { cache: "no-store" });
      const data: ApiPayload = await response.json();

      if (!data.success) {
        setError(data.message || "Gagal mengambil log transaksi.");
        return;
      }

      setDate(data.date);
      setToday(data.today);
      setSummary(data.summary);
      setEntries(data.entries || []);
      setTrend(data.trend || []);
    } catch (err) {
      console.error("LOAD_BOOTH_LOG_ERROR:", err);
      setError("Gagal mengambil log transaksi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isToday = date !== "" && date === today;
  const trendMax = Math.max(...trend.map((d) => d.sessions), 1);

  function exportCsv() {
    const lines: string[] = [
      `Rekap,${date}`,
      `Sesi,${summary.sessions}`,
      `Sesi QRIS Statis,${summary.staticQrisSessions}`,
      `Sesi QRIS aplikasi,${summary.qrisSessions}`,
      `Sesi Voucher,${summary.voucherSessions}`,
      `Tambahan cetak (lembar),${summary.extraPrintCopies}`,
      `Ganci (lembar),${summary.keychainCopies}`,
      `Pemasukan sesi (Rp),${summary.sessionAmount}`,
      `Pemasukan tambahan cetak (Rp),${summary.extraPrintAmount}`,
      `Pemasukan ganci (Rp),${summary.keychainAmount}`,
      `Total (Rp),${summary.totalAmount}`,
      `Cetak gagal (kejadian),${summary.printFailures}`,
      "",
      "Waktu (WITA),Jenis,Event,Paket,Pembayaran,Lembar,Nilai (Rp),Keterangan,ID Sesi",
      ...[...entries].reverse().map((e) =>
        [
          `${date} ${formatTime(e.time)}`,
          TYPE_LABEL[e.type],
          e.eventName,
          e.packageName,
          e.payment,
          e.copies,
          e.amount,
          e.note,
          e.sessionId,
        ]
          .map(csvCell)
          .join(",")
      ),
    ];

    // BOM supaya Excel membaca UTF-8 dengan benar.
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="text-[#101828]">
      {/* Pemilih tanggal */}
      <div className="flex flex-col gap-4 rounded-[36px] bg-white p-6 shadow-xl md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black">{date ? formatDateLabel(date) : "Memuat..."}</h2>
          <p className="mt-1 font-semibold text-slate-500">
            Log dari aplikasi booth · zona waktu WITA
            {isToday ? " · hari ini" : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => date && load(shiftDate(date, -1))}
            className="rounded-full bg-[#F6F7FF] px-5 py-3 text-sm font-black text-[#4263FF] transition hover:scale-[1.03]"
          >
            ◀ Sebelumnya
          </button>

          <input
            type="date"
            value={date}
            max={today || undefined}
            onChange={(e) => e.target.value && load(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black"
          />

          <button
            onClick={() => date && load(shiftDate(date, 1))}
            disabled={isToday}
            className="rounded-full bg-[#F6F7FF] px-5 py-3 text-sm font-black text-[#4263FF] transition hover:scale-[1.03] disabled:opacity-40"
          >
            Berikutnya ▶
          </button>

          <button
            onClick={() => load(isToday ? undefined : today)}
            className="rounded-full bg-[#4263FF] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#4263FF]/20 transition hover:scale-[1.03]"
          >
            {isToday ? "Refresh" : "Hari ini"}
          </button>

          <button
            onClick={exportCsv}
            disabled={loading || !date}
            className="rounded-full bg-[#101828] px-5 py-3 text-sm font-black text-white transition hover:scale-[1.03] disabled:opacity-40"
          >
            Ekspor CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-3xl bg-rose-50 p-5 font-bold text-rose-600">{error}</div>
      )}

      {/* Ringkasan */}
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="JUMLAH SESI"
          value={summary.sessions}
          caption={
            [
              summary.staticQrisSessions > 0 && `QRIS Statis ${summary.staticQrisSessions}`,
              summary.qrisSessions > 0 && `QRIS aplikasi ${summary.qrisSessions}`,
              summary.voucherSessions > 0 && `Voucher ${summary.voucherSessions}`,
            ]
              .filter(Boolean)
              .join(" · ") || "-"
          }
        />
        <StatCard
          label="TAMBAHAN CETAK"
          value={summary.extraPrintCopies}
          unit="lembar"
          caption={formatRupiah(summary.extraPrintAmount)}
        />
        <StatCard
          label="GANCI"
          value={summary.keychainCopies}
          unit="lembar"
          caption={formatRupiah(summary.keychainAmount)}
        />
        <div className="rounded-[36px] bg-[#101828] p-7 text-white shadow-xl">
          <p className="text-sm font-black text-white/50">TOTAL PEMASUKAN</p>
          <h3 className="mt-3 text-4xl font-black">{formatRupiah(summary.totalAmount)}</h3>
          <p className="mt-3 text-sm font-semibold text-white/60">
            Sesi {formatRupiah(summary.sessionAmount)}
          </p>
          <p className="text-sm font-semibold text-white/60">
            Cetak {formatRupiah(summary.extraPrintAmount)} · Ganci {formatRupiah(summary.keychainAmount)}
          </p>
        </div>
      </div>

      {summary.printFailures > 0 && (
        <div className="mt-6 rounded-3xl bg-amber-50 p-5 font-bold text-amber-700">
          ⚠ {summary.printFailures} kejadian cetak gagal setelah pembayaran masuk pada hari ini.
          Cek rincian di bawah dan konfirmasi ke operator booth.
        </div>
      )}

      {/* Tren 7 hari */}
      <div className="mt-6 rounded-[36px] bg-white p-7 shadow-xl">
        <h2 className="text-3xl font-black">Sesi 7 Hari Terakhir</h2>
        <p className="mt-2 font-semibold text-slate-500">
          Jumlah sesi per hari. Ketuk satu hari untuk membuka rinciannya.
        </p>

        <div className="mt-6 grid grid-cols-7 gap-3">
          {trend.map((day) => {
            const selected = day.date === date;
            const percent = Math.round((day.sessions / trendMax) * 100);

            return (
              <button
                key={day.date}
                onClick={() => load(day.date)}
                className={`flex flex-col items-center rounded-2xl p-3 transition hover:-translate-y-1 ${
                  selected ? "bg-[#EEF1FF] ring-2 ring-[#4263FF]" : "bg-[#F6F7FF]"
                }`}
              >
                <div className="text-lg font-black">{day.sessions}</div>
                <div className="my-2 flex h-[120px] w-full items-end rounded-xl bg-white p-1.5">
                  <div
                    className="w-full rounded-lg bg-gradient-to-t from-[#4263FF] via-[#7657FF] to-[#FF7BC3]"
                    style={{ height: `${day.sessions === 0 ? 3 : Math.max(percent, 6)}%` }}
                  />
                </div>
                <div className="text-xs font-black text-slate-500">{shortDay(day.date)}</div>
                <div className="mt-1 text-[11px] font-bold text-slate-400">
                  +{day.extraPrintCopies} cetak · {day.keychainCopies} ganci
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rincian */}
      <div className="mt-6 rounded-[36px] bg-white p-7 shadow-xl">
        <h2 className="text-3xl font-black">Rincian Transaksi</h2>
        <p className="mt-2 font-semibold text-slate-500">
          Dicatat otomatis oleh aplikasi booth: sesi saat tamu sampai di halaman hasil, cetak dan
          ganci saat pembayaran lunas. Data hanya bisa dilihat, tidak bisa diubah dari sini.
        </p>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-[#F6F7FF]">
              <tr>
                <th className="p-5 font-black text-slate-400">Jam (WITA)</th>
                <th className="p-5 font-black text-slate-400">Jenis</th>
                <th className="p-5 font-black text-slate-400">Paket / Keterangan</th>
                <th className="p-5 font-black text-slate-400">Pembayaran</th>
                <th className="p-5 font-black text-slate-400">Event</th>
                <th className="p-5 text-right font-black text-slate-400">Nilai</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center font-bold text-slate-400">
                    Memuat log transaksi...
                  </td>
                </tr>
              ) : entries.length > 0 ? (
                entries.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100 transition hover:bg-[#FAFBFF]">
                    <td className="p-5 font-bold text-slate-500">{formatTime(e.time)}</td>
                    <td className="p-5">
                      <span className={`rounded-full px-4 py-2 text-sm font-black ${TYPE_STYLE[e.type]}`}>
                        {TYPE_LABEL[e.type]}
                        {e.type !== "session" && e.type !== "session_adjust" && e.copies > 0
                          ? ` ×${e.copies}`
                          : ""}
                      </span>
                    </td>
                    <td className="p-5 font-semibold text-slate-600">
                      {[e.packageName, e.note].filter(Boolean).join(" · ") || "-"}
                    </td>
                    <td className="p-5 font-bold text-slate-500">
                      {e.type === "print_failed" ? "-" : e.payment || "-"}
                    </td>
                    <td className="p-5 font-semibold text-slate-500">{e.eventName || "-"}</td>
                    <td className="p-5 text-right font-black">
                      {e.type === "print_failed" ? "-" : formatRupiah(e.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center font-bold text-slate-400">
                    {isToday ? "Belum ada transaksi hari ini." : "Tidak ada transaksi pada tanggal ini."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  caption,
}: {
  label: string;
  value: number;
  unit?: string;
  caption: string;
}) {
  return (
    <div className="rounded-[36px] bg-white p-7 shadow-xl">
      <p className="text-sm font-black text-slate-400">{label}</p>
      <h3 className="mt-3 text-5xl font-black">
        {value}
        {unit && <span className="ml-2 text-lg font-black text-slate-400">{unit}</span>}
      </h3>
      <p className="mt-3 text-sm font-bold text-slate-500">{caption}</p>
    </div>
  );
}
