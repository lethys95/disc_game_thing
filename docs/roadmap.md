# Roadmap

Every milestone ends with something **playable in the browser**. No milestone is only infrastructure. Build a system when a milestone needs it, not before.

## M1 — One battle ✅ (2026-09-25)
Two 3x3 squads fight to the end in the browser. Player controls one side; a dumb AI controls the other.
- Mirror match: Jilliath Congregant, Paladin, Zealot on both sides (`design/units/jilliath-melee-line.md`).
- Combat built on the modular ability model (`design/abilities.md`); attack/defend/wait are abilities.
- Actions: attack, defend, wait; Paladin's Lay on Hands (free action, once per combat).
- Placeholder visuals: tokens/boxes, HP bars, turn-order strip, action buttons.
- Done when: a full battle can be played to victory/defeat with no console errors, the rules are unit-tested, and there's a screenshot in the session notes.

## M2 — Walk into a fight ✅ (2026-09-25)
Small hex map with a rotatable camera. One leader per side; click to move (movement points, A*). Moving into the enemy leader starts an M1 battle, and the survivor returns to the map.

## M3 — A tiny whole game ✅ (2026-09-25)
Two players (hotseat or player vs AI) alternate faction turns. Capitol with guardian (loss condition), one or two neutral cities with gold nodes, recruiting at the Capitol, elevating a unit to leader. You can win or lose.

## M4 — Progression ✅ (2026-09-25)
XP → evolution tiers, branch investment for Jilliath's melee line, graveyard with decaying resurrection cost.

## M5 — Neutrals and a second faction ✅ (2026-09-25)
The user's bandits guard neutral cities, camps and dungeons (one-time rewards: gold, a unit joins). Ral-Vitahl's tier 1 (Custodian, Technician, Apprentice) is playable beside Jilliath. Engine: shields, ranged and area attacks. Punishment capped at 3 stacks.

## M6 — Nexus scheme vs overload ✅ (2026-09-25)
Forks are per faction. Nexus's one fork (scheme = automata and the Justiciar, overload = mutants and the Thaumaturge) unlocks the Cyclops (Equalize: lent shields), the Mutant (Mutate), the Justiciar (a secret Counter mark) and the Thaumaturge (Homing Lightning). All designed by the user.

## M7–M11 ✅ (2026-09-25/26)
Foundation rebuild (traits, effect definitions, damage pipeline), first-playtest fixes, per-line forks, leader tree, unit-type upgrades and the Capitol screen (m8), fallen leaders and hotkeys (m9), art slots and the art pipeline (m10), save/load (m11). The art spike ran on Krea 2; the direction is **not settled** (`design/art.md`).

## M12 — Paper standees ✅ (2026-09-26)
Units with a portrait stand on the battlefield as camera-facing cards in their side's frame; the rest keep the statue placeholders. A stand-in, not the shipping look.

