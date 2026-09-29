# Vexumphat — The Wastes

## User's notes
Core identity (user, 2026-09-25): **Takes advantage of death and numbers.**

Mana color: **Yellow** — "Ancient egypt theme, animated armor, ethereals" (Unreal attempt, `Mana.as`, 2024)

Difficulty: medium.

Founding (2024 vault, verbatim): "Spirit bomb in the wastes from Nexus as an experiment. Did not just destroy, also resurrect dormant spirits. Nexus used research to create blueprints for golems."

Canon correction (2026-07-30, user): raising the dead is not an ongoing faction mechanic; the dead were raised once, by the spirit bomb.

Quantity over quality, being a pestilence. Losing is very cheap, winning can be rather difficult, but is done with numbers.

Lifedrain mechanics, death is not very punishing / free in many cases. Resurrection mechanics, super annoying to get rid of.

It's often necessary to split basic fights into pieces between multiple leaders, etc. Plays spread out: more leaders, weaker squads — the exception to "concentrated squads win".

Sustain: shields + life drain + overhealing; low baseline health.

Spells: weakening enemies to make them more digestible, increasing movement speed, speeding up graveyard.

The Ton'Arilliet story (`../lore/ton-arilliet.md`) is the user's and establishes the Sylvan–Vexumphat "undying alliance" and the banshee queen.

> Tension to resolve: "resurrection mechanics, super annoying to get rid of" (mechanics notes) vs "raising the dead is not a mechanic" (canon, 2026-07-30). Likely reconcilable — they already died once; how Vexumphat relates to the graveyard is open. See `../../questions.md`.

## User direction, 2026-09-26 (canon)
- **Not traditional undead. No necromancers; raising the dead isn't a thing.** You can't turn enemies into Vexumphat, and they aren't zombies. (Matches the 2026-07-30 canon in the Godot attempt's `.kanban/maybe/faction-dichotomy-themes.md`, "What Vexumphat is NOT".)
- **Origin:** Nexus threw a gigantic spirit bomb into the desert just to try out their weapons. People long since dead awakened and cling to whatever objects, corpses and anything else was available.
- **Mood:** confusion and despair. Scattered, disoriented, somewhere between apathetic, confused and depressed. No hunger, no desire to expand. Not a collective: separate groups and "tribes" that don't coordinate. Everyone else considers them monsters.
- **Numbers:** they can't really become more in numbers, but they don't really disappear either (lore).
- **When pushed,** they overrun you out of frustration.
- **Look:** more like WoW's ethereals; spirits, ghasts. Attuned to the desert, phantasmagoria, secrets. (Earlier user reference, 2026-07-30: white-aligned Phyrexians, "bleeding porcelain horror": something almost right but wrong.)

### Death and numbers (user, 2026-09-26; answers questions.md #38)
- **Numbers:** the spirit bomb fell where empires once stood; two millennia of people from the same area were raised next to each other at once. That's where both the confusion and the numbers come from: vastly more Vexumphat than any other faction. But it was one incident, and Nexus won't repeat it (they created enemies for themselves; why make more?). So: numerous, never growing.
- **Death:** they can't really die. Like demons in WoW sent back to the Twisting Nether, a Vexumphat unit that dies doesn't really go away. **Mechanically, Vexumphat abuses the graveyard:** its units come back really quickly and cheaply, at the cost of unit strength. Cheap to recruit, cheap to revive, but they don't hit very hard. You have to be really annoying and difficult to get rid of.
- **The cost is the baseline** (user, 2026-09-26): Vexumphat units are weak by design; a revived unit comes back as it was, not weaker.
- **Double-edged:** every defeat feeds XP to the enemy. "It's not all fun and games. You have to use your brain."

## The graveyard as an advantage (user, 2026-09-27)
"Vexumphat is intended to use the graveyard to their advantage": resurrection is much cheaper for them, and the city upgrade that unlocks the graveyard (resurrection outside the Capitol) is available from the start. Unit mechanics can lean the same way. It is **not their entire identity**: when their units are designed, find more themes, mechanics and playstyle unique to them.
- Stickiness idea (user, not settled): a death ward, stopping a unit from going below 1 HP once; maybe the tier-1 melee line.
- The user isn't sold on all of the Wastes' mechanics yet.

## The Capitol's look (user, 2026-09-29)
Inspiration: **the castle in Scorn** (the user's screenshot, kept outside the repo): "sort of ghostly too". What it shows: a towering, pale, bone- or porcelain-like cathedral-palace, ornate yet organic in its curves; vertical, symmetrical, crowned with spires; wrapped in mist under a lavender sky. It matches the canon above ("bleeding porcelain horror", "almost right but wrong", ethereals, phantasmagoria).
- Claude's reading: take the pale ornate silhouette and the ghostliness for this faction's architecture; the game's overall look stays fantasy, not biomechanical (`art.md`: the user ruled biomechanical out as a style).
- Concepts: `scripts/art/wastes.ts` (candidates in `art/candidates/wastes/`, not committed). Best so far: "solid" seed 1, meshed with TRELLIS.2 (`art/candidates/wastes/meshes/capitol-solid-1-clean.glb`); it goes into the game with the faction.
