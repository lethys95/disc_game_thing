import { BEHAVIORS } from "#rules/abilities/index";

/**
 * Player preferences: animation speed, camera feel, hotkeys. Kept in this browser only; they
 * aren't part of a game or a save. Reading or writing storage can fail (private windows): the defaults apply.
 */

export const SPEED_ORDER = ["slow", "normal", "fast", "fastest"] as const;
export type AnimationSpeed = (typeof SPEED_ORDER)[number];

/** How long animations and the AI's pauses take, relative to normal. */
export const ANIMATION_SPEEDS: Readonly<Record<AnimationSpeed, { readonly label: string; readonly scale: number }>> = {
  slow: { label: "Slow", scale: 1.6 },
  normal: { label: "Normal", scale: 1 },
  fast: { label: "Fast", scale: 0.55 },
  fastest: { label: "Fastest", scale: 0.25 },
};

export interface SettingsData {
  readonly speed: AnimationSpeed;
  /** Camera rotation and zoom speed, as multipliers of the default. */
  readonly rotate: number;
  readonly zoom: number;
  /** Hotkeys the player changed, by ability id; the rest use their ability's own. */
  readonly hotkeys: Readonly<Record<string, string>>;
  /** Keys 1–9 pick the battle's ability buttons by position. */
  readonly slotKeys: boolean;
  /** Volumes, 0 to 1. Music will get its own when there is some. */
  readonly masterVolume: number;
  readonly effectsVolume: number;
  readonly musicVolume: number;
  /** Light bouncing off the ground on the map (screen-space GI): the costliest effect; off for a modest GPU. */
  readonly bounceLight: boolean;
  /** A corner readout of frames per second, triangles and the GPU backend, to judge performance on real hardware. */
  readonly showFrameRate: boolean;
}

export const DEFAULT_SETTINGS: SettingsData = { speed: "normal", rotate: 1, zoom: 1, hotkeys: {}, slotKeys: true, masterVolume: 0.8, effectsVolume: 1, musicVolume: 0.6, bounceLight: true, showFrameRate: false };

/** Camera multipliers stay within this range. */
export const CAMERA_RANGE = { min: 0.25, max: 2.5 } as const;

const STORAGE_KEY = "disc-settings";

const volume = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : null);
const isSpeed = (value: unknown): value is AnimationSpeed => typeof value === "string" && value in ANIMATION_SPEEDS;
const clampCamera = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(CAMERA_RANGE.max, Math.max(CAMERA_RANGE.min, value)) : null;

/** Stored settings, field by field: anything missing or malformed falls back to its default. */
export function parseSettings(text: string | null): SettingsData {
  if (!text) return DEFAULT_SETTINGS;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (typeof parsed !== "object" || parsed === null) return DEFAULT_SETTINGS;
  const speed: unknown = Reflect.get(parsed, "speed");
  const slotKeys: unknown = Reflect.get(parsed, "slotKeys");
  const bounceLight: unknown = Reflect.get(parsed, "bounceLight");
  const showFrameRate: unknown = Reflect.get(parsed, "showFrameRate");
  const hotkeys: unknown = Reflect.get(parsed, "hotkeys");
  const keys: Record<string, string> = {};
  if (typeof hotkeys === "object" && hotkeys !== null) {
    for (const [id, key] of Object.entries(hotkeys)) if (typeof key === "string" && assignable(key) && remappable().includes(id)) keys[id] = key;
  }
  return {
    speed: isSpeed(speed) ? speed : DEFAULT_SETTINGS.speed,
    rotate: clampCamera(Reflect.get(parsed, "rotate")) ?? DEFAULT_SETTINGS.rotate,
    zoom: clampCamera(Reflect.get(parsed, "zoom")) ?? DEFAULT_SETTINGS.zoom,
    hotkeys: keys,
    slotKeys: typeof slotKeys === "boolean" ? slotKeys : DEFAULT_SETTINGS.slotKeys,
    masterVolume: volume(Reflect.get(parsed, "masterVolume")) ?? DEFAULT_SETTINGS.masterVolume,
    effectsVolume: volume(Reflect.get(parsed, "effectsVolume")) ?? DEFAULT_SETTINGS.effectsVolume,
    musicVolume: volume(Reflect.get(parsed, "musicVolume")) ?? DEFAULT_SETTINGS.musicVolume,
    bounceLight: typeof bounceLight === "boolean" ? bounceLight : DEFAULT_SETTINGS.bounceLight,
    showFrameRate: typeof showFrameRate === "boolean" ? showFrameRate : DEFAULT_SETTINGS.showFrameRate,
  };
}

/** A key an ability can be given: one character, not a space, and not a digit (1–9 are the ability slots). */
export const assignable = (key: string): boolean => key.length === 1 && key !== " " && !/[0-9]/.test(key);

/** Abilities that come with a hotkey of their own; those are the ones the player can move. */
export function remappable(): string[] {
  return Object.entries(BEHAVIORS).flatMap(([id, b]) => (b.kind === "active" && b.hotkey ? [id] : []));
}

/** The key that uses an ability, after the player's changes. */
export function keyFor(settings: SettingsData, abilityId: string): string | undefined {
  const b = BEHAVIORS[abilityId];
  return settings.hotkeys[abilityId] ?? (b?.kind === "active" ? b.hotkey : undefined);
}

/**
 * Gives `abilityId` the key `key`. An ability that had that key trades places with it, so no two abilities share one.
 */
export function withHotkey(settings: SettingsData, abilityId: string, key: string): SettingsData {
  const previous = keyFor(settings, abilityId);
  const hotkeys: Record<string, string> = { ...settings.hotkeys, [abilityId]: key };
  for (const other of remappable()) {
    if (other !== abilityId && keyFor(settings, other) === key && previous) hotkeys[other] = previous;
  }
  return { ...settings, hotkeys };
}

/** Where the settings live between visits, and who needs to hear when they change. */
export class Settings {
  private current: SettingsData;
  private readonly listeners: ((settings: SettingsData) => void)[] = [];

  constructor() {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    this.current = parseSettings(stored);
  }

  get data(): SettingsData {
    return this.current;
  }

  keyFor(abilityId: string): string | undefined {
    return keyFor(this.current, abilityId);
  }

  /** Calls `apply` now and after every change. */
  follow(apply: (settings: SettingsData) => void): void {
    this.listeners.push(apply);
    apply(this.current);
  }

  update(next: SettingsData): void {
    this.current = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Not stored (a private window): the change still holds until the page closes.
    }
    for (const apply of this.listeners) apply(next);
  }
}
