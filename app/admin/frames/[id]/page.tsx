"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type LayoutType = "PHOTO_STRIP" | "4R";

type Layer = {
  id: string;
  type: "photo" | "frame";
  name: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  src?: string;
  photoIndex?: number;
};

type FrameTemplate = {
  id: string;
  name: string;
  category: string;
  layoutType: LayoutType;
  backgroundColor: string;
  thumbnail?: string;
  isActive: boolean;
  layers: Layer[];
};

const FRAME_WIDTH = 1200;
const FRAME_HEIGHT = 1800;
const CAMERA_RATIO = 3 / 2;

const defaultCategories = [
  "CUSTOM",
  "KPOP",
  "AESTHETIC",
  "WEDDING",
  "BIRTHDAY",
  "EVENT",
];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneLayers(layers: Layer[]) {
  return JSON.parse(JSON.stringify(layers)) as Layer[];
}

function getPhotoColor(index?: number) {
  switch (index) {
    case 1:
      return { bg: "#E8FFF0", border: "#22C55E", text: "#16A34A" };
    case 2:
      return { bg: "#FFF0F8", border: "#EC4899", text: "#DB2777" };
    case 3:
      return { bg: "#EEF4FF", border: "#3B82F6", text: "#2563EB" };
    case 4:
      return { bg: "#FFF8E8", border: "#F59E0B", text: "#D97706" };
    case 5:
      return { bg: "#F3E8FF", border: "#A855F7", text: "#9333EA" };
    case 6:
      return { bg: "#ECFEFF", border: "#06B6D4", text: "#0891B2" };
    default:
      return { bg: "#F8FAFC", border: "#94A3B8", text: "#475569" };
  }
}

