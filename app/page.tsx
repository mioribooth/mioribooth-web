"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Calendar,
  Grid2X2,
  Layers,
  ShoppingCart,
  BarChart3,
  Zap,
  Eye,
  LogIn,
  QrCode,
  Sparkles,
  Image,
  Download,
  CheckCircle2,
  Box,
  ArrowRight,
  Play,
} from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Lenis from "lenis";

const features = [
  {
    icon: Calendar,
    title: "Voucher Event",
    desc: "Validasi voucher agar setiap tamu bisa menggunakan sesi foto sesuai paket.",
  },
  {
    icon: Camera,
    title: "Booth Session",
    desc: "Alur foto lebih jelas: pilih template, capture, pilih foto, lalu final photo.",
  },
  {
    icon: Layers,
    title: "Template Frame",
    desc: "Frame event bisa disiapkan dengan layout slot foto sesuai kebutuhan acara.",
  },
  {
    icon: Grid2X2,
    title: "QR Gallery",
    desc: "Tamu bisa scan QR dan download foto langsung dari website.",
  },
  {
    icon: ShoppingCart,
    title: "Penjualan",
    desc: "Paket, voucher, dan transaksi lebih mudah dicatat.",
  },
  {
    icon: BarChart3,
    title: "Admin Dashboard",
    desc: "Kelola event, session, foto, template, voucher, dan transaksi.",
  },
];

const steps = [
  { icon: Camera, label: "Capture" },
  { icon: Image, label: "Frame" },
  { icon: QrCode, label: "QR" },
  { icon: Download, label: "Download" },
];

