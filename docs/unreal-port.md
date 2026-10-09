# Porting disc to Unreal Engine 5

_2026-10-09. Started as an estimate the user asked for. The same day the user chose a port as a parallel track: the
three.js game keeps its pace, and the Unreal version grows behind it. Sizes are a snapshot of this date._

## In short
The port is feasible. It means a rewrite, not a conversion. The design, the board, the art and audio pipelines, every
asset and the rules' architecture carry over. Claude's first estimate was three to six weeks of sessions back to
today's game, at the pace the game was built (about two weeks, 559 commits, from 2026-09-25), done one session at a
time. The user expects less, and parallel agents shrink the calendar time. The first steps will measure the real
pace. The interface is the largest part, not the rules. In exchange, Unreal handles the work this repo would otherwise
do by hand: bounce light, volumetric fog, particles, animation state machines and desktop packaging. The main cost is
velocity, which is why the three.js game keeps going.

## The user's answers (2026-10-09)
- **Why Unreal:** "Actual 3d quality. Threejs doesn't have all the features we need to make a beautiful game, and UE is
  the king of 3d. Editor dependency is the weakest part of UE in the AI workflow. I'm not concerning myself with
  shipping right now. Threejs would need to be bundled with electron probably, which is more uncertainty."
- **Tailscale:** "a convenience right now, not a requirement."
- **How:** "The biggest loss with UE is velocity. Conversion would likely be a continuous effort, where development
  with higher velocity would happen inside threejs. I'd allow this given that agents can run in parallel."

## How the port runs: a parallel track
- **The rules stay in TypeScript and are the only rules.** Unreal doesn't get a second copy. It talks to them in a
  Node process over a local socket. The rules are plain data and pure functions, so any of them can cross a process
  boundary as JSON: the state goes in and the result comes out. The view's questions (reach, forecasts, rules text,
  the codex) and the AI's turns become calls by name, with no protocol designed per feature. New units, abilities and
  balance land once, in TypeScript, and both views see them. This keeps one source of truth, and velocity stays where
  it is. The same server is the headless game the `mcp-player` card asks for.
- **Unreal is a view.** It follows the three.js view: the battle first, then the map, then the interface screen by
  screen. Agents work on it in parallel with the three.js work.
- **Later, if ever:** once the three.js view retires, the rules either stay a sidecar process or move to C++, checked
  by replaying seeded games through both engines until the logs match (below). That choice waits until then.
- **The Unreal project lives in `unreal/`** in this repo, so it shares the docs, the board and `assets/`. C++ and
  scripts are the source. Imported and generated assets (meshes, textures, materials, maps) are rebuilt by editor
  Python scripts and stay out of git. That avoids Git LFS and keeps everything text, until something can only be made
  by hand in the editor.

### Steps
1. **Foundation and the battle arena.** The project, its scripts (build; an offscreen screenshot; automation tests;
   the wait-for-done-then-kill launcher), the asset import, and the battle arena drawn from a battle the TypeScript
   rules export. Side by side with today's `?fight`, with the loop time measured.
2. **The rules server.** Unreal starts the Node process and plays a battle through it, AI against AI, then by clicks.
3. **The map.** Landscape, camera, picking, fog, places and warbands.
4. **The interface**, in the order the playtests walk it: setup, map, battle, city, spells, save, settings.
5. **Tooling parity** with `pnpm verify`.

## What exists today
| Part | Size | Notes |
|---|---|---|
| Rules | ~9.7k lines | Pure data and functions: traits, effects, the damage pipeline, world, map AI |
| 3D view | ~3k lines | WebGPU renderer and post chain, generated landscape and its shader, map, battle arena, standees, glTF slots |
| Interface and the rest of the view | ~6.1k lines + ~700 lines CSS | About fifteen HTML screens and panels, sound, saves, settings, AI worker client |
| Tests | ~3.7k lines, 40 files | Mostly rules; some view logic (music, cues, models, settings) |
| Tooling | ~3.8k lines | Screenshots, playtests (Playwright clicking the real UI), sims, sizes, board, art and audio scripts |
| Assets | 48 glb, 151 webp, 32 ogg | PNG masters for all art sit in `art/` |

The view imports about 160 names from about 40 rules modules. That's the surface the rules server has to answer, and
the reason a generic call-by-name bridge beats a protocol designed per feature.

## What's on this machine
- **Unreal 5.8.3**, Epic's precompiled Linux build, in `~/programs/ue/` (73 GB, with its own clang 20 toolchain).
  Plugins that matter here ship with it: CommonUI, Python editor scripting, Interchange (glTF import), Geometry
  Scripting and procedural meshes, Niagara, StateTree, PCG, Movie Render Pipeline, Pixel Streaming 2, the Automation
  Driver (simulated UI input), Functional Testing and Epic's experimental Unreal MCP, and the engine has a
  WebSockets module.
