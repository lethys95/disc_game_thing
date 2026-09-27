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

## Capitol and economy (provisional answers in `src/rules/balance.ts`)
13. Economy: 100 starting gold, Capitol +50/turn, each gold mine +25/turn, Congregant 40 (canon). Units resting in their own Capitol heal 25% of max HP per turn. Elevation is free. Neutral cities start unguarded. All placeholders.
14. Only tier-1 units can be recruited (D2 style), so Jilliath recruits only Congregants; the rest must come from evolution (M4). Right?

## Progression (M4; provisional answers in `src/rules/progression.ts`, `balance.ts`)
16. Numbers: XP to evolve 100/250/500/1000 by tier; a unit is worth maxHP/2 + damage + armor; evolving resets XP and heals to full; investing costs 150 at the tier-2 fork and 300 at the tier-3 fork; resurrection costs 40 × tier, 3× that if done at once and minus one base per turn waited; resurrected units return at 1 HP.

## Naming
17. "March" is only the setup button's label and "disc" is the working title; the user may rename either later. Don't invent names.

## Second faction
18. Sparring with the user on a second faction (the user has ideas). Topics: how the faction's core plays, back-row roles (every canon unit is melee so far), tree forks, a signature mechanic.

## Neutrals and the economy (M5)
19. **Provisional answer in code (m13):** cleared bandit camps regrow after 8 turns, weak before turn 20, medium before 40, strong after (`balance.ts`). Before that, every AI game stalled once the neutrals were gone, since tier-1 units can't hurt a 25-armor Guardian. Is regrowth right, or would you rather have something else (more lairs, neutral roamers, a training building)? Original question: Neutral XP is finite (2 camps, 2 dungeons, 3 guarded cities on a 61-hex map), so AI-vs-AI games still end in cold wars: armies reach about tier 2–3, and a Guardian needs tier 4–5. Should neutrals respawn, or grow over time, or should maps have more of them?
20. Gold has no sink beyond tier-1 recruits (the winning AI banks ~17k). Canon has city upgrades (linear, gold, raising fortification/armor/regen). Should those come next, or something else?
21. Bandit and Nexus stats, recruit prices (Custodian 60, Technician 50, Apprentice 60), group sizes, dungeon rewards (200 gold, or 50 gold + a Hedge Mage joins) are all provisional. Ranged units hit any enemy (D2 archers); fine?

## Nexus tier 2 (M6; provisional answers in code)
22. Counter cancels the marked unit's next *ability* (attack, defend, spells), not Wait; the cancelled ability still spends the action and any charges. The Justiciar keeps the Apprentice's Burst and Bolt, and the Thaumaturge keeps them too. Right?
23. Equalize targets allies only, and only those with less shield than the Cyclops; units without a shield stat can receive lent shields. Mutate: +10 damage per overcharge, stacking, for the rest of combat. Restore Shield may now target full shields (needed to feed a Mutant).
24. Tier-2 stats: Cyclops 70 HP / 160 shield / 30 dmg; Mutant 150 HP / 60 shield / 40 dmg; Justiciar 70 HP, 55 init; Thaumaturge 65 HP; Homing Lightning 45 per hit. All placeholders.

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

