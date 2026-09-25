---
name: verify
description: Run, screenshot, and play-test the disc game to verify a change actually works in the browser. Use after any change to src/view/, after rules changes that affect play, or when asked to run, launch, or screenshot the game.
---

# Verifying disc

Tests prove the rules; only a rendered frame proves the view. Always look at the PNG you produce (Read it). Don't claim visual work is done unseen.

## Order of checks
1. `pnpm check`: typecheck + unit tests. Must be green first.
2. `pnpm shot <out.png> "<route>"`: headless render. Exits non-zero on any console error or page error.
3. `pnpm playtest`: clicks through four real player turns in a battle (`shots/playtest-*.png`).
4. `pnpm playtest:map [seed]`: marches on the map, auto-battles the fight, returns (`shots/map-*.png`).
5. `pnpm sim`: AI-vs-AI matchup matrix of the presets, for balance changes.
6. `A=<doctrine> B=<doctrine> pnpm sim:world [seeds…]`: whole AI-vs-AI games (winner, turns, battles, gold); a "cold war" means neither side could win a fight its forecast allows.

## Routes (URL params, combinable)
| Param | Effect |
|---|---|
| (none) | setup screen |
| `?fight` | skip setup, battle with the preserve vs punishment presets (`?fight=nexus`, `?fight=bandits` for other enemies) |
| `?steps=N` | fast-forward N AI actions before the first frame (no animation) |
| `?auto=1` | AI plays both sides |
| `?map&seed=N` | skip setup, straight onto the map (both sides uncommitted Jilliath; `?map=nexus` makes the enemy Nexus) |
| `?fast` | animations and AI pauses ×0.1 (for scripted runs) |
| `?debug` | exposes `window.discDebug` (below) |

`window.discDebug`: `tileScreen(side,row,col)` (a battle figure's chest in client px), `hexScreen(q,r)`, `leaderHex(side)`, `capitolHex(side)`, `log()`.

## Gotchas
- Click figures at chest height (`tileScreen` does this). A tile's center is often hidden behind a nearer figure from this camera.
- Screenshots catch transient frames. If something looks wrong, check whether it's mid-animation before chasing it (and vice versa: the stray "−23" was a real bug).
- New playtest scripts: copy `scripts/playtest.ts` (it starts vite itself; no dev server needed).
- The user reaches the box over Tailscale: `pnpm dev --host`, then `http://<tailscale name>:5173`.