export default function EditFramePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const frameRef = useRef<HTMLDivElement>(null);
  const dragLayerRef = useRef<string | null>(null);
  const savedTimerRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFrame, setIsUploadingFrame] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("CUSTOM");
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [layoutType, setLayoutType] = useState<LayoutType>("PHOTO_STRIP");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [thumbnail, setThumbnail] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [copiedLayer, setCopiedLayer] = useState<Layer | null>(null);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);

  const [history, setHistory] = useState<Layer[][]>([]);
  const [redoHistory, setRedoHistory] = useState<Layer[][]>([]);

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selectedLayerId),
    [layers, selectedLayerId]
  );

  useEffect(() => {
    async function loadFrame() {
      try {
        const response = await fetch(`/api/frames/${params.id}`, {
          cache: "no-store",
        });

        const result = await response.json();

        if (!result.success) {
          alert(result.message || "Frame tidak ditemukan.");
          router.push("/admin/frames");
          return;
        }

        const frame: FrameTemplate = result.frame;

        setName(frame.name || "");
        setCategory(frame.category || "CUSTOM");
        setLayoutType(frame.layoutType || "PHOTO_STRIP");
        setBackgroundColor(frame.backgroundColor || "#FFFFFF");
        setThumbnail(frame.thumbnail || "");
        setIsActive(frame.isActive ?? true);
        setLayers(Array.isArray(frame.layers) ? frame.layers : []);
        setSelectedLayerId(frame.layers?.[0]?.id || "");

        const framesResponse = await fetch("/api/frames", { cache: "no-store" });
        const framesResult = await framesResponse.json();

        if (framesResult.success) {
          const onlineCategories = Array.from(
            new Set([
              ...defaultCategories,
              ...(framesResult.frames || [])
                .map((item: any) => item.category)
                .filter(Boolean),
            ])
          ) as string[];

          setCategories(onlineCategories);
        }
      } catch (error) {
        console.error("LOAD_FRAME_ERROR:", error);
        alert("Gagal membuka frame.");
        router.push("/admin/frames");
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) loadFrame();
  }, [params.id, router]);

  function markDirty() {
    setIsDirty(true);
  }

  function pushHistory() {
    setHistory((prev) => [...prev, cloneLayers(layers)]);
    setRedoHistory([]);
  }

  function setLayersWithHistory(updater: (prev: Layer[]) => Layer[]) {
    markDirty();
    pushHistory();
    setLayers(updater);
  }

  function getScale() {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return 1;
    return rect.width / FRAME_WIDTH;
  }

  async function uploadFrameImage(file: File | null) {
    if (!file) return;

    setIsUploadingFrame(true);

    try {
      const reader = new FileReader();

      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/admin/upload-frame-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: dataUrl }),
      });

      const result = await response.json();

      if (!result.success || !result.url) {
        alert(result.message || "Gagal upload PNG frame.");
        return;
      }

      const frameUrl = result.url;

      const frameLayer: Layer = {
        id: createId("frame-layer"),
        type: "frame",
        name: "Frame PNG",
        visible: true,
        locked: true,
        x: 0,
        y: 0,
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
        src: frameUrl,
      };

      setThumbnail(frameUrl);
      setLayersWithHistory((prev) => [
        frameLayer,
        ...prev.filter((layer) => layer.type !== "frame"),
      ]);
      setSelectedLayerId("");
    } catch (error) {
      console.error("UPLOAD_FRAME_IMAGE_ERROR:", error);
      alert("Gagal upload PNG frame.");
    } finally {
      setIsUploadingFrame(false);
    }
  }

  function addPhotoSlot() {
    const photoLayers = layers.filter((layer) => layer.type === "photo");
    const nextIndex =
      photoLayers.length === 0
        ? 1
        : Math.max(...photoLayers.map((layer) => layer.photoIndex || 0)) + 1;

    const newLayer: Layer = {
      id: createId("photo"),
      type: "photo",
      name: `Foto ${nextIndex}`,
      photoIndex: nextIndex,
      visible: true,
      locked: false,
      x: 120,
      y: 120 + photoLayers.length * 360,
      width: 460,
      height: 460 / CAMERA_RATIO,
    };

    setLayersWithHistory((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  }

  function updateLayer(layerId: string, data: Partial<Layer>, saveHistory = true) {
    const layer = layers.find((item) => item.id === layerId);
    if (!layer) return;

    markDirty();
    if (saveHistory) pushHistory();

    setLayers((prev) =>
      prev.map((item) => (item.id === layerId ? { ...item, ...data } : item))
    );
  }

  function updateSelectedLayer(data: Partial<Layer>) {
    if (!selectedLayer) return;
    updateLayer(selectedLayer.id, data);
  }

  function deleteSelectedLayer() {
    if (!selectedLayer) return;

    setLayersWithHistory((prev) =>
      prev.filter((layer) => layer.id !== selectedLayer.id)
    );

    setSelectedLayerId("");
  }

  function duplicateSelectedLayer() {
    if (!selectedLayer) return;

    const copy: Layer = {
      ...selectedLayer,
      id: createId(selectedLayer.type),
      x: selectedLayer.x + 60,
      y: selectedLayer.y + 60,
      locked: selectedLayer.type === "frame" ? true : false,
    };

    setLayersWithHistory((prev) => [...prev, copy]);
    setSelectedLayerId(copy.id);
  }

  function copyLayer() {
    if (!selectedLayer) return;
    setCopiedLayer(JSON.parse(JSON.stringify(selectedLayer)));
  }

  function pasteLayer() {
    if (!copiedLayer) return;

    const pastedLayer: Layer = {
      ...copiedLayer,
      id: createId(copiedLayer.type),
      x: copiedLayer.x + 60,
      y: copiedLayer.y + 60,
      visible: true,
      locked: copiedLayer.type === "frame" ? true : false,
    };

    setLayersWithHistory((prev) => [...prev, pastedLayer]);
    setSelectedLayerId(pastedLayer.id);
  }

  function undo() {
    if (!history.length) return;

    const previous = history[history.length - 1];
    setRedoHistory((prev) => [cloneLayers(layers), ...prev]);
    setLayers(previous);
    setHistory((prev) => prev.slice(0, -1));
    setIsDirty(true);
    setSelectedLayerId(previous[0]?.id || "");
  }

  function redo() {
    if (!redoHistory.length) return;

    const next = redoHistory[0];
    setHistory((prev) => [...prev, cloneLayers(layers)]);
    setLayers(next);
    setRedoHistory((prev) => prev.slice(1));
    setIsDirty(true);
    setSelectedLayerId(next[0]?.id || "");
  }

  function renumberPhotoLayers() {
    setLayersWithHistory((prev) => {
      let index = 1;

      return prev.map((layer) => {
        if (layer.type !== "photo") return layer;

        const nextLayer = {
          ...layer,
          photoIndex: index,
          name: `Foto ${index}`,
        };

        index += 1;
        return nextLayer;
      });
    });
  }

  function align(type: "left" | "centerX" | "right" | "top" | "centerY" | "bottom") {
    if (!selectedLayer || selectedLayer.locked || selectedLayer.type === "frame") return;

    if (type === "left") updateLayer(selectedLayer.id, { x: 0 });
    if (type === "right") {
      updateLayer(selectedLayer.id, { x: FRAME_WIDTH - selectedLayer.width });
    }
    if (type === "centerX") {
      updateLayer(selectedLayer.id, {
        x: FRAME_WIDTH / 2 - selectedLayer.width / 2,
      });
    }
    if (type === "top") updateLayer(selectedLayer.id, { y: 0 });
    if (type === "bottom") {
      updateLayer(selectedLayer.id, { y: FRAME_HEIGHT - selectedLayer.height });
    }
    if (type === "centerY") {
      updateLayer(selectedLayer.id, {
        y: FRAME_HEIGHT / 2 - selectedLayer.height / 2,
      });
    }
  }

  function shiftAll(axis: "x" | "y", amount: number) {
    setLayersWithHistory((prev) =>
      prev.map((layer) =>
        layer.type === "photo" && !layer.locked
          ? { ...layer, [axis]: layer[axis] + amount }
          : layer
      )
    );
  }

  function bringForward() {
    if (!selectedLayer) return;

    const index = layers.findIndex((layer) => layer.id === selectedLayer.id);
    if (index === -1 || index === layers.length - 1) return;

    setLayersWithHistory((prev) => {
      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated;
    });
  }

  function sendBackward() {
    if (!selectedLayer) return;

    const index = layers.findIndex((layer) => layer.id === selectedLayer.id);
    if (index <= 0) return;

    setLayersWithHistory((prev) => {
      const updated = [...prev];
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
      return updated;
    });
  }

  function moveLayer(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;

    setLayersWithHistory((prev) => {
      const updated = [...prev];

      const draggedIndex = updated.findIndex((layer) => layer.id === draggedId);
      const targetIndex = updated.findIndex((layer) => layer.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const [removed] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, removed);

      return updated;
    });

    dragLayerRef.current = null;
  }

  function toggleVisible(layerId: string) {
    const layer = layers.find((item) => item.id === layerId);
    if (!layer) return;

    updateLayer(layerId, { visible: !layer.visible });
  }

  function toggleLock(layerId: string) {
    const layer = layers.find((item) => item.id === layerId);
    if (!layer || layer.type === "frame") return;

    updateLayer(layerId, { locked: !layer.locked });
  }

  function startDrag(e: React.PointerEvent, layer: Layer) {
    if (layer.locked || layer.type === "frame") return;

    e.preventDefault();
    e.stopPropagation();

    setSelectedLayerId(layer.id);
    markDirty();
    pushHistory();

    const scale = getScale();
    const startX = e.clientX;
    const startY = e.clientY;
    const originalX = layer.x;
    const originalY = layer.y;

    function onMove(moveEvent: PointerEvent) {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      updateLayer(
        layer.id,
        {
          x: Math.round(originalX + dx),
          y: Math.round(originalY + dy),
        },
        false
      );
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function startResize(e: React.PointerEvent, layer: Layer) {
    if (layer.locked || layer.type === "frame") return;

    e.preventDefault();
    e.stopPropagation();

    markDirty();
    pushHistory();

    const scale = getScale();
    const startX = e.clientX;
    const startY = e.clientY;
    const originalWidth = layer.width;
    const originalHeight = layer.height;

    function onMove(moveEvent: PointerEvent) {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      let nextWidth = Math.max(120, originalWidth + dx);
      let nextHeight = Math.max(120, originalHeight + dy);

      if (keepAspectRatio) {
        nextHeight = nextWidth / CAMERA_RATIO;
      }

      updateLayer(
        layer.id,
        {
          width: Math.round(nextWidth),
          height: Math.round(nextHeight),
        },
        false
      );
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function addCategory() {
    const next = newCategoryName.trim().toUpperCase();
    if (!next || categories.includes(next)) return;

    setCategories((prev) => [...prev, next]);
    setCategory(next);
    setNewCategoryName("");
    setIsDirty(true);
  }

  async function saveFrame() {
    if (isUploadingFrame) {
      alert("Tunggu upload PNG frame selesai.");
      return;
    }

    if (!name.trim()) {
      alert("Nama frame wajib diisi.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/frames/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          category,
          layoutType,
          backgroundColor,
          thumbnail,
          isActive,
          layers: layers.map((layer, index) => ({
            ...layer,
            zIndex: index,
          })),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message || "Gagal update frame.");
        return;
      }

      setIsDirty(false);
      setShowSavedToast(true);

      if (savedTimerRef.current) {
        window.clearTimeout(savedTimerRef.current);
      }

      savedTimerRef.current = window.setTimeout(() => {
        setShowSavedToast(false);
      }, 1800);
    } catch (error) {
      console.error("SAVE_FRAME_ERROR:", error);
      alert("Gagal update frame.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteFrame() {
    const ok = confirm("Hapus frame ini?");
    if (!ok) return;

    try {
      const response = await fetch(`/api/frames/${params.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message || "Gagal hapus frame.");
        return;
      }

      router.push("/admin/frames");
      router.refresh();
    } catch (error) {
      console.error("DELETE_FRAME_ERROR:", error);
      alert("Gagal hapus frame.");
    }
  }

  function leavePage() {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }

    router.push("/admin/frames");
  }

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-3xl font-black text-slate-400">
        Loading frame...
      </div>
    );
  }

  return (
    <div className="relative text-[#101828]">
      {showSavedToast && (
        <div className="fixed left-1/2 top-8 z-[2000] -translate-x-1/2 rounded-full bg-green-100 px-8 py-4 text-xl font-black text-green-700 shadow-xl">
          Frame berhasil disimpan
        </div>
      )}

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/45">
          <div className="w-[560px] rounded-[36px] bg-white p-8 shadow-2xl">
            <h1 className="text-3xl font-black">Perubahan belum disimpan</h1>
            <p className="mt-3 font-semibold text-slate-500">
              Kalau keluar sekarang, perubahan frame akan hilang.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="h-14 rounded-full bg-[#F6F7FF] font-black"
              >
                BATAL
              </button>

              <button
                onClick={() => router.push("/admin/frames")}
                className="h-14 rounded-full bg-red-500 font-black text-white"
              >
                KELUAR
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-[36px] bg-white p-7 shadow-xl">
        <div>
          <h1 className="text-4xl font-black">Frame Editor Pro</h1>
          <p className="mt-2 font-semibold text-slate-500">
            Editor website dengan fitur layer lengkap dan sinkron ke Electron.
          </p>
          <p className={`mt-2 text-sm font-black ${isDirty ? "text-red-500" : "text-green-600"}`}>
            {isDirty ? "● Belum Disimpan" : "● Tersimpan"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={leavePage}
            className="h-[58px] rounded-full bg-[#F6F7FF] px-6 font-black text-[#4263FF]"
          >
            ← LIBRARY
          </button>

          <button
            onClick={undo}
            className="h-[58px] rounded-full border-2 border-[#4263FF] px-6 font-black text-[#4263FF]"
          >
            UNDO
          </button>

          <button
            onClick={redo}
            className="h-[58px] rounded-full border-2 border-[#4263FF] px-6 font-black text-[#4263FF]"
          >
            REDO
          </button>

          <button
            onClick={deleteFrame}
            className="h-[58px] rounded-full bg-red-50 px-6 font-black text-red-500"
          >
            DELETE
          </button>

          <button
            onClick={saveFrame}
            disabled={isSaving}
            className="h-[58px] rounded-full bg-[#4263FF] px-8 font-black text-white disabled:opacity-50"
          >
            {isSaving ? "MENYIMPAN..." : "SIMPAN"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_430px] gap-6">
        <div className="rounded-[36px] bg-white p-7 shadow-xl">
          <div className="flex justify-center rounded-[30px] bg-[#D9DDEB] p-8">
            <div
              ref={frameRef}
              className="relative h-[760px] aspect-[2/3] overflow-hidden bg-white shadow-2xl"
              style={{ backgroundColor }}
              onClick={() => setSelectedLayerId("")}
            >
              {layers.map((layer) => {
                if (!layer.visible) return null;

                if (layer.type === "frame") {
                  return (
                    <img
                      key={layer.id}
                      src={layer.src}
                      alt="Frame"
                      draggable={false}
                      className="absolute object-cover pointer-events-none select-none"
                      style={{
                        left: `${(layer.x / FRAME_WIDTH) * 100}%`,
                        top: `${(layer.y / FRAME_HEIGHT) * 100}%`,
                        width: `${(layer.width / FRAME_WIDTH) * 100}%`,
                        height: `${(layer.height / FRAME_HEIGHT) * 100}%`,
                      }}
                    />
                  );
                }

                const color = getPhotoColor(layer.photoIndex);
                const selected = selectedLayerId === layer.id;

                return (
                  <div
                    key={layer.id}
                    onPointerDown={(e) => startDrag(e, layer)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLayerId(layer.id);
                    }}
                    className={`absolute flex select-none items-center justify-center border-[4px] border-dashed text-2xl font-black ${
                      layer.locked ? "cursor-not-allowed" : "cursor-move"
                    } ${selected ? "outline outline-[5px] outline-slate-950" : ""}`}
                    style={{
                      backgroundColor: color.bg,
                      borderColor: color.border,
                      color: color.text,
                      left: `${(layer.x / FRAME_WIDTH) * 100}%`,
                      top: `${(layer.y / FRAME_HEIGHT) * 100}%`,
                      width: `${(layer.width / FRAME_WIDTH) * 100}%`,
                      height: `${(layer.height / FRAME_HEIGHT) * 100}%`,
                    }}
                  >
                    FOTO #{layer.photoIndex}

                    {selected && !layer.locked && (
                      <div
                        onPointerDown={(e) => startResize(e, layer)}
                        className="absolute bottom-[-14px] right-[-14px] h-10 w-10 rounded-full border-[6px] border-slate-950 bg-white"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[30px] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black">Frame Info</h2>

            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Nama frame"
              className="mt-5 h-14 w-full rounded-2xl bg-[#F6F7FF] px-5 font-bold outline-none"
            />

            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setIsDirty(true);
                }}
                className="h-14 w-full rounded-2xl bg-[#F6F7FF] px-5 font-bold outline-none"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <button
                onClick={addCategory}
                className="h-14 rounded-2xl bg-[#4263FF] px-4 font-black text-white"
              >
                +
              </button>
            </div>

            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Kategori baru"
              className="mt-3 h-12 w-full rounded-2xl bg-[#F6F7FF] px-5 font-bold outline-none"
            />

            <select
              value={layoutType}
              onChange={(e) => {
                setLayoutType(e.target.value as LayoutType);
                setIsDirty(true);
              }}
              className="mt-4 h-14 w-full rounded-2xl bg-[#F6F7FF] px-5 font-bold outline-none"
            >
              <option value="PHOTO_STRIP">2R / Photo Strip</option>
              <option value="4R">4R</option>
            </select>

            <input
              value={backgroundColor}
              onChange={(e) => {
                setBackgroundColor(e.target.value);
                setIsDirty(true);
              }}
              className="mt-4 h-14 w-full rounded-2xl bg-[#F6F7FF] px-5 font-bold outline-none"
            />

            <button
              onClick={() => {
                setIsActive((prev) => !prev);
                setIsDirty(true);
              }}
              className={`mt-4 h-14 w-full rounded-full font-black ${
                isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}
            >
              {isActive ? "ACTIVE" : "DRAFT"}
            </button>
          </div>

          <div className="rounded-[30px] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black">Tools</h2>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={addPhotoSlot}
                className="h-12 rounded-full bg-[#4263FF] font-black text-white"
              >
                + PHOTO
              </button>

              <label className="flex h-12 cursor-pointer items-center justify-center rounded-full bg-[#FF7BC3] font-black text-white">
                {isUploadingFrame ? "UP..." : "PNG"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => uploadFrameImage(e.target.files?.[0] || null)}
                />
              </label>

              <button
                onClick={copyLayer}
                className="h-12 rounded-full bg-[#EEF1FF] font-black text-[#4263FF]"
              >
                COPY
              </button>

              <button
                onClick={pasteLayer}
                className="h-12 rounded-full bg-[#EEF1FF] font-black text-[#4263FF]"
              >
                PASTE
              </button>

              <button
                onClick={duplicateSelectedLayer}
                className="col-span-2 h-12 rounded-full bg-[#EEF1FF] font-black text-[#4263FF]"
              >
                DUPLICATE
              </button>

              <button
                onClick={renumberPhotoLayers}
                className="col-span-2 h-12 rounded-full bg-[#F3EEFF] font-black text-[#7657FF]"
              >
                AUTO RENUMBER FOTO
              </button>
            </div>

            <button
              onClick={() => setKeepAspectRatio((prev) => !prev)}
              className={`mt-4 h-12 w-full rounded-full font-black ${
                keepAspectRatio ? "bg-[#FF7BC3] text-white" : "bg-[#F6F7FF] text-slate-600"
              }`}
            >
              KEEP ASPECT {keepAspectRatio ? "ON" : "OFF"}
            </button>
          </div>

          <div className="rounded-[30px] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black">Selected Layer</h2>

            {selectedLayer ? (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {(["x", "y", "width", "height"] as const).map((key) => (
                  <div key={key}>
                    <p className="mb-1 text-xs font-black text-slate-400">
                      {key.toUpperCase()}
                    </p>
                    <input
                      type="number"
                      value={Math.round(selectedLayer[key] || 0)}
                      onChange={(e) =>
                        updateSelectedLayer({
                          [key]: Number(e.target.value),
                        } as Partial<Layer>)
                      }
                      className="h-12 w-full rounded-xl bg-[#F6F7FF] px-4 font-bold outline-none"
                    />
                  </div>
                ))}

                {selectedLayer.type === "photo" && (
                  <input
                    type="number"
                    value={selectedLayer.photoIndex || 1}
                    onChange={(e) =>
                      updateSelectedLayer({
                        photoIndex: Number(e.target.value || 1),
                        name: `Foto ${Number(e.target.value || 1)}`,
                      })
                    }
                    className="col-span-2 h-12 rounded-xl bg-[#F6F7FF] px-4 font-bold outline-none"
                  />
                )}

                <div className="col-span-2 grid grid-cols-3 gap-2">
                  <button onClick={() => align("left")} className="h-10 rounded-xl bg-[#F6F7FF] font-black">L</button>
                  <button onClick={() => align("centerX")} className="h-10 rounded-xl bg-[#F6F7FF] font-black">CX</button>
                  <button onClick={() => align("right")} className="h-10 rounded-xl bg-[#F6F7FF] font-black">R</button>
                  <button onClick={() => align("top")} className="h-10 rounded-xl bg-[#F6F7FF] font-black">T</button>
                  <button onClick={() => align("centerY")} className="h-10 rounded-xl bg-[#F6F7FF] font-black">CY</button>
                  <button onClick={() => align("bottom")} className="h-10 rounded-xl bg-[#F6F7FF] font-black">B</button>
                </div>

                <div className="col-span-2 grid grid-cols-4 gap-2">
                  <button onClick={() => shiftAll("x", -10)} className="h-10 rounded-xl bg-[#EEF1FF] font-black">←</button>
                  <button onClick={() => shiftAll("x", 10)} className="h-10 rounded-xl bg-[#EEF1FF] font-black">→</button>
                  <button onClick={() => shiftAll("y", -10)} className="h-10 rounded-xl bg-[#EEF1FF] font-black">↑</button>
                  <button onClick={() => shiftAll("y", 10)} className="h-10 rounded-xl bg-[#EEF1FF] font-black">↓</button>
                </div>

                <button
                  onClick={deleteSelectedLayer}
                  className="col-span-2 h-12 rounded-full bg-red-50 font-black text-red-500"
                >
                  HAPUS LAYER
                </button>
              </div>
            ) : (
              <p className="mt-5 font-bold text-slate-400">
                Pilih slot foto dulu.
              </p>
            )}
          </div>

          <div className="rounded-[30px] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black">Layers</h2>

            <div className="mt-4 max-h-[340px] space-y-2 overflow-y-auto">
              {[...layers].reverse().map((layer) => (
                <div
                  key={layer.id}
                  draggable
                  onDragStart={() => {
                    dragLayerRef.current = layer.id;
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragLayerRef.current) {
                      moveLayer(dragLayerRef.current, layer.id);
                    }
                  }}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`flex w-full cursor-grab items-center gap-2 rounded-2xl px-4 py-3 text-left font-black ${
                    selectedLayerId === layer.id
                      ? "bg-[#4263FF] text-white"
                      : "bg-[#F6F7FF] text-slate-600"
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisible(layer.id);
                    }}
                    className="text-lg"
                  >
                    {layer.visible ? "👁" : "🚫"}
                  </button>

                  <span className="flex-1">
                    {layer.name}
                    {layer.type === "photo" ? ` #${layer.photoIndex}` : ""}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLock(layer.id);
                    }}
                    className="text-lg"
                  >
                    {layer.locked ? "🔒" : "🔓"}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={sendBackward}
                className="h-11 rounded-full bg-[#F6F7FF] font-black"
              >
                SEND BACK
              </button>

              <button
                onClick={bringForward}
                className="h-11 rounded-full bg-[#F6F7FF] font-black"
              >
                BRING FRONT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
