#!/usr/bin/env bash
# Finish and inspect generated SFX candidates with ffmpeg.
#   sfx.sh finish <in.wav> <out.ogg> [target_lufs=-16] [bitrate=64k]
#   sfx.sh check  <file>...
set -euo pipefail

usage() {
  sed -n '2,4p' "$0" | sed 's/^# \{0,1\}//'
  exit 2
}

# Leading/trailing silence below -50 dBFS is cut; 5 ms fade in, 30 ms fade out so the cut never clicks.
trim_and_fade='silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.005,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02,afade=t=in:d=0.03,areverse,afade=t=in:d=0.005'

# The ceiling sits below -1 dBTP because Opus decoding overshoots peaks by a few tenths of a dB.
ceiling=-1.5

json_field() {
  sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p" <<<"$2" | head -n1
}

# Pass 1: loudnorm's EBU R128 measurement of the trimmed clip. R128 gates on 400 ms blocks, so a
# shorter clip has no integrated loudness; it is measured looped instead (same loudness, long enough).
measure() {
  local in=$1 filters=$2 loops=0 json
  local dur
  dur=$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$in")
  if awk "BEGIN { exit !($dur < 0.6) }"; then loops=5; fi
  json=$(ffmpeg -hide_banner -nostats -stream_loop "$loops" -i "$in" \
    -af "$filters,loudnorm=print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
  echo "$(json_field input_i "$json") $(json_field input_tp "$json")"
}

# Pass 2 applies one static gain (what loudnorm's linear mode does), capped so the true peak stays under
# the ceiling. Plain gain avoids loudnorm's 192 kHz resampling and its dynamic fallback on short clips.
finish() {
  local in=$1 out=$2 target=${3:--16} bitrate=${4:-64k}
  local measured_i measured_tp gain
  read -r measured_i measured_tp < <(measure "$in" "$trim_and_fade")
  gain=$(awk -v t="$target" -v i="$measured_i" -v c="$ceiling" -v p="$measured_tp" \
    'BEGIN { g = t - i; if (p + g > c) g = c - p; printf "%.2f", g }')
  ffmpeg -hide_banner -loglevel error -y -i "$in" \
    -af "$trim_and_fade,volume=${gain}dB" -ar 48000 -c:a libopus -b:a "$bitrate" "$out"
  echo "$out: in ${measured_i} LUFS / ${measured_tp} dBTP, gain ${gain} dB (target ${target} LUFS, ceiling ${ceiling} dBTP)"
}

check() {
  local f
  for f in "$@"; do
    local dur ch sr stats silences loudness
    dur=$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$f")
    ch=$(ffprobe -v error -select_streams a:0 -show_entries stream=channels -of default=nk=1:nw=1 "$f")
    sr=$(ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of default=nk=1:nw=1 "$f")
    stats=$(ffmpeg -hide_banner -nostats -i "$f" -af 'ebur128=peak=true,silencedetect=n=-50dB:d=0.1' -f null - 2>&1)
    silences=$( (grep -oE 'silence_(start|end): [-0-9.e]+' <<<"$stats" || true) |
      awk '{ printf "%s%s", sep, $2; sep = ($1 == "silence_start:") ? "-" : ", " }')
    loudness=$(sed -n '/Summary:/,$p' <<<"$stats" |
      awk '/ I:/ { i = $2 } / LRA:/ { r = $2 } /Peak:/ { p = $2 } END { printf "%s LUFS integrated, %s LU range, %s dBTP peak", i, r, p }')
    if awk "BEGIN { exit !($dur < 0.6) }"; then
      loudness="$loudness; looped: $(measure "$f" anull | awk '{ printf "%s LUFS", $1 }')"
    fi
    cat <<REPORT
$f
  duration   ${dur}s, ${ch} ch, ${sr} Hz
  loudness   ${loudness}
  silence    ${silences:-none} (below -50 dBFS for >=0.1 s)
REPORT
  done
}

case ${1:-} in
  finish) shift; [[ $# -ge 2 ]] || usage; finish "$@" ;;
  check) shift; [[ $# -ge 1 ]] || usage; check "$@" ;;
  *) usage ;;
esac
