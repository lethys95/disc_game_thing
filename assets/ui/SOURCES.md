# UI kit sources

Generated with `scripts/art/ui.ts` (Krea-2 Turbo via ComfyUI) and cut out with `scripts/art/ui_cut.py`.

| File | Piece, seed | Cut |
|---|---|---|
| `frame.webp` | `frame`, 4 | `--hollow` (border slice ~18% per side) |
| `plaque.webp` | `plaque`, 2 | |
| `button.webp` | `button`, 2 | |
| `medallion.webp` | `medallion`, 4 | |
| `backdrop.webp` | `backdrop`, 1 | central 80% cropped, 512 px, tiled |
| `icon-{city,garrison,research,spells}.webp` | `icon-city` 1, `icon-garrison` 3, `icon-research` 1, `icon-spells` 1 | cut out |
| `plate.webp` | `plate`, 2 | central 40% cropped (inside its filigree), 384 px, tiled |
| `corner-angel.webp` | `corner-angel`, 3 | `--hollow`; `corner-angel-right.webp` is it mirrored |
| `frame-tracery.webp` | `frame-tracery`, 2 | `--hollow` |
| `endcap.webp` | `endcap`, 4 | `--holes` |

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
| `battle/recess.webp` | the 1440p pick | the monument's recessed panel as painted; the sockets' frame, nine-sliced |