## A game you can finish (m13)
35. **Nexus needs tiers 3+ (design gate).** Mage tier 3 done (user, 2026-09-26: Etherborn, Backlasher, Maelstrom; #50); tiers 4–5 and the other lines still to design. Depths set by the user (2026-09-26): melee ≤ tier 3 (scheme may stop at the Cyclops), support ≤ 3 and about disabling, mage to tier 5 with maybe several tier-5 options. Units still to design. Nexus's trees end at tier 2 (Cyclops, Mutant, Justiciar, Thaumaturge; the Technician has no tier 2 at all). Tier-2 armies can't break a Capitol, so games where Nexus is ahead still stall. Needs the user's unit designs.
36. **Cross-faction balance:** (User, 2026-09-26: comparisons don't mean much yet: Jilliath has only its melee line, so its backline is lame; Nexus has three lines. Revisit when Jilliath has support/mage lines.) with the AI on both sides, Nexus wins about 10 of 13 decided games against Jilliath (8 seeds each way; the Jilliath mirror is an even 4–4). Tuning waits for Nexus's tiers 3+, since the tier-2 cap distorts the picture.
37. **The fourth archetype.** Summons as a faction-wide line: rejected ("feels forced", 2026-09-26); two ideas survived as abilities (a Jilliath beacon, the Grove's fungal corpse explosion). The user doubts "ranged" (D2's bows) has creative room and wants something beyond melee/support/mage, but isn't sure what. Claude's proposals in the conversation of 2026-09-26 (summoner/tile-filler line, telegraphed artillery); undecided.
40. **Levels (m15, provisional numbers):** each level past the end of a line gives +5% of the unit's base max HP and damage, and heals fully (as D2 does, I believe); the XP per level is the tier's evolution cost (tier 5 uses tier 4's 1,000). The Guardian doesn't level. Right sizes?
41. **Neutral difficulty (user's playtest: "not difficult enough, they should pose a challenge even to begin with"). Provisional:** weak groups 4 bandits, medium 5 at level 2, strong 6 at level 4. A starting squad of 5 Congregants loses a unit to a weak group, 2 to a medium one, and loses to a strong one; AI games run longer (typically ~60 turns). Right feel?
42. **Destructible cities (Warlords 3):** destroying a city makes its nodes fall to the nearest remaining city, pooling their benefits at the cost of the strategic spread. The user isn't sold; to spar on.
43. **Colors are very brown** (user, 2026-09-26). First pass (2026-09-27): the map's terrain is cool stone, moss and slate, the light less orange, highlights neutral. The UI panels and the battle arena keep their dark warm tones. Better, or further?
44. (User: a Capitol starts with only its Guardian and enough gold to recruit, which is how it already works.) **City tiers (m17, provisional):** tiers 1–4 for every city, the Capitol included; garrison slots 3/4/6/8 (a Capitol's Guardian takes none); defenders get +2 armor per tier above 1 ("small": armor subtracts from every hit); upgrade cost 150 × the next tier. A fresh Capitol now holds the Guardian + 3 (before: + 5), and in some AI games a rally of two warbands takes it around turn 20. Too rushable? Options: more starting slots for Capitols, a stronger Guardian, or accept it (defense is an investment).
45. **Capitol research (m17):** the first item is "Resurrection in cities" (placeholder name; 400 gold): resurrect in any city you hold for 25% more than at the Capitol. Fallen *leaders* are still revived at the Capitol only. Name, price and premium are provisional. What else belongs in Capitol research?
46. **Nodes (m17, provisional):** each node belongs to the nearest city (Capitols count; ties go to the first city listed), and each Capitol now has a gold mine of its own. Investing raises a node's level (max 3, 100 gold × the next level): a mine yields 25 gold per level, a Blacksmith +10 ability damage per level. Right shape? What other node kinds do you want?
47. **Elimination (m18, provisional, only matters with 3+ players):** when a player's Guardian falls, its warbands disband and its other cities fall neutral, keeping their garrisons as neutral defenders; its Capitol goes to whoever empties it. Other ideas: cities pass to the conqueror, or the loser's warbands turn neutral and roam.
48. (m24: the setup screen now adds up to four more AI opponents for map games; `?map&players=N` for tests. When you're out, the game ends for you even if the AIs could play on.) **AI in games of 3+ players:** it plays and games run fast, but a four-player AI game ended without a winner after 150 turns. Only matters once there's a setup for more players; worth tuning then (who to attack, alliances of convenience, finishing off weakened players).
49. **Fog of war (m19, provisional):** a warband sees 2 hexes, a city 1, a Capitol 2; terrain doesn't block sight; warbands out of sight aren't shown at all (places are, as last seen); a march stops when it spots a warband it hadn't seen. Want other ranges, terrain that blocks sight (forests, hills to see further), scouting units or leader skills that see further?
50. **Nexus tier-3 mages (m21; your sheet, my readings, all provisional):**
    - *Counter* is the Justiciar's old Negate (renamed); *Negate* is now the Etherborn's flip.
    - **Etherborn:** 90 HP, 6 charges; Counter and Negate replicable (scheme). Negate is a normal action (not free), 1 charge, replicable (user: "we want replicate on it"), on any unit, secret from the other side. It flips the next damage (before armor and shields) into healing, or the next healing into damage; a shield restoration it flips drains that much shield ("works against shields too"). Absorb: prevents 15 (your x and y), on an enemy after a hit of its own low damage.
    - **Backlasher:** (user: the "and the ability" was a typo) Backlash is Counter plus a 40-damage hit to the countered unit whenever it cancels something.
    - ~~Fork labels~~ (user, 2026-09-26): only the faction's duality fork is labelled (Scheme/Overload, Faith preserves/consumes); later forks come from one side and go unlabelled, the Zealot's included.
    - **Maelstrom:** 6 charges; Combustion is a free action for 1 charge; until its turn ends its charged spells are free actions, each spell once per turn (the usual free-action rule). Burst 55, Homing Lightning 60 (the Thaumaturge's 40/45).
    - Balance note: with the AI on both sides, Nexus now wins 5 of 6 world games against Jilliath (one cold war). Not tuned: Jilliath's backline doesn't exist yet (#36).
51. **Spells and mana (m25; the system is canon, every spell and number is a placeholder):**
    - Mana is typed by faction color (Jilliath red, Ral-Vitahl teal). A Capitol yields 5 of its owner's color per turn; a new node kind, the mana node (on one neutral city), yields 10 per level in its holder's color. Should mana nodes have a color of their own (D2's typed crystals), so capturing one gives that color?
    - Spells are learned at the Capitol (Spells tab) for gold, then cast on the map at anything in sight, each once per turn. A spell tree is canon for later: what gates it (Capitol tier, research, mana spent)?
    - Placeholders, following each faction's direction: Jilliath *Break walls* (an enemy city's defenders −4 armor for 3 turns) and *Bless warband* (+10 damage for 2 turns); Ral-Vitahl *Lightning strike* (−30 HP to each unit of one group) and *Lightning storm* (−15 HP to every enemy group within 1 hex). Damage spells can kill (user, 2026-09-27): the dead go to the graveyard, a fallen leader stays at 0 HP, a warband with nobody left falls; a lair emptied by a spell counts as cleared by the caster (a dungeon's gold goes to the caster, no XP; provisional). Want to design the real ones, per faction?
52. **Tier-1 balance (m27, `pnpm sim:t1`):** Nexus won all 16 real matchups against Jilliath's tier 1 (the Custodian's 90 shield made it ~150 effective HP against a Congregant's 90, and two Apprentice Bursts hit up to five units each). Tuned: Custodian shield 90 → 65, the Apprentice's Burst 40 → 35 (the tier-2 casters keep 40). Now Jilliath wins 13 of 24, with two Apprentices still beating every Jilliath squad. **Stalemate:** three Congregants and two Clerics against Custodians and a Technician can run forever (the last Congregant can't break a shield the Technician keeps refilling; the Clerics keep it alive). **Provisional (2026-09-27):** after 30 rounds the attacker withdraws; the defender holds the field, the attacker's survivors leave alive (the sims crashed on such fights once Clerics were in armies). Keep, change the limit, or another rule?
53. **Items (m35; the slots are your 2024 design, the Ankh is canon, everything else is a placeholder):** a leader has headgear, body armor, two utility slots and a banner, plus a bag; worn items reach the leader's own unit, a banner the whole warband. The Ankh (carried) makes reviving its fallen leader free and is used up. Placeholders: Iron helm (+5 armor), Plate armor (+8), Swift charm (+10 initiative), War banner (+5 damage to the warband). Dungeons now also reward an Ankh or the War banner. A warband wiped out by another leaves its items to the victor (D2's spoils; provisional). (User, 2026-09-27: will design items at some point; first three in: the Hatchet (weapon, thrown for 30 once per combat, which added a weapon slot), the Outlaw's pocketwatch (utility: +5 to attacks, +10 more against a shield), and the Cathedral node (units hired in its city carry Holy Water, heal 30 once per combat).) (User, 2026-09-27: a merchant on the map buys and sells items; M38.) Holy Water targets any wounded ally including the unit itself, as a main action: right?

