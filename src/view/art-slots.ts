import { BEHAVIORS } from "#rules/abilities/index";
import type { Faction } from "#rules/battle/types";
import { EFFECTS } from "#rules/effects";
import { UNITS } from "#rules/units/index";

/**
 * Where art goes: one slot per piece of game content, keyed by the content's own id. A slot's file lives at
 * `assets/art/<kind>/<id>.webp`; when it's missing, the view falls back to a family default, then to a placeholder.
 * Plain data and pure functions, so the art scripts can list the same slots the game uses.
 */
export type SlotKind = "portrait" | "ability" | "effect";

/**
 * A unit's art comes framed three ways, each its own file (the user, 2026-10-05): the card, the whole figure (on the
 * field); the bust, head and shoulders (the unit card); the icon, zoomed in on the face (the turn order, squad grids,
 * lists). Each falls back to the wider framing when its own file is missing.
 */
export type Frame = "card" | "bust" | "icon";
export const FRAMES: readonly Frame[] = ["card", "bust", "icon"];

export interface Slot {
  readonly kind: SlotKind;
  readonly id: string;
  /** Portraits only; the card when unset. */
  readonly frame?: Frame;
}

const folder = (slot: Slot): string => (slot.kind === "portrait" && slot.frame && slot.frame !== "card" ? slot.frame : slot.kind);

export const slotKey = (slot: Slot): string => `${folder(slot)}/${slot.id}`;


/** What a slot shows, for placeholders, reports and prompts. */
export interface SlotInfo {
  readonly name: string;
  readonly faction: Faction;
  /** Rules text or a short description; prompts build on it. */
  readonly text: string;
}

/** The faction whose units use an ability; shared verbs (Attack, Defend) are neutral. */
function abilityFaction(id: string): Faction {
  const users = Object.values(UNITS).filter((u) => u.abilities.some((a) => a.id === id));
  const factions = [...new Set(users.map((u) => u.faction))];
  return factions.length === 1 && factions[0] ? factions[0] : "neutral";
}

export function slotInfo(slot: Slot): SlotInfo {
  switch (slot.kind) {
    case "portrait": {
      const unit = UNITS[slot.id];
      return { name: unit?.name ?? slot.id, faction: unit?.faction ?? "neutral", text: unit ? `a tier ${unit.tier} unit` : "" };
    }
    case "ability": {
      const behavior = BEHAVIORS[slot.id];
      return { name: behavior?.name ?? slot.id, faction: abilityFaction(slot.id), text: behavior?.describe(behavior.defaults ?? {}) ?? "" };
    }
    case "effect": {
      const def = EFFECTS.get(slot.id);
      return { name: def?.name ?? slot.id, faction: "neutral", text: def?.describe({ def: slot.id, source: null, stacks: 1, amount: 10 }) ?? "" };
    }
  }
}

/** Keys to try, most specific first: the slot itself, then its family's shared art. */
export function fallbackKeys(slot: Slot): string[] {
  const own = slotKey(slot);
  switch (slot.kind) {
    case "portrait": {
      const card = [`portrait/${slot.id}`, `portrait/_${slotInfo(slot).faction}`];
      if (slot.frame === "icon") return [own, `bust/${slot.id}`, ...card];
      if (slot.frame === "bust") return [own, ...card];
      return card;
    }
    case "ability": {
      const behavior = BEHAVIORS[slot.id];
      const tags = behavior?.kind === "active" ? behavior.tags : [];
      return [own, ...tags.map((t) => `ability/_${t}`), `ability/_${behavior?.kind ?? "active"}`];
    }
    case "effect":
      return [own, "effect/_effect"];
  }
}

/** Every slot the game has content for. */
export function allSlots(): Slot[] {
  return [
    ...Object.keys(UNITS).map((id): Slot => ({ kind: "portrait", id })),
    ...Object.keys(BEHAVIORS).map((id): Slot => ({ kind: "ability", id })),
    ...[...EFFECTS.keys()].map((id): Slot => ({ kind: "effect", id })),
  ];
}
