"use client";

import { useState } from "react";
import { Download, Film, Image as ImageIcon, Sparkles } from "lucide-react";

type Props = {
  framePhoto?: string;
  singlePhotos: string[];
  gif?: string;
  livePhotos: string[];
};

type Tab = "photo" | "live" | "gif";

function downloadFile(url: string, filename: string) {
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function DownloadGallery({
  framePhoto,
  singlePhotos,
  gif,
  livePhotos,
}: Props) {
  const [tab, setTab] = useState<Tab>("photo");

  return (
    <section className="mt-10">
      <div className="flex justify-center">
        <div className="flex gap-2 rounded-full border border-white/70 bg-white/80 p-2 shadow-[0_18px_50px_rgba(66,56,120,0.12)] backdrop-blur">
          <button
            onClick={() => setTab("photo")}
            className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black transition ${
              tab === "photo"
                ? "bg-gradient-to-r from-[#7B61FF] to-[#FF4FA3] text-white shadow-lg"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <ImageIcon size={18} />
            Foto
          </button>

          <button
            onClick={() => setTab("live")}
            className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black transition ${
              tab === "live"
                ? "bg-gradient-to-r from-[#7B61FF] to-[#FF4FA3] text-white shadow-lg"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Film size={18} />
            Live
          </button>

          <button
            onClick={() => setTab("gif")}
            className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black transition ${
              tab === "gif"
                ? "bg-gradient-to-r from-[#7B61FF] to-[#FF4FA3] text-white shadow-lg"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Sparkles size={18} />
            GIF
          </button>
        </div>
      </div>

      {tab === "photo" && (
        <div className="mt-8">
          <div className="rounded-[34px] bg-white p-4 shadow-[0_20px_70px_rgba(66,56,120,0.12)]">
            {framePhoto ? (
              <>
                <div className="overflow-hidden rounded-[26px] bg-[#F6F2FF]">
                  <img
                    src={framePhoto}
                    className="mx-auto max-h-[900px] w-full object-contain"
                    alt="Frame 4R Result"
                  />
                </div>

                <button
                  onClick={() =>
                    downloadFile(framePhoto, "miori-booth-frame-4r.jpg")
                  }
                  className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF4FA3] text-base font-black text-white shadow-lg"
                >
                  <Download size={20} />
                  Download Frame 4R
                </button>
              </>
            ) : (
              <div className="flex h-[500px] items-center justify-center rounded-[26px] bg-[#F6F2FF] text-center font-bold text-slate-400">
                Frame photo belum tersedia
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {singlePhotos.length > 0 ? (
              singlePhotos.map((photo, index) => (
                <div
                  key={index}
                  className="rounded-[28px] bg-white p-4 shadow-[0_16px_50px_rgba(66,56,120,0.10)]"
                >
                  <div className="overflow-hidden rounded-[22px] bg-[#F6F2FF]">
                    <img
                      src={photo}
                      className="aspect-[3/2] w-full object-cover"
                      alt={`Single Photo ${index + 1}`}
                    />
                  </div>

                  <button
                    onClick={() =>
                      downloadFile(photo, `miori-booth-photo-${index + 1}.jpg`)
                    }
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111827] text-sm font-black text-white"
                  >
                    <Download size={17} />
                    Download Foto {index + 1}
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-3 rounded-[28px] bg-white p-10 text-center font-bold text-slate-400 shadow">
                Single photo belum tersedia
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "gif" && (
        <div className="mt-8 rounded-[34px] bg-white p-4 shadow-[0_20px_70px_rgba(66,56,120,0.12)]">
          {gif ? (
            <>
              <div className="overflow-hidden rounded-[26px] bg-[#F6F2FF]">
                <img
                  src={gif}
                  className="mx-auto max-h-[850px] w-full object-contain"
                  alt="GIF Result"
                />
              </div>

              <button
                onClick={() => downloadFile(gif, "miori-booth.gif")}
                className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF4FA3] text-base font-black text-white shadow-lg"
              >
                <Download size={20} />
                Download GIF
              </button>
            </>
          ) : (
            <div className="flex h-[360px] items-center justify-center rounded-[26px] bg-[#F6F2FF] text-center font-bold text-slate-400">
              GIF belum tersedia
            </div>
          )}
        </div>
      )}

      {tab === "live" && (
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {livePhotos.length > 0 ? (
            livePhotos.map((video, index) => (
              <div
                key={index}
                className="rounded-[28px] bg-white p-4 shadow-[0_16px_50px_rgba(66,56,120,0.10)]"
              >
                <video
                  controls
                  className="aspect-[3/2] w-full rounded-[22px] bg-black object-cover"
                >
                  <source src={video} />
                </video>

                <button
                  onClick={() =>
                    downloadFile(video, `miori-booth-live-${index + 1}.webm`)
                  }
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111827] text-sm font-black text-white"
                >
                  <Download size={17} />
                  Download Live {index + 1}
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-3 rounded-[28px] bg-white p-10 text-center font-bold text-slate-400 shadow">
              Live Photo belum tersedia
            </div>
          )}
        </div>
      )}
    </section>
  );
}