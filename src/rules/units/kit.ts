import type { AbilityRef } from "#rules/battle/types";

/** Ability refs with default params, for unit definitions. */
export const kit = (...ids: string[]): AbilityRef[] => ids.map((id) => ({ id }));
