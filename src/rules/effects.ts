import { PUNISHMENT_MAX_STACKS } from "#rules/balance";
import type { EffectDef, EffectInstance, Stacking, Stats } from "#rules/battle/types";

/** Punishment's per-stack penalty to damage and initiative. */
export const PUNISHED_PER_STACK = 10;
/** Mutate's per-stack damage bonus. */
export const MUTATED_PER_STACK = 10;
/** What the AI thinks a goaded healer or caster is worth to the other side: about one heal (provisional #63). */
const GOADED_AI_VALUE = 25;

/**
 * An effect that adds its `amount` (or with `sign` -1, takes it away) to one stat of its bearer for the battle: the
 * shape of most world-made bonuses (items, upgrades, walls, spells).
 */
function flatStat(def: {
  readonly id: string;
  readonly name: string;
  readonly stat: keyof Stats;
  readonly sign?: 1 | -1;
  readonly stacking: Stacking;
  readonly quiet?: boolean;
  describe(effect: EffectInstance): string;
}): EffectDef {
  const sign = def.sign ?? 1;
  return {
    id: def.id,
    name: def.name,
    describe: def.describe,
    stacking: def.stacking,
    lifetime: "battle",
    visibility: "public",
    ...(def.quiet ? { quiet: true } : {}),
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId) stats[def.stat] += sign * (self.effect?.amount ?? 0);
      },
    },
  };
}

/**
 * Effect definitions. An effect on a unit is plain data (`EffectInstance`); what it does lives here as hooks.
 * The engine never checks for a particular effect.
 */
