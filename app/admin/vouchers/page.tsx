"use client";

import { useEffect, useMemo, useState } from "react";

type Voucher = {
  id: string;
  code: string;
  name: string;
  packageName: string;
  quota: number;
  used: number;
  price: number;
  isActive: boolean;
  createdAt: string;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    code: "",
    name: "",
    packageName: "Photo Strip",
    quota: 1,
    price: 35000,
  });

  const stats = useMemo(() => {
    const total = vouchers.length;
    const active = vouchers.filter((v) => v.isActive).length;
    const used = vouchers.reduce((sum, v) => sum + v.used, 0);
    const quota = vouchers.reduce((sum, v) => sum + v.quota, 0);

    return { total, active, used, quota };
  }, [vouchers]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/vouchers", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Gagal mengambil voucher.");
        return;
      }

      setVouchers(data.vouchers || []);
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const createVoucher = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Gagal membuat voucher.");
        return;
      }

      setMessage("Voucher berhasil dibuat.");
      setForm({
        code: "",
        name: "",
        packageName: "Photo Strip",
        quota: 1,
        price: 35000,
      });

      await fetchVouchers();
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setSaving(false);
    }
  };

  const toggleVoucher = async (voucher: Voucher) => {
    try {
      setError("");
      setMessage("");

      const response = await fetch(`/api/admin/vouchers/${voucher.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !voucher.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Gagal update voucher.");
        return;
      }

      setMessage("Status voucher berhasil diperbarui.");
      await fetchVouchers();
    } catch {
      setError("Tidak bisa terhubung ke server.");
    }
  };

  const deleteVoucher = async (voucher: Voucher) => {
    const confirmDelete = window.confirm(
      `Hapus voucher ${voucher.code}? Tindakan ini tidak bisa dibatalkan.`
    );

    if (!confirmDelete) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(`/api/admin/vouchers/${voucher.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Gagal hapus voucher.");
        return;
      }

      setMessage("Voucher berhasil dihapus.");
      await fetchVouchers();
    } catch {
      setError("Tidak bisa terhubung ke server.");
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  return (
    <div className="text-[#101828]">
      <div className="mb-6 overflow-hidden rounded-[40px] bg-gradient-to-br from-[#4263FF] via-[#7657FF] to-[#FF7BC3] p-8 text-white shadow-2xl">
        <p className="inline-flex rounded-full bg-white/20 px-5 py-3 text-sm font-black backdrop-blur">
          Voucher Management
        </p>

        <h1 className="mt-6 text-5xl font-black tracking-[-0.05em]">
          Voucher Booth
        </h1>

        <p className="mt-3 max-w-2xl font-semibold text-white/80">
          Buat voucher untuk event, customer, promo, atau paket khusus
          photobooth.
        </p>

        <div className="mt-7 grid gap-4 md:grid-cols-4">
          <div className="rounded-[26px] bg-white/15 p-5 backdrop-blur-xl">
            <p className="text-xs font-black text-white/60">TOTAL VOUCHER</p>
            <h3 className="mt-2 text-3xl font-black">{stats.total}</h3>
          </div>

          <div className="rounded-[26px] bg-white/15 p-5 backdrop-blur-xl">
            <p className="text-xs font-black text-white/60">AKTIF</p>
            <h3 className="mt-2 text-3xl font-black">{stats.active}</h3>
          </div>

          <div className="rounded-[26px] bg-white/15 p-5 backdrop-blur-xl">
            <p className="text-xs font-black text-white/60">TERPAKAI</p>
            <h3 className="mt-2 text-3xl font-black">{stats.used}</h3>
          </div>

          <div className="rounded-[26px] bg-white/15 p-5 backdrop-blur-xl">
            <p className="text-xs font-black text-white/60">TOTAL KUOTA</p>
            <h3 className="mt-2 text-3xl font-black">{stats.quota}</h3>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-[36px] bg-white p-7 shadow-xl">
          <p className="text-sm font-black text-[#4263FF]">CREATE VOUCHER</p>
          <h2 className="mt-2 text-4xl font-black tracking-[-0.04em]">
            Tambah Voucher
          </h2>
          <p className="mt-2 font-semibold text-slate-500">
            Kosongkan kode jika ingin dibuat otomatis.
          </p>

          <form onSubmit={createVoucher} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Kode Voucher
              </label>
              <input
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="Contoh: MIORI-VIP"
                className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-5 font-semibold text-slate-900 outline-none focus:border-[#4263FF] focus:ring-4 focus:ring-[#4263FF]/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Nama Voucher
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Voucher Opening Booth"
                className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-5 font-semibold text-slate-900 outline-none focus:border-[#4263FF] focus:ring-4 focus:ring-[#4263FF]/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Paket
              </label>
              <select
                value={form.packageName}
                onChange={(e) =>
                  setForm({ ...form, packageName: e.target.value })
                }
                className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-5 font-black text-slate-900 outline-none focus:border-[#4263FF] focus:ring-4 focus:ring-[#4263FF]/10"
              >
                <option value="Photo Strip">Photo Strip</option>
                <option value="Single Photo">Single Photo</option>
                <option value="Photo Strip + Ganci">Photo Strip + Ganci</option>
                <option value="All Package">All Package</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Kuota
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.quota}
                  onChange={(e) =>
                    setForm({ ...form, quota: Number(e.target.value) })
                  }
                  className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-5 font-semibold text-slate-900 outline-none focus:border-[#4263FF] focus:ring-4 focus:ring-[#4263FF]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Harga
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-5 font-semibold text-slate-900 outline-none focus:border-[#4263FF] focus:ring-4 focus:ring-[#4263FF]/10"
                />
              </div>
            </div>

            {message && (
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-600">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-500">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="h-14 w-full rounded-2xl bg-[#4263FF] font-black text-white shadow-xl shadow-[#4263FF]/25 transition hover:bg-[#3152F5] disabled:opacity-70"
            >
              {saving ? "Menyimpan..." : "Tambah Voucher"}
            </button>
          </form>
        </section>

        <section className="rounded-[36px] bg-white p-7 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-[#4263FF]">VOUCHER LIST</p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.04em]">
                Daftar Voucher
              </h2>
            </div>

            <button
              onClick={fetchVouchers}
              className="rounded-2xl bg-[#F6F7FF] px-5 py-3 text-sm font-black text-[#4263FF]"
            >
              Refresh
            </button>
          </div>

          <div className="mt-7 overflow-x-auto rounded-[28px] border border-slate-100">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-[#F6F7FF]">
                <tr>
                  <th className="p-5 text-sm font-black text-slate-400">
                    Kode
                  </th>
                  <th className="p-5 text-sm font-black text-slate-400">
                    Nama
                  </th>
                  <th className="p-5 text-sm font-black text-slate-400">
                    Paket
                  </th>
                  <th className="p-5 text-sm font-black text-slate-400">
                    Kuota
                  </th>
                  <th className="p-5 text-sm font-black text-slate-400">
                    Harga
                  </th>
                  <th className="p-5 text-sm font-black text-slate-400">
                    Status
                  </th>
                  <th className="p-5 text-sm font-black text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-10 text-center font-bold text-slate-400"
                    >
                      Loading voucher...
                    </td>
                  </tr>
                ) : vouchers.length > 0 ? (
                  vouchers.map((voucher) => (
                    <tr
                      key={voucher.id}
                      className="border-t border-slate-100 hover:bg-[#FAFBFF]"
                    >
                      <td className="p-5 font-black text-[#4263FF]">
                        {voucher.code}
                      </td>

                      <td className="p-5 font-black">{voucher.name}</td>

                      <td className="p-5 font-bold text-slate-500">
                        {voucher.packageName}
                      </td>

                      <td className="p-5 font-bold text-slate-500">
                        {voucher.used}/{voucher.quota}
                      </td>

                      <td className="p-5 font-black">
                        {formatRupiah(voucher.price)}
                      </td>

                      <td className="p-5">
                        <span
                          className={`rounded-full px-4 py-2 text-xs font-black ${
                            voucher.isActive
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {voucher.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>

                      <td className="p-5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleVoucher(voucher)}
                            className="rounded-xl bg-[#EEF1FF] px-4 py-2 text-xs font-black text-[#4263FF]"
                          >
                            {voucher.isActive ? "Disable" : "Enable"}
                          </button>

                          <button
                            onClick={() => deleteVoucher(voucher)}
                            className="rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-10 text-center font-bold text-slate-400"
                    >
                      Belum ada voucher.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}