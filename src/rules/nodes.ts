import { behavior, paramsOf } from "#rules/abilities/index";
import { BASE_ABILITY_POWER, BLACKSMITH_BONUS, MANA_NODE_INCOME, MINE_INCOME } from "#rules/balance";
import { effectDef } from "#rules/effects";
import type { AbilityRef, EffectSeed } from "#rules/battle/types";
import { LINE_ARCHETYPE, UNITS } from "#rules/units/index";

/**
 * Nodes (Warlords 3 style, docs/design/pillars.md "Cities"): map features that belong to the **nearest city** (a
 * Capitol counts), so whoever holds that city holds them. A node kind is data: gold and mana per turn, and what units
 * recruited in its city carry, all growing with the node's level (investment, provisional numbers).
 */
export type NodeKind =
  | "gold"
  | "blacksmith"
  | "mana"
  | "cathedral"
  | "foundry"
  | "leech_pits"
  | "stables"
  | "tannery"
  | "siege_workshop"
  | "quarry"
  | "ossuary"
  | "watchtower"
  | "bell_tower"
  | "tribal_outpost"
  | "venom_distillery"
  | "witch_hut"
  | "hunting_lodge"
  | "training_yard"
  | "gallows"
  | "waystation"
  | "caravanserai"
  | "bog_iron"
  | "granary"
  | "oasis"
  | "dog_yard"
  | "waystone"
  | "scriptorium";

export interface NodeDef {
  readonly name: string;
  /** How far it can be invested in: three levels for most, two for a node with one thing to add (the user, 2026-10-16). */
  readonly maxLevel: number;
  readonly income: (level: number) => number;
  /** Mana per turn, in the holder's faction color. */
  readonly mana: (level: number) => number;
  /** What a unit of `defId` recruited in the node's city carries for good (marks). */
  readonly recruitEffects: (level: number, defId: string) => readonly EffectSeed[];
  /** What it gives at a level, in words. */
  readonly describe: (level: number) => string;
  /** A spell its holder knows while holding its city (the Waystone's Way portal). */
  readonly spell?: string;
  /** What it does for its city (and its holder) rather than for recruits; absent for most kinds. */
  readonly city?: CityGifts;
}

