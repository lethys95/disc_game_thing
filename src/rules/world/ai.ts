import { RESURRECTION_BASE, STARTING_LEADERSHIP } from "#rules/balance";
import { forkOptions, openForks } from "#rules/forks";
import { hexDistance, hexKey, neighbors, sameHex } from "#rules/hex";
import { knownWorld } from "#rules/world/vision";
import { NODES } from "#rules/nodes";
import { castProblem, learnSpellProblem, spellTargets, spellVictims } from "#rules/world/spells";
import { spellById, spellsOf } from "#rules/spells";
import type { Hex } from "#rules/hex";
import { stepCost } from "#rules/map";
import { nextForm } from "#rules/progression";
import { FACTION_ROOTS, GUARDIAN_ID, RECRUIT_COST, UNITS } from "#rules/units/index";
import { upgradesOf } from "#rules/upgrades";
import { autoplay } from "#rules/ai";
import type { Battle } from "#rules/battle/types";
import { applyWorldAction } from "#rules/world/actions";
import { concludeBattle, openingBattle } from "#rules/world/battles";
import { chooseBranchProblem, elevateProblem, income, learnSkillProblem, recruitProblem, resurrectionCost, resurrectProblem, reviveProblem, squadsOf, upgradeProblem, cityUpgradeCost, upgradeCityProblem, investNodeProblem, nodeInvestCost } from "#rules/world/economy";
import { equipProblem, leadershipOf, movementOf } from "#rules/world/leaders";
import { destination, planMove } from "#rules/world/movement";
import type { MovePlan, MoveTarget } from "#rules/world/movement";
import { playerOf, capitolOf, fullHp, lairAt, leaderAt } from "#rules/world/state";
import type { City, Leader, PlayerId, SquadMember, SquadRef, World, WorldAction } from "#rules/world/state";

/** The map AI. */

/**
 * Battles already played out, by their opening state: a battle is deterministic, so the same two squads always end
 * the same way. The caller keeps it across decisions (a game's worth); the AI would otherwise replay the same
 * forecasts thousands of times, and those were nearly all of its time.
 */
export type BattleMemo = Map<string, Battle>;

/** Past this many battles the memo starts over, so a long game can't grow it without bound. */
const MEMO_LIMIT = 20000;

function played(memo: BattleMemo, start: Battle): Battle {
  const key = JSON.stringify(start);
  const known = memo.get(key);
  if (known) return known;
  if (memo.size >= MEMO_LIMIT) memo.clear();
  const done = autoplay(start);
  memo.set(key, done);
  return done;
}

/** Whether the attacker would win a fight. The mover is always the attacker, side 0 of its battle. */
type Wins = (world: World, attackerId: string, target: MoveTarget) => boolean;

