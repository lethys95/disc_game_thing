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
  holy (Acolyte → Cleric's Castigation → Pontiff's Repentance and Chant → Archon's Judgement); fanaticism
  is fire with stacking burn (Doomsayer's Burn at the stake → Fire mage 3's fire on all → Fire mage 4's Detonate or the
  Martyr's backfiring beam). `?fight=mages`. Engine: a holy damage type, `BattleUnit.struck` (Judgement), a `hurt`
  hook (Repentance wakes on burns), Ignite's burns stack.
- **Jilliath is angels and their human followers (the user):** the support line is the angels, named by the user:
  Seraph → Emissary → Guardian → Shepherd → Godkin (faith, the safe choice: buffs, moderate heals), Paragon →
  Empyreal / Reclaimer (vengeance, aggressive). **Built:** the Seraph; the vengeance side (Atonement; the Reclaimer's
  Transfusion and life-draining Reclaim; provisional #73); the Emissary as a placeholder healer. `?fight=angels`.
  Whole AI games shifted: the strong-start world test now only checks a game ends (#73, balance pass).
- **The Grove's Water is now Wellspring** (the user: water is the element, not the ability). Save 33.
- **The angels' look and reach** (the user): a humble, hooded, praying tier 1; faith may go to tier 5 and show who
  pulls the strings (t4 stained glass; t5 a bare silhouette of moving sky with god rays, `maybe/sky-silhouette-angel`); vengeance with blood-tipped wings.
- Before that (2026-10-06/07): ability power and "everything is an ability" (#71), no head math, codex round two, the
  interface in rem, 22 portraits, audit fixes. Details in git history.

## Next
1. **The user plays the mage line** (`?fight=mages`, or a map game); fire-side names and the secret's home are open.
2. **The guardian angels** (todo 15): Emissary, Guardian, Shepherd (stained glass), Godkin (the sky silhouette) are
   named, not designed; buffs and moderate heals, the resurrection at t4 or t5. The vengeance t4 after Empyreal is
   open. The user is reading MTG's angels on their own sheet.
3. **Armor and flat buffs as percentages** (`maybe/percent-armor-and-buffs`): best decided before lines are tuned.
4. **Waiting for the user to look** (`testing/`): ability power, the front door and codex, portraits, Jilliath's
   opening.

## Try
`?codex`, `?fight` (`=mages`, `=nexus`, `=grove`, `=bandits`, `=carnival`, `=drawn`; `&tarot=3&seed=4`), `?map`,
`?newgame`, `?skirmish`, `?map&capitol=0`. Routes and params: the verify skill.
