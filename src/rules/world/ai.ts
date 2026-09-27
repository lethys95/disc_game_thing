import { STARTING_LEADERSHIP } from "#rules/balance";
import { forkOptions, openForks } from "#rules/forks";
import { hexDistance, hexKey, neighbors, sameHex } from "#rules/hex";
import { knownWorld } from "#rules/world/vision";
import { castProblem, learnSpellProblem, spellTargets, spellVictims } from "#rules/world/spells";
import { spellById, spellsOf } from "#rules/spells";
import type { Hex } from "#rules/hex";
import { stepCost } from "#rules/map";
import { nextForm } from "#rules/progression";
import { FACTION_ROOTS, GUARDIAN_ID, RECRUIT_COST, UNITS } from "#rules/units/index";
import { upgradesOf } from "#rules/upgrades";
import { autoplay } from "#rules/ai";
import { applyWorldAction } from "#rules/world/actions";
import { concludeBattle, forecast } from "#rules/world/battles";
import { chooseBranchProblem, elevateProblem, income, learnSkillProblem, recruitProblem, resurrectionCost, resurrectProblem, reviveProblem, squadsOf, upgradeProblem, cityUpgradeCost, upgradeCityProblem, investNodeProblem, nodeInvestCost } from "#rules/world/economy";
import { leadershipOf, movementOf } from "#rules/world/leaders";
import { destination, planMove } from "#rules/world/movement";
import type { MovePlan, MoveTarget } from "#rules/world/movement";
import { playerOf, capitolOf, fullHp, lairAt, leaderAt } from "#rules/world/state";
import type { Leader, SquadMember, SquadRef, World, WorldAction } from "#rules/world/state";
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
      // The mover is always the attacker, side 0 of its battle.
      result = forecast(world, attackerId, target)?.outcome?.winner === 0;
      known.set(key, result);
    }
    return result;
  };
}

function threatened(world: World, leader: Leader, hex: Hex, wins: Wins): boolean {
  const moved: World = { ...world, leaders: world.leaders.map((l) => (l.id === leader.id ? { ...l, hex } : l)) };
  return moved.leaders.some((enemy) => {
    if (enemy.player === leader.player) return false;
    const fresh = { ...moved, leaders: moved.leaders.map((l) => (l.id === enemy.id ? { ...l, movement: movementOf(l) } : l)) };
    const plan = planMove(fresh, enemy.id, hex);
    if (plan?.target?.kind !== "leader") return false;
    return wins(fresh, enemy.id, plan.target);
  });
}

/**
 * A siege: this side's warbands that can reach the enemy Capitol this turn attack it one after another (wounds
 * carry over, and the Capitol only heals between turns). Returns the first attacker of an order that brings the
 * Guardian down, or null. A lone assault that fails makes the garrison stronger (it earns XP), so the AI commits
 * only to chains that win.
 */
function siegeOpener(world: World, capitolHex: Hex): string | null {
  const side = world.activePlayer;
  const ready = world.leaders.filter((l) => l.player === side && l.fellOnTurn === null && planMove(world, l.id, capitolHex)?.target);
  if (ready.length === 0) return null;
  const orders = [[...ready].sort((a, b) => strength(a.squad) - strength(b.squad)), [...ready].sort((a, b) => strength(b.squad) - strength(a.squad))];
  for (const order of orders) {
    let w = world;
    for (const leader of order) {
      if (w.outcome || !w.leaders.some((l) => l.id === leader.id) || !planMove(w, leader.id, capitolHex)?.target) continue;
      const step = applyWorldAction(w, { type: "move", leaderId: leader.id, to: capitolHex }).world;
      w = step.engagement ? concludeBattle(step, autoplay(step.engagement.battle)).world : step;
    }
    const first = order[0];
    if (w.outcome?.winner === side && first) return first.id;
  }
  return null;
}

const healthy = (leader: Leader) => leader.fellOnTurn === null && strength(leader.squad) >= 0.5 * fullStrength(leader.squad);

/**
 * The rally check: would a siege win if every healthy warband stood next to the enemy Capitol now? If so, they stop
 * chasing other targets and close in, so the siege check can open the assault once enough are in reach.
 */
function siegeViable(world: World, capitolHex: Hex): boolean {
  const side = world.activePlayer;
  const free = neighbors(capitolHex).filter(
    (h) => stepCost(world.map, h) !== null && !world.cities.some((c) => sameHex(c.hex, h)) && !world.leaders.some((l) => sameHex(l.hex, h)) && !lairAt(world, h),
  );
  let placed = world;
  for (const leader of world.leaders.filter((l) => l.player === side && healthy(l))) {
    const adjacent = hexDistance(leader.hex, capitolHex) === 1;
    const spot = adjacent ? leader.hex : free.shift();
    if (!spot) break;
    placed = { ...placed, leaders: placed.leaders.map((l) => (l.id === leader.id ? { ...l, hex: spot, movement: Math.max(l.movement, movementOf(l)) } : l)) };
  }
  return siegeOpener(placed, capitolHex) !== null;
}

