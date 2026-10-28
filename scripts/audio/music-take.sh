#!/usr/bin/env bash
# A finished music track (WAV or anything ffmpeg reads) into a music slot: one static gain to -20 LUFS, capped so the
# true peak stays under -1 dBTP, then FLAC, lossless (the user heard the loss in Opus, at 128 kb/s and again at 256);
# the source WAVs stay outside the repo, in ~/Music/theme_music/.
#   scripts/audio/music-take.sh <source> <slot>      e.g. ~/Music/theme.wav grove/battle-1
set -euo pipefail
cd "$(dirname "$0")/../.."
source=$1
out=assets/audio/music/$2.flac
target=-20
ceiling=-1
mkdir -p "$(dirname "$out")"
stats=$(ffmpeg -hide_banner -nostats -i "$source" -af loudnorm=print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
loudness=$(echo "$stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["input_i"])')
peak=$(echo "$stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["input_tp"])')
gain=$(python3 -c "print(round(min($target - $loudness, $ceiling - $peak), 2))")
ffmpeg -hide_banner -loglevel error -y -i "$source" -af "volume=${gain}dB,aresample=osf=s16:dither_method=triangular" -c:a flac -compression_level 8 "$out"
echo "$out: $loudness LUFS, peak $peak dBTP, gain ${gain} dB"
