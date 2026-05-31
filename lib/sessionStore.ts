import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

export type Layer = {
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

export type FrameTemplate = {
  id: string;
  name: string;
  category: string;
  layoutType?: "PHOTO_STRIP" | "4R";
  isActive?: boolean;
  backgroundColor: string;
  thumbnail?: string;
  layers: Layer[];
};

export type BoothSession = {
  sessionId: string;
  framePhoto?: string;
  singlePhotos: string[];
  gif?: string;
  livePhotos: string[];
  createdAt: string;
};