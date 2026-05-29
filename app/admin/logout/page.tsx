"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem("miori_admin_login");
    localStorage.removeItem("miori_admin_name");
    localStorage.removeItem("miori_admin_role");

    router.replace("/admin/login");
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#F6F7FF]">
      <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
        <p className="text-2xl font-black text-slate-900">Logout...</p>
        <p className="mt-2 font-semibold text-slate-400">
          Mengalihkan ke halaman login.
        </p>
      </div>
    </main>
  );
}