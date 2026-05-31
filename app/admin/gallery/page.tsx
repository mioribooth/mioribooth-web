"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";

type BoothSession = {
  sessionId: string;
  framePhoto?: string;
  singlePhotos: string[];
  gif?: string;
  livePhotos: string[];
  createdAt: string;
};

type DeleteTarget = {
  sessionId: string;
} | null;

const sortOptions = [
  {
    value: "newest",
    label: "Tanggal Terbaru",
    icon: "fa-arrow-down-wide-short",
  },
  {
    value: "oldest",
    label: "Tanggal Terlama",
    icon: "fa-arrow-up-wide-short",
  },
];

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

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function isSameDay(date: Date, now: Date) {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isThisWeek(date: Date, now: Date) {
  const start = new Date(now);
  const day = start.getDay();
  const diff = day === 0 ? 6 : day - 1;

  start.setDate(now.getDate() - diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return date >= start && date < end;
}

function isThisMonth(date: Date, now: Date) {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

export default function AdminGalleryPage() {
  const [sessions, setSessions] = useState<BoothSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sort, setSort] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const perPage = 8;

  const selectedSort =
    sortOptions.find((option) => option.value === sort) || sortOptions[0];

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

  async function confirmDeleteSession() {
    if (!deleteTarget?.sessionId) return;

    try {
      setDeleting(true);
      setDeleteError("");

      const response = await fetch(
        `/api/admin/gallery/${deleteTarget.sessionId}`,
        { method: "DELETE" }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setDeleteError(data.message || "Gagal menghapus session.");
        setDeleting(false);
        return;
      }

      setSessions((prev) =>
        prev.filter((session) => session.sessionId !== deleteTarget.sessionId)
      );

      setPage(1);

      setTimeout(() => {
        setDeleteTarget(null);
        setDeleting(false);
        setDeleteError("");
      }, 450);
    } catch {
      setDeleteError("Tidak bisa terhubung ke server.");
      setDeleting(false);
    }
  }

  useEffect(() => {
    fetchGallery();
  }, []);

  const filteredSessions = useMemo(() => {
    const now = new Date();
    let result = [...sessions];

    if (dateFilter !== "all") {
      result = result.filter((session) => {
        const date = new Date(session.createdAt);

        if (dateFilter === "today") return isSameDay(date, now);
        if (dateFilter === "week") return isThisWeek(date, now);
        if (dateFilter === "month") return isThisMonth(date, now);

        if (dateFilter === "range") {
          if (!startDate && !endDate) return true;
          if (startDate && date < startOfDay(startDate)) return false;
          if (endDate && date > endOfDay(endDate)) return false;
          return true;
        }

        return true;
      });
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return sort === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [sessions, sort, dateFilter, startDate, endDate]);

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
    <div className="relative text-[#101828]">
      <style jsx global>{`
        .miori-datepicker-popper {
          z-index: 99999 !important;
        }

        .miori-datepicker {
          border: none !important;
          border-radius: 28px !important;
          overflow: hidden !important;
          box-shadow: 0 28px 80px rgba(16, 24, 40, 0.28) !important;
          font-family: inherit !important;
          padding: 14px !important;
          background: white !important;
        }

        .miori-datepicker .react-datepicker__header {
          border: none !important;
          background: linear-gradient(135deg, #4263ff, #7657ff, #ff7bc3) !important;
          border-radius: 22px !important;
          padding-top: 18px !important;
          padding-bottom: 12px !important;
        }

        .miori-datepicker .react-datepicker__current-month {
          color: white !important;
          font-weight: 900 !important;
          font-size: 16px !important;
        }

        .miori-datepicker .react-datepicker__day-name {
          color: rgba(255, 255, 255, 0.8) !important;
          font-weight: 900 !important;
          margin-top: 10px !important;
        }

        .miori-datepicker .react-datepicker__navigation {
          top: 22px !important;
        }

        .miori-datepicker .react-datepicker__navigation-icon::before {
          border-color: white !important;
          border-width: 3px 3px 0 0 !important;
        }

        .miori-datepicker .react-datepicker__month {
          margin-top: 12px !important;
        }

        .miori-datepicker .react-datepicker__day {
          border-radius: 14px !important;
          font-weight: 800 !important;
          color: #101828 !important;
          transition: 0.18s ease !important;
        }

        .miori-datepicker .react-datepicker__day:hover {
          background: #eef1ff !important;
          color: #4263ff !important;
        }

        .miori-datepicker .react-datepicker__day--selected,
        .miori-datepicker .react-datepicker__day--keyboard-selected,
        .miori-datepicker .react-datepicker__day--in-range {
          background: linear-gradient(135deg, #4263ff, #ff7bc3) !important;
          color: white !important;
        }

        .miori-datepicker .react-datepicker__day--in-selecting-range {
          background: #eef1ff !important;
          color: #4263ff !important;
        }

        .miori-datepicker .react-datepicker__day--disabled {
          color: #cbd5e1 !important;
        }

        .miori-datepicker .react-datepicker__triangle {
          display: none !important;
        }

        .react-datepicker-wrapper {
          width: 100% !important;
        }
      `}</style>

      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#101828]/55 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[520px] overflow-hidden rounded-[34px] bg-white shadow-[0_35px_100px_rgba(16,24,40,0.35)]">
            <div className="relative bg-gradient-to-br from-[#FFF0F7] via-white to-[#EEF1FF] p-8 text-center">
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#FF7BC3]/25 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-[#4263FF]/20 blur-3xl" />

              <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-red-50 text-4xl text-red-500 shadow-xl">
                {deleting ? (
                  <div className="h-9 w-9 animate-spin rounded-full border-[5px] border-red-200 border-t-red-500" />
                ) : (
                  <i className="fa-solid fa-trash-can" />
                )}
              </div>

              <h2 className="relative mt-5 text-3xl font-black tracking-[-0.04em] text-[#101828]">
                {deleting ? "Menghapus Session..." : "Hapus Session Ini?"}
              </h2>

              <p className="relative mt-3 text-sm font-bold leading-relaxed text-slate-500">
                {deleting
                  ? "Mohon tunggu, sistem sedang menghapus data session dan file dari storage."
                  : "Data session, hasil foto, GIF, dan live photo akan dihapus permanen dari gallery."}
              </p>

              <div className="relative mt-5 rounded-2xl bg-white/80 p-4 text-left shadow-inner">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Session ID
                </p>
                <p className="mt-1 break-all text-sm font-black text-[#4263FF]">
                  {deleteTarget.sessionId}
                </p>
              </div>

              {deleteError && (
                <div className="relative mt-4 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-500">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 bg-white p-5">
              <button
                disabled={deleting}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                className="h-14 rounded-2xl bg-[#F6F7FF] text-sm font-black text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>

              <button
                disabled={deleting}
                onClick={confirmDeleteSession}
                className="h-14 rounded-2xl bg-red-500 text-sm font-black text-white shadow-xl shadow-red-500/25 transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 overflow-visible rounded-[30px] bg-gradient-to-br from-[#4263FF] via-[#7657FF] to-[#FF7BC3] p-5 text-white shadow-2xl">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
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

          <div className="relative z-[300] w-full rounded-[30px] bg-white/15 p-4 backdrop-blur-xl xl:w-[720px]">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.95fr]">
              <div className="relative">
                <i className="fa-solid fa-calendar-day absolute left-5 top-1/2 z-10 -translate-y-1/2 text-sm text-[#4263FF]" />
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => {
                    setStartDate(date);
                    setDateFilter("range");
                    setPage(1);
                  }}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="Dari tanggal"
                  dateFormat="dd MMMM yyyy"
                  calendarClassName="miori-datepicker"
                  popperClassName="miori-datepicker-popper"
                  popperPlacement="bottom-start"
                  showPopperArrow={false}
                  className="h-12 w-full rounded-2xl border border-white/20 bg-white pl-11 pr-5 text-sm font-black text-slate-900 shadow-sm outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="relative">
                <i className="fa-solid fa-calendar-check absolute left-5 top-1/2 z-10 -translate-y-1/2 text-sm text-[#FF4FA3]" />
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => {
                    setEndDate(date);
                    setDateFilter("range");
                    setPage(1);
                  }}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || undefined}
                  placeholderText="Sampai tanggal"
                  dateFormat="dd MMMM yyyy"
                  calendarClassName="miori-datepicker"
                  popperClassName="miori-datepicker-popper"
                  popperPlacement="bottom-start"
                  showPopperArrow={false}
                  className="h-12 w-full rounded-2xl border border-white/20 bg-white pl-11 pr-5 text-sm font-black text-slate-900 shadow-sm outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="relative z-50">
                <button
                  type="button"
                  onClick={() => setSortOpen((prev) => !prev)}
                  className="flex h-12 w-full items-center justify-between rounded-2xl border border-white/20 bg-white px-5 text-sm font-black text-slate-900 shadow-sm transition hover:bg-[#F6F7FF]"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#EEF1FF] text-[#4263FF]">
                      <i className={`fa-solid ${selectedSort.icon}`} />
                    </span>
                    {selectedSort.label}
                  </span>

                  <i
                    className={`fa-solid fa-chevron-down text-xs text-slate-400 transition ${
                      sortOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {sortOpen && (
                  <div className="absolute right-0 top-[56px] z-50 w-full overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 text-slate-900 shadow-2xl">
                    {sortOptions.map((option) => {
                      const active = sort === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSort(option.value);
                            setPage(1);
                            setSortOpen(false);
                          }}
                          className={`flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-black transition ${
                            active
                              ? "bg-[#EEF1FF] text-[#4263FF]"
                              : "hover:bg-[#F6F7FF]"
                          }`}
                        >
                          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#F6F7FF]">
                            <i className={`fa-solid ${option.icon}`} />
                          </span>

                          <span className="flex-1">{option.label}</span>

                          {active && (
                            <i className="fa-solid fa-check text-[#4263FF]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-2">
              {[
                ["all", "Semua"],
                ["today", "Hari Ini"],
                ["week", "Minggu Ini"],
                ["month", "Bulan Ini"],
                ["range", "Range"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => {
                    setDateFilter(value);
                    setPage(1);
                  }}
                  className={`h-10 rounded-2xl text-xs font-black transition ${
                    dateFilter === value
                      ? "bg-white text-[#4263FF]"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <button
                onClick={fetchGallery}
                className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-black text-[#4263FF] transition hover:bg-[#F6F7FF]"
              >
                <i className="fa-solid fa-rotate-right" />
                Refresh Gallery
              </button>

              <button
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                  setDateFilter("all");
                  setPage(1);
                }}
                className="h-11 rounded-2xl bg-white/15 px-5 text-sm font-black text-white transition hover:bg-white/25"
              >
                Reset
              </button>
            </div>
          </div>
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
        <div className="relative z-0 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {paginatedSessions.map((session) => {
            const preview =
              session.framePhoto || session.singlePhotos?.[0] || "";

            const isCurrentDeleting =
              deleting && deleteTarget?.sessionId === session.sessionId;

            return (
              <div
                key={session.sessionId}
                className={`overflow-hidden rounded-[26px] bg-white shadow-xl transition ${
                  isCurrentDeleting
                    ? "scale-[0.98] opacity-50"
                    : "hover:-translate-y-1"
                }`}
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

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      href={`/download/${session.sessionId}`}
                      className={`flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#4263FF] to-[#FF7BC3] text-sm font-black text-white ${
                        isCurrentDeleting ? "pointer-events-none opacity-50" : ""
                      }`}
                    >
                      Buka
                    </Link>

                    <button
                      onClick={() => {
                        setDeleteTarget({
                          sessionId: session.sessionId,
                        });
                        setDeleteError("");
                      }}
                      disabled={deleting}
                      className="flex h-10 items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-black text-red-500 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      <i className="fa-solid fa-trash-can" />
                      Hapus
                    </button>
                  </div>
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
          Page {page} / {totalPages} • {filteredSessions.length} session
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