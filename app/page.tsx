"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Calendar,
  Grid2X2,
  Layers,
  ShoppingCart,
  BarChart3,
  Eye,
  LogIn,
  QrCode,
  Sparkles,
  Download,
  Box,
  ArrowRight,
  ArrowUpRight,
  HelpCircle,
  MessageCircle,
  Star,
} from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Lenis from "lenis";

const features = [
  {
    icon: Calendar,
    title: "Voucher event",
    desc: "Validasi voucher agar setiap tamu bisa menggunakan sesi foto sesuai paket.",
  },
  {
    icon: Camera,
    title: "Booth session",
    desc: "Alur foto lebih jelas: pilih template, capture, pilih foto, lalu final photo.",
  },
  {
    icon: Layers,
    title: "Template frame",
    desc: "Frame event bisa disiapkan dengan layout slot foto sesuai kebutuhan acara.",
  },
  {
    icon: Grid2X2,
    title: "QR gallery",
    desc: "Tamu bisa scan QR dan download foto langsung dari website.",
  },
  {
    icon: ShoppingCart,
    title: "Penjualan",
    desc: "Paket, voucher, dan transaksi lebih mudah dicatat.",
  },
  {
    icon: BarChart3,
    title: "Admin dashboard",
    desc: "Kelola event, session, foto, template, voucher, dan transaksi.",
  },
];

const portfolio = [
  { name: "Wisuda SMK HS Agung", type: "Wisuda", tag: "4R" },
  { name: "Ulang Tahun Nayla", type: "Birthday", tag: "2R" },
  { name: "Gathering PT Sinar Jaya", type: "Corporate", tag: "4R" },
  { name: "Reuni Angkatan 2015", type: "Reuni", tag: "2R" },
  { name: "Pernikahan Dinda & Reza", type: "Wedding", tag: "Polaroid" },
  { name: "Festival Kampus", type: "Festival", tag: "2R" },
];

const testimonials = [
  {
    quote:
      "Antrian foto jadi lebih rapi, tamu tinggal scan QR buat ambil hasilnya. Nggak ada lagi drama nunggu file dikirim manual.",
    name: "Panitia Wisuda SMK HS Agung",
    role: "Wisuda",
  },
  {
    quote:
      "Dashboard admin-nya memudahkan kami pantau transaksi dan voucher tiap event tanpa ribet rekap manual lagi.",
    name: "Tim EO Sinar Jaya",
    role: "Corporate Event",
  },
  {
    quote:
      "Template frame-nya bisa disesuaikan tema acara kami, hasilnya jauh lebih personal dibanding photobooth biasa.",
    name: "Dinda & Reza",
    role: "Wedding",
  },
];

const faqs = [
  {
    q: "Miori Booth ini produk apa?",
    a: "Sistem digital photobooth lengkap: mulai dari voucher event, sesi foto, template frame, galeri QR untuk tamu, sampai dashboard admin buat kelola semuanya.",
  },
  {
    q: "Apakah bisa dipakai untuk berbagai jenis acara?",
    a: "Bisa. Sudah dipakai untuk wisuda, ulang tahun, gathering korporat, reuni, sampai pernikahan.",
  },
  {
    q: "Bagaimana tamu mendapatkan hasil fotonya?",
    a: "Tamu tinggal scan QR code yang muncul setelah sesi foto selesai, lalu foto bisa langsung diunduh ke HP mereka.",
  },
  {
    q: "Apakah template frame bisa disesuaikan tema acara?",
    a: "Ya, frame bisa disiapkan dengan layout dan slot foto yang menyesuaikan kebutuhan dan tema acaramu.",
  },
];

