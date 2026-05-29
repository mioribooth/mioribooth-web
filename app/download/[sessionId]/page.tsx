import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

async function getSession(sessionId: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const response = await fetch(
    `${baseUrl}/api/session/${sessionId}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  return data.session;
}

export default async function DownloadPage({
  params,
}: PageProps) {
  const { sessionId } = await params;

  const session = await getSession(sessionId);

  if (!session) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F6F2FF]">
      <div className="max-w-6xl mx-auto px-6 py-12">

        <div className="text-center">
          <h1 className="text-5xl font-black text-slate-900">
            Download Soft File
          </h1>

          <p className="mt-4 text-slate-500">
            Session ID: {sessionId}
          </p>
        </div>

        {/* FRAME RESULT */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">
            Hasil Frame
          </h2>

          <div className="bg-white rounded-3xl p-4 shadow">
            {session.framePhoto ? (
              <img
                src={session.framePhoto}
                alt="Frame Result"
                className="w-full rounded-2xl"
              />
            ) : (
              <div className="h-[500px] flex items-center justify-center text-gray-400">
                Belum ada frame photo
              </div>
            )}
          </div>
        </section>

        {/* SINGLE PHOTOS */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">
            Single Photos
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {session.singlePhotos?.map(
              (photo: string, index: number) => (
                <div
                  key={index}
                  className="bg-white rounded-3xl p-4 shadow"
                >
                  <img
                    src={photo}
                    className="w-full rounded-2xl"
                    alt={`Photo ${index + 1}`}
                  />

                  <a
                    href={photo}
                    download
                    target="_blank"
                    className="
                      mt-4
                      block
                      text-center
                      py-3
                      rounded-xl
                      bg-[#6D5DF6]
                      text-white
                      font-bold
                    "
                  >
                    Download
                  </a>
                </div>
              )
            )}
          </div>
        </section>

        {/* GIF */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">
            GIF
          </h2>

          <div className="bg-white rounded-3xl p-4 shadow">
            {session.gif ? (
              <>
                <img
                  src={session.gif}
                  className="w-full rounded-2xl"
                  alt="GIF"
                />

                <a
                  href={session.gif}
                  target="_blank"
                  className="
                    mt-4
                    block
                    text-center
                    py-3
                    rounded-xl
                    bg-[#6D5DF6]
                    text-white
                    font-bold
                  "
                >
                  Download GIF
                </a>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                GIF belum tersedia
              </div>
            )}
          </div>
        </section>

        {/* LIVE PHOTO */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">
            Live Photos
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {session.livePhotos?.map(
              (video: string, index: number) => (
                <div
                  key={index}
                  className="bg-white rounded-3xl p-4 shadow"
                >
                  <video
                    controls
                    className="w-full rounded-2xl"
                  >
                    <source src={video} />
                  </video>

                  <a
                    href={video}
                    target="_blank"
                    className="
                      mt-4
                      block
                      text-center
                      py-3
                      rounded-xl
                      bg-[#6D5DF6]
                      text-white
                      font-bold
                    "
                  >
                    Download Live {index + 1}
                  </a>
                </div>
              )
            )}
          </div>
        </section>

      </div>
    </main>
  );
}