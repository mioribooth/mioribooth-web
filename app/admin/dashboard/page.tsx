import Link from "next/link";

type Transaction = {
  transactionId: string;
  paymentMethod: "QRIS" | "VOUCHER" | "CASH";
  voucherCode?: string;
  packageName: string;
  extraPrint: number;
  amount: number;
  paidAt: string;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

async function getDashboard() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/admin/dashboard`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      success: false,
      summary: {
        todayRevenue: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        totalTransactions: 0,
      },
      transactions: [],
    };
  }

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    console.error("Dashboard API bukan JSON:", text.slice(0, 300));

    return {
      success: false,
      summary: {
        todayRevenue: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        totalTransactions: 0,
      },
      transactions: [],
    };
  }
}

export default async function AdminDashboardPage() {
  const data = await getDashboard();

  const summary = data.summary || {
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    totalTransactions: 0,
  };

  const transactions: Transaction[] = data.transactions || [];

  return (
    <main className="min-h-screen bg-[#EEF0FF] text-[#111827]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[38px] bg-white p-8 shadow-xl">
          <p className="text-sm font-black text-[#715DFF]">ADMIN MIORI BOOTH</p>

          <h1 className="mt-2 text-5xl font-black tracking-[-0.04em]">
            Dashboard Revenue
          </h1>

          <p className="mt-3 font-semibold text-slate-500">
            Ringkasan pendapatan booth dari QRIS dan voucher.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              href="/admin/vouchers"
              className="rounded-2xl bg-[#111827] px-6 py-4 font-black text-white"
            >
              Voucher
            </Link>

            <Link
              href="/admin/gallery"
              className="rounded-2xl bg-white px-6 py-4 font-black text-[#715DFF] ring-1 ring-slate-200"
            >
              Gallery
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-[32px] bg-white p-8 shadow-xl">
            <p className="font-black text-slate-400">Hari Ini</p>
            <h2 className="mt-3 text-4xl font-black text-[#715DFF]">
              {formatRupiah(summary.todayRevenue)}
            </h2>
          </div>

          <div className="rounded-[32px] bg-white p-8 shadow-xl">
            <p className="font-black text-slate-400">Minggu Ini</p>
            <h2 className="mt-3 text-4xl font-black text-[#FF4FA3]">
              {formatRupiah(summary.weekRevenue)}
            </h2>
          </div>

          <div className="rounded-[32px] bg-white p-8 shadow-xl">
            <p className="font-black text-slate-400">Bulan Ini</p>
            <h2 className="mt-3 text-4xl font-black text-[#111827]">
              {formatRupiah(summary.monthRevenue)}
            </h2>
          </div>
        </div>

        <div className="mt-8 rounded-[38px] bg-white p-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black">Transaksi Terbaru</h2>
              <p className="mt-2 font-semibold text-slate-500">
                Total transaksi tercatat: {summary.totalTransactions}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-100">
            <table className="w-full text-left">
              <thead className="bg-[#F6F7FF]">
                <tr>
                  <th className="p-5 font-black text-slate-400">Waktu</th>
                  <th className="p-5 font-black text-slate-400">Metode</th>
                  <th className="p-5 font-black text-slate-400">Paket</th>
                  <th className="p-5 font-black text-slate-400">Extra Print</th>
                  <th className="p-5 font-black text-slate-400">Total</th>
                </tr>
              </thead>

              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((trx) => (
                    <tr key={trx.transactionId} className="border-t">
                      <td className="p-5 font-bold">
                        {new Date(trx.paidAt).toLocaleString("id-ID")}
                      </td>
                      <td className="p-5 font-black">{trx.paymentMethod}</td>
                      <td className="p-5 font-bold">{trx.packageName}</td>
                      <td className="p-5 font-bold">{trx.extraPrint}</td>
                      <td className="p-5 font-black">
                        {formatRupiah(trx.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-10 text-center font-bold text-slate-400">
                      Belum ada transaksi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}