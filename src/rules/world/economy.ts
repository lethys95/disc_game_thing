import { CAPITOL_MANA, CAMP_MEDIUM_FROM, CAMP_STRONG_FROM, CITY_HEALING_PER_TIER, CITY_MAX_TIER, CITY_UPGRADE_COST, NODE_INVEST_COST, CAPITOL_INCOME, RESURRECTION_BASE, RESURRECTION_PREMIUM } from "#rules/balance";
import type { Tile } from "#rules/battle/types";
import { chooseProblem, isFork, openForks } from "#rules/forks";
import { COLS, ROWS, sameTile } from "#rules/battle/grid";
import { hexDistance, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { effectDef } from "#rules/effects";
import { biomeAt } from "#rules/map";
import { NODES } from "#rules/nodes";
import type { CityGifts } from "#rules/nodes";
import { grow, xpToEvolve } from "#rules/progression";
import { EVOLUTIONS, FACTION_ROOTS, isGuardian, LINE_ARCHETYPE, RECRUIT_COST, UNITS } from "#rules/units/index";
import { freeRevival, giftOf, learnProblem, movementOf, squadHealingOf } from "#rules/world/leaders";
import { maxHpOf } from "#rules/world/record";
import { CITY_RESURRECTION_PREMIUM, RESEARCH } from "#rules/research";
import { UPGRADES, upgradesFor } from "#rules/upgrades";
import { playerOf, alive, neutralGroup, capitolOf, cityById, cityOfNode, giftsOf, leaderAt, leaderById, leaderUnit, member, nodesHeldBy, nodesOf, tribeAt, tribeRecruitsOf } from "#rules/world/state";
import type { PlayerId, City, Leader, MapNode, Mark, SquadMember, SquadRef, Strength, World, WorldEvent } from "#rules/world/state";
import { capacityOf, cityOfSquad, ownerOf, squadAt } from "#rules/world/squads";
import { hireCost, MERCHANT_RESTOCK_TURNS, merchantWares } from "#rules/structures";

/** Gold, recruiting, branch choices, resurrection, elevation, and the start of a side's turn. */

export function income(world: World, side: PlayerId): number {
  const nodes = nodesHeldBy(world, side).reduce((sum, n) => sum + NODES[n.kind].income(n.level), 0);
  const items = world.leaders.filter((l) => l.player === side).reduce((sum, l) => sum + giftOf(l, "gold"), 0);
  return (capitolOf(world, side) ? CAPITOL_INCOME : 0) + nodes + items;
}


/**
 * Where a new unit goes when nobody says: melee units fill from the front row, everyone else (supports, mages,
 * ranged) from the back. By the line the unit's type belongs to.
 */
export function freeTile(squad: readonly SquadMember[], defId: string): Tile | null {
  const rows = LINE_ARCHETYPE[rootOf(defId)] === "melee" ? ROWS : [...ROWS].reverse();
  for (const row of rows) for (const col of COLS) if (!squad.some((m) => sameTile(m.tile, { row, col }))) return { row, col };
  return null;
}

/** The tier-1 unit a type's line starts from. */
function rootOf(defId: string): string {
  const parent = Object.entries(EVOLUTIONS).find(([, next]) => next.some((e) => e.to === defId))?.[0];
  return parent ? rootOf(parent) : defId;
}

/**
 * What recruiting `defId` in `city` costs: its faction's price, or for a tribe unit (a Tribal outpost) what a
 * mercenary camp asks; less the city's Bog iron. Null if it's neither.
 */
export function recruitCost(world: World, defId: string, city: City | undefined): number | null {
  const own = RECRUIT_COST[defId];
  const base = own ?? (UNITS[defId]?.faction === "neutral" ? hireCost({ defId, level: 0 }) : null);
  if (base === null) return null;
  const discount = city ? Math.max(0, ...giftsOf(world, city, "recruitDiscount")) : 0;
  return Math.round(base * (1 - discount));
}

/**
 * Why a recruit order can't happen, or null if it can. Any city you hold recruits your faction's first tiers
 * (pillars.md, "Cities"); a city with a Tribal outpost also recruits its tribe.
 */
export function recruitProblem(world: World, defId: string, into: SquadRef, tile?: Tile): string | null {
  const side = world.activePlayer;
  const cost = recruitCost(world, defId, cityOfSquad(world, into));
  const own = FACTION_ROOTS[playerOf(world, side).faction].includes(defId);
  if (cost === null) return "not recruitable";
  if (playerOf(world, side).gold < cost) return "not enough gold";
  const offers = (city: City) => city.owner === side && (own || tribeRecruitsOf(world, city).includes(defId));
  return placeProblem(world, into, tile, offers, own ? "only in a city you hold" : "only in a city with a Tribal outpost that offers it");
}

/**
 * Why a new unit can't be put into this squad, or null: a garrison of a city that qualifies, or a warband standing
 * in one; room left; and the tile, if one is named, free.
 */
function placeProblem(world: World, into: SquadRef, tile: Tile | undefined, qualifies: (city: City) => boolean, refusal: string): string | null {
  const side = world.activePlayer;
  if (ownerOf(world, into) !== side) return "not your squad";
  const city = cityOfSquad(world, into);
  if (!city || !qualifies(city)) return into.kind === "garrison" ? refusal : `the warband must stand there: ${refusal}`;
  const squad = squadAt(world, into);
  if (squad.length >= capacityOf(world, into)) return into.kind === "warband" ? `squad full (Leadership ${capacityOf(world, into)})` : "garrison full";
  if (tile && squad.some((m) => sameTile(m.tile, tile))) return "that spot is taken";
  // Slots aside, the grid itself can be full (tribe units in a garrison take no slot, but they do take a tile).
  if (squad.length >= ROWS.length * COLS.length) return into.kind === "warband" ? "squad full" : "garrison full";
  return null;
}

/** Why this side can't choose `to` at `fork` now, or null. */
export function chooseBranchProblem(world: World, fork: string, to: string): string | null {
  const side = world.activePlayer;
  if (!openForks(playerOf(world, side).faction, playerOf(world, side).commitment).includes(fork)) return "not an open fork";
  return chooseProblem(playerOf(world, side).commitment, fork, to);
}

/** Forks where one of this side's units waits, XP full, for a choice. The view prompts; the AI just chooses. */
export function waitingForks(world: World, side: PlayerId): string[] {
  const forks = squadsOf(world, side).flatMap(({ squad }) => squad.filter((m) => alive(m) && isFork(m.defId) && playerOf(world, side).commitment[m.defId] === undefined && m.xp >= (xpToEvolve(m.defId) ?? Infinity)).map((m) => m.defId));
  return [...new Set(forks)];
}

/** Canon: dear at once, cheaper for each turn you wait, down to a base by tier. */
function raiseCost(world: World, defId: string, fellOnTurn: number): number {
  const base = RESURRECTION_BASE * Math.max(1, UNITS[defId]?.tier ?? 1);
  return base * Math.max(1, RESURRECTION_PREMIUM - (world.turn - fellOnTurn));
}

/**
 * Outside the Capitol, a premium (research, CITY_RESURRECTION_PREMIUM); in a city with an Ossuary, the Capitol's
 * price less its discount instead.
 */
export function resurrectionCost(world: World, side: PlayerId, index: number, city?: City): number | null {
  const fallen = playerOf(world, side).graveyard[index];
  if (!fallen) return null;
  const base = raiseCost(world, fallen.defId, fallen.fellOnTurn);
  if (!city || city.kind === "capitol") return base;
  const ossuaries = giftsOf(world, city, "raisesDead");
  return ossuaries.length > 0 ? Math.round(base * (1 - Math.max(...ossuaries))) : Math.round(base * CITY_RESURRECTION_PREMIUM);
}

/** Reviving a warband's fallen leader costs what resurrecting it would (provisional). */
/** What reviving a fallen leader costs: what resurrecting it would (provisional), or nothing with an Ankh. */
export function reviveCost(world: World, leader: Leader): number | null {
  const own = leaderUnit(leader);
  if (!own || leader.fellOnTurn === null) return null;
  return freeRevival(leader) ? 0 : raiseCost(world, own.defId, leader.fellOnTurn);
}

export function reviveProblem(world: World, leaderId: string): string | null {
  const leader = leaderById(world, leaderId);
  const capitol = capitolOf(world, world.activePlayer);
  const cost = reviveCost(world, leader);
  if (leader.player !== world.activePlayer) return "not your leader";
  if (cost === null) return "the leader stands";
  if (!capitol || !sameHex(leader.hex, capitol.hex)) return "the warband must stand in the Capitol";
  if (playerOf(world, leader.player).gold < cost) return "not enough gold";
  return null;
}

/**
 * Resurrection happens at the Capitol, into its garrison or a warband standing in it; with the research, in any
 * city you hold, for a premium.
 */
export function resurrectProblem(world: World, index: number, into: SquadRef, tile?: Tile): string | null {
  const side = world.activePlayer;
  const city = cityOfSquad(world, into);
  const cost = resurrectionCost(world, side, index, city);
  if (cost === null) return "nobody there";
  if (playerOf(world, side).gold < cost) return "not enough gold";
  const refusal = raisesDeadAnywhere(world, side) ? "only in a city you hold" : "only at the Capitol, until researched for cities";
  return placeProblem(world, into, tile, (c) => raisesDeadAt(world, side, c), refusal);
}

/**
 * Whether `player` can raise its dead in `city`: at its Capitol, in a city it holds with an Ossuary, or in any city it
 * holds once researched.
 */
export function raisesDeadAt(world: World, player: PlayerId, city: City): boolean {
  return city.owner === player && (city.kind === "capitol" || giftsOf(world, city, "raisesDead").length > 0 || raisesDeadAnywhere(world, player));
}

const raisesDeadAnywhere = (world: World, player: PlayerId): boolean => playerOf(world, player).research.includes("city_resurrection");

export function researchProblem(world: World, id: string): string | null {
  const side = world.activePlayer;
  const research = RESEARCH.find((r) => r.id === id);
  if (!research) return "no such research";
  if (playerOf(world, side).research.includes(id)) return "already done";
  if (!capitolOf(world, side)) return "no Capitol";
  if (playerOf(world, side).gold < research.cost) return "not enough gold";
  return null;
}

/** A squad and its leader; garrisons have none. */
export interface Held {
  readonly squad: SquadMember[];
  readonly leader: Leader | undefined;
}

/** Every squad a side owns: its warbands and its garrisons. */
export function squadsOf(world: World, side: PlayerId): Held[] {
  return [
    ...world.leaders.filter((l) => l.player === side).map((l) => ({ squad: l.squad, leader: l })),
    ...world.cities.filter((c) => c.owner === side).map((c) => ({ squad: c.garrison, leader: undefined })),
  ];
}

/**
 * The marks a unit receives on becoming `defId`: the side's upgrades for that type. Upgrades bought later never
 * reach it; a unit that becomes the type later does (the timing rule, docs/design/pillars.md).
 */
export function marksOnBecoming(world: World, side: PlayerId, defId: string): Mark[] {
  return upgradesFor(defId)
    .filter((u) => playerOf(world, side).upgrades.includes(u.id))
    .map((u): Mark => ({ effect: u.effect, source: { kind: "upgrade", upgrade: u.id } }));
}

/** What a unit of `defId` recruited in `city` carries from the city's nodes (a Blacksmith's edge). */
export function nodeMarks(world: World, city: City | undefined, defId: string): Mark[] {
  if (!city) return [];
  return nodesOf(world, city).flatMap((n) => NODES[n.kind].recruitEffects(n.level, defId).map((effect): Mark => ({ effect, source: { kind: "node", node: n.kind, cityId: city.id } })));
}

/** A new unit for `side`: recruited, joining, or otherwise acquired. */
export function newcomer(world: World, side: PlayerId, defId: string, tile: Tile): SquadMember {
  return { ...member(defId, tile), marks: marksOnBecoming(world, side, defId) };
}

/** A unit recruited in `city`: what its nodes give it, the marks (a Blacksmith's edge) and levels (a Training yard). */
export function recruitIn(world: World, side: PlayerId, defId: string, tile: Tile, city: City | undefined): SquadMember {
  const recruit = newcomer(world, side, defId, tile);
  const levels = city ? Math.max(0, ...giftsOf(world, city, "recruitLevels")) : 0;
  const trained = { ...recruit, level: levels, marks: [...recruit.marks, ...nodeMarks(world, city, defId)] };
  return { ...trained, hp: maxHpOf(trained, undefined) };
}

/** Evolves or levels members in place (those `who` picks); a new form or level arrives at full health (provisional). */
export function growSquad(world: World, { squad, leader }: Held, gained: number, side: PlayerId, events: WorldEvent[], who: (m: SquadMember) => boolean = () => true): void {
  squad.forEach((m, i) => {
    if (!alive(m) || !who(m)) return;
    const growth = grow(m.defId, m.xp, gained, playerOf(world, side).commitment);
    let from = m.defId;
    for (const to of growth.evolvedInto) {
      events.push({ type: "evolved", player: side, from, to });
      from = to;
    }
    if (growth.levels > 0) {
      const leveled = { ...m, xp: growth.xp, level: m.level + growth.levels };
      events.push({ type: "leveled", player: side, defId: m.defId, level: leveled.level });
      squad[i] = { ...leveled, hp: maxHpOf(leveled, leader) };
      return;
    }
    if (growth.evolvedInto.length === 0) {
      squad[i] = { ...m, xp: growth.xp };
      return;
    }
    const marks = [...m.marks, ...growth.evolvedInto.flatMap((to) => marksOnBecoming(world, side, to))];
    const evolved = { ...m, defId: growth.defId, xp: growth.xp, marks };
    squad[i] = { ...evolved, hp: maxHpOf(evolved, leader) };
  });
}

/** Any city its holder holds elevates a garrison unit to lead a new warband (the user, 2026-10-15). */
export function elevateProblem(world: World, cityId: string, tile: Tile): string | null {
  const city = cityById(world, cityId);
  if (city.owner !== world.activePlayer) return "not your city";
  const unit = city.garrison.find((m) => sameTile(m.tile, tile));
  if (!unit) return "no unit there";
  if (isGuardian(unit.defId)) return "the Guardian never leaves the Capitol";
  if (leaderAt(world, city.hex)) return `a leader already stands in ${city.kind === "capitol" ? "the Capitol" : "the city"}`;
  return null;
}


/** Mana per turn: a trickle from the Capitol, more from mana nodes. */
export function manaIncome(world: World, side: PlayerId): number {
  return (capitolOf(world, side) ? CAPITOL_MANA : 0) + nodesHeldBy(world, side).reduce((sum, n) => sum + NODES[n.kind].mana(n.level), 0);
}

export function startTurn(world: World, events: WorldEvent[]): void {
  const side = world.activePlayer;
  const earned = income(world, side);
  const player = playerOf(world, side);
  player.gold += earned;
  player.mana += manaIncome(world, side);
  player.cast = [];
  for (const { squad, leader } of squadsOf(world, side)) {
    const home = world.cities.find((c) => c.owner === side && (leader === undefined ? squad === c.garrison : sameHex(leader.hex, c.hex)));
    const resting = home ? CITY_HEALING_PER_TIER * home.tier * restingPace(world, home, leader === undefined) : 0;
    const share = resting + (leader ? warbandHealing(world, leader, home) : 0);
    if (share === 0) continue;
    squad.forEach((m, i) => {
      if (!alive(m)) return;
      const max = maxHpOf(m, leader);
      squad[i] = { ...m, hp: Math.min(max, m.hp + Math.ceil(max * share * markedHealing(m))) };
    });
  }
  for (const leader of world.leaders) {
    if (leader.player !== side) continue;
    leader.movement = movementOf(leader) + nextToWaystation(world, leader, (city) => city?.waystationMovement);
    leader.sureFooted = sureFootingAt(world, side, leader.hex);
  }
  // A Training yard's garrison drills: a little XP a turn.
  for (const city of world.cities.filter((c) => c.owner === side)) {
    const drill = Math.max(0, ...giftsOf(world, city, "garrisonTraining"));
    if (drill > 0) growSquad(world, { squad: city.garrison, leader: undefined }, drill, side, events, (m) => !isGuardian(m.defId));
  }

  events.push({ type: "turnStarted", player: side, turn: world.turn, income: earned });
}

/** How many times faster a squad rests in its city: a Granary's garrison, or anyone of the holder's at an Oasis. */
function restingPace(world: World, city: City, garrison: boolean): number {
  return Math.max(1, ...giftsOf(world, city, "restHealing"), ...(garrison ? giftsOf(world, city, "garrisonHealing") : []));
}

/**
 * What a warband regenerates at the start of its turn, besides resting in a city: its leader's healing, a Waystation
 * beside it, provisions from a Granary it left. Nothing near an enemy's Oasis (the user: "regenerate nothing, rather.
 * Healing should still be possible"); items and spells still heal there. Standing in a Granary city packs provisions.
 */
function warbandHealing(world: World, leader: Leader, home: City | undefined): number {
  const packed = home ? Math.max(0, ...giftsOf(world, home, "provisions")) : 0;
  const carried = leader.provisions;
  if (home && packed > 0) leader.provisions = { share: CITY_HEALING_PER_TIER * home.tier * restingPace(world, home, false), turns: packed };
  else if (!home && carried) leader.provisions = carried.turns > 1 ? { ...carried, turns: carried.turns - 1 } : null;
  if (leader.fellOnTurn !== null || inDrought(world, leader)) return 0;
  const provisions = !home && carried ? carried.share : 0;
  return squadHealingOf(leader) + nextToWaystation(world, leader, (city) => city?.waystation) + provisions;
}

/** The best gift among its side's Waystations beside the warband (heal share, extra movement). */
function nextToWaystation(world: World, leader: Leader, gift: (city: CityGifts | undefined) => ((level: number) => number) | undefined): number {
  return Math.max(0, ...nodesHeldBy(world, leader.player).filter((n) => hexDistance(n.hex, leader.hex) <= 1).map((n) => gift(NODES[n.kind].city)?.(n.level) ?? 0));
}

/** Whether an enemy's Oasis keeps this warband from regenerating. */
const inDrought = (world: World, leader: Leader): boolean =>
  world.cities.some((c) => c.owner !== null && c.owner !== leader.player && giftsOf(world, c, "drought").some((reach) => reach > 0 && hexDistance(c.hex, leader.hex) <= reach));

/** How many times faster a unit heals on the map by its marks (an Oasis-born unit). */
const markedHealing = (m: SquadMember): number => Math.max(1, ...m.marks.map((mark) => effectDef(mark.effect.def).mapHealing ?? 1));

/** Whether a warband starting its turn on `hex` is within reach of one of its side's Dog yards. */
function sureFootingAt(world: World, side: PlayerId, hex: Hex): boolean {
  return world.cities.some((c) => c.owner === side && giftsOf(world, c, "sureFooting").some((reach) => hexDistance(c.hex, hex) <= reach));
}

export function learnSkillProblem(world: World, leaderId: string, skill: string): string | null {
  const leader = leaderById(world, leaderId);
  if (leader.player !== world.activePlayer) return "not your leader";
  return learnProblem(leader, skill);
}

export function upgradeProblem(world: World, id: string): string | null {
  const side = world.activePlayer;
  const upgrade = UPGRADES.get(id);
  if (!upgrade) return "no such upgrade";
  if (UNITS[upgrade.unitType]?.faction !== playerOf(world, side).faction) return "another faction's unit";
  if (playerOf(world, side).upgrades.includes(id)) return "already bought";
  if (!capitolOf(world, side)) return "no Capitol";
  if (playerOf(world, side).gold < upgrade.price) return "not enough gold";
  return null;
}

/** A new round (every player has moved): cleared camps regrow (provisional, #19), stronger as the game goes on. */
export function startRound(world: World, events: WorldEvent[]): void {
  // Spells on warbands and cities wear off, and so does salt on the ground.
  const lasting = (e: { readonly until: number }) => e.until >= world.turn;
  world.wards = world.wards.filter(lasting);
  for (const leader of world.leaders) leader.enchantments = leader.enchantments.filter(lasting);
  for (const city of world.cities) city.enchantments = city.enchantments.filter(lasting);
  const strength: Strength = world.turn >= CAMP_STRONG_FROM ? "strong" : world.turn >= CAMP_MEDIUM_FROM ? "medium" : "weak";
  // Merchants lay out new wares every few rounds (user: limited, changing, and they come back).
  for (const merchant of world.structures) {
    if (merchant.kind !== "merchant" || merchant.restocksOn > world.turn) continue;
    merchant.wares = merchantWares(merchant.id, world.turn, biomeAt(world.map, merchant.hex));
    merchant.restocksOn = world.turn + MERCHANT_RESTOCK_TURNS;
    events.push({ type: "restocked", structureId: merchant.id });
  }
  for (const lair of world.lairs) {
    if (lair.kind !== "camp" || lair.regrowsOn === null || lair.regrowsOn > world.turn || leaderAt(world, lair.hex)) continue;
    lair.guards = neutralGroup(tribeAt(world.map, lair.hex), strength);
    lair.regrowsOn = null;
    events.push({ type: "regrew", lairId: lair.id });
  }
}

/** The next tier's price, less the city's best upgrade discount (a Quarry). */
export const cityUpgradeCost = (world: World, city: City): number =>
  Math.round(CITY_UPGRADE_COST * (city.tier + 1) * (1 - Math.max(0, ...giftsOf(world, city, "upgradeDiscount"))));

export function upgradeCityProblem(world: World, cityId: string): string | null {
  const city = cityById(world, cityId);
  if (city.owner !== world.activePlayer) return "not your city";
  if (city.tier >= CITY_MAX_TIER) return "already at the highest tier";
  if (playerOf(world, world.activePlayer).gold < cityUpgradeCost(world, city)) return "not enough gold";
  return null;
}

export const nodeInvestCost = (node: MapNode): number => NODE_INVEST_COST * (node.level + 1);

export function investNodeProblem(world: World, nodeId: string): string | null {
  const node = world.nodes.find((n) => n.id === nodeId);
  if (!node) return "no such node";
  if (cityOfNode(world, node)?.owner !== world.activePlayer) return "its city isn't yours";
  if (node.level >= NODES[node.kind].maxLevel) return "already at its highest level";
  if (playerOf(world, world.activePlayer).gold < nodeInvestCost(node)) return "not enough gold";
  return null;
}
