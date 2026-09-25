import { paramsOf } from "#rules/abilities/index";
import { PUNISHMENT_MAX_STACKS } from "#rules/balance";
import type { AbilityRef, EffectInstance, Params } from "#rules/battle/types";
import { effectDef } from "#rules/effects";

const uses = (p: Params) => (p["charges"] === 1 ? "Once per combat" : `${p["charges"]} uses per combat`);

/** Rules text shown in the UI, written from each ability's params. Mirrors the design docs; change both together. */
const ABILITY_TEXT: Readonly<Record<string, (params: Params) => string>> = {
  attack: () => "Strike an enemy in the front line, at most one column away.",
  defend: () => "End the turn. Damage taken is halved until this unit acts again.",
  wait: () => "Act again at the end of this pass.",
  flail: () => "One swing hits the entire enemy front line.",
  congregation: (p) => `+${p["bonus"]} damage for each other Congregant in the squad.`,
  lay_on_hands: (p) =>
    p["allies"]
      ? `${uses(p)}. Heal for ${p["multiplier"]}× this unit's damage: self as a free action, an ally as the main action.`
      : `Free action, ${uses(p).toLowerCase()}: heal self for ${p["multiplier"]}× this unit's damage.`,
  devotion_aura: (p) => `Adjacent allies gain +${p["armor"]} armor.`,
  guardian_spirit: () => "Once per combat, a killing blow leaves this unit at 1 HP, and it cannot die until the round ends.",
  must_attack: () => "Must attack every turn: cannot defend, wait, or use other abilities.",
  zeal: () => "Each attack costs half of this unit's damage in health.",
  fanaticism: () => "Takes self-damage equal to half the damage it deals.",
  hysteria: () => "A kill grants a free extra attack at double self-damage, up to twice per turn.",
  fanaticism_aura: () => "Every unit on the battlefield suffers Fanaticism and Hysteria, and nobody can defend.",
  punishment: () => `Every enemy struck loses 10 damage and 10 initiative for the rest of combat. Stacks up to ${PUNISHMENT_MAX_STACKS} times.`,
  domination: () => "Half of this unit's damage becomes bleed, which strikes at the start of the victim's turns.",
  hook: () => "Once per combat: pull the first enemy behind an empty front tile into the front row and stun it.",
  shoot: () => "Ranged: hit any enemy.",
  bolt: () => "Very weak ranged hit on any enemy. Unlimited.",
  area_2x2: () => "Ranged spell: hits every enemy in a 2x2 block.",
  plus_burst: (p) => `${uses(p)}: a burst of ${p["power"]} hitting every enemy in a plus shape.`,
  stun_front: () => "Once per combat: stun the enemy directly in front for one turn.",
  anti_armor: (p) => `+${p["bonus"]} damage against targets that have armor.`,
  restore_shield: (p) => `Restore ${p["amount"]} of an ally's shield. Healing can't restore shields.`,
  negate: () => "Free action, once per combat: secretly mark an enemy; the next ability it uses is cancelled.",
  homing_lightning: (p) => `${uses(p)}: lightning (${p["power"]}) strikes every unit with the target's name, friend and foe alike.`,
  equalize: () => "Share shield with an ally until both are equal. The lent shield perishes when this unit's next turn starts.",
  mutate: () => "If its shield is restored while already full, it gains +10 damage for the rest of combat.",
};

export function abilityText(ref: AbilityRef): string {
  return ABILITY_TEXT[ref.id]?.(paramsOf(ref)) ?? "";
}

/** What an effect does, from its own numbers; shown when hovering it on a unit card. */
const EFFECT_TEXT: Readonly<Record<string, (effect: EffectInstance) => string>> = {
  defending: () => "Damage that gets past its shield is halved until this unit's next turn.",
  stunned: () => "Loses its next turn.",
  punished: (e) => `−${10 * e.stacks} damage and −${10 * e.stacks} initiative for the rest of combat (at most ${PUNISHMENT_MAX_STACKS} stacks).`,
  bleeding: (e) => `Loses ${e.amount} HP at the start of each of its turns.`,
  deathward: () => "Cannot drop below 1 HP until the round ends.",
  negated: () => "The next ability it uses will be cancelled.",
  lent_shield: (e) => `${e.amount} shield lent by a Battery; it perishes when the Battery's next turn starts.`,
  mutated: (e) => `+${10 * e.stacks} damage for the rest of combat.`,
  fire_shield: (e) => `Absorbs the next ${e.amount} fire damage.`,
  blacksmith: (e) => `Damaging abilities deal +${e.amount} (from a Blacksmith this side holds).`,
};

export function effectText(effect: EffectInstance): string {
  return EFFECT_TEXT[effect.def]?.(effect) ?? "";
}

export function effectName(id: string): string {
  return effectDef(id).name;
}

export function effectLabel(effect: EffectInstance): string {
  const stacks = effect.stacks > 1 ? ` ×${effect.stacks}` : "";
  const amount = effect.amount > 0 ? ` ${effect.amount}` : "";
  return `${effectName(effect.def)}${stacks}${amount}`;
}
