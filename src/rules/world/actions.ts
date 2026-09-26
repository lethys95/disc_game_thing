import { choose } from "#rules/forks";
import { sameTile } from "#rules/battle/grid";
import { stepCost } from "#rules/map";
import { RECRUIT_COST } from "#rules/units/index";
import { LEADER_MOVEMENT } from "#rules/balance";
import { defenderOf, engagementBattle } from "#rules/world/battles";
import { chooseBranchProblem, elevateProblem, freeTile, growSquad, learnSkillProblem, newcomer, recruitProblem, resurrectionCost, resurrectProblem, reviveCost, reviveProblem, squadsOf, startTurn, upgradeCityProblem, upgradeProblem, cityUpgradeCost } from "#rules/world/economy";
import { movementOf, rankOf } from "#rules/world/leaders";
import { planMove } from "#rules/world/movement";
import { squadAt, transfer, transferProblem } from "#rules/world/squads";
import { isLeaderOf } from "#rules/world/record";
import { UPGRADES } from "#rules/upgrades";
import { capitolOf, cityById, leaderById } from "#rules/world/state";
import type { World, WorldAction, WorldEvent, WorldStep } from "#rules/world/state";

/** Orders a side gives on its turn. */

export function applyWorldAction(world: World, action: WorldAction): WorldStep {
  if (world.outcome || world.engagement) throw new Error("the world is not taking orders");
  const draft = structuredClone(world);
  const events: WorldEvent[] = [];
  const side = draft.activeSide;
  switch (action.type) {
    case "move": {
      const leader = leaderById(draft, action.leaderId);
      if (leader.side !== side) throw new Error(`${leader.id} cannot move on the other side's turn`);
      const plan = planMove(draft, leader.id, action.to);
      if (!plan) throw new Error(`no path for ${leader.id}`);
      const walked = plan.path.hexes.slice(0, plan.steps);
      for (const hex of walked) leader.movement -= stepCost(draft.map, hex) ?? 0;
      const last = walked[walked.length - 1];
      if (last) leader.hex = last;
      if (walked.length > 0) events.push({ type: "moved", leaderId: leader.id, path: walked });
      const target = plan.target;
      if (target?.kind === "capture") {
        const city = cityById(draft, target.cityId);
        city.owner = side;
        events.push({ type: "captured", cityId: city.id, side });
      } else if (target) {
        leader.movement = 0;
        const defender = defenderOf(target);
        draft.engagement = { attackerId: leader.id, defender, battle: engagementBattle(draft, leader, defender) };
        events.push({ type: "engaged", attackerId: leader.id, defender });
      }
      break;
    }
    case "endTurn": {
      draft.activeSide = side === 0 ? 1 : 0;
      if (draft.activeSide === 0) draft.turn += 1;
      startTurn(draft, events);
      break;
    }
    case "recruit": {
      const problem = recruitProblem(draft, action.defId, action.into, action.tile);
      if (problem) throw new Error(`cannot recruit: ${problem}`);
      const squad = squadAt(draft, action.into);
      const tile = action.tile ?? freeTile(squad);
      if (!tile) throw new Error("no room");
      squad.push(newcomer(draft, side, action.defId, tile));
      draft.gold[side] -= RECRUIT_COST[action.defId] ?? 0;
      events.push({ type: "recruited", defId: action.defId, into: action.into });
      break;
    }
    case "elevate": {
      const problem = elevateProblem(draft, action.tile);
      const capitol = capitolOf(draft, side);
      const unit = capitol?.garrison.find((m) => sameTile(m.tile, action.tile));
      if (problem || !capitol || !unit) throw new Error(`cannot elevate: ${problem}`);
      capitol.garrison = capitol.garrison.filter((m) => m !== unit);
      const tile = { row: 0, col: 1 } as const;
      const id = `leader${draft.nextLeader}`;
      draft.nextLeader += 1;
      draft.leaders.push({ id, side, hex: capitol.hex, movement: LEADER_MOVEMENT, experience: 0, skills: {}, fellOnTurn: null, squad: [{ ...unit, tile }], leaderTile: tile });
      events.push({ type: "elevated", leaderId: id });
      break;
    }
    case "choose": {
      const problem = chooseBranchProblem(draft, action.fork, action.to);
      if (problem) throw new Error(`cannot choose: ${problem}`);
      draft.commitment[side] = choose(draft.commitment[side], action.fork, action.to);
      events.push({ type: "chose", side, fork: action.fork, to: action.to });
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
      const cost = resurrectionCost(draft, side, action.index);
      const fallen = draft.graveyard[side][action.index];
      const squad = squadAt(draft, action.into);
      const tile = action.tile ?? freeTile(squad);
      if (problem || cost === null || !fallen || !tile) throw new Error(`cannot resurrect: ${problem}`);
      draft.gold[side] -= cost;
      draft.graveyard[side].splice(action.index, 1);
      squad.push({ defId: fallen.defId, tile, hp: 1, xp: 0, marks: fallen.marks, level: fallen.level });
      events.push({ type: "resurrected", side, defId: fallen.defId });
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
      draft.gold[side] -= cost;
      leader.squad = leader.squad.map((m) => (isLeaderOf(m, leader) ? { ...m, hp: 1 } : m));
      leader.fellOnTurn = null;
      events.push({ type: "revived", leaderId: leader.id });
      break;
    }
    case "upgradeCity": {
      const problem = upgradeCityProblem(draft, action.cityId);
      if (problem) throw new Error(`cannot upgrade the city: ${problem}`);
      const city = cityById(draft, action.cityId);
      draft.gold[side] -= cityUpgradeCost(city);
      city.tier += 1;
      events.push({ type: "cityUpgraded", cityId: city.id, tier: city.tier });
      break;
    }
    case "upgrade": {
      const problem = upgradeProblem(draft, action.upgrade);
      const upgrade = UPGRADES.get(action.upgrade);
      if (problem || !upgrade) throw new Error(`cannot buy ${action.upgrade}: ${problem}`);
      draft.gold[side] -= upgrade.price;
      draft.upgrades[side].push(upgrade.id);
      events.push({ type: "upgraded", side, upgrade: upgrade.id });
      break;
    }
  }
  return { world: draft, events };
}
