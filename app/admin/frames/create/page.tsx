"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function CreateFramePage() {
  const router = useRouter();
  const frameRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("CUSTOM");
  const [layoutType, setLayoutType] = useState<LayoutType>("PHOTO_STRIP");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [thumbnail, setThumbnail] = useState("");
  const [frameDetectSource, setFrameDetectSource] = useState("");
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [copiedLayers, setCopiedLayers] = useState<Layer[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFrame, setIsUploadingFrame] = useState(false);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selectedLayerId),
    [layers, selectedLayerId]
  );

  const orderedLayers = useMemo(() => {
    const photoLayers = layers.filter((layer) => layer.type !== "frame");
    const frameLayers = layers.filter((layer) => layer.type === "frame");
    return [...photoLayers, ...frameLayers];
  }, [layers]);

  const photoCount = layers.filter((layer) => layer.type === "photo").length;

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      const result = await response.json();
      if (!result.success || !result.url) {
        alert(result.message || "Gagal upload PNG frame.");
        return;
      }

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
        src: result.url,
      };

      setThumbnail(result.url);
      setFrameDetectSource(dataUrl);
      setLayers((prev) => [
        ...prev.filter((layer) => layer.type !== "frame"),
        frameLayer,
      ]);
      setSelectedLayerId(frameLayer.id);
      setSelectedLayerIds([frameLayer.id]);
    } catch (error) {
      console.error("UPLOAD_FRAME_IMAGE_ERROR:", error);
      alert("Gagal upload PNG frame.");
    } finally {
      setIsUploadingFrame(false);
    }
  }

  function addPhotoSlot() {
    const photoLayers = layers.filter((layer) => layer.type === "photo");
    const nextIndex = photoLayers.length
      ? Math.max(...photoLayers.map((layer) => layer.photoIndex || 0)) + 1
      : 1;

    const newLayer: Layer = {
      id: createId("photo"),
      type: "photo",
      name: `Photo ${nextIndex}`,
      photoIndex: nextIndex,
      visible: true,
      locked: false,
      x: 120,
      y: 120 + photoLayers.length * 320,
      width: 460,
      height: 460 / CAMERA_RATIO,
    };

    setLayers((prev) => [
      ...prev.filter((layer) => layer.type !== "frame"),
      newLayer,
      ...prev.filter((layer) => layer.type === "frame"),
    ]);
    setSelectedLayerId(newLayer.id);
    setSelectedLayerIds([newLayer.id]);
  }

  function updateLayer(layerId: string, data: Partial<Layer>) {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === layerId ? { ...layer, ...data } : layer))
    );
  }

  function updateSelectedLayer(data: Partial<Layer>) {
    if (!selectedLayer) return;
    updateLayer(selectedLayer.id, data);
  }

  function deleteSelectedLayer() {
    const idsToDelete = selectedLayerIds.length
      ? selectedLayerIds
      : selectedLayer
        ? [selectedLayer.id]
        : [];

    if (!idsToDelete.length) return;

    setLayers((prev) => prev.filter((layer) => !idsToDelete.includes(layer.id)));
    setSelectedLayerId("");
    setSelectedLayerIds([]);
  }

  function duplicateSelectedLayer() {
    const selected = layers.filter((layer) =>
      selectedLayerIds.length
        ? selectedLayerIds.includes(layer.id)
        : selectedLayer?.id === layer.id
    );

    if (!selected.length) return;

    let nextPhotoIndex = photoCount + 1;

    const copies: Layer[] = selected.map((layer) => {
      const isPhoto = layer.type === "photo";
      const copy: Layer = {
        ...layer,
        id: createId(layer.type),
        name: isPhoto ? `Photo ${nextPhotoIndex}` : `${layer.name} Copy`,
        photoIndex: isPhoto ? nextPhotoIndex : layer.photoIndex,
        x: layer.x + 40,
        y: layer.y + 40,
        locked: layer.type === "frame" ? true : layer.locked,
      };

      if (isPhoto) nextPhotoIndex += 1;
      return copy;
    });

    setLayers((prev) => [
      ...prev.filter((layer) => layer.type !== "frame"),
      ...copies.filter((layer) => layer.type !== "frame"),
      ...prev.filter((layer) => layer.type === "frame"),
      ...copies.filter((layer) => layer.type === "frame"),
    ]);
    setSelectedLayerId(copies[0]?.id || "");
    setSelectedLayerIds(copies.map((layer) => layer.id));
  }

  function copyLayer() {
    const selected = layers.filter((layer) =>
      selectedLayerIds.length
        ? selectedLayerIds.includes(layer.id)
        : selectedLayer?.id === layer.id
    );

    if (!selected.length) return;

    const cloned = JSON.parse(JSON.stringify(selected)) as Layer[];
    setCopiedLayers(cloned);
    localStorage.setItem("miori-create-multi-copy", JSON.stringify(cloned));
  }

  function pasteLayer() {
    const raw = localStorage.getItem("miori-create-multi-copy");
    const copied: Layer[] = raw
      ? JSON.parse(raw)
      : copiedLayers;

    if (!copied.length) return;

    let nextPhotoIndex = photoCount + 1;

    const pasted = copied.map((layer) => {
      const isPhoto = layer.type === "photo";
      const nextLayer: Layer = {
        ...layer,
        id: createId(layer.type),
        name: isPhoto ? `Photo ${nextPhotoIndex}` : `${layer.name} Copy`,
        photoIndex: isPhoto ? nextPhotoIndex : layer.photoIndex,
        x: layer.x + 40,
        y: layer.y + 40,
        visible: true,
        locked: layer.type === "frame" ? true : false,
      };

      if (isPhoto) nextPhotoIndex += 1;
      return nextLayer;
    });

    setLayers((prev) => [
      ...prev.filter((layer) => layer.type !== "frame"),
      ...pasted.filter((layer) => layer.type !== "frame"),
      ...prev.filter((layer) => layer.type === "frame"),
      ...pasted.filter((layer) => layer.type === "frame"),
    ]);

    setSelectedLayerId(pasted[0]?.id || "");
    setSelectedLayerIds(pasted.map((layer) => layer.id));
  }

  function selectLayer(layerId: string, multi = false) {
    setSelectedLayerIds((prev) => {
      if (multi) {
        return prev.includes(layerId)
          ? prev.filter((id) => id !== layerId)
          : [...prev, layerId];
      }

      return [layerId];
    });

    setSelectedLayerId(layerId);
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

    const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;

    if (isMultiSelect) {
      selectLayer(layer.id, true);
      return;
    }

    const activeSelection = selectedLayerIds.includes(layer.id)
      ? selectedLayerIds
      : [layer.id];

    setSelectedLayerId(layer.id);
    setSelectedLayerIds(activeSelection);

    const scale = getScale();
    const startX = e.clientX;
    const startY = e.clientY;

    const originalPositions = layers
      .filter((item) => activeSelection.includes(item.id))
      .reduce<Record<string, { x: number; y: number }>>((acc, item) => {
        acc[item.id] = { x: item.x, y: item.y };
        return acc;
      }, {});

    function onMove(moveEvent: PointerEvent) {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      setLayers((prev) =>
        prev.map((item) => {
          const original = originalPositions[item.id];

          if (!original || item.locked || item.type === "frame") {
            return item;
          }

          return {
            ...item,
            x: Math.round(original.x + dx),
            y: Math.round(original.y + dy),
          };
        })
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

      updateLayer(layer.id, {
        width: Math.round(nextWidth),
        height: Math.round(nextHeight),
      });
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  async function detectTransparentSlotsFromImage(src: string) {
    return await new Promise<Layer[]>((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous";

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = FRAME_WIDTH;
        canvas.height = FRAME_HEIGHT;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve([]);
          return;
        }

        ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
        ctx.drawImage(image, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);

        let imageData: ImageData;
        try {
          imageData = ctx.getImageData(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
        } catch (error) {
          console.error("AUTO_DETECT_CANVAS_ERROR:", error);
          resolve([]);
          return;
        }

        const data = imageData.data;
        const step = 8;
        const cols = Math.ceil(FRAME_WIDTH / step);
        const rows = Math.ceil(FRAME_HEIGHT / step);
        const visited = new Uint8Array(cols * rows);

        function cellKey(cx: number, cy: number) {
          return cy * cols + cx;
        }

        function isEmptyCell(cx: number, cy: number) {
          const startX = cx * step;
          const startY = cy * step;
          let emptyCount = 0;
          let total = 0;

          for (let y = startY; y < Math.min(startY + step, FRAME_HEIGHT); y += 2) {
            for (let x = startX; x < Math.min(startX + step, FRAME_WIDTH); x += 2) {
              const index = (y * FRAME_WIDTH + x) * 4;
              const red = data[index];
              const green = data[index + 1];
              const blue = data[index + 2];
              const alpha = data[index + 3];

              const isTransparent = alpha < 45;
              const isWhiteSlot = alpha > 220 && red > 238 && green > 238 && blue > 238;

              if (isTransparent || isWhiteSlot) emptyCount += 1;
              total += 1;
            }
          }

          return total > 0 && emptyCount / total > 0.82;
        }

        const boxes: Array<{ x: number; y: number; width: number; height: number }> = [];

        for (let cy = 0; cy < rows; cy++) {
          for (let cx = 0; cx < cols; cx++) {
            const startKey = cellKey(cx, cy);
            if (visited[startKey] || !isEmptyCell(cx, cy)) continue;

            const queue: Array<[number, number]> = [[cx, cy]];
            visited[startKey] = 1;

            let minX = cx;
            let maxX = cx;
            let minY = cy;
            let maxY = cy;
            let count = 0;

            while (queue.length) {
              const [qx, qy] = queue.shift()!;
              count += 1;
              minX = Math.min(minX, qx);
              maxX = Math.max(maxX, qx);
              minY = Math.min(minY, qy);
              maxY = Math.max(maxY, qy);

              const neighbors = [
                [qx + 1, qy],
                [qx - 1, qy],
                [qx, qy + 1],
                [qx, qy - 1],
              ];

              for (const [nx, ny] of neighbors) {
                if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;

                const nextKey = cellKey(nx, ny);
                if (visited[nextKey] || !isEmptyCell(nx, ny)) continue;

                visited[nextKey] = 1;
                queue.push([nx, ny]);
              }
            }

            const box = {
              x: minX * step,
              y: minY * step,
              width: (maxX - minX + 1) * step,
              height: (maxY - minY + 1) * step,
            };

            const area = box.width * box.height;
            const touchesEdge =
              box.x <= 12 ||
              box.y <= 12 ||
              box.x + box.width >= FRAME_WIDTH - 12 ||
              box.y + box.height >= FRAME_HEIGHT - 12;

            if (
              count > 80 &&
              area > 22000 &&
              box.width > 120 &&
              box.height > 120 &&
              !touchesEdge
            ) {
              boxes.push(box);
            }
          }
        }

        const detectedBoxes = boxes
          .sort((a, b) => b.width * b.height - a.width * a.height)
          .filter((box, index, arr) => {
            return !arr.some((other, otherIndex) => {
              if (otherIndex >= index) return false;

              const overlapX = Math.max(
                0,
                Math.min(box.x + box.width, other.x + other.width) - Math.max(box.x, other.x)
              );
              const overlapY = Math.max(
                0,
                Math.min(box.y + box.height, other.y + other.height) - Math.max(box.y, other.y)
              );
              const overlapArea = overlapX * overlapY;
              const boxArea = box.width * box.height;

              return overlapArea / boxArea > 0.55;
            });
          })
          .sort((a, b) => a.y - b.y || a.x - b.x)
          .slice(0, 12);

        const detectedLayers: Layer[] = detectedBoxes.map((box, index) => ({
          id: createId("photo"),
          type: "photo",
          name: `Photo ${index + 1}`,
          photoIndex: index + 1,
          visible: true,
          locked: false,
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
        }));

        resolve(detectedLayers);
      };

      image.onerror = () => resolve([]);
      image.src = src;
    });
  }

  async function autoDetectPhotoSlots() {
    const frameLayer = layers.find((layer) => layer.type === "frame" && layer.src);

    if (!frameLayer?.src && !frameDetectSource) {
      alert("Upload frame PNG dulu, lalu klik Auto Detect Slot.");
      return;
    }

    const detectedLayers = await detectTransparentSlotsFromImage(
      frameDetectSource || frameLayer?.src || ""
    );

    if (!detectedLayers.length) {
      alert("Belum ketemu slot kosong. Pakai PNG transparan, atau area slot harus putih polos.");
      return;
    }

    setLayers((prev) => [
      ...prev.filter((layer) => layer.type !== "photo" && layer.type !== "frame"),
      ...detectedLayers,
      ...prev.filter((layer) => layer.type === "frame"),
    ]);

    setSelectedLayerId(detectedLayers[0]?.id || "");
    setSelectedLayerIds(detectedLayers.map((layer) => layer.id));
  }


  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
      const isTyping =
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        (document.activeElement as HTMLElement | null)?.isContentEditable;

      if (isTyping) return;

      const step = e.shiftKey ? 10 : 1;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copyLayer();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteLayer();
        return;
      }

      if (e.key === "Delete") {
        e.preventDefault();
        deleteSelectedLayer();
        return;
      }

      const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

      if (arrowKeys.includes(e.key) && selectedLayerIds.length) {
        e.preventDefault();

        setLayers((prev) =>
          prev.map((layer) => {
            if (
              !selectedLayerIds.includes(layer.id) ||
              layer.locked ||
              layer.type === "frame"
            ) {
              return layer;
            }

            if (e.key === "ArrowUp") return { ...layer, y: layer.y - step };
            if (e.key === "ArrowDown") return { ...layer, y: layer.y + step };
            if (e.key === "ArrowLeft") return { ...layer, x: layer.x - step };
            if (e.key === "ArrowRight") return { ...layer, x: layer.x + step };

            return layer;
          })
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [layers, selectedLayerIds, copiedLayers, selectedLayer]);

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
      const response = await fetch("/api/frames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          layoutType,
          backgroundColor,
          thumbnail,
          isActive: true,
          layers: orderedLayers.map((layer, index) => ({ ...layer, zIndex: index })),
        }),
      });

      const result = await response.json();
      if (!result.success) {
        alert(result.message || "Gagal menyimpan frame.");
        return;
      }

      router.push("/admin/frames");
      router.refresh();
    } catch (error) {
      console.error("SAVE_FRAME_ERROR:", error);
      alert("Gagal menyimpan frame.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] text-[#101828]">
      <div className="grid h-[calc(100vh-92px)] grid-cols-[240px_minmax(520px,1fr)_350px_360px] gap-5 overflow-hidden">
        <aside className="flex min-h-0 flex-col rounded-[32px] bg-white p-5 shadow-xl">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4263FF] text-2xl text-white">
                📸
              </div>
              <div>
                <h2 className="text-xl font-black">Miori Booth</h2>
                <p className="text-xs font-bold text-slate-400">Frame Creator</p>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <button
                onClick={() => router.push("/admin/frames")}
                className="flex h-12 w-full items-center rounded-2xl px-4 text-left font-black text-slate-500 hover:bg-[#F6F7FF]"
              >
                ← Library
              </button>
              <button className="flex h-12 w-full items-center rounded-2xl bg-[#4263FF] px-4 text-left font-black text-white">
                Frame Editor
              </button>
              <button
                onClick={saveFrame}
                disabled={isSaving}
                className="flex h-12 w-full items-center rounded-2xl bg-green-50 px-4 text-left font-black text-green-700 disabled:opacity-50"
              >
                {isSaving ? "Menyimpan..." : "Simpan Frame"}
              </button>
            </div>
          </div>

          <div className="mt-auto rounded-3xl bg-[#F6F7FF] p-4">
            <p className="text-xs font-black uppercase text-slate-400">Status</p>
            <p className="mt-2 text-sm font-black text-red-500">● Belum Disimpan</p>
            <p className="mt-3 text-xs font-bold leading-relaxed text-slate-400">
              Shortcut: Ctrl + klik untuk multi select, Ctrl+C, Ctrl+V, Delete, Arrow.
            </p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col rounded-[32px] bg-white shadow-xl">
          <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">
            <div>
              <h2 className="text-xl font-black">WORKSPACE - {layoutType === "4R" ? "4R" : "PHOTO STRIP"}</h2>
              <p className="text-xs font-bold text-slate-400">1200 × 1800px</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-10 rounded-xl bg-[#4263FF] px-4 font-black text-white">↖</button>
              <button className="h-10 rounded-xl bg-[#F6F7FF] px-4 font-black">100%</button>
              <button className="h-10 rounded-xl bg-[#F6F7FF] px-4 font-black">⛶</button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#EEF1F7] p-8">
            <div
              ref={frameRef}
              onClick={() => { setSelectedLayerId(""); setSelectedLayerIds([]); }}
              className="relative aspect-[2/3] h-[78vh] max-h-[900px] overflow-hidden bg-white shadow-2xl"
              style={{ backgroundColor }}
            >
              {orderedLayers.map((layer) => {
                if (!layer.visible) return null;

                if (layer.type === "frame") {
                  return (
                    <img
                      key={layer.id}
                      src={layer.src}
                      alt="Frame"
                      draggable={false}
                      className="pointer-events-none absolute select-none object-cover"
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
                const selected = selectedLayerIds.includes(layer.id) || selectedLayerId === layer.id;

                return (
                  <div
                    key={layer.id}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => startDrag(e, layer)}
                    className={`absolute flex select-none items-center justify-center border-[4px] border-dashed text-2xl font-black ${
                      layer.locked ? "cursor-not-allowed" : "cursor-move"
                    } ${selected ? "outline outline-[5px] outline-[#4263FF]" : ""}`}
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
                        className="absolute bottom-[-14px] right-[-14px] h-10 w-10 rounded-full border-[6px] border-[#4263FF] bg-white"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex h-[52px] items-center justify-between border-t border-slate-100 px-6 text-sm font-black text-slate-500">
            <span>X: {selectedLayer ? Math.round(selectedLayer.x) : 0}</span>
            <span>Y: {selectedLayer ? Math.round(selectedLayer.y) : 0}</span>
            <span>W: {selectedLayer ? Math.round(selectedLayer.width) : FRAME_WIDTH}</span>
            <span>H: {selectedLayer ? Math.round(selectedLayer.height) : FRAME_HEIGHT}</span>
          </div>
        </section>

        <section className="min-w-0 space-y-5 overflow-y-auto pr-1">
          <div className="rounded-[28px] bg-white p-5 shadow-xl">
            <h2 className="text-lg font-black">FRAME INFO</h2>
            <div className="mt-4 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama frame" className="h-12 w-full rounded-2xl bg-[#F6F7FF] px-4 font-bold outline-none" />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-12 w-full rounded-2xl bg-[#F6F7FF] px-4 font-bold outline-none">
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={layoutType} onChange={(e) => setLayoutType(e.target.value as LayoutType)} className="h-12 w-full rounded-2xl bg-[#F6F7FF] px-4 font-bold outline-none">
                <option value="PHOTO_STRIP">2R / Photo Strip</option>
                <option value="4R">4R</option>
              </select>
              <input value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="h-12 w-full rounded-2xl bg-[#F6F7FF] px-4 font-bold outline-none" />
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-xl">
            <h2 className="text-lg font-black">TOOLS</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={addPhotoSlot} className="h-20 rounded-2xl bg-[#4263FF] font-black text-white">＋ Photo</button>
              <label className="flex h-20 cursor-pointer items-center justify-center rounded-2xl bg-[#FF7BC3] text-center font-black text-white">
                {isUploadingFrame ? "Uploading..." : "Upload Frame"}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => uploadFrameImage(e.target.files?.[0] || null)} />
              </label>
              <button onClick={autoDetectPhotoSlots} className="col-span-2 h-16 rounded-2xl bg-[#22C55E] font-black text-white">Auto Detect Slot</button>
              <button onClick={copyLayer} disabled={!selectedLayerIds.length && !selectedLayer} className="h-16 rounded-2xl bg-[#EEF1FF] font-black text-[#4263FF] disabled:opacity-40">Copy</button>
              <button onClick={pasteLayer} disabled={!copiedLayers.length} className="h-16 rounded-2xl bg-[#EEF1FF] font-black text-[#4263FF] disabled:opacity-40">Paste</button>
              <button onClick={duplicateSelectedLayer} disabled={!selectedLayerIds.length && !selectedLayer} className="h-16 rounded-2xl bg-[#EEF1FF] font-black text-[#4263FF] disabled:opacity-40">Duplicate</button>
              <button onClick={deleteSelectedLayer} disabled={!selectedLayerIds.length && !selectedLayer} className="h-16 rounded-2xl bg-red-50 font-black text-red-500 disabled:opacity-40">Delete</button>
              <button onClick={() => selectedLayer && toggleLock(selectedLayer.id)} disabled={!selectedLayer || selectedLayer.type === "frame"} className="h-16 rounded-2xl bg-[#EEF1FF] font-black text-[#4263FF] disabled:opacity-40">{selectedLayer?.locked ? "Unlock" : "Lock"}</button>
              <button onClick={() => setKeepAspectRatio((prev) => !prev)} className={`h-16 rounded-2xl font-black ${keepAspectRatio ? "bg-[#4263FF] text-white" : "bg-[#F6F7FF] text-slate-600"}`}>Aspect</button>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-xl">
            <h2 className="text-lg font-black">SELECTED LAYER</h2>
            {selectedLayer ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-[#F6F7FF] p-4">
                  <p className="font-black">{selectedLayer.name}</p>
                  <p className="text-xs font-bold text-slate-400">ID: {selectedLayer.id}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(["x", "y", "width", "height"] as const).map((key) => (
                    <div key={key}>
                      <p className="mb-1 text-xs font-black text-slate-400">{key.toUpperCase()}</p>
                      <input type="number" value={Math.round(selectedLayer[key] || 0)} onChange={(e) => updateSelectedLayer({ [key]: Number(e.target.value) } as Partial<Layer>)} className="h-11 w-full rounded-xl bg-[#F6F7FF] px-3 font-bold outline-none" />
                    </div>
                  ))}
                </div>
                {selectedLayer.type === "photo" && (
                  <div className="rounded-2xl bg-[#F6F7FF] p-4">
                    <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">
                      Nomor Slot Foto
                    </p>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={selectedLayer.photoIndex || 1}
                      onChange={(e) => {
                        const nextIndex = Math.max(1, Number(e.target.value || 1));
                        updateSelectedLayer({
                          photoIndex: nextIndex,
                          name: `Photo ${nextIndex}`,
                        });
                      }}
                      className="h-12 w-full rounded-xl bg-white px-4 text-lg font-black outline-none"
                    />
                    <div className="mt-3 grid grid-cols-6 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((slotNumber) => (
                        <button
                          key={slotNumber}
                          type="button"
                          onClick={() =>
                            updateSelectedLayer({
                              photoIndex: slotNumber,
                              name: `Photo ${slotNumber}`,
                            })
                          }
                          className={`h-9 rounded-xl text-sm font-black ${
                            selectedLayer.photoIndex === slotNumber
                              ? "bg-[#4263FF] text-white"
                              : "bg-white text-slate-500"
                          }`}
                        >
                          {slotNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm font-bold text-slate-400">Pilih layer dulu.</p>
            )}
          </div>
        </section>

        <section className="flex min-w-0 flex-col rounded-[32px] bg-white shadow-xl">
          <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5">
            <h2 className="text-lg font-black">LAYER ({layers.length})</h2>
            <button onClick={deleteSelectedLayer} disabled={!selectedLayerIds.length && !selectedLayer} className="rounded-xl bg-red-50 px-3 py-2 font-black text-red-500 disabled:opacity-40">🗑</button>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
            {[...orderedLayers].reverse().map((layer) => {
              const active = selectedLayerIds.includes(layer.id) || selectedLayerId === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={(e) => selectLayer(layer.id, e.ctrlKey || e.metaKey || e.shiftKey)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left font-black transition ${
                    active ? "border-[#4263FF] bg-[#EEF1FF] text-[#4263FF]" : "border-slate-100 bg-white text-slate-600"
                  }`}
                >
                  <span className="cursor-grab text-slate-400">⋮⋮</span>
                  <span onClick={(e) => { e.stopPropagation(); toggleVisible(layer.id); }} className="text-lg">{layer.visible ? "👁" : "🚫"}</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6F7FF] text-xs">{layer.type === "photo" ? `#${layer.photoIndex}` : "PNG"}</span>
                  <span className="min-w-0 flex-1 truncate">{layer.name}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLock(layer.id);
                    }}
                    className={`rounded-xl px-2 py-1 text-sm ${
                      layer.locked
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}
                    title={layer.locked ? "Layer terkunci" : "Layer bisa diedit"}
                  >
                    {layer.locked ? "LOCKED" : "OPEN"}
                  </span>
                </button>
              );
            })}
            {!layers.length && (
              <div className="flex h-full items-center justify-center text-center text-sm font-bold text-slate-400">
                Belum ada layer.<br />Tambahkan photo slot atau upload frame.
              </div>
            )}
          </div>
          <div className="border-t border-slate-100 p-5">
            <button onClick={saveFrame} disabled={isSaving} className="h-14 w-full rounded-2xl bg-[#4263FF] font-black text-white disabled:opacity-50">
              {isSaving ? "MENYIMPAN..." : "SIMPAN FRAME"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
