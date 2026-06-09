"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteFrameButton({ frameId }: { frameId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteFrame() {
    const ok = confirm("Hapus frame ini?");
    if (!ok) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/frames/${frameId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message || "Gagal menghapus frame.");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("DELETE_FRAME_ERROR:", error);
      alert("Gagal menghapus frame.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      onClick={deleteFrame}
      disabled={isDeleting}
      className="flex-1 rounded-full bg-[#FFF0F0] py-3 text-sm font-black text-red-500 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isDeleting ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
          HAPUS...
        </span>
      ) : (
        "DELETE"
      )}
    </button>
  );
}
