# Decisions

Append-only. Terse: date, decision, why. A later entry can overrule an earlier one.

**2026-09-25 — Stack: TypeScript + Three.js + Vite, Vitest, Playwright.**
The user asked for an engine that handles 3D and doesn't need an editor, and left the choice to Claude. Why this one:
- All code, no editor, no binary scene files. Everything is diffable text.
- Claude can check its own work: `pnpm shot` renders headlessly and saves a PNG that Claude can look at. That feedback loop matters more than engine features for a project built mostly by an AI across many short sessions.
- A turn-based game has low performance needs. HTML/CSS handles the heavy UI (squad screens, Capitol, tooltips) far better than any engine's widget toolkit.
- Huge training corpus and a stable API. Rejected alternatives: Bevy (breaking API changes every release, slow compiles), Godot (editor-centric scenes, and three earlier attempts on it), Panda3D/Ursina (thin ecosystem for 3D + UI).
- Desktop packaging later via Tauri or Electron if wanted.

**2026-09-25 — Architecture: pure rules core.**
`src/rules/` holds game state as plain serializable data and pure functions `(state, action) → state`. It imports no three.js, DOM, or view code. `src/view/` renders the state and turns input into actions.
Why: the design has no RNG, so the rules are a pure function by nature. This gives tests without rendering, AI that simulates moves, replays, undo, and save/load as `JSON.stringify`. It also avoids the object graphs with back-references and event wiring that sank the C# attempt (`prior-attempts.md`).

**2026-09-25 — Process: playable milestones, not a card board.**
`roadmap.md` holds a few milestones that each end in something playable. `status.md` is the per-session handoff. No kanban: the 40+ card board of the last attempt cost a lot of context to read and grew process for its own sake.

**2026-09-25 — Provisional rules are allowed and marked.**
Where the design is silent (see `design/combat.md` "Open"), implement the simplest rule, mark it provisional in the data/code, and add it to `questions.md`. Don't stall, and don't invent elaborate mechanics.

**2026-09-25 — Claude commits at natural checkpoints (user: "yes go for it").**
Commit when a chunk of work is done and tests pass, with descriptive messages. Never push.

**2026-09-25 — M1 is a Jilliath mirror match.**
The user has no preference. A mirror match uses only units that are already specced, so no enemy content has to be invented. Neutral monsters come later, with the user.

**2026-09-25 — Abilities are the core of combat, not an add-on.**
Units are sets of modular abilities that can change at runtime; the basic attack is itself an ability. See `design/abilities.md`. M1 builds combat on this model from the start, using the Jilliath melee line as the test set.

**2026-09-25 — Initiative sets both turn order and action count.**
The user allowed either option. Chose this one because it's more novel and the canon melee line already assumes it (the Punisher's -10 initiative "may cost an action"). Formula `floor(init/15)`, min 1, with interleaved passes; see `design/combat.md`. Balance risk accepted; the divisor is tunable.

**2026-09-25 — Targeting: per-ability tile patterns, relative (5x5) or absolute (3x3).**
From the user's suggestion; geometry in `design/combat.md`.

**2026-09-25 — Art: "gothic reliquary".**
Muted world, faction mana color as the only saturated accent, organic and made things fused, chiaroscuro. See `design/art.md`. No copying of named artists.

