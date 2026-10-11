#!/usr/bin/env bash
# Narrated 16:9 master with a Typecast voice. Run in the film folder after `npm run film` (needs out/audio_raw.wav).
#   TYPECAST_API_KEY=… npm run narrated      (optional: TYPECAST_VOICE_ID, TYPECAST_MODEL; TYPECAST_DRY_RUN=1 tests with tones)
set -euo pipefail
O=out
node tools/narrate.mjs
node tools/render.mjs video --fmt 16x9 --vo
ffmpeg -v error -y -i "$O/video_16x9_vo.mp4" -i "$O/audio_narrated.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$O/master_16x9_narrated.mp4"
rm -f "$O/video_16x9_vo.mp4"
node tools/check-video.mjs "$O/master_16x9_narrated.mp4"
echo "✔ $O/master_16x9_narrated.mp4 + captions_narrated.srt"
