import type { Placement } from "#rules/battle/engine";
import { EVOLUTIONS, FACTION_ROOTS } from "#rules/units/index";
import type { Branch, Playable } from "#rules/units/index";

/**
 * Branch investment (docs/design/pillars.md): at each fork of its tree a faction commits to one branch for good.
 * A commitment is the list of branches bought so far.
 */
export type Commitment = readonly Branch[];

interface Fork {
  readonly options: readonly Branch[];
  /** A later fork only opens once this branch is bought. */
  readonly after: Branch | null;
}

/** Each faction's forks, in order (docs/design/dichotomies.md). */
export const FORKS: Readonly<Record<Playable, readonly Fork[]>> = {
  jilliath: [
    { options: ["preserve", "consume"], after: null },
    { options: ["punishment", "sacrifice"], after: "consume" },
  ],
  nexus: [{ options: ["scheme", "overload"], after: null }],
};

export interface DoctrineDef {
  readonly name: string;
  readonly commitment: Commitment;
}

/** Starting commitments offered in the setup: uncommitted, or pre-bought paths through the forks. */
export const DOCTRINES: Readonly<Record<Playable, readonly (DoctrineDef & { readonly key: string })[]>> = {
  jilliath: [
    { key: "uncommitted", name: "Uncommitted: choose in play", commitment: [] },
    { key: "preserve", name: "Faith preserves", commitment: ["preserve"] },
    { key: "punishment", name: "Faith consumes: Punishment", commitment: ["consume", "punishment"] },
    { key: "sacrifice", name: "Faith consumes: Self-sacrifice", commitment: ["consume", "sacrifice"] },
  ],
  nexus: [
    { key: "uncommitted", name: "Uncommitted: choose in play", commitment: [] },
    { key: "scheme", name: "Scheme (automata, Justiciar)", commitment: ["scheme"] },
    { key: "overload", name: "Overload (mutants, Thaumaturge)", commitment: ["overload"] },
  ],
};

export function doctrine(faction: Playable, key: string): DoctrineDef {
  const found = DOCTRINES[faction].find((d) => d.key === key);
  if (!found) throw new Error(`no ${faction} doctrine ${key}`);
  return found;
}

/** Provisional gold costs of committing at each fork (canon: "spends gold in the tech tree"). */
export const INVESTMENT_COST: Readonly<Record<Branch, number>> = {
  preserve: 150,
  consume: 150,
  punishment: 300,
  sacrifice: 300,
  scheme: 150,
  overload: 150,
};

export function hasBranch(commitment: Commitment, branch: Branch | null): boolean {
  return branch === null || commitment.includes(branch);
}

/** Branches this faction could invest in now: the options of its first fork that's open and still undecided. */
export function openBranches(faction: Playable, commitment: Commitment): Branch[] {
  for (const fork of FORKS[faction]) {
    if (fork.after !== null && !commitment.includes(fork.after)) continue;
    if (fork.options.some((o) => commitment.includes(o))) continue;
    return [...fork.options];
  }
  return [];
}

export function commit(faction: Playable, commitment: Commitment, branch: Branch): Commitment {
  if (!openBranches(faction, commitment).includes(branch)) throw new Error(`cannot invest in ${branch} now`);
  return [...commitment, branch];
}

/** Every unit a faction with this commitment can field: its evolution tree from its roots, pruned by branch. */
export function allowedUnits(faction: Playable, commitment: Commitment): string[] {
  const allowed: string[] = [];
  const visit = (defId: string) => {
    if (allowed.includes(defId)) return;
    allowed.push(defId);
    for (const evolution of EVOLUTIONS[defId] ?? []) if (hasBranch(commitment, evolution.requires)) visit(evolution.to);
  };
  for (const root of FACTION_ROOTS[faction]) visit(root);
  return allowed;
}

/** Provisional: D2's default squad size. Real capacity will come from leadership (docs/design/pillars.md). */
export const SQUAD_LIMIT = 6;

export type SquadProblem = "empty" | "tooMany" | "outsideDoctrine";

export function squadProblems(squad: readonly Placement[], faction: Playable, commitment: Commitment): SquadProblem[] {
  const problems: SquadProblem[] = [];
  const allowed = allowedUnits(faction, commitment);
  if (squad.length === 0) problems.push("empty");
  if (squad.length > SQUAD_LIMIT) problems.push("tooMany");
  if (squad.some((p) => !allowed.includes(p.defId))) problems.push("outsideDoctrine");
  return problems;
}
