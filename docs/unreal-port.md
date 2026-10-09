# Converting disc to Unreal Engine 5: an estimate

_2026-10-09. The user asked for an estimate, with no code changes. Nothing is decided. Sizes are a snapshot of this
date._

## In short
The port is feasible. It means a rewrite, not a conversion: no line of TypeScript survives. The design, the board, the
art and audio pipelines, every asset and the rules' architecture carry over. My estimate is **three to six weeks of
sessions** to get back to today's game, at the pace the game was built (about two weeks, 559 commits, from 2026-09-25).
New units would stall for most of that time. The interface is the largest part, not the rules. In exchange, Unreal
handles the work this repo would otherwise do by hand: bounce light, volumetric fog, particles, animation state
machines and desktop packaging. It costs browser play and Claude's quick visual loop.

## What exists today
| Part | Size | Notes |
|---|---|---|
| Rules | ~9.7k lines | Pure data and functions: traits, effects, the damage pipeline, world, map AI |
| 3D view | ~3k lines | WebGPU renderer and post chain, generated landscape and its shader, map, battle arena, standees, glTF slots |
| Interface and the rest of the view | ~6.1k lines + ~700 lines CSS | About fifteen HTML screens and panels, sound, saves, settings, AI worker client |
| Tests | ~3.7k lines, 40 files | Mostly rules; some view logic (music, cues, models, settings) |
| Tooling | ~3.8k lines | Screenshots, playtests (Playwright clicking the real UI), sims, sizes, board, art and audio scripts |
| Assets | 48 glb, 151 webp, 32 ogg | PNG masters for all art sit in `art/` |

## What's on this machine
- **Unreal 5.8.3**, Epic's precompiled Linux build, in `~/programs/ue/` (73 GB, with its own clang 20 toolchain).
  Plugins that matter here ship with it: CommonUI, Python editor scripting, Interchange (glTF import), Geometry
  Scripting and procedural meshes, Niagara, StateTree, PCG, Movie Render Pipeline, Pixel Streaming 2, the Automation
  Driver (simulated UI input), Functional Testing, and Epic's experimental Unreal MCP.
- **A working Unreal workflow in another project.** `~/projects/domestic_bliss_vr` has run this same engine since
  2026-10-05, C++ only, driven by Claude. It measured 2–4 s per C++ build and about 7 s to launch. It runs the game
  headless and offscreen with screenshots, runs automation tests from the command line, and builds maps from editor
  Python scripts. Its notes list the traps worth inheriting: Unreal often hangs on quit (wait for a done marker, then
  kill it), CPU Lightmass crashes on 5.8.3 Linux, the editor rewrites `Config/*.ini`, Linux has no Live Coding, and
  Windows packages can't be built from Linux.
- **The earlier disc attempts in Unreal** (`../legacy/disc`, 2024) used Hazelight's AngelScript fork. That needs a
  source-built fork engine, and the installed build isn't one. UnrealSharp (C#) doesn't support Linux yet. So a port
  means C++, and no Blueprint graphs, which are binary files Claude can't read or diff.
- GPUs: two RTX 3090 Ti and the integrated Radeon. GPU 1 belongs to ComfyUI, so Unreal runs on GPU 0
  (`-graphicsadapter=0`), as the other project does.

`decisions.md` (2026-09-28) ruled Unreal out as "editor-bound and binary, slow for Claude to build and test in". The
other project weakens "slow": C++ builds and headless runs are quick. "Binary" still holds for materials, maps and
widget assets, unless scripts generate them (below).

## Part by part

### Rules → C++ (mechanical, with traps)
The architecture ports cleanly. Plain data and pure functions become plain structs and free functions. Trait hooks
become a struct of function objects. The discriminated unions become `TVariant`. Behaviors and effect definitions
become constant registries. The tests are the specification: port them first. Expect the C++ to be 1.3–2× the
TypeScript's length.

