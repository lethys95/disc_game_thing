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
