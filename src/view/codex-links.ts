import { BEHAVIORS } from "#rules/abilities/index";
import type { EffectSeed, UnitDef } from "#rules/battle/types";
import { EFFECTS } from "#rules/effects";
import { ITEMS } from "#rules/items";
import { NODES } from "#rules/nodes";
import type { NodeKind } from "#rules/nodes";
import { SPELLS } from "#rules/spells";
import { UNITS } from "#rules/units/index";
import { tribeUnits, TRIBES } from "#rules/world/state";

/**
 * Where each ability and effect comes from, read from the rules' data (units' kits, items, nodes, spells, and what
 * abilities and effects declare they apply), so the codex can say "who has this" and link to it.
 */

export type Source =
  | { readonly kind: "unit"; readonly id: string }
  | { readonly kind: "ability"; readonly id: string }
  | { readonly kind: "effect"; readonly id: string }
  | { readonly kind: "node"; readonly id: NodeKind }
  | { readonly kind: "item"; readonly name: string }
  | { readonly kind: "spell"; readonly name: string };

/** The codex's shelves for abilities and effects, in order. */
export const GROUPS = ["jilliath", "nexus", "grove", "shared", "tribes", "world", "keywords", "common", "other"] as const;
export type Group = (typeof GROUPS)[number];

export const GROUP_NAMES: Readonly<Record<Group, string>> = {
  jilliath: "Jilliath",
  nexus: "Ral-Vitahl",
  grove: "Sylvan",
  shared: "Shared",
  tribes: "Neutral tribes",
  world: "Items, nodes and spells",
  keywords: "Keywords (no unit yet)",
  common: "Every unit",
  other: "Other",
};

const NODE_LEVELS = [1, 2, 3];

const TRIBE_UNITS: ReadonlySet<string> = new Set(TRIBES.flatMap((tribe) => tribeUnits(tribe)));

/** A unit's shelf: its faction, or the tribes (the Capitol's Guardian counts as neither). */
function unitGroup(def: UnitDef): Group | null {
  if (def.faction !== "neutral") return def.faction;
  return TRIBE_UNITS.has(def.id) ? "tribes" : null;
}

/** Every effect seed the world hands out, with where it comes from. */
function worldSeeds(): { source: Source; seed: EffectSeed }[] {
  const seeds: { source: Source; seed: EffectSeed }[] = [];
  for (const item of ITEMS) for (const seed of [...item.worn, ...item.banner]) seeds.push({ source: { kind: "item", name: item.name }, seed });
  for (const [id, node] of Object.entries(NODES)) {
    for (const level of NODE_LEVELS) for (const seed of [...node.recruitEffects(level), ...(node.city?.defenderEffects?.(level) ?? [])]) seeds.push({ source: { kind: "node", id: nodeKind(id) }, seed });
  }
  for (const spell of SPELLS) if (spell.effect.kind === "enchant") seeds.push({ source: { kind: "spell", name: spell.name }, seed: spell.effect.effect });
  return seeds;
}

const isNodeKind = (id: string): id is NodeKind => id in NODES;
const nodeKind = (id: string): NodeKind => {
  if (!isNodeKind(id)) throw new Error(`not a node: ${id}`);
  return id;
};

const unique = (sources: readonly Source[]): Source[] => {
  const seen = new Set<string>();
  return sources.filter((s) => {
    const key = `${s.kind}:${"id" in s ? s.id : s.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/** Who has an ability: units with it in their kit, items and nodes that carry it. */
export function abilitySources(abilityId: string): Source[] {
  const units = Object.values(UNITS).filter((u) => u.abilities.some((a) => a.id === abilityId)).map((u): Source => ({ kind: "unit", id: u.id }));
  const carried = worldSeeds().filter(({ seed }) => seed.ability?.id === abilityId).map(({ source }) => source);
  return unique([...units, ...carried]);
}

/** What puts an effect on a unit: abilities and effects that apply it, and items, nodes and spells that give it. */
export function effectSources(effectId: string): Source[] {
  const abilities = Object.entries(BEHAVIORS).filter(([, b]) => b.applies?.includes(effectId)).map(([id]): Source => ({ kind: "ability", id }));
  const effects = [...EFFECTS.values()].filter((e) => e.applies?.includes(effectId)).map((e): Source => ({ kind: "effect", id: e.id }));
  const world = worldSeeds().filter(({ seed }) => seed.def === effectId).map(({ source }) => source);
  return unique([...abilities, ...effects, ...world]);
}

/** Sources' shelves as one: a keyword no unit carries yet doesn't pull an entry off its faction's shelf. */
const merge = (groups: readonly Group[]): Group => {
  const all = [...new Set(groups)];
  const found = all.length > 1 ? all.filter((g) => g !== "keywords") : all;
  if (found.length === 0) return "other";
  return found.length === 1 ? (found[0] ?? "other") : "shared";
};

/** An ability's shelf: the faction or tribes whose units have it, shared, the world's, or a keyword no unit has yet. */
export function abilityGroup(abilityId: string): Group {
  const b = BEHAVIORS[abilityId];
  if (b?.kind === "active" && b.tags.includes("common")) return "common";
  const sources = abilitySources(abilityId);
  if (sources.length === 0) return "keywords";
  return merge(
    sources.map((s): Group => {
      const def = s.kind === "unit" ? UNITS[s.id] : undefined;
      return (def && unitGroup(def)) ?? "world";
    }),
  );
}

/** An effect's shelf: its sources' shelves, merged. */
export function effectGroup(effectId: string, seen: ReadonlySet<string> = new Set()): Group {
  const groups = effectSources(effectId).map((s): Group => {
    if (s.kind === "ability") return abilityGroup(s.id);
    if (s.kind === "effect") return seen.has(s.id) ? "other" : effectGroup(s.id, new Set([...seen, effectId]));
    return "world";
  });
  return merge(groups.filter((g) => g !== "other"));
}
