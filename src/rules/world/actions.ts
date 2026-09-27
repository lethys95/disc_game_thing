import { choose } from "#rules/forks";
import { sameTile } from "#rules/battle/grid";
import { stepCost } from "#rules/map";
import { RECRUIT_COST } from "#rules/units/index";
import { LEADER_MOVEMENT } from "#rules/balance";
import { defenderOf, engage } from "#rules/world/battles";
import { nodeMarks, chooseBranchProblem, elevateProblem, freeTile, growSquad, learnSkillProblem, newcomer, recruitProblem, resurrectionCost, resurrectProblem, reviveCost, reviveProblem, squadsOf, startRound, startTurn, upgradeCityProblem, researchProblem, investNodeProblem, nodeInvestCost, upgradeProblem, cityUpgradeCost } from "#rules/world/economy";
import { equipProblem, freeRevival, movementOf, rankOf } from "#rules/world/leaders";
import { destination, planMove } from "#rules/world/movement";
import { knownWorld, see, updateVision } from "#rules/world/vision";
import { castProblem, castSpell, learnSpellProblem } from "#rules/world/spells";
import { buyItem, buySpell, hire, sellItem } from "#rules/world/structures";
import { useItem } from "#rules/world/items";
import { spellById } from "#rules/spells";
import type { Hex } from "#rules/hex";
import { cityOfSquad, squadAt, transfer, transferProblem } from "#rules/world/squads";
import { isLeaderOf } from "#rules/world/record";
import { RESEARCH } from "#rules/research";
import { UPGRADES } from "#rules/upgrades";
import { playerOf, capitolOf, cityById, leaderById } from "#rules/world/state";
import type { Leader, World, WorldAction, WorldEvent, WorldStep } from "#rules/world/state";

/** Orders a side gives on its turn. */

