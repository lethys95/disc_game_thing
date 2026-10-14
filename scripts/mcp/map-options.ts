import { BEHAVIORS } from "#rules/abilities/index";
import { describeSpell, spellById, spellsOf } from "#rules/spells";
import { forkOptions } from "#rules/forks";
import { hexDistance, hexKey, sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { itemById } from "#rules/items";
import { NODES } from "#rules/nodes";
import { nextForm } from "#rules/progression";
import { RESEARCH } from "#rules/research";
import { hireCost, resalePrice, STRUCTURES } from "#rules/structures";
import { FACTION_ROOTS, GUARDIAN_ID, UNITS } from "#rules/units/index";
import { upgradesOf } from "#rules/upgrades";
import { forecast } from "#rules/world/battles";
import { waitingForks, chooseBranchProblem, cityUpgradeCost, elevateProblem, freeTile, investNodeProblem, learnSkillProblem, nodeInvestCost, recruitCost, recruitProblem, researchProblem, resurrectionCost, resurrectProblem, reviveCost, reviveProblem, squadsOf, upgradeCityProblem, upgradeProblem } from "#rules/world/economy";
import { useItemProblem, wardTargets } from "#rules/world/items";
import { equipProblem, LEADER_SKILLS, movementOf, unequipProblem } from "#rules/world/leaders";
import { planMove } from "#rules/world/movement";
import type { MoveTarget } from "#rules/world/movement";
import { castProblem, learnSpellProblem, spellTargets, spellVictims } from "#rules/world/spells";
import { buyItemProblem, buySpellProblem, forSale, hireProblem, sellItemProblem, structureAt } from "#rules/world/structures";
import { transferProblem } from "#rules/world/squads";
import { cityAt, cityById, lairAt, leaderAt, playerOf, tribeAt, tribeRecruitsOf } from "#rules/world/state";
import type { City, Leader, PlayerId, SquadRef, World, WorldAction } from "#rules/world/state";
import type { Tile } from "#rules/battle/types";
import { knownWorld } from "#rules/world/vision";
import { cityName, leaderName, TRIBE_NAMES, unitName } from "#view/names";

/** Everything the seat can order on its map turn, in words, each checked by the rules' own `*Problem` functions. */

export interface MapOption {
  readonly text: string;
  readonly action: WorldAction;
}

/** A march's goals listed per warband: those reached this turn, and this many of the nearest others. */
const FAR_GOALS = 4;

/** Scouting offers up to this many unexplored hexes, at least this far apart. */
const SCOUT_DIRECTIONS = 3;
const SCOUT_SPREAD = 4;

export const at = (hex: Hex): string => `(${hex.q},${hex.r})`;

/** "a Seraph", "an Acolyte". */
export const a = (name: string): string => `${/^[AEIOU]/.test(name) ? "an" : "a"} ${name}`;

const tileName = (tile: Tile): string => `${"FMB"[tile.row] ?? "?"}${tile.col + 1}`;

export const warbandName = (leader: Leader): string => `${leader.id} (${leaderName(leader)})`;

export const squadName = (world: World, ref: SquadRef): string =>
  ref.kind === "warband" ? `${ref.leaderId}'s warband` : `the ${cityName(cityById(world, ref.cityId))} garrison`;

/** What stands on a hex, as the seat knows it. */
export function placeText(known: World, seat: PlayerId, hex: Hex): string {
  const leader = leaderAt(known, hex);
  if (leader) return leader.player === seat ? `your ${warbandName(leader)}` : `player ${leader.player}'s warband (${leader.squad.length} units)`;
  const lair = lairAt(known, hex);
  if (lair) return `${TRIBE_NAMES[tribeAt(known.map, hex)]} ${lair.kind === "camp" ? "camp" : "dungeon"} (${lair.guards.length} guards)`;
  const city = cityAt(known, hex);
  if (city) {
    const owner = city.owner === seat ? "your" : city.owner === null ? "neutral" : `player ${city.owner}'s`;
    return `${owner} ${city.kind === "capitol" ? "Capitol" : cityName(city)} (${city.garrison.length} defenders)`;
  }
  const structure = known.structures.find((s) => sameHex(s.hex, hex));
  return structure ? STRUCTURES[structure.kind].name : "open ground";
}

function forecastText(known: World, leader: Leader, target: MoveTarget): string {
  const done = forecast(known, leader.id, target);
  if (!done) return "";
  const standing = (side: 0 | 1) => Object.values(done.units).filter((u) => u.side === side && u.alive).length;
  return done.outcome?.winner === 0 ? ` Forecast: WIN, ${standing(0)} of yours standing.` : ` Forecast: LOSS, ${standing(1)} of theirs standing.`;
}

/** Where a warband could march: things worth reaching, the nearest unexplored land, its own cities. */
function goals(known: World, seat: PlayerId, leader: Leader): Hex[] {
  const hexes: Hex[] = [
    ...known.lairs.filter((l) => l.guards.length > 0).map((l) => l.hex),
    ...known.cities.filter((c) => c.owner !== seat || !sameHex(c.hex, leader.hex)).map((c) => c.hex),
    ...known.leaders.filter((l) => l.player !== seat).map((l) => l.hex),
    ...known.structures.filter((s) => !sameHex(s.hex, leader.hex)).map((s) => s.hex),
  ];
  return hexes.filter((h, i) => hexes.findIndex((o) => sameHex(o, h)) === i);
}

function marches(known: World, seat: PlayerId, leader: Leader): MapOption[] {
  if (leader.movement <= 0) return [];
  const name = warbandName(leader);
  const full = movementOf(leader);
  const plans = goals(known, seat, leader)
    .map((hex) => ({ hex, plan: planMove(known, leader.id, hex) }))
    .flatMap(({ hex, plan }) => (plan && plan.steps > 0 ? [{ hex, plan }] : plan?.target ? [{ hex, plan }] : []))
    .sort((a, b) => a.plan.path.cost - b.plan.path.cost);
  const options: MapOption[] = [];
  let far = 0;
  for (const { hex, plan } of plans) {
    const what = placeText(known, seat, hex);
    const target = plan.target;
    if (target) {
      const verb = target.kind === "capture" ? "takes the undefended" : "attacks";
      options.push({ text: `${name} ${verb} ${what} at ${at(hex)} this turn.${forecastText(known, leader, target)}`, action: { type: "move", leaderId: leader.id, to: hex } });
      continue;
    }
    if (far >= FAR_GOALS) continue;
    far += 1;
    const turns = Math.max(1, Math.ceil(plan.path.cost / full));
    const arrives = plan.steps === plan.path.hexes.length;
    const stop = plan.path.hexes[plan.steps - 1];
    const how = arrives ? "arrives this turn" : `about ${turns} turns away; stops at ${stop ? at(stop) : "?"} this turn`;
    options.push({ text: `${name} marches to ${what} at ${at(hex)}: ${how}.`, action: { type: "move", leaderId: leader.id, to: hex } });
  }
  const explored = new Set(playerOf(known, seat).explored);
  const unknown = Object.values(known.map.tiles)
    .filter((t) => !explored.has(hexKey(t.hex)))
    .sort((x, y) => hexDistance(leader.hex, x.hex) - hexDistance(leader.hex, y.hex));
  // A few directions to scout, far enough apart to be different choices.
  const picked: Hex[] = [];
  for (const tile of unknown) {
    if (picked.length >= SCOUT_DIRECTIONS) break;
    if (picked.some((hex) => hexDistance(hex, tile.hex) < SCOUT_SPREAD)) continue;
    const plan = planMove(known, leader.id, tile.hex);
    if (!plan || plan.steps === 0) continue;
    picked.push(tile.hex);
    const stop = plan.path.hexes[plan.steps - 1];
    options.push({ text: `${name} scouts toward unexplored land at ${at(tile.hex)} (stops at ${stop ? at(stop) : "?"} this turn).`, action: { type: "move", leaderId: leader.id, to: tile.hex } });
  }
  return options;
}

/** Squads standing in the seat's cities: where recruits, resurrections and transfers happen. */
function squadsInCities(world: World, seat: PlayerId): { city: City; refs: SquadRef[] }[] {
  return world.cities
    .filter((c) => c.owner === seat)
    .map((city) => ({
      city,
      refs: [{ kind: "garrison", cityId: city.id } as const, ...world.leaders.filter((l) => l.player === seat && sameHex(l.hex, city.hex)).map((l) => ({ kind: "warband", leaderId: l.id }) as const)],
    }));
}

function cityOrders(world: World, seat: PlayerId): MapOption[] {
  const player = playerOf(world, seat);
  const options: MapOption[] = [];
  for (const { city, refs } of squadsInCities(world, seat)) {
    const offered = [...FACTION_ROOTS[player.faction], ...tribeRecruitsOf(world, city)];
    for (const ref of refs) {
      for (const defId of offered) {
        if (recruitProblem(world, defId, { ...ref })) continue;
        options.push({ text: `Recruit ${a(unitName(defId))} (tier ${UNITS[defId]?.tier ?? 1}, ${recruitCost(defId)} gold) into ${squadName(world, ref)}.`, action: { type: "recruit", defId, into: ref } });
      }
      player.graveyard.forEach((fallen, index) => {
        if (resurrectProblem(world, index, ref)) return;
        options.push({ text: `Resurrect the fallen ${unitName(fallen.defId)} (${resurrectionCost(world, seat, index, city)} gold) into ${squadName(world, ref)}.`, action: { type: "resurrect", index, into: ref } });
      });
    }
    const garrison: SquadRef = { kind: "garrison", cityId: city.id };
    for (const warband of refs.filter((r) => r.kind === "warband")) {
      const leader = world.leaders.find((l) => l.id === (warband.kind === "warband" ? warband.leaderId : ""));
      if (!leader) continue;
      for (const m of city.garrison) {
        const tile = freeTile(leader.squad, m.defId);
        if (!tile || transferProblem(world, { from: garrison, fromTile: m.tile, to: warband, toTile: tile })) continue;
        options.push({ text: `Move the garrison's ${unitName(m.defId)} [${tileName(m.tile)}] into ${leader.id}'s warband.`, action: { type: "transfer", from: garrison, fromTile: m.tile, to: warband, toTile: tile } });
      }
      for (const m of leader.squad) {
        const tile = freeTile(city.garrison, m.defId);
        if (!tile || transferProblem(world, { from: warband, fromTile: m.tile, to: garrison, toTile: tile })) continue;
        options.push({ text: `Leave ${leader.id}'s ${unitName(m.defId)} [${tileName(m.tile)}] in the ${cityName(city)} garrison.`, action: { type: "transfer", from: warband, fromTile: m.tile, to: garrison, toTile: tile } });
      }
    }
    if (city.kind === "capitol") {
      for (const m of city.garrison) {
        if (m.defId === GUARDIAN_ID || elevateProblem(world, m.tile)) continue;
        options.push({ text: `Elevate the garrison's ${unitName(m.defId)} [${tileName(m.tile)}] to lead a new warband.`, action: { type: "elevate", tile: m.tile } });
      }
    }
    if (!upgradeCityProblem(world, city.id)) options.push({ text: `Raise ${cityName(city)}'s walls to tier ${city.tier + 1} (${cityUpgradeCost(world, city)} gold): more garrison room and armor.`, action: { type: "upgradeCity", cityId: city.id } });
  }
  for (const node of world.nodes) {
    if (investNodeProblem(world, node.id)) continue;
    const def = NODES[node.kind];
    options.push({ text: `Invest in the ${def.name} at ${at(node.hex)} (${nodeInvestCost(node)} gold): level ${node.level + 1}, ${def.describe(node.level + 1)}.`, action: { type: "investNode", nodeId: node.id } });
  }
  return options;
}

function capitolOrders(world: World, seat: PlayerId): MapOption[] {
  const player = playerOf(world, seat);
  const options: MapOption[] = [];
  // Only forks a unit waits at, XP full: choosing earlier is allowed (`order`), but listing every fork is noise.
  for (const fork of waitingForks(world, seat)) {
    for (const to of forkOptions(fork)) {
      if (chooseBranchProblem(world, fork, to)) continue;
      options.push({ text: `Choose the branch: every ${unitName(fork)} evolves into ${a(unitName(to))} from now on, and the waiting ones evolve now (free, permanent). ${describeUnitBriefly(to)}`, action: { type: "choose", fork, to } });
    }
  }
  for (const research of RESEARCH) {
    if (researchProblem(world, research.id)) continue;
    options.push({ text: `Research ${research.name} (${research.cost} gold): ${research.describe}`, action: { type: "research", research: research.id } });
  }
  // Only upgrades for unit types the seat has, or that its units are about to become: the rest stay off the list.
  const types = new Set(squadsOf(world, seat).flatMap((h) => h.squad.flatMap((m) => [m.defId, nextForm(m.defId, player.commitment) ?? m.defId])));
  for (const upgrade of upgradesOf(player.faction)) {
    if (!types.has(upgrade.unitType) || upgradeProblem(world, upgrade.id)) continue;
    options.push({ text: `Buy the upgrade ${upgrade.name} (${upgrade.price} gold): units that become ${a(unitName(upgrade.unitType))} from now on get it.`, action: { type: "upgrade", upgrade: upgrade.id } });
  }
  for (const spell of spellsOf(player.faction)) {
    if (learnSpellProblem(world, spell.id)) continue;
    options.push({ text: `Learn the spell ${spell.name} (${spell.learnCost} gold; ${spell.cost} mana per cast): ${describeSpell(spell)}`, action: { type: "learnSpell", spell: spell.id } });
  }
  return options;
}

function spellOrders(known: World, seat: PlayerId): MapOption[] {
  const options: MapOption[] = [];
  for (const id of playerOf(known, seat).spells) {
    const spell = spellById(id);
    for (const hex of spellTargets(known, id)) {
      if (castProblem(known, id, hex)) continue;
      const victims = spellVictims(known, id, hex).flat().filter((m) => m.hp > 0);
      const amount = spell.effect.kind === "damage" ? spell.effect.amount : 0;
      const hits = spell.effect.kind === "damage" ? `: ${victims.length} units lose ${amount} HP, ${victims.filter((m) => m.hp <= amount).length} would die` : "";
      options.push({ text: `Cast ${spell.name} (${spell.cost} mana) on ${placeText(known, seat, hex)} at ${at(hex)}${hits}.`, action: { type: "castSpell", spell: id, at: hex } });
    }
  }
  return options;
}

function leaderOrders(world: World, leader: Leader): MapOption[] {
  const name = warbandName(leader);
  const options: MapOption[] = [];
  for (const skill of Object.keys(LEADER_SKILLS)) {
    if (learnSkillProblem(world, leader.id, skill)) continue;
    const def = LEADER_SKILLS[skill];
    if (def) options.push({ text: `${name} learns ${def.name}: ${def.describe}`, action: { type: "learn", leaderId: leader.id, skill } });
  }
  if (!reviveProblem(world, leader.id)) options.push({ text: `Revive ${name}'s fallen leader (${reviveCost(world, leader)} gold).`, action: { type: "revive", leaderId: leader.id } });
  for (const item of leader.bag) {
    const def = itemById(item);
    if (!equipProblem(leader, item)) options.push({ text: `${name} puts on the ${def.name}.`, action: { type: "equip", leaderId: leader.id, item } });
    if (def.use?.kind === "ward") {
      const hex = wardTargets(world, leader.id)[0];
      if (hex && !useItemProblem(world, leader.id, item, hex)) options.push({ text: `${name} uses the ${def.name} on ${at(hex)}.`, action: { type: "useItem", leaderId: leader.id, item, at: hex } });
    } else if (def.use && !useItemProblem(world, leader.id, item)) options.push({ text: `${name} uses the ${def.name}.`, action: { type: "useItem", leaderId: leader.id, item } });
  }
  for (const item of leader.worn) if (!unequipProblem(leader, item)) options.push({ text: `${name} takes off the ${itemById(item).name}.`, action: { type: "unequip", leaderId: leader.id, item } });
  const structure = structureAt(world, leader);
  if (structure?.kind === "mercenaries") {
    structure.stock.forEach((hire, index) => {
      if (hireProblem(world, leader.id, index)) return;
      options.push({ text: `${name} hires ${a(unitName(hire.defId))}${hire.level > 0 ? ` (level ${hire.level})` : ""} for ${hireCost(hire)} gold.`, action: { type: "hire", leaderId: leader.id, index } });
    });
  }
  if (structure?.kind === "merchant") {
    for (const item of new Set(forSale(structure))) {
      if (buyItemProblem(world, leader.id, item)) continue;
      options.push({ text: `${name} buys the ${itemById(item).name} (${itemById(item).price} gold).`, action: { type: "buyItem", leaderId: leader.id, item } });
    }
    for (const item of leader.bag) {
      if (sellItemProblem(world, leader.id, item)) continue;
      options.push({ text: `${name} sells the ${itemById(item).name} (${resalePrice(itemById(item).price)} gold).`, action: { type: "sellItem", leaderId: leader.id, item } });
    }
  }
  if (structure?.kind === "mage") {
    for (const spell of structure.stock) {
      if (buySpellProblem(world, leader.id, spell)) continue;
      options.push({ text: `${name} learns the spell ${spellById(spell).name} (${spellById(spell).learnCost} gold): ${describeSpell(spellById(spell))}`, action: { type: "buySpell", leaderId: leader.id, spell } });
    }
  }
  return options;
}

/** The seat's options on its own map turn, in a fixed order: the numbers in a listing index this array. */
export function mapOptions(world: World, seat: PlayerId): MapOption[] {
  const known = knownWorld(world, seat);
  const mine = world.leaders.filter((l) => l.player === seat);
  return [
    ...mine.flatMap((l) => marches(known, seat, l)),
    ...mine.flatMap((l) => leaderOrders(world, l)),
    ...cityOrders(world, seat),
    ...capitolOrders(world, seat),
    ...spellOrders(known, seat),
    { text: "End your turn.", action: { type: "endTurn" } },
  ];
}

/** A unit type in one line: tier, health, and its abilities' names. */
export function describeUnitBriefly(defId: string): string {
  const def = UNITS[defId];
  if (!def) return "";
  return `${def.name}: tier ${def.tier}, ${def.stats.maxHp} HP, armor ${def.stats.armor}, initiative ${def.stats.initiative}; abilities: ${def.abilities.map((r) => r.name ?? BEHAVIORS[r.id]?.name ?? r.id).join(", ")}.`;
}
