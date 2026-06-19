"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TransactionType = "INCOME" | "EXPENSE";

type BookkeepingTransaction = {
  id: string;
  type: TransactionType;
  source: "AUTO" | "MANUAL";
  category: string;
  method?: string | null;
  amount: number;
  description?: string | null;
  sessionId?: string | null;
  createdAt: string;
};

type Summary = {
  income: number;
  expense: number;
  profit: number;
};

type ApiPayload = {
  success: boolean;
  message?: string;
  summary: {
    filtered: Summary;
    today: Summary;
    month: Summary;
  };
  transactions: BookkeepingTransaction[];
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function isSameDay(date: Date, target: Date) {
  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

function makeLast7DaysChart(transactions: BookkeepingTransaction[]) {
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);

    const label = date.toLocaleDateString("id-ID", { weekday: "short" });

    const income = transactions
      .filter((trx) => trx.type === "INCOME" && isSameDay(new Date(trx.createdAt), date))
      .reduce((sum, trx) => sum + trx.amount, 0);

    const expense = transactions
      .filter((trx) => trx.type === "EXPENSE" && isSameDay(new Date(trx.createdAt), date))
      .reduce((sum, trx) => sum + trx.amount, 0);

    return { label, income, expense, profit: income - expense };
  });

  const max = Math.max(...days.map((item) => item.income), 1);

  return days.map((item) => ({
    ...item,
    percent: Math.round((item.income / max) * 100),
  }));
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ApiPayload["summary"]>({
    filtered: { income: 0, expense: 0, profit: 0 },
    today: { income: 0, expense: 0, profit: 0 },
    month: { income: 0, expense: 0, profit: 0 },
  });
  const [transactions, setTransactions] = useState<BookkeepingTransaction[]>([]);

  async function loadDashboard() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/bookkeeping", {
        cache: "no-store",
      });
      const data: ApiPayload = await response.json();

      if (!data.success) {
        alert(data.message || "Gagal mengambil data dashboard pembukuan.");
        return;
      }

      setSummary(data.summary);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error("LOAD_DASHBOARD_BOOKKEEPING_ERROR:", error);
      alert("Gagal mengambil data dashboard pembukuan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function deleteTransaction(id: string) {
    const ok = confirm("Hapus transaksi ini dari pembukuan?");
    if (!ok) return;

    try {
      const response = await fetch(`/api/admin/bookkeeping/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!data.success) {
        alert(data.message || "Gagal menghapus transaksi.");
        return;
      }

      await loadDashboard();
    } catch (error) {
      console.error("DELETE_DASHBOARD_TRANSACTION_ERROR:", error);
      alert("Gagal menghapus transaksi.");
    }
  }

  const chart = useMemo(() => makeLast7DaysChart(transactions), [transactions]);

  const methodStats = useMemo(() => {
    const incomeTransactions = transactions.filter((trx) => trx.type === "INCOME");

    function stat(method: string) {
      const items = incomeTransactions.filter((trx) => (trx.method || "OTHER") === method);
      return {
        count: items.length,
        total: items.reduce((sum, trx) => sum + trx.amount, 0),
      };
    }

    return {
      QRIS: stat("QRIS"),
      VOUCHER: stat("VOUCHER"),
      CASH: stat("CASH"),
      TRANSFER: stat("TRANSFER"),
    };
  }, [transactions]);

  return (
    <div className="text-[#101828]">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="relative overflow-hidden rounded-[44px] bg-gradient-to-br from-[#4263FF] via-[#7657FF] to-[#FF7BC3] p-8 text-white shadow-2xl">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-24 left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <p className="inline-flex rounded-full bg-white/20 px-5 py-3 text-sm font-black backdrop-blur">
              MIORI BOOTH ADMIN
            </p>

            <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-[-0.05em]">
              Dashboard Pembukuan
            </h1>

            <p className="mt-4 max-w-2xl font-semibold leading-relaxed text-white/80">
              Dashboard ini sekarang mengambil data dari Pembukuan, bukan lagi dari data revenue lama. Semua omzet, pengeluaran, dan profit bersumber dari transaksi pembukuan.
            </p>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <HeroCard title="OMZET HARI INI" value={summary.today.income} caption={`${transactions.filter((trx) => trx.type === "INCOME").length} transaksi pemasukan`} />
              <HeroCard title="PENGELUARAN HARI INI" value={summary.today.expense} caption="Dari pembukuan" />
              <HeroCard title="PROFIT HARI INI" value={summary.today.profit} caption="Omzet - pengeluaran" />
            </div>
          </div>
        </div>

        <div className="rounded-[44px] bg-[#101828] p-8 text-white shadow-2xl">
          <p className="text-sm font-black text-white/50">RINGKASAN BULAN INI</p>
          <h3 className="mt-3 text-5xl font-black">{formatRupiah(summary.month.profit)}</h3>
          <p className="mt-3 font-semibold text-white/50">Profit bersih bulan ini dari Pembukuan.</p>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-bold text-white/50">Omzet</p>
              <p className="mt-1 text-xl font-black">{formatRupiah(summary.month.income)}</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-bold text-white/50">Keluar</p>
              <p className="mt-1 text-xl font-black">{formatRupiah(summary.month.expense)}</p>
            </div>
          </div>

          <button
            onClick={loadDashboard}
            className="mt-6 w-full rounded-full bg-white px-6 py-4 text-sm font-black text-[#101828] transition hover:scale-[1.02]"
          >
            Refresh Dashboard
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Link href="/admin/bookkeeping" className="rounded-[36px] bg-white p-7 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF1FF] text-3xl">📒</div>
          <h2 className="mt-6 text-3xl font-black">Pembukuan</h2>
          <p className="mt-2 font-semibold text-slate-500">Input pemasukan, pengeluaran, dan lihat laporan profit.</p>
        </Link>

        <Link href="/admin/frames" className="rounded-[36px] bg-white p-7 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF1FF] text-3xl">🖼️</div>
          <h2 className="mt-6 text-3xl font-black">Frame Editor</h2>
          <p className="mt-2 font-semibold text-slate-500">Kelola frame, upload PNG, dan atur slot foto online.</p>
        </Link>

        <Link href="/admin/vouchers" className="rounded-[36px] bg-white p-7 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3EEFF] text-3xl">🎟️</div>
          <h2 className="mt-6 text-3xl font-black">Voucher</h2>
          <p className="mt-2 font-semibold text-slate-500">Buat dan pantau voucher photobooth.</p>
        </Link>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[36px] bg-white p-7 shadow-xl">
          <h2 className="text-3xl font-black">Omzet 7 Hari Terakhir</h2>
          <p className="mt-2 font-semibold text-slate-500">Grafik pemasukan dari data Pembukuan.</p>

          <div className="mt-8 flex h-[280px] items-end gap-4 overflow-x-auto">
            {chart.length > 0 ? (
              chart.map((item) => (
                <div key={item.label} className="flex min-w-[90px] flex-1 flex-col items-center">
                  <div className="mb-3 text-xs font-black text-slate-400">{formatRupiah(item.income)}</div>

                  <div className="flex h-[190px] w-full items-end rounded-2xl bg-[#F6F7FF] p-2">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-[#4263FF] via-[#7657FF] to-[#FF7BC3] shadow-lg shadow-[#4263FF]/20"
                      style={{ height: `${Math.max(item.percent, 6)}%` }}
                    />
                  </div>

                  <div className="mt-3 font-black text-slate-500">{item.label}</div>
                </div>
              ))
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#F6F7FF] font-bold text-slate-400">
                Belum ada data grafik.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[36px] bg-white p-7 shadow-xl">
          <h2 className="text-3xl font-black">Metode Pemasukan</h2>
          <p className="mt-2 font-semibold text-slate-500">Ringkasan metode dari Pembukuan.</p>

          <div className="mt-7 space-y-4">
            {Object.entries(methodStats).map(([method, stat]) => (
              <div key={method} className="rounded-2xl bg-[#F6F7FF] p-5">
                <p className="font-black text-[#4263FF]">{method}</p>
                <h3 className="mt-2 text-2xl font-black">{formatRupiah(stat.total)}</h3>
                <p className="mt-1 text-sm font-bold text-slate-400">{stat.count} transaksi</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[36px] bg-white p-7 shadow-xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-black">Transaksi Pembukuan</h2>
            <p className="mt-2 font-semibold text-slate-500">Riwayat terbaru dari Pembukuan. Bisa dihapus langsung dari dashboard.</p>
          </div>

          <Link href="/admin/bookkeeping" className="rounded-full bg-[#4263FF] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#4263FF]/20">
            Buka Pembukuan
          </Link>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="bg-[#F6F7FF]">
              <tr>
                <th className="p-5 font-black text-slate-400">Waktu</th>
                <th className="p-5 font-black text-slate-400">Jenis</th>
                <th className="p-5 font-black text-slate-400">Sumber</th>
                <th className="p-5 font-black text-slate-400">Kategori</th>
                <th className="p-5 font-black text-slate-400">Metode</th>
                <th className="p-5 font-black text-slate-400">Catatan</th>
                <th className="p-5 font-black text-slate-400">Nominal</th>
                <th className="p-5 font-black text-slate-400">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center font-bold text-slate-400">Memuat data pembukuan...</td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.slice(0, 50).map((trx) => (
                  <tr key={trx.id} className="border-t border-slate-100 transition hover:bg-[#FAFBFF]">
                    <td className="p-5 font-bold text-slate-500">{formatDate(trx.createdAt)}</td>
                    <td className="p-5">
                      <span className={trx.type === "INCOME" ? "rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-600" : "rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-600"}>
                        {trx.type === "INCOME" ? "Masuk" : "Keluar"}
                      </span>
                    </td>
                    <td className="p-5 font-black text-slate-400">{trx.source}</td>
                    <td className="p-5 font-black">{trx.category}</td>
                    <td className="p-5 font-bold text-slate-600">{trx.method || "-"}</td>
                    <td className="max-w-[260px] p-5 font-semibold text-slate-500">{trx.description || trx.sessionId || "-"}</td>
                    <td className={trx.type === "INCOME" ? "p-5 font-black text-emerald-600" : "p-5 font-black text-rose-600"}>
                      {trx.type === "INCOME" ? "+ " : "- "}{formatRupiah(trx.amount)}
                    </td>
                    <td className="p-5">
                      <button
                        onClick={() => deleteTransaction(trx.id)}
                        className="rounded-full bg-rose-50 px-5 py-3 text-sm font-black text-rose-500 transition hover:bg-rose-100"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-10 text-center font-bold text-slate-400">Belum ada transaksi pembukuan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HeroCard({ title, value, caption }: { title: string; value: number; caption: string }) {
  return (
    <div className="rounded-[26px] bg-white/15 p-5 backdrop-blur-xl">
      <p className="text-xs font-black text-white/60">{title}</p>
      <h3 className="mt-2 text-2xl font-black">{formatRupiah(value)}</h3>
      <p className="mt-1 text-sm font-bold text-white/60">{caption}</p>
    </div>
  );
}
