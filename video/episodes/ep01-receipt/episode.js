/* EP.01 영수증 사진 → 지출내역표 (결과물 프레임: 표형)
   장면 길이(dur)는 초 단위. 합계 23.4초. */
window.EPISODE = {
  slug: "ep01-receipt",
  tag: "AI 업무 자동화",
  ep: "EP.01",
  topic: "영수증 정리",
  scenes: [
    {
      type: "hook",
      dur: 3.4,
      headline: '영수증 5장,\n<span class="hl">30초</span>면 끝.',
      sub: "사진만 던지면 지출내역표가 완성돼요",
      flow: [
        { icon: "camera", text: "영수증 사진" },
        { icon: "spark", text: "Claude", on: true },
        { icon: "table", text: "지출내역표" },
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
        { store: "다온주차장", date: "2026-10-08 14:20", items: [["주차 3시간", 6000]], total: 6000 },
      ],
    },
    {
      type: "sheet",
      dur: 9.0,
      swapAt: 2.6,
      frame: { label: "핵심", headline: '우리 회사 양식,\n<span class="hl">그대로</span> 넣으세요' },
      after: { label: "AFTER", headline: '사진 던지고\n<span class="hl">30초</span> 뒤' },
      status: { working: "Claude가 영수증 읽는 중…", done: "✓ 완료 · 28초" },
      stamp: { big: "30초", small: "정리 끝" },
      sheet: {
        title: "10월 지출내역",
        meta: "마케팅팀 · 담당자",
        cols: ["날짜", "사용처", "계정과목", "금액"],
        widths: [16, 32, 26, 26],
        totalLabel: "합계",
        rows: [
          { date: "10/06", store: "온기카페", acct: "회의비", amount: 18500 },
          { date: "10/06", store: "가온식당", acct: "복리후생비", amount: 54000 },
          { date: "10/07", store: "한결운수 택시", acct: "여비교통비", amount: 12300 },
          { date: "10/08", store: "세움문구", acct: "소모품비", amount: 23800 },
          { date: "10/08", store: "다온주차장", acct: "차량유지비", amount: 6000 },
        ],
      },
    },
    {
      type: "steps",
      dur: 3.8,
      label: "HOW",
      headline: '딱 <span class="hl">3단계</span>',
      steps: [
        { title: "양식 + 프롬프트 붙여넣기", desc: "처음 한 번만 하면 끝" },
        { title: "영수증 사진 던지기", desc: "여러 장 한꺼번에 OK" },
        { title: "표 복사 → 엑셀 붙여넣기", desc: "계정과목 · 합계까지 자동" },
      ],
      note: "준비물: Claude 계정 하나",
    },
    {
      type: "cta",
      dur: 3.4,
      label: "무료 배포",
      headline: '댓글에\n<span class="hl">“영수증”</span>',
      keyword: "영수증",
      box: { k: "양식 + 프롬프트 바로 보내드려요", d: "복붙만 하면 오늘부터 씁니다" },
      follow: "팔로우하면 매일 1편, 업무 자동화",
    },
  ],
};
