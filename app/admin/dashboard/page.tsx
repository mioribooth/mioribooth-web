type Transaction = {
  transactionId: string;
  paymentMethod: "QRIS" | "VOUCHER" | "CASH";
  voucherCode?: string;
  packageName: string;
  extraPrint: number;
  amount: number;
  paidAt: string;
};

type Summary = {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  totalTransactions: number;
  todayTransactions: number;
  weekTransactions: number;
  monthTransactions: number;
  qrisRevenue: number;
  voucherRevenue: number;
  cashRevenue: number;
  qrisCount: number;
  voucherCount: number;
  cashCount: number;
  voucherActive: number;
  voucherUsed: number;
  voucherTotal: number;
};

type ChartItem = {
  label: string;
  revenue: number;
  percent: number;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

async function getDashboard() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/admin/dashboard`, {
    cache: "no-store",
  });

  if (!response.ok) return null;

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const defaultSummary: Summary = {
  todayRevenue: 0,
  weekRevenue: 0,
  monthRevenue: 0,
  totalTransactions: 0,
  todayTransactions: 0,
  weekTransactions: 0,
  monthTransactions: 0,
  qrisRevenue: 0,
  voucherRevenue: 0,
  cashRevenue: 0,
  qrisCount: 0,
  voucherCount: 0,
  cashCount: 0,
  voucherActive: 0,
  voucherUsed: 0,
  voucherTotal: 0,
};

export default async function AdminDashboardPage() {
  const data = await getDashboard();

  const summary: Summary = data?.summary || defaultSummary;
  const transactions: Transaction[] = data?.transactions || [];
  const chart: ChartItem[] = data?.chart || [];

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
              Dashboard Revenue
            </h1>

            <p className="mt-4 max-w-2xl font-semibold leading-relaxed text-white/80">
              Pantau transaksi, banner promo, invoice, subscription, user, harga
              bundle, template, gallery, dan report analytic.
            </p>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <div className="rounded-[26px] bg-white/15 p-5 backdrop-blur-xl">
                <p className="text-xs font-black text-white/60">
                  TODAY REVENUE
                </p>
                <h3 className="mt-2 text-2xl font-black">
                  {formatRupiah(summary.todayRevenue)}
                </h3>
                <p className="mt-1 text-sm font-bold text-white/60">
                  {summary.todayTransactions} transaksi
                </p>
              </div>

              <div className="rounded-[26px] bg-white/15 p-5 backdrop-blur-xl">
                <p className="text-xs font-black text-white/60">
                  WEEK REVENUE
                </p>
                <h3 className="mt-2 text-2xl font-black">
                  {formatRupiah(summary.weekRevenue)}
                </h3>
                <p className="mt-1 text-sm font-bold text-white/60">
                  {summary.weekTransactions} transaksi
                </p>
              </div>

              <div className="rounded-[26px] bg-white/15 p-5 backdrop-blur-xl">
                <p className="text-xs font-black text-white/60">
                  MONTH REVENUE
                </p>
                <h3 className="mt-2 text-2xl font-black">
                  {formatRupiah(summary.monthRevenue)}
                </h3>
                <p className="mt-1 text-sm font-bold text-white/60">
                  {summary.monthTransactions} transaksi
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[44px] bg-[#101828] p-8 text-white shadow-2xl">
          <p className="text-sm font-black text-white/50">BOOTH STATUS</p>
          <h3 className="mt-3 text-5xl font-black">Online</h3>
          <p className="mt-3 font-semibold text-white/50">
            Semua sistem utama aktif.
          </p>

          <div className="mt-7 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-bold text-white/50">QRIS</p>
              <p className="mt-1 text-2xl font-black">{summary.qrisCount}</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-bold text-white/50">Voucher</p>
              <p className="mt-1 text-2xl font-black">
                {summary.voucherCount}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-bold text-white/50">Cash</p>
              <p className="mt-1 text-2xl font-black">{summary.cashCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["🎟️", "Banner Promo", "Kelola promo dan banner booth."],
          ["🧾", "Invoice", "Pantau invoice event dan pembayaran."],
          ["⭐", "Subscription", "Status paket dan masa aktif sistem."],
          ["👥", "User Management", "Kelola admin dan operator booth."],
          ["📦", "Harga Bundle", "Atur paket, add-on, dan bundling."],
          ["🖼️", "Template", "Atur frame dan template foto."],
          ["🌄", "Gallery", "Lihat hasil foto customer."],
          ["📊", "Report Analytic", "Analisa revenue dan transaksi."],
        ].map(([icon, title, desc]) => (
          <div
            key={title}
            className="group rounded-[34px] bg-white p-6 shadow-xl transition hover:-translate-y-2"
          >
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#EEF1FF] text-2xl transition group-hover:bg-gradient-to-br group-hover:from-[#4263FF] group-hover:to-[#FF7BC3]">
              {icon}
            </div>
            <h3 className="mt-5 text-xl font-black">{title}</h3>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
              {desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[36px] bg-white p-7 shadow-xl">
          <h2 className="text-3xl font-black">Revenue 7 Hari Terakhir</h2>
          <p className="mt-2 font-semibold text-slate-500">
            Grafik sederhana pendapatan harian.
          </p>

          <div className="mt-8 flex h-[280px] items-end gap-4 overflow-x-auto">
            {chart.length > 0 ? (
              chart.map((item) => (
                <div
                  key={item.label}
                  className="flex min-w-[90px] flex-1 flex-col items-center"
                >
                  <div className="mb-3 text-xs font-black text-slate-400">
                    {formatRupiah(item.revenue)}
                  </div>

                  <div className="flex h-[190px] w-full items-end rounded-2xl bg-[#F6F7FF] p-2">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-[#4263FF] via-[#7657FF] to-[#FF7BC3] shadow-lg shadow-[#4263FF]/20"
                      style={{
                        height: `${Math.max(item.percent, 6)}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 font-black text-slate-500">
                    {item.label}
                  </div>
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
          <h2 className="text-3xl font-black">Payment Method</h2>
          <p className="mt-2 font-semibold text-slate-500">
            Ringkasan metode pembayaran.
          </p>

          <div className="mt-7 space-y-4">
            <div className="rounded-2xl bg-[#EEF1FF] p-5">
              <p className="font-black text-[#4263FF]">QRIS</p>
              <h3 className="mt-2 text-2xl font-black">
                {formatRupiah(summary.qrisRevenue)}
              </h3>
              <p className="mt-1 text-sm font-bold text-slate-400">
                {summary.qrisCount} transaksi
              </p>
            </div>

            <div className="rounded-2xl bg-[#F3EEFF] p-5">
              <p className="font-black text-[#7657FF]">Voucher</p>
              <h3 className="mt-2 text-2xl font-black">
                {formatRupiah(summary.voucherRevenue)}
              </h3>
              <p className="mt-1 text-sm font-bold text-slate-400">
                {summary.voucherCount} transaksi
              </p>
            </div>

            <div className="rounded-2xl bg-[#FFF0F7] p-5">
              <p className="font-black text-[#FF4FA3]">Cash</p>
              <h3 className="mt-2 text-2xl font-black">
                {formatRupiah(summary.cashRevenue)}
              </h3>
              <p className="mt-1 text-sm font-bold text-slate-400">
                {summary.cashCount} transaksi
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[36px] bg-white p-7 shadow-xl">
        <h2 className="text-3xl font-black">Transaction</h2>
        <p className="mt-2 font-semibold text-slate-500">
          Riwayat pembayaran terbaru yang tercatat.
        </p>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-[#F6F7FF]">
              <tr>
                <th className="p-5 font-black text-slate-400">Waktu</th>
                <th className="p-5 font-black text-slate-400">Metode</th>
                <th className="p-5 font-black text-slate-400">Voucher</th>
                <th className="p-5 font-black text-slate-400">Paket</th>
                <th className="p-5 font-black text-slate-400">Extra Print</th>
                <th className="p-5 font-black text-slate-400">Total</th>
              </tr>
            </thead>

            <tbody>
              {transactions.length > 0 ? (
                transactions.map((trx) => (
                  <tr
                    key={trx.transactionId}
                    className="border-t border-slate-100 transition hover:bg-[#FAFBFF]"
                  >
                    <td className="p-5 font-bold text-slate-500">
                      {new Date(trx.paidAt).toLocaleString("id-ID")}
                    </td>

                    <td className="p-5">
                      <span className="rounded-full bg-[#EEF1FF] px-4 py-2 text-sm font-black text-[#4263FF]">
                        {trx.paymentMethod}
                      </span>
                    </td>

                    <td className="p-5 font-black">{trx.voucherCode || "-"}</td>

                    <td className="p-5 font-bold text-slate-600">
                      {trx.packageName}
                    </td>

                    <td className="p-5 font-bold text-slate-600">
                      {trx.extraPrint}
                    </td>

                    <td className="p-5 font-black">
                      {formatRupiah(trx.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center font-bold text-slate-400"
                  >
                    Belum ada transaksi.
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