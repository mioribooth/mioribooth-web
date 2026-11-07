import { notFound } from "next/navigation";
import EventAlbum from "@/components/EventAlbum";
import { redis } from "@/lib/sessionStore";
import { normalizeEventId } from "@/lib/eventId";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EventPage({ params }: PageProps) {
  const { eventId: rawId } = await params;
  const eventId = normalizeEventId(rawId);

  if (!eventId) {
    notFound();
  }

  // Halaman tetap tampil walau acara belum punya foto (QR sudah bisa discan
  // sebelum sesi pertama selesai diunggah).
  const meta = await redis.get<{ name?: string }>(`event:${eventId}`);
  const name = meta?.name || "";

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#F6F2FF] via-white to-white">
      <div className="mx-auto w-full max-w-5xl px-4 pb-8 pt-6 sm:px-6 sm:pb-12 sm:pt-10">
        <section className="rounded-[2rem] border border-white/80 bg-white/80 px-4 py-6 text-center shadow-sm backdrop-blur sm:px-8 sm:py-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F6F2FF] shadow-sm sm:h-20 sm:w-20">
            <span className="text-3xl sm:text-4xl">📸</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            {name || "Album Foto"}
          </h1>

          <p className="mt-2 text-base font-semibold text-slate-500 sm:text-lg">
            Foto semua tamu ada di sini. Ketuk foto untuk download soft file-nya.
          </p>
        </section>

        <section className="mt-5 sm:mt-8">
          <EventAlbum eventId={eventId} />
        </section>

        <footer className="mt-10 pb-6 text-center sm:mt-16">
          <p className="text-xs font-medium text-slate-400 sm:text-sm">
            Powered by Miori Booth
          </p>
        </footer>
      </div>
    </main>
  );
}