/** Least a damage spell's score (HP taken off enemy squads, kills counted double) must reach to be worth casting. */
const AI_SPELL_WORTH = 40;

/**
 * Spells before marching: damage where it takes off the most, walls broken and warbands blessed where a warband of
 * ours can attack this turn. Provisional taste, like the spells themselves.
 */
function chooseCast(world: World): WorldAction | null {
  const side = world.activePlayer;
  const mine = world.leaders.filter((l) => l.player === side && l.fellOnTurn === null);
  const canAttack = (from: Leader, hex: Hex) => {
    const target = planMove(world, from.id, hex)?.target;
    return target !== undefined && target !== null && target.kind !== "capture";
  };
  for (const id of playerOf(world, side).spells) {
    const spell = spellById(id);
    const targets = spellTargets(world, id).filter((hex) => !castProblem(world, id, hex));
    let best: { hex: Hex; score: number } | null = null;
    for (const hex of targets) {
      let score = 0;
      if (spell.effect.kind === "damage") {
        const amount = spell.effect.amount;
        // HP taken off, and a kill is worth a unit's remaining health again.
        score = spellVictims(world, id, hex).flat().reduce((sum, m) => sum + (m.hp <= 0 ? 0 : m.hp <= amount ? 2 * m.hp : amount), 0);
        if (score < AI_SPELL_WORTH) continue;
      } else if (spell.target === "enemyCity") {
        if (!mine.some((l) => canAttack(l, hex))) continue;
        score = 1;
      } else {
        const leader = mine.find((l) => sameHex(l.hex, hex));
        if (!leader || leader.enchantments.some((e) => e.spell === id)) continue;
        const goals = [...world.leaders.filter((l) => l.player !== side).map((l) => l.hex), ...world.cities.filter((c) => c.owner !== side).map((c) => c.hex)];
        if (!goals.some((g) => canAttack(leader, g))) continue;
        score = strength(leader.squad);
      }
      if (!best || score > best.score) best = { hex, score };
    }
    if (best) return { type: "castSpell", spell: id, at: best.hex };
  }
  return null;
}

/** Idle warbands head for the nearest hex their player hasn't seen, stopping where no enemy could beat them. */
function explore(world: World, mine: readonly Leader[], wins: Wins): WorldAction | null {
  const explored = new Set(playerOf(world, world.activePlayer).explored);
  const unknown = Object.values(world.map.tiles).filter((t) => !explored.has(hexKey(t.hex)));
  for (const leader of mine) {
    if (leader.movement <= 0 || leader.fellOnTurn !== null) continue;
    const nearest = [...unknown].sort((a, b) => hexDistance(leader.hex, a.hex) - hexDistance(leader.hex, b.hex));
    for (const { hex } of nearest.slice(0, 6)) {
      const plan = planMove(world, leader.id, hex);
      if (!plan || plan.steps === 0 || plan.target) continue;
      const stop = plan.path.hexes.slice(0, plan.steps).reverse().find((h) => !threatened(world, leader, h, wins));
      if (stop) return { type: "move", leaderId: leader.id, to: stop };
    }
  }
  return null;
}

/** Provisional AI taste at each fork: the branches pnpm sim rates strongest first. */
const AI_PREFERRED_BRANCHES: readonly string[] = ["zealot", "punisher", "mutant", "thaumaturge"];

/**
 * The AI keeps at most this many warbands. Not a game rule (there's no leader cap): more warbands mostly spread its
 * XP thin, and each one multiplies its siege planning, which slowed long games with several players to a crawl.
 */
const AI_MAX_WARBANDS = 4;

/** Provisional: the AI buys the tree's skills in this order, a warband's size first. */
const AI_SKILL_ORDER: readonly string[] = ["leadership", "health", "healing", "movement", "aura"];

const strength = (squad: readonly SquadMember[]) => squad.reduce((sum, m) => sum + m.hp, 0);
const fullStrength = (squad: readonly SquadMember[]) => squad.reduce((sum, m) => sum + fullHp(m.defId), 0);

/**
 * Map AI: fill the Capitol, raise a leader when it has none (or gold to spare), then march each leader on the
 * nearest target it can take. It uses deterministic battle forecasts both ways: it skips fights it would lose and
 * won't stop where an enemy could reach it next turn and win. Badly wounded leaders go home to heal. It plans from
 * what it knows (fog of war), and explores when it knows of nothing to do.
 */
