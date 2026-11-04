#!/usr/bin/env bash
# 새 모션 제안서 덱 만들기: 밴스의원 부산점 덱(vands-motion-ppt)을 엔진째 복사하고 내용 파일은 그대로 둔다(고쳐 쓰기용).
#   bash .claude/skills/motion-proposal-deck/scripts/new-deck.sh <새-폴더>      예) decks/xx-clinic
# 복사하지 않는 것: node_modules, review(검사 캡처), verification-original, sources(PDF), 렌더된 영상·내레이션 음성
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../../../.." && pwd)/vands-motion-ppt"
DST="${1:?새 폴더 경로를 주세요}"
[ -e "$DST" ] && { echo "이미 있음: $DST"; exit 1; }
mkdir -p "$DST"
( cd "$SRC" && tar cf - --exclude=./node_modules --exclude=./review --exclude=./verification-original --exclude=./sources \
    --exclude='./assets/video/*.mp4' --exclude='./assets/video/*/*.mp4' --exclude='./assets/audio/narration/*.mp3' . ) | ( cd "$DST" && tar xf - )
mkdir -p "$DST/sources" "$DST/review"
printf '// 장면별 내레이션 음성 (키 = 부-순서). 파일이 있으면 장면이 시작될 때 자동 재생된다.\nwindow.VO_FILES = {};\n' > "$DST/assets/audio/narration/files.js"
echo "✔ $DST 생성 (엔진·도구·테마·폰트 포함). 다음: SKILL.md의 '만드는 순서'를 따라 내용 교체"
