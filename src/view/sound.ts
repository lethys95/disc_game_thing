import type { SettingsData } from "#view/settings";

/**
 * Sound effects through WebAudio. A sound is a slot key (`battle/hit`) whose file, if any, lives at
 * `assets/audio/<key>.ogg`; a slot without a file is silent, like art's placeholders. What goes in each slot is listed
 * in `assets/audio/SOURCES.md` (the user picks keepers by ear).
 */
export const SOUNDS = [
  "ui/click", "ui/coins",
  "battle/swing", "battle/hit", "battle/shield", "battle/cast", "battle/spell-hit", "battle/heal", "battle/death", "battle/fled",
  "map/march", "map/battle", "map/capture",
  "stinger/victory", "stinger/defeat",
] as const;
export type SoundKey = (typeof SOUNDS)[number];

/** The sounds that exist, found at build time. */
const FILES = import.meta.glob<string>("/assets/audio/**/*.ogg", { eager: true, query: "?url", import: "default" });

/** The same sound again this soon is dropped: an area spell's ten hits read as one. */
const REPEAT_MS = 60;

export class Sound {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private effects: GainNode | null = null;
  private readonly buffers = new Map<SoundKey, Promise<AudioBuffer | null>>();
  private readonly lastPlayed = new Map<SoundKey, number>();
  private volumes = { master: 1, effects: 1 };

  /** Browsers only let audio start after the player interacts; the first click or key opens it. */
  constructor() {
    const open = () => {
      this.ensure();
      window.removeEventListener("pointerdown", open);
      window.removeEventListener("keydown", open);
    };
    window.addEventListener("pointerdown", open);
    window.addEventListener("keydown", open);
  }

  setVolumes(settings: SettingsData): void {
    this.volumes = { master: settings.masterVolume, effects: settings.effectsVolume };
    if (this.master) this.master.gain.value = this.volumes.master;
    if (this.effects) this.effects.gain.value = this.volumes.effects;
  }

  /** Plays a sound now, or `delay` ms from now. Silent until audio is open, and for slots without a file. */
  play(key: SoundKey, delay = 0): void {
    const context = this.context;
    const bus = this.effects;
    if (!context || !bus || this.volumes.master === 0 || this.volumes.effects === 0) return;
    const now = performance.now() + delay;
    if (now - (this.lastPlayed.get(key) ?? -Infinity) < REPEAT_MS) return;
    this.lastPlayed.set(key, now);
    void this.load(context, key).then((buffer) => {
      if (!buffer) return;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(bus);
      source.start(context.currentTime + delay / 1000);
    });
  }

  private ensure(): void {
    if (this.context) return;
    const context = new AudioContext();
    const master = context.createGain();
    const effects = context.createGain();
    master.gain.value = this.volumes.master;
    effects.gain.value = this.volumes.effects;
    effects.connect(master);
    master.connect(context.destination);
    this.context = context;
    this.master = master;
    this.effects = effects;
  }

  private load(context: AudioContext, key: SoundKey): Promise<AudioBuffer | null> {
    let pending = this.buffers.get(key);
    if (!pending) {
      const url = FILES[`/assets/audio/${key}.ogg`];
      pending = url
        ? fetch(url)
            .then((r) => r.arrayBuffer())
            .then((data) => context.decodeAudioData(data))
            .catch(() => null)
        : Promise.resolve(null);
      this.buffers.set(key, pending);
    }
    return pending;
  }
}
