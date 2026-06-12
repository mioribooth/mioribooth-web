"use client";

import { useEffect, useMemo, useState } from "react";

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
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  if (url.includes("/upload/a_hflip/")) {
    return url;
  }

  return url.replace("/upload/", "/upload/a_hflip/");
}

function getMirrorSafeUrl(url: string, mirror: boolean) {
  if (!mirror) return url;
  return getMirroredCloudinaryUrl(url);
}

async function mirrorImageBlob(url: string) {
  const response = await fetch(url, {
    mode: "cors",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil file mirror");
  }

  const blob = await response.blob();
  const imageUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Gagal membaca gambar mirror"));
      img.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas tidak tersedia");

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (mirroredBlob) => {
          if (mirroredBlob) resolve(mirroredBlob);
          else reject(new Error("Gagal membuat file mirror"));
        },
        blob.type || "image/jpeg",
        0.95
      );
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

async function forceDownload(url: string, filename: string, mirror = false) {
  if (!url) return;

  try {
    const finalUrl = getMirrorSafeUrl(url, mirror);
    let blob: Blob;

    if (mirror && finalUrl === url && !url.toLowerCase().includes(".gif")) {
      blob = await mirrorImageBlob(url);
    } else {
      const response = await fetch(finalUrl, {
        mode: "cors",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil file download");
      }

      blob = await response.blob();
    }

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
    anchor.href = getMirrorSafeUrl(url, mirror);
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

  const mirroredFramePhoto = useMemo(
    () => getMirrorSafeUrl(framePhoto, mirror),
    [framePhoto, mirror]
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
      <div className="rounded-[28px] bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#F6F7FF]">
          <div className="h-11 w-11 animate-spin rounded-full border-4 border-[#EEF1FF] border-t-[#4263FF]" />
        </div>
        <p className="mt-5 text-sm font-black text-slate-500 sm:text-base">
          {text}
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-400">
          Jangan tutup halaman ini dulu ya.
        </p>
      </div>
    );
  }

  function DownloadButton({
    url,
    label,
    fallbackExtension,
    shouldMirror = false,
  }: {
    url: string;
    label: string;
    fallbackExtension: string;
    shouldMirror?: boolean;
  }) {
    return (
      <button
        type="button"
        onClick={() => {
          const ext = getFileExtension(url, fallbackExtension);
          void forceDownload(url, `${sessionId}-${label}.${ext}`, shouldMirror);
        }}
        className="mt-5 flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#4263FF] to-[#FF7BC3] px-4 text-sm font-black text-white shadow-lg transition active:scale-[0.98]"
      >
        Download {label}
      </button>
    );
  }

  function renderFramePhoto() {
    return (
      <div className="overflow-hidden rounded-[28px] bg-white p-3 shadow-xl sm:rounded-[34px] sm:p-5">
        {framePhoto ? (
          <>
            <img
              src={framePhoto}
              alt="Frame Photo"
              className="mx-auto max-h-[76vh] w-full rounded-[22px] object-contain sm:max-h-[760px] sm:rounded-[28px]"

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
    const selectedOriginalPhoto =
      singlePhotos[activeSingleIndex] || singlePhotos[0] || "";

    if (!selectedOriginalPhoto) {
      return <LoadingCard text="Single photo sedang diproses..." />;
    }

    async function downloadAllSingles() {
      for (let index = 0; index < singlePhotos.length; index += 1) {
        const photo = singlePhotos[index];
        const ext = getFileExtension(photo, "jpg");
        await forceDownload(photo, `${sessionId}-Foto-${index + 1}.${ext}`, mirror);
        await new Promise((resolve) => window.setTimeout(resolve, 450));
      }
    }

    return (
      <div className="space-y-5">
        <div className="overflow-hidden rounded-[28px] bg-white p-3 shadow-xl sm:rounded-[34px] sm:p-5">
          <img
            src={selectedOriginalPhoto}
            alt={`Single Photo ${activeSingleIndex + 1}`}
            className="mx-auto max-h-[68vh] w-full rounded-[22px] object-contain sm:max-h-[640px] sm:rounded-[28px]"
            style={{
              transform: "scaleX(-1)",
            }}
          />

          <DownloadButton
            url={selectedOriginalPhoto}
            label={`Foto-${activeSingleIndex + 1}`}
            fallbackExtension="jpg"
            shouldMirror={mirror}
          />

          {singlePhotos.length > 1 && (
            <button
              type="button"
              onClick={() => void downloadAllSingles()}
              className="mt-3 flex h-14 w-full items-center justify-center rounded-2xl bg-[#F6F7FF] px-4 text-sm font-black text-[#4263FF] transition active:scale-[0.98]"
            >
              Download Semua Singles
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
                className={`h-12 rounded-2xl text-xs font-black transition sm:text-sm ${
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
      <div className="overflow-hidden rounded-[28px] bg-white p-3 shadow-xl sm:rounded-[34px] sm:p-5">
        <img
          src={gif}
          alt="GIF"
          className="mx-auto max-h-[68vh] w-full rounded-[22px] object-contain sm:max-h-[560px] sm:rounded-[28px]"
          style={{
            transform: mirror ? "scaleX(-1)" : "scaleX(1)",
          }}
        />

        <DownloadButton
          url={gif}
          label="GIF"
          fallbackExtension="gif"
          shouldMirror={mirror}
        />
      </div>
    );
  }

  function renderLive() {
    const finalLiveVideo =
      liveFrameVideo && liveFrameVideo.trim() !== "" ? liveFrameVideo : "";

    if (finalLiveVideo) {
      return (
        <div className="overflow-hidden rounded-[28px] bg-white p-3 shadow-xl sm:rounded-[34px] sm:p-5">
          <video
            src={finalLiveVideo}
            controls
            playsInline
            className="mx-auto aspect-[2/3] max-h-[76vh] w-full rounded-[22px] bg-black object-contain sm:max-h-[760px] sm:rounded-[28px]"
          />

          <DownloadButton
            url={finalLiveVideo}
            label="Live-Photo"
            fallbackExtension="mp4"
          />
        </div>
      );
    }

    return <LoadingCard text="Live Photo MP4 sedang diproses..." />;
  }

  return (
    <div className="mt-5 sm:mt-12">
      <div className="mb-5 rounded-[26px] bg-white p-2 shadow-xl sm:mb-8 sm:rounded-[32px] sm:p-3">
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
                <i className={`fa-solid ${icon} hidden sm:inline`} />
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
