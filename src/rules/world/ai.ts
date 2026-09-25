import { LEADER_MOVEMENT } from "#rules/balance";
import { INVESTMENT_COST, openBranches, SQUAD_LIMIT } from "#rules/doctrine";
import { sameHex } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { FACTION_ROOTS, GUARDIAN_ID, RECRUIT_COST, UNITS } from "#rules/units/index";
import type { Branch } from "#rules/units/index";
import { forecast } from "#rules/world/battles";
import { elevateProblem, income, investProblem, recruitProblem, resurrectionCost, resurrectProblem } from "#rules/world/economy";
import { destination, planMove } from "#rules/world/movement";
import type { MovePlan, MoveTarget } from "#rules/world/movement";
import { capitolOf, fullHp, leaderAt } from "#rules/world/state";
import type { Leader, RecruitInto, SquadMember, World, WorldAction } from "#rules/world/state";
import { RESURRECTION_BASE } from "#rules/balance";

/** The map AI. */

/** Would an enemy leader be able to reach `hex` next turn and win the fight there? */
/**
 * Whether the attacker would win a fight, memoised for one decision: a forecast depends only on the two squads,
 * and the threat checks ask about the same pairs over and over.
 */
type Wins = (world: World, attackerId: string, target: MoveTarget) => boolean;

function winsCache(): Wins {
  const known = new Map<string, boolean>();
  return (world, attackerId, target) => {
    const key = `${attackerId}>${JSON.stringify(target)}`;
    let result = known.get(key);
    if (result === undefined) {
      const side = world.leaders.find((l) => l.id === attackerId)?.side;
      result = forecast(world, attackerId, target)?.outcome?.winner === side;
      known.set(key, result);
    }
    return result;
  };
}

function threatened(world: World, leader: Leader, hex: Hex, wins: Wins): boolean {
  const moved: World = { ...world, leaders: world.leaders.map((l) => (l.id === leader.id ? { ...l, hex } : l)) };
  return moved.leaders.some((enemy) => {
    if (enemy.side === leader.side) return false;
    const fresh = { ...moved, leaders: moved.leaders.map((l) => (l.id === enemy.id ? { ...l, movement: LEADER_MOVEMENT } : l)) };
    const plan = planMove(fresh, enemy.id, hex);
    if (plan?.target?.kind !== "leader") return false;
    return wins(fresh, enemy.id, plan.target);
  });
}

/** Provisional AI taste: the doctrine pnpm sim rates strongest first. */
const AI_BRANCH_PREFERENCE: readonly Branch[] = ["consume", "punishment", "preserve", "sacrifice", "overload", "scheme"];

const strength = (squad: readonly SquadMember[]) => squad.reduce((sum, m) => sum + m.hp, 0);
const fullStrength = (squad: readonly SquadMember[]) => squad.reduce((sum, m) => sum + fullHp(m.defId), 0);

/**
 * Map AI: fill the Capitol, raise a leader when it has none (or gold to spare), then march each leader on the
 * nearest target it can take. It uses deterministic battle forecasts both ways: it skips fights it would lose and
 * won't stop where an enemy could reach it next turn and win. Badly wounded leaders go home to heal.
 */
