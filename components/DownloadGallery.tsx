"use client";

import { useState } from "react";

const FRAME_WIDTH = 1200;
const FRAME_HEIGHT = 1800;

type ViewMode = "frame" | "single" | "gif" | "live";

type Layer = {
  id: string;
  type: "photo" | "frame";
  name: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  src?: string;
};

type FrameTemplate = {
  id: string;
  name: string;
  category: string;
  backgroundColor: string;
  thumbnail?: string;
  layers: Layer[];
};

type DownloadGalleryProps = {
  framePhoto?: string;
  singlePhotos?: string[];
  gif?: string;
  livePhotos?: string[];
  frameTemplate?: FrameTemplate | null;
};

function getPhotoNumber(layerName: string) {
  const match = layerName.match(/Foto\s*(\d+)/i);
  return match ? Number(match[1]) : 1;
}

export default function DownloadGallery({
  framePhoto,
  singlePhotos = [],
  gif,
  livePhotos = [],
  frameTemplate,
}: DownloadGalleryProps) {
  const [mode, setMode] = useState<ViewMode>("frame");
  const [activeSingleIndex, setActiveSingleIndex] = useState(0);

  function renderFramePhoto() {
    return (
      <div className="overflow-hidden rounded-[34px] bg-white p-5 shadow-xl">
        {framePhoto ? (
          <>
            <img
              src={framePhoto}
              alt="Frame Photo"
              className="mx-auto max-h-[760px] rounded-[28px] object-contain"
            />

            <a
              href={framePhoto}
              download
              target="_blank"
              className="mt-5 flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#4263FF] to-[#FF7BC3] text-sm font-black text-white"
            >
              Download Frame Photo
            </a>
          </>
        ) : (
          <p className="p-10 text-center font-bold text-slate-400">
            Frame photo belum tersedia.
          </p>
        )}
      </div>
    );
  }

  function renderSinglePhotos() {
    const selectedPhoto =
      singlePhotos[activeSingleIndex] || singlePhotos[0] || "";

    return (
      <div className="space-y-5">
        <div className="overflow-hidden rounded-[34px] bg-white p-5 shadow-xl">
          {selectedPhoto ? (
            <>
              <img
                src={selectedPhoto}
                alt={`Single Photo ${activeSingleIndex + 1}`}
                className="mx-auto max-h-[640px] rounded-[28px] object-contain"
              />

              <a
                href={selectedPhoto}
                download
                target="_blank"
                className="mt-5 flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#4263FF] to-[#FF7BC3] text-sm font-black text-white"
              >
                Download Foto {activeSingleIndex + 1}
              </a>
            </>
          ) : (
            <p className="p-10 text-center font-bold text-slate-400">
              Single photo belum tersedia.
            </p>
          )}
        </div>

        {singlePhotos.length > 1 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {singlePhotos.map((photo, index) => (
              <button
                key={photo}
                onClick={() => setActiveSingleIndex(index)}
                className={`h-12 rounded-2xl text-sm font-black transition ${
                  activeSingleIndex === index
                    ? "bg-[#4263FF] text-white"
                    : "bg-white text-[#4263FF] shadow"
                }`}
              >
                Foto {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderGif() {
    return (
      <div className="overflow-hidden rounded-[34px] bg-white p-5 shadow-xl">
        {gif ? (
          <>
            <img
              src={gif}
              alt="GIF"
              className="mx-auto max-h-[560px] rounded-[28px] object-contain"
            />

            <a
              href={gif}
              download
              target="_blank"
              className="mt-5 flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#4263FF] to-[#FF7BC3] text-sm font-black text-white"
            >
              Download GIF
            </a>
          </>
        ) : (
          <p className="p-10 text-center font-bold text-slate-400">
            GIF belum tersedia.
          </p>
        )}
      </div>
    );
  }

  function renderLiveFrame() {
    if (!frameTemplate || livePhotos.length === 0) {
      return (
        <div className="rounded-[28px] bg-white p-10 text-center shadow-xl">
          <p className="font-bold text-slate-400">
            Live photo belum tersedia.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-[34px] bg-white p-5 shadow-xl">
        <div className="mx-auto aspect-[2/3] max-h-[760px] overflow-hidden rounded-[28px] bg-white">
          <div
            className="relative h-full w-full overflow-hidden"
            style={{
              backgroundColor: frameTemplate.backgroundColor || "#FFFFFF",
            }}
          >
            {frameTemplate.layers.map((layer) => {
              if (!layer.visible) return null;

              const left = `${(layer.x / FRAME_WIDTH) * 100}%`;
              const top = `${(layer.y / FRAME_HEIGHT) * 100}%`;
              const width = `${(layer.width / FRAME_WIDTH) * 100}%`;
              const height = `${(layer.height / FRAME_HEIGHT) * 100}%`;

              if (layer.type === "photo") {
                const photoNumber = getPhotoNumber(layer.name);
                const video = livePhotos[photoNumber - 1];

                return (
                  <div
                    key={layer.id}
                    className="absolute overflow-hidden bg-black"
                    style={{ left, top, width, height }}
                  >
                    {video ? (
                      <video
                        src={video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls={false}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                );
              }

              if (layer.type === "frame" && layer.src) {
                return (
                  <img
                    key={layer.id}
                    src={layer.src}
                    alt="Frame"
                    className="pointer-events-none absolute object-cover"
                    style={{ left, top, width, height }}
                  />
                );
              }

              return null;
            })}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {livePhotos.map((video, index) => (
            <a
              key={video}
              href={video}
              download
              target="_blank"
              className="flex h-12 items-center justify-center rounded-2xl bg-[#F6F7FF] text-sm font-black text-[#4263FF]"
            >
              Download Live {index + 1}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="mb-8 rounded-[32px] bg-white p-3 shadow-xl">
        <div className="grid grid-cols-4 gap-3">
          {[
            ["frame", "Frame", "fa-image"],
            ["single", "Single", "fa-images"],
            ["gif", "GIF", "fa-wand-magic-sparkles"],
            ["live", "Live", "fa-video"],
          ].map(([id, label, icon]) => {
            const active = mode === id;

            return (
              <button
                key={id}
                onClick={() => setMode(id as ViewMode)}
                className={`flex h-14 items-center justify-center gap-2 rounded-2xl text-sm font-black transition ${
                  active
                    ? "bg-gradient-to-r from-[#4263FF] to-[#FF7BC3] text-white shadow-xl"
                    : "bg-[#F6F7FF] text-slate-500 hover:bg-[#EEF1FF]"
                }`}
              >
                <i className={`fa-solid ${icon}`} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {mode === "frame" && renderFramePhoto()}
      {mode === "single" && renderSinglePhotos()}
      {mode === "gif" && renderGif()}
      {mode === "live" && renderLiveFrame()}
    </div>
  );
}