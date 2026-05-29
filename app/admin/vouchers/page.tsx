"use client";

import { useState } from "react";

type Voucher = {
  code: string;
  packageName: string;
  packagePrice: number;
  extraPrint: number;
  extraPrintPrice: number;
  totalAmount: number;
  status: "ACTIVE" | "USED";
  createdAt: string;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

const packages = [
  {
    name: "Paket Basic",
    price: 25000,
  },
  {
    name: "Paket Premium",
    price: 35000,
  },
];

export default function AdminVouchersPage() {
  const [packageName, setPackageName] = useState(packages[0].name);
  const [packagePrice, setPackagePrice] = useState(packages[0].price);
  const [extraPrint, setExtraPrint] = useState(0);
  const [extraPrintPrice] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [lastVoucher, setLastVoucher] = useState<Voucher | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  const totalAmount = packagePrice + extraPrint * extraPrintPrice;

  async function generateVoucher() {
    setLoading(true);

    try {
      const response = await fetch("/api/vouchers/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageName,
          packagePrice,
          extraPrint,
          extraPrintPrice,
          totalAmount,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        alert("Gagal membuat voucher");
        return;
      }

      const voucher: Voucher = {
        code: result.code,
        packageName,
        packagePrice,
        extraPrint,
        extraPrintPrice,
        totalAmount,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };

      setLastVoucher(voucher);
      setVouchers((prev) => [voucher, ...prev]);
    } finally {
      setLoading(false);
    }
  }

  function changePackage(value: string) {
    const selected = packages.find((item) => item.name === value);
    if (!selected) return;

    setPackageName(selected.name);
    setPackagePrice(selected.price);
  }

  return (
    <main className="min-h-screen bg-[#EEF0FF] text-[#111827]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[38px] bg-white/80 p-8 shadow-xl">
          <p className="text-sm font-black text-[#715DFF]">
            ADMIN MIORI BOOTH
          </p>

          <h1 className="mt-2 text-5xl font-black tracking-[-0.04em]">
            Voucher Management
          </h1>

          <p className="mt-3 font-semibold text-slate-500">
            Buat kode voucher 4 digit untuk customer booth.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[38px] bg-white p-8 shadow-xl">
            <h2 className="text-3xl font-black">Buat Voucher</h2>

            <div className="mt-8">
              <label className="text-sm font-black text-slate-400">
                Pilih Paket
              </label>

              <select
                value={packageName}
                onChange={(event) => changePackage(event.target.value)}
                className="mt-3 h-16 w-full rounded-2xl bg-[#F6F7FF] px-5 text-lg font-black outline-none"
              >
                {packages.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} - {formatRupiah(item.price)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6">
              <label className="text-sm font-black text-slate-400">
                Tambahan Print
              </label>

              <div className="mt-3 flex items-center gap-4">
                <button
                  onClick={() => setExtraPrint((prev) => Math.max(0, prev - 1))}
                  className="h-16 w-16 rounded-2xl bg-[#FFF0F0] text-3xl font-black text-red-500"
                >
                  -
                </button>

                <div className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-[#F6F7FF] text-3xl font-black">
                  {extraPrint}
                </div>

                <button
                  onClick={() => setExtraPrint((prev) => prev + 1)}
                  className="h-16 w-16 rounded-2xl bg-[#EEF7FF] text-3xl font-black text-[#4F88FF]"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-8 rounded-[28px] bg-gradient-to-r from-[#7B61FF] to-[#FF4FA3] p-7 text-white">
              <p className="text-sm font-black text-white/70">Total Bayar</p>
              <h3 className="mt-2 text-5xl font-black">
                {formatRupiah(totalAmount)}
              </h3>
            </div>

            <button
              onClick={generateVoucher}
              disabled={loading}
              className="mt-8 h-16 w-full rounded-2xl bg-[#111827] text-lg font-black text-white disabled:bg-gray-300"
            >
              {loading ? "Membuat Voucher..." : "Generate Voucher"}
            </button>
          </section>

          <section className="rounded-[38px] bg-white p-8 shadow-xl">
            <h2 className="text-3xl font-black">Voucher Terakhir</h2>

            {lastVoucher ? (
              <div className="mt-8 rounded-[34px] bg-[#F6F7FF] p-8 text-center">
                <p className="text-sm font-black text-slate-400">
                  Kode Voucher
                </p>

                <h3 className="mt-3 text-8xl font-black tracking-[0.16em] text-[#715DFF]">
                  {lastVoucher.code}
                </h3>

                <div className="mt-8 grid gap-4 text-left md:grid-cols-2">
                  <div className="rounded-2xl bg-white p-5">
                    <p className="text-sm font-black text-slate-400">Paket</p>
                    <p className="mt-1 text-xl font-black">
                      {lastVoucher.packageName}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-5">
                    <p className="text-sm font-black text-slate-400">
                      Tambahan Print
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {lastVoucher.extraPrint}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-5">
                    <p className="text-sm font-black text-slate-400">Total</p>
                    <p className="mt-1 text-xl font-black">
                      {formatRupiah(lastVoucher.totalAmount)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-5">
                    <p className="text-sm font-black text-slate-400">Status</p>
                    <p className="mt-1 text-xl font-black text-green-600">
                      ACTIVE
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigator.clipboard.writeText(lastVoucher.code)}
                  className="mt-8 h-14 rounded-2xl bg-[#715DFF] px-8 font-black text-white"
                >
                  Copy Kode
                </button>
              </div>
            ) : (
              <div className="mt-8 rounded-[34px] bg-[#F6F7FF] p-12 text-center font-bold text-slate-400">
                Belum ada voucher dibuat.
              </div>
            )}
          </section>
        </div>

        <section className="mt-8 rounded-[38px] bg-white p-8 shadow-xl">
          <h2 className="text-3xl font-black">Voucher Dibuat Hari Ini</h2>

          <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-100">
            <table className="w-full text-left">
              <thead className="bg-[#F6F7FF]">
                <tr>
                  <th className="p-5 font-black text-slate-400">Kode</th>
                  <th className="p-5 font-black text-slate-400">Paket</th>
                  <th className="p-5 font-black text-slate-400">Extra Print</th>
                  <th className="p-5 font-black text-slate-400">Total</th>
                  <th className="p-5 font-black text-slate-400">Status</th>
                </tr>
              </thead>

              <tbody>
                {vouchers.length > 0 ? (
                  vouchers.map((voucher) => (
                    <tr key={voucher.code} className="border-t">
                      <td className="p-5 text-2xl font-black">
                        {voucher.code}
                      </td>
                      <td className="p-5 font-bold">{voucher.packageName}</td>
                      <td className="p-5 font-bold">{voucher.extraPrint}</td>
                      <td className="p-5 font-bold">
                        {formatRupiah(voucher.totalAmount)}
                      </td>
                      <td className="p-5">
                        <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-700">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-10 text-center font-bold text-slate-400"
                    >
                      Belum ada voucher hari ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}