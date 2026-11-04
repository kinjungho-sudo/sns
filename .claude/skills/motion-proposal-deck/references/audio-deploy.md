# 소리·공유 카드·배포

## 내레이션
대본은 `narration-script.txt`의 `[키.mp3] 문장` 줄(숫자는 한글로: "육십오 점"). 장면 자막은 `app.js`의 `VO`.

**vidIQ(연결된 커넥터, ElevenLabs 엔진)** — 크레딧: 작업 1건당 최소 14(1000자당 14).
1. 모든 줄을 `...`로 띄워 **한 번에** `mcp__vidIQ__vidiq_voiceover_generate` (voiceId 예: `hpp4J3VqNfWAUOO0d1Us` Bella, 밝고 따뜻한 여성).
2. `vidiq_job_poll` → audioUrl을 curl로 내려받기(S3는 접속됨).
3. `ffmpeg -af silencedetect=noise=-40dB:d=0.35`로 긴 쉼(≈1초) 위치를 찾아 줄마다 자르고, `silenceremove` + `loudnorm=I=-16:TP=-1.5`.
4. `assets/audio/narration/files.js` 갱신, `app.js`의 `VO_LEN`(초) 갱신.

**타입캐스트** — `TYPECAST_API_KEY` 환경변수 + `api.typecast.ai` 허용 필요. `node tools/typecast.mjs`(없는 줄만) / `--all`.

## 배경음악
`node tools/make-bgm.mjs` — OfflineAudioContext로 합성, 가운데 바퀴만 잘라 이음매 없는 루프, -18 LUFS. 현재: G장조 118BPM 마림바 팝. 덱 재생 볼륨 0.22, 내레이션 중 0.1.

## 공유 카드·파비콘
`tools/og/card.html`(문구·이미지 수정) → `node tools/make-og.mjs` → `assets/og.jpg`, `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`. `index.html`의 og:url·og:image는 **절대 주소**로. 카카오톡은 미리보기를 캐시하므로 바꾼 뒤엔 카카오 공유 디버거에서 초기화 안내.

## Vercel 배포
`create_project`/`update_project`는 403. 대신 매번 이 호출(폴더·브랜치만 바꿔서):
```
mcp__Vercel__create_deployment
  teamId: team_xZNq0Dux2CuYSqwtgHmjK5vL
  skipAutoDetectionConfirmation: "1"
  requestBody: {"name":"sns","project":"sns","target":"production",
    "gitSource":{"type":"github","org":"kinjungho-sudo","repo":"sns","ref":"<브랜치>"},
    "projectSettings":{"framework":null,"rootDirectory":"<덱 폴더>","buildCommand":"","installCommand":"","outputDirectory":"."}}
```
- 같은 "sns" 프로젝트의 production에 올리면 https://sns-orpin.vercel.app 이 바뀐다. **다른 고객 덱이면** 덮어쓰기 전에 사용자에게 확인하거나 별도 프로젝트 이름을 쓴다.
- 확인: `get_deployment`로 READY, 별칭에 운영 주소가 붙었는지. 파일은 `web_fetch_vercel_url`.
- push마다 Vercel 봇이 PR에 미리보기 상태 댓글을 단다 → 할 일 없음.
