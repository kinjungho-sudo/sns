/* EP.02 영수증 사진 → 지출결의서 (결과물 프레임: 표형)
   원본: 무료 자료 배포 페이지의 EP.2 지출결의서 양식 · 프롬프트
   장면 길이(dur)는 초 단위. 합계 23.4초. */
window.EPISODE = {
  slug: "ep02-receipt",
  tag: "AI 업무 자동화",
  ep: "EP.02",
  topic: "지출결의서",
  scenes: [
    {
      type: "hook",
      dur: 3.4,
      headline: '영수증 사진,\n<span class="hl">30초</span>면 결의서',
      sub: "사진만 넣으면 회사 양식 그대로 채워져요",
      flow: [
        { icon: "camera", text: "영수증 사진" },
        { icon: "spark", text: "Claude", on: true },
        { icon: "table", text: "지출결의서" },
      ],
    },
    {
      type: "before",
      dur: 3.8,
      label: "BEFORE",
      headline: '월말마다 영수증\n<span class="hl">한 줄씩 옮겨 적기</span>',
      timer: { prefix: "입력 중… ", to: 47, unit: "분째" },
      receipts: [
        { store: "온기카페 역삼점", date: "2026-10-06 10:12", items: [["아메리카노 x4", 16000], ["휘낭시에 x2", 2500]], total: 18500 },
        { store: "가온식당", date: "2026-10-06 12:31", items: [["제육정식 x6", 54000]], total: 54000 },
        { store: "한결운수 택시", date: "2026-10-07 18:47", items: [["운임", 12300]], total: 12300 },
        { store: "세움문구", date: "2026-10-08 09:05", items: [["A4용지 1박스", 21000], ["포스트잇", 2800]], total: 23800 },
      ],
    },
    {
      type: "sheet",
      dur: 9.0,
      swapAt: 2.6,
      frame: { label: "핵심", headline: '우리 회사 양식,\n<span class="hl">그대로</span> 넣으세요' },
      after: { label: "AFTER", headline: '사진 던지고\n<span class="hl">30초</span> 뒤' },
      status: { working: "Claude가 영수증 읽는 중…", done: "✓ 완료 · 28초" },
      stamp: { big: "30초", small: "작성 끝" },
      sheet: {
        title: "지출결의서",
        meta: "소속 마케팅팀 · 작성자 담당자",
        approval: ["담당", "팀장", "부서장"],
        cols: [
          { h: "No.", k: "no", w: 9, type: "center" },
          { h: "지출일자", k: "date", w: 17 },
          { h: "계정과목", k: "acct", w: 23, type: "pill" },
          { h: "적요", k: "desc", w: 25 },
          { h: "금액(원)", k: "amount", w: 26, type: "num" },
        ],
        sumKey: "amount",
        totalLabel: "합계 금액",
        rows: [
          { no: 1, date: "10/06", acct: "회의비", desc: "거래처 미팅", amount: 18500 },
          { no: 2, date: "10/06", acct: "복리후생비", desc: "팀 점심 6인", amount: 54000 },
          { no: 3, date: "10/07", acct: "여비교통비", desc: "외근 택시", amount: 12300 },
          { no: 4, date: "10/08", acct: "소모품비", desc: "A4 · 포스트잇", amount: 23800 },
        ],
      },
    },
    {
      type: "steps",
      dur: 3.8,
      label: "HOW",
      headline: '딱 <span class="hl">3단계</span>',
      steps: [
        { title: "영수증 사진 + 양식 올리기", desc: "여러 장 한꺼번에 OK" },
        { title: "프롬프트 붙여넣기", desc: "계정과목까지 자동 분류" },
        { title: "합계 · 날짜만 확인", desc: "완성된 엑셀 파일 그대로 제출" },
      ],
      note: "Claude · ChatGPT 둘 다 됩니다",
    },
    {
      type: "cta",
      dur: 3.4,
      label: "무료 배포",
      headline: '댓글에\n<span class="hl">“영수증”</span>',
      keyword: "영수증",
      box: { k: "양식 + 프롬프트 바로 보내드려요", d: "복붙만 하면 이번 달부터 씁니다" },
      follow: "팔로우하면 매일 1편, 업무 자동화",
    },
  ],
};
