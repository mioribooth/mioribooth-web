"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "OPERATOR",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/users", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Gagal mengambil data user.");
        return;
      }

      setUsers(data.users || []);
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Gagal membuat user.");
        setSaving(false);
        return;
      }

      setMessage("User berhasil dibuat.");
      setForm({
        name: "",
        username: "",
        email: "",
        password: "",
        role: "OPERATOR",
      });

      await fetchUsers();
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <main className="min-h-screen bg-[#F6F7FF] p-5 text-[#101828]">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        {/* FORM */}
        <section className="rounded-[36px] bg-white p-7 shadow-xl">
          <p className="text-sm font-black text-[#4263FF]">
            USER MANAGEMENT
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em]">
            Tambah User
          </h1>
          <p className="mt-2 font-semibold text-slate-500">
            Buat akun admin, operator, atau kasir booth.
          </p>

          <form onSubmit={createUser} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Nama
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="Contoh: Operator Booth"
                className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-5 font-semibold text-slate-900 outline-none focus:border-[#4263FF] focus:ring-4 focus:ring-[#4263FF]/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Username
              </label>
              <input
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
                placeholder="operator1"
                className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-5 font-semibold text-slate-900 outline-none focus:border-[#4263FF] focus:ring-4 focus:ring-[#4263FF]/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                placeholder="operator@miori.id"
                className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-5 font-semibold text-slate-900 outline-none focus:border-[#4263FF] focus:ring-4 focus:ring-[#4263FF]/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                placeholder="Minimal 6 karakter"
                className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-5 font-semibold text-slate-900 outline-none focus:border-[#4263FF] focus:ring-4 focus:ring-[#4263FF]/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
                className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-5 font-black text-slate-900 outline-none focus:border-[#4263FF] focus:ring-4 focus:ring-[#4263FF]/10"
              >
                <option value="OWNER">OWNER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="OPERATOR">OPERATOR</option>
                <option value="CASHIER">CASHIER</option>
              </select>
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
              {saving ? "Menyimpan..." : "Tambah User"}
            </button>
          </form>
        </section>

        {/* USER LIST */}
        <section className="rounded-[36px] bg-white p-7 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-[#4263FF]">
                ADMIN ACCOUNT
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.04em]">
                Daftar User
              </h2>
            </div>

            <button
              onClick={fetchUsers}
              className="rounded-2xl bg-[#F6F7FF] px-5 py-3 text-sm font-black text-[#4263FF]"
            >
              Refresh
            </button>
          </div>

          <div className="mt-7 overflow-x-auto rounded-[28px] border border-slate-100">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[#F6F7FF]">
                <tr>
                  <th className="p-5 text-sm font-black text-slate-400">
                    Nama
                  </th>
                  <th className="p-5 text-sm font-black text-slate-400">
                    Username
                  </th>
                  <th className="p-5 text-sm font-black text-slate-400">
                    Email
                  </th>
                  <th className="p-5 text-sm font-black text-slate-400">
                    Role
                  </th>
                  <th className="p-5 text-sm font-black text-slate-400">
                    Dibuat
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-10 text-center font-bold text-slate-400"
                    >
                      Loading user...
                    </td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-slate-100 hover:bg-[#FAFBFF]"
                    >
                      <td className="p-5 font-black">{user.name}</td>
                      <td className="p-5 font-bold text-slate-500">
                        {user.username}
                      </td>
                      <td className="p-5 font-bold text-slate-500">
                        {user.email}
                      </td>
                      <td className="p-5">
                        <span className="rounded-full bg-[#EEF1FF] px-4 py-2 text-xs font-black text-[#4263FF]">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-5 font-bold text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-10 text-center font-bold text-slate-400"
                    >
                      Belum ada user.
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