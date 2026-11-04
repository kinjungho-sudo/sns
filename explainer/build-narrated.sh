#!/usr/bin/env bash
# Narrated 16:9 master with a Typecast voice. Run from the repo root after `npm run film` (needs out/audio_raw.wav).
#   TYPECAST_API_KEY=… npm run film:narrated        (optional: TYPECAST_VOICE_ID, TYPECAST_MODEL)
set -euo pipefail
FILM=${1:-coffee}; O=explainer/$FILM/out
node explainer/narrate.mjs --film $FILM
node explainer/render.mjs video --film $FILM --fmt 16x9 --vo
ffmpeg -v error -y -i "$O/video_16x9_vo.mp4" -i "$O/audio_narrated.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$O/master_16x9_narrated.mp4"
rm -f "$O/video_16x9_vo.mp4"
node explainer/check-video.mjs "$O/master_16x9_narrated.mp4"
echo "✔ $O/master_16x9_narrated.mp4  +  explainer/$FILM/captions_narrated.srt"
