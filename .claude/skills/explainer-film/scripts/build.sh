#!/usr/bin/env bash
# Every deliverable from source. Run in the film folder: npm run film
# Needs node + playwright (npm install), a Chromium (CHROMIUM_PATH or `npx playwright install chromium`), ffmpeg with libx264.
set -euo pipefail
O=out; mkdir -p "$O"
echo "▶ audio"
node tools/render.mjs audio
ffmpeg -hide_banner -i "$O/audio_raw.wav" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p' > "$O/loudnorm.json"
F=$(node -e 'const m=require("./out/loudnorm.json");console.log(`loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`)')
ffmpeg -v error -y -i "$O/audio_raw.wav" -af "$F" -ar 48000 "$O/audio.wav"
echo "▶ video (4 renders, 2 at a time)"
node tools/render.mjs video --fmt 16x9 & node tools/render.mjs video --fmt 9x16 & wait
node tools/render.mjs video --fmt 1x1 & node tools/render.mjs video --fmt 16x9 --rm & wait
echo "▶ mux"
mux() { ffmpeg -v error -y -i "$1" -i "$O/audio.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$2"; }
mux "$O/video_16x9.mp4" "$O/master_16x9.mp4"
mux "$O/video_9x16.mp4" "$O/cut_9x16.mp4"
mux "$O/video_1x1.mp4" "$O/cut_1x1.mp4"
mux "$O/video_16x9_rm.mp4" "$O/master_16x9_reduced_motion.mp4"
rm -f "$O"/video_*.mp4
echo "▶ captions, stills, contact sheet"
node tools/render.mjs captions
for f in 16x9 9x16 1x1; do node tools/render.mjs stills --fmt $f > /dev/null; done
node tools/render.mjs stills --fmt 16x9 --rm > /dev/null
node tools/render.mjs contact > /dev/null
echo "▶ checks"
for f in master_16x9 cut_9x16 cut_1x1 master_16x9_reduced_motion; do node tools/check-video.mjs "$O/$f.mp4"; done
echo "✔ done — out/*.mp4, captions.srt, contact.png"
