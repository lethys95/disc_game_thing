import type { EffectDef } from "#rules/battle/types";
import { STAT_WORTH, flatStat } from "#rules/effects/shared";

/** The keywords' effects (`abilities/keywords.ts`): counters, the statuses that react to damage types, tarot rewards. */
export const KEYWORDS_EFFECTS: readonly EffectDef[] = [
  // Keywords (`abilities/keywords.ts`): counters, and the statuses that react to damage types.
  { id: "crit_count", quiet: true, name: "Crit count", describe: (e) => `${e.stacks} hits toward its next crit.`, stacking: { mode: "unique" }, lifetime: "battle", visibility: "public", hooks: {} },
  { id: "evasion_count", quiet: true, name: "Evasion count", describe: (e) => `${e.stacks} hits toward its next evasion.`, stacking: { mode: "unique" }, lifetime: "battle", visibility: "public", hooks: {} },
  {
    // Ignite: damage at the start of each of the bearer's turns; water puts it out.
    id: "burning",
    name: "Burning",
    describe: (e) => `Takes ${e.amount} at the start of each of its next ${e.stacks} turn${e.stacks === 1 ? "" : "s"}. Water puts it out.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      turnStart: (ctx, self) => {
        const burn = self.effect;
        if (!burn) return null;
        ctx.lose(self.unitId, burn.amount, burn.source);
        burn.stacks -= 1;
        if (burn.stacks <= 0 && ctx.unit(self.unitId).alive) ctx.removeEffect(self.unitId, burn);
        return null;
      },
      incoming: (ctx, self, packet) => {
        if (packet.type === "water" && self.effect) ctx.removeEffect(self.unitId, self.effect);
      },
      aiValue: (_ctx, self) => -((self.effect?.amount ?? 0) * (self.effect?.stacks ?? 0)),
    },
  },
  {
    // Soak: lightning hits a wet unit half again as hard and electrocutes it; fire dries it.
    id: "wet",
    name: "Wet",
    applies: ["electrocuted"],
    describe: (e) => `Wet for ${e.stacks} more round start${e.stacks === 1 ? "" : "s"}: lightning hits it half again as hard and electrocutes it (it loses its next turn); fire dries it.`,
    stacking: { mode: "unique" },
    lifetime: "rounds",
    visibility: "public",
    hooks: {
      incoming: (ctx, self, packet) => {
        if (!self.effect || packet.amount <= 0) return;
        if (packet.type === "lightning") {
          packet.amount = Math.ceil(packet.amount * 1.5);
          ctx.removeEffect(self.unitId, self.effect);
          ctx.addEffect(self.unitId, { def: "electrocuted", source: packet.source });
        } else if (packet.type === "fire") ctx.removeEffect(self.unitId, self.effect);
      },
      // Only worth something where lightning can reach it; a small nudge either way.
      aiValue: () => -5,
    },
  },
  {
    id: "electrocuted",
    name: "Electrocuted",
    describe: () => "Loses its next turn.",
    stacking: { mode: "unique" },
    lifetime: "untilOwnTurn",
    visibility: "public",
    hooks: { turnStart: () => "skip", aiValue: (ctx, self) => -ctx.strongestHit(self.unitId) },
  },
  // Tarot rewards (`battle/tarot.ts`).
  {
    id: "tarot_might",
    name: "The cards' might",
    describe: (e) => `Deals ${e.amount}% more damage (a tarot card fulfilled).`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId) stats.hitPercent += self.effect?.amount ?? 0;
      },
      aiValue: (ctx, self) => ((ctx.strongestHit(self.unitId) * (self.effect?.amount ?? 0)) / 100) * STAT_WORTH.hitBonus,
    },
  },
  flatStat({ id: "tarot_exposed", name: "Exposed", stat: "armor", sign: -1, stacking: { mode: "merge" }, describe: (e) => `−${e.amount} armor (an enemy's tarot card).` }),
];