Traps that would break determinism or change results quietly:
- **Iteration order.** JavaScript objects keep insertion order, but Unreal's `TMap` makes no promise. 34 places
  iterate `Object.keys/entries/values` and 27 use `Map`/`Set`. Where order matters, iterate arrays or sorted keys.
- **Stable sorting.** `Array.sort` is stable, `TArray::Sort` isn't. 37 sorts, 16 of them in the AI: use `StableSort`.
- **Numbers.** Everything in JavaScript is a double. Integer division, rounding and floors must be written explicitly.
  The seeded generators (map, tarot, noise) must be ported bit for bit.
- **Rules text.** About 225 lines of template strings, mostly `describe` texts and the reasons an order is refused,
  become `FText::Format` or `Printf`.

The way to prove the port: replay the same seeded battles and games through both rules engines and compare the event
logs, until they match. Keep the TypeScript only until then.

Build the rules as a module that depends on Unreal's Core only (no UObjects). The sims can then run as a commandlet
or a small native program, faster than the bundled Node sims. Tests can run headless in seconds.

One alternative is to keep the rules in TypeScript inside Unreal through PuerTS (Tencent's JavaScript/TypeScript
plugin, which lists Linux). It's unverified on 5.8. It adds V8 to the build and puts a script bridge at the heart of
the game. I wouldn't take this route except to save the rules rewrite, and the rules are the cheaper part.

### 3D view → actors, generated meshes, scripted materials (rebuild; the look improves)
- **Lighting and post:** Lumen GI, volumetric fog, TSR, bloom and AO come built in. They replace the SSGI/GTAO/bloom
  chain and the tuning they needed. The lit interiors the bake-off worried about (caves, the city montage) are
  Unreal's home ground.
- **Landscape:** the continuous mesh built from hexes becomes a dynamic mesh generated in C++. Its shader becomes a
  material, and the per-hex state texture (fog, grid, highlights) becomes a texture updated from C++. Materials are
  graph assets, but scripts can build them: `MaterialEditingLibrary` can create and connect expressions from editor
  Python (checked in the 5.8.3 headers). Custom HLSL nodes keep the shader logic as text. The Python script is the
  source of truth; the material asset is its output, as the other project does with maps.
- **Map:** camera, picking (a line trace against the ground, then the hex), and labels over the scene (widgets
  projected to the screen, replacing CSS2D).
- **Figures:** standees become textured planes. The rigged Tripo models planned in `3d-figures` get Unreal's
  animation tooling: state machines, blend spaces, IK Rig, retargeting. That card is where Unreal pays off most.
- **Models:** glb files are imported once by a Python commandlet into assets. Slots keep their naming convention,
  looked up through the asset registry.

### Interface → UMG built in C++ (rebuild; the largest part)
The title, new game, skirmish and setup, settings, credits, codex with links, map HUD and panels, city tabs, research,
spells, items, squad grid, tarot hand, forecasts and hover previews, fork prompts and saves all have to be rebuilt.
- Build the widget trees in C++ (UMG or Slate), with CommonUI for screen stacks and input routing. Avoid widget assets
  made in the UMG designer: they're binary.
- The UI kit's frames become 9-slice box brushes. Sizing in rem from the window's height maps onto Unreal's DPI curve
  times the Interface size setting. Ability text with scaled numbers becomes rich text with decorators.
- Unreal has no CSS. Layout is boxes, grids and size boxes: more verbose, and every screen is written again.
- Embedding the existing HTML through the web browser widget (CEF) is possible on paper. I'd avoid it: it's unproven
  on Linux, and transparency, input and performance over a 3D scene are risky.

### Small parts
- **Audio:** `.ogg`/`.opus` import on Linux (libsndfile; checked). Music buckets and the battle's tug of war become
  two audio components and the same logic.
- **AI worker:** becomes an Unreal task. The worker protocol disappears.
- **Saves:** files under `Saved/` instead of localStorage. The JSON format can stay.
- **Assets:** Unreal can't import WebP (no image wrapper for it), so textures are imported from the PNG masters.

