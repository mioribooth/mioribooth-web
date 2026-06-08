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

const FRAME_WIDTH = 1200;
const FRAME_HEIGHT = 1800;
const CAMERA_RATIO = 3 / 2;

const categories = [
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

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFrame, setIsUploadingFrame] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("CUSTOM");
  const [layoutType, setLayoutType] = useState<LayoutType>("PHOTO_STRIP");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [thumbnail, setThumbnail] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState("");

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

        const frame = result.frame;

        setName(frame.name || "");
        setCategory(frame.category || "CUSTOM");
        setLayoutType(frame.layoutType || "PHOTO_STRIP");
        setBackgroundColor(frame.backgroundColor || "#FFFFFF");
        setThumbnail(frame.thumbnail || "");
        setIsActive(frame.isActive ?? true);
        setLayers(frame.layers || []);
        setSelectedLayerId(frame.layers?.[0]?.id || "");
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
        body: JSON.stringify({
          image: dataUrl,
        }),
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
      setLayers((prev) => [
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

    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  }

  function updateSelectedLayer(data: Partial<Layer>) {
    if (!selectedLayer) return;

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === selectedLayer.id ? { ...layer, ...data } : layer
      )
    );
  }

  function deleteSelectedLayer() {
    if (!selectedLayer) return;

    setLayers((prev) => prev.filter((layer) => layer.id !== selectedLayer.id));
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

    setLayers((prev) => [...prev, copy]);
    setSelectedLayerId(copy.id);
  }

  function startDrag(e: React.PointerEvent, layer: Layer) {
    if (layer.locked || layer.type === "frame") return;

    e.preventDefault();
    e.stopPropagation();

    setSelectedLayerId(layer.id);

    const scale = getScale();
    const startX = e.clientX;
    const startY = e.clientY;
    const originalX = layer.x;
    const originalY = layer.y;

    function onMove(moveEvent: PointerEvent) {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      setLayers((prev) =>
        prev.map((item) =>
          item.id === layer.id
            ? {
                ...item,
                x: Math.round(originalX + dx),
                y: Math.round(originalY + dy),
              }
            : item
        )
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

    const scale = getScale();
    const startX = e.clientX;
    const originalWidth = layer.width;

    function onMove(moveEvent: PointerEvent) {
      const dx = (moveEvent.clientX - startX) / scale;
      const nextWidth = Math.max(120, originalWidth + dx);
      const nextHeight = nextWidth / CAMERA_RATIO;

      setLayers((prev) =>
        prev.map((item) =>
          item.id === layer.id
            ? {
                ...item,
                width: Math.round(nextWidth),
                height: Math.round(nextHeight),
              }
            : item
        )
      );
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
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

      router.push("/admin/frames");
      router.refresh();
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

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-3xl font-black text-slate-400">
        Loading frame...
      </div>
    );
  }

  return (
    <div className="text-[#101828]">
      <div className="flex items-center justify-between rounded-[36px] bg-white p-7 shadow-xl">
        <div>
          <h1 className="text-4xl font-black">Edit Frame</h1>
          <p className="mt-2 font-semibold text-slate-500">
            Update frame dan slot foto. Perubahan otomatis dipakai Electron app.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={deleteFrame}
            className="h-[68px] rounded-full bg-red-50 px-8 text-xl font-black text-red-500"
          >
            DELETE
          </button>

          <button
            onClick={saveFrame}
            disabled={isSaving}
            className="h-[68px] rounded-full bg-[#4263FF] px-8 text-xl font-black text-white disabled:opacity-50"
          >
            {isSaving ? "MENYIMPAN..." : "SIMPAN"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_420px] gap-6">
        <div className="rounded-[36px] bg-white p-7 shadow-xl">
          <div className="flex justify-center rounded-[30px] bg-[#D9DDEB] p-8">
            <div
              ref={frameRef}
              className="relative h-[760px] aspect-[2/3] overflow-hidden bg-white shadow-2xl"
              style={{ backgroundColor }}
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
                    className={`absolute flex cursor-move select-none items-center justify-center border-[4px] border-dashed text-2xl font-black ${
                      selected ? "outline outline-[5px] outline-slate-950" : ""
                    }`}
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

                    {selected && (
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
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama frame"
              className="mt-5 h-14 w-full rounded-2xl bg-[#F6F7FF] px-5 font-bold outline-none"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-4 h-14 w-full rounded-2xl bg-[#F6F7FF] px-5 font-bold outline-none"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={layoutType}
              onChange={(e) => setLayoutType(e.target.value as LayoutType)}
              className="mt-4 h-14 w-full rounded-2xl bg-[#F6F7FF] px-5 font-bold outline-none"
            >
              <option value="PHOTO_STRIP">2R / Photo Strip</option>
              <option value="4R">4R</option>
            </select>

            <button
              onClick={() => setIsActive((prev) => !prev)}
              className={`mt-4 h-14 w-full rounded-full font-black ${
                isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {isActive ? "ACTIVE" : "DRAFT"}
            </button>
          </div>

          <div className="rounded-[30px] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black">Tools</h2>

            <button
              onClick={addPhotoSlot}
              className="mt-5 h-14 w-full rounded-full bg-[#4263FF] font-black text-white"
            >
              + PHOTO SLOT
            </button>

            <label className="mt-4 flex h-14 w-full cursor-pointer items-center justify-center rounded-full bg-[#FF7BC3] font-black text-white">
              {isUploadingFrame ? "UPLOADING..." : "GANTI PNG FRAME"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => uploadFrameImage(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="rounded-[30px] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black">Selected Layer</h2>

            {selectedLayer ? (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {["x", "y", "width", "height"].map((key) => (
                  <input
                    key={key}
                    type="number"
                    value={Math.round((selectedLayer as any)[key] || 0)}
                    onChange={(e) =>
                      updateSelectedLayer({
                        [key]: Number(e.target.value),
                      } as Partial<Layer>)
                    }
                    className="h-12 rounded-xl bg-[#F6F7FF] px-4 font-bold outline-none"
                  />
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

                <button
                  onClick={duplicateSelectedLayer}
                  className="col-span-2 h-12 rounded-full bg-[#EEF1FF] font-black text-[#4263FF]"
                >
                  DUPLICATE
                </button>

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

            <div className="mt-4 max-h-[280px] space-y-2 overflow-y-auto">
              {[...layers].reverse().map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`w-full rounded-2xl px-4 py-3 text-left font-black ${
                    selectedLayerId === layer.id
                      ? "bg-[#4263FF] text-white"
                      : "bg-[#F6F7FF] text-slate-600"
                  }`}
                >
                  {layer.name}
                  {layer.type === "photo" ? ` #${layer.photoIndex}` : ""}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
