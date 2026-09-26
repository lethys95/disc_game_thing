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
