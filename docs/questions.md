# Open questions for the user

The user is in a "suggest" role: they answer when they have time, so nothing here should block work. Answer inline under a question; Claude moves settled answers into the design docs and deletes them from here.

## Combat (provisional answers in `design/combat.md`)
2. Melee "one tile in front": if that tile is empty, the unit can't attack. Intended, or should it fall through or widen? (Will know more after playing M1.)

## Factions
6. Vexumphat: the mechanics notes say "resurrection mechanics, super annoying to get rid of", but canon says raising the dead isn't a mechanic. Is the intent that *they* come back (graveyard perks), just not that they raise others?

## Map (provisional answers in code)
7. Leader movement is 4 points per turn, with terrain costs plain 1, forest/hills 2, mountain/water impassable. There's no canon for either; any preferences?
8. When a squad's leader unit dies but the squad wins, the squad keeps marching (another unit takes the figure). In D2 a leaderless squad… what should happen here? Relates to leader elevation.

## Art pipeline (see `design/asset-pipeline.md`)
11. Route A (rigid-part 3D statues) vs Route B (painted animated sprites in a 3D world, like D2): plan is a bake-off with one unit, but if you already lean one way, say so.

## Capitol and economy (provisional answers in `src/rules/world.ts`, `units.ts`)
12. Punishment balance: **done** (user OK, 2026-09-25): capped at 3 stacks. With the cap, the provisional Guardian (1500 HP / 80 / 25 / 60) beats Congregant armies and most mid-tier presets, and falls to fully evolved armies of every doctrine (`pnpm sim` style check).
13. Economy: 100 starting gold, Capitol +50/turn, each gold mine +25/turn, Congregant 40 (canon). Units resting in their own Capitol heal 25% of max HP per turn. Elevation is free. Neutral cities start unguarded. All placeholders.
14. Only tier-1 units can be recruited (D2 style), so Jilliath recruits only Congregants; the rest must come from evolution (M4). Right?

## Progression (M4; provisional answers in `src/rules/progression.ts`, `doctrine.ts`, `world.ts`)
15. XP sources: answered (user, 2026-09-25): neutral groups on the map, guarded neutral cities, guarded dungeons (`design/pillars.md`). Neutral units: the user's bandits (`design/units/neutrals-bandits.md`); plainly labelled placeholders are OK for anything else.
16. Numbers: XP to evolve 100/250/500/1000 by tier; a unit is worth maxHP/2 + damage + armor; evolving resets XP and heals to full; investing costs 150 at the tier-2 fork and 300 at the tier-3 fork; resurrection costs 40 × tier, 3× that if done at once and minus one base per turn waited; resurrected units return at 1 HP.

## Naming
17. "March" is only the setup button's label and "disc" is the working title; the user may rename either later. Don't invent names.

## Second faction
18. Sparring with the user on a second faction (the user has ideas). Topics: how the faction's core plays, back-row roles (every canon unit is melee so far), tree forks, a signature mechanic.

## Neutrals and the economy (M5)
19. **Provisional answer in code (m13):** cleared bandit camps regrow after 8 turns, weak before turn 20, medium before 40, strong after (`balance.ts`). Before that, every AI game stalled once the neutrals were gone, since tier-1 units can't hurt a 25-armor Guardian. Is regrowth right, or would you rather have something else (more lairs, neutral roamers, a training building)? Original question: Neutral XP is finite (2 camps, 2 dungeons, 3 guarded cities on a 61-hex map), so AI-vs-AI games still end in cold wars: armies reach about tier 2–3, and a Guardian needs tier 4–5. Should neutrals respawn, or grow over time, or should maps have more of them?
20. Gold has no sink beyond tier-1 recruits (the winning AI banks ~17k). Canon has city upgrades (linear, gold, raising fortification/armor/regen). Should those come next, or something else?
21. Bandit and Nexus stats, recruit prices (Custodian 60, Engineer 50, Apprentice 60), group sizes, dungeon rewards (200 gold, or 50 gold + a Hedge Mage joins) are all provisional. Ranged units hit any enemy (D2 archers); fine?

