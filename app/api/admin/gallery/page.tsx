import Link from "next/link";

type PageProps = {
  searchParams: Promise<{
    key?: string;
  }>;
};

type BoothSession = {
  sessionId: string;
  framePhoto?: string;
  singlePhotos: string[];
  gif?: string;
  livePhotos: string[];
  createdAt: string;
};

async function getPrivateGallery(key?: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://mioribooth-web.vercel.app";

  const response = await fetch(
    `${baseUrl}/api/admin/gallery?key=${key || ""}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

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

export default async function AdminGalleryPage({
  searchParams,
}: PageProps) {
  const { key } = await searchParams;

  const data = await getPrivateGallery(key);

  if (!data) {
    return (
      <main className="min-h-screen bg-[#EEF0FF] flex items-center justify-center px-6">
        <div className="max-w-md rounded-[32px] bg-white p-8 text-center shadow-xl">
          <h1 className="text-3xl font-black text-slate-900">
            Unauthorized
          </h1>
          <p className="mt-3 text-slate-500 font-semibold">
            Halaman ini private. Masukkan key admin yang benar.
          </p>
        </div>
      </main>
    );
  }

  const sessions: BoothSession[] = data.sessions || [];

  return (
    <main className="min-h-screen bg-[#EEF0FF] text-slate-900">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,rgba(99,102,241,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[36px] bg-white/80 p-8 shadow-xl backdrop-blur">
          <p className="text-sm font-black text-[#715DFF]">
            PRIVATE ADMIN
          </p>

          <h1 className="mt-2 text-5xl font-black tracking-[-0.04em]">
            Miori Booth Gallery
          </h1>

          <p className="mt-3 text-slate-500 font-semibold">
            Semua session booth harian tersimpan private di sini.
          </p>

          <div className="mt-6 inline-flex rounded-full bg-[#F3EEFF] px-5 py-3 text-[#715DFF] font-black">
            Total Session: {sessions.length}
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => {
            const preview =
              session.framePhoto ||
              session.singlePhotos?.[0] ||
              "";

            return (
              <div
                key={session.sessionId}
                className="overflow-hidden rounded-[34px] bg-white shadow-[0_20px_70px_rgba(66,56,120,0.12)]"
              >
                <div className="h-[360px] bg-[#F6F2FF]">
                  {preview ? (
                    <img
                      src={preview}
                      alt={session.sessionId}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400 font-bold">
                      Tidak ada preview
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h2 className="text-xl font-black">
                    {session.sessionId}
                  </h2>

                  <p className="mt-2 text-sm font-semibold text-slate-400">
                    {formatDate(session.createdAt)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#F3EEFF] px-3 py-1 text-xs font-black text-[#715DFF]">
                      {session.singlePhotos?.length || 0} Foto
                    </span>

                    <span className="rounded-full bg-[#FFF0F7] px-3 py-1 text-xs font-black text-[#FF4FA3]">
                      {session.livePhotos?.length || 0} Live
                    </span>

                    <span className="rounded-full bg-[#EEF7FF] px-3 py-1 text-xs font-black text-[#4F88FF]">
                      {session.gif ? "GIF Ada" : "GIF Kosong"}
                    </span>
                  </div>

                  <Link
                    href={`/download/${session.sessionId}`}
                    className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF4FA3] text-white font-black"
                  >
                    Buka Gallery
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {sessions.length === 0 && (
          <div className="mt-10 rounded-[32px] bg-white p-10 text-center shadow-xl">
            <p className="text-xl font-black text-slate-500">
              Belum ada session tersimpan.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}