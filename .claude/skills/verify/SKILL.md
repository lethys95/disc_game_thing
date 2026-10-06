---
name: verify
description: Run, screenshot, and play-test the disc game to verify a change actually works in the browser. Use after any change to src/view/, after rules changes that affect play, or when asked to run, launch, or screenshot the game.
---

# Verifying disc

Tests prove the rules; only a rendered frame proves the view. Always look at the PNG you produce (Read it). Don't claim visual work is done unseen.

## Order of checks
0. `pnpm verify` runs 1–4 in one go. Use it before calling anything done.
1. `pnpm check`: typecheck + unit tests. Must be green first.
2. `pnpm shot <out.png> "<route>"`: headless render. Exits non-zero on any console error or page error.
3. `pnpm playtest [name…]`: every click-through playtest (battle, map, save, city, settings, setup, spells; setup now goes title → new game → march, then the codex and credits) against one server and browser, each in a fresh context; name some to run only those (`shots/playtest-*.png`, `shots/map-*.png`, `shots/failed-<name>.png` on a failure).
5. `pnpm sim`: AI-vs-AI matchup matrix of the presets, for balance changes.
6. `PLAYERS=<preset|nexus[:scheme|overload]>,… pnpm sim:world [seeds…]` (two or more players): whole AI-vs-AI games (winner, turns, battles, gold); a "cold war" means neither side could win a fight its forecast allows.

## Routes (URL params, combinable)
| Param | Effect |
|---|---|
| (none) | title screen |
| `?newgame`, `?skirmish`, `?codex`, `?credits` | that screen of the title's (the skirmish is the old setup screen: build two squads, fight one battle) |
| `?fight` | skip setup, battle with the preserve vs punishment presets (`?fight=nexus`, `?fight=nexus:scheme`, `?fight=nexus:overload`, `?fight=bandits` for other enemies; `&side=1` plays the defending side, drawn on the left; `&terrain=forest|hills|mountain` and `&backdrop=capitol|city|dungeon` set where it's fought) |
| `?steps=N` | fast-forward N AI actions before the first frame (no animation) |
| `?auto=1` | AI plays both sides |
| `?map&seed=N` | skip setup, straight onto the map (both sides uncommitted Jilliath; `?map=nexus` makes the enemy Nexus; `&xp=100` starts your units and leader with that XP, e.g. to see the fork prompt or spend leader points; `&capitol` opens the Capitol screen (`&capitol=garrison|research|spells` on that tab), `&leader` the first warband's leader screen, `&structure=mercenaries|merchant|mage` puts it on that structure with its screen open, `&reveal` explores the whole map, `&players=N` adds AI players, `&size=small|medium|large|huge` picks the map size) |
| `?fast` | animations and AI pauses ×0.1 (for scripted runs) |
| `&mood=day\|contrast\|overcast\|dusk\|grim` | the map's light and grade (`MOODS` in `view/map.ts`), for the user's mood choice |
| (setting) | Settings → Display → "Show the frame rate": a corner readout of frames per second, triangles, the GPU backend (WebGPU or its WebGL 2 fallback), bounce light on/off; stored with the settings. `pnpm tsx scripts/perf.ts [route]` measures it headless (integrated Radeon), bounce light on and off |
| `?debug` | exposes `window.discDebug` (below) |

`window.discDebug`: `tileScreen(side,row,col)` (a battle figure's chest in client px), `hexScreen(q,r)`, `leaderHex(side)`, `capitolHex(side)`, `log()`.

## Gotchas
- Click figures at chest height (`tileScreen` does this). A tile's center is often hidden behind a nearer figure from this camera.
- Screenshots catch transient frames. If something looks wrong, check whether it's mid-animation before chasing it (and vice versa: the stray "−23" was a real bug).
- New playtests: a module in `scripts/playtests/` exporting a `Playtest`, listed in `scripts/playtest.ts`. Wait on state (`t.awaiting("battle" | "map")`, a log entry, a selector), never on time; `page.evaluate` callbacks must not declare named inner functions (esbuild injects `__name`, which the page lacks).
- The user reaches the box over Tailscale: `pnpm dev --host`, then `http://<tailscale name>:5173`.
