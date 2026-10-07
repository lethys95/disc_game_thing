# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines. Older detail: git history and the docs below._

**Updated:** 2026-10-07 (the Jilliath mage line built)

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

## This session (2026-10-07, second)
- **Jilliath's mage line, built** (`testing/jilliath-mage-line`, provisional #72): faith is holy (Holy mage 2
  Castigation → 3 Repentance → 4 Judgement, the user's order); fanaticism is fire with stacking burn (Doomsayer's Burn
  at the stake → Fire mage 3's fire on all → Fire mage 4's Detonate or the Martyr's backfiring beam). `?fight=mages`.
  Engine: a holy damage type, `BattleUnit.struck` (Judgement), a `hurt` hook (Repentance wakes on burns), Ignite's
  burns stack. Save 30. Faith's theme: "justice", Claude's reading, the user unsure.
- Before that (2026-10-06/07): ability power and "everything is an ability" (#71), no head math, codex round two, the
  interface in rem, 22 portraits, audit fixes. Details in git history.

## Next
1. **The user plays the mage line** (`?fight=mages`, or a map game) and names it; Holy mage 3 wants more offense; the
   secret's home (mage or support) is open.
2. **Jilliath's support line** (todo 15): faith's tiers 2–3 are open (round three on `shots/jilliath-backline.html`);
   the fanaticism side (atonement, transfusion) is designed enough to build next.
3. **Armor and flat buffs as percentages** (`maybe/percent-armor-and-buffs`): best decided before lines are tuned.
4. **Waiting for the user to look** (`testing/`): ability power, the front door and codex, portraits, Jilliath's
   opening.

## Try
`?codex`, `?fight` (`=mages`, `=nexus`, `=grove`, `=bandits`, `=carnival`, `=drawn`; `&tarot=3&seed=4`), `?map`,
`?newgame`, `?skirmish`, `?map&capitol=0`. Routes and params: the verify skill.
