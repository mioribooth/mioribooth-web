"use client";

import { useCallback, useEffect, useState } from "react";

type AlbumSession = {
  sessionId: string;
  framePhoto: string;
  gif: string;
  createdAt: string;
  ready: boolean;
};

const PAGE_SIZE = 40;
const REFRESH_MS = 15000;

function mergeSessions(current: AlbumSession[], incoming: AlbumSession[]) {
  const map = new Map<string, AlbumSession>();

  for (const item of current) map.set(item.sessionId, item);
  for (const item of incoming) map.set(item.sessionId, item);

  return Array.from(map.values()).sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Untuk Cloudinary: minta versi kecil supaya grid ringan di HP tamu.
// URL selain Cloudinary dipakai apa adanya.
function thumbnail(url: string) {
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/w_600,q_auto,f_auto/");
  }

  return url;
}

export default function EventAlbum({ eventId }: { eventId: string }) {
  const [sessions, setSessions] = useState<AlbumSession[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (offset: number) => {
      const response = await fetch(
        `/api/event/${eventId}?limit=${PAGE_SIZE}&offset=${offset}`
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      return {
        total: Number(data.total) || 0,
        sessions: (data.sessions || []) as AlbumSession[],
      };
    },
    [eventId]
  );

  const refresh = useCallback(async () => {
    try {
      const page = await fetchPage(0);

      setTotal(page.total);
      setSessions((current) => mergeSessions(current, page.sessions));
      setStatus("ready");
    } catch {
      setStatus((current) => (current === "ready" ? current : "error"));
    }
  }, [fetchPage]);

  // Album memuat ulang sendiri: foto baru dari booth muncul tanpa refresh manual.
  useEffect(() => {
    refresh();

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [refresh]);

  async function loadMore() {
    setLoadingMore(true);

    try {
      const page = await fetchPage(sessions.length);

      setTotal(page.total);
      setSessions((current) => mergeSessions(current, page.sessions));
    } catch {
      // coba lagi saat tombol ditekan ulang
    } finally {
      setLoadingMore(false);
    }
  }

  if (status === "loading") {
    return (
      <p className="py-16 text-center text-base font-semibold text-slate-400">
        Memuat album...
      </p>
    );
  }

  if (status === "error") {
    return (
      <div className="py-16 text-center">
        <p className="text-base font-semibold text-slate-500">
          Album belum bisa dimuat.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("loading");
            refresh();
          }}
          className="mt-4 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (total === 0 && sessions.length === 0) {
    return (
      <div className="rounded-[2rem] border border-white/80 bg-white/80 px-6 py-16 text-center shadow-sm">
        <p className="text-lg font-bold text-slate-700">Belum ada foto</p>
        <p className="mt-2 text-sm font-medium text-slate-400">
          Foto akan muncul di sini otomatis setelah sesi foto pertama selesai
          diunggah.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-center text-sm font-semibold text-slate-400">
        {total} sesi foto
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {sessions.map((item) => {
          const time = formatTime(item.createdAt);

          return (
            <a
              key={item.sessionId}
              href={`/download/${encodeURIComponent(item.sessionId)}`}
              className="group block overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="flex aspect-[3/4] items-center justify-center bg-slate-50">
                {item.ready ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnail(item.framePhoto)}
                    alt={time ? `Foto sesi pukul ${time}` : "Foto sesi"}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="animate-pulse text-xs font-semibold text-slate-400">
                    Sedang diproses...
                  </span>
                )}
              </div>

              {time ? (
                <p className="px-3 py-2 text-center text-xs font-semibold text-slate-400">
                  {time}
                </p>
              ) : null}
            </a>
          );
        })}
      </div>

      {sessions.length < total ? (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {loadingMore ? "Memuat..." : "Muat lebih banyak"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
