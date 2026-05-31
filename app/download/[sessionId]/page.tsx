import { notFound } from "next/navigation";
import DownloadGallery from "@/components/DownloadGallery";

type PageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

async function getSession(sessionId: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://mioribooth-web.vercel.app";

  const response = await fetch(`${baseUrl}/api/session/${sessionId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  return data.session;
}

export default async function DownloadPage({ params }: PageProps) {
  const { sessionId } = await params;

  const session = await getSession(sessionId);

  if (!session) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F6F2FF] to-[#FFFFFF]">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg">
            <span className="text-4xl">📸</span>
          </div>

          <h1 className="text-5xl font-black text-slate-900">Miori Booth</h1>

          <p className="mt-3 text-lg font-semibold text-slate-500">
            Download Soft File
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Session ID: {sessionId}
          </p>
        </div>

        <DownloadGallery
          framePhoto={session.framePhoto}
          singlePhotos={session.singlePhotos || []}
          gif={session.gif}
          liveFrameVideo={session.liveFrameVideo || ""}
          livePhotos={session.livePhotos || []}
        />

        <footer className="mt-16 text-center">
          <p className="text-sm font-medium text-slate-400">
            Powered by Miori Booth
          </p>
        </footer>
      </div>
    </main>
  );
}