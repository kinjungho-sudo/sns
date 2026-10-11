/* EP.01 회의 메모 → 회의록 (결과물 프레임: 문서형)
   원본: 무료 자료 배포 페이지의 EP.1 실습 파일(회의메모.txt · 회의록_양식.docx)
   장면 길이(dur)는 초 단위. 합계 24.2초. */
window.EPISODE = {
  slug: "ep01-meeting",
  tag: "AI 업무 자동화",
  ep: "EP.01",
  topic: "회의록 정리",
  scenes: [
    {
      type: "hook",
      dur: 3.4,
      headline: '회의 메모,\n<span class="hl">30초</span>면 회의록',
      sub: "녹취 · 메모 · 손글씨, 그대로 던지세요",
      flow: [
        { icon: "mic", text: "녹취 · 메모" },
        { icon: "spark", text: "Claude", on: true },
        { icon: "doc", text: "회의록" },
      ],
    },
    {
      type: "before",
      dur: 3.8,
      label: "BEFORE",
      headline: '회의 끝나면\n<span class="hl">메모 해독</span>부터',
      timer: { prefix: "정리 중… ", to: 40, unit: "분째" },
      memo: {
        title: "설명회 준비 회의 9/7",
        lines: [
          "24일 회의실 안 됨",
          "→ 9/25 14~16시, 2층 교육장으로",
          "온라인도? 장비/인력 더 필요...",
          "초청 후보 40곳 / 정원 30명",
          "넘으면 대기 명단",
          "발표 60 + 질의 30",
          "예산 120만원 확정",
          "다과 18만원 견적. 주문 아직 X",
          "주차 안내 → 기한 얘기 못 함",
          "녹화본?? 확인 필요 → 보류",
        ],
        extras: [
          { icon: "mic", text: "녹취 40분" },
          { icon: "camera", text: "화이트보드" },
          { icon: "chat", text: "단톡방 메모" },
        ],
      },
    },
    {
      type: "doc",
      dur: 10.2,
      swapAt: 2.6,
      top: 455,
      frame: { label: "핵심", headline: '우리 회사 양식,\n<span class="hl">그대로</span> 넣으세요' },
      after: { label: "AFTER", headline: '메모 던지고\n<span class="hl">30초</span> 뒤' },
      status: { working: "Claude가 메모 읽는 중…", done: "✓ 완료 · 26초" },
      stamp: { big: "30초", small: "정리 끝" },
      doc: {
        title: "회의록",
        meta: "HealthDay (주)",
        info: [
          ["회의명", "HealthDay 신규 서비스 설명회 준비", true],
          ["일시", "2026.09.07 10:00~10:40"],
          ["참석", "기획 · 영업 · 마케팅 · 운영"],
        ],
        sections: [
          {
            no: 3, title: "결정 사항",
            items: [
              "설명회 9/25 14~16시 · 본사 2층 교육장",
              "현장만 진행 · 30명 초과 시 대기 명단",
              "발표 60분 + 질의 30분 · 예산 120만원",
            ],
          },
          {
            no: 4, title: "미정 · 추후 결정",
            items: [
              ["다과 주문 (18만원 견적)", "승인 대기"],
              ["못 온 고객 녹화본 제공", "확인 필요"],
            ],
          },
        ],
        actionsNo: 5,
        actions: [
          ["교육장 예약 후 공유", "운영", "9/8"],
          ["초청 고객 목록 전달", "영업", "9/10"],
          ["초청장 초안 작성", "마케팅", "9/11"],
          ["주차 안내 전달", "운영", "확인 필요"],
        ],
      },
    },
    {
      type: "steps",
      dur: 3.8,
      label: "HOW",
      headline: '딱 <span class="hl">3단계</span>',
      steps: [
        { title: "메모 + 회의록 양식 넣기", desc: "녹취 · 메모 · 손글씨 사진 다 OK" },
        { title: "프롬프트 붙여넣기", desc: "4줄짜리, 복붙 한 번" },
        { title: "Word로 저장", desc: "우리 회사 양식 그대로" },
      ],
      note: "원문에 없는 내용은 ‘확인 필요’로 표시돼요",
    },
    {
      type: "cta",
      dur: 3.0,
      label: "무료 배포",
      headline: '댓글에\n<span class="hl">“회의록”</span>',
      keyword: "회의록",
      box: { k: "양식 + 프롬프트 바로 보내드려요", d: "복붙만 하면 오늘 회의부터 씁니다" },
      follow: "팔로우하면 매일 1편, 업무 자동화",
    },
  ],
};
