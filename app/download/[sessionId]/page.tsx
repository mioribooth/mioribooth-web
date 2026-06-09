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
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#F6F2FF] via-white to-white">
      <div className="mx-auto w-full max-w-5xl px-4 pb-8 pt-6 sm:px-6 sm:pb-12 sm:pt-10">
        <section className="rounded-[2rem] border border-white/80 bg-white/80 px-4 py-6 text-center shadow-sm backdrop-blur sm:px-8 sm:py-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F6F2FF] shadow-sm sm:h-20 sm:w-20">
            <span className="text-3xl sm:text-4xl">📸</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Miori Booth
          </h1>

          <p className="mt-2 text-base font-semibold text-slate-500 sm:text-lg">
            Download Soft File Kamu
          </p>

          <div className="mx-auto mt-4 max-w-full rounded-2xl bg-slate-50 px-3 py-2">
            <p className="break-all text-xs font-medium text-slate-400 sm:text-sm">
              Session ID: {sessionId}
            </p>
          </div>
        </section>

        <section className="mt-5 sm:mt-8">
          <DownloadGallery
            sessionId={sessionId}
            framePhoto={session.framePhoto}
            singlePhotos={session.singlePhotos || []}
            gif={session.gif}
            liveFrameVideo={session.liveFrameVideo || ""}
            livePhotos={session.livePhotos || []}
            mirror={Boolean(session.mirror)}
            uploadStatus={session.uploadStatus || {}}
          />
        </section>

        <footer className="mt-10 pb-6 text-center sm:mt-16">
          <p className="text-xs font-medium text-slate-400 sm:text-sm">
            Powered by Miori Booth
          </p>
        </footer>
      </div>
    </main>
  );
}
