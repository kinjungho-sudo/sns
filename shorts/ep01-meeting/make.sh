#!/usr/bin/env bash
# EP.01 회의록 9:16 쇼츠 (create-typecast-shorts 스킬 절차)
#   ./make.sh voices            → 목소리 고르기 (cast voices pick)
#   VOICE_ID=... ./make.sh tts  → narration.wav + captions.srt (유료 요청 1회)
#   ./make.sh preview           → preview.mp4 (앞 15초)
#   ./make.sh final             → final.mp4
# 배경: 직접 만든 out/video/ep01-meeting/ep01-meeting.mp4 (원본 소리 제거, 크림색 여백으로 9:16 맞춤)
# 배경 길이를 나레이션 길이에 맞게 늘이거나 줄여서, 장면과 말이 같이 끝나게 함
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$(go env GOPATH)/bin:$PATH"
SRC="../../out/video/ep01-meeting/ep01-meeting.mp4"
FONTS="../../fonts"
STYLE="FontName=Pretendard,FontSize=11,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=1.6,Shadow=0,Alignment=2,MarginV=16"

render() { # $1 = 출력 파일, $2 = 추가 옵션(-t 15 등)
  local narr bg factor
  narr=$(ffprobe -v error -show_entries format=duration -of csv=p=0 narration.wav)
  bg=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
  factor=$(python3 -c "print(${narr}/${bg})")
  ffmpeg -y -i "$SRC" -i narration.wav \
    -filter_complex "[0:v]setpts=${factor}*PTS,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0xECE6D8,setsar=1,subtitles=captions.srt:fontsdir=${FONTS}:force_style='${STYLE}'[v]" \
    -map "[v]" -map 1:a $2 -shortest -r 30 \
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
    -c:a aac -b:a 192k -movflags +faststart "$1"
}

case "${1:-}" in
  voices)  cast voices pick ;;
  tts)
    test -n "${VOICE_ID:-}" || { echo "VOICE_ID 를 지정하세요"; exit 1; }
    test ! -e narration.wav || { echo "narration.wav 가 이미 있어요. 다시 만들려면 먼저 옮기거나 지우세요."; exit 1; }
    cast "$(cat script-tts.txt)" --voice-id "$VOICE_ID" --language kor \
      --tempo "${TEMPO:-1.0}" --remove-silence-ms 300 --format wav --out narration.wav \
      --timestamp-out captions.srt --timestamp-format srt ;;
  preview) render preview.mp4 "-t 15" ;;
  final)
    render final.mp4 ""
    ffprobe -v error -show_entries stream=codec_name,width,height -show_entries format=duration,size -of default=noprint_wrappers=1 final.mp4 ;;
  *) sed -n 2,6p "$0" ;;
esac