/** A node's gifts to its city, each a number by the node's level; missing ones are none. */
export interface CityGifts {
  /** Share off the city's upgrades (Quarry). */
  readonly upgradeDiscount?: (level: number) => number;
  /** Extra fortification armor for the city's defenders (Quarry). */
  readonly wallArmor?: (level: number) => number;
  /**
   * The dead can be raised in this city without the Capitol's research, at the Capitol's price less this share
   * (Ossuary).
   */
  readonly raisesDead?: (level: number) => number;
  /** Its holder sees this far around the node (Watchtower). */
  readonly sight?: (level: number) => number;
  /** Its holder hears of an enemy warband ending a march this close to the city (Bell tower). */
  readonly warning?: (level: number) => number;
  /** How many of its biome's tribe units the city can recruit, besides its holder's own (a Tribal outpost; `tribes.md`). */
  readonly tribeOutpost?: (level: number) => number;
  /** Share off the gold for units recruited in this city (Bog iron). */
  readonly recruitDiscount?: (level: number) => number;
  /** Levels a unit recruited in this city arrives with (Training yard). */
  readonly recruitLevels?: (level: number) => number;
  /** Share off its holder's buying at merchants and hiring at mercenary camps, anywhere (Caravanserai). */
  readonly tradeDiscount?: (level: number) => number;
  /** How many times faster the city's garrison heals (Granary). */
  readonly garrisonHealing?: (level: number) => number;
  /** How many times faster any of its holder's squads resting in the city heals, garrison or warband (Oasis). */
  readonly restHealing?: (level: number) => number;
  /** Enemy units that die in a battle at the city never reach their owner's graveyard (Gallows). */
  readonly hangsTheDead?: (level: number) => number;
  /** Share of health its holder's warbands heal when they start a turn next to the node (Waystation). */
  readonly waystation?: (level: number) => number;
  /** Its holder's warbands that start a turn this close to the city cross forest and hills at plain cost (Dog yard). */
  readonly sureFooting?: (level: number) => number;
  /** Effects the city's defenders bring into a battle there (Bell tower). */
  readonly defenderEffects?: (level: number) => readonly EffectSeed[];
  /** Effects the enemies of its holder carry in a battle at the city (Bog iron's rust). */
  readonly attackerEffects?: (level: number) => readonly EffectSeed[];
  /** Its holder's first spell each turn aimed this close to the city costs half (a Mana node at its last level). */
  readonly cheapSpells?: (level: number) => number;
  /** Above 0: its holder sees the wares and hires of every merchant and camp it knows of, wherever it is (Caravanserai). */
  readonly seesTrade?: (level: number) => number;
  /** Turns its holder's warbands, leaving the city, go on healing as if resting there (Granary's provisions). */
  readonly provisions?: (level: number) => number;
  /** XP each unit resting in the city's garrison gains a turn (Training yard). */
  readonly garrisonTraining?: (level: number) => number;
  /** Above 0: enemy warbands in the node's sight show their items and their last move (Watchtower). */
  readonly watches?: (level: number) => number;
  /** Above 0: a warband wiped out at the city leaves its items to its holder (Gallows). */
  readonly hangsItems?: (level: number) => number;
  /** Extra movement for its holder's warbands that start a turn next to the node (Waystation). */
  readonly waystationMovement?: (level: number) => number;
  /** Enemy warbands within this many hexes of the city regenerate nothing at the start of their turn (Oasis). */
  readonly drought?: (level: number) => number;
  /** Extra movement for a warband its Way portal brings home (Waystone). */
  readonly portalMovement?: (level: number) => number;
}

/** The level at which a three-level node's clause arrives (the user, 2026-10-16: "level 3 adds a clause"). */
export const CLAUSE_LEVEL = 3;

// The user's picks (design/nodes.md); every number provisional (#56, #84, #86). A gift that only comes with the
// clause is 0 below its level.
const from = (level: number, at: number, value: number): number => (level >= at ? value : 0);
const percent = (share: number): string => `${Math.round(share * 100)}%`;
const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

const MANA = { cheapSpells: (level: number) => from(level, CLAUSE_LEVEL, 3) };
const QUARRY = { upgradeDiscount: (level: number) => 0.1 + 0.1 * level, wallArmor: (level: number) => 1 + level };
// "It sounds very powerful. Careful." (user): no discount until invested.
const OSSUARY = { raisesDead: (level: number) => 0.1 * (level - 1) };
const WATCHTOWER = { sight: (level: number) => 2 + level, watches: (level: number) => from(level, CLAUSE_LEVEL, 1) };
const BELL_TOWER = { warning: (level: number) => 1 + level, defenderEffects: () => [{ def: "forewarned" }] };
const TRIBAL_OUTPOST = { tribeOutpost: (level: number) => level + 1 };
// "Not much please" (user) for the garrison's training.
const TRAINING_YARD = { recruitLevels: (level: number) => (level >= 2 ? 2 : 1), garrisonTraining: (level: number) => from(level, CLAUSE_LEVEL, 5) };
const GALLOWS = { hangsTheDead: () => 1, hangsItems: (level: number) => from(level, 2, 1) };
// "Buff to 25" (user; the brainstorm said 10%).
const WAYSTATION = { waystation: (level: number) => 0.2 + 0.05 * level, waystationMovement: (level: number) => from(level, CLAUSE_LEVEL, 1) };
const CARAVANSERAI = { tradeDiscount: (level: number) => 0.1 + 0.05 * level, seesTrade: (level: number) => from(level, CLAUSE_LEVEL, 1) };
const BOG_IRON = {
  recruitDiscount: (level: number) => 0.05 + 0.05 * level,
  attackerEffects: (level: number) => (level >= CLAUSE_LEVEL ? [{ def: "rusted", amount: 4 }] : []),
};
const GRANARY = { garrisonHealing: () => 2, upgradeDiscount: (level: number) => 0.05 + 0.05 * level, provisions: (level: number) => from(level, CLAUSE_LEVEL, 2) };
// "Regenerate nothing, rather. Healing should still be possible." (user)
const OASIS = { restHealing: (level: number) => 1.5 + 0.5 * level, drought: (level: number) => from(level, CLAUSE_LEVEL, 2) };
const DOG_YARD = { sureFooting: (level: number) => level };
const WAYSTONE = { portalMovement: (level: number) => from(level, 2, 1) };

