/* =========================================================================
   슬라이드 콘텐츠 + 템플릿
   -------------------------------------------------------------------------
   새 캐러셀을 만들려면 아래 SLIDES 배열만 수정하세요.
   각 슬라이드는 type 으로 레이아웃을 고르고, 나머지 필드로 내용을 채웁니다.
   지원 type: "quote" | "hook" | "section" | "timeline" | "chat"
   ⚑ 표시가 붙은 문자열에는 <span class="tl">...</span> 로 청록 강조를 넣을 수 있습니다.
   ========================================================================= */

const SLIDES = [
  /* 1) 표지 — 인용구 --------------------------------------------------- */
  {
    type: "quote",
    // ⚑ 줄바꿈은 \n, 청록 강조는 <span class="tl">
    headline: '메일을 완성하는 건\n영어 실력이 아니라\n<span class="tl">설명 실력</span>이다.',
    caption: "실전 AI 활용 가이드 — 2026",
  },

  /* 2) 후킹 — 이메일 목업 --------------------------------------------- */
  {
    type: "hook",
    mail: {
      to: "새 메일 — To: partner@us-company.com",
      line1: "Dear Mr. Johnson,",
      line2: 'I am…&nbsp;<span class="cursor">|</span>',
      line3: "여기서 30분째…",
      sticker: "번역기 3번째",
    },
    // ⚑ .big 클래스로 특정 줄을 더 크게
    headline: '영어 메일 한 통에\n<span class="tl big">30분째</span>\n굳어 있다면',
  },

  /* 3) 본문 01 — before / after -------------------------------------- */
  {
    type: "section",
    badge: "01",
    title: "번역하지 말고,\n상황을 설명하라",
    before: {
      label: "한국어로 쓰고 번역",
      body: "문법은 맞는데 어딘가 어색하고,\n뉘앙스가 무례해질까 봐 불안함",
    },
    after: {
      label: "상황을 주고 작성 요청",
      body: '"3년 된 파트너에게 납기 연장 요청"\n→ 그 상황에 맞는 원어민 문장이 나옴',
    },
    // ⚑
    footer: 'AI에게 필요한 건 문장이 아니라\n<span class="tl">관계·목적·톤</span> 세 가지입니다.',
  },

  /* 4) 본문 02 — 타임라인 -------------------------------------------- */
  {
    type: "timeline",
    badge: "02",
    title: "지시할 3요소",
    items: [
      { icon: "people", title: "관계", desc: "첫 거래처인지, 3년 된 파트너인지 — 거리감이 달라진다" },
      { icon: "target", title: "목적", desc: "요청·거절·독촉·사과 — 메일이 도착해야 할 지점" },
      { icon: "pencil", title: "톤",   desc: '"정중하되 사과 과잉 금지" — 한국식 겸양은 빼달라고' },
    ],
    // ⚑
    pill: '3요소만 주면&nbsp;&nbsp;<span class="tl">30분 → 3분</span>',
  },

  /* 5) 본문 03 — 채팅 목업 ------------------------------------------- */
  {
    type: "chat",
    badge: "03",
    title: "복붙용 프롬프트",
    window: "AI 어시스턴트",
    prompt:
      "미국 거래처에 납기 1주 연장을\n요청하는 영어 메일 써줘.\n" +
      "관계: 3년 된 파트너\n목적: 연장 승인 + 신뢰 유지\n" +
      "톤: 정중하되 사과 과잉 금지\n그리고 문장별 뉘앙스를 한국어로 설명해줘.",
    respTitle: "영문 메일 + 뉘앙스 해설",
    // ⚑
    footer: '<span class="tl">"뉘앙스 설명"</span>을 시키면 영어 공부까지 된다',
  },
];

/* ---- 아이콘 (인라인 SVG) ------------------------------------------------ */
const ICONS = {
  people: '<svg viewBox="0 0 24 24" fill="none" stroke="#06201d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="#06201d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="#06201d"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="#06201d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  send:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
  copy:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
};