**2026-09-25 — Notes are written continuously.**
Update status with every commit, not at session end (user's suggestion; sessions end unpredictably).

**2026-09-25 — Skirmish squads obey branch investment.** _Superseded by per-line forks, below._

**2026-09-25 — Hovering a target previews the exact outcome.**
No RNG means the preview can run the real rules on a copy of the state and show exactly what will happen. This is a design strength of no-RNG, so the UI leans on it.

**2026-09-25 — Playtesting is automated too.**
`pnpm playtest` drives real clicks in a headless browser (`?debug` exposes tile screen positions). Use it after UI changes; it found the initiative-tie bias.

**2026-09-25 — Order: gameplay first, one art spike, then a vertical slice.**
Keep greyboxing with placeholders (M3, M4). After M3, one time-boxed art bake-off (a single unit through each route) to de-risk the look and the pipeline. The full pipeline, the style LoRA and production come with the vertical slice. Why: rules and unit lists still change and art made now would be redone, but the art route should be proven before anything depends on it. The user agrees not to model units by hand in bpy; bpy is for placeholders and for processing generated assets.

**2026-09-25 — Rules architecture: traits, effect definitions, damage pipeline (`design/architecture.md`).**
The user asked for a foundation that handles complicated mechanics ("bad architecture was one of the fundamental killers of the other projects"). Passive abilities and effects share one hook interface; effects are definitions with stacking, lifetime and visibility; damage is a typed packet through one ordered pipeline; abilities carry params and tags; the world passes context into battles as effects. The engine, AI and view name no mechanic. Verified: the old tests and the preset battle matrix are unchanged, and new tests cover the Blacksmith and a fire-only shield.

**2026-09-25 — The AI runs in a web worker.**
Map decisions reached ~0.27 s on a fast machine. Plain-data state crosses into the worker unchanged; forecasts are memoised per decision.

**2026-09-25 — Forks are per line, chosen for free (m8; design in `design/pillars.md`).**
Any unit with two evolutions is a fork; a side's commitment maps fork → branch. The user rejected faction-wide doctrines ("per tree, not locked across trees") and gold-gated evolution. Implementation choices: the choice is a free world action available any time on your turn (the Capitol panel lists every open fork), and when a unit reaches an undecided fork a prompt asks at once, warning that every unit of that type follows; "Decide later" snoozes it for the turn. The skirmish setup no longer picks a doctrine: the branches your placed units took become your choices, and two branches of one fork in one squad is refused with a reason.

**2026-09-25 — Marks: a unit's lasting differences are effects with a source (m8).**
The user wants a "track record" per unit: what makes it differ from baseline and where each difference came from (upgrades, holy water, the leader tree). A squad member carries `marks` (an effect seed plus its source); they enter battle as ordinary effects, survive death into the graveyard, and the unit card lists them. The leader tree's bonuses aren't stamped as marks but derived from the leader (`world/record.ts` `recordOf`), because they belong to whoever leads; the card shows both the same way. Upgrades bought at the Capitol will be marks.

**2026-09-25 — Percentage bonuses add a share of the base stat.**
Stat hooks run in battlefield order, so a multiplier applied before a flat bonus (Congregation) gave a different number than after. Adding `base × percent` is order-independent and matches D2.

**2026-09-25 — Hotkeys live on ability definitions.**
The user asked for D = Defend and W = Wait. A behavior's optional `hotkey` is its default binding; the battle view looks keys up among the legal actions and never names an ability. A settings menu later overrides them.

**2026-09-26 — Art is assigned by slot, with fallbacks; the style is not Claude's to perfect.**
The user: getting the style exactly right isn't the job now (it's a taste call for them, and `pnpm art` can restyle everything later); what matters is a strategy for assigning assets. Slots are keyed by content ids, files are discovered at build time, missing art falls back to family defaults and then placeholders, and the missing list doubles as the generation queue. Rules stay pure: assets are a view concern.

**2026-09-26 — Saves are snapshots of the world, refused across versions.**
The world is plain data, so a save is the world as JSON plus a header (format, version, time, seed). Snapshots rather than a seed-plus-actions replay: replays break whenever rules change, and rules change constantly. No migrations (no backwards compatibility, per the user): a save from another `SAVE_VERSION` is refused with a reason, and a snapshot test of the world's shape forces the bump. Saves hold the map only; the menu refuses mid-battle ("finish the battle first"). Storage sits behind a `SaveStore` interface (localStorage now), so a desktop build would only swap the store. Autosave at the start of each of the player's turns.

**2026-09-26 — Roles and direction (sparred with the user).**
Claude owns the roadmap, architecture, systems, AI and what to build next; the user owns unit and faction designs and their looks, playtest verdicts at milestone ends, and vetoes. Next goal: a vertical slice, one complete Jilliath vs Ral-Vitahl match you can finish against the AI. Order: paper standees (a stand-in for battle figures, not the shipping look) → a game you can finish (map AI that plans, no cold wars, reachable win conditions, sim-tuned balance) → faction content as the user designs it → spells and mana. Browser for now; if a desktop build comes, prefer Electron over Tauri (Linux webviews are weak at WebGL); the pure rules and the SaveStore interface keep that cheap.

