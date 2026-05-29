"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Camera,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  Image,
  Ticket,
  Zap,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  setLoading(true);
  setError("");

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usernameOrEmail,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Login gagal.");
      return;
    }

    localStorage.setItem("miori_admin_login", "true");
    localStorage.setItem("miori_admin_name", data.user.name);
    localStorage.setItem("miori_admin_role", data.user.role);
    localStorage.setItem("miori_admin_email", data.user.email);

    router.push("/admin/dashboard");
  } catch (error) {
    console.error("LOGIN_CLIENT_ERROR:", error);
    setError("Tidak dapat terhubung ke server. Cek terminal VS Code.");
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f7ff] p-4 md:p-8">
      <motion.div
        animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#4263ff]/20 blur-3xl"
      />

      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#ff7bc3]/25 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 35, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl overflow-hidden rounded-[38px] bg-white shadow-2xl md:grid-cols-2"
      >
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#4263FF] via-[#7657FF] to-[#FF7BC3] p-10 text-white md:block">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/20"
          />

          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full border border-white/20"
          />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -25 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4"
              >
                <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/20 backdrop-blur-xl">
                  <Camera size={32} />
                </div>

                <div>
                  <h1 className="text-2xl font-black">Miori Booth</h1>
                  <p className="font-semibold text-white/75">
                    Photobooth Pro System
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-16"
              >
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-black backdrop-blur">
                  <Sparkles size={16} />
                  Smart Booth Dashboard
                </div>

                <h2 className="max-w-md text-5xl font-black leading-tight">
                  Photobooth management made simple.
                </h2>

                <p className="mt-5 max-w-md text-lg font-medium leading-relaxed text-white/85">
                  Kelola event, voucher, booth, penjualan, dan galeri foto dalam
                  satu dashboard yang rapi.
                </p>
              </motion.div>

              <div className="mt-10 space-y-4">
                {[
                  {
                    icon: Image,
                    title: "Booth & Gallery",
                    desc: "Session, capture, final photo, dan QR galeri.",
                  },
                  {
                    icon: Ticket,
                    title: "Voucher System",
                    desc: "Paket, kuota, penjualan, dan validasi voucher.",
                  },
                  {
                    icon: Zap,
                    title: "Fast Workflow",
                    desc: "Operator lebih mudah memantau event dan transaksi.",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.12 }}
                    whileHover={{ scale: 1.035, x: 8 }}
                    className="group flex gap-4 rounded-3xl border border-white/20 bg-white/15 p-5 backdrop-blur-xl transition"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 transition group-hover:bg-white/30">
                      <item.icon size={24} />
                    </div>

                    <div>
                      <h3 className="font-black">{item.title}</h3>
                      <p className="mt-1 text-sm font-medium text-white/80">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <p className="text-sm font-semibold text-white/70">
              © 2026 Miori Booth. Secure admin access.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 md:p-12">
          <motion.div
            initial={{ opacity: 0, x: 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="w-full max-w-md"
          >
            <div className="mb-9 text-center md:hidden">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#4263FF] text-white shadow-xl shadow-[#4263ff]/30">
                <Camera size={32} />
              </div>

              <h1 className="mt-4 text-3xl font-black text-slate-950">
                Miori Booth
              </h1>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <h2 className="text-4xl font-black text-slate-950">
                Masuk Dashboard
              </h2>
              <p className="mt-3 font-semibold text-slate-500">
                Login sebagai owner, admin, atau operator booth.
              </p>
            </motion.div>

            <form onSubmit={handleLogin} className="mt-9 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Username atau Email
                </label>

                <div className="group flex h-14 items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 transition focus-within:border-[#4263FF] focus-within:ring-4 focus-within:ring-[#4263FF]/10">
                  <Mail
                    className="text-slate-400 group-focus-within:text-[#4263FF]"
                    size={20}
                  />

                  <input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="Masukkan username atau email"
                    className="h-full flex-1 bg-transparent font-semibold text-slate-900 outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Password
                </label>

                <div className="group flex h-14 items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 transition focus-within:border-[#4263FF] focus-within:ring-4 focus-within:ring-[#4263FF]/10">
                  <Lock
                    className="text-slate-400 group-focus-within:text-[#4263FF]"
                    size={20}
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="h-full flex-1 bg-transparent font-semibold text-slate-900 outline-none placeholder:text-slate-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 transition hover:text-[#4263FF]"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setRemember(!remember)}
                  className="flex items-center gap-3 text-sm font-bold text-slate-600"
                >
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-md border transition ${
                      remember
                        ? "border-[#4263FF] bg-[#4263FF] text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {remember ? "✓" : ""}
                  </span>
                  Ingat saya
                </button>
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-500">
                  {error}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.025, y: -2 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#4263FF] text-base font-black text-white shadow-xl shadow-[#4263FF]/25 transition hover:bg-[#3152F5] disabled:opacity-80"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </motion.button>
            </form>
          </motion.div>
        </section>
      </motion.div>
    </main>
  );
}