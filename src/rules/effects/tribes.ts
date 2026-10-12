import type { EffectDef } from "#rules/battle/types";
import { STAT_WORTH, flatStat, weakened } from "#rules/effects/shared";

/** What a frenzied unit takes extra from each hit (the Goblin Hexer's Frenzy, `abilities/tusk.ts`). */
export const FRENZY_TAKEN = 5;

/**
 * The effects of the five tribes Claude pitched on 2026-10-11 (`abilities/{wild,tusk,scaled,herd,clans}.ts`). Every
 * number is provisional (#81). Each one the AI should weigh has an `aiValue`.
 */
export const TRIBE_EFFECTS: readonly EffectDef[] = [
  // The Wild.
  {
    // A Boar's tusks: bleeds at the start of each of its turns; more gores add up.
    id: "gored",
    name: "Gored",
    describe: (e) => `Bleeds ${e.amount} at the start of each of its turns.`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      turnStart: (ctx, self) => {
        ctx.lose(self.unitId, self.effect?.amount ?? 0, self.effect?.source ?? null);
        return null;
      },
      aiValue: (_ctx, self) => -(self.effect?.amount ?? 0) * 3,
    },
  },
  weakened("pecked", "Pecked"),
  {
    // Old Grey's howl: the bearer's next hit bites deeper, then it's spent.
    id: "howled",
    name: "Howled",
    describe: (e) => `Its next hit deals ${e.amount} more.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      outgoing: (ctx, self, packet) => {
        if (packet.source !== self.unitId || packet.amount <= 0 || !self.effect) return;
        packet.amount += self.effect.amount;
        ctx.removeEffect(self.unitId, self.effect);
      },
      aiValue: (_ctx, self) => (self.effect?.amount ?? 0) * STAT_WORTH.hitBonus,
    },
  },
  // The Tuskclans.
  flatStat({ id: "bloodlusted", name: "Bloodlust", stat: "hitBonus", stacking: { mode: "merge" }, describe: (e) => `+${e.amount} damage for the rest of the battle (its kills feed it).` }),
  {
    // A troll touched by fire: its next regeneration fails.
    id: "seared",
    name: "Seared",
    describe: () => "Fire has touched it: it won't regenerate at the start of its next turn.",
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: { aiValue: (ctx, self) => -(ctx.stats(self.unitId).maxHp * 12) / 100 },
  },
  {
    // A Goblin Hexer's frenzy: more damage dealt and taken until the end of the next round.
    id: "frenzied",
    name: "Frenzied",
    describe: (e) => `Deals ${e.amount} more damage and takes ${FRENZY_TAKEN} more, for ${e.stacks} more round start${e.stacks === 1 ? "" : "s"}.`,
    stacking: { mode: "perSource" },
    lifetime: "rounds",
    visibility: "public",
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId) stats.hitBonus += self.effect?.amount ?? 0;
      },
      incoming: (_ctx, self, packet) => {
        if (packet.target === self.unitId && packet.amount > 0) packet.amount += FRENZY_TAKEN;
      },
      aiValue: (_ctx, self) => ((self.effect?.amount ?? 0) - FRENZY_TAKEN) * STAT_WORTH.hitBonus,
    },
  },
  // The Scaled.
  {
    // Venom: loses health at the start of each turn, and heals only half.
    id: "envenomed",
    name: "Envenomed",
    describe: (e) => `Loses ${e.amount} at the start of each of its turns, and heals only half.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      turnStart: (ctx, self) => {
        ctx.lose(self.unitId, self.effect?.amount ?? 0, self.effect?.source ?? null);
        return null;
      },
      healing: (_ctx, _self, heal) => {
        if (heal.pool === "hp") heal.amount = Math.floor(heal.amount / 2);
      },
      aiValue: (_ctx, self) => -(self.effect?.amount ?? 0) * 3 - 10,
    },
  },
  {
    // A naga's coils: no turns until the naga's next turn, when it must squeeze again.
    id: "constricted",
    name: "Constricted",
    describe: () => "Held in a naga's coils: it loses its turns until the naga's next turn.",
    stacking: { mode: "unique" },
    lifetime: "untilSourceTurn",
    visibility: "public",
    hooks: { turnStart: () => "skip", aiValue: (ctx, self) => -ctx.strongestHit(self.unitId) },
  },
  {
    // The medusa's gaze: stone until its next turn, which it loses; half damage meanwhile.
    id: "petrified",
    name: "Stone",
    describe: () => "Turned to stone: it loses its next turn, and takes half damage until then.",
    stacking: { mode: "unique" },
    lifetime: "untilOwnTurn",
    visibility: "public",
    hooks: {
      turnStart: () => "skip",
      mitigate: (_ctx, _self, packet) => {
        if (packet.amount > 0) packet.amount = Math.max(1, Math.floor(packet.amount / 2));
      },
      aiValue: (ctx, self) => -ctx.strongestHit(self.unitId) + 10,
    },
  },
  // The Herd.
  {
    // A Starseer's warning: the next hit on the bearer misses.
    id: "starwarned",
    name: "Warned by the stars",
    describe: () => "The next hit on it misses entirely.",
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      incoming: (ctx, self, packet) => {
        if (packet.target !== self.unitId || packet.amount <= 0 || !packet.source || !self.effect) return;
        packet.amount = 0;
        ctx.removeEffect(self.unitId, self.effect);
      },
      aiValue: () => 25,
    },
  },
  // The barbarian clans.
  flatStat({ id: "last_stand", name: "Last stand", stat: "hitBonus", stacking: { mode: "unique" }, describe: (e) => `Refused to die: +${e.amount} damage for the rest of the battle.` }),
  {
    // An Axe-maiden's axe: less armor until the end of the next round.
    id: "split_armor",
    name: "Split armor",
    describe: (e) => `−${e.amount} armor, for ${e.stacks} more round start${e.stacks === 1 ? "" : "s"}.`,
    stacking: { mode: "unique" },
    lifetime: "rounds",
    visibility: "public",
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId) stats.armor -= self.effect?.amount ?? 0;
      },
      aiValue: (ctx, self) => -Math.min(self.effect?.amount ?? 0, ctx.stats(self.unitId).armor + (self.effect?.amount ?? 0)) * STAT_WORTH.armor,
    },
  },
  {
    // A Shamaness's blood oath: more damage while she lives, and half of each wound goes to her.
    id: "oathbound",
    name: "Blood oath",
    describe: (e) => `Bound to a shamaness: deals ${e.amount} more, and half of every wound it takes goes to her, while she lives.`,
    stacking: { mode: "perSource" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (ctx, self, subjectId, stats) => {
        const source = self.effect?.source;
        if (subjectId === self.unitId && source && ctx.unit(source).alive) stats.hitBonus += self.effect?.amount ?? 0;
      },
      mitigate: (ctx, self, packet) => {
        const source = self.effect?.source;
        if (packet.target !== self.unitId || packet.amount <= 1 || !source || !ctx.unit(source).alive) return;
        const shared = Math.floor(packet.amount / 2);
        packet.amount -= shared;
        ctx.lose(source, shared, packet.source);
      },
      aiValue: (ctx, self) => (self.effect?.source && ctx.unit(self.effect.source).alive ? (self.effect.amount ?? 0) * STAT_WORTH.hitBonus + 10 : 0),
    },
  },
  {
    // A Warlord's war cry: more damage until the end of the next round.
    id: "war_cried",
    name: "War cry",
    describe: (e) => `Deals ${e.amount} more, for ${e.stacks} more round start${e.stacks === 1 ? "" : "s"}.`,
    stacking: { mode: "unique" },
    lifetime: "rounds",
    visibility: "public",
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId) stats.hitBonus += self.effect?.amount ?? 0;
      },
      aiValue: (_ctx, self) => (self.effect?.amount ?? 0) * STAT_WORTH.hitBonus,
    },
  },
];
