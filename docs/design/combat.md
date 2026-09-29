# Combat

What's decided, and what isn't. Anything under "Open" is a question for the user — don't invent an answer; pick a provisional rule, mark it provisional in code/data, and log it in `../questions.md`.

## Decided
- **Initiative controls both order and number of actions** (user allowed either; Claude picked this one, 2026-09-25). Actions per round = `floor(initiative / 15)`, minimum 1. The divisor is a tunable constant. This formula matches both older notes ("15 → 1 action, 45 → 3" and the Punisher dropping 50 → 40 "across an action threshold"). A round is a series of passes: in pass *k*, every unit with at least *k* actions acts, ordered by current initiative, so actions interleave instead of one unit taking three in a row. Wait moves the unit's current action to the end of the pass.
- Two sides, each a squad on a 3x3 grid (front / middle / back rows).
- Deterministic. No rolls anywhere.
- Initiative orders turns; higher acts first. Initiative can be modified mid-battle (Punisher's -10).
- Actions: every unit has the universal verbs **attack, defend, wait, surrender**; unit restrictions remove verbs (Zealot: must attack, cannot defend).
- Abilities may be a **main action** (consumes the turn) or a **free action** (usable alongside the main action), and may be limited per combat (charges: "once per combat", "two charges").
- Armor: flat per-hit subtraction, floored at 1. Immunity is the only true zero.
- Melee units can only hit the enemy front line (from the Congregant spec). Units in mid/back rows can't melee.
- **Defend** (user, 2026-09-25, as in D2): uses the unit's action; incoming damage is halved until the unit's next action. Implemented as an effect ("defending") so it composes with everything else.

## Targeting (user direction 2026-09-25; model chosen by Claude)
Each ability has its own **targeting pattern**, a small set of tiles. The UI shows it as highlighted squares, per ability.

Geometry: the two 3x3 grids face each other. Rows are numbered by distance from the middle (front = 0, back = 2). From an attacker in row `a`, an enemy tile in row `e` is at **depth** `a + 1 + e` (1–5), and the column offset is −2…+2. So every attacker-to-target relation fits in a **5x5 relative pattern** (depth 1–5 × offset −2…+2). The user's 5x5 hunch is right.

Two kinds of pattern:
- **Relative**: a 5x5 mask anchored on the user's tile. Melee = one tile, depth 1, offset 0: "the square in front of the user" (user's suggestion). It only works from the front row, which matches the Congregant spec.
- **Absolute**: a 3x3 mask on a grid, independent of where the user stands. Examples: the Punisher's flail (whole enemy front row), Lay on Hands on an ally, self-only.

A pattern marks *which tiles can be chosen* (select one) or *which tiles are hit* (area). The Punisher chooses nothing: its whole mask is hit.
- Damage types exist (weapon, fire, …) — e.g. Chosen deals fire.
- Stun = the unit skips its next turn; it stays on the grid and remains targetable.
- Status effects can be permanent for the rest of combat and stack (Punishment, bleed).
- Bleed ticks at the start of the afflicted unit's turn.
- XP: defeated enemies feed a pool, split among the winning side's survivors. Valuation is deterministic from stats.

## Interpretations made while implementing (provisional, 2026-09-25)
- **Melee reach**: the user must be in its own front line and can hit enemy front-line units up to one column away; if none are that close, the nearest ones. The enemy "front line" is its frontmost row with a living unit (D2: when the front row falls, the row behind becomes the front). This widens the user's "one tile in front" suggestion, because otherwise a gap in the enemy line makes a unit useless.
- **Damage dealt** (for Fanaticism's self-damage) is HP actually removed; overkill doesn't count.
- **Guardian Spirit's "rest of the turn"** is read as the rest of the *round* (it only makes sense if the Immortal gets a chance to heal).
- **Hook's "clear path"** is checked in the enemy grid only: the target's front tile must be empty, and Hook grabs the first unit behind it. The Torturer's own column doesn't matter.
- **Fanaticism Aura** gives every unit Fanaticism (self-damage) and Hysteria and forbids Defend, as the spec lists. It does not force everyone to attack.
- **Auras don't stack** (user, 2026-09-29, overruling the earlier reading): a unit reached by several copies of one aura gets the strongest (Devotion Aura: one +armor, whatever the number of adjacent Templars/Immortals), and abilities an aura grants come once (Fanaticism Aura). "Adjacent" means orthogonally adjacent.
- **Turn-order ties** (equal initiative): the sides alternate unit by unit (front row to back, then column, within a side), and the side that leads the tie swaps every pass. Originally side 0 simply went first, but in a mirror match that let the player's whole squad act before the enemy every pass.
- **Stun** skips the next turn slot; **Defend** ends when the unit's next slot starts; **bleed** ticks at the start of each of the victim's slots.

## Balance observations
- A Punisher mirror grinds: Punishment stacks without limit, so front lines drop to 0 damage and trade 1-point hits (AI test: 95 rounds). This is canon working as written. Options to discuss: cap stacks, floor damage at a fraction of base, or accept that Punishers make fights long.
- Every Jilliath unit has 50–60 initiative, so 3–4 actions per round; action count only differs through Punishment. Tempo differences will come from other factions.

- `pnpm sim` (2026-09-25): the preserve preset loses to both consume presets; Punishment beats Self-sacrifice. Presets and greedy AI are crude, so treat this as a hint, not a verdict.

- `pnpm sim:world` (2026-09-25, M3 rules, preserve vs punishment presets): games either end in 2–4 turns (Punishment grinds down the lone Guardian) or freeze into a cold war where neither side can win a fight its forecast allows. Expected while squads can't grow; evolution (M4) should break it.

- `pnpm sim:world` after M4 (uncommitted vs uncommitted): the AI invests and resurrects, but games still freeze into cold wars. XP only comes from battles the cautious AI won't start. Needs an XP source (questions.md #15).

## Open
- **Empty tiles in melee's path**: with melee as "one tile in front", a front-row unit facing an empty column can't attack. Is that intended (positioning matters), or should melee fall through or widen, D2-style? Provisional: literal. Revisit after playing M1, since mirror matches could stall.
- **Empty enemy front row**: does the next row become "front"? Provisional: no. Relative depth is fixed.
- **Wait**: move to the end of this round's order (D2 style). Cooldown rules existed in the old code; unclear if intended.
- **Surrender**: exits the unit from combat — what happens to it strategically?
- Ranged / caster targeting shapes (any unit? AoE patterns?). No ranged unit is specced yet.
- Unit size (2-cell units, D2 style)? Not specced.
