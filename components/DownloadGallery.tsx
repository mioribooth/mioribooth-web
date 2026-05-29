"use client";

import { useState } from "react";

type Props = {
  framePhoto?: string;
  singlePhotos: string[];
  gif?: string;
  livePhotos: string[];
};

type Tab = "photo" | "live" | "gif";

export default function DownloadGallery({
  framePhoto,
  singlePhotos,
  gif,
  livePhotos,
}: Props) {
  const [tab, setTab] = useState<Tab>("photo");

  return (
    <>
      <div className="flex justify-center mt-8">
        <div className="bg-white rounded-full p-2 shadow-md flex gap-2">
          <button
            onClick={() => setTab("photo")}
            className={`px-6 py-3 rounded-full font-semibold ${
              tab === "photo"
                ? "bg-violet-600 text-white"
                : "text-gray-600"
            }`}
          >
            Foto
          </button>

          <button
            onClick={() => setTab("live")}
            className={`px-6 py-3 rounded-full font-semibold ${
              tab === "live"
                ? "bg-violet-600 text-white"
                : "text-gray-600"
            }`}
          >
            Live
          </button>

          <button
            onClick={() => setTab("gif")}
            className={`px-6 py-3 rounded-full font-semibold ${
              tab === "gif"
                ? "bg-violet-600 text-white"
                : "text-gray-600"
            }`}
          >
            GIF
          </button>
        </div>
      </div>

      {tab === "photo" && (
        <>
          <div className="mt-8">
            <img
              src={framePhoto}
              className="w-full rounded-3xl shadow-lg"
              alt=""
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {singlePhotos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                className="rounded-2xl shadow"
              />
            ))}
          </div>
        </>
      )}

      {tab === "gif" && (
        <div className="mt-8">
          {gif ? (
            <img
              src={gif}
              className="w-full rounded-3xl shadow-lg"
            />
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center">
              GIF belum tersedia
            </div>
          )}
        </div>
      )}

      {tab === "live" && (
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {livePhotos.length > 0 ? (
            livePhotos.map((video, index) => (
              <video
                key={index}
                controls
                className="rounded-2xl shadow"
              >
                <source src={video} />
              </video>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center col-span-3">
              Live Photo belum tersedia
            </div>
          )}
        </div>
      )}
    </>
  );
}