export default function Home() {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 80, damping: 20 });
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#1A1A18]">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-[#FAF8F4]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1A18] text-[#FAF8F4]">
              <Camera size={18} />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">Miori Booth</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-black/40">
                Digital Photobooth
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-9 text-sm text-black/60 md:flex">
            <a href="#portfolio" className="transition hover:text-black">Portofolio</a>
            <a href="#features" className="transition hover:text-black">Fitur</a>
            <a href="#testimoni" className="transition hover:text-black">Testimoni</a>
            <a href="#faq" className="transition hover:text-black">FAQ</a>
          </div>

          <Link href="/admin/login" className="flex h-11 items-center gap-2 rounded-full border border-black/10 px-5 text-sm font-medium transition hover:border-black/30">
            <LogIn size={16} />
            Login admin
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#15140F] text-[#FAF8F4]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle,#fff_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 py-28 lg:grid-cols-[1.1fr_0.9fr] lg:py-36">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/60">
              <Sparkles size={14} />
              Sistem photobooth
            </div>

            <h1 className="mt-8 max-w-xl font-serif text-[52px] font-normal leading-[1.05] tracking-tight md:text-[68px]">
              Momen yang layak
              <br />
              <span className="italic text-white/70">diabadikan dengan baik.</span>
            </h1>

            <p className="mt-7 max-w-md text-[17px] leading-7 text-white/55">
              Miori Booth menyatukan voucher, sesi foto, template frame, galeri
              QR, hingga laporan penjualan dalam satu sistem — supaya kamu
              fokus pada acaranya, bukan administrasinya.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <a href="#portfolio" className="flex h-13 items-center gap-2 rounded-full bg-[#FAF8F4] px-7 py-4 text-sm font-medium text-[#15140F] transition hover:opacity-90">
                Lihat portofolio
                <ArrowUpRight size={16} />
              </a>
              <a href="#event" className="flex h-13 items-center gap-2 px-2 py-4 text-sm font-medium text-white/70 underline-offset-4 transition hover:text-white hover:underline">
                Lihat event aktif
              </a>
            </div>

            <div className="mt-16 flex items-center gap-8 border-t border-white/10 pt-8">
              <div>
                <p className="font-serif text-3xl">50+</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-white/40">Acara terlayani</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="font-serif text-3xl">4.9<span className="text-white/40">/5</span></p>
                <p className="mt-1 text-xs uppercase tracking-wide text-white/40">Rating klien</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="font-serif text-3xl">±10s</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-white/40">Waktu cetak</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative rounded-[28px] border border-white/10 bg-white/[0.03] p-3 backdrop-blur"
          >
            <div className="overflow-hidden rounded-[20px] bg-gradient-to-b from-white/10 to-transparent p-5">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Session preview</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live
                </span>
              </div>

              <div className="mt-4 aspect-[4/5] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent" />

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-white/50">
                <div className="rounded-xl border border-white/10 py-2.5">Capture</div>
                <div className="rounded-xl border border-white/10 py-2.5">Frame</div>
                <div className="rounded-xl border border-white/10 py-2.5">QR</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-28">
        <div className="max-w-lg">
          <p className="text-xs uppercase tracking-[0.2em] text-black/40">Booth management</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight md:text-5xl">
            Satu sistem untuk semua kebutuhan photobooth
          </h2>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="bg-[#FAF8F4] p-8 transition hover:bg-white">
                <Icon size={22} className="text-black/40" />
                <h3 className="mt-6 text-lg font-medium">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-black/50">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* PORTFOLIO */}
      <section id="portfolio" className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-lg">
            <p className="text-xs uppercase tracking-[0.2em] text-black/40">Portofolio</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight md:text-5xl">
              Acara yang sudah pakai Miori Booth
            </h2>
          </div>
          <p className="max-w-xs text-sm text-black/50">
            Dari wisuda, ulang tahun, sampai acara korporat — setiap sesi tercatat rapi.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {portfolio.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="group overflow-hidden rounded-2xl border border-black/10 bg-white"
            >
              <div className="aspect-[4/5] bg-gradient-to-br from-black/[0.04] to-black/[0.08] transition duration-500 group-hover:scale-[1.02]" />
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-0.5 text-xs text-black/40">{item.type} · {item.tag}</p>
                </div>
                <ArrowUpRight size={16} className="text-black/30 transition group-hover:text-black" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* EVENT AKTIF */}
      <section id="event" className="mx-auto max-w-7xl px-6 py-28">
        <div className="grid gap-10 rounded-[32px] border border-black/10 bg-white p-10 md:grid-cols-[0.9fr_1.1fr] md:p-14">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-black/40">Event aktif</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight">
              WISUDA SMK HS AGUNG
            </h2>
            <p className="mt-4 text-sm leading-6 text-black/50">
              AULA SEKOLAH<br />21 Mei 2026
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Sesi berlangsung
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-black/10 p-4">
                <p className="text-xs text-black/40">Template</p>
                <p className="mt-1 font-medium">Lavender Pop</p>
              </div>
              <div className="rounded-xl border border-black/10 p-4">
                <p className="text-xs text-black/40">Format</p>
                <p className="mt-1 font-medium">4R · Landscape</p>
              </div>
            </div>
            <button className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#1A1A18] py-4 text-sm font-medium text-[#FAF8F4] transition hover:opacity-90">
              <Eye size={16} />
              Lihat event
            </button>
          </div>
        </div>
      </section>

      {/* TESTIMONI */}
      <section id="testimoni" className="bg-[#15140F] py-28 text-[#FAF8F4]">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Testimoni</p>
          <h2 className="mt-4 max-w-lg font-serif text-4xl leading-tight tracking-tight md:text-5xl">
            Kata mereka yang sudah pakai
          </h2>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="border-t border-white/15 pt-6">
                <div className="flex gap-1 text-amber-300">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <p className="mt-5 font-serif text-lg leading-8 text-white/80">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="mt-6 text-sm font-medium">{t.name}</p>
                <p className="text-xs text-white/40">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-28">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-black/40">Pertanyaan</p>
          <h2 className="mt-4 font-serif text-4xl tracking-tight">Yang sering ditanya</h2>
        </div>

        <div className="mt-14 divide-y divide-black/10 border-t border-b border-black/10">
          {faqs.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="flex w-full items-center justify-between py-6 text-left"
                >
                  <span className="font-medium">{item.q}</span>
                  <span className={`ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/15 text-sm transition ${isOpen ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="pb-6 text-sm leading-7 text-black/55">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA PENUTUP */}
      <section className="mx-auto max-w-7xl px-6 pb-28">
        <div className="rounded-[32px] bg-[#1A1A18] px-10 py-20 text-center text-[#FAF8F4] md:px-20">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/50">
            <MessageCircle size={14} />
            Siap mulai
          </div>

          <h2 className="mx-auto mt-8 max-w-xl font-serif text-4xl leading-tight tracking-tight md:text-5xl">
            Bikin acaramu berkesan dengan Miori Booth
          </h2>

          <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-white/50">
            Kelola event, template, dan galeri foto dalam satu sistem yang
            simpel buat kamu dan tak terlupakan buat tamu.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
            <a href="#event" className="flex h-13 items-center gap-2 rounded-full bg-[#FAF8F4] px-7 py-4 text-sm font-medium text-[#15140F] transition hover:opacity-90">
              Lihat event aktif
              <ArrowRight size={16} />
            </a>
            <Link href="/admin/login" className="flex h-13 items-center gap-2 rounded-full border border-white/20 px-7 py-4 text-sm font-medium text-white transition hover:border-white/40">
              <LogIn size={16} />
              Login admin
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}