"use client";

export default function TestSession() {
  async function createTestSession() {
    const response = await fetch("/api/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        framePhoto:
          "https://res.cloudinary.com/duolda6ex/image/upload/v1780042127/miori-booth/test/o5yboadwucy0cut1hp13.jpg",
        singlePhotos: [
          "https://res.cloudinary.com/duolda6ex/image/upload/v1780042127/miori-booth/test/o5yboadwucy0cut1hp13.jpg",
          "https://res.cloudinary.com/duolda6ex/image/upload/v1780042127/miori-booth/test/o5yboadwucy0cut1hp13.jpg",
          "https://res.cloudinary.com/duolda6ex/image/upload/v1780042127/miori-booth/test/o5yboadwucy0cut1hp13.jpg",
        ],
        gif: "",
        livePhotos: [],
      }),
    });

    const result = await response.json();

    console.log(result);

    if (result.downloadUrl) {
      window.location.href = result.downloadUrl;
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <button
        onClick={createTestSession}
        className="px-8 py-4 rounded-xl bg-purple-600 text-white font-bold"
      >
        Buat Test Session
      </button>
    </main>
  );
}