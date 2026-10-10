# UI kit sources

Generated with `scripts/art/ui.ts` (Krea-2 Turbo via ComfyUI) and cut out with `scripts/art/ui_cut.py`.

| File | Piece, seed | Cut |
|---|---|---|
| `button.webp` | `button`, 2 | |
| `backdrop.webp` | `backdrop`, 1 | central 80% cropped, 512 px, tiled |
| `icon-{city,garrison,research,spells}.webp` | `icon-city` 1, `icon-garrison` 3, `icon-research` 1, `icon-spells` 1 | cut out |
| `icon-{armor,initiative,power,hits}.webp` | `icon-armor` 3, `icon-initiative` 2, `icon-power` 3, `icon-hits` 3 | cut out, 256 px: the battle card's instruments |
| `icon-seal.webp` | `icon-seal`, 2 | cut out, 256 px: the seal the card's health number sits on |

Pilot on the city screen (M45), after the user's reference `docs/design/references/disciples2-city.png`.

City views (`assets/city/<slot>.webp`): `scripts/art/city-views.ts`; `capitol-jilliath` seed 3, `capitol-nexus` seed 2, `city` seed 3. Placeholders for the city montage (`docs/design/capitol-screen.md`).

## Interim pieces from the scrapped one-painting HUD (2026-10-09/10)
Cut from whole-screen paintings by `scripts/art/hud-paint.ts` (deleted with the approach on 2026-10-10, see
`docs/decisions.md`; the script and every probe's prompt are in git history, commit `7aeaa07`). Kept only until the
piece-by-piece replacements exist; the stele, the log block, the angels, the bell-bearer and the angled book were
removed outright.
| File | What it was |
|---|---|
| `battle/beam.webp` | the battle's top band, the turn order on it |
| `battle/recess.webp` | a recessed panel frame: the sockets and the light-rim panels, nine-sliced |
| `battle/plaque.webp` | a marble plate in an iron rim |
| `capitol/rail.webp` | the Capitol's right column with its four niches (its angel masked out in CSS) |
| `codex/parchment.webp` | a patch of painted page: the parchment of the codex, the rules slip and the explanations |

## Painted in (the `hud-paint-in` skill)
| File | Source |
|---|---|
| `battle/bar.webp`, `battle/bar-drained.webp` | `scripts/art/hud-paint-in.ts battle-bar-duel-dull-nostone`, seed 3, its figures' arms and hands repaired by `scripts/art/hud-inpaint.ts duel-hands-full` (strength 0.55, seed 3 left, seed 2 right, combined); the drained copy by `scripts/art/hud_drain.py`: the battle's bottom bar, its windows filled by the game's HTML |
| `map/column.webp` | `scripts/art/hud-paint-in.ts map-column-duality`, seed 2 (Krea-2 with its depth Control LoRA, from `art/greybox/map-column-duality/`), its figures' hands repaired by `scripts/art/hud-inpaint.ts column-hands-2` (strength 0.55, seed 2) and its stray third arm painted out by `column-third-arm` (0.65, seed 4), 576×1664, uncut: the map's right-hand column, its windows filled by the game's HTML |
