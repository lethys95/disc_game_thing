# Engineering notes

How the code is laid out and what has bitten before. Keep it short; add a gotcha when one costs real time.

## Map
- `src/rules/`: pure, deterministic, plain data. `battle.ts` (engine: passes, attack pipeline, effects), `abilities.ts` (behavior registry; behaviors see the engine only through `Ctx`), `units.ts` (canon unit data), `ai.ts` (greedy: simulate every legal action and score it), `doctrine.ts`, `hex.ts` / `map.ts` (seeded generation, A*), `world.ts` (leaders, cities, gold, recruiting, elevation, engagements, XP/graveyard, map AI), `progression.ts` (XP value, evolution), `doctrine.ts` (commitments, allowed units).
- `src/view/`: `stage.ts` (the one renderer/camera/bloom/labels/tween loop), `scene.ts` (`BattleScene`), `map.ts` (`MapView`), `app.ts` (battle controller), `campaign.ts` (map controller), `hud.ts`, `setup.ts`, `figures.ts` (placeholder statues), `text.ts` (rules text shown in UI; mirrors the design docs).
- Imports use `#rules/*` and `#view/*` (package.json `imports`), never `../`.

## Rules-engine conventions
- `applyAction` / `applyWorldAction` structuredClone the state, mutate the draft, and return `{ state, events }`. Events drive animation and the log.
- `applyAction` has **already advanced** to the next slot when it returns (start-of-turn bleed, stun skips). Tests about one action should assert on the returned events, not on the state after.
- Add an ability: behavior in `abilities.ts`, text in `view/text.ts`, a test. Add an engine hook only when a real ability needs it.
- Anything the design doesn't specify is marked provisional in code and listed in `docs/design/combat.md` or `docs/questions.md`.

- The map AI and the map's forecast both use `autoplay` (battle AI on both sides) to predict fights. It's deterministic, so a forecast is exact *for AI play*; a human can do better.

- Hidden information (the Justiciar's mark) is masked in the view, not the rules: `src/view/secrecy.ts` filters events and gives previews a battle without the player's own marks. Every log and animation path must go through it. The AI sees everything.

## Gotchas
- **CSS2DRenderer positions labels through `transform`.** A CSS animation on `transform` silently overrides it (every float drew at the top-left). Animate an inner element.
- **`[hidden]` loses to author `display:` rules.** A global `[hidden] { display: none !important }` is in `style.css`; keep it.
- CSS2DRenderer only updates labels in the scene it renders; `Stage.show` hides the outgoing scene's labels.
- A local variable named like a module helper (`key`) shadowed it: tsc reports "not callable".
- pnpm needs build scripts approved (`pnpm approve-builds <pkg>`); esbuild is approved.
- TypeScript is v7 (`tsc`); config is strict with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
