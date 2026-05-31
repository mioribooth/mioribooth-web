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
  uploadStatus?: UploadStatus;
};

export default function DownloadGallery({
  sessionId,
  framePhoto: initialFramePhoto,
  singlePhotos: initialSinglePhotos = [],
  gif: initialGif,
  liveFrameVideo: initialLiveFrameVideo,
  livePhotos: initialLivePhotos = [],
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
        setUploadStatus(data.session.uploadStatus || {});
      } catch {}
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
          />
          <a
            href={selectedPhoto}
            download
            target="_blank"
            className="mt-5 flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#4263FF] to-[#FF7BC3] text-sm font-black text-white"
          >
            Download Foto {activeSingleIndex + 1}
          </a>
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
    if (!gif) {
      return <LoadingCard text="GIF sedang diproses..." />;
    }

    return (
      <div className="overflow-hidden rounded-[34px] bg-white p-5 shadow-xl">
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
          <a
            href={liveFrameVideo}
            download
            target="_blank"
            className="mt-5 flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#4263FF] to-[#FF7BC3] text-sm font-black text-white"
          >
            Download Live Photo MP4
          </a>
        </div>
      );
    }

    if (livePhotos.length > 0) {
      return (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {livePhotos.map((video, index) => (
            <div
              key={video}
              className="overflow-hidden rounded-[28px] bg-white p-3 shadow-xl"
            >
              <video
                src={video}
                controls
                playsInline
                className="h-[280px] w-full rounded-[22px] bg-black object-cover"
              />
              <a
                href={video}
                download
                target="_blank"
                className="mt-3 flex h-12 items-center justify-center rounded-2xl bg-[#F6F7FF] text-sm font-black text-[#4263FF]"
              >
                Download Live {index + 1}
              </a>
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