export function applyWorldAction(world: World, action: WorldAction): WorldStep {
  if (world.outcome || world.engagement) throw new Error("the world is not taking orders");
  const draft = structuredClone(world);
  const events: WorldEvent[] = [];
  const side = draft.activePlayer;
  switch (action.type) {
    case "move": {
      const leader = leaderById(draft, action.leaderId);
      if (leader.player !== side) throw new Error(`${leader.id} cannot move on the other side's turn`);
      march(draft, leader, action.to, events);
      break;
    }
    case "endTurn": {
      // The next player still in the game; wrapping around the order starts a new round.
      const count = draft.players.length;
      let next = side;
      do next = (next + 1) % count;
      while (playerOf(draft, next).eliminated && next !== side);
      if (next <= side) {
        draft.turn += 1;
        startRound(draft, events);
      }
      draft.activePlayer = next;
      startTurn(draft, events);
      break;
    }
    case "recruit": {
      const problem = recruitProblem(draft, action.defId, action.into, action.tile);
      if (problem) throw new Error(`cannot recruit: ${problem}`);
      const squad = squadAt(draft, action.into);
      const tile = action.tile ?? freeTile(squad, action.defId);
      if (!tile) throw new Error("no room");
      const recruit = newcomer(draft, side, action.defId, tile);
      squad.push({ ...recruit, marks: [...recruit.marks, ...nodeMarks(draft, cityOfSquad(draft, action.into))] });
      playerOf(draft, side).gold -= RECRUIT_COST[action.defId] ?? 0;
      events.push({ type: "recruited", defId: action.defId, into: action.into });
      break;
    }
    case "elevate": {
      const problem = elevateProblem(draft, action.tile);
      const capitol = capitolOf(draft, side);
      const unit = capitol?.garrison.find((m) => sameTile(m.tile, action.tile));
      if (problem || !capitol || !unit) throw new Error(`cannot elevate: ${problem}`);
      capitol.garrison = capitol.garrison.filter((m) => m !== unit);
      // Where its line stands: a melee leader in the front middle, anyone else in the back middle.
      const tile = { row: (freeTile([], unit.defId)?.row ?? 0), col: 1 } as const;
      const id = `leader${draft.nextLeader}`;
      draft.nextLeader += 1;
      draft.leaders.push({ id, player: side, hex: capitol.hex, movement: LEADER_MOVEMENT, experience: 0, skills: {}, fellOnTurn: null, squad: [{ ...unit, tile }], leaderTile: tile, enchantments: [], worn: [], bag: [] });
      events.push({ type: "elevated", leaderId: id });
      break;
    }
    case "choose": {
      const problem = chooseBranchProblem(draft, action.fork, action.to);
      if (problem) throw new Error(`cannot choose: ${problem}`);
      playerOf(draft, side).commitment = choose(playerOf(draft, side).commitment, action.fork, action.to);
      events.push({ type: "chose", player: side, fork: action.fork, to: action.to });
      // Units already waiting at this fork evolve now.
      for (const held of squadsOf(draft, side)) growSquad(draft, held, 0, side, events);
      break;
    }
    case "transfer": {
      const problem = transferProblem(draft, action);
      if (problem) throw new Error(`cannot transfer: ${problem}`);
      transfer(draft, action);
      events.push({ type: "transferred", from: action.from, to: action.to });
      break;
    }
    case "resurrect": {
      const problem = resurrectProblem(draft, action.index, action.into, action.tile);
      const cost = resurrectionCost(draft, side, action.index, cityOfSquad(draft, action.into));
      const fallen = playerOf(draft, side).graveyard[action.index];
      const squad = squadAt(draft, action.into);
      const tile = action.tile ?? (fallen ? freeTile(squad, fallen.defId) : null);
      if (problem || cost === null || !fallen || !tile) throw new Error(`cannot resurrect: ${problem}`);
      playerOf(draft, side).gold -= cost;
      playerOf(draft, side).graveyard.splice(action.index, 1);
      squad.push({ defId: fallen.defId, tile, hp: 1, xp: 0, marks: fallen.marks, level: fallen.level });
      events.push({ type: "resurrected", player: side, defId: fallen.defId });
      break;
    }
    case "learn": {
      const problem = learnSkillProblem(draft, action.leaderId, action.skill);
      if (problem) throw new Error(`cannot learn ${action.skill}: ${problem}`);
      const leader = leaderById(draft, action.leaderId);
      const before = movementOf(leader);
      leader.skills[action.skill] = rankOf(leader, action.skill) + 1;
      // Movement learned mid-turn is usable at once.
      leader.movement += movementOf(leader) - before;
      events.push({ type: "learned", leaderId: leader.id, skill: action.skill });
      break;
    }
    case "revive": {
      const problem = reviveProblem(draft, action.leaderId);
      const leader = leaderById(draft, action.leaderId);
      const cost = reviveCost(draft, leader);
      if (problem || cost === null) throw new Error(`cannot revive: ${problem}`);
      playerOf(draft, side).gold -= cost;
      // An Ankh pays for it, and is used up.
      const ankh = freeRevival(leader);
      if (ankh) {
        leader.worn = leader.worn.filter((i) => i !== ankh);
        const at = leader.bag.indexOf(ankh);
        if (at >= 0) leader.bag.splice(at, 1);
      }
      leader.squad = leader.squad.map((m) => (isLeaderOf(m, leader) ? { ...m, hp: 1 } : m));
      leader.fellOnTurn = null;
      events.push({ type: "revived", leaderId: leader.id });
      break;
    }
    case "research": {
      const problem = researchProblem(draft, action.research);
      const research = RESEARCH.find((r) => r.id === action.research);
      if (problem || !research) throw new Error(`cannot research: ${problem}`);
      playerOf(draft, side).gold -= research.cost;
      playerOf(draft, side).research.push(research.id);
      events.push({ type: "researched", player: side, research: research.id });
      break;
    }
    case "investNode": {
      const problem = investNodeProblem(draft, action.nodeId);
      const node = draft.nodes.find((n) => n.id === action.nodeId);
      if (problem || !node) throw new Error(`cannot invest: ${problem}`);
      playerOf(draft, side).gold -= nodeInvestCost(node);
      node.level += 1;
      events.push({ type: "nodeInvested", nodeId: node.id, level: node.level });
      break;
    }
    case "learnSpell": {
      const problem = learnSpellProblem(draft, action.spell);
      if (problem) throw new Error(`cannot learn ${action.spell}: ${problem}`);
      playerOf(draft, side).gold -= spellById(action.spell).learnCost;
      playerOf(draft, side).spells.push(action.spell);
      events.push({ type: "spellLearned", player: side, spell: action.spell });
      break;
    }
    case "castSpell": {
      const problem = castProblem(draft, action.spell, action.at);
      if (problem) throw new Error(`cannot cast ${action.spell}: ${problem}`);
      castSpell(draft, action.spell, action.at, events);
      events.push({ type: "spellCast", player: side, spell: action.spell, at: action.at });
      break;
    }
    case "equip": {
      const leader = leaderById(draft, action.leaderId);
      if (leader.player !== side) throw new Error("not your leader");
      const problem = equipProblem(leader, action.item);
      if (problem) throw new Error(`cannot equip ${action.item}: ${problem}`);
      leader.bag.splice(leader.bag.indexOf(action.item), 1);
      leader.worn.push(action.item);
      break;
    }
    case "unequip": {
      const leader = leaderById(draft, action.leaderId);
      if (leader.player !== side || !leader.worn.includes(action.item)) throw new Error(`cannot take off ${action.item}`);
      leader.worn.splice(leader.worn.indexOf(action.item), 1);
      leader.bag.push(action.item);
      break;
    }
    case "upgradeCity": {
      const problem = upgradeCityProblem(draft, action.cityId);
      if (problem) throw new Error(`cannot upgrade the city: ${problem}`);
      const city = cityById(draft, action.cityId);
      playerOf(draft, side).gold -= cityUpgradeCost(city);
      city.tier += 1;
      events.push({ type: "cityUpgraded", cityId: city.id, tier: city.tier });
      break;
    }
    case "upgrade": {
      const problem = upgradeProblem(draft, action.upgrade);
      const upgrade = UPGRADES.get(action.upgrade);
      if (problem || !upgrade) throw new Error(`cannot buy ${action.upgrade}: ${problem}`);
      playerOf(draft, side).gold -= upgrade.price;
      playerOf(draft, side).upgrades.push(upgrade.id);
      events.push({ type: "upgraded", player: side, upgrade: upgrade.id });
      break;
    }
    case "hire":
      hire(draft, action.leaderId, action.index, action.tile, events);
      break;
    case "buyItem":
      buyItem(draft, action.leaderId, action.item, events);
      break;
    case "sellItem":
      sellItem(draft, action.leaderId, action.item, events);
      break;
    case "buySpell":
      buySpell(draft, action.leaderId, action.spell, events);
      break;
    case "useItem":
      useItem(draft, action.leaderId, action.item, events);
      break;
    default: {
      const unhandled: never = action;
      throw new Error(`unknown order: ${JSON.stringify(unhandled)}`);
    }
  }
  updateVision(draft);
  return { world: draft, events };
}

