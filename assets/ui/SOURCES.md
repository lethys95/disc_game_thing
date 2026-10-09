# UI kit sources

Generated with `scripts/art/ui.ts` (Krea-2 Turbo via ComfyUI) and cut out with `scripts/art/ui_cut.py`.

| File | Piece, seed | Cut |
|---|---|---|
| `button.webp` | `button`, 2 | |
| `backdrop.webp` | `backdrop`, 1 | central 80% cropped, 512 px, tiled |
| `icon-{city,garrison,research,spells}.webp` | `icon-city` 1, `icon-garrison` 3, `icon-research` 1, `icon-spells` 1 | cut out |

Pilot on the city screen (M45), after the user's reference `docs/design/references/disciples2-city.png`.

City views (`assets/city/<slot>.webp`): `scripts/art/city-views.ts`; `capitol-jilliath` seed 3, `capitol-nexus` seed 2, `city` seed 3. Placeholders for the city montage (`docs/design/capitol-screen.md`).

## The battle (`battle/`), painted as one picture (`scripts/art/hud-paint.ts`, 2026-10-09)
The greybox of the battle screen painted through its mask (round 3, probe `reliquary`, strength 0.75, seed 3), then
repainted at 1440p from its own upscale (0.35), the sill's grille repaired by inpainting (`fix sill`), the log's stele
grafted from seed 1 of the same probe (`graft log`). Cut with `pieces battle`:
| File | From | Cut |
|---|---|---|
| `battle/beam.webp` | the 1440p pick | the band as painted |
| `battle/monument.webp` | the 1440p pick | Photon's subject segmentation on a brightened copy; the portrait's opening cleared |
| `battle/sill.webp` | `fix-sill` | the band as painted |
| `battle/log.webp` | `graft-log` | Photon's segmentation on a brightened copy; nine-sliced in CSS |
| `battle/hourglass.webp`, `battle/marionette.webp` | the 1440p pick | keyed from the crop's corners (the marionette also by a light floor) |
| `battle/recess.webp` | the 1440p pick | the monument's recessed panel as painted, a candle's glow in its lower left corner covered with the stone beside it; the sockets' and the light-rim panels' frame, nine-sliced |

## The map (`map/`), painted into the battle's pieces (2026-10-09)
The map's greybox carries the battle's pieces (beam, plaque, chain, the log's block as its tablets); only its two
sculptures were painted, through a mask around them (`hud-paint.ts` screen `map`, round 1, probe `reliquary`, strength
0.75, seed 2), then repainted at 1440p (0.35). Cut with `pieces map`:
| File | Cut |
|---|---|
| `map/bearer.webp` | Photon's segmentation on a brightened copy: the hooded angel holding up the bell (End turn) |
| `map/book.webp` | the same, then the dark ground under a light floor dropped: the book hanging from the beam (Menu) |


## The Capitol (`capitol/`), painted into the battle's pieces (2026-10-09)
The Capitol's greybox carries the battle's beam; only its rail was painted: the pillar with its niches exactly, and
room around the column figure on its capital (`hud-paint.ts` screen `capitol`, round 1, probe `reliquary`, strength
0.85, seed 1), then repainted at 1440p (0.35). Cut with `pieces capitol`:
| File | Cut |
|---|---|
| `capitol/rail.webp` | the right column as painted, from the beam's underside to the bottom edge: the angel on the capital, the four niches, the pillar |

## The codex (`codex/`), painted as one book (2026-10-10)
The codex's greybox book painted exactly within its box (`hud-paint.ts` screen `codex`, round 1, probe `reliquary`,
strength 0.85, seed 3), then repainted at 1440p (0.35). Cut with `pieces codex`:
| File | Cut |
|---|---|
| `codex/book.webp` | the open book as painted; the codex's and the credits' pages |
| `codex/parchment.webp` | a clean patch of its right page: the parchment of the rules slip and the explanations |

## The title (`title/`), painted as one stele (2026-10-10)
The title's greybox stele painted exactly within its outline (`hud-paint.ts` screen `title`, round 1, probe
`reliquary`, strength 0.75, seed 3), then repainted at 1440p (0.35). Cut with `pieces title`:
| File | Cut |
|---|---|
| `title/stele.webp` | Photon's segmentation on a brightened copy, its dark recess kept whole by the greybox outline |