const effects: readonly EffectDef[] = [
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
    id: "punished",
    name: "Punished",
    describe: (e) => `−${PUNISHED_PER_STACK * e.stacks} damage and −${PUNISHED_PER_STACK * e.stacks} initiative for the rest of combat (at most ${PUNISHMENT_MAX_STACKS} stacks).`,
    stacking: { mode: "merge", cap: PUNISHMENT_MAX_STACKS },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId !== self.unitId || !self.effect) return;
        stats.damage -= PUNISHED_PER_STACK * self.effect.stacks;
        stats.initiative -= PUNISHED_PER_STACK * self.effect.stacks;
      },
    },
  },
  {
    id: "bleeding",
    name: "Bleeding",
    describe: (e) => `Loses ${e.amount} HP at the start of each of its turns.`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      turnStart: (ctx, self) => {
        ctx.lose(self.unitId, self.effect?.amount ?? 0, null);
        return null;
      },
    },
  },
  {
    id: "deathward",
    quiet: true,
    name: "Spared by death",
    describe: () => "Cannot drop below 1 HP until the round ends.",
    stacking: { mode: "unique" },
    lifetime: "untilRoundEnd",
    visibility: "public",
    hooks: { preventDeath: () => true },
  },
  {
    // A Justiciar's Counter; a Backlasher's Backlash also hurts the unit it cancels (`amount`).
    id: "countered",
    name: "Countered",
    describe: (e) => `The next ability it uses will be cancelled${e.amount > 0 ? `, and the backlash deals ${e.amount} to it` : ""}.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "secret",
    hooks: {
      beforeAbility: (ctx, self) => {
        const mark = self.effect;
        if (!mark) return "cancel";
        ctx.removeEffect(self.unitId, mark);
        if (mark.amount > 0) ctx.hit(mark.source ?? self.unitId, [self.unitId], { power: mark.amount, type: "weapon", tags: ["spell", "damage"] });
        return "cancel";
      },
      aiValue: (ctx, self) => -2 * ctx.unit(self.unitId).base.damage - (self.effect?.amount ?? 0),
    },
  },
  {
    // An Etherborn's Negate: the next damage or healing to reach it is turned around, once.
    id: "negated",
    name: "Negated",
    describe: () => "The next damage it would take heals it instead, and the next healing it would get (shields too) hurts it instead. Once.",
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "secret",
    hooks: {
      // Before armor and shields: the whole hit turns into healing.
      incoming: (ctx, self, packet) => {
        const mark = self.effect;
        if (!mark || packet.amount <= 0) return;
        const amount = packet.amount;
        packet.amount = 0;
        ctx.removeEffect(self.unitId, mark);
        ctx.heal(self.unitId, amount);
      },
      healing: (ctx, self, heal) => {
        const mark = self.effect;
        if (!mark || heal.amount <= 0) return;
        const amount = heal.amount;
        heal.amount = 0;
        ctx.removeEffect(self.unitId, mark);
        if (heal.pool === "hp") ctx.lose(self.unitId, amount, mark.source);
        else {
          const unit = ctx.unit(self.unitId);
          const drained = Math.min(amount, unit.shield);
          unit.shield -= drained;
          if (drained > 0) ctx.emit({ type: "shieldHit", unitId: unit.id, amount: drained });
        }
      },
      // Mostly a unit expects to be hit rather than healed: the next enemy hit swings from a loss to a gain.
      aiValue: (ctx, self) => {
        const bearer = ctx.unit(self.unitId);
        const enemies = ctx.living(bearer.side === 0 ? 1 : 0);
        const hit = enemies.reduce((sum, u) => sum + ctx.stats(u.id).damage, 0) / Math.max(1, enemies.length);
        return 2 * hit;
      },
    },
  },
  {
    // An Etherborn's Absorb on an enemy: its next hit is weaker, and the Etherborn drinks what was held back.
    id: "absorbing_hit",
    name: "Absorbed (its next hit)",
    describe: (e) => `Its next hit deals ${e.amount} less; whoever absorbed it heals by what was prevented.`,
    stacking: { mode: "perSource" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      outgoing: (ctx, self, packet) => {
        const mark = self.effect;
        if (!mark || packet.amount <= 0 || !packet.tags.includes("damage")) return;
        const prevented = Math.min(mark.amount, packet.amount);
        packet.amount -= prevented;
        ctx.removeEffect(self.unitId, mark);
        if (mark.source) ctx.heal(mark.source, prevented);
      },
      aiValue: (_ctx, self) => -(self.effect?.amount ?? 0),
    },
  },
  {
    // An Etherborn's Absorb on an ally: the next hit on it is softened, and the Etherborn drinks what was held back.
    id: "absorbing_guard",
    name: "Absorbed (next hit on it)",
    describe: (e) => `The next hit on it deals ${e.amount} less; whoever absorbed it heals by what was prevented.`,
    stacking: { mode: "perSource" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      incoming: (ctx, self, packet) => {
        const mark = self.effect;
        if (!mark || packet.amount <= 0) return;
        const prevented = Math.min(mark.amount, packet.amount);
        packet.amount -= prevented;
        ctx.removeEffect(self.unitId, mark);
        if (mark.source) ctx.heal(mark.source, prevented);
      },
      aiValue: (_ctx, self) => self.effect?.amount ?? 0,
    },
  },
  {
    // A Maelstrom's Combustion: for the rest of this turn its spells don't take its action.
    id: "combusting",
    name: "Combusting",
    describe: () => "Its spells that cost charges are free actions until its turn ends.",
    stacking: { mode: "unique" },
    lifetime: "untilTurnEnd",
    visibility: "public",
    hooks: {
      castsFree: () => true,
      // Each charge it can still spend this turn is a spell that doesn't cost its action.
      aiValue: (ctx, self) => 30 * Math.min(2, ctx.unit(self.unitId).spellCharges),
    },
  },
  {
    // Shield lent by a Cyclops. It sits in the bearer's shield pool; on expiry whatever is left of it goes.
    id: "lent_shield",
    quiet: true,
    name: "Lent shield",
    describe: (e) => `${e.amount} shield lent by a Cyclops; it perishes when the Cyclops's next turn starts.`,
    stacking: { mode: "perSource" },
    lifetime: "untilSourceTurn",
    visibility: "public",
    hooks: {},
    onExpire: (ctx, self) => {
      const holder = ctx.unit(self.unitId);
      const lost = Math.min(self.effect?.amount ?? 0, holder.shield);
      if (lost <= 0) return;
      holder.shield -= lost;
      ctx.emit({ type: "shieldHit", unitId: holder.id, amount: lost });
    },
  },
  {
    id: "mutated",
    name: "Mutated",
    describe: (e) => `+${MUTATED_PER_STACK * e.stacks} damage for the rest of combat.`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId && self.effect) stats.damage += MUTATED_PER_STACK * self.effect.stacks;
      },
      aiValue: (_ctx, self) => 15 * (self.effect?.stacks ?? 0),
    },
  },
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
  {
    // Context from the world: the side owns a Blacksmith node. Its damaging abilities hit harder.
    id: "blacksmith",
    quiet: true,
    name: "Blacksmith",
    describe: (e) => `Damaging abilities deal +${e.amount} (from a Blacksmith this side holds).`,
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
    describe: (e) => `+${e.amount} shield; ${Math.round(e.amount / 3)} of it mends at the start of each of its turns (from a Foundry).`,
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
    describe: (e) => `Heals ${e.amount}% of the damage it deals (from Leech pits).`,
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
    describe: (e) => `The first hit to reach it in a battle deals ${e.amount} less (from a Tannery).`,
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
    describe: () => "Its first attack against a city's defenders ignores their fortification (from a Siege workshop).",
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      outgoing: (ctx, self, packet) => {
        const trained = self.effect;
        if (!trained || !packet.tags.includes("attack")) return;
        const walls = ctx.unit(packet.target).effects.find((e) => (EFFECTS.get(e.def)?.fortifies ?? false));
        if (!walls) return;
        packet.amount += walls.amount;
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
    describe: (e) => `Its warband has +${e.amount} movement on the map (from Stables; doesn't add up with others).`,
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
  // The Grove (user's design, 2026-09-29; numbers provisional #57).
  {
    // Decay: damage that rotted in instead of landing, lost evenly over the bearer's next turns (`stacks` of them).
    id: "rotting",
    name: "Rotting",
    describe: (e) => `${e.amount} damage rots in it, lost over its next ${e.stacks} turn${e.stacks === 1 ? "" : "s"}.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      turnStart: (ctx, self) => {
        const rot = self.effect;
        if (!rot || rot.amount <= 0) return null;
        const tick = Math.ceil(rot.amount / Math.max(1, rot.stacks));
        rot.amount -= tick;
        rot.stacks = Math.max(1, rot.stacks - 1);
        ctx.lose(self.unitId, tick, null);
        if (rot.amount <= 0) ctx.removeEffect(self.unitId, rot);
        return null;
      },
    },
  },
  {
    // Corpse explosion: a fungal infestation, damage at the start of each of the bearer's turns while it lasts.
    id: "infested",
    name: "Infested",
    describe: (e) => `Loses ${e.amount} HP at the start of each of its next ${e.stacks} turn${e.stacks === 1 ? "" : "s"} (a fungal infestation).`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      turnStart: (ctx, self) => {
        const infestation = self.effect;
        if (!infestation) return null;
        ctx.lose(self.unitId, infestation.amount, infestation.source);
        infestation.stacks -= 1;
        if (infestation.stacks <= 0) ctx.removeEffect(self.unitId, infestation);
        return null;
      },
    },
  },
  {
    // Cycle on an enemy: part of the damage heals back at the start of its next turn.
    id: "healing_back",
    name: "Healing back",
    describe: (e) => `Heals ${e.amount} at the start of its next turn.`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      turnStart: (ctx, self) => {
        if (self.effect) {
          ctx.heal(self.unitId, self.effect.amount);
          ctx.removeEffect(self.unitId, self.effect);
        }
        return null;
      },
    },
  },
  {
    // Spiritwalk (user, 2026-09-29): off the field, invulnerable because untargetable, unable to act; it comes
    // back healed. Double-edged: on an enemy it's a banish that heals them; on an ally, a rescue that benches them.
    id: "spiritwalking",
    name: "Spiritwalking",
    describe: (e) => `Walks among the spirits: not on the field, can't act or be hit. Returns in ${e.stacks} round${e.stacks === 1 ? "" : "s"}, healed ${e.amount}% of its max HP.`,
    stacking: { mode: "unique" },
    lifetime: "rounds",
    visibility: "public",
    absent: true,
    hooks: {},
    onExpire: (ctx, self) => ctx.heal(self.unitId, Math.round((ctx.stats(self.unitId).maxHp * (self.effect?.amount ?? 0)) / 100)),
  },
  flatStat({ id: "gorged", name: "Gorged", stat: "damage", stacking: { mode: "merge" }, describe: (e) => `Deals ${e.amount} more damage (fed on the dead).` }),
  flatStat({ id: "withered", name: "Withered", stat: "damage", sign: -1, stacking: { mode: "unique" }, describe: (e) => `Deals ${e.amount} less damage (withered by a Decay unit).` }),
  {
    // Mend: heals at the start of each of the bearer's turns while it lasts (`stacks` turns).
    id: "mending",
    name: "Mending",
    describe: (e) => `Regrows ${e.amount} HP at the start of each of its next ${e.stacks} turn${e.stacks === 1 ? "" : "s"}.`,
    // One per healer: HoTs from different units run side by side (and a Burst mend consumes them all).
    stacking: { mode: "perSource" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      turnStart: (ctx, self) => {
        const mend = self.effect;
        if (!mend) return null;
        ctx.heal(self.unitId, mend.amount);
        mend.stacks -= 1;
        if (mend.stacks <= 0) ctx.removeEffect(self.unitId, mend);
        return null;
      },
    },
  },
  // A bought unit-type upgrade (placeholder content until the user designs unique ones).
  flatStat({ id: "extra_damage", quiet: true, name: "Extra damage", stat: "damage", stacking: { mode: "merge" }, describe: (e) => `+${e.amount} damage.` }),
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
  flatStat({ id: "sundered", name: "Sundered", stat: "armor", sign: -1, stacking: { mode: "unique" }, describe: (e) => `−${e.amount} armor: its city's walls are broken.` }),
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
  { ...flatStat({ id: "fortified", quiet: true, name: "Fortified", stat: "armor", stacking: { mode: "unique" }, describe: (e) => `+${e.amount} armor, defending a city.` }), fortifies: true },
  {
    // Levels past the end of a line (pillars.md): a share of the base stat, so higher tiers gain more per level.
    id: "veteran",
    quiet: true,
    name: "Veteran",
    describe: (e) => `+${e.amount}% of its base max HP and damage.`,
    stacking: { mode: "merge" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (ctx, self, subjectId, stats) => {
        if (subjectId !== self.unitId) return;
        const base = ctx.unit(subjectId).base;
        const share = (self.effect?.amount ?? 0) / 100;
        stats.maxHp += Math.round(base.maxHp * share);
        stats.damage += Math.round(base.damage * share);
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
    describe: (e) => `While this leader stands, its side's units deal +${e.amount}% of their base damage.`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (ctx, self, subjectId, stats) => {
        const subject = ctx.unit(subjectId);
        if (subject.side === ctx.unit(self.unitId).side) stats.damage += Math.round((subject.base.damage * (self.effect?.amount ?? 0)) / 100);
      },
    },
  },
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
        return denied && ids.some((id) => ctx.hasTag(id, "attack")) ? -GOADED_AI_VALUE : 0;
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
      aiValue: (ctx, self) => -ctx.stats(self.unitId).damage,
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
    // A Chrysalis that has emerged: it hits harder and flies.
    id: "emerged",
    name: "Emerged",
    describe: (e) => `Emerged from its cocoon: +${e.amount} damage, and it flies (Flit).`,
    stacking: { mode: "unique" },
    lifetime: "battle",
    visibility: "public",
    hooks: {
      stats: (_ctx, self, subjectId, stats) => {
        if (subjectId === self.unitId) stats.damage += self.effect?.amount ?? 0;
      },
      grants: (_ctx, self, subjectId) => (subjectId === self.unitId ? [{ id: "flit" }] : []),
    },
  },
  {
    // An Eyespot's or the Pale Mother's gaze: the bearer loses its next turn, unless it's hurt first.
    id: "mesmerized",
    name: "Mesmerized",
    describe: () => "Loses its next turn, unless it is hurt before then.",
    stacking: { mode: "unique" },
    lifetime: "untilOwnTurn",
    visibility: "public",
    hooks: {
      turnStart: () => "skip",
      incoming: (ctx, self, packet) => {
        if (packet.amount > 0 && self.effect) ctx.removeEffect(self.unitId, self.effect);
      },
      aiValue: (ctx, self) => -ctx.stats(self.unitId).damage,
    },
  },
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
        if (subjectId !== self.unitId && ctx.unit(subjectId).side === ctx.unit(self.unitId).side) stats.damage += self.effect?.amount ?? 0;
      },
    },
  },
];

export const EFFECTS: ReadonlyMap<string, EffectDef> = new Map(effects.map((e) => [e.id, e]));

export function effectDef(id: string): EffectDef {
  const found = EFFECTS.get(id);
  if (!found) throw new Error(`unknown effect: ${id}`);
  return found;
}