### Tooling → rebuilt around `UnrealEditor-Cmd`
- `pnpm verify` → build, automation tests, an offscreen screenshot, playtests. Shell scripts, like the other
  project's.
- `pnpm shot` and `pnpm sizes` → `-RenderOffscreen` with `HighResShot` at each resolution.
- **Playtests:** the hardest tool to replace. Playwright clicking the real HTML becomes the Automation Driver
  simulating input on widgets, or console-command timelines. Expect more work and more flakiness.
- **Unchanged:** the board, the art and audio scripts (Krea, Tripo, ffmpeg) and the skills, plus one new import step.
- **The visual loop** goes from a reload and a 1–2 s screenshot to about 10–30 s per look (build, launch, render).
  Shaders compile for minutes on the first launch.

## Effort
| Part | Rough effort |
|---|---|
| Rules, their tests, the replay check against TypeScript | 3–5 days |
| 3D view (map, battle, landscape, figures) at today's look | 4–7 days |
| Interface | 6–10 days |
| Audio, saves, settings, AI task | 1–2 days |
| Tooling (verify, shots, sizes, playtests, sims) | 2–4 days |
| Asset import pipeline | ~1 day |
| **Total** | **~17–29 days of sessions** |

The range is wide on purpose. Unreal's API is large, and Claude will sometimes guess at it. The other project's rule
answers that: read the engine source, which ships with the install, instead of guessing. The cost also grows with
every unit and screen added before a port.

## What it costs besides effort
- **Browser play.** No more `pnpm dev --host` over Tailscale with nothing to install. The user plays on this machine,
  or through Pixel Streaming 2 (in the install, untried here).
- **Distribution.** Linux packages build here. Windows packages need a Windows machine or VM. Players need a real
  GPU, where today any browser runs the game (it falls back to WebGL 2).
- **Text as the source.** Maps, materials and any widget asset are binary. Claude keeps them generated from scripts,
  but anything the user tweaks by hand in the editor becomes something Claude can't see in a diff. The repo would need
  Git LFS for assets.
- **Linux engine quirks**, as above: quit hangs, a broken CPU Lightmass, config rewrites, and the Wayland crashes the
  5.8 previews had (worked around with `SDL_VIDEODRIVER=x11`).

## If the user wants it
1. **A spike first** (a day or two), as with the Godot bake-off. The battle arena in Unreal with the same ground,
   backdrop and standees, one Tripo figure animating, Lumen, the battle HUD as C++ UMG, and the headless
   test-and-screenshot loop. Pictures side by side with today's battle, and the measured loop time. This answers both
   "does it look better" and "can Claude work in it" before anything is committed.
2. Rules as a Core-only C++ module, with the tests and the replay check. Rules work in TypeScript freezes from here.
3. Map and battle views.
4. The interface, screen by screen, in the order the playtests walk it (setup, map, battle, city, spells, save,
   settings).
5. Tooling parity (`verify`), then delete the TypeScript.

Unit design and concept art don't depend on the engine and can go on throughout. New units get built once the rules
are in C++.

## Open for the user
- What draws you to Unreal: the look (lighting, animated figures), the editor, or shipping (Steam, packaging)? Each one
  points to a different spike.
- Where do you play from over Tailscale? If it isn't this machine, Unreal changes how you'd play.

## Claude's read
Nothing here blocks a port, and the other project shows Claude can work in Unreal 5.8 on this machine at a good pace
if it stays C++ and script-built. The case for it is the `3d-figures` card, the city montage, caves and cinematics:
the work Unreal does best and three.js does by hand. The case against is a month without new units, the end of
browser play and a slower visual loop. If the port happens, the cheapest time is before the 3D figures and the art
push. After that, more and more work would be done twice. The spike would settle it with pictures rather than
argument.
