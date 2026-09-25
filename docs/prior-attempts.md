# Prior attempts — lessons

The user has tried this game several times. The attempts live next to this repo in `../` (`legacy/`, `disc_godot_mono/`). Read this once; don't re-survey them unless needed.

| Attempt | Stack | Period | Result |
|---|---|---|---|
| `legacy/disc` | Unreal + AngelScript | 2024 | ~1.4k lines, camera + nav, domain classes. Stopped. |
| `legacy/disciples` | Godot GDScript | 2025 | player/mana/creature/ability stubs. Stopped. |
| `legacy/disc-mono` | Godot C# | late 2025 | Empty project. |
| `disc_godot_mono/disc` | Godot C# / .NET 10 | Jul–Aug 2026 | 75 commits, 5.6k lines of code, 3.6k lines of tests, kanban, Obsidian vault. `Main.cs` was an empty Node3D. Stopped. |

**What went wrong**
- Every attempt rebuilt the same class list first (Faction, Player, Capitol, CityNode, GoldMine, Spell, StatusEffect, Leader, Inventory, Squad, Battlefield…). The C# attempt ported the Unreal one class by class. None ever put a playable battle on screen.
- Architecture was built for a game that didn't exist yet: save/load versioning, catalogs, factories, event buses, effect-composition frameworks. With nothing driving them, those systems ended up with "no callers" and hooks that silently broke, and got redesigned repeatedly.
- AI agents invented mechanics ("hallucinated city systems", a made-up leader cap) that later had to be found and removed.
- Process grew to compensate (kanban rules, doc discipline, file:line citations in docs) and became a large share of the work.
- The user got frustrated with agents ignoring instructions (e.g. committing).

**Provenance: most old content is AI-made**
- The old `data/units.json` and `data/abilities.json`, most unit and ability names in code (Aura of the Scarlet Banner, Crusader's Charge, …), and most faction "lore" prose were invented by AI agents. Don't mine the old repos for content.
- Genuinely the user's: the 2024 Unreal code and its comments (e.g. mana colors in `legacy/disc/Script/Spell/Mana.as`), the Vexumphat founding line, the Ton'Arilliet story, the short informal faction mechanics notes, and the decisions from design sessions (AI-written but user-directed).
- In `design/`, every page or section says where it came from. Keep doing that.

**What was worth keeping**
The design itself, now in `design/`. It stayed consistent across every rewrite.

**So in this repo**
- Playable first; grow the model from what the current milestone needs.
- Never invent a mechanic. Unspecified → simplest provisional rule + a question.
- Keep notes short, and docs about the design rather than about the code.
