import type { Placement } from "#rules/battle";

/**
 * Branch investment (docs/design/pillars.md): at each fork of the Jilliath melee line the faction commits to
 * one branch for good, so a squad can only field units from the doctrine it chose.
 */
export type Doctrine = "preserve" | "punishment" | "sacrifice";

export const DOCTRINES: Readonly<Record<Doctrine, { readonly name: string; readonly units: readonly string[] }>> = {
  preserve: { name: "Faith preserves", units: ["congregant", "paladin", "templar", "immortal"] },
  punishment: { name: "Faith consumes: Punishment", units: ["congregant", "zealot", "punisher", "torturer"] },
  sacrifice: { name: "Faith consumes: Self-sacrifice", units: ["congregant", "zealot", "fanatic", "chosen", "avatar_of_vengeance"] },
};

/** Provisional: D2's default squad size. Real capacity will come from leadership (docs/design/pillars.md). */
export const SQUAD_LIMIT = 6;

export type SquadProblem = "empty" | "tooMany" | "outsideDoctrine";

export function squadProblems(squad: readonly Placement[], doctrine: Doctrine): SquadProblem[] {
  const problems: SquadProblem[] = [];
  if (squad.length === 0) problems.push("empty");
  if (squad.length > SQUAD_LIMIT) problems.push("tooMany");
  if (squad.some((p) => !DOCTRINES[doctrine].units.includes(p.defId))) problems.push("outsideDoctrine");
  return problems;
}
