"use client";

import { useEffect, useState } from "react";

type ViewMode = "frame" | "single" | "gif" | "live";

type UploadStatus = {
  frame?: boolean;
  live?: boolean;
  gif?: boolean;
  single?: boolean;
};

type DownloadGalleryProps = {
  sessionId: string;
  framePhoto?: string;
  singlePhotos?: string[];
  gif?: string;
  liveFrameVideo?: string;
  livePhotos?: string[];
  mirror?: boolean;
  uploadStatus?: UploadStatus;
};

function getFileExtension(url: string, fallback: string) {
  try {
    const cleanUrl = url.split("?")[0];
    const match = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
    return match?.[1] || fallback;
  } catch {
    return fallback;
  }
}

async function forceDownload(url: string, filename: string) {
  if (!url) return;

  try {
    const response = await fetch(url, {
      mode: "cors",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Gagal mengambil file download");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = "none";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  } catch {
    // Fallback kalau provider file tidak mengizinkan fetch/CORS.
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    anchor.style.display = "none";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
}

export default function DownloadGallery({
  sessionId,
  framePhoto: initialFramePhoto,
  singlePhotos: initialSinglePhotos = [],
  gif: initialGif,
  liveFrameVideo: initialLiveFrameVideo,
  livePhotos: initialLivePhotos = [],
  mirror: initialMirror = false,
  uploadStatus: initialUploadStatus,
}: DownloadGalleryProps) {
  const [mode, setMode] = useState<ViewMode>("frame");
  const [activeSingleIndex, setActiveSingleIndex] = useState(0);

  const [framePhoto, setFramePhoto] = useState(initialFramePhoto || "");
  const [singlePhotos, setSinglePhotos] = useState(initialSinglePhotos);
  const [gif, setGif] = useState(initialGif || "");
  const [liveFrameVideo, setLiveFrameVideo] = useState(
    initialLiveFrameVideo || ""
  );
  const [livePhotos, setLivePhotos] = useState(initialLivePhotos);
  const [mirror, setMirror] = useState(Boolean(initialMirror));
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(
    initialUploadStatus || {}
  );

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/session/${sessionId}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data?.session) return;

        setFramePhoto(data.session.framePhoto || "");
        setSinglePhotos(data.session.singlePhotos || []);
        setGif(data.session.gif || "");
        setLiveFrameVideo(data.session.liveFrameVideo || "");
        setLivePhotos(data.session.livePhotos || []);
        setMirror(Boolean(data.session.mirror));
        setUploadStatus(data.session.uploadStatus || {});
      } catch {
        // ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId]);

  function LoadingCard({ text }: { text: string }) {
    return (
      <div className="rounded-[28px] bg-white p-10 text-center shadow-xl">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#EEF1FF] border-t-[#4263FF]" />
        <p className="mt-5 font-black text-slate-500">{text}</p>
      </div>
    );
  }

  function DownloadButton({
    url,
    label,
    fallbackExtension,
  }: {
    url: string;
    label: string;
    fallbackExtension: string;
  }) {
    return (
      <button
        type="button"
        onClick={() => {
          const ext = getFileExtension(url, fallbackExtension);
          void forceDownload(url, `${sessionId}-${label}.${ext}`);
        }}
        className="mt-5 flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#4263FF] to-[#FF7BC3] text-sm font-black text-white"
      >
        Download {label}
      </button>
    );
  }

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

            <DownloadButton
              url={framePhoto}
              label="Frame-Photo"
              fallbackExtension="jpg"
            />
          </>
        ) : (
          <LoadingCard text="Frame photo sedang diproses..." />
        )}
      </div>
    );
  }

  function renderSinglePhotos() {
    const selectedPhoto =
      singlePhotos[activeSingleIndex] || singlePhotos[0] || "";

    if (!selectedPhoto) {
      return <LoadingCard text="Single photo sedang diproses..." />;
    }

    return (
      <div className="space-y-5">
        <div className="overflow-hidden rounded-[34px] bg-white p-5 shadow-xl">
          <img
            src={selectedPhoto}
            alt={`Single Photo ${activeSingleIndex + 1}`}
            className="mx-auto max-h-[640px] rounded-[28px] object-contain"
            style={{
              transform: mirror ? "scaleX(-1)" : "scaleX(1)",
            }}
          />

          <DownloadButton
            url={selectedPhoto}
            label={`Foto-${activeSingleIndex + 1}`}
            fallbackExtension="jpg"
          />
        </div>

        {singlePhotos.length > 1 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {singlePhotos.map((photo, index) => (
              <button
                key={`${photo}-${index}`}
                type="button"
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
    if (!gif) {
      return <LoadingCard text="GIF sedang diproses..." />;
    }

    return (
      <div className="overflow-hidden rounded-[34px] bg-white p-5 shadow-xl">
        <img
          src={gif}
          alt="GIF"
          className="mx-auto max-h-[560px] rounded-[28px] object-contain"
          style={{
            transform: mirror ? "scaleX(-1)" : "scaleX(1)",
          }}
        />

        <DownloadButton url={gif} label="GIF" fallbackExtension="gif" />
      </div>
    );
  }

  function renderLive() {
    if (liveFrameVideo) {
      return (
        <div className="overflow-hidden rounded-[34px] bg-white p-5 shadow-xl">
          <video
            src={liveFrameVideo}
            controls
            playsInline
            className="mx-auto aspect-[2/3] max-h-[760px] rounded-[28px] bg-black object-contain"
          />

          <DownloadButton
            url={liveFrameVideo}
            label="Live-Photo"
            fallbackExtension="mp4"
          />
        </div>
      );
    }

    if (livePhotos.length > 0) {
      return (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {livePhotos.map((video, index) => (
            <div
              key={`${video}-${index}`}
              className="overflow-hidden rounded-[28px] bg-white p-3 shadow-xl"
            >
              <video
                src={video}
                controls
                playsInline
                className="h-[280px] w-full rounded-[22px] bg-black object-cover"
              />

              <button
                type="button"
                onClick={() => {
                  const ext = getFileExtension(video, "mp4");
                  void forceDownload(video, `${sessionId}-Live-${index + 1}.${ext}`);
                }}
                className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl bg-[#F6F7FF] text-sm font-black text-[#4263FF]"
              >
                Download Live {index + 1}
              </button>
            </div>
          ))}
        </div>
      );
    }

    return <LoadingCard text="Live Photo MP4 sedang diproses..." />;
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
                type="button"
                onClick={() => setMode(id as ViewMode)}
                className={`relative flex h-14 items-center justify-center gap-2 rounded-2xl text-sm font-black transition ${
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
      {mode === "live" && renderLive()}
    </div>
  );
}
