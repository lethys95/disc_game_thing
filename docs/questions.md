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
12. **Punishment balance** (user: "we just need to balance Punishment better"). Proposal: cap Punishment at 3 stacks (−30 damage / −30 initiative), tuned by sim. It changes the canon "stackable per hit" rule, so it waits for an OK. Guardian stats are provisional: 1500 HP, 80 damage, 25 armor, 60 initiative.
13. Economy: 100 starting gold, Capitol +50/turn, each gold mine +25/turn, Congregant 40 (canon). Units resting in their own Capitol heal 25% of max HP per turn. Elevation is free. Neutral cities start unguarded. All placeholders.
14. Only tier-1 units can be recruited (D2 style), so Jilliath recruits only Congregants; the rest must come from evolution (M4). Right?

## Progression (M4; provisional answers in `src/rules/progression.ts`, `doctrine.ts`, `world.ts`)
15. XP sources: answered (user, 2026-09-25): neutral groups on the map, guarded neutral cities, guarded dungeons (see `design/pillars.md`). Open: **may neutral groups use plainly labelled placeholder units** until the user designs neutrals?
16. Numbers: XP to evolve 100/250/500/1000 by tier; a unit is worth maxHP/2 + damage + armor; evolving resets XP and heals to full; investing costs 150 at the tier-2 fork and 300 at the tier-3 fork; resurrection costs 40 × tier, 3× that if done at once and minus one base per turn waited; resurrected units return at 1 HP.

## Naming
17. "March" is only the setup button's label and "disc" is the working title; the user may rename either later. Don't invent names.

## Second faction
18. Sparring with the user on a second faction (the user has ideas). Topics: how the faction's core plays, back-row roles (every canon unit is melee so far), tree forks, a signature mechanic.

