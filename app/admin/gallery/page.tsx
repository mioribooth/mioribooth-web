"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BoothSession = {
  sessionId: string;
  framePhoto?: string;
  singlePhotos: string[];
  gif?: string;
  livePhotos: string[];
  createdAt: string;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function AdminGalleryPage() {
  const [sessions, setSessions] = useState<BoothSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const perPage = 8;

  const fetchGallery = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/gallery", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Gagal memuat gallery.");
        return;
      }

      setSessions(data.sessions || []);
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    if (search.trim()) {
      result = result.filter((session) =>
        session.sessionId.toLowerCase().includes(search.toLowerCase())
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return sort === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [sessions, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / perPage));

  const paginatedSessions = filteredSessions.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const totalFoto = sessions.reduce(
    (sum, session) => sum + (session.singlePhotos?.length || 0),
    0
  );

  const totalLive = sessions.reduce(
    (sum, session) => sum + (session.livePhotos?.length || 0),
    0
  );

  return (
    <div className="text-[#101828]">
      <div className="mb-4 overflow-hidden rounded-[30px] bg-gradient-to-br from-[#4263FF] via-[#7657FF] to-[#FF7BC3] p-5 text-white shadow-2xl">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <p className="inline-flex rounded-full bg-white/20 px-4 py-2 text-xs font-black backdrop-blur">
              Gallery Management
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">
              Miori Booth Gallery
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold text-white/80">
              Semua hasil session booth tersimpan private dan bisa dipantau dari
              dashboard admin.
            </p>
          </div>

          <button
            onClick={fetchGallery}
            className="h-11 rounded-2xl bg-white px-5 text-sm font-black text-[#4263FF]"
          >
            Refresh Gallery
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[20px] bg-white/15 p-4 backdrop-blur-xl">
            <p className="text-xs font-black text-white/60">TOTAL SESSION</p>
            <h3 className="mt-1 text-2xl font-black">{sessions.length}</h3>
          </div>

          <div className="rounded-[20px] bg-white/15 p-4 backdrop-blur-xl">
            <p className="text-xs font-black text-white/60">TOTAL FOTO</p>
            <h3 className="mt-1 text-2xl font-black">{totalFoto}</h3>
          </div>

          <div className="rounded-[20px] bg-white/15 p-4 backdrop-blur-xl">
            <p className="text-xs font-black text-white/60">LIVE PHOTOS</p>
            <h3 className="mt-1 text-2xl font-black">{totalLive}</h3>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-[26px] bg-white p-4 shadow-xl">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.04em]">
              Daftar Session
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Menampilkan {paginatedSessions.length} dari{" "}
              {filteredSessions.length} session.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari session ID..."
              className="h-11 rounded-2xl border border-slate-200 bg-[#F6F7FF] px-5 text-sm font-bold text-slate-900 outline-none focus:border-[#4263FF]"
            />

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-2xl border border-slate-200 bg-[#F6F7FF] px-5 text-sm font-black text-slate-900 outline-none focus:border-[#4263FF]"
            >
              <option value="newest">Tanggal Terbaru</option>
              <option value="oldest">Tanggal Terlama</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[24px] bg-red-50 p-4 text-center font-black text-red-500">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-[28px] bg-white p-10 text-center shadow-xl">
          <p className="text-xl font-black text-slate-500">
            Loading gallery...
          </p>
        </div>
      ) : paginatedSessions.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {paginatedSessions.map((session) => {
            const preview =
              session.framePhoto || session.singlePhotos?.[0] || "";

            return (
              <div
                key={session.sessionId}
                className="overflow-hidden rounded-[26px] bg-white shadow-xl transition hover:-translate-y-1"
              >
                <div className="h-[220px] bg-[#F6F2FF]">
                  {preview ? (
                    <img
                      src={preview}
                      alt={session.sessionId}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">
                      Tidak ada preview
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h2 className="truncate text-lg font-black">
                    {session.sessionId}
                  </h2>

                  <p className="mt-1 truncate text-xs font-semibold text-slate-400">
                    {formatDate(session.createdAt)}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#F3EEFF] px-3 py-1 text-[11px] font-black text-[#715DFF]">
                      {session.singlePhotos?.length || 0} Foto
                    </span>

                    <span className="rounded-full bg-[#FFF0F7] px-3 py-1 text-[11px] font-black text-[#FF4FA3]">
                      {session.livePhotos?.length || 0} Live
                    </span>

                    <span className="rounded-full bg-[#EEF7FF] px-3 py-1 text-[11px] font-black text-[#4F88FF]">
                      {session.gif ? "GIF Ada" : "GIF Kosong"}
                    </span>
                  </div>

                  <Link
                    href={`/download/${session.sessionId}`}
                    className="mt-4 flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#4263FF] to-[#FF7BC3] text-sm font-black text-white"
                  >
                    Buka Gallery
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[28px] bg-white p-10 text-center shadow-xl">
          <p className="text-xl font-black text-slate-500">
            Belum ada session tersimpan.
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between rounded-[24px] bg-white p-4 shadow-xl">
        <button
          disabled={page <= 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          className="rounded-2xl bg-[#F6F7FF] px-6 py-3 text-sm font-black text-[#4263FF] disabled:opacity-40"
        >
          Sebelumnya
        </button>

        <p className="font-black text-slate-500">
          Page {page} / {totalPages}
        </p>

        <button
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          className="rounded-2xl bg-[#F6F7FF] px-6 py-3 text-sm font-black text-[#4263FF] disabled:opacity-40"
        >
          Selanjutnya
        </button>
      </div>
    </div>
  );
}