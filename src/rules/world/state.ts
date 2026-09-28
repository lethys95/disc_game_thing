import { levelBonus } from "#rules/balance";
import type { Battle, EffectSeed, Side, Tile } from "#rules/battle/types";
import type { Commitment } from "#rules/forks";
import type { PlayerColor } from "#rules/world/colors";
import { hexDistance, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import type { WorldMap } from "#rules/map";
import { NODES } from "#rules/nodes";
import type { CityGifts, NodeKind } from "#rules/nodes";
import type { ManaColor } from "#rules/factions";
import { UNITS } from "#rules/units/index";
import type { Playable } from "#rules/units/index";
import type { Hire } from "#rules/structures";

/** The world's data (warbands, cities, lairs, graveyards) and lookups over it. */

/** Where a unit's difference from its baseline came from: the track record (docs/design/pillars.md). */
export type MarkSource =
  | { readonly kind: "leaderTree"; readonly skill: string }
  | { readonly kind: "upgrade"; readonly upgrade: string }
  | { readonly kind: "levels"; readonly levels: number }
  | { readonly kind: "node"; readonly node: NodeKind; readonly cityId: string }
  | { readonly kind: "item"; readonly item: string };

/** A lasting difference from the unit's baseline: an effect it brings into every battle, and its source. */
export interface Mark {
  readonly effect: EffectSeed;
  readonly source: MarkSource;
}

/** A unit in a squad on the map; its HP, XP and marks carry from one battle to the next. */
export interface SquadMember {
  readonly defId: string;
  readonly tile: Tile;
  readonly hp: number;
  readonly xp: number;
  readonly marks: readonly Mark[];
  /** Levels gained past the end of its line (pillars.md). */
  readonly level: number;
}

/** A unit in its side's graveyard, waiting for resurrection at the Capitol. */
export interface Fallen {
  readonly defId: string;
  readonly fellOnTurn: number;
  /** Marks and levels survive death: a resurrected unit keeps its track record. */
  readonly marks: readonly Mark[];
  readonly level: number;
}

/**
 * A player in the game, by index into `World.players`. Not a battle side: every battle has exactly two sides (0 the
 * attacker, 1 the defender), and its engagement records which player stands on each.
 */
export type PlayerId = number;

export interface Player {
  readonly faction: Playable;
  /** Who owns what, on screen (`world/colors.ts`). */
  readonly color: PlayerColor;
  gold: number;
  /** Branch choices at forks (`rules/forks.ts`). */
  commitment: Commitment;
  graveyard: Fallen[];
  /** Unit-type upgrades bought (`rules/upgrades.ts`). */
  upgrades: string[];
  /** Capitol research finished (`rules/research.ts`). */
  research: string[];
  /** Out of the game: its Guardian fell. */
  eliminated: boolean;
  /** Mana by color (pillars.md, "Spells"); a player earns its own faction's color. */
  mana: Record<ManaColor, number>;
  /** Spells learned at the Capitol (`rules/spells.ts`). */
  spells: string[];
  /** Spells cast this turn: each once per turn. */
  cast: string[];
  /** Fog of war (`world/vision.ts`): every hex this player has seen, by `hexKey`. */
  explored: string[];
  /** What this player last saw of the cities, lairs and nodes out of its sight now. */
  memory: Memory;
}

/** Copies of places as a player last saw them. Warbands aren't remembered: they move on. */
export interface Memory {
  cities: City[];
  lairs: Lair[];
  nodes: MapNode[];
  structures: Structure[];
}

export interface Leader {
  readonly id: string;
  readonly player: PlayerId;
  hex: Hex;
  movement: number;
  /** XP the leader has earned in all; it buys points in the leader tree. */
  experience: number;
  /** Ranks learned in the leader tree, by skill id (`world/leaders.ts`). */
  skills: Record<string, number>;
  /**
   * When the leader's own unit fell while its squad won: it stays in the squad at 0 HP, fields no bonuses, and
   * waits to be revived at the Capitol (as in D2). Null while it lives.
   */
  fellOnTurn: number | null;
  squad: SquadMember[];
  /** The squad member who is the leader. Cosmetic for now: it picks the figure shown on the map. */
  leaderTile: Tile;
  /** Spells on the warband that its units bring into battle for a while. */
  enchantments: Enchantment[];
  /** Items worn in the leader's equipment slots (`rules/items.ts`), and carried unworn. */
  worn: string[];
  bag: string[];
}

/** A spell's lasting effect on a warband or a city's defenders, until the end of turn `until`. */
export interface Enchantment {
  readonly spell: string;
  readonly effect: EffectSeed;
  readonly until: number;
}

/** A node on the map: it belongs to the nearest city (`cityOfNode`). */
export interface MapNode {
  readonly id: string;
  readonly kind: NodeKind;
  readonly hex: Hex;
  /** The city it belongs to: the nearest one, fixed when the map is made (cities never move). */
  readonly cityId: string;
  /** Raised by investment (1 when found). */
  level: number;
}

export interface City {
  readonly id: string;
  readonly kind: "capitol" | "city";
  readonly hex: Hex;
  owner: PlayerId | null;
  /** The leaderless fortification squad. A Capitol's includes its Guardian. */
  garrison: SquadMember[];
  /** Upgraded with gold: garrison slots and armor for defenders (balance.ts, CITY_SLOTS). Kept when captured. */
  tier: number;
  /** Spells on the city: its defenders bring them into battle. */
  enchantments: Enchantment[];
}

/** A one-time dungeon reward (user's 2024 design: gold, a creature that joins you; items once they exist). */
export interface Reward {
  readonly gold: number;
  readonly joins: string | null;
  /** An item for the victor's leader's bag. */
  readonly item: string | null;
}

interface LairBase {
  readonly id: string;
  readonly hex: Hex;
  guards: SquadMember[];
}

/** A bandit camp: cleared, it regrows. */
export interface Camp extends LairBase {
  readonly kind: "camp";
  /** The turn a cleared camp regrows (provisional, provisional.md #19); null while guarded. */
  regrowsOn: number | null;
}

/** A dungeon: guards and a one-time reward. */
export interface Dungeon extends LairBase {
  readonly kind: "dungeon";
  readonly reward: Reward;
  looted: boolean;
}

/** A neutral group on the map. */
export type Lair = Camp | Dungeon;

interface StructureBase {
  readonly id: string;
  readonly hex: Hex;
}

/** Hires out its units, as many as are paid for. */
export interface MercenaryCamp extends StructureBase {
  readonly kind: "mercenaries";
  readonly stock: readonly Hire[];
}

/** Sells the staples always, and its wares until they're gone or replaced; what it buys joins the wares. */
export interface Merchant extends StructureBase {
  readonly kind: "merchant";
  wares: string[];
  /** The turn new wares replace these. */
  restocksOn: number;
}

/** Sells spells; each player learns each once, and the stock never runs out. */
export interface MageMerchant extends StructureBase {
  readonly kind: "mage";
  readonly stock: readonly string[];
}

/** A map structure a warband visits by standing on it (`rules/structures.ts`). */
export type Structure = MercenaryCamp | Merchant | MageMerchant;

export type Defender = { kind: "leader"; leaderId: string } | { kind: "garrison"; cityId: string } | { kind: "lair"; lairId: string };

export interface Engagement {
  readonly attackerId: string;
  readonly defender: Defender;
  readonly battle: Battle;
  /** The player on each battle side: side 0 attacks, side 1 defends (null: neutrals). */
  readonly players: readonly [PlayerId, PlayerId | null];
}

export interface World {
  readonly map: WorldMap;
  leaders: Leader[];
  cities: City[];
  nodes: MapNode[];
  lairs: Lair[];
  structures: Structure[];
  players: Player[];
  turn: number;
  /** Whose turn it is. Players take turns in order; a round ends when the order wraps around. */
  activePlayer: PlayerId;
  engagement: Engagement | null;
  /** The last player standing (Guardians fallen for all the others). */
  outcome: { winner: PlayerId } | null;
  nextLeader: number;
}

/** A squad on the map: a city's garrison, or a warband (`world/squads.ts`). */
export type SquadRef = { readonly kind: "garrison"; readonly cityId: string } | { readonly kind: "warband"; readonly leaderId: string };

export type WorldAction =
  | { type: "move"; leaderId: string; to: Hex }
  | { type: "endTurn" }
  /** `tile` picks the spot; without it, the first free one. */
  | { type: "recruit"; defId: string; into: SquadRef; tile?: Tile }
  /** Move a unit between squads that meet, or within one; onto an occupied tile, the two swap. */
  | { type: "transfer"; from: SquadRef; fromTile: Tile; to: SquadRef; toTile: Tile }
  | { type: "elevate"; tile: Tile }
  /** Choose a branch at a fork: free and permanent, for every unit of that kind. */
  | { type: "choose"; fork: string; to: string }
  | { type: "resurrect"; index: number; into: SquadRef; tile?: Tile }
  | { type: "learn"; leaderId: string; skill: string }
  /** Revive a warband's fallen leader at the Capitol. */
  | { type: "revive"; leaderId: string }
  | { type: "research"; research: string }
  /** Raise a node of a city you hold one level. */
  | { type: "investNode"; nodeId: string }
  /** Learn a spell at the Capitol. */
  | { type: "learnSpell"; spell: string }
  /** Cast a learned spell at a hex in sight. */
  | { type: "castSpell"; spell: string; at: Hex }
  /** Put on an item from the leader's bag; take one off into the bag. */
  | { type: "equip"; leaderId: string; item: string }
  | { type: "unequip"; leaderId: string; item: string }
  /** Raise a city you hold one tier. */
  | { type: "upgradeCity"; cityId: string }
  /** Buy a unit-type upgrade: units that become that type from now on receive it. */
  | { type: "upgrade"; upgrade: string }
  /** At a mercenary camp the warband stands on: hire one of the stock's `index`th kind into the warband. */
  | { type: "hire"; leaderId: string; index: number; tile?: Tile }
  /** At a merchant the warband stands on: buy an item into the leader's bag, or sell one from it. */
  | { type: "buyItem"; leaderId: string; item: string }
  | { type: "sellItem"; leaderId: string; item: string }
  /** At a mage merchant the warband stands on: learn a spell. */
  | { type: "buySpell"; leaderId: string; spell: string }
  /** Use a consumable from the leader's bag (a potion), wherever the warband is. */
  | { type: "useItem"; leaderId: string; item: string };

export type WorldEvent =
  | { type: "moved"; leaderId: string; path: readonly Hex[] }
  | { type: "engaged"; attackerId: string; defender: Defender }
  | { type: "captured"; cityId: string; player: PlayerId }
  /** A city's bells (a Bell tower): an enemy warband ended a march near it; news for `player`, who holds it. */
  | { type: "alarm"; cityId: string; leaderId: string; player: PlayerId }
  | { type: "turnStarted"; player: PlayerId; turn: number; income: number }
  | { type: "recruited"; defId: string; into: SquadRef }
  | { type: "transferred"; from: SquadRef; to: SquadRef }
  | { type: "elevated"; leaderId: string }
  | { type: "leaderFell"; leaderId: string; player: PlayerId }
  | { type: "xp"; player: PlayerId; pool: number; each: number }
  | { type: "evolved"; player: PlayerId; from: string; to: string }
  | { type: "leveled"; player: PlayerId; defId: string; level: number }
  | { type: "fell"; player: PlayerId; defId: string }
  | { type: "chose"; player: PlayerId; fork: string; to: string }
  | { type: "cleared"; lairId: string; player: PlayerId }
  | { type: "regrew"; lairId: string }
  | { type: "looted"; lairId: string; player: PlayerId; gold: number; joins: string | null; item: string | null }
  | { type: "spoils"; leaderId: string; items: readonly string[] }
  | { type: "resurrected"; player: PlayerId; defId: string }
  | { type: "learned"; leaderId: string; skill: string }
  | { type: "revived"; leaderId: string }
  | { type: "cityUpgraded"; cityId: string; tier: number }
  | { type: "researched"; player: PlayerId; research: string }
  | { type: "nodeInvested"; nodeId: string; level: number }
  | { type: "upgraded"; player: PlayerId; upgrade: string }
  | { type: "spellLearned"; player: PlayerId; spell: string }
  | { type: "spellCast"; player: PlayerId; spell: string; at: Hex }
  | { type: "hired"; leaderId: string; defId: string }
  | { type: "bought"; leaderId: string; item: string }
  | { type: "sold"; leaderId: string; item: string; gold: number }
  | { type: "used"; leaderId: string; item: string }
  | { type: "restocked"; structureId: string }
  | { type: "worldEnd"; winner: PlayerId }
  | { type: "eliminated"; player: PlayerId };

export interface WorldStep {
  readonly world: World;
  readonly events: readonly WorldEvent[];
}


export const fullHp = (defId: string) => UNITS[defId]?.stats.maxHp ?? 0;

/** Only a fallen leader stays in its squad at 0 HP; every other dead unit leaves for the graveyard. */
export const alive = (m: SquadMember) => m.hp > 0;

export const leaderUnit = (leader: Leader): SquadMember | undefined => leader.squad.find((m) => m.tile.row === leader.leaderTile.row && m.tile.col === leader.leaderTile.col);

export const member = (defId: string, tile: Tile): SquadMember => ({ defId, tile, hp: fullHp(defId), xp: 0, marks: [], level: 0 });

export const emptyMemory = (): Memory => ({ cities: [], lairs: [], nodes: [], structures: [] });

export type Strength = "weak" | "medium" | "strong";

/**
 * Provisional bandit groups (the user's bandit units; formations, sizes and levels are placeholders). The user:
 * neutrals should be a challenge from the start. Stronger groups are bigger and seasoned (levels, pillars.md).
 */
const BANDIT_GROUPS: Readonly<Record<Strength, { readonly level: number; readonly units: readonly [string, Tile][] }>> = {
  weak: {
    level: 0,
    units: [["brigand", { row: 0, col: 0 }], ["marauder", { row: 0, col: 1 }], ["bandit", { row: 1, col: 0 }], ["hedge_mage", { row: 1, col: 1 }]],
  },
  medium: {
    level: 2,
    units: [
      ["brigand", { row: 0, col: 0 }], ["marauder", { row: 0, col: 1 }], ["brigand", { row: 0, col: 2 }],
      ["bandit", { row: 1, col: 0 }], ["hedge_mage", { row: 1, col: 1 }],
    ],
  },
  strong: {
    level: 4,
    units: [
      ["marauder", { row: 0, col: 0 }], ["brigand", { row: 0, col: 1 }], ["marauder", { row: 0, col: 2 }],
      ["bandit", { row: 1, col: 0 }], ["hedge_mage", { row: 1, col: 1 }], ["bandit", { row: 1, col: 2 }],
    ],
  },
};

export function banditGroup(strength: Strength): SquadMember[] {
  const { level, units } = BANDIT_GROUPS[strength];
  return units.map(([defId, tile]) => {
    const hp = fullHp(defId);
    return { ...member(defId, tile), level, hp: hp + levelBonus(hp, level) };
  });
}

/** Stronger the further from both Capitols: easy fights near home, harder ones in the middle. */
export function strengthAt(map: WorldMap, hex: Hex, atLeast: Strength): Strength {
  const near = Math.min(...map.starts.map((s) => hexDistance(s, hex)));
  const byDistance: Strength = near <= 3 ? "weak" : near <= 4 ? "medium" : "strong";
  const order: readonly Strength[] = ["weak", "medium", "strong"];
  return order[Math.max(order.indexOf(byDistance), order.indexOf(atLeast))] ?? atLeast;
}

/** Provisional dungeon rewards, alternating between gold and a unit that joins. */
export const DUNGEON_REWARDS: readonly Reward[] = [
  { gold: 200, joins: null, item: null },
  { gold: 50, joins: "hedge_mage", item: null },
  { gold: 50, joins: null, item: "ankh" },
  { gold: 0, joins: null, item: "war_banner" },
  { gold: 50, joins: null, item: "hatchet" },
  { gold: 0, joins: null, item: "outlaws_pocketwatch" },
];

export function unitId(side: Side, tile: Tile): string {
  return `${side}.${tile.row}.${tile.col}`;
}

export function leaderById(world: World, id: string): Leader {
  const leader = world.leaders.find((l) => l.id === id);
  if (!leader) throw new Error(`unknown leader: ${id}`);
  return leader;
}

export function cityById(world: World, id: string): City {
  const city = world.cities.find((c) => c.id === id);
  if (!city) throw new Error(`unknown city: ${id}`);
  return city;
}

export function leaderAt(world: World, hex: Hex): Leader | undefined {
  return world.leaders.find((l) => sameHex(l.hex, hex));
}

/** A lair whose guards still stand. Looted dungeons and cleared camps don't block anything. */
export function lairAt(world: World, hex: Hex): Lair | undefined {
  return world.lairs.find((l) => sameHex(l.hex, hex) && l.guards.length > 0);
}

export function lairById(world: World, id: string): Lair {
  const lair = world.lairs.find((l) => l.id === id);
  if (!lair) throw new Error(`unknown lair: ${id}`);
  return lair;
}

export function cityAt(world: World, hex: Hex): City | undefined {
  return world.cities.find((c) => sameHex(c.hex, hex));
}

export function playerOf(world: World, id: PlayerId): Player {
  const player = world.players[id];
  if (!player) throw new Error(`unknown player: ${id}`);
  return player;
}

/** The player whose turn it is. */
export const active = (world: World): Player => playerOf(world, world.activePlayer);

export function capitolOf(world: World, side: PlayerId): City | undefined {
  return world.cities.find((c) => c.kind === "capitol" && c.owner === side);
}

/** The city a node belongs to; unknown to a player who hasn't found that city yet (`world/vision.ts`). */
export const cityOfNode = (world: World, node: MapNode): City | undefined => world.cities.find((c) => c.id === node.cityId);

export const nodesOf = (world: World, city: City): MapNode[] => world.nodes.filter((n) => cityOfNode(world, n)?.id === city.id);

/** A city gift (`nodes.ts` CityGifts) from each of the city's nodes that has it, at the node's level. */
export function giftsOf(world: World, city: City, gift: Exclude<keyof CityGifts, "defenderEffects" | "tribeRecruits">): number[] {
  return nodesOf(world, city).flatMap((n) => {
    const at = NODES[n.kind].city?.[gift];
    return at ? [at(n.level)] : [];
  });
}

/** The tribe units a city can recruit (a Tribal outpost), besides its holder's own. */
export function tribeRecruitsOf(world: World, city: City): string[] {
  return [...new Set(nodesOf(world, city).flatMap((n) => [...(NODES[n.kind].city?.tribeRecruits?.(n.level) ?? [])]))];
}

/** Every node whose city this side holds. */
export const nodesHeldBy = (world: World, side: PlayerId): MapNode[] => world.nodes.filter((n) => cityOfNode(world, n)?.owner === side);
