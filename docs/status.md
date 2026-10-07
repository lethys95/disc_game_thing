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
- **Jilliath's mage line, built** (`testing/jilliath-mage-line`, provisional #72): the faith side is the priests,
  holy (Acolyte → Cleric's Castigation → Pontiff's Repentance and a 2×2 Castigation → Archon's Judgement); fanaticism
  is fire with stacking burn (Doomsayer's Burn at the stake → Fire mage 3's fire on all → Fire mage 4's Detonate or the
  Martyr's backfiring beam). `?fight=mages`. Engine: a holy damage type, `BattleUnit.struck` (Judgement), a `hurt`
  hook (Repentance wakes on burns), Ignite's burns stack. Save 31.
- **Jilliath is angels and their human followers (the user):** the support line is the angels, all of it; the
  tier-1 support (the old Cleric) is `jilliath_support_1`, unnamed until they're worked out (decisions.md).
- Before that (2026-10-06/07): ability power and "everything is an ability" (#71), no head math, codex round two, the
  interface in rem, 22 portraits, audit fixes. Details in git history.

## Next
1. **The user plays the mage line** (`?fight=mages`, or a map game); fire-side names and the secret's home are open.
2. **Jilliath's support line as angels** (todo 15): the tiers were drafted as human healers; with angels for the whole
   line, the user's next design round. Atonement and transfusion (fanaticism) and the resurrecting angel (faith) are
   kept from round two.
3. **Armor and flat buffs as percentages** (`maybe/percent-armor-and-buffs`): best decided before lines are tuned.
4. **Waiting for the user to look** (`testing/`): ability power, the front door and codex, portraits, Jilliath's
   opening.

## Try
`?codex`, `?fight` (`=mages`, `=nexus`, `=grove`, `=bandits`, `=carnival`, `=drawn`; `&tarot=3&seed=4`), `?map`,
`?newgame`, `?skirmish`, `?map&capitol=0`. Routes and params: the verify skill.