## M13 — A game you can finish ✅ code side (2026-09-26); awaiting the user's playtest
The goal of the vertical slice: one Jilliath vs Ral-Vitahl match you can play to the end against the AI and enjoy. A map AI that plans (not one move deep), no cold wars (finite neutral XP, #19), win conditions it actually reaches, balance tuned by `pnpm sim` / `sim:world`.
- Done (2026-09-26): siege chains, staging, refilling, safer elevation; provisional camp regrowth (#19). Jilliath mirror: every game ends. `tests/campaign.test.ts` plays a whole AI game.
- Blocked on design: Nexus tiers 3+ (#35); cross-faction balance waits for them (#36).
- AI decision time over whole games: median 0.1 ms, p90 127 ms, max 388 ms (in the worker; the view pauses 350 ms per AI action anyway). About 3 AI actions per turn.
- Estimated human game: ~40 turns, 15–20 battles, roughly 45–90 minutes. Needs the user's playtest.

## M14 — Nexus spell charges ✅ (2026-09-26)
Casters' batteries; spells cost charges; overload (Thaumaturge) and replicate (Justiciar) as selectable variants with exact previews.

## M17 — Cities ✅ (2026-09-26; the user's playtest of 2026-09-26)
The user's city list (pillars.md, "Cities"), in steps, each playable:
1. ✅ Small fixes: spell-charge pips over casters; hold right-click on a fork's options to see each branch's card.
2. ✅ **Squad grids**: drag and drop between garrison and visiting warband, and between two adjacent warbands anywhere; recruit by clicking a tile. A city screen for every owned city, with tabs (City, Research for the Capitol).
3. ✅ **City tiers**: upgrade for gold: garrison slots, an armor bonus for garrison and visitors; recruiting limited by tier.
4. ✅ **Resurrection at cities**, unlocked by Capitol research, at a premium.
5. ✅ **Nodes**: tied to the nearest city (Capitols included), shown on the map; investment.

## M18 — Players ✅ (2026-09-26)
The world supports any number of players (battles stay two-sided); the screens stay you vs one AI for now.

## M19 — Fog of war ✅ (2026-09-26)
Canon fog: unexplored hidden, explored-not-visible as last seen. Per-player explored hexes and memory in the rules; the AI and the view see only what their player knows; marches stop on sighting; the AI explores.

## M21 — Nexus tier-3 mages ✅ (2026-09-26)
The user's Etherborn, Backlasher and Maelstrom; the renames Cyclops, Technician and Counter.

## M22 — Settings ✅ (2026-09-26)
Animation speed, camera feel, hotkeys; kept per browser.

## M24 — More players from the setup ✅ (2026-09-26)
Up to six players on a map from the setup screen; you against several AIs.

## M25 — Spells and mana ✅ (2026-09-26)
The canon overworld spell system with placeholder spells (#51): typed mana, learning at the Capitol, casting on the map.

## M29 — The user's playtest of 2026-09-27 (done except 9, 17)
1. [x] Resurrection in cities: it may work, but nothing on screen says so (graveyard and labels in cities after the research).
2. [x] City grids: hold right-click on a unit for its details (stats, armor included).
3. [x] Squad grids laid out like the battle: front on the right, back on the left.
4. [x] Overload as a toggle on the spell's button, not a second button.
5. [x] Ability icons fill their buttons in battle.
6. [x] Homing Lightning is never worth it next to Burst: rebalance.
7. [x] The AI put Technicians in the front row with room in the back.
8. [x] Cities and the Capitol heal garrisons and visiting warbands, more than now (resurrected units stay at 1 HP otherwise).
9. [x] Momentum: the AI now guards its Capitol and blitzes strong warbands; retreat and Resolve now exist (user's ideas). More to learn from playtests.
10. [x] Maps too small: the enemy Capitol is two turns away ("spawn camping").
11. [x] Camera: pan without moving a warband; orbit around the map's middle.
12. [x] Blacksmith: +10 attack for units recruited in its city (not every battle).
13. [x] City names on the map match the panel ("City 2", not "Your city").
14. [x] Mana nodes are labelled as ability damage; they give mana.
15. [x] Spells cost at least 3× more mana.
16. [x] The AI sat next to an empty city it could take, boxed in, instead of taking it.
17. [x] Colors: the map's terrain recolored (first pass, #43).

## M37 — Code review cleanup (done, 2026-09-27)
The user asked for a review of the code for technical debt; four reviewers (battle, world, view, tooling) reported. Fixed what M38 builds on; the rest is listed with reasons in engineering.md ("Debt").

## M38 — Map structures (user, 2026-09-27; done)
- **Mercenary camps:** recruit a few select neutral units, per map.
- **Merchant:** buy and sell items.
- **Mage merchant:** sells spells.

## Then
- Faction content as the user designs it (Nexus trees first; Grove and Wastes later). The user owns unit designs and looks.
- A spell tree in the Capitol, and the real spells (#51).
- Leader experience (#33), the economy question.

## Later (not ordered yet)
**Audio** (user, 2026-09-26): a local pipeline like the art one; research and a plan in `design/audio-pipeline.md` (ACE-Step 1.5 for music, already installed; Stable Audio 3 for SFX, ~15 GB to download). Needs the user's go for the download and the user's ears.
**An outside AI possesses a player over MCP** (user idea, 2026-09-26, "for shits and giggles"; not soon): a local stdio MCP server in `scripts/mcp/` running a headless game (the rules are pure, like `sim:world`); the other seats are the map AI. Tools: new_game, look (a compact text view of `knownWorld`, so fog keeps it fair), options, act, end_turn, battle_state / battle_act (or autoplay). Writes a save after each turn to load in the browser and watch. The user wants to play in that game too (2026-09-26): the browser and the MCP server then share one live game (a small local server the browser connects to, e.g. a websocket), which is more than the headless version. The real work: a compact, readable state description; a list of what a player can do now on the map (the rules only answer "why not"). Dev tooling, kept out of `src/`.
**Cinematics between missions** (user idea, 2026-09-25): image-to-video (Wan 2.2 / LTX-2.3, both installed) from style-consistent key art; story from the user (the Ton'Arilliet story is ready material). · procedural maps · final art direction and battle figures · audio · desktop packaging (Electron preferred over Tauri for WebGL on Linux).
