type FrameLayer = {
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

export type OnlineFrame = {
  id: string;
  frameKey?: string;
  name: string;
  category: string;
  layoutType?: "PHOTO_STRIP" | "4R";
  isActive?: boolean;
  backgroundColor: string;
  thumbnail?: string;
  layers: FrameLayer[];
};

const API_BASE_URL = "https://mioribooth-web.vercel.app/api";

const FRAME_DB_NAME = "miori-frame-db";
const FRAME_DB_VERSION = 1;
const FRAME_VERSION_KEY = "mioriFrameOnlineVersion";
const FRAME_LAST_SYNC_KEY = "mioriFrameLastSyncAt";
const FRAME_PRELOAD_CACHE_KEY = "mioriFramePreloadCache";

let isSyncing = false;
let syncTimer: number | null = null;

function openFrameDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FRAME_DB_NAME, FRAME_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("kv")) {
        db.createObjectStore("kv");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function setFrameDbValue(key: string, value: any) {
  const db = await openFrameDb();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    const store = tx.objectStore("kv");
    const request = store.put(value, key);

    request.onsuccess = () => {
      db.close();
      resolve();
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

function createUniqueId(prefix = "frame") {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}-${randomPart}`;
}

function normalizeFrames(frames: any[]): OnlineFrame[] {
  const usedIds = new Set<string>();
  const usedLayerIds = new Set<string>();

  return frames.map((frame) => {
    let frameId = String(frame.id || frame.frameKey || createUniqueId("frame"));

    if (usedIds.has(frameId)) {
      frameId = createUniqueId("frame");
    }

    usedIds.add(frameId);

    return {
      id: frameId,
      frameKey: frame.frameKey || frameId,
      name: frame.name || "Frame Tanpa Nama",
      category: frame.category || "CUSTOM",
      layoutType: frame.layoutType || "PHOTO_STRIP",
      isActive: frame.isActive ?? true,
      backgroundColor: frame.backgroundColor || "#FFFFFF",
      thumbnail: frame.thumbnail,
      layers: Array.isArray(frame.layers)
        ? frame.layers.map((layer: any, layerIndex: number) => {
            let layerId = String(
              layer.id || `${layer.type || "layer"}-${frameId}-${layerIndex}`
            );

            if (usedLayerIds.has(layerId)) {
              layerId = `${layer.type || "layer"}-${createUniqueId("layer")}`;
            }

            usedLayerIds.add(layerId);

            return {
              id: layerId,
              type: layer.type || "photo",
              name: layer.name || `Layer ${layerIndex + 1}`,
              visible: layer.visible ?? true,
              locked: layer.type === "frame" ? true : layer.locked ?? false,
              x: Number(layer.x || 0),
              y: Number(layer.y || 0),
              width: Number(layer.width || 100),
              height: Number(layer.height || 100),
              src: layer.src,
              photoIndex:
                layer.photoIndex ||
                (layer.type === "photo" ? layerIndex + 1 : undefined),
            };
          })
        : [],
    };
  });
}

async function fetchOnlineFrameVersion() {
  try {
    const response = await fetch(`${API_BASE_URL}/frames/version`, {
      cache: "no-store",
    });

    if (!response.ok) return null;

    const result = await response.json();

    if (!result.success) return null;

    return `${Number(result.total || 0)}-${Number(result.version || 0)}`;
  } catch (error) {
    console.error("FRAME_VERSION_SYNC_ERROR:", error);
    return null;
  }
}

async function fetchPublicFrames() {
  const response = await fetch(`${API_BASE_URL}/frames/public`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Fetch public frames failed: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Fetch public frames failed");
  }

  return normalizeFrames(result.frames || []).filter(
    (frame) => frame.isActive ?? true
  );
}

function getFrameAssetUrls(frames: OnlineFrame[]) {
  const urls = new Set<string>();

  frames.forEach((frame) => {
    if (frame.thumbnail?.startsWith("http")) {
      urls.add(frame.thumbnail);
    }

    frame.layers.forEach((layer) => {
      if (layer.src?.startsWith("http")) {
        urls.add(layer.src);
      }
    });
  });

  return Array.from(urls);
}

function loadImageForPreload(src: string) {
  return new Promise<boolean>((resolve) => {
    const image = new Image();

    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });
}

async function preloadFrameAssets(frames: OnlineFrame[]) {
  const urls = getFrameAssetUrls(frames);

  if (!urls.length) return;

  let cache: Record<string, number> = {};

  try {
    cache = JSON.parse(sessionStorage.getItem(FRAME_PRELOAD_CACHE_KEY) || "{}");
  } catch {
    cache = {};
  }

  const pendingUrls = urls.filter((url) => !cache[url]);

  await Promise.all(
    pendingUrls.map(async (url) => {
      const ok = await loadImageForPreload(url);
      if (ok) cache[url] = Date.now();
    })
  );

  sessionStorage.setItem(FRAME_PRELOAD_CACHE_KEY, JSON.stringify(cache));
}

export async function syncFramesInBackground(force = false) {
  if (isSyncing) return false;

  isSyncing = true;

  try {
    const onlineVersion = await fetchOnlineFrameVersion();

    if (!onlineVersion) return false;

    const currentVersion = localStorage.getItem(FRAME_VERSION_KEY) || "";

    if (!force && currentVersion === onlineVersion) {
      return false;
    }

    const frames = await fetchPublicFrames();

    await setFrameDbValue("frames", frames);
    await preloadFrameAssets(frames);

    localStorage.setItem(FRAME_VERSION_KEY, onlineVersion);
    localStorage.setItem(FRAME_LAST_SYNC_KEY, String(Date.now()));

    window.dispatchEvent(
      new CustomEvent("miori-frames-updated", {
        detail: {
          version: onlineVersion,
          total: frames.length,
        },
      })
    );

    return true;
  } catch (error) {
    console.error("SYNC_FRAMES_BACKGROUND_ERROR:", error);
    return false;
  } finally {
    isSyncing = false;
  }
}

export function startFrameAutoUpdate(intervalMs = 15000) {
  if (syncTimer) {
    window.clearInterval(syncTimer);
    syncTimer = null;
  }

  syncFramesInBackground(false);

  syncTimer = window.setInterval(() => {
    syncFramesInBackground(false);
  }, intervalMs);

  return () => {
    if (syncTimer) {
      window.clearInterval(syncTimer);
      syncTimer = null;
    }
  };
}

export function getFrameSyncInfo() {
  return {
    version: localStorage.getItem(FRAME_VERSION_KEY) || "",
    lastSyncAt: Number(localStorage.getItem(FRAME_LAST_SYNC_KEY) || 0),
    isSyncing,
  };
}
