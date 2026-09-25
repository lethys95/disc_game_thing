import type { Placement } from "#rules/battle";
import { EVOLUTIONS } from "#rules/units";
import type { Branch } from "#rules/units";

/**
 * Branch investment (docs/design/pillars.md): at each fork of the Jilliath melee line the faction commits to one
 * branch for good. The tier-2 fork is preserve/consume; only a consuming faction reaches the tier-3 fork.
 */
export interface Commitment {
  readonly tier2: "preserve" | "consume" | null;
  readonly tier3: "punishment" | "sacrifice" | null;
}

export type Doctrine = "uncommitted" | "preserve" | "punishment" | "sacrifice";

export const DOCTRINES: Readonly<Record<Doctrine, { readonly name: string; readonly commitment: Commitment }>> = {
  uncommitted: { name: "Uncommitted: choose in play", commitment: { tier2: null, tier3: null } },
  preserve: { name: "Faith preserves", commitment: { tier2: "preserve", tier3: null } },
  punishment: { name: "Faith consumes: Punishment", commitment: { tier2: "consume", tier3: "punishment" } },
  sacrifice: { name: "Faith consumes: Self-sacrifice", commitment: { tier2: "consume", tier3: "sacrifice" } },
};

/** Provisional gold costs of committing at each fork (canon: "spends gold in the tech tree"). */
export const INVESTMENT_COST: Readonly<Record<Branch, number>> = { preserve: 150, consume: 150, punishment: 300, sacrifice: 300 };

export function hasBranch(commitment: Commitment, branch: Branch | null): boolean {
  return branch === null || commitment.tier2 === branch || commitment.tier3 === branch;
}

/** Branches this faction could invest in now: the next open fork on its path. */
export function openBranches(commitment: Commitment): Branch[] {
  if (commitment.tier2 === null) return ["preserve", "consume"];
  if (commitment.tier2 === "consume" && commitment.tier3 === null) return ["punishment", "sacrifice"];
  return [];
}

export function commit(commitment: Commitment, branch: Branch): Commitment {
  if (!openBranches(commitment).includes(branch)) throw new Error(`cannot invest in ${branch} now`);
  return branch === "preserve" || branch === "consume" ? { ...commitment, tier2: branch } : { ...commitment, tier3: branch };
}

/** Every unit a faction with this commitment can field: the evolution tree from the Congregant, pruned by branch. */
export function allowedUnits(commitment: Commitment): string[] {
  const allowed: string[] = [];
  const visit = (defId: string) => {
    if (allowed.includes(defId)) return;
    allowed.push(defId);
    for (const evolution of EVOLUTIONS[defId] ?? []) if (hasBranch(commitment, evolution.requires)) visit(evolution.to);
  };
  visit("congregant");
  return allowed;
}

/** Provisional: D2's default squad size. Real capacity will come from leadership (docs/design/pillars.md). */
export const SQUAD_LIMIT = 6;

export type SquadProblem = "empty" | "tooMany" | "outsideDoctrine";

export function squadProblems(squad: readonly Placement[], doctrine: Doctrine): SquadProblem[] {
  const problems: SquadProblem[] = [];
  const allowed = allowedUnits(DOCTRINES[doctrine].commitment);
  if (squad.length === 0) problems.push("empty");
  if (squad.length > SQUAD_LIMIT) problems.push("tooMany");
  if (squad.some((p) => !allowed.includes(p.defId))) problems.push("outsideDoctrine");
  return problems;
}