- **A working Unreal workflow in another project.** `~/projects/domestic_bliss_vr` has run this same engine since
  2026-10-05, C++ only, driven by Claude. It measured 2–4 s per C++ build and about 7 s to launch. It runs the game
  headless and offscreen with screenshots, runs automation tests from the command line, and builds maps from editor
  Python scripts. Its notes list the traps worth inheriting: Unreal often hangs on quit (wait for a done marker, then
  kill it), CPU Lightmass crashes on 5.8.3 Linux, the editor rewrites `Config/*.ini`, Linux has no Live Coding, and
  Windows packages can't be built from Linux.
- **The earlier disc attempts in Unreal** (`../legacy/disc`, 2024) used Hazelight's AngelScript fork. That needs a
  source-built fork engine, and the installed build isn't one. UnrealSharp (C#) doesn't support Linux yet. So Unreal
  code means C++, and no Blueprint graphs, which are binary files Claude can't read or diff.
- GPUs: two RTX 3090 Ti and the integrated Radeon. GPU 1 belongs to ComfyUI, so Unreal runs on GPU 0
  (`-graphicsadapter=0`), as the other project does.

`decisions.md` (2026-09-28) ruled Unreal out as "editor-bound and binary, slow for Claude to build and test in". The
other project weakens "slow": C++ builds and headless runs are quick. "Binary" still holds for materials, maps and
widget assets, unless scripts generate them (below).

## Part by part

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
- **Models:** glb files are imported by a Python commandlet into assets. Slots keep their naming convention, looked up
  through the asset registry.

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
- **AI:** runs in the rules server, as it runs in a web worker today.
- **Saves:** the rules already read and write them as JSON. Unreal stores the files under `Saved/`.
- **Assets:** Unreal can't import WebP (no image wrapper for it), so textures are imported from the PNG masters.

### Tooling → rebuilt around `UnrealEditor-Cmd`
- `pnpm verify`'s counterpart: build, automation tests, an offscreen screenshot, playtests. Shell scripts, like the
  other project's.
- `pnpm shot` and `pnpm sizes` → `-RenderOffscreen` with `HighResShot` at each resolution.
- **Playtests:** the hardest tool to replace. Playwright clicking the real HTML becomes the Automation Driver
  simulating input on widgets, or console-command timelines. Expect more work and more flakiness.
- **Unchanged:** the rules' tests and sims (the rules stay TypeScript), the board, the art and audio scripts (Krea,
  Tripo, ffmpeg) and the skills, plus one new import step.
- **The visual loop** goes from a reload and a 1–2 s screenshot to about 10–30 s per look (build, launch, render).
  Shaders compile for minutes on the first launch.

### If the rules ever move to C++
Kept for the later decision. The architecture ports cleanly: plain structs and free functions, trait hooks as structs
of function objects, discriminated unions as `TVariant`, behaviors and effects as constant registries, in a module
that depends on Unreal's Core only. Expect 1.3–2× the TypeScript's length, and port the tests first, as the
specification. Traps that would break determinism or change results quietly:
- **Iteration order.** JavaScript objects keep insertion order, but Unreal's `TMap` makes no promise. 34 places
  iterate `Object.keys/entries/values` and 27 use `Map`/`Set`. Where order matters, iterate arrays or sorted keys.
- **Stable sorting.** `Array.sort` is stable, `TArray::Sort` isn't. 37 sorts, 16 of them in the AI: use `StableSort`.
- **Numbers.** Everything in JavaScript is a double. Integer division, rounding and floors must be written explicitly.
  The seeded generators (map, tarot, noise) must be ported bit for bit.
- **Rules text.** About 225 lines of template strings, mostly `describe` texts and the reasons an order is refused,
  become `FText::Format` or `Printf`.

The proof: replay the same seeded battles and games through both engines and compare the event logs until they match.
PuerTS (Tencent's plugin that runs TypeScript inside Unreal, and lists Linux) would be an in-process alternative to
the sidecar, but it's unverified on 5.8.

## Effort (the first estimate, one session at a time)
| Part | Rough effort |
|---|---|
| Rules, their tests, the replay check against TypeScript | 3–5 days (deferred by the rules server) |
| 3D view (map, battle, landscape, figures) at today's look | 4–7 days |
| Interface | 6–10 days |
| Audio, saves, settings, AI | 1–2 days |
| Tooling (verify, shots, sizes, playtests) | 2–4 days |
| Asset import pipeline | ~1 day |

The range is wide on purpose. Unreal's API is large, and Claude will sometimes guess at it. The other project's rule
answers that: read the engine source, which ships with the install, instead of guessing. On the parallel track the
view keeps moving, so every screen added to three.js is one more screen for Unreal to follow.

## What it costs besides effort
- **Browser play.** No more `pnpm dev --host` over Tailscale with nothing to install (a convenience, the user says).
  Pixel Streaming 2 is in the install if it's ever missed.
- **Distribution.** Not a concern yet (the user). For later: Linux packages build here, Windows packages need a
  Windows machine or VM, and players need a real GPU.
- **Text as the source.** Maps, materials and any widget asset are binary. Claude keeps them generated from scripts,
  but anything the user tweaks by hand in the editor becomes something Claude can't see in a diff.
- **Linux engine quirks**, as above: quit hangs, a broken CPU Lightmass, config rewrites, and the Wayland crashes the
  5.8 previews had (worked around with `SDL_VIDEODRIVER=x11`).