export function chooseWorldAction(truth: World): WorldAction {
  const side = truth.activePlayer;
  const world = knownWorld(truth, side);
  const wins = winsCache();
  const capitol = capitolOf(world, side);
  const mine = world.leaders.filter((l) => l.player === side);
  const roots = FACTION_ROOTS[playerOf(world, side).faction];
  const cost = Math.min(...roots.map((r) => RECRUIT_COST[r] ?? Infinity));
  // Recruit whichever root unit the target squad has fewest of, for a mixed army.
  const pick = (squad: readonly SquadMember[]) =>
    [...roots].sort((a, b) => squad.filter((m) => m.defId === a).length - squad.filter((m) => m.defId === b).length)[0] ?? roots[0] ?? "";

  for (const leader of mine) {
    const skill = AI_SKILL_ORDER.find((s) => !learnSkillProblem(world, leader.id, s));
    if (skill) return { type: "learn", leaderId: leader.id, skill };
  }

  if (capitol) {
    const home = mine.find((l) => sameHex(l.hex, capitol.hex));
    // Choosing is free, so the AI settles every fork it can reach right away.
    const fork = openForks(playerOf(world, side).faction, playerOf(world, side).commitment)[0];
    if (fork) {
      const options = forkOptions(fork);
      const to = options.find((o) => AI_PREFERRED_BRANCHES.includes(o)) ?? options[0];
      if (to && !chooseBranchProblem(world, fork, to)) return { type: "choose", fork, to };
    }
    const spare = (price: number) => playerOf(world, side).gold >= price;
    const fallen = mine.find((l) => !reviveProblem(world, l.id));
    if (fallen) return { type: "revive", leaderId: fallen.id };

    const garrison: SquadRef = { kind: "garrison", cityId: capitol.id };
    const into: SquadRef = home ? { kind: "warband", leaderId: home.id } : garrison;
    const bargain = playerOf(world, side).graveyard
      .map((fallen, index) => ({ index, tier: UNITS[fallen.defId]?.tier ?? 1, cost: resurrectionCost(world, side, index) ?? Infinity }))
      .filter((f) => f.tier >= 2 && f.cost === RESURRECTION_BASE * f.tier && spare(f.cost) && !resurrectProblem(world, f.index, into))
      .sort((a, b) => b.tier - a.tier)[0];
    if (bargain) return { type: "resurrect", index: bargain.index, into };

    if (home) {
      const defId = pick(home.squad);
      if (spare(RECRUIT_COST[defId] ?? Infinity) && !recruitProblem(world, defId, { kind: "warband", leaderId: home.id })) {
        return { type: "recruit", defId, into: { kind: "warband", leaderId: home.id } };
      }
    }
    // Under threat, recruits stand with the Guardian; a fresh leader in the Capitol would only be picked off.
    const underThreat = world.leaders.some((l) => l.player !== side && planMove({ ...world, leaders: world.leaders.map((x) => (x.id === l.id ? { ...x, movement: movementOf(x) } : x)) }, l.id, capitol.hex)?.target);
    const guard = pick(capitol.garrison);
    if (underThreat && !recruitProblem(world, guard, garrison)) {
      return { type: "recruit", defId: guard, into: garrison };
    }
    const rich = playerOf(world, side).gold >= cost * (STARTING_LEADERSHIP + 1);
    // Upgrades aren't retroactive: they pay off on units about to become that type, and on future recruits.
    const everyone = squadsOf(world, side).flatMap((h) => h.squad);
    const upgrade = upgradesOf(playerOf(world, side).faction)
      .map((u) => ({ u, value: everyone.filter((m) => nextForm(m.defId, playerOf(world, side).commitment) === u.unitType).length + (roots.includes(u.unitType) ? 1 : 0) }))
      .filter(({ u, value }) => value > 0 && playerOf(world, side).gold >= u.price + cost * STARTING_LEADERSHIP && !upgradeProblem(world, u.id))
      .sort((a, b) => b.value - a.value)[0];
    if (upgrade) return { type: "upgrade", upgrade: upgrade.u.id };
    // Spells with spare gold, cheapest first.
    const spell = spellsOf(playerOf(world, side).faction)
      .filter((s) => !learnSpellProblem(world, s.id) && playerOf(world, side).gold >= s.learnCost + cost * STARTING_LEADERSHIP)
      .sort((a, b) => a.learnCost - b.learnCost)[0];
    if (spell && rich) return { type: "learnSpell", spell: spell.id };
    // Walls with spare gold: the Capitol first (it's the loss condition), then the cheapest city.
    const walls = world.cities
      .filter((c) => c.owner === side && !upgradeCityProblem(world, c.id) && playerOf(world, side).gold >= cityUpgradeCost(c) + cost * STARTING_LEADERSHIP)
      .sort((a, b) => Number(b.kind === "capitol") - Number(a.kind === "capitol") || cityUpgradeCost(a) - cityUpgradeCost(b))[0];
    if (walls && rich) return { type: "upgradeCity", cityId: walls.id };
    // Mines pay for themselves; invest with spare gold, cheapest first.
    const mineToInvest = world.nodes
      .filter((n) => n.kind === "gold" && !investNodeProblem(world, n.id) && playerOf(world, side).gold >= nodeInvestCost(n) + cost * STARTING_LEADERSHIP)
      .sort((a, b) => nodeInvestCost(a) - nodeInvestCost(b))[0];
    if (mineToInvest && rich) return { type: "investNode", nodeId: mineToInvest.id };
    // Under threat, only with the gold to fill the new warband at once: a lone new leader stands in front of the
    // garrison and only feeds the enemy XP. New warbands only once the existing ones are full.
    const canFill = playerOf(world, side).gold >= cost * STARTING_LEADERSHIP;
    const warbandsFull = mine.every((l) => l.squad.length >= leadershipOf(l));
    if (!home && (!underThreat || canFill) && (mine.length === 0 || (rich && warbandsFull && mine.length < AI_MAX_WARBANDS))) {
      const spare = capitol.garrison.find((m) => m.defId !== GUARDIAN_ID);
      if (spare && !elevateProblem(world, spare.tile)) return { type: "elevate", tile: spare.tile };
      if (!recruitProblem(world, guard, garrison)) return { type: "recruit", defId: guard, into: garrison };
    }
  }

  const cast = chooseCast(world);
  if (cast) return cast;

  // The nearest enemy Capitol (with several enemies, the closest one is the siege target).
  const base = capitol?.hex ?? mine[0]?.hex;
  const target = world.cities
    .filter((c) => c.kind === "capitol" && c.owner !== side && c.owner !== null)
    .sort((a, b) => (base ? hexDistance(base, a.hex) - hexDistance(base, b.hex) : 0))[0];
  if (target) {
    const opener = siegeOpener(world, target.hex);
    if (opener) return { type: "move", leaderId: opener, to: target.hex };
  }

  const rally = target !== undefined && siegeViable(world, target.hex);
  const staging: { leader: Leader; to: Hex }[] = [];
  for (const leader of mine) {
    if (leader.movement <= 0) continue;
    const atHome = capitol !== undefined && sameHex(leader.hex, capitol.hex);
    // A thin squad waits at home for recruits while gold keeps coming in.
    if (atHome && leader.squad.length < 3 && income(world, side) >= cost) continue;
    // Wounded, leaderless until revived, or short of units with the gold to fill them: home to the Capitol.
    const missing = leadershipOf(leader) - leader.squad.length;
    const refill = missing >= 1 && playerOf(world, side).gold >= cost * missing;
    const hurt = strength(leader.squad) < 0.5 * fullStrength(leader.squad) || leader.fellOnTurn !== null || refill;
    if (hurt && capitol && !atHome && !leaderAt(world, capitol.hex)) {
      const plan = planMove(world, leader.id, capitol.hex);
      if (plan && plan.steps > 0) return { type: "move", leaderId: leader.id, to: capitol.hex };
      continue;
    }
    // Rallying: close in on the enemy Capitol rather than chase anything else; hold once in reach.
    if (rally && target && healthy(leader)) {
      const plan = planMove(world, leader.id, target.hex);
      if (plan?.target) continue;
      const stop = plan ? plan.path.hexes.slice(0, plan.steps).reverse().find((hex) => !threatened(world, leader, hex, wins)) : undefined;
      if (stop) return { type: "move", leaderId: leader.id, to: stop };
    }
    const goals: Hex[] = [
      ...world.leaders.filter((l) => l.player !== side).map((l) => l.hex),
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
    // Nothing to take: close in on the enemy Capitol and wait within reach for the siege, never alone.
    if (target && leader.fellOnTurn === null) {
      const plan = planMove(world, leader.id, target.hex);
      if (plan && !plan.target) {
        const stops = plan.path.hexes.slice(0, plan.steps).reverse();
        const stop = stops.find((hex) => !threatened(world, leader, hex, wins));
        if (stop) staging.push({ leader, to: stop });
      }
    }
  }
  const approach = staging[0];
  if (approach) return { type: "move", leaderId: approach.leader.id, to: approach.to };
  const scout = explore(world, mine, wins);
  if (scout) return scout;
  return { type: "endTurn" };
}
