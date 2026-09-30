#!/usr/bin/env bash
# Rebuilds map props end to end: concepts (Krea, seeds 1 and 2), meshes (TRELLIS.2, seed 1, or seed 2 when seed 1
# overflows the mesh simplifier), cleanup into assets/models/ with the albedo lift (`prop_cleanup.py`).
#   scripts/art/rebuild-props.sh <slot>...      e.g. node/leech_pits site/city
# With no slots: every building (site/, structure/, node/, lair/). Budgets as in assets/models/SOURCES.md.
set -uo pipefail
cd "$(dirname "$0")/../.."
# No albedo lift: the user preferred the buildings unlifted on the gothic ground (2026-09-29). Set a mean (0-1) to lift.
ALBEDO_MEAN=""
slots=("$@")
if [ ${#slots[@]} -eq 0 ]; then
  mapfile -t slots < <(grep -oE 'slot: "[a-z_/-]+"' scripts/art/props.ts | cut -d'"' -f2 | grep -v '^terrain/')
fi
# Terrain is small on screen and drawn hundreds of times: map-sized budgets (the user asked about LOD, 2026-09-29).
budget() { case $1 in site/capitol-*) echo 40000;; site/city) echo 30000;; structure/*|lair/*) echo 20000;; node/*) echo 16000;; terrain/*mountain-*) echo 5000;; terrain/*hill-*) echo 2500;; terrain/*tree-*|terrain/*rock-*) echo 1500;; terrain/*bush-*) echo 800;; *) echo 8000;; esac; }
pnpm exec tsx scripts/art/props.ts "${slots[@]}" 1 2 >/dev/null
for slot in "${slots[@]}"; do
  id=${slot/\//_}
  faces=$(budget "$slot")
  built=""
  for seed in 1 2; do
    mesh=art/candidates/props/meshes/$id-$seed.glb
    if ~/programs/image-to-3d/run_trellis2.sh "art/candidates/props/$id-$seed.png" "$mesh" --pipeline 1024_cascade --faces "$faces" --texture 2048 >/dev/null 2>&1 && [ -f "$mesh" ]; then
      # Terrain is meant to be dark (foliage, rock): lifting it turned trees pale (2026-09-29).
      lift=$ALBEDO_MEAN; [[ $slot == terrain/* ]] && lift=""
      blender -b -P scripts/art/prop_cleanup.py -- "$mesh" "assets/models/$slot.glb" "$faces" 2048 $lift 2>&1 | grep prop_cleanup
      built=$seed
      break
    fi
  done
  echo "$slot: ${built:-FAILED}"
done
