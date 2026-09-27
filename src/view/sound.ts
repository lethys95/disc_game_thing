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

/**
 * Music, one looping track at a time, crossfaded: `assets/audio/music/<faction>/map.ogg` and `battle-<n>.ogg`
 * (user, 2026-09-27: on the map your faction's theme; in battle the attacker's faction, rotating through its tracks).
 */
export type Track = string;

/** The music files there are, as track keys (`jilliath/battle-2`). */
export const musicTracks = (): string[] =>
  Object.keys(FILES).flatMap((path) => {
    const match = /^\/assets\/audio\/music\/(.+)\.ogg$/.exec(path);
    return match?.[1] ? [match[1]] : [];
  });

const CROSSFADE_S = 1.5;

/** The sounds that exist, found at build time. */
const FILES = import.meta.glob<string>("/assets/audio/**/*.ogg", { eager: true, query: "?url", import: "default" });

/** The same sound again this soon is dropped: an area spell's ten hits read as one. */
const REPEAT_MS = 60;

export class Sound {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private effects: GainNode | null = null;
  private musicBus: GainNode | null = null;
  /** The track playing (or wanted before audio opened), its source and its own fade. */
  private track: Track | null = null;
  private playing: { readonly source: AudioBufferSourceNode; readonly fade: GainNode } | null = null;
  private readonly buffers = new Map<SoundKey, Promise<AudioBuffer | null>>();
  private readonly lastPlayed = new Map<SoundKey, number>();
  private volumes = { master: 1, effects: 1, music: 1 };
  /** Where each faction's battle tracklist is up to. */
  private readonly rotation = new Map<string, number>();

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
    this.volumes = { master: settings.masterVolume, effects: settings.effectsVolume, music: settings.musicVolume };
    if (this.master) this.master.gain.value = this.volumes.master;
    if (this.effects) this.effects.gain.value = this.volumes.effects;
    if (this.musicBus) this.musicBus.gain.value = this.volumes.music;
  }

  /** A faction's map theme; any faction's if it has none yet. */
  mapMusic(faction: string): void {
    const tracks = musicTracks().filter((t) => t.endsWith("/map"));
    this.music(tracks.find((t) => t === `${faction}/map`) ?? tracks[0] ?? null);
  }

  /** The attacker's battle music: the next track of its faction's list (any faction's if it has none yet). */
  battleMusic(faction: string): void {
    const all = musicTracks().filter((t) => /\/battle-\d+$/.test(t)).sort();
    const own = all.filter((t) => t.startsWith(`${faction}/`));
    const list = own.length > 0 ? own : all;
    const next = this.rotation.get(faction) ?? 0;
    this.rotation.set(faction, next + 1);
    this.music(list[next % Math.max(1, list.length)] ?? null);
  }

  /** Crossfades to `track`, looping (null: fade out). Asked before audio opens, it starts when it does. */
  music(track: Track | null): void {
    if (track === this.track) return;
    this.track = track;
    this.startMusic();
  }

  private startMusic(): void {
    const context = this.context;
    const bus = this.musicBus;
    if (!context || !bus) return;
    const old = this.playing;
    this.playing = null;
    if (old) {
      old.fade.gain.setValueAtTime(old.fade.gain.value, context.currentTime);
      old.fade.gain.linearRampToValueAtTime(0, context.currentTime + CROSSFADE_S);
      old.source.stop(context.currentTime + CROSSFADE_S);
    }
    const track = this.track;
    if (!track) return;
    const url = FILES[`/assets/audio/music/${track}.ogg`];
    if (!url) return;
    void fetch(url)
      .then((r) => r.arrayBuffer())
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => {
        // The track may have changed while this one loaded.
        if (this.track !== track || this.playing) return;
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const fade = context.createGain();
        fade.gain.setValueAtTime(0, context.currentTime);
        fade.gain.linearRampToValueAtTime(1, context.currentTime + CROSSFADE_S);
        source.connect(fade);
        fade.connect(bus);
        source.start();
        this.playing = { source, fade };
      })
      .catch(() => undefined);
  }

  /**
   * Plays a sound now, or `delay` ms from now; with `duration`, for exactly that long (looping a shorter sound, and
   * fading out at the end). Silent until audio is open, and for slots without a file.
   */
  play(key: SoundKey, delay = 0, duration?: number): void {
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
      const start = context.currentTime + delay / 1000;
      if (duration === undefined) {
        source.connect(bus);
        source.start(start);
        return;
      }
      const seconds = duration / 1000;
      const fade = context.createGain();
      source.loop = seconds > buffer.duration;
      source.connect(fade);
      fade.connect(bus);
      fade.gain.setValueAtTime(1, start + Math.max(0, seconds - 0.08));
      fade.gain.linearRampToValueAtTime(0, start + seconds);
      source.start(start);
      source.stop(start + seconds);
    });
  }

  private ensure(): void {
    if (this.context) return;
    const context = new AudioContext();
    const master = context.createGain();
    const effects = context.createGain();
    master.gain.value = this.volumes.master;
    effects.gain.value = this.volumes.effects;
    const musicBus = context.createGain();
    musicBus.gain.value = this.volumes.music;
    effects.connect(master);
    musicBus.connect(master);
    master.connect(context.destination);
    this.context = context;
    this.master = master;
    this.effects = effects;
    this.musicBus = musicBus;
    this.startMusic();
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
