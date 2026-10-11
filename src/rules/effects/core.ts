import type { EffectDef } from "#rules/battle/types";


/** The effects every unit's common verbs make (Defend, Retreat) and the plainest status, Stunned. */
export const CORE_EFFECTS: readonly EffectDef[] = [
  {
    id: "defending",
    // Defend already shows as the unit's action; the log needn't say it twice.
    quiet: true,
    name: "Defending",
    describe: () => "Damage that gets past its shield is halved until this unit's next turn.",
    stacking: { mode: "unique" },
    lifetime: "untilOwnTurn",
    visibility: "public",
    hooks: {
      // Only what gets past the shield is halved (faction notes: shields "don't get bonuses from defend").
      mitigate: (_ctx, _self, packet) => {
        if (packet.amount > 0) packet.amount = Math.max(1, Math.floor(packet.amount / 2));
      },
    },
  },
  {
    id: "stunned",
    name: "Stunned",
    describe: () => "Loses its next turn.",
    stacking: { mode: "unique" },
    lifetime: "untilOwnTurn",
    visibility: "public",
    hooks: { turnStart: () => "skip" },
  },
  {
    // Retreat (the user's surrender design from an earlier attempt): the unit turns its back and loses its next
    // turn, then leaves the battle alive at the start of the one after. `amount` counts the turns it has spent so.
    id: "retreating",
    name: "Retreating",
    describe: (e) => (e.amount === 0 ? "Has turned its back: it loses its next turn, then leaves the battle alive." : "Leaves the battle at the start of its next turn."),
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      turnStart: (_ctx, self) => {
        const turning = self.effect;
        if (!turning) return null;
        if (turning.amount > 0) return "leave";
        turning.amount += 1;
        return "skip";
      },
    },
  },
  // A typed pool (architecture.md's hard cases): no unit carries one yet; tests/architecture.test.ts proves the pipeline with it.
  {
    // A pool that only soaks fire (the user's example of a typed shield). Not on any unit yet; items and spells
    // will grant it.
    id: "fire_shield",
    name: "Fire shield",
    describe: (e) => `Absorbs the next ${e.amount} fire damage.`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    absorbPriority: 10,
    hooks: {
      absorb: (ctx, self, packet) => {
        const pool = self.effect;
        if (!pool || packet.type !== "fire" || packet.amount <= 0) return;
        const taken = Math.min(pool.amount, packet.amount);
        pool.amount -= taken;
        packet.amount -= taken;
        ctx.emit({ type: "absorbed", unitId: self.unitId, amount: taken, by: "fire_shield" });
        if (pool.amount <= 0) ctx.removeEffect(self.unitId, pool);
      },
      aiValue: (_ctx, self) => 0.5 * (self.effect?.amount ?? 0),
    },
  },
];
