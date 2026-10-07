import { at } from "#rules/abilities/core";
import { frontLine, opponent } from "#rules/battle/grid";
import type { Behavior, Ctx } from "#rules/battle/types";

/**
 * Keywords any unit can carry (the user, 2026-10-05: "we need to open up for more mechanics"; `design/combat.md`).
 * Counted, never rolled (the No RNG pillar). Every number is provisional (`provisional.md` #65).
 */

/** Counts on a quiet counter effect; true on every `every`-th count, which starts the count over. */
function countTo(ctx: Ctx, unitId: string, counter: string, every: number): boolean {
  const found = ctx.unit(unitId).effects.find((e) => e.def === counter);
  if (!found) {
    ctx.addEffect(unitId, { def: counter, stacks: 1, source: unitId });
    return every <= 1;
  }
  found.stacks += 1;
  if (found.stacks < every) return false;
  found.stacks = 0;
  return true;
}

export const keywords: Readonly<Record<string, Behavior>> = {
  /** Tarot x (the user): as the fight begins, its side draws x cards and picks one in secret (`battle/tarot.ts`). */
  tarot: {
    kind: "passive",
    name: "Tarot",
    defaults: { cards: 3 },
    describe: (p) => `As the fight begins, its side draws ${p["cards"]} tarot cards and picks one in secret: a task that, done, pays the whole side.`,
    hooks: { tarotCards: (_ctx, self) => self.params["cards"] ?? 0 },
  },

  /** Crit x: every x-th hit it lands deals double damage. */
  crit: {
    kind: "passive",
    name: "Crit",
    defaults: { every: 3 },
    describe: (p) => `Every ${ordinal(p["every"] ?? 3)}hit it lands deals double damage.`,
    hooks: {
      outgoing: (ctx, self, packet) => {
        if (packet.amount <= 0 || !countTo(ctx, self.unitId, "crit_count", self.params["every"] ?? 3)) return;
        packet.amount *= 2;
        ctx.emit({ type: "crit", unitId: self.unitId, target: packet.target });
      },
    },
  },

  /** Evasion x: every x-th hit that would land on it misses entirely. */
  evasion: {
    kind: "passive",
    name: "Evasion",
    defaults: { every: 3 },
    describe: (p) => `Every ${ordinal(p["every"] ?? 3)}hit against it misses entirely.`,
    hooks: {
      incoming: (ctx, self, packet) => {
        if (packet.amount <= 0 || !countTo(ctx, self.unitId, "evasion_count", self.params["every"] ?? 3)) return;
        packet.amount = 0;
        ctx.emit({ type: "evaded", unitId: self.unitId });
      },
    },
  },

  /** The user's "boomer": it blows itself up, hitting the enemy front row for a share of its max HP. */
  explode: {
    kind: "active",
    name: "Explode",
    describe: (p) => `Main action: it dies, and the whole enemy front row takes ${p["percent"]}% of its max HP. Nothing is left to raise.`,
    tags: ["damage", "area"],
    defaults: { percent: 60 },
    choices: (ctx, self) => {
      const units = ctx.living();
      const enemy = opponent(ctx.unit(self.unitId).side);
      const row = frontLine(units, enemy);
      const line = units.filter((u) => u.side === enemy && u.tile.row === row);
      const [anchor] = line;
      return anchor ? [at(anchor, line.map((u) => u.id), "main")] : [];
    },
    resolve: (ctx, self, choice) => {
      const power = Math.round((ctx.stats(self.unitId).maxHp * (self.params["percent"] ?? 0)) / 100);
      ctx.hit(self.unitId, choice.affected, ctx.hitSpec(self, undefined, power));
      ctx.lose(self.unitId, ctx.unit(self.unitId).hp, self.unitId);
      ctx.spendCorpse(self.unitId, "destroyed");
    },
  },

  /** Ignite: its hits set the target burning (not a wet one). */
  ignite: {
    kind: "passive",
    name: "Ignite",
    defaults: { burn: 8, turns: 3 },
    scales: ["burn"],
    describe: (p) => `Its hits set the target burning: ${p["burn"]} damage at the start of each of its next ${p["turns"]} turns. A wet target doesn't catch.`,
    hooks: {
      afterHit: (ctx, self, targetId) => {
        const target = ctx.unit(targetId);
        if (!target.alive || target.effects.some((e) => e.def === "wet")) return;
        const burning = target.effects.find((e) => e.def === "burning");
        if (burning) burning.stacks = Math.max(burning.stacks, self.params["turns"] ?? 3);
        else ctx.addEffect(targetId, { def: "burning", amount: self.params["burn"] ?? 0, stacks: self.params["turns"] ?? 3, source: self.unitId });
      },
    },
  },

  /** Soak: its hits leave the target wet, which puts out a fire. */
  soak: {
    kind: "passive",
    name: "Soak",
    defaults: { rounds: 2 },
    describe: (p) => `Its hits leave the target wet for ${p["rounds"]} rounds (it stops burning; lightning hits it harder).`,
    hooks: {
      afterHit: (ctx, self, targetId) => wetten(ctx, targetId, self.params["rounds"] ?? 2, self.unitId),
    },
  },
};

/** A unit gets wet for `rounds` (or longer, if it already was), and stops burning. */
export function wetten(ctx: Ctx, targetId: string, rounds: number, source: string): void {
  const target = ctx.unit(targetId);
  if (!target.alive) return;
  for (const fire of target.effects.filter((e) => e.def === "burning")) ctx.removeEffect(targetId, fire);
  const wet = target.effects.find((e) => e.def === "wet");
  if (wet) wet.stacks = Math.max(wet.stacks, rounds);
  else ctx.addEffect(targetId, { def: "wet", stacks: rounds, source });
}

/** "3rd " for 3, nothing for 1: "every 3rd hit", "every hit". */
function ordinal(n: number): string {
  if (n === 1) return "";
  return `${n}${n === 2 ? "nd" : n === 3 ? "rd" : "th"} `;
}
