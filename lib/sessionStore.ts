import { Redis } from "@upstash/redis";

export type BoothSession = {
  sessionId: string;
  framePhoto?: string;
  singlePhotos: string[];
  gif?: string;
  livePhotos: string[];
  createdAt: string;
};

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export function createSessionId() {
  const date = new Date();

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const time = Date.now().toString().slice(-6);

  return `MIORI-${y}${m}${d}-${time}`;
}