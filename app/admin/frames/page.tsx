import Link from "next/link";
import DeleteFrameButton from "./DeleteFrameButton";

async function getFrames() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/frames`, {
      cache: "no-store",
    });

    if (!response.ok) return [];

    const result = await response.json();

    return result.frames || [];
  } catch {
    return [];
  }
}

export default async function AdminFramesPage() {
  const frames = await getFrames();

  return (
    <div className="text-[#101828]">
      <div className="rounded-[44px] bg-gradient-to-br from-[#4263FF] via-[#7657FF] to-[#FF7BC3] p-8 text-white shadow-2xl">
        <p className="inline-flex rounded-full bg-white/20 px-5 py-3 text-sm font-black backdrop-blur">
          MIORI FRAME SYSTEM
        </p>

        <div className="mt-6 flex items-center justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black tracking-[-0.05em]">
              Frame Editor
            </h1>

            <p className="mt-3 max-w-2xl font-semibold text-white/80">
              Kelola frame photobooth, category, template, dan layer editor
              langsung dari website.
            </p>
          </div>

          <Link
            href="/admin/frames/create"
            className="flex h-[74px] items-center rounded-full bg-white px-8 text-[22px] font-black text-[#4263FF]"
          >
            + CREATE FRAME
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-[36px] bg-white p-7 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black">Frame Library</h2>

            <p className="mt-2 font-semibold text-slate-500">
              Semua frame tersimpan online dan otomatis sinkron ke Electron app.
            </p>
          </div>

          <div className="rounded-full bg-[#EEF1FF] px-5 py-3 text-sm font-black text-[#4263FF]">
            {frames.length} FRAME
          </div>
        </div>

        <div className="mt-8 grid grid-cols-4 gap-6">
          {frames.length > 0 ? (
            frames.map((frame: any) => (
              <div
                key={frame.id}
                className="overflow-hidden rounded-[30px] bg-[#F6F7FF]"
              >
                <div className="relative aspect-[2/3] bg-white">
                  {frame.thumbnail ? (
                    <img
                      src={frame.thumbnail}
                      alt={frame.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      NO PREVIEW
                    </div>
                  )}

                  <div className="absolute left-4 top-4 rounded-full bg-white px-4 py-2 text-sm font-black text-[#4263FF] shadow-lg">
                    {frame.layoutType === "PHOTO_STRIP" ? "2R" : "4R"}
                  </div>

                  <div
                    className={`absolute right-4 top-4 rounded-full px-4 py-2 text-sm font-black shadow-lg ${
                      frame.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {frame.isActive ? "ACTIVE" : "DRAFT"}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-2xl font-black text-[#101828]">
                    {frame.name}
                  </h3>

                  <p className="mt-1 font-bold text-slate-400">
                    {frame.category}
                  </p>

                  <div className="mt-5 flex gap-3">
                    <Link
                      href={`/admin/frames/${frame.id}`}
                      className="flex-1 rounded-full bg-[#4263FF] py-3 text-center text-sm font-black text-white"
                    >
                      EDIT
                    </Link>

                    <DeleteFrameButton frameId={frame.id} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 flex h-[320px] items-center justify-center rounded-[30px] bg-[#F6F7FF] text-2xl font-black text-slate-300">
              BELUM ADA FRAME
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
