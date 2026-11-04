/* 자동 생성: content.json의 사본 (더블클릭으로 열 때 사용). 직접 고치지 말고 content.json을 고친 뒤 node tools/sync-content.mjs */
window.CONTENT_FALLBACK = {
  "dummy": false,
  "meta": {
    "brand": "CoMindWorks",
    "deckSubtitle": "HTML 모션 슬라이드 설계",
    "maker": "김정호",
    "date": "2026.11.03 기준",
    "dummyLabel": "예시 데이터"
  },
  "slides": [
    {
      "type": "cover",
      "railTitle": "표지",
      "eyebrow": "Design Doc · HTML Motion Slides",
      "titleLines": [
        "슬라이드는 HTML로 쓰고",
        "숫자는 데이터에서 꺼내고",
        "영상은 코드로 만듭니다"
      ],
      "subtitleLines": [
        "HTML 슬라이드와 모션그래픽을 재사용 가능한 템플릿으로 만들 수 있는지,",
        "3장짜리 샘플로 검증하는 설계 문서입니다."
      ],
      "cta": "설계 보기 ↗",
      "stamp": "DESIGN · DOC · 2026 · TEMPLATE · ",
      "stampCenter": "3장",
      "steps": [
        "입력 확인",
        "구현",
        "자가 검증",
        "다음 단계"
      ],
      "source": "출처: DESIGN_html-motion-slides.md · 김정호 (CoMindWorks) · 2026-11-03"
    },
    {
      "type": "list",
      "railTitle": "입력값",
      "eyebrow": "Inputs First",
      "title": "구현 전에 *다섯 가지*를 묻습니다",
      "subtitle": "답이 없으면 오른쪽 기본값으로 진행합니다.",
      "rows": [
        {
          "label": "발표 주제",
          "value": "자리표시 데이터",
          "note": "content.json만 바꾸면 주제가 교체되게"
        },
        {
          "label": "메인 컬러",
          "value": "#e81768",
          "note": "레퍼런스에서 실측한 핑크",
          "swatch": "#e81768"
        },
        {
          "label": "폰트",
          "value": "Pretendard (OFL)",
          "note": "woff2 파일을 assets/fonts/에 내장"
        },
        {
          "label": "모션그래픽 도구",
          "value": "Remotion → 없으면 GSAP",
          "note": "설치돼 있으면 Remotion, 아니면 GSAP HTML 애니메이션"
        },
        {
          "label": "음악",
          "value": "넣지 않음",
          "note": "영상은 무음"
        }
      ],
      "caution": "숫자 데이터는 지어내지 않습니다. 실제 데이터가 없으면 \"dummy\": true를 표시하고, 하단 출처 줄에 \"예시 데이터\"라고 보여 줍니다.",
      "source": "출처: 설계 문서 §0 먼저 확인할 입력값"
    },
    {
      "type": "tokens",
      "railTitle": "디자인 시스템",
      "eyebrow": "Design System",
      "title": "색 *일곱 개*, 글자 크기 다섯 단계",
      "subtitle": "레퍼런스 실측값입니다. 배경은 흰색 하나, 그림자와 그라데이션은 최소로 씁니다.",
      "colors": [
        {
          "name": "--accent",
          "hex": "#e81768",
          "role": "강조어·버튼·주요 막대·진행 막대"
        },
        {
          "name": "--accent-deep",
          "hex": "#920951",
          "role": "보조 막대·호버"
        },
        {
          "name": "--accent-pale",
          "hex": "#fbedf3",
          "role": "선택 배경·영역 채움"
        },
        {
          "name": "--ink",
          "hex": "#292a33",
          "role": "제목"
        },
        {
          "name": "--muted",
          "hex": "#787983",
          "role": "부제·캡션"
        },
        {
          "name": "--line",
          "hex": "#e9e8ed",
          "role": "구분선·비교 막대"
        },
        {
          "name": "--bg",
          "hex": "#ffffff",
          "role": "배경"
        }
      ],
      "typeScale": [
        {
          "role": "eyebrow",
          "spec": "11px · 700 · 대문자",
          "sample": "DESIGN SYSTEM",
          "px": 11,
          "weight": 700,
          "kind": "eyebrow"
        },
        {
          "role": "장표 제목",
          "spec": "44~48px · 800",
          "sample": "핵심어만 *강조색*",
          "px": 46,
          "weight": 800,
          "kind": "title"
        },
        {
          "role": "부제",
          "spec": "17px · 400",
          "sample": "부제는 한 줄로 씁니다",
          "px": 17,
          "weight": 400,
          "kind": "muted"
        },
        {
          "role": "큰 숫자",
          "spec": "72~80px · 800",
          "sample": "1,200",
          "unit": "ms",
          "px": 76,
          "weight": 800,
          "kind": "number"
        },
        {
          "role": "출처 줄",
          "spec": "11px · 400",
          "sample": "출처: 설계 문서 §3",
          "px": 11,
          "weight": 400,
          "kind": "muted"
        }
      ],
      "typeNote": "크기는 1600px 화면 기준입니다. 한글은 word-break: keep-all로 단어 중간에서 끊지 않습니다.",
      "source": "출처: 설계 문서 §3 디자인 시스템"
    },
    {
      "type": "structure",
      "railTitle": "고정 틀과 장 구성",
      "eyebrow": "Frame & Slides",
      "title": "고정 틀 하나에 *장 세 개*",
      "subtitle": "상단바·좌측 레일·하단바·진행 막대는 모든 장에 항상 보입니다.",
      "frameLabels": {
        "top": "로고 · 부제 · 제작자 · 기준일 · ⛶",
        "rail": "장 번호",
        "content": "장표 콘텐츠 영역",
        "bottom": "02 / 03 · 장 제목 · ← →",
        "progress": "진행 막대"
      },
      "cards": [
        {
          "no": "장 1",
          "name": "표지",
          "points": [
            "3줄 제목, 줄마다 첫 단어 강조",
            "추상 그래픽 + 원형 스탬프",
            "4단계 흐름선이 왼쪽부터 그려짐"
          ]
        },
        {
          "no": "장 2",
          "name": "수치 장표",
          "points": [
            "Chart.js 막대 (비교 회색, 현재 핑크)",
            "큰 숫자 + 증감률 + 해설 + 주의 박스",
            "연동 버튼 3개가 모두 함께 바꿈"
          ]
        },
        {
          "no": "장 3",
          "name": "모션그래픽",
          "points": [
            "16:9 영상, 직접 만든 컨트롤",
            "진입하면 무음 자동 재생",
            "떠나면 일시정지"
          ]
        }
      ],
      "source": "출처: 설계 문서 §3-3 고정 틀, §4 장표 설계"
    },
    {
      "type": "metrics",
      "railTitle": "모션 사양",
      "eyebrow": "Motion Spec",
      "title": "움직임도 *숫자로* 정합니다",
      "subtitle": "버튼을 누르면 차트·큰 숫자·해설이 함께 바뀝니다. 모든 값은 설계 문서에 적힌 그대로입니다.",
      "views": [
        {
          "button": "모션 길이",
          "unit": "ms",
          "labels": [
            "장 전환",
            "순차 간격",
            "카운트업",
            "차트",
            "흐름선"
          ],
          "series": [
            {
              "name": "길이",
              "role": "current",
              "values": [
                600,
                80,
                1100,
                850,
                1200
              ]
            }
          ],
          "big": {
            "rule": "max",
            "label": "가장 긴 모션 · 흐름선 그리기"
          },
          "notes": [
            "장 전환은 아래 16px에서 올라오며 0.6초 동안 나타납니다.",
            "장 안의 요소는 80ms 간격으로 하나씩 등장합니다.",
            "동작 줄이기 설정이면 모두 0이 됩니다."
          ]
        },
        {
          "button": "영상 구간",
          "unit": "초",
          "labels": [
            "키워드",
            "핵심 숫자",
            "4단계 흐름",
            "브랜드"
          ],
          "series": [
            {
              "name": "구간 길이",
              "role": "current",
              "values": [
                3,
                4,
                4,
                4
              ]
            }
          ],
          "big": {
            "rule": "sum",
            "label": "모션그래픽 영상 전체 길이"
          },
          "notes": [
            "1920×1080, 30fps, H.264, 무음입니다.",
            "큰 글자가 화면을 채우는 역동적인 구성입니다.",
            "첫 장면을 포스터 이미지로 함께 저장합니다."
          ]
        },
        {
          "button": "글자 크기",
          "unit": "px",
          "labels": [
            "eyebrow",
            "제목",
            "부제",
            "큰 숫자",
            "출처"
          ],
          "series": [
            {
              "name": "최소",
              "role": "compare",
              "values": [
                11,
                44,
                17,
                72,
                11
              ]
            },
            {
              "name": "최대",
              "role": "current",
              "values": [
                11,
                48,
                17,
                80,
                11
              ]
            }
          ],
          "big": {
            "rule": "max",
            "label": "가장 큰 글자 · 큰 숫자 (1600px 기준)"
          },
          "notes": [
            "제목은 44~48px, 큰 숫자는 72~80px 범위입니다.",
            "회색은 범위의 최소, 핑크는 최대입니다.",
            "eyebrow·부제·출처는 한 가지 크기입니다."
          ]
        }
      ],
      "defaultView": 0,
      "caution": "차트 값은 측정 데이터가 아니라 설계 문서에 적힌 사양 값입니다.",
      "source": "출처: 설계 문서 §3-2 타이포 규칙, §5 모션 사양, §6 영상 사양"
    },
    {
      "type": "video",
      "railTitle": "모션그래픽",
      "eyebrow": "Motion Graphic",
      "title": "*CoMindWorks* 가능성을 움직이다",
      "video": "assets/video/promo.mp4",
      "poster": "assets/video/promo-poster.jpg",
      "source": "영상: motion/promo.html을 GSAP로 렌더 · 장면 구성은 설계 문서 §6"
    },
    {
      "type": "checklist",
      "railTitle": "완료 기준",
      "eyebrow": "Definition of Done",
      "title": "완료 기준 *일곱 가지*를 스스로 확인합니다",
      "subtitle": "각 항목 아래 회색 글자는 3장 샘플(html-slides-sample)을 자동 검사로 확인한 결과입니다.",
      "items": [
        {
          "text": "인터넷 없이 더블클릭으로 열어도 폰트·영상이 정상",
          "result": "외부 요청을 막은 상태에서 폰트·차트·영상 표시"
        },
        {
          "text": "1920×1080, 1366×768에서 글자 넘침·겹침 없음",
          "result": "3장 × 2해상도 모두 0건, 스크린샷 6장 저장"
        },
        {
          "text": "장 2 연동 버튼 3개가 차트·숫자·해설을 모두 바꿈",
          "result": "세 버튼 모두 세 영역이 함께 바뀜"
        },
        {
          "text": "장 3 영상이 진입 시 자동 재생, 이탈 시 정지",
          "result": "무음 자동 재생, 떠나면 정지"
        },
        {
          "text": "콘솔 오류 0건",
          "result": "인터넷 연결 상태에서 0건"
        },
        {
          "text": "content.json 문구 하나를 바꾸면 코드 수정 없이 반영",
          "result": "서버로 열 때와 더블클릭 모두 반영"
        },
        {
          "text": "README에 주제 바꾸는 법·영상 다시 만드는 법을 3줄씩",
          "result": "각 3줄로 정리"
        }
      ],
      "statusLabel": "통과",
      "outTitle": "이번에 하지 않는 것",
      "outOfScope": [
        "사이드 패널 (하단 시트·중앙 팝업)",
        "세로 레버, 자동 발표 모드",
        "다크모드, 다국어, 서버 배포"
      ],
      "source": "출처: 설계 문서 §8 완료 기준, §9 범위 밖 · 결과: html-slides-sample/tools/check.mjs (2026-11-03)"
    }
  ],
  "motion": {
    "keyword": "모션",
    "keywordEyebrow": "HTML MOTION SLIDES",
    "number": {
      "value": 450,
      "unit": "프레임",
      "label": "15초 × 30fps",
      "chip": "1920×1080 · H.264 · 무음"
    },
    "stepsTitle": "HOW IT WORKS",
    "stepsFrom": 0,
    "message": "슬라이드도 코드로, 다시 쓰는 템플릿으로"
  }
};