**2026-09-26 — The map AI lays sieges (m13).**
Games stalled for two reasons besides finite XP: the AI never went home to refill thin warbands, and it never raised a leader while threatened (so a side could lose its army and turtle forever). And no single warband is forecast to beat a Capitol. Now: warbands short of 2+ units go home to refill when gold allows; a leader is raised under threat only with the gold to fill its warband at once (a lone new leader stands in front of the garrison and only feeds XP); idle warbands stage within reach of the enemy Capitol where no enemy can beat them; and each decision simulates a **siege chain** (every warband that can reach the Capitol this turn attacking in turn, weakest first or strongest first; wounds carry over) and opens it only if the chain brings the Guardian down. Failed solo assaults are avoided on purpose: a garrison that wins earns XP and evolves. Result with provisional camp regrowth: Jilliath mirror 8/8 games end (turns 21–66, 4–4); cross-faction 13/16.

**2026-09-26 — Nexus spell charges: scheme replicates, overload overloads (m14).**
The user's idea (casters are researchers running on batteries; enhance spells by spending finite charges, after MTG Izzet's overload and replicate) and Claude's mapping (scheme = replicate: precise, every target chosen; overload = overload: wide, indiscriminate), agreed by the user. One pool per caster; no mid-fight recharge for now. Engine: charges are unit data, enhancements are params, each variant is its own legal option, so the AI (which ranks replicate copies by single-cast value rather than trying every combination) and the exact hover preview handle them without special cases. A cancel (Counter) spoils a whole replicated cast.