export const NODES: Readonly<Record<NodeKind, NodeDef>> = {
  gold: { name: "Gold mine", maxLevel: 3, income: (level) => MINE_INCOME * level, mana: () => 0, recruitEffects: () => [], describe: (level) => `+${MINE_INCOME * level} gold per turn` },
  mana: {
    name: "Mana node",
    maxLevel: 3,
    income: () => 0,
    mana: (level) => MANA_NODE_INCOME * level,
    recruitEffects: () => [],
    describe: (level) => `+${MANA_NODE_INCOME * level} mana per turn${clause(level, `your first spell each turn aimed within ${MANA.cheapSpells(CLAUSE_LEVEL)} hexes of the city costs half`)}`,
    city: MANA,
  },
  // User (2026-09-27): units recruited in the Blacksmith's city get +10 attack. It stays with them, as a mark.
  blacksmith: markNode("Blacksmith", (level) => [{ def: "blacksmith", amount: BLACKSMITH_BONUS * level }, ...(level >= CLAUSE_LEVEL ? [{ def: "armor_piercing", amount: 5 }] : [])]),
  // User (2026-09-27): units hired in the Cathedral's city carry holy water; it heals more with each level and
  // cleanses at the last.
  cathedral: {
    name: "Cathedral",
    maxLevel: 3,
    income: () => 0,
    mana: () => 0,
    recruitEffects: (level) => [{ def: "carries", ability: holyWater(level) }],
    describe: (level) => `units recruited here carry Holy Water. ${behavior("holy_water").describe(paramsOf(holyWater(level), BASE_ABILITY_POWER))}`,
  },
  foundry: markNode("Foundry", (level) => [{ def: "foundry", amount: 6 + 6 * level }, ...(level >= CLAUSE_LEVEL ? [{ def: "overflow_plating", amount: 50 }] : [])]),
  leech_pits: markNode("Leech pits", (level) => [{ def: "leech", amount: 5 + 3 * level }, ...(level >= CLAUSE_LEVEL ? [{ def: "leech_feast" }] : [])]),
  stables: { ...markNode("Stables", (level) => [{ def: "stables", amount: level }]), maxLevel: 2 },
  tannery: markNode("Tannery", (level) => [{ def: "tannery", amount: 8 + 7 * level }]),
  siege_workshop: markNode("Siege workshop", (level) => [{ def: "siege", amount: level }]),
  quarry: cityNode("Quarry", QUARRY, (level) => `the city's upgrades cost ${percent(QUARRY.upgradeDiscount(level))} less; its defenders have +${QUARRY.wallArmor(level)} armor behind its walls`),
  ossuary: cityNode("Ossuary", OSSUARY, (level) => `the dead can be raised in this city without the research, at the Capitol's price${OSSUARY.raisesDead(level) > 0 ? ` less ${percent(OSSUARY.raisesDead(level))}` : ""}`),
  watchtower: cityNode("Watchtower", WATCHTOWER, (level) => `you see ${WATCHTOWER.sight(level)} hexes around it, through the fog${clause(level, "enemy warbands it sees show their items and their last move")}`),
  // "I really love this one" (user): the land's tribe recruits here; one of its biome's tribes, by the city's place.
  tribal_outpost: cityNode("Tribal outpost", TRIBAL_OUTPOST, (level) => `the city recruits ${TRIBAL_OUTPOST.tribeOutpost(level)} of its land's tribe's units (more with each level); they take no garrison slot`),
  bell_tower: cityNode("Bell tower", BELL_TOWER, (level) => `you hear of enemy warbands ending their move within ${BELL_TOWER.warning(level)} hexes of the city; its defenders act first in the first round of a battle there`),
  // The second review (user, 2026-10-15, design/nodes.md).
  venom_distillery: markNode("Venom distillery", (level) => [{ def: "distilled_venom", amount: 2 + level, stacks: level >= CLAUSE_LEVEL ? 2 : 1 }]),
  witch_hut: markNode("Witch hut", (level) => [{ def: "hexed", stacks: 1 + level, amount: from(level, CLAUSE_LEVEL, 1) }]),
  hunting_lodge: markNode("Hunting lodge", (level) => [{ def: "hunter", amount: 10 + 5 * level, stacks: level >= CLAUSE_LEVEL ? 2 : 1 }]),
  training_yard: cityNode(
    "Training yard",
    TRAINING_YARD,
    (level) => `units recruited here arrive ${plural(TRAINING_YARD.recruitLevels(level), "level")} up${clause(level, `units resting in its garrison gain ${TRAINING_YARD.garrisonTraining(CLAUSE_LEVEL)} XP a turn`)}`,
  ),
  // "Potentially very powerful." (user) Two levels: the second hangs the dead's belongings too.
  gallows: {
    ...cityNode("Gallows", GALLOWS, (level) => `enemy units that die in a battle at this city can't be raised by their owner${level >= 2 ? "; a warband wiped out here leaves you its items" : ""}`),
    maxLevel: 2,
  },
  waystation: cityNode(
    "Waystation",
    WAYSTATION,
    (level) => `your warbands that start a turn next to it heal ${percent(WAYSTATION.waystation(level))}${clause(level, `and get +${WAYSTATION.waystationMovement(CLAUSE_LEVEL)} movement that turn`)}`,
  ),
  caravanserai: cityNode(
    "Caravanserai",
    CARAVANSERAI,
    (level) => `merchants and mercenary camps everywhere sell to you ${percent(CARAVANSERAI.tradeDiscount(level))} cheaper${clause(level, "you see the wares and hires of every one you know of, from anywhere")}`,
  ),
  bog_iron: cityNode("Bog iron", BOG_IRON, (level) => `units recruited in this city cost ${percent(BOG_IRON.recruitDiscount(level))} less${clause(level, "enemies fighting at the city have less armor (the bog eats iron)")}`),
  granary: cityNode(
    "Granary",
    GRANARY,
    (level) => `the city's garrison heals twice as fast; its upgrades cost ${percent(GRANARY.upgradeDiscount(level))} less${clause(level, `your warbands leaving it heal as if resting for ${plural(GRANARY.provisions(CLAUSE_LEVEL), "more turn")}`)}`,
  ),
  // The user's wording (a maybe, 2026-10-15): "units recruited there or resting in the town have 2x regeneration".
  oasis: {
    ...cityNode(
      "Oasis",
      OASIS,
      (level) => `units recruited here heal twice as fast on the map, for good; your squads resting in the city heal ${OASIS.restHealing(level)} times as fast${clause(level, `enemy warbands within ${OASIS.drought(CLAUSE_LEVEL)} hexes of it regenerate nothing`)}`,
    ),
    recruitEffects: () => [{ def: "oasis_born" }],
  },
  dog_yard: cityNode("Dog yard", DOG_YARD, (level) => `your warbands that start a turn within ${plural(DOG_YARD.sureFooting(level), "hex")} of the city cross forest and hills at plain cost that turn`.replace("hexs", "hexes")),
  // The user's own (2026-09-29): "Gain spell 'way portal' if controlled. Units elevated to leader in the city get
  // teleported to the city when cast. All units stop counting as having been elevated there if the city is taken."
  // Two levels; the second: "give units which are transported here through the wayportal a small amount of extra
  // movement" (user, 2026-10-16).
  waystone: {
    ...cityNode(
      "Waystone",
      WAYSTONE,
      (level) => `while you hold it, you know the spell Way portal: a warband whose leader was elevated in this city steps through to it${level >= 2 ? `, with +${WAYSTONE.portalMovement(2)} movement` : ""}`,
    ),
    maxLevel: 2,
    spell: "way_portal",
  },
  // The user's maybe, kept for faction readings (2026-10-16): one level, a different gift to each faction's casters.
  scriptorium: {
    name: "Scriptorium",
    maxLevel: 1,
    income: () => 0,
    mana: () => 0,
    recruitEffects: (_level, defId) => scriptoriumMark(defId),
    describe: () => "casters recruited here, for good: Jilliath's pay for their first use of their own health in a battle with none of it; Ral-Vitahl's start each battle with an extra spell charge; the Grove's heals over time last a turn longer",
  },
};

