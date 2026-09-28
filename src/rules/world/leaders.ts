import { EFFECTS } from "#rules/effects";
import { LEADER_AURA, LEADER_EXTRA_HEALTH, LEADER_HEALING, LEADER_MOVEMENT, LEADER_XP_PER_POINT, MAX_LEADERSHIP, STARTING_LEADERSHIP } from "#rules/balance";
import type { EffectSeed } from "#rules/battle/types";
import { itemById, SLOT_CAPACITY, SLOT_NAMES } from "#rules/items";
import type { Leader } from "#rules/world/state";

/**
 * The leader tree v1 (user, docs/design/pillars.md): one shared tree. The skills are the user's; the ranks,
 * prerequisites and names are provisional placeholders (docs/provisional.md).
 */
export interface LeaderSkill {
  readonly name: string;
  readonly maxRank: number;
  /** Skills that need at least one rank first: what makes it a tree. */
  readonly requires: readonly string[];
  readonly describe: string;
}

export const LEADER_SKILLS: Readonly<Record<string, LeaderSkill>> = {
  movement: { name: "Movement +1", maxRank: 2, requires: [], describe: "+1 overworld movement per turn." },
  health: { name: "Health +10%", maxRank: 1, requires: [], describe: `The leader has +${LEADER_EXTRA_HEALTH}% max HP.` },
  leadership: {
    name: "Leadership +1",
    maxRank: MAX_LEADERSHIP - STARTING_LEADERSHIP,
    requires: [],
    describe: `The warband holds one more unit (at most ${MAX_LEADERSHIP}, the whole grid).`,
  },
  healing: {
    name: "Squad healing",
    maxRank: 1,
    requires: ["health"],
    describe: `At the start of your turn, every unit in the warband heals ${LEADER_HEALING * 100}% of its max HP.`,
  },
  aura: {
    name: "Leader's aura",
    maxRank: 1,
    requires: ["movement", "leadership", "healing"],
    describe: `While the leader stands, the squad has +${LEADER_AURA}% damage.`,
  },
};

export const rankOf = (leader: Leader, skill: string): number => leader.skills[skill] ?? 0;

export const leadershipOf = (leader: Leader): number => STARTING_LEADERSHIP + rankOf(leader, "leadership");

export const movementOf = (leader: Leader): number => LEADER_MOVEMENT + rankOf(leader, "movement") + marchBonusOf(leader);

/** The best map movement any living unit's mark gives its warband (Stables); marks don't add up. */
function marchBonusOf(leader: Leader): number {
  const bonuses = leader.squad.filter((m) => m.hp > 0).flatMap((m) => m.marks.map((mark) => EFFECTS.get(mark.effect.def)?.mapMovement ?? 0));
  return Math.max(0, ...bonuses);
}

/** Share of max HP each unit of the warband heals at the start of its side's turn. */
export const squadHealingOf = (leader: Leader): number => LEADER_HEALING * rankOf(leader, "healing");

/** Provisional: one point per LEADER_XP_PER_POINT of XP the leader has earned. */
export function unspentPoints(leader: Leader): number {
  const spent = Object.values(leader.skills).reduce((sum, rank) => sum + rank, 0);
  return Math.floor(leader.experience / LEADER_XP_PER_POINT) - spent;
}

export function learnProblem(leader: Leader, skill: string): string | null {
  const def = LEADER_SKILLS[skill];
  if (!def) return "no such skill";
  if (unspentPoints(leader) < 1) return "no points to spend";
  if (rankOf(leader, skill) >= def.maxRank) return "already at its highest rank";
  const missing = def.requires.filter((r) => rankOf(leader, r) === 0);
  if (missing.length > 0) return `needs ${missing.map((r) => LEADER_SKILLS[r]?.name ?? r).join(", ")} first`;
  return null;
}

/** Why this leader can't put on `item` from its bag now, or null. */
export function equipProblem(leader: Leader, item: string): string | null {
  if (!leader.bag.includes(item)) return "not in the bag";
  const slot = itemById(item).slot;
  if (!slot) return "it's carried, not worn";
  const used = leader.worn.filter((w) => itemById(w).slot === slot).length;
  return used >= SLOT_CAPACITY[slot] ? `no free ${SLOT_NAMES[slot].toLowerCase()} slot` : null;
}

/** An item that makes reviving this leader free (the Ankh), worn or in the bag. */
export const freeRevival = (leader: Leader): string | undefined => [...leader.worn, ...leader.bag].find((id) => itemById(id).revivesFree);

/** The leader tree's effects on the leader's own unit in battle. */
export function leaderEffects(leader: Leader): { skill: string; effect: EffectSeed }[] {
  const effects: { skill: string; effect: EffectSeed }[] = [];
  if (rankOf(leader, "health") > 0) effects.push({ skill: "health", effect: { def: "extra_health", amount: LEADER_EXTRA_HEALTH } });
  if (rankOf(leader, "aura") > 0) effects.push({ skill: "aura", effect: { def: "leader_aura", amount: LEADER_AURA } });
  return effects;
}
