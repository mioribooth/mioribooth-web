export default function LoadingFrames() {
  return (
    <div className="text-[#101828]">
      <div className="rounded-[44px] bg-gradient-to-br from-[#4263FF] via-[#7657FF] to-[#FF7BC3] p-8 text-white shadow-2xl">
        <div className="h-10 w-48 animate-pulse rounded-full bg-white/25" />
        <div className="mt-6 h-14 w-72 animate-pulse rounded-3xl bg-white/25" />
        <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded-full bg-white/20" />
      </div>

      <div className="mt-6 rounded-[36px] bg-white p-7 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 w-56 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="h-11 w-28 animate-pulse rounded-full bg-slate-100" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-[30px] bg-[#F6F7FF]">
              <div className="aspect-[2/3] animate-pulse bg-gradient-to-br from-slate-100 via-white to-slate-200" />
              <div className="space-y-3 p-5">
                <div className="h-7 w-4/5 animate-pulse rounded-full bg-slate-100" />
                <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="h-11 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-11 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
