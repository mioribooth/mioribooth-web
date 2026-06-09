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

function getMirroredCloudinaryUrl(url: string) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  if (url.includes("/upload/a_hflip/")) {
    return url;
  }

  return url.replace("/upload/", "/upload/a_hflip/");
}

function getMirrorableUrl(url: string, shouldMirror: boolean) {
  if (!url || !shouldMirror) return url;
  return getMirroredCloudinaryUrl(url);
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
  const [downloadingAllSingles, setDownloadingAllSingles] = useState(false);

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

  useEffect(() => {
    if (activeSingleIndex > singlePhotos.length - 1) {
      setActiveSingleIndex(0);
    }
  }, [activeSingleIndex, singlePhotos.length]);

  async function downloadAllSingles() {
    if (!singlePhotos.length || downloadingAllSingles) return;

    setDownloadingAllSingles(true);

    try {
      for (let index = 0; index < singlePhotos.length; index += 1) {
        const originalUrl = singlePhotos[index];
        const downloadUrl = getMirrorableUrl(originalUrl, mirror);
        const ext = getFileExtension(downloadUrl, "jpg");

        await forceDownload(
          downloadUrl,
          `${sessionId}-Single-${index + 1}.${ext}`
        );

        await new Promise((resolve) => window.setTimeout(resolve, 450));
      }
    } finally {
      setDownloadingAllSingles(false);
    }
  }

  function LoadingCard({ text }: { text: string }) {
    return (
      <div className="rounded-[28px] bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#EEF1FF] border-t-[#4263FF]" />
        <p className="mt-5 text-sm font-black text-slate-500 sm:text-base">
          {text}
        </p>
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
        className="mt-5 flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#4263FF] to-[#FF7BC3] px-4 text-sm font-black text-white shadow-lg shadow-blue-200/40 active:scale-[0.99]"
      >
        Download {label}
      </button>
    );
  }

  function renderFramePhoto() {
    return (
      <div className="overflow-hidden rounded-[28px] bg-white p-4 shadow-xl sm:rounded-[34px] sm:p-5">
        {framePhoto ? (
          <>
            <img
              src={framePhoto}
              alt="Frame Photo"
              className="mx-auto max-h-[72vh] w-full rounded-[24px] object-contain sm:max-h-[760px] sm:rounded-[28px]"
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
    const selectedPhotoUrl = getMirrorableUrl(selectedPhoto, mirror);

    if (!selectedPhoto) {
      return <LoadingCard text="Single photo sedang diproses..." />;
    }

    return (
      <div className="space-y-5">
        <div className="overflow-hidden rounded-[28px] bg-white p-4 shadow-xl sm:rounded-[34px] sm:p-5">
          <img
            src={selectedPhotoUrl}
            alt={`Single Photo ${activeSingleIndex + 1}`}
            className="mx-auto max-h-[68vh] w-full rounded-[24px] object-contain sm:max-h-[640px] sm:rounded-[28px]"
          />

          <DownloadButton
            url={selectedPhotoUrl}
            label={`Single-${activeSingleIndex + 1}`}
            fallbackExtension="jpg"
          />

          {singlePhotos.length > 1 && (
            <button
              type="button"
              onClick={() => void downloadAllSingles()}
              disabled={downloadingAllSingles}
              className="mt-3 flex h-13 min-h-13 w-full items-center justify-center rounded-2xl bg-[#F6F7FF] px-4 text-sm font-black text-[#4263FF] shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloadingAllSingles
                ? "Mengunduh singles..."
                : `Download Semua Singles (${singlePhotos.length})`}
            </button>
          )}
        </div>

        {singlePhotos.length > 1 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {singlePhotos.map((photo, index) => (
              <button
                key={`${photo}-${index}`}
                type="button"
                onClick={() => setActiveSingleIndex(index)}
                className={`h-11 rounded-2xl text-xs font-black transition sm:h-12 sm:text-sm ${
                  activeSingleIndex === index
                    ? "bg-[#4263FF] text-white shadow"
                    : "bg-white text-[#4263FF] shadow-sm"
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
    const gifUrl = getMirrorableUrl(gif, mirror);

    if (!gif) {
      return <LoadingCard text="GIF sedang diproses..." />;
    }

    return (
      <div className="overflow-hidden rounded-[28px] bg-white p-4 shadow-xl sm:rounded-[34px] sm:p-5">
        <img
          src={gifUrl}
          alt="GIF"
          className="mx-auto max-h-[68vh] w-full rounded-[24px] object-contain sm:max-h-[560px] sm:rounded-[28px]"
        />

        <DownloadButton url={gifUrl} label="GIF" fallbackExtension="gif" />
      </div>
    );
  }

  function renderLive() {
    if (liveFrameVideo) {
      return (
        <div className="overflow-hidden rounded-[28px] bg-white p-4 shadow-xl sm:rounded-[34px] sm:p-5">
          <video
            src={liveFrameVideo}
            controls
            playsInline
            className="mx-auto aspect-[2/3] max-h-[72vh] w-full rounded-[24px] bg-black object-contain sm:max-h-[760px] sm:rounded-[28px]"
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
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
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
                  void forceDownload(
                    video,
                    `${sessionId}-Live-${index + 1}.${ext}`
                  );
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
    <div className="mt-5 sm:mt-8">
      <div className="mb-5 rounded-[24px] bg-white p-2 shadow-xl sm:mb-8 sm:rounded-[32px] sm:p-3">
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
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
                className={`relative flex h-12 items-center justify-center gap-1 rounded-2xl text-xs font-black transition sm:h-14 sm:gap-2 sm:text-sm ${
                  active
                    ? "bg-gradient-to-r from-[#4263FF] to-[#FF7BC3] text-white shadow-xl"
                    : "bg-[#F6F7FF] text-slate-500 hover:bg-[#EEF1FF]"
                }`}
              >
                <i className={`fa-solid ${icon}`} />
                <span className="hidden xs:inline sm:inline">{label}</span>
                <span className="inline xs:hidden sm:hidden">{label}</span>
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
