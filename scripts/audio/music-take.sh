#!/usr/bin/env bash
# A finished music track (WAV or anything ffmpeg reads) into a music slot: one static gain to -20 LUFS, capped so the
# true peak stays under -1 dBTP, then Opus at 256 kb/s (the user heard the loss at 128; the source WAVs stay outside the
# repo, in ~/Music/theme_music/).
#   scripts/audio/music-take.sh <source> <slot>      e.g. ~/Music/theme.wav grove/battle-1
set -euo pipefail
cd "$(dirname "$0")/../.."
source=$1
out=assets/audio/music/$2.ogg
target=-20
ceiling=-1
mkdir -p "$(dirname "$out")"
stats=$(ffmpeg -hide_banner -nostats -i "$source" -af loudnorm=print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
loudness=$(echo "$stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["input_i"])')
peak=$(echo "$stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["input_tp"])')
gain=$(python3 -c "print(round(min($target - $loudness, $ceiling - $peak), 2))")
ffmpeg -hide_banner -loglevel error -y -i "$source" -af "volume=${gain}dB" -ar 48000 -c:a libopus -b:a 256k "$out"
echo "$out: $loudness LUFS, peak $peak dBTP, gain ${gain} dB"
