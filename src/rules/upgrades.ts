import { UPGRADE_PRICE_PER_TIER } from "#rules/balance";
import type { EffectSeed } from "#rules/battle/types";
import { GUARDIAN_ID, UNITS } from "#rules/units/index";
import type { Playable } from "#rules/units/index";

/**
 * Unit-type upgrades (user, docs/design/pillars.md): bought with gold at the Capitol for one unit type, they reach
 * units that become that type afterwards and stay with them through evolution. The user will design unique ones
 * ("punish stacks one more time"); until then every type has the user's example, a placeholder "+5 damage".
 */
export interface UpgradeDef {
  readonly id: string;
  readonly unitType: string;
  /** What it does, on the node it's bought at: "+5 damage". */
  readonly label: string;
  /** With the unit type, for a unit's track record: "Congregant: +5 damage". */
  readonly name: string;
  readonly price: number;
  /** What a unit receives, as a mark. */
  readonly effect: EffectSeed;
}

const PLACEHOLDER_DAMAGE = 5;

export const UPGRADES: ReadonlyMap<string, UpgradeDef> = new Map(
  Object.entries(UNITS)
    .filter(([defId, def]) => def.faction !== "neutral" && defId !== GUARDIAN_ID)
    .map(([defId, def]): [string, UpgradeDef] => {
      const id = `${defId}_damage`;
      const label = `+${PLACEHOLDER_DAMAGE} damage`;
      return [id, { id, unitType: defId, label, name: `${def.name}: ${label}`, price: UPGRADE_PRICE_PER_TIER * def.tier, effect: { def: "extra_damage", amount: PLACEHOLDER_DAMAGE } }];
    }),
);

export function upgradesFor(unitType: string): UpgradeDef[] {
  return [...UPGRADES.values()].filter((u) => u.unitType === unitType);
}

export function upgradesOf(faction: Playable): UpgradeDef[] {
  return [...UPGRADES.values()].filter((u) => UNITS[u.unitType]?.faction === faction);
}
