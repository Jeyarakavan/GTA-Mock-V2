import AsyncStorage from '@react-native-async-storage/async-storage';
import { SAVE_KEY, SAVE_VERSION } from './config';
import type { MissionId, Quality } from './types';

export interface SaveData {
  version: number;
  cash: number;
  completedMissions: MissionId[];
  volume: number;
  muted: boolean;
  quality: Quality;
  resume: { x: number; z: number } | null;
  savedAt: number;
}

export const DEFAULT_SAVE: SaveData = {
  version: SAVE_VERSION,
  cash: 0,
  completedMissions: [],
  volume: 0.7,
  muted: false,
  quality: 'high',
  resume: null,
  savedAt: 0,
};

const VALID_MISSIONS: MissionId[] = ['delivery', 'checkpoint', 'heat'];

const clamp = (v: number, lo: number, hi: number) =>
  Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo;

export function validateSave(raw: unknown): SaveData | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== SAVE_VERSION) return null;

  const missions = Array.isArray(o.completedMissions)
    ? (o.completedMissions.filter(
        (m): m is MissionId =>
          typeof m === 'string' && VALID_MISSIONS.includes(m as MissionId),
      ) as MissionId[])
    : [];

  let resume: SaveData['resume'] = null;
  const r = o.resume as Record<string, unknown> | null | undefined;
  if (r && typeof r === 'object') {
    const x = Number(r.x);
    const z = Number(r.z);
    if (Number.isFinite(x) && Number.isFinite(z)) resume = { x, z };
  }

  return {
    version: SAVE_VERSION,
    cash: Math.floor(clamp(Number(o.cash), 0, 9_999_999)),
    completedMissions: [...new Set(missions)],
    volume: clamp(Number(o.volume), 0, 1),
    muted: o.muted === true,
    quality: o.quality === 'low' ? 'low' : 'high',
    resume,
    savedAt: Number.isFinite(Number(o.savedAt)) ? Number(o.savedAt) : 0,
  };
}

/** In-memory mirror so gameplay code can read synchronously after hydrate. */
let cache: SaveData | null = null;
let hydrated = false;

export function isSaveHydrated(): boolean {
  return hydrated;
}

export async function hydrateSave(): Promise<void> {
  try {
    const text = await AsyncStorage.getItem(SAVE_KEY);
    cache = text ? validateSave(JSON.parse(text)) : null;
  } catch {
    cache = null;
  }
  hydrated = true;
}

export function loadSave(): SaveData | null {
  return cache;
}

export function writeSave(data: SaveData): boolean {
  const payload: SaveData = {
    ...data,
    version: SAVE_VERSION,
    savedAt: Date.now(),
  };
  cache = payload;
  void AsyncStorage.setItem(SAVE_KEY, JSON.stringify(payload)).catch(() => {});
  return true;
}

export async function clearSaveAsync(): Promise<void> {
  cache = null;
  try {
    await AsyncStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export function clearSave(): void {
  void clearSaveAsync();
}

export function hasValidSave(): boolean {
  const s = loadSave();
  return !!s && (s.cash > 0 || s.completedMissions.length > 0 || !!s.resume);
}
