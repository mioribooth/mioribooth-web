"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function ProtectAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecking(false);
      return;
    }

    const isLogin = localStorage.getItem("miori_admin_login");

    if (isLogin !== "true") {
      router.replace("/admin/login");
      return;
    }

    setChecking(false);
  }, [pathname, router]);

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F6F7FF]">
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
          <p className="text-2xl font-black text-slate-900">Loading...</p>
          <p className="mt-2 font-semibold text-slate-400">
            Mengecek akses admin.
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}