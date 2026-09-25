# Abilities

> Provenance: intent inferred by Claude from the old code's shape; confirmed only as "modular, not one ability per unit". Ability *content* in the old code (e.g. Aura of the Scarlet Banner, holy_strike, units.json/abilities.json) was invented by an AI and is not design.

The shape of the C# attempt's ability system (its first commit and later refinements), which the user described as modular.

## Intent
- **A unit is a set of abilities**, not D2's fixed "attack1 / attack2" slots. Any number of them, within reason.
- Abilities are **modular and reusable**: the same ability can appear on many units, and units are mostly assembled from them. "Congregation", "Lay on Hands", "Devotion Aura" are parts, not unit-specific code.
- **The ability set changes at runtime.** Evolution adds or replaces abilities. Items, leader upgrades, and effects can grant them. Old unit records had both `starting_abilities` and `potential_abilities` (learnable later, gated by level).
- Two activations:
  - **Active**: chosen by the player on the unit's turn. It has targeting, and may be a *main action* (uses the turn) or a *free action* (usable alongside the main action). It may have charges per combat ("once per combat").
  - **Passive**: never chosen. It reacts to combat moments (battle start, turn start, on hit, on kill, would-die, …) or changes rules or stats while present.
- **Simple abilities are data; complex ones are code.** Common shapes (damage + apply effect, heal, stat aura) are configured by parameters. Unusual ones (Hook, Guardian Spirit, Fanaticism Aura) get their own implementation. Both plug in the same way.
- **Effects are separate from abilities.** Poison, stun, bleed, and Punishment are effects. Abilities are one source of effects; spells, items, and cities are others.
- The user removed classification enums (`AbilityType: attack/defense/buff`, `TargetType`) in the old code: the behavior *is* the classification. Don't reintroduce them.

## What the Jilliath melee line needs from the model
The spec (`units/jilliath-melee-line.md`) is a good test that the model is expressive enough:

| Ability | Kind | What it needs |
|---|---|---|
| Congregation | passive | stat bonus derived from squadmates |
| Lay on Hands / Divine | active, free (self) or main (ally) | charges per combat, target choice changes the action cost |
| Zealot self-damage / Fanaticism | passive | reacts to own damage dealt |
| Must attack, cannot defend | passive | restricts which actions are available |
| Punisher flail | active | hits a shape (whole front row), not one target |
| Punishment | passive | on hit: permanent stacking debuff |
| Domination | passive | converts part of the damage into a bleed effect |
| Hook | active, main | line-of-path targeting, moves a unit between rows, applies stun |
| Hysteria | passive | on kill: extra attack with escalating self-damage |
| Devotion Aura | passive | stat bonus to adjacent allies |
| Guardian Spirit | passive | once per combat: prevents death until end of turn |
| Fanaticism Aura | passive | changes rules for every unit on the battlefield |

## Shape in this codebase (plan for M1)
- An ability is a record `{ id, params }` on the unit, plus per-combat state such as charges used. A registry maps `id` to its behavior.
- Behaviors are pure functions in `src/rules/`. They contribute to named points in the rules: `availableActions`, `targets`, `resolve`, `modifyStats`, `onHit`, `onKill`, `beforeDeath`, `onTurnStart`, …. A behavior implements only the points it needs.
- **The basic attack is an ability too.** Attack, defend, and wait are the default kit. Restrictions like "must attack" are passives that filter available actions.
- Add a hook point when a real ability needs it, not in advance.
