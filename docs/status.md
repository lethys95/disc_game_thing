# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines. Older detail: git history and the docs below._

**Updated:** 2026-10-07 (handoff at the end of a long session)

## Where we're going
The board (`.kanban/`, `pnpm board` → `shots/board.html`): the alpha is the three playable factions (Jilliath,
Ral-Vitahl, the Sylvan) with every unit line designed, built and painted, playable from the title to victory; then
balance; then look and sound. Unit designs are the user's and gate the rest.

## Where we are
A playable map game for 2–6 players (hotseat viewer vs AIs) with Jilliath, Ral-Vitahl and the Sylvan; tribes (bandits,
gnolls; the Drawn and the carnival in fights only), cities, nodes, spells, items, fog, saves, tarot and keywords. The AI
plays map and battles in a web worker. A front door (title, new game, skirmish, codex, settings, credits).
Architecture: `design/architecture.md`; gotchas: `engineering.md`; `pnpm verify` before calling anything done (and
check its exit code, not a grep of its output); `pnpm sizes` for any interface change.

## This session (2026-10-06/07), all committed
- **Everything is an ability (#71, decisions):** no damage stat, no damage type on units. Units have health, shield,
  armor, initiative and **ability power** (per unit, 100 × tier as a guideline; Ral-Vitahl's casters above it, the
  user: "glass cannons"). Each ability's numbers are a share of it (League of Legends-style scaling, the user's
  framing). Buffs add to every damaging hit (`hitBonus`, `hitPercent`). Ral-Vitahl's spells all deal lightning for
  now. Witherbloom for Decay support 2. Save 29.
- **No head math (pillars):** rules text marks the numbers ability power grew (an optional Show formulas setting);
  the hover preview is a badge, a skull when lethal, the health bar marked; every ability shows **targeting grids**
  (left to right like the city grids), read from the engine (`rules/battle/reach.ts`).
- **Codex, round two:** factions and tribes apart, search, groups, linked pages, a Nodes tab; abilities declare the
  effects they apply (checked by `tests/applies.test.ts`).
- **The interface scales:** sizes in rem, the root size follows the window height, an Interface size setting.
- **Portraits:** 22 units (the Packstalker, Hamstringer and five Drawn added).
- **Audit fixes** (`design/audit-2026-10-06.md`): Jilliath's opening squad; the AI raises every node kind.

## Next
1. **Jilliath's backline, with the user** (todo 15, 20): the mage line is mostly designed (the user: "we largely just
   designed the Jilliath mage line"), so its settled parts can be built: holy Castigation, Judgement, Repentance;
   fire with burn, the Doomsayer's Burn at the stake, tier 3's fire on all, detonate, the martyrdom caster.
   Still open, on `shots/jilliath-backline.html` (round three): the faith support's tiers 2–3, where the deflecting
   secret lives and its name, the holy mage's unit order, homes for the maybes (Justice Strike, Arrows of Justice,
   fire spreading on death). Trees: `faction-stuff/jilliath/support.md`, `mage.md`.
2. **Armor and flat buffs as percentages** (`maybe/percent-armor-and-buffs`): the user "might"; best decided before
   lines are tuned against armor.
3. **Waiting for the user to look** (`testing/`): ability power, the front door and codex, portraits, Jilliath's
   opening. Damage types later (`eventually/damage-types`); ways to raise ability power (`eventually/ability-power-sources`).
4. **Claude, without designs:** a probe for the UI kit's grotesques (`eventually/ui-kit-grotesques`, ComfyUI is free);
   the Water and Wet icons are still placeholders.

## Try
`?codex`, `?fight` (`=nexus`, `=grove`, `=bandits`, `=carnival`, `=drawn`; `&tarot=3&seed=4`), `?map`, `?newgame`,
`?skirmish`, `?map&capitol=0`. Routes and params: the verify skill.
