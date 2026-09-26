/**
 * Capitol research (user, 2026-09-26: "if researched in the Capitol, we should be able to resurrect units at cities
 * at a slight premium"): one-time purchases that unlock abilities of the whole side. Names are plain placeholders
 * until the user names them; costs are provisional.
 */
export interface ResearchDef {
  readonly id: string;
  readonly name: string;
  readonly cost: number;
  readonly describe: string;
}

export const RESEARCH: readonly ResearchDef[] = [
  {
    id: "city_resurrection",
    name: "Resurrection in cities",
    cost: 400,
    describe: "Resurrect fallen units in any city you hold, not only at the Capitol, for 25% more.",
  },
];

/** What resurrecting outside the Capitol costs, relative to the Capitol's price. */
export const CITY_RESURRECTION_PREMIUM = 1.25;
