#!/usr/bin/env bash
# Rebuild every deliverable from source. Run from the repo root: npm run film
# Needs: node + playwright (npm install), Chromium (CHROMIUM_PATH), ffmpeg with libx264.
set -euo pipefail
FILM=${1:-coffee}
O=explainer/$FILM/out
mkdir -p "$O"

echo "▶ audio"
node explainer/render.mjs audio --film $FILM
ffmpeg -hide_banner -i "$O/audio_raw.wav" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p' > "$O/loudnorm.json"
F=$(node -e 'const m=require("./'"$O"'/loudnorm.json");console.log(`loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`)')
ffmpeg -v error -y -i "$O/audio_raw.wav" -af "$F" -ar 48000 "$O/audio.wav"

echo "▶ video (4 renders, 2 at a time)"
node explainer/render.mjs video --film $FILM --fmt 16x9 & node explainer/render.mjs video --film $FILM --fmt 9x16 & wait
node explainer/render.mjs video --film $FILM --fmt 1x1 & node explainer/render.mjs video --film $FILM --fmt 16x9 --rm & wait

echo "▶ mux"
mux() { ffmpeg -v error -y -i "$1" -i "$O/audio.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$2"; }
mux "$O/video_16x9.mp4" "$O/master_16x9.mp4"
mux "$O/video_9x16.mp4" "$O/cut_9x16.mp4"
mux "$O/video_1x1.mp4" "$O/cut_1x1.mp4"
mux "$O/video_16x9_rm.mp4" "$O/master_16x9_reduced_motion.mp4"
rm -f "$O"/video_*.mp4

echo "▶ captions, stills, contact sheet"
if [ "$FILM" = coffee ]; then BEATS="Q M1 M2 P1 P2 T Y BLANK"; N=8; GRID=4x2; else BEATS="Q M1 M2 M3 P1 P2 P3 T Y"; N=9; GRID=3x3; fi
node explainer/render.mjs captions --film $FILM
for f in 16x9 9x16 1x1; do node explainer/render.mjs stills --film $FILM --fmt $f > /dev/null; done
node explainer/render.mjs stills --film $FILM --fmt 16x9 --rm > /dev/null
ffmpeg -v error -y $(for b in $BEATS; do if [ $b = BLANK ]; then printf -- "-f lavfi -i color=c=0xF4F1EA:s=1920x1080:d=1 "; else printf -- "-i $O/stills/16x9/$b.png "; fi; done) -frames:v 1 \
  -filter_complex "$(for i in $(seq 0 $((N-1))); do printf "[$i:v]scale=640:-1[s$i];"; done)$(for i in $(seq 0 $((N-1))); do printf "[s$i]"; done)xstack=inputs=$N:grid=$GRID" explainer/$FILM/contact.png
echo "✔ done — see explainer/$FILM/out and explainer/$FILM/contact.png"
