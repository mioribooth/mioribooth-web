"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  ["📊", "Dashboard", "/admin/dashboard"],
  ["💳", "Transaction", "/admin/transaction"],
  ["🎟️", "Banner Promo", "/admin/banner-promo"],
  ["🧾", "Invoice", "/admin/invoice"],
  ["⭐", "Subscription", "/admin/subscription"],
  ["👥", "User Management", "/admin/users"],
  ["📦", "Harga Bundle", "/admin/bundles"],
  ["🖼️", "Template", "/admin/template"],
  ["🌄", "Gallery", "/admin/gallery"],
  ["📈", "Report Analytic", "/admin/report"],
  ["⬇️", "Download Aplikasi", "/admin/download"],
  ["📘", "Tutorial Instalasi", "/admin/tutorial"],
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login" || pathname === "/admin/logout") {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#F6F7FF] text-[#101828]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[290px] shrink-0 p-5 lg:block">
          <div className="h-full rounded-[36px] bg-gradient-to-br from-[#4263FF] via-[#7657FF] to-[#FF7BC3] p-6 text-white shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-3xl bg-white/20 text-2xl backdrop-blur">
                📸
              </div>
              <div>
                <h1 className="text-2xl font-black">MIORI</h1>
                <p className="text-xs font-bold text-white/70">
                  Photobooth Admin
                </p>
              </div>
            </div>

            <nav className="mt-10 space-y-2">
              {menu.map(([icon, label, href]) => {
                const active = pathname === href;

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-black transition ${
                      active
                        ? "bg-white text-[#4263FF] shadow-xl"
                        : "text-white/75 hover:bg-white/15 hover:text-white"
                    }`}
                  >
                    <span>{icon}</span>
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <section className="flex-1 p-5">
          <header className="mb-6 flex items-center justify-between rounded-[32px] border border-white/70 bg-white/70 px-6 py-4 shadow-xl backdrop-blur-xl">
            <div>
              <p className="text-sm font-black text-[#4263FF]">
                ✨ Application › Admin
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                {pathname.includes("vouchers")
                  ? "Voucher Management"
                  : pathname.includes("users")
                  ? "User Management"
                  : "Dashboard"}
              </h2>
            </div>

            <div className="group relative">
              <button className="flex items-center gap-3 rounded-full bg-white px-4 py-3 shadow-xl">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#4263FF] to-[#FF7BC3] text-sm font-black text-white">
                  RA
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-black">Rama</p>
                  <p className="text-xs font-bold text-slate-400">OWNER</p>
                </div>
                <span className="text-sm font-black text-slate-400">⌄</span>
              </button>

              <div className="invisible absolute right-0 top-[58px] z-50 w-56 translate-y-2 rounded-3xl border border-slate-100 bg-white p-3 opacity-0 shadow-2xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="rounded-2xl bg-[#F6F7FF] p-4">
                  <p className="font-black">Rama</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    mioribooth@gmail.com
                  </p>
                </div>

                <a
                  href="/admin/logout"
                  className="mt-3 block rounded-2xl px-4 py-3 text-sm font-black text-red-500 hover:bg-red-50"
                >
                  Logout
                </a>
              </div>
            </div>
          </header>

          {children}
        </section>
      </div>
    </main>
  );
}