export default function Home() {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 80, damping: 20 });

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#EEF0FF] text-[#111827]">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,rgba(99,102,241,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <motion.div
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="fixed left-[-180px] top-[120px] -z-10 h-[620px] w-[620px] rounded-full bg-[#8B7CFF]/25 blur-[140px]"
      />

      <motion.div
        animate={{ x: [0, -40, 20, 0], y: [0, 30, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="fixed right-[-160px] top-[80px] -z-10 h-[680px] w-[680px] rounded-full bg-[#FF74BD]/25 blur-[150px]"
      />

      <motion.div
        animate={{ scale: [1, 1.12, 0.96, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="fixed left-[35%] top-[80px] -z-10 h-[520px] w-[520px] rounded-full bg-[#8ED7FF]/18 blur-[140px]"
      />

      <div className="fixed bottom-0 left-0 right-0 -z-10 h-[260px] opacity-60 bg-[repeating-linear-gradient(105deg,transparent_0px,transparent_34px,rgba(126,97,255,0.12)_35px,rgba(126,97,255,0.12)_54px,transparent_55px,transparent_78px,rgba(255,93,184,0.12)_79px,rgba(255,93,184,0.12)_96px)]" />

      <nav className="sticky top-6 z-50 mx-auto mt-6 flex h-[74px] max-w-7xl items-center justify-between rounded-[28px] border border-white/70 bg-white/70 px-5 shadow-[0_20px_70px_rgba(66,56,120,0.16)] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7B61FF] to-[#FF4FA3] text-white shadow-lg"
          >
            📸
          </motion.div>

          <div>
            <h1 className="text-lg font-black">Miori Booth</h1>
            <p className="text-xs font-semibold text-slate-400">
              Digital Photobooth
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-7 text-sm font-black text-slate-500 md:flex">
          <a href="#features">Fitur</a>
          <a href="#event">Event</a>
          <a href="#template">Template</a>
        </div>

        <button className="flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF4FA3] px-5 text-sm font-black text-white shadow-lg transition hover:scale-105">
          <LogIn size={18} />
          Login Admin
        </button>
      </nav>

      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 pb-24 pt-24 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#715DFF] shadow-sm ring-1 ring-white"
          >
            <Sparkles size={18} />
            Digital Photobooth Experience
          </motion.div>

          <h2 className="mt-8 max-w-2xl text-[64px] font-black leading-[0.92] tracking-[-0.06em] md:text-[92px]">
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="block"
            >
              Bikin momen
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="block"
            >
              lebih{" "}
              <span className="animate-pulse bg-gradient-to-r from-[#FF4FA3] via-[#9B6BFF] to-[#4F88FF] bg-clip-text text-transparent">
                manis.
              </span>
            </motion.span>
          </h2>

          <p className="mt-8 max-w-xl text-lg font-semibold leading-8 text-slate-500">
            Miori Booth membantu event berjalan lebih rapi: mulai dari sesi
            foto, template frame, QR gallery, sampai hasil foto yang bisa
            langsung dibuka oleh tamu.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <button className="group flex h-14 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF4FA3] px-7 text-base font-black text-white shadow-lg shadow-[#8B7CFF]/25 transition hover:scale-105">
              <Camera size={20} />
              Mulai Booth
              <ArrowRight
                size={18}
                className="transition group-hover:translate-x-1"
              />
            </button>

            <button className="flex h-14 items-center gap-2 rounded-2xl bg-white px-7 text-base font-black shadow-sm ring-1 ring-slate-200 transition hover:scale-105">
              <Calendar size={20} />
              Lihat Event
            </button>
          </div>

          <div className="mt-9 grid max-w-xl grid-cols-3 gap-4">
            {[
              ["1", "Event Aktif", Calendar],
              ["QR", "Gallery Sharing", Grid2X2],
              ["Fast", "Booth Flow", Zap],
            ].map(([value, label, Icon], index) => {
              const IconComponent = Icon as typeof Calendar;

              return (
                <motion.div
                  key={label as string}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.03 }}
                  className="rounded-[24px] bg-white/80 p-5 shadow-sm ring-1 ring-white"
                >
                  <IconComponent className="text-[#7B61FF]" />
                  <p className="mt-2 text-2xl font-black">{value as string}</p>
                  <p className="text-sm font-semibold text-slate-400">
                    {label as string}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 3.5, repeat: Infinity }}
            className="absolute -right-5 top-8 z-20 rounded-3xl bg-white px-6 py-4 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF4FA3] text-white">
                <CheckCircle2 size={22} />
              </div>
              <p className="font-black">Auto Gallery</p>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 14, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -bottom-6 left-0 z-20 rounded-3xl bg-white px-6 py-4 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF4FA3] text-white">
                <QrCode size={22} />
              </div>
              <p className="font-black">Scan & Download</p>
            </div>
          </motion.div>

          <div className="rounded-[42px] bg-white p-8 shadow-[0_30px_100px_rgba(66,56,120,0.22)] ring-1 ring-white">
            <div className="flex gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-500" />
            </div>

            <div className="mt-5 overflow-hidden rounded-[30px] bg-gradient-to-br from-[#1C1E4F] via-[#302273] to-[#762BEA] p-7 text-white shadow-inner">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xl font-black">Miori Booth Preview</p>
                  <p className="mt-1 text-sm font-semibold text-white/65">
                    Session ready to capture
                  </p>
                </div>

                <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#111827]">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
                  LIVE
                </div>
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-[1fr_0.55fr]">
                <div className="relative flex h-[340px] items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-[#17194A]/70">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.8, 0.45] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute h-64 w-64 rounded-full bg-[#7B61FF]/30 blur-3xl"
                  />

                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="relative flex h-48 w-48 items-center justify-center rounded-full bg-white/10"
                  >
                    <div className="flex h-36 w-36 items-center justify-center rounded-full border-[8px] border-white">
                      <motion.div
                        animate={{ scale: [1, 0.85, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="h-16 w-16 rounded-full bg-gradient-to-br from-[#7B61FF] to-[#FF4FA3]"
                      />
                    </div>
                  </motion.div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[24px] bg-white/15 p-4">
                    <p className="text-xs font-bold text-white/60">
                      Selected Frame
                    </p>
                    <motion.div
                      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="mt-3 h-24 rounded-2xl bg-[linear-gradient(120deg,#ffffff55,#ff4fa366,#7b61ff66,#ffffff55)] bg-[length:200%_200%]"
                    />
                  </div>

                  <div className="rounded-[24px] bg-white/15 p-4">
                    <p className="text-xs font-bold text-white/60">
                      QR Status
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <QrCode />
                      <p className="font-black">Ready</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-4 gap-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const active = activeStep === index;

                  return (
                    <motion.div
                      key={step.label}
                      animate={{
                        y: active ? -8 : 0,
                        scale: active ? 1.06 : 1,
                      }}
                      className={`flex h-28 flex-col items-center justify-center rounded-2xl transition ${
                        active ? "bg-white text-[#7B61FF]" : "bg-white/15"
                      }`}
                    >
                      <Icon size={30} />
                      <p className="mt-2 text-xs font-black">{step.label}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 text-sm font-black text-[#715DFF]">
          <Layers size={18} />
          Booth Management
        </div>

        <h2 className="mt-4 text-5xl font-black tracking-[-0.04em]">
          Satu sistem untuk semua
          <br />
          kebutuhan photobooth
        </h2>

        <div className="mt-14 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -10, rotate: index % 2 === 0 ? 1 : -1 }}
                className="group rounded-[32px] bg-white/80 p-8 text-left shadow-[0_20px_60px_rgba(66,56,120,0.08)] ring-1 ring-white transition hover:shadow-[0_30px_90px_rgba(66,56,120,0.16)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EEE7FF] to-[#FFE3F4] text-[#715DFF] transition group-hover:scale-110">
                  <Icon size={28} />
                </div>

                <h3 className="mt-7 text-2xl font-black">{feature.title}</h3>

                <p className="mt-4 leading-7 text-slate-500">
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section id="event" className="mx-auto max-w-7xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 text-sm font-black text-[#715DFF]">
            <Calendar size={18} />
            Active Event
          </div>

          <h2 className="mt-4 text-5xl font-black tracking-[-0.04em]">
            Event Booth Aktif
          </h2>

          <p className="mt-4 font-medium text-slate-500">
            Pilih event yang tersedia untuk membuka halaman booth atau galeri
            event.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          whileHover={{ y: -10 }}
          className="mx-auto mt-14 max-w-md rounded-[34px] bg-white/90 p-7 shadow-[0_20px_70px_rgba(66,56,120,0.12)] ring-1 ring-white"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EEE7FF] to-[#FFE3F4] text-[#715DFF]">
            <Camera size={28} />
          </div>

          <div className="mt-7 inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-black text-green-700">
            <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-500" />
            Aktif
          </div>

          <h3 className="mt-5 text-2xl font-black">WISUDA SMK HS AGUNG</h3>

          <p className="mt-2 font-semibold text-slate-400">
            AULA SEKOLAH
            <br />
            21 May 2026
          </p>

          <button className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF4FA3] text-white font-black shadow-lg shadow-[#8B7CFF]/20 transition hover:scale-105">
            <Eye size={18} />
            Lihat Event
          </button>
        </motion.div>
      </section>

      <section id="template" className="mx-auto max-w-7xl px-6 pb-28 pt-10">
        <div className="rounded-[40px] bg-white/70 p-8 shadow-[0_25px_80px_rgba(66,56,120,0.12)] ring-1 ring-white backdrop-blur">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-black text-[#715DFF]">
                <Box size={18} />
                Template Frame
              </div>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em]">
                Pilih frame sesuai mood event
              </h2>
            </div>

            <button className="h-12 rounded-2xl bg-[#111827] px-6 text-sm font-black text-white transition hover:scale-105">
              Lihat Semua Template
            </button>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {["Lavender Pop", "Blue Soft", "Pink Candy"].map((name, index) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-100"
              >
                <div
                  className={`h-56 rounded-[22px] ${
                    index === 0
                      ? "bg-gradient-to-br from-[#DCD6FF] to-[#FFE3F4]"
                      : index === 1
                      ? "bg-gradient-to-br from-[#D9EEFF] to-[#EAE7FF]"
                      : "bg-gradient-to-br from-[#FFE0F0] to-[#F3E7FF]"
                  }`}
                />
                <p className="mt-4 text-lg font-black">{name}</p>
                <p className="text-sm font-semibold text-slate-400">
                  3 Photo Layout
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}