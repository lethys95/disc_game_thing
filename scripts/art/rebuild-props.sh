#!/usr/bin/env bash
# Rebuilds map props end to end: concepts (Krea, seeds 1 and 2), meshes (TRELLIS.2, seed 1, or seed 2 when seed 1
# overflows the mesh simplifier), cleanup into assets/models/ with the albedo lift (`prop_cleanup.py`).
#   scripts/art/rebuild-props.sh <slot>...      e.g. node/leech_pits site/city
# With no slots: every building (site/, structure/, node/, lair/). Budgets as in assets/models/SOURCES.md.
set -uo pipefail
cd "$(dirname "$0")/../.."
ALBEDO_MEAN=0.3
slots=("$@")
if [ ${#slots[@]} -eq 0 ]; then
  mapfile -t slots < <(grep -oE 'slot: "[a-z_/-]+"' scripts/art/props.ts | cut -d'"' -f2 | grep -v '^terrain/')
fi
budget() { case $1 in site/capitol-*) echo 40000;; site/city) echo 30000;; structure/*|lair/*) echo 20000;; node/*) echo 16000;; *) echo 8000;; esac; }
pnpm exec tsx scripts/art/props.ts "${slots[@]}" 1 2 >/dev/null
for slot in "${slots[@]}"; do
  id=${slot/\//_}
  faces=$(budget "$slot")
  built=""
  for seed in 1 2; do
    mesh=art/candidates/props/meshes/$id-$seed.glb
    if ~/programs/image-to-3d/run_trellis2.sh "art/candidates/props/$id-$seed.png" "$mesh" --pipeline 1024_cascade --faces "$faces" --texture 2048 >/dev/null 2>&1 && [ -f "$mesh" ]; then
      blender -b -P scripts/art/prop_cleanup.py -- "$mesh" "assets/models/$slot.glb" "$faces" 2048 "$ALBEDO_MEAN" 2>&1 | grep prop_cleanup
      built=$seed
      break
    fi
  done
  echo "$slot: ${built:-FAILED}"
done
