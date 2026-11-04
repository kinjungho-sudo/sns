# HTML 모션 슬라이드 설계 · 발표 덱

설계 문서 `DESIGN_html-motion-slides.md`의 내용을 7장으로 발표하는 덱입니다. `html-slides-sample`과 같은 디자인 토큰, 고정 틀, 모션 사양을 따릅니다. `index.html`을 크롬에서 더블클릭하면 열립니다.

## 주제 바꾸는 법
1. `content.json`의 `slides` 배열을 고칩니다. 장 종류(`type`)는 `cover · list · tokens · structure · metrics · video · checklist`이고, 순서를 바꾸거나 장을 더하면 레일과 쪽수가 자동으로 따라옵니다.
2. `node tools/sync-content.mjs`를 실행합니다 (더블클릭으로 열 때 쓰는 사본 갱신).
3. 새로고침합니다. 수치 장의 큰 숫자는 계열 값에서 계산되며, `big.rule`로 `max` 또는 `sum`을 고릅니다.

## 영상 다시 만드는 법
1. 처음 한 번만 `npm install`을 실행합니다 (ffmpeg 필요).
2. `node tools/render-video.mjs`를 실행하면 `assets/video/promo.mp4`와 `promo-poster.jpg`가 만들어집니다 (약 1분).
3. 문구는 `content.json`의 `motion`에서, 장면은 `motion/promo.html`의 GSAP 타임라인에서 고칩니다.

## 장 구성
| 장 | 종류 | 내용 (설계 문서 위치) |
|---|---|---|
| 1 | cover | 목적과 4단계 흐름 |
| 2 | list | 구현 전에 묻는 입력값 5가지와 기본값, 숫자 날조 금지 규칙 (§0) |
| 3 | tokens | 색 토큰 7개와 타이포 5단계를 실제 크기로 (§3) |
| 4 | structure | 고정 틀 도식과 장 1·2·3의 역할 (§3-3, §4) |
| 5 | metrics | 모션 길이 · 영상 구간 · 글자 크기를 차트로, 버튼 3개 연동 (§3-2, §5, §6) |
| 6 | video | 15초 모션그래픽 (§6) |
| 7 | checklist | 완료 기준 7가지와 3장 샘플의 실제 검사 결과, 범위 밖 항목 (§8, §9) |

차트 값은 측정 데이터가 아니라 설계 문서에 적힌 사양 값입니다. 7장의 "통과" 표시는 `html-slides-sample/tools/check.mjs`를 실행해 나온 결과입니다.

## 검사
`node tools/check.mjs`를 실행하면 `review/`에 스크린샷과 `check-report.txt`가 저장됩니다. 마지막 실행 결과는 39개 항목 통과, 경고 1건입니다.
- **오프라인 더블클릭**: 외부 요청을 모두 막아도 폰트·차트·영상이 표시됩니다.
- **넘침·겹침**: 7장 × 2해상도(1920×1080, 1366×768) 모두 없습니다.
- **보기 버튼 3개**: 차트·큰 숫자·해설이 함께 바뀝니다.
- **영상 장**: 들어가면 자동 재생, 떠나면 정지합니다.
- **기타**: 콘솔 오류 0건, content.json 수정 반영, 동작 줄이기 대응.
- **영상**: 검사 브라우저가 H.264를 재생하지 못해, 재생 동작은 VP9 임시 사본으로 확인했습니다.
- **경고 1건**: `--muted`(#787983) 대비가 4.32:1로, 작은 글자 기준 4.5:1에 조금 못 미칩니다. 설계 토큰이라 그대로 두었습니다.

라이선스: Pretendard(SIL OFL 1.1) · Chart.js(MIT) · GSAP(GreenSock 무료 표준 라이선스)
