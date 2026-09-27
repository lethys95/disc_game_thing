import { BEHAVIORS } from "#rules/abilities/index";
import type { Tag } from "#rules/battle/types";
import { SPELLS } from "#rules/spells";
import { UNITS } from "#rules/units/index";

/**
 * Where sounds go, like art's slots (`view/art-slots.ts`): one slot per piece of content, keyed by its id, with a
 * fallback chain to family sounds, so a single file can cover a whole family until a specific one exists. A slot's
 * file lives at `assets/audio/<key>.ogg`; a chain with no file is silent. Plain data, so `pnpm audio` lists the same
 * slots the game uses.
 */

/** Sounds that don't belong to one piece of content. */
export const FIXED_SOUNDS = [
  "ui/click", "ui/coins",
  "battle/shield", "battle/fled",
  "map/march", "map/battle", "map/capture",
  "stinger/victory", "stinger/defeat",
  "ambience/map",
] as const;
export type FixedSound = (typeof FIXED_SOUNDS)[number];

/** Which family a tagged ability falls back to, most telling tag first. */
const TAG_ORDER: readonly Tag[] = ["heal", "spell", "ranged", "melee", "attack"];

const familyTags = (abilityId: string): Tag[] => {
  const b = BEHAVIORS[abilityId];
  const tags = b?.kind === "active" ? b.tags : [];
  return TAG_ORDER.filter((t) => tags.includes(t));
};

/** An ability being used: its own sound, then its family's (`ability/_spell`, `ability/_attack`…). */
export const useChain = (abilityId: string): string[] => [`ability/${abilityId}`, ...familyTags(abilityId).map((t) => `ability/_${t}`)];

/** What an ability's hit (or heal) sounds like on its target: its own, then its family's, then any hit. */
export const hitChain = (abilityId: string | null): string[] => [...(abilityId ? [`hit/${abilityId}`, ...familyTags(abilityId).map((t) => `hit/_${t}`)] : []), "hit/_default"];

/** A healing that no ability's chain covers (an effect's, a passive's). */
export const HEAL_CHAIN: readonly string[] = ["hit/_heal", "hit/_default"];

/** A map spell being cast (`rules/spells.ts`): its own sound, then any spell's. */
export const spellChain = (spellId: string): string[] => [`spell/${spellId}`, "ability/_spell"];

/** A unit dying: its own cry, then its faction's, then anyone's. */
export const deathChain = (defId: string): string[] => [`death/${defId}`, `death/_${UNITS[defId]?.faction ?? "neutral"}`, "death/_default"];

/** Every slot the game has content for, with its chain, for the report. */
export function allSoundSlots(): { readonly key: string; readonly chain: readonly string[] }[] {
  const active = Object.entries(BEHAVIORS).filter(([, b]) => b.kind === "active").map(([id]) => id);
  return [
    ...FIXED_SOUNDS.map((key) => ({ key, chain: [key] })),
    ...active.map((id) => ({ key: `ability/${id}`, chain: useChain(id) })),
    ...active.map((id) => ({ key: `hit/${id}`, chain: hitChain(id) })),
    ...Object.keys(UNITS).map((id) => ({ key: `death/${id}`, chain: deathChain(id) })),
    ...SPELLS.map((s) => ({ key: `spell/${s.id}`, chain: spellChain(s.id) })),
  ];
}
