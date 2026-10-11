import type { EffectDef } from "#rules/battle/types";
import { STAT_WORTH, SUPPORT_TURN_AI_VALUE, lostUntilHurt, weakened, flatStat } from "#rules/effects/shared";

/** The neutral tribes' effects: the carnival, the gnolls, the Drawn. */
export const NEUTRAL_EFFECTS: readonly EffectDef[] = [
  // The carnival (`abilities/carnival.ts`).
  {
    // A Soothsayer's attack, waiting to land: at the start of her next turn it hits.
    id: "foretold",
    name: "Foretold",
    describe: (e) => `Takes ${e.amount} at the start of the Soothsayer's next turn.`,
    stacking: { mode: "each" },
    lifetime: "untilSourceTurn",
    visibility: "public",
    hooks: { aiValue: (_ctx, self) => -(self.effect?.amount ?? 0) },
    onExpire: (ctx, self) => {
      const source = self.effect?.source;
      if (!source || !ctx.unit(source).alive) return;
      ctx.hit(source, [self.unitId], { power: self.effect?.amount ?? 0, type: ctx.damageTypeOf(source, "foretell"), tags: ["attack", "ranged", "damage"] });
    },
  },
  // A Soothsayer's curse.
  weakened("cursed", "Cursed"),
  // The gnolls (`abilities/gnolls.ts`).
  {
    // A Packstalker's mark: the marker's side hits it harder until the end of the next round.
    id: "prey",
    name: "Prey",
    describe: (e) => `The pack's prey: takes ${e.amount} more damage from the pack for ${e.stacks} more round start${e.stacks === 1 ? "" : "s"}.`,
    stacking: { mode: "perSource" },
    lifetime: "rounds",
    visibility: "public",
    hooks: {
      incoming: (ctx, self, packet) => {
        const marker = self.effect?.source;
        if (!marker || !packet.source || packet.amount <= 0) return;
        if (ctx.unit(packet.source).side === ctx.unit(marker).side) packet.amount += self.effect?.amount ?? 0;
      },
      aiValue: (_ctx, self) => -(self.effect?.amount ?? 0) * 2,
    },
  },
  flatStat({ id: "cracked", name: "Cracked", stat: "armor", sign: -1, stacking: { mode: "merge" }, describe: (e) => `−${e.amount} armor for the rest of combat (cracked by a gnoll's jaws).` }),
  {
    id: "hamstrung",
    name: "Hamstrung",
    describe: (e) => `−${e.amount} initiative for ${e.stacks} more round start${e.stacks === 1 ? "" : "s"}.`,
    stacking: { mode: "perSource" },
    lifetime: "rounds",
    visibility: "public",
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId) stats.initiative -= self.effect?.amount ?? 0;
      },
      aiValue: (_ctx, self) => -(self.effect?.amount ?? 0) * STAT_WORTH.initiative,
    },
  },
  {
    // A Cackler's laugh: on its next turn the bearer can only attack. A unit with no attack is left alone.
    id: "goaded",
    name: "Goaded",
    describe: () => "On its next turn it can only attack.",
    stacking: { mode: "unique" },
    lifetime: "untilTurnEnd",
    visibility: "public",
    hooks: {
      restrict: (ctx, self, subjectId, allowed) => {
        if (subjectId !== self.unitId) return;
        const attacks = [...allowed].filter((id) => ctx.hasTag(id, "attack"));
        if (attacks.length === 0) return;
        for (const id of [...allowed]) if (!attacks.includes(id)) allowed.delete(id);
      },
      // A healer's or caster's turn taken from its spells is worth about a heal to the other side (provisional #63).
      aiValue: (ctx, self) => {
        const ids = ctx.abilityIds(self.unitId);
        const denied = ids.some((id) => ctx.hasTag(id, "heal") || (ctx.hasTag(id, "spell") && !ctx.hasTag(id, "attack")));
        return denied && ids.some((id) => ctx.hasTag(id, "attack")) ? -SUPPORT_TURN_AI_VALUE : 0;
      },
    },
  },
  // The Drawn (`abilities/drawn.ts`).
  {
    // A Dustwing's dust: the next hit this unit makes lands as nothing.
    id: "dusted",
    name: "Dusted",
    describe: () => "Coated in moth dust: its next hit lands as nothing.",
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      outgoing: (ctx, self, packet) => {
        if (packet.amount <= 0 || !self.effect) return;
        packet.amount = 0;
        ctx.removeEffect(self.unitId, self.effect);
      },
      aiValue: (ctx, self) => -ctx.strongestHit(self.unitId),
    },
  },
  {
    id: "pupating",
    name: "Pupating",
    describe: (e) => `Shut in its cocoon: emerges at the start of its turn in ${e.stacks} turn${e.stacks === 1 ? "" : "s"}.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {},
  },
  {
    // A Chrysalis that has emerged: it flies at its enemies (the Flit its Metamorphosis carries).
    id: "emerged",
    name: "Emerged",
    describe: () => "Emerged from its cocoon: it flies (Flit).",
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      grants: (_ctx, self, subjectId) => (subjectId === self.unitId && self.effect?.ability ? [self.effect.ability] : []),
    },
  },
  // An Eyespot's or the Pale Mother's gaze.
  lostUntilHurt("mesmerized", "Mesmerized"),
  // A Snakeoiler's sleep potion (the user, 2026-10-05: "wakes up if it takes damage, and is put back into the queue":
  // its turn is lost only if nothing hurts it first, so it keeps its place).
  lostUntilHurt("asleep", "Asleep"),
  {
    // The Matriarch fell: the strongest gnoll left leads, at half her strength.
    id: "next_in_line",
    name: "Next in line",
    describe: (e) => `Leads the pack now: its allies deal ${e.amount} more damage.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (ctx, self, subjectId, stats) => {
        if (subjectId !== self.unitId && ctx.unit(subjectId).side === ctx.unit(self.unitId).side) stats.hitBonus += self.effect?.amount ?? 0;
      },
    },
  },
];
