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

## Art spike (time-boxed, after M3)
One unit (Paladin) through both routes in `design/asset-pipeline.md` (rigid-part 3D vs painted sprites), shown in the real battle scene. Decide the route. Nothing more until the vertical slice.

## M4 — Progression ✅ (2026-09-25)
XP → evolution tiers, branch investment for Jilliath's melee line, graveyard with decaying resurrection cost.

## Design gate (needs the user)
Only the Jilliath melee line has units. A second faction needs a unit design from the user before it can be built; Claude doesn't invent units. Raise this once M3 is done.

## Vertical slice (after M4)
One faction fully arted, animated and polished across a small complete game. The style LoRA and asset pipeline harden here; then production.

## Later (not ordered yet)
**Cinematics between missions** (user idea, 2026-09-25): image-to-video (Wan 2.2 / LTX-2.3, both installed) from style-consistent key art, edited into short narrated sequences; depends on the art pipeline and campaign; story from the user (the Ton'Arilliet story is ready material). A cheap early use: an animated backdrop for the title screen. · Second faction · overworld spells + mana · city upgrades & nodes · fog of war · save/load (plain-data state → JSON) · better AI · procedural maps · art pipeline (ComfyUI concept art / 3D assets) · audio · desktop packaging (Tauri/Electron).
