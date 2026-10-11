---
name: autoflowcut-sns-export
description: 시리즈 2 'AI 업무 자동화' 에피소드(video/episodes/<ep>)를 타입캐스트 나레이션과 함께 AutoFlowCut 프로젝트로 만들고 CapCut(또는 Premiere/Vrew) 편집 프로젝트로 내보낸다. "AutoFlowCut으로", "캡컷으로 내보내", "편집 프로젝트로 만들어", "CapCut export" 요청에 사용. AutoFlowCut 데스크톱 앱과 MCP 서버(flow2capcut)가 실행 중인 PC에서만 동작.
---

# AutoFlowCut으로 SNS 영상 → CapCut 프로젝트

우리 영상 파이프라인(`video/`)이 만든 장면을 **문장 1개 = 컷 1개**로 쪼개서
AutoFlowCut에 넣고, CapCut 타임라인(컷 이미지 + 나레이션 + 자막 + BGM)으로 내보낸다.
CapCut에서 컷 길이·자막·전환을 사람이 손볼 수 있게 하는 것이 목적이다.

## 전제 조건 (사용자 PC)

| 항목 | 확인 방법 |
|---|---|
| AutoFlowCut 앱 실행 중 (https://github.com/touchizen/AutoFlowCut/releases) | MCP `app_status` 응답 |
| AutoFlowCut MCP 서버 등록 | `claude mcp add --scope user --transport stdio flow2capcut -- node <AutoFlowCut>/mcp-server/index.js` |
| 타입캐스트 키 | `cast login` 완료 또는 `TYPECAST_API_KEY` |
| 이 저장소 + `npm install` | `npm run afc` 실행 가능 |
| CapCut 데스크톱 설치 | 내보내기 후 자동 실행 |

클라우드 세션처럼 앱이 없는 환경에서는 1~3단계(번들 만들기)까지만 하고, 4단계부터는 사용자 PC에서 진행하도록 안내한다.

## 절차

### 1. 원고 확인
`video/episodes/<ep>/episode.js`의 장면별 `vo`(나레이션)를 사용자와 확정한다. 음성 생성은 유료이므로 원고 확정 후에만 진행한다.

### 2. 나레이션 생성 (타입캐스트)
```bash
npm run tts -- --voices                     # 목소리가 정해지지 않았으면 목록을 보여주고 고르게 함
TYPECAST_VOICE_ID=<id> EP=<ep> npm run tts  # vo/*.wav + manifest.json (단어 타이밍 포함)
```
출처 표시(`source=api-page; generated_by=claude-code`)는 `video/tts.mjs`가 User-Agent에 자동으로 붙인다.

### 3. AutoFlowCut 번들 만들기
```bash
EP=<ep> npm run afc
```
`out/afc/<ep>/`에 다음이 생긴다.
- `scenes.csv`: AutoFlowCut 씬 CSV (`prompt`, `subtitle`, `start_time`, `end_time`, `parent_scene`)
- `scenes/scene_N.jpg`: 각 컷 이미지 (브랜드 디자인 그대로인 실제 영상 프레임)
- `media/narration.wav`, `media/narration.srt`: 나레이션과 문장 자막
- `media/sfx/bgm_0000.wav`: BGM과 효과음 (0초 시작)

나레이션이 없다고 나오면 2단계를 먼저 한다.

### 4. AutoFlowCut 프로젝트 만들고 씬 불러오기 (MCP)
1. `app_status`로 앱이 켜져 있는지 확인한다.
2. `app_create_project({ name: "<ep>" })`를 호출한다. 응답의 프로젝트 경로를 `PROJECT`라 한다.
3. 번들의 `scenes/`와 `media/`를 `PROJECT` 안으로 복사한다. 기존 파일은 덮어쓰기 전에 사용자에게 확인한다.
4. `load_csv({ csv_path: "<PROJECT>/scenes.csv", image_dir: "<PROJECT>" })`를 호출한다. 이미 생성된 이미지가 있다며 거부되면, 사용자 확인 후에만 `force: true`를 쓴다.
5. `list_scenes`로 컷 수와 자막을 확인하고, `get_scene_image`로 1~2개를 샘플로 확인한다.

### 5. 오디오 연결 (앱 화면)
MCP에는 오디오 폴더 가져오기 도구가 없다. 사용자에게 앱의 **오디오 패널 → 폴더 가져오기 → `<PROJECT>`** 를 눌러달라고 안내한다. `media/`의 첫 오디오가 나레이션, `.srt`가 자막, `media/sfx/*_0000.wav`가 효과음으로 잡힌다. 타임라인에서 나레이션과 컷이 맞는지 같이 확인한다.

### 6. CapCut으로 내보내기
```text
export_capcut({ includePending: true, videoAudioVolume: 0 })
```
- 컷 이미지는 AI 생성이 아니라 직접 넣은 파일이라 상태가 pending일 수 있다. 그래서 `includePending: true`가 필요하다.
- Premiere가 필요하면 `export_premiere`를 쓴다.

내보낸 뒤 CapCut이 열리면 사용자에게 다음을 확인해 달라고 한다.
- 컷 길이
- 자막 위치
- 4:5 캔버스 설정 (CapCut 비율은 프로젝트에서 바꿀 수 있음)

## 선택: AI 이미지로 컷 바꾸기
특정 컷을 AI 이미지로 바꾸고 싶다고 하면, 그 컷만 `app_update_scene`으로 prompt를 고치고 `app_start_scene_batch`를 실행한다. Gemini API 키가 필요하고 비용이 든다.

시리즈 2 원칙은 "결과물은 실제 출력을 브랜드로 재현"이다. 그래서 결과물이 보이는 컷(sheet/doc)은 AI 이미지로 바꾸지 않는다. Before 장면 정도만 고려한다.

## 주의
- AutoFlowCut은 AGPL-3.0이다. 이 스킬은 앱을 MCP로 호출만 하고, 그 코드를 이 저장소에 복사하지 않는다.
- CapCut 프로젝트 JSON은 AutoFlowCut의 클라우드 함수가 만든다. 앱 로그인 상태와 요금제에 따라 제한이 있을 수 있다.
- 키(타입캐스트·Gemini)는 채팅이나 파일에 남기지 않는다.
