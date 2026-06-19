"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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

const incomeCategories = [
  "Photobooth",
  "Extra Print",
  "Voucher",
  "Reprint",
  "DP Event",
  "Pelunasan Event",
  "Lainnya",
];

const expenseCategories = [
  "Kertas",
  "Tinta",
  "Transport",
  "Makan",
  "Kos",
  "Peralatan",
  "Marketing",
  "Lainnya",
];

const methods = ["CASH", "QRIS", "TRANSFER", "VOUCHER", "OTHER"];

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

function todayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function BookkeepingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState<BookkeepingTransaction[]>([]);
  const [summary, setSummary] = useState<ApiPayload["summary"]>({
    filtered: { income: 0, expense: 0, profit: 0 },
    today: { income: 0, expense: 0, profit: 0 },
    month: { income: 0, expense: 0, profit: 0 },
  });

  const [type, setType] = useState<TransactionType>("INCOME");
  const [category, setCategory] = useState("Photobooth");
  const [method, setMethod] = useState("CASH");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayInputValue());
  const [description, setDescription] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const categories = useMemo(
    () => (type === "INCOME" ? incomeCategories : expenseCategories),
    [type]
  );

  useEffect(() => {
    setCategory(type === "INCOME" ? "Photobooth" : "Kertas");
  }, [type]);

  async function loadData() {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (filterType === "INCOME" || filterType === "EXPENSE") {
        params.set("type", filterType);
      }

      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const response = await fetch(`/api/admin/bookkeeping?${params.toString()}`, {
        cache: "no-store",
      });
      const data: ApiPayload = await response.json();

      if (!data.success) {
        alert(data.message || "Gagal mengambil data pembukuan.");
        return;
      }

      setTransactions(data.transactions || []);
      setSummary(data.summary);
    } catch (error) {
      console.error("LOAD_BOOKKEEPING_ERROR:", error);
      alert("Gagal mengambil data pembukuan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/bookkeeping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          category,
          method,
          amount: Number(amount),
          transactionDate,
          description,
          source: "MANUAL",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message || "Gagal menyimpan transaksi.");
        return;
      }

      setAmount("");
      setTransactionDate(todayInputValue());
      setDescription("");
      await loadData();
    } catch (error) {
      console.error("SAVE_BOOKKEEPING_ERROR:", error);
      alert("Gagal menyimpan transaksi.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTransaction(id: string) {
    const ok = confirm("Hapus transaksi pembukuan ini?");
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

      await loadData();
    } catch (error) {
      console.error("DELETE_BOOKKEEPING_ERROR:", error);
      alert("Gagal menghapus transaksi.");
    }
  }

  function setTodayFilter() {
    const today = todayInputValue();
    setFrom(today);
    setTo(today);
  }

  function resetFilter() {
    setFilterType("ALL");
    setFrom("");
    setTo("");
  }

  return (
    <div className="space-y-6 text-[#101828]">
      <section className="overflow-hidden rounded-[44px] bg-gradient-to-br from-[#4263FF] via-[#7657FF] to-[#FF7BC3] p-8 text-white shadow-2xl">
        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-white/70">
              MIORI FINANCE
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] md:text-6xl">
              Pembukuan
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/75 md:text-base">
              Catat pemasukan dan pengeluaran Miori Booth. Transaksi manual bisa kamu input sendiri, transaksi otomatis bisa masuk dari QRIS, voucher, extra print, dan reprint.
            </p>
          </div>

          <button
            onClick={loadData}
            className="rounded-full bg-white px-6 py-4 text-sm font-black text-[#4263FF] shadow-xl transition hover:scale-[1.02]"
          >
            <i className="fa-solid fa-rotate mr-2" /> Refresh Data
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard title="Omzet Hari Ini" value={summary.today.income} icon="fa-arrow-trend-up" />
        <SummaryCard title="Keluar Hari Ini" value={summary.today.expense} icon="fa-arrow-trend-down" />
        <SummaryCard title="Profit Hari Ini" value={summary.today.profit} icon="fa-wallet" positive={summary.today.profit >= 0} />
        <SummaryCard title="Omzet Bulan Ini" value={summary.month.income} icon="fa-calendar-days" />
        <SummaryCard title="Keluar Bulan Ini" value={summary.month.expense} icon="fa-receipt" />
        <SummaryCard title="Profit Bulan Ini" value={summary.month.profit} icon="fa-sack-dollar" positive={summary.month.profit >= 0} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <form onSubmit={submitTransaction} className="rounded-[36px] bg-white p-7 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                Input Manual
              </h2>
              <p className="mt-1 text-sm font-bold text-slate-400">
                Tambah pemasukan atau pengeluaran harian.
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-3xl bg-[#F6F7FF] text-[#4263FF]">
              <i className="fa-solid fa-pen-to-square" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 rounded-3xl bg-[#F6F7FF] p-2">
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                type === "INCOME"
                  ? "bg-white text-[#4263FF] shadow-lg"
                  : "text-slate-400"
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                type === "EXPENSE"
                  ? "bg-white text-red-500 shadow-lg"
                  : "text-slate-400"
              }`}
            >
              Pengeluaran
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Tanggal Transaksi">
              <input
                type="date"
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
                className="w-full rounded-2xl border border-slate-100 bg-[#F6F7FF] px-4 py-4 text-sm font-black outline-none focus:border-[#4263FF]"
              />
              <p className="mt-2 text-xs font-bold text-slate-400">
                Pakai tanggal ini kalau kamu mau catat transaksi kemarin atau hari tertentu.
              </p>
            </Field>

            <Field label="Kategori">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-2xl border border-slate-100 bg-[#F6F7FF] px-4 py-4 text-sm font-black outline-none focus:border-[#4263FF]"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Metode">
              <select
                value={method}
                onChange={(event) => setMethod(event.target.value)}
                className="w-full rounded-2xl border border-slate-100 bg-[#F6F7FF] px-4 py-4 text-sm font-black outline-none focus:border-[#4263FF]"
              >
                {methods.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nominal">
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))}
                placeholder="25000"
                inputMode="numeric"
                className="w-full rounded-2xl border border-slate-100 bg-[#F6F7FF] px-4 py-4 text-sm font-black outline-none focus:border-[#4263FF]"
              />
            </Field>

            <Field label="Catatan">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Contoh: beli kertas 4R / DP wedding / extra print customer"
                rows={4}
                className="w-full resize-none rounded-2xl border border-slate-100 bg-[#F6F7FF] px-4 py-4 text-sm font-bold outline-none focus:border-[#4263FF]"
              />
            </Field>
          </div>

          <button
            disabled={saving}
            className="mt-6 w-full rounded-full bg-[#4263FF] px-6 py-4 text-sm font-black text-white shadow-xl transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </form>

        <section className="rounded-[36px] bg-white p-7 shadow-xl">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                Riwayat Transaksi
              </h2>
              <p className="mt-1 text-sm font-bold text-slate-400">
                Filter transaksi berdasarkan jenis dan tanggal.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={setTodayFilter} className="rounded-full bg-[#F6F7FF] px-4 py-3 text-xs font-black text-[#4263FF]">
                Hari Ini
              </button>
              <button onClick={resetFilter} className="rounded-full bg-[#F6F7FF] px-4 py-3 text-xs font-black text-slate-500">
                Reset
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              className="rounded-2xl border border-slate-100 bg-[#F6F7FF] px-4 py-3 text-sm font-black outline-none"
            >
              <option value="ALL">Semua</option>
              <option value="INCOME">Pemasukan</option>
              <option value="EXPENSE">Pengeluaran</option>
            </select>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="rounded-2xl border border-slate-100 bg-[#F6F7FF] px-4 py-3 text-sm font-black outline-none"
            />
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="rounded-2xl border border-slate-100 bg-[#F6F7FF] px-4 py-3 text-sm font-black outline-none"
            />
            <button onClick={loadData} className="rounded-2xl bg-[#101828] px-4 py-3 text-sm font-black text-white">
              Terapkan
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <MiniSummary label="Pemasukan Filter" value={summary.filtered.income} />
            <MiniSummary label="Pengeluaran Filter" value={summary.filtered.expense} />
            <MiniSummary label="Profit Filter" value={summary.filtered.profit} />
          </div>

          <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-100">
            <div className="hidden grid-cols-[120px_1fr_130px_140px_90px] bg-[#F6F7FF] px-5 py-4 text-xs font-black uppercase tracking-[0.15em] text-slate-400 md:grid">
              <span>Jenis</span>
              <span>Detail</span>
              <span>Metode</span>
              <span>Nominal</span>
              <span>Aksi</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm font-black text-slate-400">
                Memuat data pembukuan...
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-sm font-black text-slate-400">
                Belum ada transaksi pembukuan.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.map((trx) => (
                  <div
                    key={trx.id}
                    className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[120px_1fr_130px_140px_90px] md:items-center"
                  >
                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                          trx.type === "INCOME"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-500"
                        }`}
                      >
                        {trx.type === "INCOME" ? "Masuk" : "Keluar"}
                      </span>
                      <p className="mt-2 text-[11px] font-black text-slate-300">
                        {trx.source}
                      </p>
                    </div>

                    <div>
                      <p className="font-black text-slate-900">{trx.category}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {formatDate(trx.createdAt)}
                      </p>
                      {trx.description ? (
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {trx.description}
                        </p>
                      ) : null}
                      {trx.sessionId ? (
                        <p className="mt-1 text-xs font-black text-[#4263FF]">
                          Session: {trx.sessionId}
                        </p>
                      ) : null}
                    </div>

                    <p className="text-sm font-black text-slate-500">
                      {trx.method || "-"}
                    </p>

                    <p
                      className={`text-lg font-black ${
                        trx.type === "INCOME" ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {trx.type === "INCOME" ? "+" : "-"} {formatRupiah(trx.amount)}
                    </p>

                    <button
                      onClick={() => deleteTransaction(trx.id)}
                      className="rounded-full bg-red-50 px-4 py-3 text-xs font-black text-red-500 transition hover:bg-red-100"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  positive = true,
}: {
  title: string;
  value: number;
  icon: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-[30px] bg-white p-5 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F6F7FF] text-[#4263FF]">
          <i className={`fa-solid ${icon}`} />
        </div>
        <span className={`text-xs font-black ${positive ? "text-emerald-500" : "text-red-500"}`}>
          {positive ? "OK" : "MINUS"}
        </span>
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-900">
        {formatRupiah(value)}
      </p>
    </div>
  );
}

function MiniSummary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-[#F6F7FF] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-slate-900">{formatRupiah(value)}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}
