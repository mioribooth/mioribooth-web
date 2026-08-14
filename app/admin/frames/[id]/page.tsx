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
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selectedLayerId),
    [layers, selectedLayerId]
  );

  const orderedLayers = useMemo(() => {
    const photoLayers = layers.filter((layer) => layer.type !== "frame");
    const frameLayers = layers.filter((layer) => layer.type === "frame");
    return [...photoLayers, ...frameLayers];
  }, [layers]);

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
        setSelectedLayerIds(frame.layers?.[0]?.id ? [frame.layers[0].id] : []);

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
    setSelectedLayerIds([newLayer.id]);
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
    const idsToDelete = selectedLayerIds.length
      ? selectedLayerIds
      : selectedLayer
        ? [selectedLayer.id]
        : [];

    if (!idsToDelete.length) return;

    setLayersWithHistory((prev) =>
      prev.filter((layer) => !idsToDelete.includes(layer.id))
    );

    setSelectedLayerId("");
    setSelectedLayerIds([]);
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
    const selected = layers.filter((layer) =>
      selectedLayerIds.length
        ? selectedLayerIds.includes(layer.id)
        : selectedLayer?.id === layer.id
    );

    if (!selected.length) return;

    setCopiedLayer(JSON.parse(JSON.stringify(selected[0])));
    localStorage.setItem("miori-multi-copy", JSON.stringify(selected));
  }

  function pasteLayer() {
    const raw = localStorage.getItem("miori-multi-copy");

    const copiedLayers: Layer[] = raw
      ? JSON.parse(raw)
      : copiedLayer
        ? [copiedLayer]
        : [];

    if (!copiedLayers.length) return;

    const pastedLayers: Layer[] = copiedLayers.map((layer) => ({
      ...layer,
      id: createId(layer.type),
      x: layer.x + 60,
      y: layer.y + 60,
      visible: true,
      locked: layer.type === "frame" ? true : false,
    }));

    setLayersWithHistory((prev) => [...prev, ...pastedLayers]);
    setSelectedLayerId(pastedLayers[0]?.id || "");
    setSelectedLayerIds(pastedLayers.map((layer) => layer.id));
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

  function startDrag(e: React.PointerEvent, layer: Layer) {
    if (layer.locked || layer.type === "frame") return;

    e.preventDefault();
    e.stopPropagation();

    const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;

    if (isMultiSelect) {
      selectLayer(layer.id, true);
      return;
    }

    const selectedIds = selectedLayerIds.includes(layer.id)
      ? selectedLayerIds
      : [layer.id];

    setSelectedLayerId(layer.id);
    setSelectedLayerIds(selectedIds);

    markDirty();
    pushHistory();

    const scale = getScale();
    const startX = e.clientX;
    const startY = e.clientY;

    const originalPositions = layers
      .filter((item) => selectedIds.includes(item.id))
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

        const selected = layers.filter((layer) =>
          selectedLayerIds.includes(layer.id)
        );

        if (selected.length) {
          setCopiedLayer(JSON.parse(JSON.stringify(selected[0])));
          localStorage.setItem(
            "miori-multi-copy",
            JSON.stringify(selected)
          );
        }

        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        e.preventDefault();

        const raw = localStorage.getItem("miori-multi-copy");
        if (!raw) return;

        const copiedLayers: Layer[] = JSON.parse(raw);

        const nextLayers = copiedLayers.map((layer) => ({
          ...layer,
          id: createId(layer.type),
          x: layer.x + 40,
          y: layer.y + 40,
        }));

        setLayersWithHistory((prev) => [...prev, ...nextLayers]);
        setSelectedLayerIds(nextLayers.map((layer) => layer.id));
        setSelectedLayerId(nextLayers[0]?.id || "");
        return;
      }

      if (e.key === "Delete") {
        e.preventDefault();

        if (!selectedLayerIds.length) return;

        setLayersWithHistory((prev) =>
          prev.filter((layer) => !selectedLayerIds.includes(layer.id))
        );

        setSelectedLayerIds([]);
        setSelectedLayerId("");
        return;
      }

      const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

      if (arrowKeys.includes(e.key) && selectedLayerIds.length) {
        e.preventDefault();
        markDirty();

        setLayers((prev) =>
          prev.map((layer) => {
            if (
              !selectedLayerIds.includes(layer.id) ||
              layer.locked ||
              layer.type === "frame"
            ) {
              return layer;
            }

            if (e.key === "ArrowUp") {
              return { ...layer, y: layer.y - step };
            }

            if (e.key === "ArrowDown") {
              return { ...layer, y: layer.y + step };
            }

            if (e.key === "ArrowLeft") {
              return { ...layer, x: layer.x - step };
            }

            if (e.key === "ArrowRight") {
              return { ...layer, x: layer.x + step };
            }

            return layer;
          })
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [layers, selectedLayerIds]);


  async function detectTransparentSlotsFromImage(src: string) {
    return await new Promise<Layer[]>((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous";

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = FRAME_WIDTH;
        canvas.height = FRAME_HEIGHT;

        const ctx = canvas.getContext("2d");
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
          alert("Frame tidak bisa dibaca otomatis karena gambar dari server belum mengizinkan scan. Coba upload PNG lagi lalu klik Auto Detect Slot.");
          resolve([]);
          return;
        }

        const data = imageData.data;
        const step = 8;
        const cols = Math.ceil(FRAME_WIDTH / step);
        const rows = Math.ceil(FRAME_HEIGHT / step);
        const visited = new Uint8Array(cols * rows);

        function key(cx: number, cy: number) {
          return cy * cols + cx;
        }

        function isTransparentCell(cx: number, cy: number) {
          const startX = cx * step;
          const startY = cy * step;
          let transparentCount = 0;
          let total = 0;

          for (let y = startY; y < Math.min(startY + step, FRAME_HEIGHT); y += 2) {
            for (let x = startX; x < Math.min(startX + step, FRAME_WIDTH); x += 2) {
              const index = (y * FRAME_WIDTH + x) * 4;
              const alpha = data[index + 3];

              if (alpha < 45) transparentCount += 1;
              total += 1;
            }
          }

          return total > 0 && transparentCount / total > 0.72;
        }

        const boxes: Array<{ x: number; y: number; width: number; height: number }> = [];

        for (let cy = 0; cy < rows; cy++) {
          for (let cx = 0; cx < cols; cx++) {
            const startKey = key(cx, cy);
            if (visited[startKey] || !isTransparentCell(cx, cy)) continue;

            const queue: Array<[number, number]> = [[cx, cy]];
            visited[startKey] = 1;

            let minX = cx;
            let maxX = cx;
            let minY = cy;
            let maxY = cy;

            while (queue.length) {
              const [qx, qy] = queue.shift()!;

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

                const nextKey = key(nx, ny);
                if (visited[nextKey] || !isTransparentCell(nx, ny)) continue;

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
              box.x <= 16 ||
              box.y <= 16 ||
              box.x + box.width >= FRAME_WIDTH - 16 ||
              box.y + box.height >= FRAME_HEIGHT - 16;

            if (area > 20000 && box.width > 110 && box.height > 110 && !touchesEdge) {
              boxes.push(box);
            }
          }
        }

        const detectedLayers = boxes
          .sort((a, b) => a.y - b.y || a.x - b.x)
          .filter((box, index, arr) => {
            return !arr.some((other, otherIndex) => {
              if (otherIndex === index) return false;

              const inside =
                box.x >= other.x &&
                box.y >= other.y &&
                box.x + box.width <= other.x + other.width &&
                box.y + box.height <= other.y + other.height;

              return inside && other.width * other.height > box.width * box.height;
            });
          })
          .slice(0, 12)
          .map((box, index) => ({
            id: createId("photo"),
            type: "photo" as const,
            name: `Foto ${index + 1}`,
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

    if (!frameLayer?.src) {
      alert("Upload frame PNG transparan dulu, lalu klik Auto Detect Slot.");
      return;
    }

    const detectedLayers = await detectTransparentSlotsFromImage(frameLayer.src);

    if (!detectedLayers.length) {
      alert("Slot belum terdeteksi. Pastikan area foto di PNG frame benar-benar transparan, bukan putih solid.");
      return;
    }

    setLayersWithHistory((prev) => [
      ...prev.filter((layer) => layer.type !== "photo"),
      ...detectedLayers,
    ]);

    setSelectedLayerId(detectedLayers[0]?.id || "");
    setSelectedLayerIds(detectedLayers.map((layer) => layer.id));
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
          layers: orderedLayers.map((layer, index) => ({
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
    <div className="min-h-screen overflow-hidden bg-[#F5F6FA] text-[#101828]">
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

      <div className="grid h-screen grid-cols-[240px_minmax(360px,1fr)_360px_360px] gap-6 p-5">
        <aside className="flex min-h-0 flex-col rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4263FF] text-2xl text-white">
                📸
              </div>
              <div>
                <h2 className="text-xl font-black">Miori Booth</h2>
                <p className="text-xs font-bold text-slate-400">Frame Admin</p>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <button
                onClick={leavePage}
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
              <button
                onClick={deleteFrame}
                className="flex h-12 w-full items-center rounded-2xl bg-red-50 px-4 text-left font-black text-red-500"
              >
                Hapus Frame
              </button>
            </div>
          </div>

          <div className="mt-auto rounded-3xl bg-[#F6F7FF] p-4">
            <p className="text-xs font-black uppercase text-slate-400">Status</p>
            <p className={`mt-2 text-sm font-black ${isDirty ? "text-red-500" : "text-green-600"}`}>
              {isDirty ? "● Belum Disimpan" : "● Tersimpan"}
            </p>
            <p className="mt-3 text-xs font-bold leading-relaxed text-slate-400">
              Shortcut: Ctrl + klik untuk multi select, Ctrl+C, Ctrl+V, Delete, Arrow.
            </p>
          </div>
        </aside>

        <section className="flex min-h-0 flex-col rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h1 className="text-2xl font-black">Workspace 4R</h1>
              <p className="mt-1 text-sm font-bold text-slate-400">Canvas 1200 × 1800 px</p>
            </div>

            <div className="flex gap-2">
              <button onClick={undo} className="h-11 rounded-2xl bg-[#F6F7FF] px-4 font-black text-slate-600">UNDO</button>
              <button onClick={redo} className="h-11 rounded-2xl bg-[#F6F7FF] px-4 font-black text-slate-600">REDO</button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#EAEDF5] p-8">
            <div
              ref={frameRef}
              className="relative mx-auto aspect-[2/3] w-full max-h-[calc(100vh-170px)] max-w-full overflow-hidden bg-white shadow-2xl"
              style={{ backgroundColor }}
              onClick={() => {
                setSelectedLayerId("");
                setSelectedLayerIds([]);
              }}
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
                    onPointerDown={(e) => startDrag(e, layer)}
                    onClick={(e) => e.stopPropagation()}
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

          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-sm font-black text-slate-400">
            <span>Selected: {selectedLayerIds.length}</span>
            <span>W: {FRAME_WIDTH} &nbsp; H: {FRAME_HEIGHT}</span>
          </div>
        </section>

        <section className="flex min-h-0 flex-col gap-5 overflow-y-auto">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black uppercase">Frame Info</h2>

            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Nama frame"
              className="mt-5 h-12 w-full rounded-2xl bg-[#F6F7FF] px-4 font-bold outline-none"
            />

            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setIsDirty(true);
                }}
                className="h-12 w-full rounded-2xl bg-[#F6F7FF] px-4 font-bold outline-none"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              <button onClick={addCategory} className="h-12 rounded-2xl bg-[#4263FF] px-4 font-black text-white">+</button>
            </div>

            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Kategori baru"
              className="mt-3 h-11 w-full rounded-2xl bg-[#F6F7FF] px-4 font-bold outline-none"
            />

            <select
              value={layoutType}
              onChange={(e) => {
                setLayoutType(e.target.value as LayoutType);
                setIsDirty(true);
              }}
              className="mt-3 h-12 w-full rounded-2xl bg-[#F6F7FF] px-4 font-bold outline-none"
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
              className="mt-3 h-12 w-full rounded-2xl bg-[#F6F7FF] px-4 font-bold outline-none"
            />

            <button
              onClick={() => {
                setIsActive((prev) => !prev);
                setIsDirty(true);
              }}
              className={`mt-3 h-12 w-full rounded-full font-black ${
                isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}
            >
              {isActive ? "ACTIVE" : "DRAFT"}
            </button>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black uppercase">Tools</h2>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={addPhotoSlot} className="h-12 rounded-2xl bg-[#4263FF] font-black text-white">+ PHOTO</button>

              <label className="flex h-12 cursor-pointer items-center justify-center rounded-2xl bg-[#FF7BC3] font-black text-white">
                {isUploadingFrame ? "UP..." : "PNG"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => uploadFrameImage(e.target.files?.[0] || null)}
                />
              </label>

              <button
                onClick={autoDetectPhotoSlots}
                className="col-span-2 h-12 rounded-2xl bg-green-500 font-black text-white shadow-sm hover:bg-green-600"
              >
                AUTO DETECT SLOT
              </button>

              <button onClick={copyLayer} className="h-12 rounded-2xl bg-[#EEF1FF] font-black text-[#4263FF]">COPY</button>
              <button onClick={pasteLayer} className="h-12 rounded-2xl bg-[#EEF1FF] font-black text-[#4263FF]">PASTE</button>
              <button onClick={duplicateSelectedLayer} className="col-span-2 h-12 rounded-2xl bg-[#EEF1FF] font-black text-[#4263FF]">DUPLICATE</button>
              <button onClick={renumberPhotoLayers} className="col-span-2 h-12 rounded-2xl bg-[#F3EEFF] font-black text-[#7657FF]">AUTO RENUMBER FOTO</button>
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

          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black uppercase">Selected Layer</h2>

            {selectedLayer ? (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {(["x", "y", "width", "height"] as const).map((key) => (
                  <div key={key}>
                    <p className="mb-1 text-xs font-black text-slate-400">{key.toUpperCase()}</p>
                    <input
                      type="number"
                      value={Math.round(selectedLayer[key] || 0)}
                      onChange={(e) =>
                        updateSelectedLayer({ [key]: Number(e.target.value) } as Partial<Layer>)
                      }
                      className="h-11 w-full rounded-xl bg-[#F6F7FF] px-3 font-bold outline-none"
                    />
                  </div>
                ))}

                {selectedLayer.type === "photo" && (
                  <div className="col-span-2 rounded-2xl bg-[#F6F7FF] p-4">
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
                          name: `Foto ${nextIndex}`,
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
                              name: `Foto ${slotNumber}`,
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

                <button onClick={deleteSelectedLayer} className="col-span-2 h-12 rounded-full bg-red-50 font-black text-red-500">HAPUS LAYER</button>
              </div>
            ) : (
              <p className="mt-5 font-bold text-slate-400">Pilih slot foto dulu.</p>
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-xl font-black uppercase">Layer</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">Drag layer untuk ubah urutan</p>
            </div>
            <div className="rounded-full bg-[#F6F7FF] px-3 py-1 text-xs font-black text-slate-500">
              {layers.length}
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
            {[...orderedLayers].reverse().map((layer) => (
              <div
                key={layer.id}
                draggable
                onDragStart={() => {
                  dragLayerRef.current = layer.id;
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragLayerRef.current) moveLayer(dragLayerRef.current, layer.id);
                }}
                onClick={(e) => selectLayer(layer.id, e.ctrlKey || e.metaKey || e.shiftKey)}
                className={`flex w-full cursor-grab items-center gap-3 rounded-2xl border px-4 py-3 text-left font-black transition ${
                  selectedLayerIds.includes(layer.id) || selectedLayerId === layer.id
                    ? "border-[#4263FF] bg-[#EEF1FF] text-[#4263FF]"
                    : "border-slate-100 bg-[#F8FAFC] text-slate-600 hover:bg-[#F6F7FF]"
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

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xs shadow-sm">
                  {layer.type === "photo" ? `#${layer.photoIndex}` : "PNG"}
                </div>

                <span className="min-w-0 flex-1 truncate">
                  {layer.name}
                  {layer.type === "photo" ? ` #${layer.photoIndex}` : ""}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock(layer.id);
                  }}
                  className={`rounded-xl px-2 py-1 text-xs font-black ${
                    layer.locked
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  }`}
                  title={layer.locked ? "Layer terkunci" : "Layer bisa diedit"}
                >
                  {layer.locked ? "LOCKED" : "OPEN"}
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 p-5">
            <button onClick={sendBackward} className="h-11 rounded-full bg-[#F6F7FF] font-black text-slate-600">SEND BACK</button>
            <button onClick={bringForward} className="h-11 rounded-full bg-[#F6F7FF] font-black text-slate-600">BRING FRONT</button>
          </div>
        </section>
      </div>
    </div>
  );
}