**2026-09-26 — Levels past the end of a line (m15; the user's D2 rule).**
A unit with no evolution left keeps leveling at its tier's fixed XP cost. A level is data on the squad member (it survives death, like marks) and enters battle as a derived "veteran" effect: a percentage of the base stats, so higher tiers gain more per level, and the track record shows it. A unit waiting at an undecided fork doesn't level. Side effect: Nexus's tier-2 units keep growing, and cross-faction stalemates fell from 3 to 1 in 16 games.

**2026-09-26 — Player colors mark ownership; faction colors stay in the art (m16, user's playtest).**
The user asked for WC3/AoE2-style colors so two Nexus players aren't both teal. Chosen in the setup from eight; defaults are each faction's own color, and a second player of the same faction gets the first free color no faction owns (so a second Jilliath isn't mistaken for Nexus). They color HP bars, the turn queue, labels, standee frames, statue trim and map rings; the art isn't hue-shifted (a Zealot's red hand means something). Part of the world, so saves keep them.

**2026-09-26 — City tiers, and the AI rallies for sieges (M17 step 3).**
Every city has a tier (the Capitol too, starting at 1): garrison slots and a small armor bonus for defenders ("fortified": the garrison, and a warband defending in its own city), bought with gold. The Guardian takes no slot. Starting the Capitol at a higher tier gave it walls from turn 1 and stalled AI games, so every city starts equal. The AI also got two fixes found in simulation: it refills a warband missing even one unit (a 4/5 warband used to block both refilling and raising new warbands, forever), and it **rallies**: if a chained assault would win with all healthy warbands gathered around the enemy Capitol, they stop chasing other targets and close in. Jilliath mirror: 8/8 games end again (turns 19–90); cross-faction 6/8.

**2026-09-26 — Nodes belong to the nearest city (M17 step 5).**
Nodes moved out of cities into a world-level list with levels; ownership is computed (nearest city, Capitols included), so destructible cities, if they come (#42), would hand nodes to the next nearest city with no extra rule. Each Capitol has its own mine for symmetry. The map draws a thin link from each node to its city in the owner's color.

**2026-09-26 — Any number of players on the map; battles stay two-sided (M18).**
The user asked to make sure more than two players stays possible. The code assumed two everywhere (pairs of gold, factions, choices…; "the other side" as 1 − side; a player's number doubling as its battle side). Now the world holds a list of players; turns go round the table (a round ends when the order wraps; eliminated players are skipped); a battle's attacker is side 0 and its defender side 1, with the engagement naming the player on each. A fallen Guardian eliminates its player (warbands disband, other cities fall neutral with their garrisons); the last player standing wins. Maps place up to six Capitols on the ring's corners (two players: the same opposite corners as before), with more neutral sites per player. The screens stay two-player (you against one AI) for now; `PLAYERS=a,b,c pnpm sim:world` runs bigger games, and `tests/players.test.ts` covers three players.

**2026-09-26 — Fog of war lives in the rules, and everyone plans from what they know (M19).**
Canon (pillars.md): unexplored hidden; explored-not-visible shows last-known state. Each player carries its explored hexes and a memory (copies of the cities, lairs and nodes as last seen) in the world, updated after every action and battle; `knownWorld(world, player)` is the world as that player knows it (own things as they are, other warbands only in sight, places as remembered, unexplored terrain read as plain). The map AI, the map view, hover previews and forecasts all use it, so the AI can't cheat and the view can't leak. Warbands aren't remembered (they move on). A march is planned on the known world and walked a hex at a time: it stops when it sights a warband it hadn't seen or when its way or goal turns out different (the next hex is always in sight, so nothing is ever walked into blind). Losing a city is news wherever it is. The AI explores when it knows of nothing to do. Nodes now store their city (the nearest, fixed at map creation) so a node's city is simply unknown until found; if cities ever become destructible (#42), reassigning nodes becomes an explicit step. Sight radii are provisional (#49). Measured: 8/8 two-player AI games end (4–4), about 10 s each.

**2026-09-26 — Secret effects are seen by the side that cast them; the battle AI looks past free actions (m21).**
The Etherborn's Negate can go on an ally, so "hidden from the bearer's side" no longer fits: an effect's visibility is now `public` or `secret`, and a secret one is known only to the side of the unit that applied it (effect events carry their source for the mask). The greedy battle AI scored each action by the position right after it, so a free action that only pays off on the next one (Combustion) never won; an action that leaves the same unit's turn going is now worth its best follow-up, two steps deep. Counter and Negate are used more sensibly as a side effect.

**2026-09-26 — Only the duality fork is labelled (user).**
Fork labels name the side of a faction's duality a branch stands for (Faith preserves/consumes, Scheme/Overload). Later forks (the Zealot's Punisher/Fanatic, the Justiciar's Etherborn/Backlasher) come from one side, so a label there adds a term the faction doesn't hold; they show by unit name only.

**2026-09-26 — Spells: a canon system with placeholder spells (M25).**
Pillars fix overworld spells paid in typed mana, aimed at an ally, an enemy, a tile or an area. Built: typed mana per faction color, mana from the Capitol and a mana node, learning at the Capitol, casting at anything in sight (fog applies), once per spell per turn. A spell is data (`rules/spells.ts`): a target kind, a radius, and an effect that is either map damage (lethal since 2026-09-27, the user's call: it kills as a battle would) or an enchantment: an effect seed a warband, or a city's defenders, bring into battles for a number of turns (the architecture's "overworld spells buffing a warband for N world turns"). The four spells are placeholders after each faction's stated direction, awaiting the user's designs (#51).

**2026-09-26 — Sims are smoke tests until both factions have their lines (user).**
Jilliath had only its melee line, so cross-faction win counts compared a melee-only army with three lines and said nothing about balance. Until both factions have their lines, `sim:world` answers "do games end, does the AI act, does nothing crash", and nothing more.

**2026-09-26 — Balance by tuning units, never Leadership (user).**
Every faction keeps the same starting Leadership; unequal armies are evened out by unit numbers alone (not by price either: a warband's size is capped by Leadership, so a dearer unit is simply a stronger slot). `pnpm sim:t1` plays the tier-1 squads of both factions against each other, both seatings; the first pass cut the Custodian's shield and the Apprentice's Burst (#52).

**2026-09-27 — Sims must be fast (user: "a symptom of these sims needing work").**
The sims have no animation; their time was the AI replaying the same battles. Profiled and fixed: a hand-written battle copy (structuredClone was a quarter of all time), per-action caches of trait lists (Congregation's bonus made every stats query walk the field twice over), battles played out once per game through a memo the caller keeps, and the sims bundled with esbuild. Three games went from 80 s to 10 s with identical results. `pnpm sim:many` runs games in parallel. A battle round limit (30, provisional) came with it: stalemates crashed the forecasts.

**2026-09-27 — Retreat: every faction unit can flee a battle (the user's surrender design from the Godot attempt).**
Retreat is a basic main action (R): the unit turns its back and loses its next turn, then leaves the battle alive at the start of the one after, keeping its health; it isn't a kill, so the enemy gains no XP for it. Guardians and neutrals lack it; defenders in a city are cornered and can't. A side with nobody left on the field loses as usual. The AI doesn't retreat yet. Also: Resolve now (D2's auto-resolve) plays a battle to its end at once.

**2026-09-27 — The map AI guards its Capitol and gangs up (momentum, user's playtest).**
Losing AI Capitols fell holding only their Guardian (user: "less the Guardian being bad than bad decisions"). The AI now fills its Capitol garrison with spare gold once its warbands are full. And it blitzes: an enemy warband that none of its warbands beats alone, but two or more can reach this turn, is attacked in a chain (after spells) when the chain destroys it; sieges use the same chain and now count as won when the Capitol changes hands, which also fixes sieges in games of 3+ players. Mirror games went from a median of turn 32 to 43. The earlier 12–4 seat split was noise: 26–22 over 48 more seeds.

**2026-09-27 — The battle AI retreats its veterans from lost fights.**
When its side's strength (health weighted by damage) falls under 15% of the enemy's, a tier-2-or-higher unit that can flee does. Measured over 96 games each: letting every unit flee at 35% doubled game length (median turn 83, 4 cold wars) and halved Jilliath's wins against Nexus (13 → 6); veterans only, at 15%, keeps Jilliath at 13 and games at a median of turn 48 (was 43), 1 cold war.

**2026-09-27 — Music by faction (the user's idea).**
On the map you hear your own faction's theme; in a battle, the attacker's faction's battle tracks, one after another across battles (Inquisition attacks Nexus: Inquisition music). Tracks are files at `assets/audio/music/<faction>/map.ogg` and `battle-<n>.ogg`; a faction without its own falls back to any. The musical direction per faction follows the canon (Jilliath: sacred and severe; Nexus: arcane and cold, not sci-fi) and is provisional.

**2026-09-27 — Items: the 2024 slots, effects as marks.**
Leaders carry items in the user's 2024 slots (headgear, body armor, two utility, a banner) and a bag. An item is data (`rules/items.ts`): effects the leader's own unit brings into battle, effects every warband unit brings (banners), and whether it pays for a revival (the Ankh, canon). Worn effects enter battle through the unit's track record (a mark with an item source), so the engine needs nothing new. Only the Ankh is canon; the rest are placeholders (#53).

**2026-09-27 — M37: a review, then a cleanup before new systems (user: "read and rate your old code, rewrite what isn't future-proof").**
Four reviews found six bugs (spell deaths written twice, `knownWorld` leaking other players' state, one-shot marks firing per target, granted abilities outliving their grant, the city screen showing the AI's recruits, and a node-mark question that turned out not to be a bug) and a list of debt. Fixed or restructured before M38 because the new structures build on them: map deaths, the map AI (planners), actions' city lookup, the view's buttons and keys, GPU disposal, playtests (one harness, waiting on state: verify 28 s). Left open on purpose, with reasons, in `engineering.md` ("Debt").

**2026-09-27 — Map structures: visited by standing on them (M38, the user's three kinds).**
Mercenary camps, merchants and mage merchants are places on the map (`rules/structures.ts`, `world/structures.ts`), not cities: nobody owns them, they don't block movement, and a warband trades there by standing on the hex (D2's shops; a march that ends on one opens it). One of each per map, on contested ground so no player has them to itself. Mercenaries are hired once (D2); a merchant's stock sells out and grows with what it buys; the mage merchant sells *neutral* spells, a third spell list next to the factions', cast with the caster's own mana, so the Capitol's spell list stays the faction's. Structures are remembered under fog like lairs, stock included. Every stock, price and count is provisional (#54). The map AI trades when it stands on one with spare gold, marches to one worth visiting, and fills a thin warband at a nearer mercenary camp instead of going home.

**2026-09-27 — Structures, second pass (the user's answers to #54).**
Mercenaries never run out. Merchants sell staples always (potions, the first consumables: used from the leader's bag on the map) and a few wares picked by deterministic noise on the merchant and the turn, replaced every few rounds, so they differ between merchants and over a game; sold items join the wares until the next change. The count scales with the map: one of each kind per 60 hexes; the first of each on contested ground, extras anywhere 3+ hexes from every Capitol. Noise moved to `rules/noise.ts` for the map and the merchants.

**2026-09-27 — Map sizes at setup (M40, user).**
Four sizes (radius 5–8); the default grows with the number of players (five or six now get Large, not Medium). Neutral counts are defined on the default size for the player count and scale with area on the others, so default maps are the same as before for two to four players. Sims take `SIZE=`, routes `&size=`.

**2026-09-27 — Answers from the questions review (user).**
- Destructible cities: no.
- Leader tree points come from unit experience only (as now); Warlords-style quests maybe, far off, not sold.
- The fourth line is a per-faction "joker" concept, not ranged (`design/pillars.md`).
- Vexumphat: cheap resurrection and the graveyard upgrade from the start, among other themes (`design/factions/vexumphat.md`).
- The Capitol screen gets a home view and a right-side tab menu (`design/capitol-screen.md`).
- City healing is +5% per city tier, not a flat share.
- `questions.md` now holds only what the user must decide; provisional values moved to `provisional.md`, answered and stale questions were dropped (their answers live in the design docs and here).

**2026-09-27 — The city screen's home view is the map itself, close up (M41).**
The user wants to see the city when entering it (HoMM5, AoE3's home city). Until there's art for a city scene, the home view flies the map camera in close on the city and lets the map show through; the rail and a summary card sit over it. The fourth archetype is now "joker" in the rules (was "ranged", which had no lines).

**2026-09-27 — Map models load from slots (M42).**
Like art and sound: `assets/models/<kind>/<id>.glb` found at build time, fallback chains (a Capitol per faction, then any Capitol), and the hand-built shapes stay as the placeholders where no file exists. Loaded models are shared between places, so `discard` leaves their GPU resources alone. The spike showed static props from concept images are good enough to pursue (`design/asset-pipeline.md`).

**2026-09-27 — Battles are fought where they happen (M44).**
The arena takes the terrain of the hex fought over (its ground texture, a ring of its props behind and beside the lines) and what stands there as a backdrop (a city's or Capitol's walls, a dungeon's mouth), under the map's sky. The backdrop comes from the hex, not the defender's kind, so a warband defending its own city fights before its walls. Skirmishes from the setup screen are on open plains. Prop counts and sizes are a provisional look.

**2026-09-27 — The city view is a framed painting until the montage exists (M46, the user's sketch).**
The map close-up stand-in is gone: the city screen opens on a painting of the city from the inside (per faction's Capitol, and one for neutral cities) in the UI kit's frame, drifting slowly, with the city's summary over it; the tabs sit in a framed column. The montage the user wants (the city's own scene, people walking, like Unreal Gold's intro) replaces the painting later.


**2026-09-28 — Choose the engine by a bake-off, before the art push.**
The user doubts three.js can deliver the lighting, foliage and animation quality wanted, and asked for an evaluation before assets are made in bulk. Unreal is out (editor-bound and binary, slow for Claude to build and test in); Godot 4 is the real alternative (installed). The bake-off builds one scene in both with the same glTF assets. What carries over if we switch: the design, the asset pipeline and every model (glTF), the tests as a specification. The rules (~6.5k lines of TypeScript) would be rewritten in C# or GDScript, which is mechanical; the view (~6.5k lines) would be rebuilt. The cost grows with the view, so the bake-off comes soon.

**2026-09-28 — Bake-off result: stay on three.js unless the user's eye says otherwise (M53).**
The same scene in both engines (`spikes/engine/README.md`). Tuned, three.js comes close to Godot outdoors; Godot's edge is real-time global illumination, fog into the sky, and tooling (editor, animation state machines, particles). Aiming a body is the same 20 lines in both, and frame rates are equal like for like. Switching would mean rewriting the rules, the view and the playtest harness, and losing browser play and the HTML UI. Revisit if the animated-units spike or a lit interior (the city montage) runs into what three.js lacks; baked lightmaps and the WebGPU renderer's effects are the three.js answers to try first.

**2026-09-28 — Round 2: three.js holds up in a lit cave; WebGPU is the way forward (M54).**
The user's worry: lighting (a bonfire in a cave) will decide whether the game is ever good. The same cave in both engines (`spikes/engine/README.md`): three.js on its WebGPU renderer with voxel GI, godrays and bloom looks alike to Godot's SDFGI, volumetric fog and glow, at half the frame rate on the integrated chip. Plan, pending the user's eye: keep three.js, move the game's rendering to `WebGPURenderer` when lighting work starts, and keep `src/rules/` engine-free so a port stays possible (the user's suggestion).

**2026-09-28 — The map's ground is one continuous landscape, not hex slabs (M56).**
The user sensed something wrong with the tiles without naming it. The separate slabs (gaps, sides, a texture stamped per hex) read as tokens. Now one mesh covers the map and a margin beyond it; each point's height and terrain blend come from the hexes around a noise-warped position, so borders wander organically. The grid, fog of war and highlights live in the ground's shader, read from a per-hex state texture, so changing them costs no geometry. Unexplored ground lies flat under a neutral slate, as the slabs did, so the fog gives nothing away. Picking is a ray against the ground, then the hex of the hit point. Grass tufts (not blades: blades are sub-pixel from the map camera) grow by terrain, not on water or around places.

**2026-09-28 — The game renders with WebGPU (M57).**
After the bake-offs (three.js stays; its new lighting is WebGPU-only), the stage moved to `WebGPURenderer` with a TSL post-processing chain, and the landscape's shaders to TSL node materials. It falls back to WebGL 2 on its own where a browser lacks WebGPU, so no player is locked out. Tests run WebGPU headlessly on the integrated Radeon. The look is unchanged; lighting upgrades build on it.

**2026-09-28 — Bounce light on the map, not in battles (M58).**
The map gets screen-space global illumination (SSGI), denoised within each frame so still pictures stay sharp. Temporal filtering (TRAA) softened the map noticeably in a still frame. Battles keep GTAO: bounce light washed out the pale paper standees and haloed them. A scene opts in with `scene.userData[BOUNCE_LIGHT]`. The sun is lower and warmer, and its shadow camera is fitted to the map's size.

**2026-09-28 — Wild land around the map; clouds over the unexplored (M59).**
The margin past the map's edge is scenery: meadow, forest and mountains, always shown, never picked, nothing tall on the camera's side. With the world lit around it, the unexplored map read as a grey hole, so unexplored land now lies under drifting clouds (animated noise in the ground shader), Civilization style. It still hides terrain, and it still lies flat.

**2026-09-28 — Portals are neighbors in the movement graph; a warband on one sees its other end (M63).**
The user turned the brainstorm's ferry into HoMM3-style portals: map structures nobody holds. The pathfinder, reachability and every AI route use `exits()` (neighbors plus a portal's twin), with an A* estimate that counts portal shortcuts so paths stay cheapest. Fog hides a portal until both ends are explored. The march's rule that its next hex is always in sight broke at a portal (the far end can be out of sight), which let an AI order the same blocked step forever; now a warband standing on a portal sees one hex around its other end.

**2026-09-29 — The wild land past the edge takes the fog of the nearest edge hex; the fog glows dark; dusk is the map's light (M69).**
The user saw a three-hex band around the map unfogged at the start of a game and took it for a bug: it was M59's scenery, left always visible. Now each outside cell, and the props on it, follows the nearest edge hex of the map (`edgeHexOf`). The clouds over unexplored land are emissive and unlit (lit, the dusk sun and bounce light brightened them whatever their color) and darker, as the user asked. Dusk is the default mood, the user's choice.
