# 엔진 구조 (vands-motion-ppt 기준)

## 파일
| 파일 | 역할 |
|---|---|
| `index.html` | 셸(1600×900 고정 캔버스를 화면에 맞게 축소), 상단 제목·부 버튼, 시작 버튼 `#start`, 전체 화면 버튼 `#fsbtn`, 단축키 안내 `.hint`, 도움말 `#keys`, 자막 `#cap`, 오디오 `#bgm` `#voa`, 공유 메타 |
| `app.js` | 1부 장면 + 재생 엔진 전부 |
| `next-scenes.js` | 2부 장면 (`geo(sub, html, source, url)` 빌더) |
| `roadmap-scenes.js` | 3부 시연 장면 (`demo(sub, 영상이름, 초, 라벨, side(...), 출처, url)`) |
| `style.css` → `themes/*.css` | 원본은 보라 톤. `tools/make-themes.py`가 noir/ivory/blush로 색을 자동 변환 |
| `motion/*.html` | 시연 영상 소스(GSAP). `motion/base.css`, `motion-kit.js`(typeText, start) |
| `assets/` | 캡처 이미지, `video/<테마>/`, `audio/bgm.m4a`, `audio/narration/*.mp3`+`files.js`, `og.jpg`, `fonts/`(Pretendard) |
| `tools/` | check.mjs(검사), render-video.mjs, make-themes.py, make-bgm.mjs, make-og.mjs(+og/), typecast.mjs, server.mjs |

## 장면 객체
```js
{title:'진단 결과', vokey:'1-3', sub:'부제', source:'출처 문구', url:'원문 링크',
 duration:8, stops:[0,2.8,5.7,8],      // 생략 시 기본값
 html:`...${R(0,'<div>…</div>')}${R(1.8,'…')}...`}
```
- `R(at, html, cls)` = `at`초에 등장(블러+튀어오름). 시간은 장면 안 초.
- `screen('이미지이름','주소표시')` = 브라우저 틀 캡처. `.zoomable`이 붙어 크게 등장→칸으로, 클릭 확대.
- `metric()`, `chart()`, `.quote`, `.row`, `.note`, `.pill` 등 부품은 style.css 참고.
- 부 표지: `COVER={부:[첫줄,둘째줄(금색),작은 머리말]}` → 큰 글씨 한 글자씩.
- `KEEP[부](장면)` 가 true인 장면만 발표에 들어간다(원본 장면은 남겨 두고 간추림).
- 키: `vokey`가 있으면 그 값, 없으면 부 안 순서대로 `부-1, 부-2…`. 내레이션 파일·`VO` 대본·`VO_LEN`(초)이 이 키로 연결된다. **장면을 빼거나 넣을 땐 vokey로 기존 음성과 맞춰라.**
- 마지막 감사 장면은 `scenes.push({part:3,cover:true,title:'감사합니다',key:'3-end',...})`.

## 재생
- `SPEED`(1.25): 장면 시간·내레이션·시연 영상 재생 속도 공통.
- 장면 길이 = max(지정 길이, 음성 길이 + 0.6초).
- `advance()`는 부를 넘어 끝까지 진행, 마지막에서 멈춤.
- `audioTick()`이 매 프레임 배경음악을 조절: 재생 중에만, 내레이션·자막 중엔 작게, 멈추면 꺼짐.
- 시작 버튼 `begin()`: 소리 시작 + 재생. `?nostart` 주소면 생략(검사용).
- 시연 영상 클릭 → `bigVideo()`가 영상을 body로 옮겨 화면 가득(움직이는 상자 안에선 fixed가 갇히므로). 장면 이동·Esc에 원래대로.
- 단축키: Space 재생/정지, ←→ 부, `,` `.` 장면, 1·2·3 부, R 처음, M 소리, C 자막, F 전체 화면, ? 도움말, Esc.
- 모바일: html/body overflow hidden + clientWidth 기준 축소. 휴대폰에선 단축키 안내 숨기고 전체 화면 버튼 가운데.

## 검사 (tools/check.mjs)
영상 사양(H.264·1920×1080·30fps·길이·밝기 급변), 장면 이동·자동 진행·부 이동·End·새로고침 유지, 시연 영상 자동 재생·정지·클릭 확대, 4테마 열림, 확대/축소, 동작 줄이기. 장면 구성이 바뀌면 `#번호` 기대값을 고친다.
