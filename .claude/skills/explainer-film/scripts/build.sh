#!/usr/bin/env bash
# Deliverables from source. Run in the film folder.
#   npm run film                 all four cuts: 16x9 9x16 1x1 rm (reduced-motion 16:9 master)
#   npm run film -- 9x16         only the cuts named (any of 16x9 9x16 1x1 rm), plus audio, captions, stills
# Needs node + playwright (npm install), a Chromium (CHROMIUM_PATH or `npx playwright install chromium`), ffmpeg with libx264.
set -euo pipefail
O=out; mkdir -p "$O"
CUTS=("$@"); [ ${#CUTS[@]} -eq 0 ] && CUTS=(16x9 9x16 1x1 rm)
echo "▶ audio"
node tools/render.mjs audio
# two-pass loudnorm. The first pass may report normalization_type "dynamic" when the raw bed is quiet;
# that is fine as long as check-video measures -16 ±1 LUFS on the result.
ffmpeg -hide_banner -i "$O/audio_raw.wav" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p' > "$O/loudnorm.json"
F=$(node -e 'const m=JSON.parse(require("fs").readFileSync("out/loudnorm.json","utf8"));console.log(`loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`)')
ffmpeg -v error -y -i "$O/audio_raw.wav" -af "$F" -ar 48000 "$O/audio.wav"
render() { if [ "$1" = rm ]; then node tools/render.mjs video --fmt 16x9 --rm; else node tools/render.mjs video --fmt "$1"; fi; }
src() { [ "$1" = rm ] && echo "$O/video_16x9_rm.mp4" || echo "$O/video_$1.mp4"; }
dst() { case "$1" in 16x9) echo "$O/master_16x9.mp4";; rm) echo "$O/master_16x9_reduced_motion.mp4";; *) echo "$O/cut_$1.mp4";; esac; }
echo "▶ video: ${CUTS[*]} (2 at a time)"
for ((i = 0; i < ${#CUTS[@]}; i += 2)); do
  render "${CUTS[i]}" & [ $((i + 1)) -lt ${#CUTS[@]} ] && render "${CUTS[i+1]}" & wait
done
echo "▶ mux"
for c in "${CUTS[@]}"; do
  ffmpeg -v error -y -i "$(src "$c")" -i "$O/audio.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$(dst "$c")"
  rm -f "$(src "$c")"
done
echo "▶ captions, stills, contact sheet"
node tools/render.mjs captions
for f in 16x9 9x16 1x1; do node tools/render.mjs stills --fmt $f > /dev/null; done
node tools/render.mjs stills --fmt 16x9 --rm > /dev/null
node tools/render.mjs contact > /dev/null
echo "▶ checks"
for c in "${CUTS[@]}"; do node tools/check-video.mjs "$(dst "$c")"; done
echo "✔ done — $(for c in "${CUTS[@]}"; do printf '%s ' "$(dst "$c")"; done)captions.srt contact.png"
