import { areaChoices, single } from "#rules/abilities/core";
import { meleeTargets } from "#rules/battle/grid";
import type { Behavior } from "#rules/battle/types";

/** The neutral bandits' abilities (docs/design/units/neutrals-bandits.md). */
export const neutral: Readonly<Record<string, Behavior>> = {
  /** Hedge Mage: the 2x2 block that contains the chosen tile. */
  area_2x2: {
    kind: "active",
    name: "Area Spell",
    describe: (p) =>
      `Ranged spell: hits every enemy in a 2x2 block for ${p["power"]}.`,
    tags: ["attack", "ranged", "spell", "damage", "area"],
    defaults: { power: 20 },
    scales: ["power"],
    choices: (ctx, self) =>
      areaChoices(ctx, self, (row, col) => {
        const r = Math.min(row, 1);
        const c = Math.min(col, 1);
        return [{ row: r, col: c }, { row: r + 1, col: c }, { row: r, col: c + 1 }, { row: r + 1, col: c + 1 }];
      }),
    resolve: (ctx, self, choice) => ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self)),
  },

  /** Brigand: once per combat, stun the enemy directly in front (same column, enemy front line). */
  stun_front: {
    kind: "active",
    name: "Stun",
    describe: () =>
      "Once per combat: stun the enemy directly in front for one turn.",
    tags: ["melee"],
    defaults: { charges: 1 },
    choices: (ctx, self) => {
      const user = ctx.unit(self.unitId);
      return meleeTargets(ctx.living(), user)
        .filter((t) => t.tile.col === user.tile.col)
        .map((t) => single(t, "main"));
    },
    resolve: (ctx, self, choice) => {
      for (const id of choice.affected) ctx.addEffect(id, { def: "stunned", source: self.unitId });
    },
  },

  /** Marauder: extra damage against a target that has armor. */
  anti_armor: {
    kind: "passive",
    name: "Anti-armor",
    describe: (p) =>
      `+${p["bonus"]} damage against targets that have armor.`,
    defaults: { bonus: 10 },
    hooks: {
      outgoing: (ctx, self, packet) => {
        if (ctx.stats(packet.target).armor > 0) packet.amount += self.params["bonus"] ?? 0;
      },
    },
  },
};
