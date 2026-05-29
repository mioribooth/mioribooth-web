export type BoothSession = {
  sessionId: string;
  framePhoto?: string;
  singlePhotos: string[];
  gif?: string;
  livePhotos: string[];
  createdAt: string;
};

export const sessions = new Map<string, BoothSession>();

export function createSessionId() {
  const date = new Date();

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const time = Date.now().toString().slice(-6);

  return `MIORI-${y}${m}${d}-${time}`;
}