/** The Cathedral's Holy Water at a level: a bigger heal each level, and a cleanse with the clause. */
const holyWater = (level: number): AbilityRef => ({ id: "holy_water", params: { amount: 20 + 10 * level, cleanse: from(level, CLAUSE_LEVEL, 1) } });

/** A caster (a mage or support line, not melee) recruited at a Scriptorium: its faction's gift. */
function scriptoriumMark(defId: string): EffectSeed[] {
  if (LINE_ARCHETYPE[defId] === undefined || LINE_ARCHETYPE[defId] === "melee") return [];
  const gift = { jilliath: "scriptorium_jilliath", nexus: "scriptorium_nexus", grove: "scriptorium_grove", neutral: null }[UNITS[defId]?.faction ?? "neutral"];
  return gift ? [{ def: gift }] : [];
}

/** Every effect a node can give, at any level, to any recruit or defender, or bring on attackers (for the codex). */
export function nodeEffects(node: NodeDef): EffectSeed[] {
  const levels = Array.from({ length: node.maxLevel }, (_, i) => i + 1);
  const recruits = Object.keys(UNITS);
  return levels.flatMap((level) => [
    ...recruits.flatMap((defId) => node.recruitEffects(level, defId)),
    ...(node.city?.defenderEffects?.(level) ?? []),
    ...(node.city?.attackerEffects?.(level) ?? []),
  ]);
}

/** A clause's words, added to a node's text from its level on. */
const clause = (level: number, words: string): string => (level >= CLAUSE_LEVEL ? `; ${words}` : "");

/** A node whose gifts are to its city, not to recruits. */
function cityNode(name: string, city: CityGifts, describe: (level: number) => string): NodeDef {
  return { name, maxLevel: 3, income: () => 0, mana: () => 0, recruitEffects: () => [], describe, city };
}

/** A mark's own text (its effect's), lowered to follow "units recruited here, for good:". */
function markText(seed: EffectSeed): string {
  const text = effectDef(seed.def).describe({ def: seed.def, source: null, stacks: seed.stacks ?? 1, amount: seed.amount ?? 0 });
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** A node whose gift is marks on the units recruited in its city. */
function markNode(name: string, marks: (level: number) => EffectSeed[]): NodeDef {
  return { name, maxLevel: 3, income: () => 0, mana: () => 0, recruitEffects: (level) => marks(level), describe: (level) => `units recruited here, for good: ${marks(level).map(markText).join(" ")}` };
}

/** Where a node is generated; the world gives it an id and a level. */
export interface NodeSite {
  readonly kind: NodeKind;
  readonly hex: { readonly q: number; readonly r: number };
}
