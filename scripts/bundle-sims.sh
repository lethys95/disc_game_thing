#!/bin/sh
# The sims as plain JavaScript (esbuild, no names kept): tsx's per-call overhead was nearly half their running time.
set -e
cd "$(dirname "$0")/.."
for name in sim sim-world sim-tier1 sim-many; do
  pnpm exec esbuild "scripts/$name.ts" --bundle --platform=node --format=esm --outfile=".sim/$name.mjs" --log-level=warning
done
