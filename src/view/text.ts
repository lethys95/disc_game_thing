import type { Effect } from "#rules/types";

/** Rules text shown in the UI. Mirrors docs/design/units/jilliath-melee-line.md; change both together. */
export const ABILITY_TEXT: Readonly<Record<string, string>> = {
  attack: "Strike an enemy in the front line, at most one column away.",
  defend: "End the turn. Damage taken is halved until this unit acts again.",
  wait: "Act again at the end of this pass.",
  flail: "One swing hits the entire enemy front line.",
  congregation: "+10 damage for each other Congregant in the squad.",
  lay_on_hands: "Free action, once per combat: heal self for twice this unit's damage.",
  divine_lay_on_hands: "Two charges per combat. Heal for twice this unit's damage: self as a free action, an ally as the main action.",
  devotion_aura: "Adjacent allies gain +20 armor.",
  guardian_spirit: "Once per combat, a killing blow leaves this unit at 1 HP, and it cannot die until the round ends.",
  must_attack: "Must attack every turn: cannot defend, wait, or use other abilities.",
  zeal: "Each attack costs half of this unit's damage in health.",
  fanaticism: "Takes self-damage equal to half the damage it deals.",
  hysteria: "A kill grants a free extra attack at double self-damage, up to twice per turn.",
  fanaticism_aura: "Every unit on the battlefield suffers Fanaticism and Hysteria, and nobody can defend.",
  punishment: "Every enemy struck loses 10 damage and 10 initiative for the rest of combat. Stacks.",
  domination: "Half of this unit's damage becomes bleed, which strikes at the start of the victim's turns.",
  hook: "Once per combat: pull the first enemy behind an empty front tile into the front row and stun it.",
};

export const EFFECT_TEXT: Readonly<Record<Effect["kind"], string>> = {
  defending: "Defending",
  stunned: "Stunned",
  punished: "Punished",
  bleeding: "Bleeding",
  deathward: "Spared by death",
};

export function effectLabel(effect: Effect): string {
  switch (effect.kind) {
    case "punished":
      return `Punished ×${effect.stacks}`;
    case "bleeding":
      return `Bleeding ${effect.perTurn}/turn`;
    default:
      return EFFECT_TEXT[effect.kind];
  }
}
