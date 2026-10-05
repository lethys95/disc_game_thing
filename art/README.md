# art/

Working material for the game's art. Nothing here ships: the game reads only `assets/`. `art/candidates/` is
gitignored (large, and every image can be remade from its folder's `manifest.json`: prompt, seed, model).

## How art gets made
1. A script in `scripts/art/` generates candidates with Krea-2 in the local ComfyUI, into a folder below. Each folder
   gets a `manifest.json` and a `contact-sheet.png` to judge the lot at a glance.
2. The user picks. `pnpm art accept <png> <slot>` puts a portrait, icon or effect into `assets/art/` and records where
   it came from in `assets/art/provenance.json`. Map models go through TRELLIS.2 and Blender
   (`scripts/art/rebuild-props.sh`) into `assets/models/`; ground and sky textures are copied by hand into
   `assets/ground/` and `assets/sky/` (`assets/models/SOURCES.md` says how).

## art/candidates/
| Folder | What | Made by |
|---|---|---|
| `units/anchors/` | Early portrait and icon anchors (the Custodian and Punisher portraits come from here) | a past probe |
| `units/jilliath/zealot/`, `units/jilliath/zealot-probes/` | The Zealot's concepts, and the style probes that settled the ink look (ink, mask, pairing with the Psychopomp, blends, sweep) | `scripts/art/concepts.ts`, past probes |
| `units/nexus/custodian/` | The Custodian for 3D: T-poses, 3D renders, turnarounds (the Tripo reference is `custodian-3d-1002`) | `scripts/art/concepts.ts` |
| `units/grove/` | The Sproutling and Decay line, all five picked (`round-1/` the first round); `psychopomp/` her non-ink tries | `scripts/art/concepts.ts` (`GROVE`) |
| `units/neutrals/gnolls/`, `units/neutrals/drawn/` | The gnoll tribe and the Drawn (Claude's moth-folk): turnarounds and stance views | `scripts/art/concepts.ts` (`GNOLLS`, `DRAWN`) |
| `icons/abilities/` | Ability icons (seed 1000 of each is installed) | `scripts/art/icons.ts` |
| `ui/tarot/` | Tarot card art: four looks probed, full decks in oil, gilded and nocturne, card backs | `scripts/art/tarot.ts` |
| `slots/` | Candidates for any art slot without art | `pnpm art generate <kind\|slot>` |
| `models/props/` | Concepts for map models, and `meshes/` from TRELLIS.2 | `scripts/art/props.ts`, `rebuild-props.sh` |
| `models/props-buildings/`, `models/trellis2/` | Earlier rounds of map models | past rounds |
| `models/capitols/wastes/` | Concepts for the Wastes' (Vexumphat) Capitol, for image-to-3D | `scripts/art/wastes.ts` |
| `models/probes/style-probe/`, `models/probes/blender-tree/` | The gothic style probe; the agent-built Grove tree's iterations | `style-probe.ts`, past spike |
| `terrain/ground/` | Ground textures (the desert's too) | `scripts/art/ground.ts` |
| `terrain/sky/`, `terrain/terrain-probe/` | The map's sky; the terrain style probe | `sky.ts`, `terrain-probe.ts` |
| `ui/kit/`, `ui/city-views/` | UI kit pieces; painted city views | `ui.ts`, `city-views.ts` |

Experiments that aren't candidates live in `spikes/` (the agent-built Grove tree: `spikes/grove-tree/`).
