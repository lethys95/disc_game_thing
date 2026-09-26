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
The user's bandits guard neutral cities, camps and dungeons (one-time rewards: gold, a unit joins). Ral-Vitahl's tier 1 (Custodian, Arcane Engineer, Apprentice) is playable beside Jilliath. Engine: shields, ranged and area attacks. Punishment capped at 3 stacks.

## M6 — Nexus scheme vs overload ✅ (2026-09-25)
Forks are per faction. Nexus's one fork (scheme = automata and the Justiciar, overload = mutants and the Thaumaturge) unlocks the Battery (Equalize: lent shields), the Mutant (Mutate), the Justiciar (a secret Negate mark) and the Thaumaturge (Homing Lightning). All designed by the user.

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

## Then
- Faction content as the user designs it (Nexus trees first; Grove and Wastes later). The user owns unit designs and looks.
- Spells and mana (canon), a spell tree in the Capitol.
- Settings menu (#34), leader experience (#33), the economy question.

## Later (not ordered yet)
**Cinematics between missions** (user idea, 2026-09-25): image-to-video (Wan 2.2 / LTX-2.3, both installed) from style-consistent key art; story from the user (the Ton'Arilliet story is ready material). · city upgrades & nodes · fog of war · procedural maps · final art direction and battle figures · audio · desktop packaging (Electron preferred over Tauri for WebGL on Linux).
