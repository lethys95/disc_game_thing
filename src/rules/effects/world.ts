import type { EffectDef } from "#rules/battle/types";
import { flatStat } from "#rules/effects/shared";

/** Effects the world brings into battle: recruit marks from nodes (design/nodes.md, 2026-09-28; numbers provisional #56), items, upgrades, spells, walls, leaders' levels and skills. */
export const WORLD_EFFECTS: readonly EffectDef[] = [
  {
    // Context from the world: the side owns a Blacksmith node. Its damaging abilities hit harder.
    id: "blacksmith",
    quiet: true,
    name: "Blacksmith",
    describe: (e) => `Damaging abilities deal +${e.amount}.`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      outgoing: (_ctx, self, packet) => {
        if (packet.tags.includes("damage")) packet.amount += self.effect?.amount ?? 0;
      },
    },
  },
  // Recruit marks from the user's nodes (design/nodes.md, 2026-09-28); numbers provisional (provisional.md #56).
  {
    // Foundry: plating that shields its bearer and mends itself.
    id: "foundry",
    quiet: true,
    name: "Forged plating",
    describe: (e) => `+${e.amount} shield; ${Math.round(e.amount / 3)} of it mends at the start of each of its turns.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId) stats.shield += self.effect?.amount ?? 0;
      },
      turnStart: (ctx, self) => {
        ctx.restoreShield(self.unitId, Math.round((self.effect?.amount ?? 0) / 3));
        return null;
      },
    },
  },
  {
    // Leech pits: heals for a share of the damage it deals.
    id: "leech",
    quiet: true,
    name: "Leech-fed",
    describe: (e) => `Heals ${e.amount}% of the damage it deals.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      afterHit: (ctx, self, _targetId, dealt) => {
        const healed = Math.floor((dealt * (self.effect?.amount ?? 0)) / 100);
        if (healed > 0) ctx.heal(self.unitId, healed);
      },
    },
  },
  {
    // Tannery: the first blow of a battle that gets through its shield lands softer. Spent once it has.
    id: "tannery",
    quiet: true,
    name: "Tanned hide",
    describe: (e) => `The first hit to reach it in a battle deals ${e.amount} less.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      mitigate: (ctx, self, packet) => {
        const hide = self.effect;
        if (!hide || packet.amount <= 0) return;
        packet.amount = Math.max(0, packet.amount - hide.amount);
        ctx.removeEffect(self.unitId, hide);
      },
    },
  },
  {
    // Siege workshop: its first attack in a battle against a city's defenders goes through their walls. `stacks` 2
    // marks it as used during that attack; it's gone once the attack has resolved.
    id: "siege",
    quiet: true,
    name: "Siege-trained",
    describe: () => "Its first attack against a city's defenders ignores their fortification.",
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      outgoing: (ctx, self, packet) => {
        const trained = self.effect;
        if (!trained || !packet.tags.includes("attack")) return;
        const walls = ctx.unit(packet.target).effects.find((e) => e.def === "fortified");
        if (!walls) return;
        packet.pierce += walls.amount;
        trained.stacks = 2;
      },
      afterAttack: (ctx, self) => {
        if (self.effect && self.effect.stacks === 2) ctx.removeEffect(self.unitId, self.effect);
      },
    },
  },
  {
    // Stables: a warband with a unit bred there moves farther on the map. No battle effect.
    id: "stables",
    quiet: true,
    name: "Stable-bred",
    describe: (e) => `Its warband has +${e.amount} movement on the map; doesn't add up with others.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    mapMovement: 1,
    hooks: {},
  },
  {
    // Bell tower: a city's defenders heard them coming, and act first in the first round.
    id: "forewarned",
    quiet: true,
    name: "Forewarned",
    describe: () => "Acts before the enemy in the first round (the city's bells rang).",
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: { precedes: (ctx) => ctx.battle.round === 1 },
  },
  // A bought unit-type upgrade (placeholder content until the user designs unique ones).
  flatStat({ id: "extra_damage", quiet: true, name: "Extra damage", stat: "hitBonus", stacking: { mode: "merge" }, describe: (e) => `+${e.amount} damage.` }),
  {
    // Defenders in a city (a garrison, or a warband in its own city) have nowhere to run.
    id: "cornered",
    quiet: true,
    name: "Cornered",
    describe: () => "Defending a city: nowhere to retreat to.",
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      restrict: (ctx, self, subjectId, allowed) => {
        if (subjectId !== self.unitId) return;
        for (const id of [...allowed]) if (ctx.hasTag(id, "flee")) allowed.delete(id);
      },
    },
  },
  // A spell on a city (provisional Break walls): its defenders fight with less armor.
  flatStat({ id: "sundered", name: "Sundered", stat: "armor", sign: -1, stacking: { mode: "unique" }, describe: (e) => `−${e.amount} armor.` }),
  {
    // An ability carried from elsewhere (an item's Hatchet, a Cathedral's holy water), with its own params: one
    // effect for every ability-granting item and node. Several can sit on one unit.
    id: "carries",
    quiet: true,
    name: "Carries",
    describe: () => "Carries an extra ability, listed with the unit's own.",
    stacking: { mode: "each" },
    lifetime: "battle",
    visibility: "public",
    hooks: { grants: (_ctx, self, subjectId) => (subjectId === self.unitId && self.effect?.ability ? [self.effect.ability] : []) },
  },
  {
    // A worn Outlaw's pocketwatch (user, 2026-09-27): every attack hits harder, and harder still against a shield.
    id: "pocketwatch",
    quiet: true,
    name: "Outlaw's pocketwatch",
    describe: (e) => `Attacks deal +${e.amount}, and +${e.amount * 2} more against a target that still has shield.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      outgoing: (ctx, self, packet) => {
        if (!packet.tags.includes("attack") || !self.effect) return;
        packet.amount += self.effect.amount;
        if (ctx.unit(packet.target).shield > 0) packet.amount += 2 * self.effect.amount;
      },
    },
  },
  // Worn items (headgear, armor): extra armor.
  flatStat({ id: "extra_armor", quiet: true, name: "Extra armor", stat: "armor", stacking: { mode: "merge" }, describe: (e) => `+${e.amount} armor.` }),
  // Worn items (charms): extra initiative.
  flatStat({ id: "extra_initiative", quiet: true, name: "Extra initiative", stat: "initiative", stacking: { mode: "merge" }, describe: (e) => `+${e.amount} initiative.` }),
  // A city's walls: its garrison, and a warband defending in its own city, stand behind them (city tiers).
  flatStat({ id: "fortified", quiet: true, name: "Fortified", stat: "armor", stacking: { mode: "unique" }, describe: (e) => `+${e.amount} armor, defending a city.` }),
  {
    // Levels past the end of a line (pillars.md): a share of the base stat, so higher tiers gain more per level.
    id: "veteran",
    quiet: true,
    name: "Veteran",
    describe: (e) => `+${e.amount}% of its base max HP and ability power.`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (ctx, self, subjectId, stats) => {
        if (subjectId !== self.unitId) return;
        const base = ctx.unit(subjectId).base;
        const share = (self.effect?.amount ?? 0) / 100;
        stats.maxHp += Math.round(base.maxHp * share);
        stats.abilityPower += Math.round(base.abilityPower * share);
      },
    },
  },
  {
    // From the leader tree: the leader's own extra health.
    id: "extra_health",
    quiet: true,
    name: "Extra health",
    describe: (e) => `+${e.amount}% of its base max HP.`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      // Percentages add a share of the base stat, so they don't depend on the order hooks run in.
      stats: (ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId) stats.maxHp += Math.round((ctx.unit(subjectId).base.maxHp * (self.effect?.amount ?? 0)) / 100);
      },
    },
  },
  {
    // From the leader tree: while the leader stands, its allies hit harder.
    id: "leader_aura",
    quiet: true,
    name: "Leader's aura",
    describe: (e) => `While this leader stands, its side's units deal ${e.amount}% more damage.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (ctx, self, subjectId, stats) => {
        const subject = ctx.unit(subjectId);
        if (subject.side === ctx.unit(self.unitId).side) stats.hitPercent += self.effect?.amount ?? 0;
      },
    },
  },
];
