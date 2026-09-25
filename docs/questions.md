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
12. **The Guardian vs Punishment.** A lone Guardian loses to the Punishment doctrine at any stats I tried: stacking −10 damage/−10 initiative grinds it to nothing (22+ rounds). Should the Guardian resist debuffs, never fight alone (a stronger garrison), or is "Punishment counters the Capitol" intended? Provisional stats: 1500 HP, 80 damage, 25 armor, 60 initiative.
13. Economy: 100 starting gold, Capitol +50/turn, each gold mine +25/turn, Congregant 40 (canon). Units resting in their own Capitol heal 25% of max HP per turn. Elevation is free. Neutral cities start unguarded. All placeholders.
14. Only tier-1 units can be recruited (D2 style), so Jilliath recruits only Congregants; the rest must come from evolution (M4). Right?

## Progression (M4; provisional answers in `src/rules/progression.ts`, `doctrine.ts`, `world.ts`)
15. **Where does XP come from besides fighting the other player?** With XP only from battles, AI-vs-AI games freeze: nobody takes a fight its forecast says it loses, so nobody evolves, and nobody can crack a Guardian. D2 used neutral monsters guarding cities, treasure and dungeons. Your design lists dungeons and map structures but has no neutral creatures. What should live there? (A human who takes risks gets further than the cautious AI, but the game needs something to grow on.)
16. Numbers: XP to evolve 100/250/500/1000 by tier; a unit is worth maxHP/2 + damage + armor; evolving resets XP and heals to full; investing costs 150 at the tier-2 fork and 300 at the tier-3 fork; resurrection costs 40 × tier, 3× that if done at once and minus one base per turn waited; resurrected units return at 1 HP.

