#!/usr/bin/env bash
# Renders the bake-off scene headlessly: a private KWin session (no window on the desktop), Vulkan on the CPU's Radeon.
# Usage: ./shot.sh <out.png> [wide|close] [seconds]
set -euo pipefail
cd "$(dirname "$0")"
out="$(realpath -m "$1")"
# Copies, not links: Godot writes import files and extracted textures next to every asset it can see.
mkdir -p assets/models/terrain assets/ground assets/sky assets/shared
cp -u ../../../assets/models/terrain/*.glb assets/models/terrain/
cp -u ../../../assets/ground/forest-1.webp assets/ground/
cp -u ../../../assets/sky/map.webp assets/sky/
cp -u ../shared/Soldier.glb assets/shared/
export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/radeon_icd.json
export __EGL_VENDOR_LIBRARY_FILENAMES=/usr/share/glvnd/egl_vendor.d/50_mesa.json
timeout 60 godot --headless --path . --import >/dev/null 2>&1 || true
timeout 180 kwin_wayland --virtual --no-lockscreen --no-global-shortcuts --width 1600 --height 900 \
  --socket "disc-bakeoff-$$" --exit-with-session \
  "env WAYLAND_DISPLAY=disc-bakeoff-$$ godot --path . --display-driver wayland --rendering-driver vulkan -- --shot=$out --view=${2:-wide} --at=${3:-1.5}" 2>&1 \
  | grep -E "SCRIPT ERROR|ERROR|shot:" | grep -v "Optional" | sort | uniq -c | sort -rn | head -20 || true