function winsCache(memo: BattleMemo): Wins {
  return (world, attackerId, target) => {
    const start = openingBattle(world, attackerId, target);
    return start !== null && played(memo, start).outcome?.winner === 0;
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
 * A chain of attacks: this side's warbands that can reach `hex` this turn attack it one after another (wounds carry
 * over; nothing heals between). Returns the first attacker of an order after which `won` holds, or null. A lone
 * assault that fails feeds the enemy XP, so the AI commits only to chains that win. Used for sieges, and for ganging
 * up on an enemy warband no single one of ours can beat (the user's "blitz": layer squads on a snowballed one).
 */
function chainOpener(world: World, hex: Hex, memo: BattleMemo, won: (w: World) => boolean): string | null {
  const side = world.activePlayer;
  const ready = world.leaders.filter((l) => l.player === side && l.fellOnTurn === null && planMove(world, l.id, hex)?.target);
  if (ready.length === 0) return null;
  const orders = [[...ready].sort((a, b) => strength(a.squad) - strength(b.squad)), [...ready].sort((a, b) => strength(b.squad) - strength(a.squad))];
  for (const order of orders) {
    let w = world;
    for (const leader of order) {
      if (w.outcome || won(w) || !w.leaders.some((l) => l.id === leader.id) || !planMove(w, leader.id, hex)?.target) continue;
      const step = applyWorldAction(w, { type: "move", leaderId: leader.id, to: hex }).world;
      w = step.engagement ? concludeBattle(step, played(memo, step.engagement.battle)).world : step;
    }
    const first = order[0];
    if (won(w) && first) return first.id;
  }
  return null;
}

/** A siege: a chain on an enemy Capitol that ends with it no longer its owner's (its Guardian fell). */
function siegeOpener(world: World, capitolHex: Hex, memo: BattleMemo): string | null {
  const owner = world.cities.find((c) => sameHex(c.hex, capitolHex))?.owner ?? null;
  return chainOpener(world, capitolHex, memo, (w) => !w.cities.some((c) => sameHex(c.hex, capitolHex) && c.owner === owner && owner !== null));
}

/**
 * The blitz: an enemy warband in reach of two or more of ours that none of them beats alone, which a chain would
 * destroy. Spells come first (they're cast before any march), so the chain meets it softened.
 */
function blitzOpener(world: World, memo: BattleMemo, wins: Wins): WorldAction | null {
  const side = world.activePlayer;
  const mine = world.leaders.filter((l) => l.player === side && l.fellOnTurn === null);
  for (const enemy of world.leaders.filter((l) => l.player !== side)) {
    const reaching = mine.filter((l) => planMove(world, l.id, enemy.hex)?.target?.kind === "leader");
    if (reaching.length < 2) continue;
    if (reaching.some((l) => wins(world, l.id, { kind: "leader", leaderId: enemy.id }))) continue;
    const first = chainOpener(world, enemy.hex, memo, (w) => !w.leaders.some((l) => l.id === enemy.id));
    if (first) return { type: "move", leaderId: first, to: enemy.hex };
  }
  return null;
}

const healthy = (leader: Leader) => leader.fellOnTurn === null && strength(leader.squad) >= 0.5 * fullStrength(leader.squad);

/**
 * The rally check: would a siege win if every healthy warband stood next to the enemy Capitol now? If so, they stop
 * chasing other targets and close in, so the siege check can open the assault once enough are in reach.
 */
function siegeViable(world: World, capitolHex: Hex, memo: BattleMemo): boolean {
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
  return siegeOpener(placed, capitolHex, memo) !== null;
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
 * What every planner needs, worked out once per decision: the world as this player knows it, battle forecasts, its
 * Capitol and warbands, and its gold with the reserve it keeps for refilling warbands.
 */
interface AiContext {
  readonly world: World;
  readonly side: PlayerId;
  readonly memo: BattleMemo;
  readonly wins: Wins;
  readonly capitol: City | undefined;
  readonly mine: readonly Leader[];
  /** Its tier-1 units, and the cheapest one's price. */
  readonly roots: readonly string[];
  readonly cost: number;
  readonly gold: number;
  /** Whether it can pay `price` and still fill a new warband afterwards. */
  readonly spareFor: (price: number) => boolean;
  /** Gold enough for a whole new warband and one more unit. */
  readonly rich: boolean;
  /** A warband of its own standing in the Capitol. */
  readonly home: Leader | undefined;
  /** An enemy warband could attack the Capitol next turn. */
  readonly underThreat: boolean;
  /** The nearest enemy Capitol: the siege target. */
  readonly target: City | undefined;
  /** The root unit a squad has fewest of: recruits keep armies mixed. */
  readonly pick: (squad: readonly SquadMember[]) => string;
}

type Planner = (ai: AiContext) => WorldAction | null;

/** Would an enemy warband, with a fresh turn's movement, reach `hex` with an attack? */
function reachedByEnemy(world: World, side: PlayerId, hex: Hex): boolean {
  return world.leaders.some((l) => l.player !== side && planMove({ ...world, leaders: world.leaders.map((x) => (x.id === l.id ? { ...x, movement: movementOf(x) } : x)) }, l.id, hex)?.target);
}

function aiContext(truth: World, memo: BattleMemo): AiContext {
  const side = truth.activePlayer;
  const world = knownWorld(truth, side);
  const capitol = capitolOf(world, side);
  const mine = world.leaders.filter((l) => l.player === side);
  const roots = FACTION_ROOTS[playerOf(world, side).faction];
  const cost = Math.min(...roots.map((r) => RECRUIT_COST[r] ?? Infinity));
  const gold = playerOf(world, side).gold;
  const base = capitol?.hex ?? mine[0]?.hex;
  return {
    world,
    side,
    memo,
    wins: winsCache(memo),
    capitol,
    mine,
    roots,
    cost,
    gold,
    spareFor: (price) => gold >= price + cost * STARTING_LEADERSHIP,
    rich: gold >= cost * (STARTING_LEADERSHIP + 1),
    home: capitol ? mine.find((l) => sameHex(l.hex, capitol.hex)) : undefined,
    underThreat: capitol !== undefined && reachedByEnemy(world, side, capitol.hex),
    target: world.cities
      .filter((c) => c.kind === "capitol" && c.owner !== side && c.owner !== null)
      .sort((a, b) => (base ? hexDistance(base, a.hex) - hexDistance(base, b.hex) : 0))[0],
    pick: (squad) => [...roots].sort((a, b) => squad.filter((m) => m.defId === a).length - squad.filter((m) => m.defId === b).length)[0] ?? roots[0] ?? "",
  };
}

/** Leader tree points and carried items: free, so first. */
const leaderUpkeep: Planner = ({ world, mine }) => {
  for (const leader of mine) {
    const skill = AI_SKILL_ORDER.find((s) => !learnSkillProblem(world, leader.id, s));
    if (skill) return { type: "learn", leaderId: leader.id, skill };
    const item = leader.bag.find((i) => !equipProblem(leader, i));
    if (item) return { type: "equip", leaderId: leader.id, item };
  }
  return null;
};

/** Choosing is free, so the AI settles every fork it can reach right away. */
const forks: Planner = ({ world, side, capitol }) => {
  if (!capitol) return null;
  const fork = openForks(playerOf(world, side).faction, playerOf(world, side).commitment)[0];
  if (!fork) return null;
  const options = forkOptions(fork);
  const to = options.find((o) => AI_PREFERRED_BRANCHES.includes(o)) ?? options[0];
  return to && !chooseBranchProblem(world, fork, to) ? { type: "choose", fork, to } : null;
};

const revival: Planner = ({ world, capitol, mine }) => {
  if (!capitol) return null;
  const fallen = mine.find((l) => !reviveProblem(world, l.id));
  return fallen ? { type: "revive", leaderId: fallen.id } : null;
};

/** Tier 2+ dead, once their price has fallen to its floor. */
const bargains: Planner = ({ world, side, capitol, home, gold }) => {
  if (!capitol) return null;
  const into: SquadRef = home ? { kind: "warband", leaderId: home.id } : { kind: "garrison", cityId: capitol.id };
  const bargain = playerOf(world, side)
    .graveyard.map((fallen, index) => ({ index, tier: UNITS[fallen.defId]?.tier ?? 1, cost: resurrectionCost(world, side, index) ?? Infinity }))
    .filter((f) => f.tier >= 2 && f.cost === RESURRECTION_BASE * f.tier && gold >= f.cost && !resurrectProblem(world, f.index, into))
    .sort((a, b) => b.tier - a.tier)[0];
  return bargain ? { type: "resurrect", index: bargain.index, into } : null;
};

/** A warband at home takes recruits first. */
const recruitHome: Planner = ({ world, home, gold, pick }) => {
  if (!home) return null;
  const defId = pick(home.squad);
  const into: SquadRef = { kind: "warband", leaderId: home.id };
  return gold >= (RECRUIT_COST[defId] ?? Infinity) && !recruitProblem(world, defId, into) ? { type: "recruit", defId, into } : null;
};

/**
 * The Capitol is the loss condition. Under threat, recruits stand with the Guardian (a fresh leader there would
 * only be picked off); otherwise, once the warbands are full, spare gold stands guard there too (user's playtest:
 * AI Capitols fell holding only their Guardian), keeping a reserve for refilling warbands.
 */
const guardCapitol: Planner = ({ world, capitol, mine, underThreat, gold, cost, pick }) => {
  if (!capitol) return null;
  const garrison: SquadRef = { kind: "garrison", cityId: capitol.id };
  const guard = pick(capitol.garrison);
  if (recruitProblem(world, guard, garrison)) return null;
  const warbandsReady = mine.length > 0 && mine.every((l) => l.squad.length >= leadershipOf(l));
  const spare = warbandsReady && gold >= (RECRUIT_COST[guard] ?? Infinity) + cost * 2;
  return underThreat || spare ? { type: "recruit", defId: guard, into: garrison } : null;
};

/** Upgrades aren't retroactive: they pay off on units about to become that type, and on future recruits. */
const upgrades: Planner = ({ world, side, capitol, roots, spareFor }) => {
  if (!capitol) return null;
  const everyone = squadsOf(world, side).flatMap((h) => h.squad);
  const commitment = playerOf(world, side).commitment;
  const best = upgradesOf(playerOf(world, side).faction)
    .map((u) => ({ u, value: everyone.filter((m) => nextForm(m.defId, commitment) === u.unitType).length + (roots.includes(u.unitType) ? 1 : 0) }))
    .filter(({ u, value }) => value > 0 && spareFor(u.price) && !upgradeProblem(world, u.id))
    .sort((a, b) => b.value - a.value)[0];
  return best ? { type: "upgrade", upgrade: best.u.id } : null;
};

/** Spells with spare gold, cheapest first. */
const learnSpells: Planner = ({ world, side, capitol, rich, spareFor }) => {
  if (!capitol || !rich) return null;
  const spell = spellsOf(playerOf(world, side).faction)
    .filter((s) => !learnSpellProblem(world, s.id) && spareFor(s.learnCost))
    .sort((a, b) => a.learnCost - b.learnCost)[0];
  return spell ? { type: "learnSpell", spell: spell.id } : null;
};

/** Walls with spare gold: the Capitol first (it's the loss condition), then the cheapest city. */
const walls: Planner = ({ world, side, capitol, rich, spareFor }) => {
  if (!capitol || !rich) return null;
  const city = world.cities
    .filter((c) => c.owner === side && !upgradeCityProblem(world, c.id) && spareFor(cityUpgradeCost(c)))
    .sort((a, b) => Number(b.kind === "capitol") - Number(a.kind === "capitol") || cityUpgradeCost(a) - cityUpgradeCost(b))[0];
  return city ? { type: "upgradeCity", cityId: city.id } : null;
};

/** Nodes that pay gold pay for themselves: invest with spare gold, cheapest first. */
const invest: Planner = ({ world, capitol, rich, spareFor }) => {
  if (!capitol || !rich) return null;
  const node = world.nodes
    .filter((n) => NODES[n.kind].income(n.level + 1) > NODES[n.kind].income(n.level) && !investNodeProblem(world, n.id) && spareFor(nodeInvestCost(n)))
    .sort((a, b) => nodeInvestCost(a) - nodeInvestCost(b))[0];
  return node ? { type: "investNode", nodeId: node.id } : null;
};

/**
 * A new warband: when there's none, or with gold to spare once the others are full (at most AI_MAX_WARBANDS). Under
 * threat, only with the gold to fill it at once: a lone new leader stands in front of the garrison and only feeds
 * the enemy XP.
 */
const newWarband: Planner = ({ world, capitol, mine, home, underThreat, rich, gold, cost, pick }) => {
  if (!capitol || home) return null;
  const canFill = gold >= cost * STARTING_LEADERSHIP;
  const warbandsFull = mine.every((l) => l.squad.length >= leadershipOf(l));
  if ((underThreat && !canFill) || !(mine.length === 0 || (rich && warbandsFull && mine.length < AI_MAX_WARBANDS))) return null;
  const spare = capitol.garrison.find((m) => m.defId !== GUARDIAN_ID);
  if (spare && !elevateProblem(world, spare.tile)) return { type: "elevate", tile: spare.tile };
  const garrison: SquadRef = { kind: "garrison", cityId: capitol.id };
  const guard = pick(capitol.garrison);
  return recruitProblem(world, guard, garrison) ? null : { type: "recruit", defId: guard, into: garrison };
};

const castSpells: Planner = ({ world }) => chooseCast(world);

const siege: Planner = ({ world, target, memo }) => {
  if (!target) return null;
  const opener = siegeOpener(world, target.hex, memo);
  return opener ? { type: "move", leaderId: opener, to: target.hex } : null;
};

const blitz: Planner = ({ world, memo, wins }) => blitzOpener(world, memo, wins);

/**
 * Each warband's march: home when hurt (or short of units it can afford), closing in when a rally on the enemy
 * Capitol would win, otherwise the nearest target it can take without being caught; failing all that, staging
 * within reach of the enemy Capitol, then exploring.
 */
const marches: Planner = ({ world, side, capitol, mine, wins, memo, target, cost, gold }) => {
  const rally = target !== undefined && siegeViable(world, target.hex, memo);
  const staging: { leader: Leader; to: Hex }[] = [];
  for (const leader of mine) {
    if (leader.movement <= 0) continue;
    const atHome = capitol !== undefined && sameHex(leader.hex, capitol.hex);
    // A thin squad waits at home for recruits while gold keeps coming in.
    if (atHome && leader.squad.length < 3 && income(world, side) >= cost) continue;
    // Wounded, leaderless until revived, or short of units with the gold to fill them: home to the Capitol.
    const missing = leadershipOf(leader) - leader.squad.length;
    const refill = missing >= 1 && gold >= cost * missing;
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
        if ((plan.target !== null && plan.target.kind !== "capture") || !stop || !threatened(world, leader, stop, wins)) return true;
        // Boxed in (user's playtest): where it stands is no safer, so an empty city is worth taking.
        return plan.target?.kind === "capture" && threatened(world, leader, leader.hex, wins);
      })
      .sort((a, b) => a.plan.path.cost - b.plan.path.cost);
    const best = options[0];
    if (best) return { type: "move", leaderId: leader.id, to: best.hex };
    // Nothing to take: close in on the enemy Capitol and wait within reach for the siege, never alone.
    if (target && leader.fellOnTurn === null) {
      const plan = planMove(world, leader.id, target.hex);
      if (plan && !plan.target) {
        const stop = plan.path.hexes.slice(0, plan.steps).reverse().find((hex) => !threatened(world, leader, hex, wins));
        if (stop) staging.push({ leader, to: stop });
      }
    }
  }
  const approach = staging[0];
  if (approach) return { type: "move", leaderId: approach.leader.id, to: approach.to };
  return explore(world, mine, wins);
};

/**
 * The planners, in priority order: the first with something to do decides. Free choices first, then spending gold
 * (the Capitol's safety before growth), then spells, then the army: sieges, blitzes, marches.
 */
const PLANNERS: readonly Planner[] = [
  leaderUpkeep,
  forks,
  revival,
  bargains,
  recruitHome,
  guardCapitol,
  upgrades,
  learnSpells,
  walls,
  invest,
  newWarband,
  castSpells,
  siege,
  blitz,
  marches,
];

/**
 * Map AI: plans from what it knows (fog of war), using deterministic battle forecasts both ways: it skips fights it
 * would lose and won't stop where an enemy could reach it next turn and win. The planners above, in order.
 */
export function chooseWorldAction(truth: World, memo: BattleMemo = new Map()): WorldAction {
  const ai = aiContext(truth, memo);
  for (const plan of PLANNERS) {
    const action = plan(ai);
    if (action) return action;
  }
  return { type: "endTurn" };
}