/* ---- 텍스트 헬퍼: \n → 줄바꿈(HTML은 그대로 통과) ---------------------- */
const nl = (s) => (s || "").replace(/\n/g, "<br>");

/* ---- 템플릿별 렌더러 ---------------------------------------------------- */
const TEMPLATES = {
  quote: (s) => `
    <div class="qmark">&#8220;</div>
    <div class="headline">${nl(s.headline)}</div>
    <div class="rule"></div>
    <div class="caption">${s.caption}</div>`,

  hook: (s) => `
    <div class="mockup-wrap">
      <div class="mail-window">
        <div class="win-head"><div class="mac-dots"><i></i><i></i><i></i></div>
          <div class="win-title">${s.mail.to}</div></div>
        <div class="win-body">
          <div class="l1">${s.mail.line1}</div>
          <div class="l2">${s.mail.line2}</div>
          <div class="l3">${s.mail.line3}</div>
        </div>
      </div>
      <div class="sticker">${s.mail.sticker}</div>
    </div>
    <div class="headline">${nl(s.headline)}</div>`,

  section: (s) => `
    <div class="sec-head">
      <div class="badge">${s.badge}</div>
      <div class="title">${nl(s.title)}</div>
      <div class="rule"></div>
    </div>
    <div style="margin-top:40px">
      <div class="io-card"><div class="io-label">${s.before.label}</div>
        <div class="io-body">${nl(s.before.body)}</div></div>
      <div class="io-arrow">&#8595;</div>
      <div class="io-card after"><div class="io-label">${s.after.label}</div>
        <div class="io-body">${nl(s.after.body)}</div></div>
    </div>
    <div class="sec-foot">${nl(s.footer)}</div>`,

  timeline: (s) => `
    <div class="sec-head">
      <div class="badge">${s.badge}</div>
      <div class="title">${nl(s.title)}</div>
      <div class="rule"></div>
    </div>
    <div class="timeline">
      ${s.items.map((it) => `
        <div class="tl-row">
          <div class="tl-icon">${ICONS[it.icon] || ""}</div>
          <div class="tl-text"><h3>${it.title}</h3><p>${it.desc}</p></div>
        </div>`).join("")}
    </div>
    <div class="pill">${s.pill}</div>`,

  chat: (s) => `
    <div class="sec-head">
      <div class="badge">${s.badge}</div>
      <div class="title">${nl(s.title)}</div>
      <div class="rule"></div>
    </div>
    <div class="chat-window">
      <div class="win-head"><div class="mac-dots"><i></i><i></i><i></i></div>
        <div class="win-title">${s.window}</div></div>
      <div class="win-body">
        <div class="bubble">${nl(s.prompt)}</div>
        <div class="resp-card">
          <div class="resp-title">${ICONS.send}${s.respTitle}</div>
          <div class="skel"></div><div class="skel"></div><div class="skel"></div>
        </div>
      </div>
    </div>
    <div class="chat-foot">${ICONS.copy}<span>${s.footer}</span></div>`,
};

/* ---- 하나의 슬라이드을 .card 엘리먼트로 생성 --------------------------- */
function buildCard(slide, index, total) {
  const card = document.createElement("div");
  card.className = `card t-${slide.type}`;
  card.dataset.index = index;
  card.innerHTML = (TEMPLATES[slide.type] || (() => ""))(slide);

  // 페이지 도트
  const dots = document.createElement("div");
  dots.className = "dots";
  for (let i = 0; i < total; i++) {
    const d = document.createElement("span");
    d.className = "dot" + (i === index ? " active" : "");
    dots.appendChild(d);
  }
  card.appendChild(dots);
  return card;
}

if (typeof window !== "undefined") {
  window.SLIDES = SLIDES;
  window.buildCard = buildCard;
}
