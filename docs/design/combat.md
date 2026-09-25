# Combat

What's decided, and what isn't. Anything under "Open" is a question for the user — don't invent an answer; pick a provisional rule, mark it provisional in code/data, and log it in `../questions.md`.

## Decided
- Two sides, each a squad on a 3x3 grid (front / middle / back rows).
- Deterministic. No rolls anywhere.
- Initiative orders turns; higher acts first. Initiative can be modified mid-battle (Punisher's -10).
- Actions: every unit has the universal verbs **attack, defend, wait, surrender**; unit restrictions remove verbs (Zealot: must attack, cannot defend).
- Abilities may be a **main action** (consumes the turn) or a **free action** (usable alongside the main action), and may be limited per combat (charges: "once per combat", "two charges").
- Armor: flat per-hit subtraction, floored at 1. Immunity is the only true zero.
- Melee units can only hit the enemy front line (from the Congregant spec). Units in mid/back rows can't melee.
- Damage types exist (weapon, fire, …) — e.g. Chosen deals fire.
- Stun = the unit skips its next turn; it stays on the grid and remains targetable.
- Status effects can be permanent for the rest of combat and stack (Punishment, bleed).
- Bleed ticks at the start of the afflicted unit's turn.
- XP: defeated enemies feed a pool, split among the winning side's survivors. Valuation is deterministic from stats.

## Open
- **Initiative → actions**: older notes say "15 initiative = 1 action, 45 = 3", and the melee spec talks about dropping "across an action threshold (50 → 40)". The actual formula is undefined. Provisional for M1: one action per unit per round, order by initiative.
- **Melee reach**: can melee hit any front-row enemy, or only the nearest column (D2 style)? What happens when the enemy front row is empty — does the next row become "front"? Provisional: any enemy in the frontmost non-empty row.
- **Defend**: what does it do (D2: halve damage until next turn)? Provisional: incoming damage halved until the unit's next turn.
- **Wait**: move to the end of this round's order (D2 style). Cooldown rules existed in the old code; unclear if intended.
- **Surrender**: exits the unit from combat — what happens to it strategically?
- Ranged / caster targeting shapes (any unit? AoE patterns?). No ranged unit is specced yet.
- Unit size (2-cell units, D2 style)? Not specced.