## Nexus tier 2 (M6; provisional answers in code)
22. Negate cancels the marked unit's next *ability* (attack, defend, spells), not Wait; the cancelled ability still spends the action and any charges. The Justiciar keeps the Apprentice's Burst and Bolt, and the Thaumaturge keeps them too. Right?
23. Equalize targets allies only, and only those with less shield than the Battery; units without a shield stat can receive lent shields. Mutate: +10 damage per overcharge, stacking, for the rest of combat. Restore Shield may now target full shields (needed to feed a Mutant).
24. Tier-2 stats: Battery 70 HP / 160 shield / 30 dmg; Mutant 150 HP / 60 shield / 40 dmg; Justiciar 70 HP, 55 init; Thaumaturge 65 HP; Homing Lightning 45 per hit. All placeholders.

## From the first playtest
25. ~~How high should Leadership go?~~ Answered: max 9 (the grid). Still open: does anything besides the leader tree raise it?
26. ~~What's in the leader tree?~~ Answered with v1 (pillars.md). Still open: how the options come to depend on the elevated unit.
27. The Capitol screen: what can you do and build there beyond today's recruit/elevate/invest/resurrect? (Canon mentions Capitol dwellings and base upgrades, and linear upgrades for ordinary cities.)


## Leader tree v1 (m8; provisional answers in code, `world/leaders.ts`, `balance.ts`)
28. Points: one per 100 XP the leader earns (its share of each won fight, the same XP its unit gets). Should the leader level on its own curve instead?
29. Ranks and prerequisites: Movement +1 (2 ranks), Health +10% (1), Leadership +1 (4, up to 9), Squad healing (1, needs Health), Leader's aura (1, needs Movement, Leadership and Squad healing: "the end of the tree"). The names are placeholders. Right shape?
30. Squad healing is passive: 10% of max HP to every unit in the warband at the start of your turn, anywhere on the map (stacks with the Capitol's 25%). Action instead?
31. ~~Percentages~~ Answered: fine. Percentages add a share of the *base* stat (+10% health = +9 on a 90 HP Congregant; the aura is +5% of base damage, so Congregation's bonus isn't multiplied). D2 does the same; fine?
32. ~~Another unit takes over a fallen leader's figure?~~ Answered: no. The fallen leader stays the leader and must be revived (pillars.md). Still provisional: the warband may march while its leader is dead (to go home), and reviving costs what a resurrection would.
33. Leader experience: today a leader's tree points come from `experience`, which already is its own counter (starts at 0 on elevation, only grows while it leads, and only while it lives), fed by the same XP as its unit. The user suspects leader abilities shouldn't hang on XP alone. Other sources to spar on: battles won as leader, cities taken, dungeons cleared, turns led, items.
34. A settings menu (hotkeys, speed, camera) is wanted eventually. Hotkeys are data on the ability definitions (`hotkey`), so remapping will be an override table.

## A game you can finish (m13)
35. **Nexus needs tiers 3+ (design gate).** Depths set by the user (2026-09-26): melee ≤ tier 3 (scheme may stop at the Battery), support ≤ 3 and about disabling, mage to tier 5 with maybe several tier-5 options. Units still to design. Nexus's trees end at tier 2 (Battery, Mutant, Justiciar, Thaumaturge; the Arcane Engineer has no tier 2 at all). Tier-2 armies can't break a Capitol, so games where Nexus is ahead still stall. Needs the user's unit designs.
36. **Cross-faction balance:** with the AI on both sides, Nexus wins about 10 of 13 decided games against Jilliath (8 seeds each way; the Jilliath mirror is an even 4–4). Tuning waits for Nexus's tiers 3+, since the tier-2 cap distorts the picture.
37. **The fourth archetype.** Summons as a faction-wide line: rejected ("feels forced", 2026-09-26); two ideas survived as abilities (a Jilliath beacon, the Grove's fungal corpse explosion). The user doubts "ranged" (D2's bows) has creative room and wants something beyond melee/support/mage, but isn't sure what. Claude's proposals in the conversation of 2026-09-26 (summoner/tile-filler line, telegraphed artillery); undecided.
38. **Vexumphat and numbers:** "takes advantage of death and numbers" (2026-09-25) vs "can't really become more in numbers, but don't really disappear either" (2026-09-26). Is the reading "many, cheap, hard to be rid of, never growing" right?
39. **Nexus spell charges:** one pool per caster (its battery) or one per squad? Does the base cost of a spell also come from the pool, and are enhancements chosen per cast (a choice in the UI)? Can anything restore charges mid-fight (the Arcane Engineer? the Battery?), given "rare if any"?