/**
 * A march, planned on what its player knows (`knownWorld`) and walked a hex at a time. It stops early when it sights
 * a warband it hadn't seen, or when its way or goal turns out other than it looked through the fog; the next hex
 * is always in sight, so it never walks into anything unawares.
 */
function march(draft: World, leader: Leader, to: Hex, events: WorldEvent[]): void {
  const side = leader.player;
  const known = knownWorld(draft, side);
  const plan = planMove(known, leader.id, to);
  if (!plan) throw new Error(`no path for ${leader.id}`);
  const seen = new Set(known.leaders.map((l) => l.id));
  const route = plan.path.hexes.slice(0, plan.steps);
  const walked: Hex[] = [];
  let interrupted = false;
  let captures: string | null = null;
  for (const [i, hex] of route.entries()) {
    const cost = stepCost(draft.map, hex);
    const there = destination(draft, side, hex);
    const last = i === route.length - 1;
    const capture = last && plan.target?.kind === "capture" && there !== null && there !== "blocked" && there.kind === "capture" ? there.cityId : null;
    if (cost === null || cost > leader.movement || (there !== null && capture === null)) {
      interrupted = true;
      break;
    }
    leader.movement -= cost;
    leader.hex = hex;
    walked.push(hex);
    captures = capture;
    if (last) break;
    see(draft, side);
    const now = knownWorld(draft, side);
    if (now.leaders.some((l) => !seen.has(l.id)) || JSON.stringify(destination(now, side, to)) !== JSON.stringify(destination(known, side, to))) {
      interrupted = true;
      break;
    }
  }
  if (walked.length > 0) events.push({ type: "moved", leaderId: leader.id, path: walked });
  if (captures !== null) {
    cityById(draft, captures).owner = side;
    events.push({ type: "captured", cityId: captures, player: side });
    return;
  }
  if (interrupted || !plan.target || plan.target.kind === "capture") return;
  // Next to the goal and in sight of it: what's really there decides.
  const target = destination(draft, side, to);
  if (target === null || target === "blocked" || target.kind === "capture") return;
  leader.movement = 0;
  const defender = defenderOf(target);
  draft.engagement = engage(draft, leader, defender);
  events.push({ type: "engaged", attackerId: leader.id, defender });
}
