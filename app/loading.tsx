export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F6F7FF] px-6">
      <div className="w-full max-w-md rounded-[36px] bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[32px] bg-gradient-to-br from-[#4263FF] via-[#7657FF] to-[#FF7BC3] shadow-xl">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/40 border-t-white" />
        </div>

        <h1 className="mt-7 text-3xl font-black text-[#101828]">
          Loading Miori Booth
        </h1>

        <p className="mt-2 font-semibold text-slate-400">
          Tunggu sebentar, data sedang disiapkan...
        </p>

        <div className="mt-8 space-y-3">
          <div className="h-4 animate-pulse rounded-full bg-slate-100" />
          <div className="mx-auto h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
          <div className="mx-auto h-4 w-3/5 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
    </main>
  );
}
