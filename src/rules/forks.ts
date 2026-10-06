import { STARTING_LEADERSHIP } from "#rules/balance";
import type { Placement } from "#rules/battle/engine";
import { EVOLUTIONS, FACTION_ROOTS, UNITS } from "#rules/units/index";
import type { Playable } from "#rules/units/index";

/**
 * Branch choices (docs/design/pillars.md). A fork is a unit with more than one evolution; a commitment records,
 * per fork, which branch its owner chose. Choosing is free and permanent, and forks are independent: going
 * "Faith" in one line says nothing about another line.
 */
export type Commitment = Readonly<Record<string, string>>;

/** The branches at `defId`, or an empty list if it isn't a fork. */
export function forkOptions(defId: string): readonly string[] {
  const evolutions = EVOLUTIONS[defId] ?? [];
  return evolutions.length > 1 ? evolutions.map((e) => e.to) : [];
}

export function isFork(defId: string): boolean {
  return forkOptions(defId).length > 0;
}

/** Why this choice can't be made, or null. */
export function chooseProblem(commitment: Commitment, fork: string, to: string): string | null {
  if (!forkOptions(fork).includes(to)) return "not a branch of that fork";
  if (commitment[fork] !== undefined) return "already chosen";
  return null;
}

export function choose(commitment: Commitment, fork: string, to: string): Commitment {
  const problem = chooseProblem(commitment, fork, to);
  if (problem) throw new Error(`cannot choose ${to} at ${fork}: ${problem}`);
  return { ...commitment, [fork]: to };
}

/** Every unit this faction can field given its choices: undecided forks keep both branches open. */
export function allowedUnits(faction: Playable, commitment: Commitment): string[] {
  const allowed: string[] = [];
  const visit = (defId: string) => {
    if (allowed.includes(defId)) return;
    allowed.push(defId);
    const chosen = commitment[defId];
    for (const evolution of EVOLUTIONS[defId] ?? []) if (chosen === undefined || chosen === evolution.to) visit(evolution.to);
  };
  for (const root of FACTION_ROOTS[faction]) visit(root);
  return allowed;
}

/** Forks this faction can still choose at: reachable given its choices, and undecided. */
export function openForks(faction: Playable, commitment: Commitment): string[] {
  return allowedUnits(faction, commitment).filter((defId) => isFork(defId) && commitment[defId] === undefined);
}

/** The fork (and branch taken) on the way to each unit type: its ancestors in the trees. */
function pathTo(defId: string): { fork: string; to: string }[] {
  for (const [from, evolutions] of Object.entries(EVOLUTIONS)) {
    if (!evolutions.some((e) => e.to === defId)) continue;
    const before = pathTo(from);
    return isFork(from) ? [...before, { fork: from, to: defId }] : before;
  }
  return [];
}

/** The commitment a set of units implies, or null if two of them took different branches of the same fork. */
export function commitmentOf(units: readonly string[]): Commitment | null {
  const commitment: Record<string, string> = {};
  for (const defId of units) {
    for (const { fork, to } of pathTo(defId)) {
      if (commitment[fork] !== undefined && commitment[fork] !== to) return null;
      commitment[fork] = to;
    }
  }
  return commitment;
}

export type SquadProblem = "empty" | "tooMany" | "otherFaction" | "conflictingBranches";

/** A starting squad: one faction, a new leader's Leadership, and no two branches of the same fork. */
export function squadProblems(squad: readonly Placement[], faction: Playable): SquadProblem[] {
  const problems: SquadProblem[] = [];
  const everything = allowedUnits(faction, {});
  if (squad.length === 0) problems.push("empty");
  if (squad.length > STARTING_LEADERSHIP) problems.push("tooMany");
  if (squad.some((p) => !everything.includes(p.defId) || UNITS[p.defId]?.faction !== faction)) problems.push("otherFaction");
  if (commitmentOf(squad.map((p) => p.defId)) === null) problems.push("conflictingBranches");
  return problems;
}
