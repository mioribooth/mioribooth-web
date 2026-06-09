import Link from "next/link";
import DeleteFrameButton from "./DeleteFrameButton";

type Layer = {
  id: string;
  type: "photo" | "frame";
  name?: string;
  visible?: boolean;
  locked?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  src?: string;
  photoIndex?: number;
};

type FrameItem = {
  id: string;
  name: string;
  category: string;
  layoutType: "PHOTO_STRIP" | "4R";
  backgroundColor?: string;
  thumbnail?: string;
  isActive?: boolean;
  layers?: Layer[];
};

const FRAME_WIDTH = 1200;
const FRAME_HEIGHT = 1800;

function getPhotoColor(index?: number) {
  switch (index) {
    case 1:
      return { bg: "#E8FFF0", border: "#22C55E", text: "#16A34A" };
    case 2:
      return { bg: "#FFF0F8", border: "#EC4899", text: "#DB2777" };
    case 3:
      return { bg: "#EEF4FF", border: "#3B82F6", text: "#2563EB" };
    case 4:
      return { bg: "#FFF8E8", border: "#F59E0B", text: "#D97706" };
    case 5:
      return { bg: "#F3E8FF", border: "#A855F7", text: "#9333EA" };
    case 6:
      return { bg: "#ECFEFF", border: "#06B6D4", text: "#0891B2" };
    default:
      return { bg: "#F8FAFC", border: "#94A3B8", text: "#475569" };
  }
}

async function getFrames(): Promise<FrameItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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

function SlotPreview({ frame }: { frame: FrameItem }) {
  const photoLayers = (frame.layers || [])
    .filter((layer) => layer.type === "photo")
    .sort((a, b) => (a.photoIndex || 0) - (b.photoIndex || 0));

  if (!photoLayers.length) return null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {photoLayers.map((layer, fallbackIndex) => {
        const number = layer.photoIndex || fallbackIndex + 1;
        const color = getPhotoColor(number);

        return (
          <div
            key={layer.id}
            className="absolute flex items-center justify-center rounded-xl border-2 border-dashed text-[18px] font-black shadow-sm backdrop-blur-[2px]"
            style={{
              left: `${(layer.x / FRAME_WIDTH) * 100}%`,
              top: `${(layer.y / FRAME_HEIGHT) * 100}%`,
              width: `${(layer.width / FRAME_WIDTH) * 100}%`,
              height: `${(layer.height / FRAME_HEIGHT) * 100}%`,
              backgroundColor: `${color.bg}DD`,
              borderColor: color.border,
              color: color.text,
            }}
          >
            {number}
          </div>
        );
      })}
    </div>
  );
}

export default async function AdminFramesPage() {
  const frames = await getFrames();

  return (
    <div className="text-[#101828]">
      <div className="rounded-[44px] bg-gradient-to-br from-[#4263FF] via-[#7657FF] to-[#FF7BC3] p-8 text-white shadow-2xl">
        <p className="inline-flex rounded-full bg-white/20 px-5 py-3 text-sm font-black backdrop-blur">
          MIORI FRAME SYSTEM
        </p>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl">
              Frame Editor
            </h1>

            <p className="mt-3 max-w-2xl font-semibold text-white/80">
              Kelola frame photobooth, category, template, dan layer editor
              langsung dari website.
            </p>
          </div>

          <Link
            href="/admin/frames/create"
            className="group flex h-[64px] items-center justify-center rounded-full bg-white px-8 text-lg font-black text-[#4263FF] transition hover:scale-[1.02] active:scale-[0.98] sm:h-[74px] sm:text-[22px]"
          >
            <span className="mr-2 inline-flex h-3 w-3 rounded-full bg-[#4263FF] group-hover:animate-ping" />
            + CREATE FRAME
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-[36px] bg-white p-5 shadow-xl sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-black">Frame Library</h2>

            <p className="mt-2 font-semibold text-slate-500">
              Preview sekarang menampilkan nomor slot foto agar urutan frame lebih mudah dicek.
            </p>
          </div>

          <div className="w-fit rounded-full bg-[#EEF1FF] px-5 py-3 text-sm font-black text-[#4263FF]">
            {frames.length} FRAME
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {frames.length > 0 ? (
            frames.map((frame) => {
              const photoCount = (frame.layers || []).filter(
                (layer) => layer.type === "photo"
              ).length;

              return (
                <div
                  key={frame.id}
                  className="group overflow-hidden rounded-[30px] bg-[#F6F7FF] shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className="relative aspect-[2/3] overflow-hidden bg-white"
                    style={{ backgroundColor: frame.backgroundColor || "#FFFFFF" }}
                  >
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-white to-slate-200" />

                    {frame.thumbnail ? (
                      <img
                        src={frame.thumbnail}
                        alt={frame.name}
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex h-full items-center justify-center text-sm font-black text-slate-300">
                        NO PREVIEW
                      </div>
                    )}

                    <SlotPreview frame={frame} />

                    <div className="absolute left-4 top-4 z-20 rounded-full bg-white px-4 py-2 text-sm font-black text-[#4263FF] shadow-lg">
                      {frame.layoutType === "PHOTO_STRIP" ? "2R" : "4R"}
                    </div>

                    <div
                      className={`absolute right-4 top-4 z-20 rounded-full px-4 py-2 text-sm font-black shadow-lg ${
                        frame.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {frame.isActive ? "ACTIVE" : "DRAFT"}
                    </div>

                    <div className="absolute bottom-4 left-4 z-20 rounded-full bg-slate-950/80 px-4 py-2 text-xs font-black text-white shadow-lg backdrop-blur">
                      {photoCount} SLOT FOTO
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="line-clamp-1 text-2xl font-black text-[#101828]">
                      {frame.name}
                    </h3>

                    <p className="mt-1 font-bold text-slate-400">
                      {frame.category}
                    </p>

                    <div className="mt-5 flex gap-3">
                      <Link
                        href={`/admin/frames/${frame.id}`}
                        className="flex-1 rounded-full bg-[#4263FF] py-3 text-center text-sm font-black text-white transition hover:bg-[#2F4BF0] active:scale-[0.98]"
                      >
                        EDIT
                      </Link>

                      <DeleteFrameButton frameId={frame.id} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full flex h-[320px] flex-col items-center justify-center rounded-[30px] bg-[#F6F7FF] text-center">
              <div className="mb-5 h-16 w-16 animate-pulse rounded-3xl bg-white shadow" />
              <p className="text-2xl font-black text-slate-300">BELUM ADA FRAME</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