export function chooseWorldAction(world: World): WorldAction {
  const side = world.activeSide;
  const wins = winsCache();
  const capitol = capitolOf(world, side);
  const mine = world.leaders.filter((l) => l.side === side);
  const roots = FACTION_ROOTS[world.factions[side]];
  const cost = Math.min(...roots.map((r) => RECRUIT_COST[r] ?? Infinity));
  // Recruit whichever root unit the target squad has fewest of, for a mixed army.
  const pick = (squad: readonly SquadMember[]) =>
    [...roots].sort((a, b) => squad.filter((m) => m.defId === a).length - squad.filter((m) => m.defId === b).length)[0] ?? roots[0] ?? "";

  if (capitol) {
    const home = mine.find((l) => sameHex(l.hex, capitol.hex));
    // Commit at the next fork as soon as it's affordable; save for it otherwise (unless there's no army at all).
    const open = AI_BRANCH_PREFERENCE.filter((b) => openBranches(world.factions[side], world.commitment[side]).includes(b));
    const branch = open[0];
    if (branch && !investProblem(world, branch)) return { type: "invest", branch };
    const reserve = branch && mine.length > 0 ? INVESTMENT_COST[branch] : 0;
    const spare = (price: number) => world.gold[side] - price >= reserve;

    const into: RecruitInto = home ? { kind: "leader", leaderId: home.id } : { kind: "garrison" };
    const bargain = world.graveyard[side]
      .map((fallen, index) => ({ index, tier: UNITS[fallen.defId]?.tier ?? 1, cost: resurrectionCost(world, side, index) ?? Infinity }))
      .filter((f) => f.tier >= 2 && f.cost === RESURRECTION_BASE * f.tier && spare(f.cost) && !resurrectProblem(world, f.index, into))
      .sort((a, b) => b.tier - a.tier)[0];
    if (bargain) return { type: "resurrect", index: bargain.index, into };

    if (home) {
      const defId = pick(home.squad);
      if (spare(RECRUIT_COST[defId] ?? Infinity) && !recruitProblem(world, defId, { kind: "leader", leaderId: home.id })) {
        return { type: "recruit", defId, into: { kind: "leader", leaderId: home.id } };
      }
    }
    // Under threat, recruits stand with the Guardian; a fresh leader in the Capitol would only be picked off.
    const underThreat = world.leaders.some((l) => l.side !== side && planMove({ ...world, leaders: world.leaders.map((x) => (x.id === l.id ? { ...x, movement: LEADER_MOVEMENT } : x)) }, l.id, capitol.hex)?.target);
    const guard = pick(capitol.garrison);
    if (underThreat && !recruitProblem(world, guard, { kind: "garrison" })) {
      return { type: "recruit", defId: guard, into: { kind: "garrison" } };
    }
    const rich = world.gold[side] >= cost * (SQUAD_LIMIT + 1);
    if (!home && !underThreat && (mine.length === 0 || rich)) {
      const spare = capitol.garrison.find((m) => m.defId !== GUARDIAN_ID);
      if (spare && !elevateProblem(world, spare.tile)) return { type: "elevate", tile: spare.tile };
      if (!recruitProblem(world, guard, { kind: "garrison" })) return { type: "recruit", defId: guard, into: { kind: "garrison" } };
    }
  }

  for (const leader of mine) {
    if (leader.movement <= 0) continue;
    const atHome = capitol !== undefined && sameHex(leader.hex, capitol.hex);
    // A thin squad waits at home for recruits while gold keeps coming in.
    if (atHome && leader.squad.length < 3 && income(world, side) >= cost) continue;
    if (strength(leader.squad) < 0.5 * fullStrength(leader.squad) && capitol && !atHome && !leaderAt(world, capitol.hex)) {
      const plan = planMove(world, leader.id, capitol.hex);
      if (plan && plan.steps > 0) return { type: "move", leaderId: leader.id, to: capitol.hex };
      continue;
    }
    const goals: Hex[] = [
      ...world.leaders.filter((l) => l.side !== side).map((l) => l.hex),
      ...world.cities.filter((c) => c.owner !== side).map((c) => c.hex),
      ...world.lairs.filter((l) => l.guards.length > 0).map((l) => l.hex),
    ];
    const options = goals
      .map((hex) => ({ hex, plan: planMove(world, leader.id, hex) }))
      .filter((o): o is { hex: Hex; plan: MovePlan } => o.plan !== null && (o.plan.steps > 0 || o.plan.target !== null))
      .filter(({ hex }) => {
        const goal = destination(world, side, hex);
        if (goal === null || goal === "blocked" || goal.kind === "capture") return true;
        return wins(world, leader.id, goal);
      })
      .filter(({ plan }) => {
        const stop = plan.steps > 0 ? plan.path.hexes[plan.steps - 1] : leader.hex;
        return (plan.target !== null && plan.target.kind !== "capture") || !stop || !threatened(world, leader, stop, wins);
      })
      .sort((a, b) => a.plan.path.cost - b.plan.path.cost);
    const best = options[0];
    if (best) return { type: "move", leaderId: leader.id, to: best.hex };
  }
  return { type: "endTurn" };
}
