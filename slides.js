/* =========================================================================
   캐러셀 콘텐츠 + 템플릿
   -------------------------------------------------------------------------
   CAROUSELS 배열에 여러 개의 캐러셀을 담습니다. 각 캐러셀은
     { slug, title, slides: [ ... ] }
   slug  : PNG 저장 폴더 이름 (out/<slug>/)
   title : 미리보기 드롭다운에 표시되는 이름
   slides: 슬라이드 배열. 각 슬라이드는 type 으로 레이아웃을 고릅니다.
           지원 type: "quote" | "hook" | "section" | "timeline" | "chat"

   ⚑ 텍스트 팁
     · 줄바꿈  : 문자열 안에 \n
     · 청록 강조: <span class="tl">강조</span>  (hook 헤드라인은 .tl.big 로 확대)
     · 아이콘  : people · target · pencil (아래 ICONS 참고)
   ========================================================================= */

const CAROUSELS = [
  /* ===================================================================== *
   * 1) 영어 이메일                                                         *
   * ===================================================================== */
  {
    slug: "1-email",
    title: "① 영어 이메일",
    slides: [
      {
        type: "quote",
        headline: '메일을 완성하는 건\n영어 실력이 아니라\n<span class="tl">설명 실력</span>이다.',
        caption: "실전 AI 활용 가이드 — 2026",
      },
      {
        type: "hook",
        mail: {
          to: "새 메일 — To: partner@us-company.com",
          line1: "Dear Mr. Johnson,",
          line2: 'I am…&nbsp;<span class="cursor">|</span>',
          line3: "여기서 30분째…",
          sticker: "번역기 3번째",
        },
        headline: '영어 메일 한 통에\n<span class="tl big">30분째</span>\n굳어 있다면',
      },
      {
        type: "section",
        badge: "01",
        title: "번역하지 말고,\n상황을 설명하라",
        before: { label: "한국어로 쓰고 번역", body: "문법은 맞는데 어딘가 어색하고,\n뉘앙스가 무례해질까 봐 불안함" },
        after: { label: "상황을 주고 작성 요청", body: '"3년 된 파트너에게 납기 연장 요청"\n→ 그 상황에 맞는 원어민 문장이 나옴' },
        footer: 'AI에게 필요한 건 문장이 아니라\n<span class="tl">관계·목적·톤</span> 세 가지입니다.',
      },
      {
        type: "timeline",
        badge: "02",
        title: "지시할 3요소",
        items: [
          { icon: "people", title: "관계", desc: "첫 거래처인지, 3년 된 파트너인지 — 거리감이 달라진다" },
          { icon: "target", title: "목적", desc: "요청·거절·독촉·사과 — 메일이 도착해야 할 지점" },
          { icon: "pencil", title: "톤", desc: '"정중하되 사과 과잉 금지" — 한국식 겸양은 빼달라고' },
        ],
        pill: '3요소만 주면&nbsp;&nbsp;<span class="tl">30분 → 3분</span>',
      },
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
        footer: '<span class="tl">"뉘앙스 설명"</span>을 시키면 영어 공부까지 된다',
      },
    ],
  },

  /* ===================================================================== *
   * 2) 회의록 정리                                                         *
   * ===================================================================== */
  {
    slug: "2-meeting",
    title: "② 회의록 정리",
    slides: [
      {
        type: "quote",
        headline: '회의록을 못 쓰는 건\n기억력이 아니라\n<span class="tl">구조화</span>다.',
        caption: "실전 AI 활용 가이드 — 2026",
      },
      {
        type: "hook",
        mail: {
          to: "음성 메모 — 주간회의.m4a",
          line1: "어… 그래서 그 건은…",
          line2: '일단 넘어가고…&nbsp;<span class="cursor">|</span>',
          line3: "48분 39초 녹음됨",
          sticker: "받아쓰기 3장",
        },
        headline: '1시간 회의가\n<span class="tl big">텍스트 3장</span>으로\n쌓여만 있다면',
      },
      {
        type: "section",
        badge: "01",
        title: "받아쓰지 말고,\n뽑아내라",
        before: { label: "녹취록 그대로 저장", body: "누가 무슨 말 했는지는 있는데\n뭘 하기로 했는지가 안 보임" },
        after: { label: "형식을 정해 요약 요청", body: '"결정사항·담당자·기한만 표로"\n→ 바로 공유되는 회의록' },
        footer: 'AI에게 필요한 건 녹취가 아니라\n<span class="tl">형식·관점·대상</span>입니다.',
      },
      {
        type: "timeline",
        badge: "02",
        title: "정리시킬 3가지",
        items: [
          { icon: "target", title: "결정", desc: "무엇을 하기로 했나 — 회의의 결론" },
          { icon: "pencil", title: "할 일", desc: "누가·언제까지 — 담당과 기한이 붙은 액션" },
          { icon: "people", title: "쟁점", desc: "아직 안 정해진 것 — 다음 회의 안건" },
        ],
        pill: '3가지만 주면&nbsp;&nbsp;<span class="tl">1시간 → 3분</span>',
      },
      {
        type: "chat",
        badge: "03",
        title: "복붙용 프롬프트",
        window: "AI 어시스턴트",
        prompt:
          "아래 회의 녹취를 정리해줘.\n① 결정사항 — 한 줄씩\n" +
          "② 할 일 — 담당자·기한을 표로\n③ 다음 회의 안건\n" +
          "말투는 사내 공유용으로 담백하게.",
        respTitle: "회의록 + 액션 아이템 표",
        footer: '<span class="tl">"표로"</span> 한마디면 공유가 쉬워진다',
      },
    ],
  },

  /* ===================================================================== *
   * 3) 보고서 초안                                                         *
   * ===================================================================== */
  {
    slug: "3-report",
    title: "③ 보고서 초안",
    slides: [
      {
        type: "quote",
        headline: '보고서가 안 써지는 건\n실력이 아니라\n<span class="tl">첫 문장</span> 때문이다.',
        caption: "실전 AI 활용 가이드 — 2026",
      },
      {
        type: "hook",
        mail: {
          to: "보고서_최종_v3.docx",
          line1: "제목: 2분기 실적 보고",
          line2: '1. 개요…&nbsp;<span class="cursor">|</span>',
          line3: "커서만 40분째 깜빡임",
          sticker: "빈 화면 40분",
        },
        headline: '백지 문서 앞에서\n<span class="tl big">40분째</span>\n멈춰 있다면',
      },
      {
        type: "section",
        badge: "01",
        title: "완성하지 말고,\n초안부터 받아라",
        before: { label: "처음부터 완벽하게", body: "한 줄 쓰고 지우기 반복,\n구조가 안 잡혀 진도가 안 나감" },
        after: { label: "뼈대를 먼저 요청", body: '"목차랑 항목별 3줄 초안"\n→ 고칠 거리가 생기면 빨라진다' },
        footer: 'AI에게 필요한 건 완성이 아니라\n<span class="tl">목적·독자·분량</span>입니다.',
      },
      {
        type: "timeline",
        badge: "02",
        title: "알려줄 3가지",
        items: [
          { icon: "target", title: "목적", desc: "보고인지 설득인지 — 글이 향하는 방향" },
          { icon: "people", title: "독자", desc: "임원인지 실무자인지 — 깊이를 조절" },
          { icon: "pencil", title: "분량", desc: "1장인지 10장인지 — 밀도를 결정" },
        ],
        pill: '3가지만 주면&nbsp;&nbsp;<span class="tl">백지 → 초안</span>',
      },
      {
        type: "chat",
        badge: "03",
        title: "복붙용 프롬프트",
        window: "AI 어시스턴트",
        prompt:
          "2분기 실적 보고서 초안 써줘.\n목적: 경영진 보고\n" +
          "독자: 임원 — 숫자보다 결론 먼저\n분량: A4 1장\n" +
          "목차부터 잡고 항목별 3줄로.",
        respTitle: "목차 + 항목별 초안",
        footer: '<span class="tl">"목차부터"</span> 시키면 막히지 않는다',
      },
    ],
  },

  /* ===================================================================== *
   * 4) 엑셀 / 데이터                                                       *
   * ===================================================================== */
  {
    slug: "4-excel",
    title: "④ 엑셀 · 데이터",
    slides: [
      {
        type: "quote",
        headline: '엑셀을 못 다루는 건\n함수 암기가 아니라\n<span class="tl">질문</span> 실력이다.',
        caption: "실전 AI 활용 가이드 — 2026",
      },
      {
        type: "hook",
        mail: {
          to: "실적_데이터.xlsx — 함수 입력",
          line1: "=VLOOKUP(A2, …",
          line2: '#N/A&nbsp;<span class="cursor">|</span>',
          line3: "검색만 25번째…",
          sticker: "#N/A 지옥",
        },
        headline: '함수 하나에\n<span class="tl big">25번째</span>\n검색하고 있다면',
      },
      {
        type: "section",
        badge: "01",
        title: "외우지 말고,\n설명해서 시켜라",
        before: { label: "함수를 직접 찾기", body: "이름도 문법도 헷갈리고\n괄호 하나에 계속 오류" },
        after: { label: "하고 싶은 걸 말로 요청", body: '"이 표에서 지점별 합계"\n→ 바로 붙여넣을 수식이 나온다' },
        footer: 'AI에게 필요한 건 함수명이 아니라\n<span class="tl">데이터·목표·형태</span>입니다.',
      },
      {
        type: "timeline",
        badge: "02",
        title: "설명할 3가지",
        items: [
          { icon: "pencil", title: "데이터", desc: "어떤 열에 뭐가 있는지 — 표의 구조" },
          { icon: "target", title: "목표", desc: "무엇을 계산·정리할지 — 원하는 결과" },
          { icon: "people", title: "형태", desc: "수식인지 차트인지 — 결과의 모양" },
        ],
        pill: '3가지만 주면&nbsp;&nbsp;<span class="tl">25번 → 1번</span>',
      },
      {
        type: "chat",
        badge: "03",
        title: "복붙용 프롬프트",
        window: "AI 어시스턴트",
        prompt:
          "엑셀 수식 알려줘.\n데이터: A열 지점명, B열 매출\n" +
          "목표: 지점별 매출 합계\n형태: 수식 + 한 줄 설명\n" +
          "초보도 알게 단계별로 풀어서.",
        respTitle: "수식 + 한 줄 해설",
        footer: '<span class="tl">"설명까지"</span> 시키면 다음엔 혼자 한다',
      },
    ],
  },

  /* ===================================================================== *
   * 5) 자기소개서                                                          *
   * ===================================================================== */
  {
    slug: "5-resume",
    title: "⑤ 자기소개서",
    slides: [
      {
        type: "quote",
        headline: '자소서가 밋밋한 건\n문장력이 아니라\n<span class="tl">소재</span> 때문이다.',
        caption: "실전 AI 활용 가이드 — 2026",
      },
      {
        type: "hook",
        mail: {
          to: "자기소개서.hwp — 지원동기",
          line1: "저는 어릴 적부터…",
          line2: '성실하고 책임감…&nbsp;<span class="cursor">|</span>',
          line3: "다 비슷해 보임 3시간째",
          sticker: "뻔한 문장 3시간",
        },
        headline: '한 문단을\n<span class="tl big">3시간째</span>\n고쳐 쓰고 있다면',
      },
      {
        type: "section",
        badge: "01",
        title: "미화하지 말고,\n경험을 꺼내라",
        before: { label: "좋은 말로 채우기", body: "성실·열정·책임감…\n누구나 쓰는 말이라 안 남음" },
        after: { label: "경험을 주고 정리 요청", body: '"알바에서 재고 시스템 개선"\n→ 나만의 근거가 있는 문장' },
        footer: 'AI에게 필요한 건 미사여구가 아니라\n<span class="tl">경험·역할·결과</span>입니다.',
      },
      {
        type: "timeline",
        badge: "02",
        title: "꺼낼 3가지",
        items: [
          { icon: "people", title: "경험", desc: "언제 무엇을 했는지 — 구체적인 상황" },
          { icon: "target", title: "역할", desc: "그 안에서 내가 한 일 — 나의 기여" },
          { icon: "pencil", title: "결과", desc: "무엇이 달라졌나 — 숫자면 더 좋다" },
        ],
        pill: '3가지만 주면&nbsp;&nbsp;<span class="tl">뻔함 → 나다움</span>',
      },
      {
        type: "chat",
        badge: "03",
        title: "복붙용 프롬프트",
        window: "AI 어시스턴트",
        prompt:
          "자소서 지원동기 다듬어줘.\n경험: 카페 알바 3개월\n" +
          "역할: 재고 관리 엑셀 도입\n결과: 폐기율 20% 감소\n" +
          "과장 없이 경험 중심으로.",
        respTitle: "경험 기반 지원동기",
        footer: '<span class="tl">"경험 중심"</span>이면 진짜 내 이야기가 된다',
      },
    ],
  },

  /* ===================================================================== *
   * 6) 거절의 기술                                                         *
   * ===================================================================== */
  {
    slug: "6-refuse",
    title: "⑥ 거절의 기술",
    slides: [
      {
        type: "quote",
        headline: '거절을 못 하는 건\n마음이 약해서가 아니라\n<span class="tl">문장</span>이 없어서다.',
        caption: "실전 AI 활용 가이드 — 2026",
      },
      {
        type: "hook",
        mail: {
          to: "메시지 — 팀장님",
          line1: "네, 제가 하겠습니다…",
          line2: '(또 야근 확정)…&nbsp;<span class="cursor">|</span>',
          line3: "거절 문장 5번 지웠다 씀",
          sticker: "결국 또 수락",
        },
        headline: '하기 싫은 부탁에\n<span class="tl big">5번째</span>\n"네"라고 썼다면',
      },
      {
        type: "section",
        badge: "01",
        title: "미안해하지 말고,\n대안을 건네라",
        before: { label: "죄송하다고만 하기", body: "거절인지 수락인지 모호하고\n괜히 관계만 불편해짐" },
        after: { label: "이유보다 대안 제시", body: '"이번 주는 어렵고,\n다음 주 화요일은 가능" → 협조로 들린다' },
        footer: 'AI에게 필요한 건 변명이 아니라\n<span class="tl">인정·한계·대안</span>입니다.',
      },
      {
        type: "timeline",
        badge: "02",
        title: "담을 3가지",
        items: [
          { icon: "people", title: "인정", desc: "부탁을 이해했다는 신호 — 먼저 건넨다" },
          { icon: "target", title: "한계", desc: "왜 지금은 어려운지 — 짧게 한 줄" },
          { icon: "pencil", title: "대안", desc: "대신 가능한 것 — 공을 다시 넘긴다" },
        ],
        pill: '3가지만 담으면&nbsp;&nbsp;<span class="tl">거절 → 신뢰</span>',
      },
      {
        type: "chat",
        badge: "03",
        title: "복붙용 프롬프트",
        window: "AI 어시스턴트",
        prompt:
          "추가 업무 요청, 정중히 거절하는\n메시지 써줘.\n" +
          "상황: 이미 마감 2개 진행 중\n한계: 이번 주는 불가\n" +
          "대안: 다음 주 월요일부터 가능\n사과는 한 번만, 담백하게.",
        respTitle: "거절 + 대안 메시지",
        footer: '<span class="tl">"사과는 한 번만"</span>이 핵심이다',
      },
    ],
  },

  /* ===================================================================== *
   * 7) 협상 리허설                                                         *
   * ===================================================================== */
  {
    slug: "7-rehearsal",
    title: "⑦ 협상 리허설",
    slides: [
      {
        type: "quote",
        headline: '중요한 대화에서 지는 건\n말주변이 아니라\n<span class="tl">리허설</span> 부족이다.',
        caption: "실전 AI 활용 가이드 — 2026",
      },
      {
        type: "hook",
        mail: {
          to: "메모 — 연봉협상 대본",
          line1: "제 생각에는 좀…",
          line2: '아니 그게 아니라…&nbsp;<span class="cursor">|</span>',
          line3: "머릿속으로만 20번째",
          sticker: "실전은 늘 버벅",
        },
        headline: '중요한 대화를\n<span class="tl big">머릿속</span>으로만\n돌려봤다면',
      },
      {
        type: "section",
        badge: "01",
        title: "외우지 말고,\n미리 맞아봐라",
        before: { label: "할 말을 혼자 암기", body: "준비한 말은 완벽한데\n상대가 되물으면 무너짐" },
        after: { label: "AI를 상대로 롤플레이", body: '"당신은 깐깐한 팀장"이라 시키고\n→ 예상 질문에 미리 맞아본다' },
        footer: 'AI에게 필요한 건 정답이 아니라\n<span class="tl">역할·목표·반론</span>입니다.',
      },
      {
        type: "timeline",
        badge: "02",
        title: "설정할 3가지",
        items: [
          { icon: "people", title: "역할", desc: "상대가 누구인지 — AI에게 배역을 준다" },
          { icon: "target", title: "목표", desc: "물러설 수 없는 최소선 — 미리 정한다" },
          { icon: "pencil", title: "반론", desc: "상대가 찌를 지점 — 답을 만들어 둔다" },
        ],
        pill: '3가지만 주면&nbsp;&nbsp;<span class="tl">즉흥 → 리허설</span>',
      },
      {
        type: "chat",
        badge: "03",
        title: "복붙용 프롬프트",
        window: "AI 어시스턴트",
        prompt:
          "연봉협상 롤플레이 하자.\n너는 예산에 민감한 내 팀장 역할.\n" +
          "목표: 인상 근거를 논리로 방어\n내 말에 계속 반론해줘.\n" +
          "끝나면 약했던 답변을 짚어줘.",
        respTitle: "롤플레이 + 피드백",
        footer: '<span class="tl">"반론해줘"</span> 한마디면 실전이 는다',
      },
    ],
  },

  /* ===================================================================== *
   * 8) 악마의 변호인                                                       *
   * ===================================================================== */
  {
    slug: "8-devil",
    title: "⑧ 악마의 변호인",
    slides: [
      {
        type: "quote",
        headline: '나쁜 결정을 막는 건\n신중함이 아니라\n<span class="tl">반대 의견</span>이다.',
        caption: "실전 AI 활용 가이드 — 2026",
      },
      {
        type: "hook",
        mail: {
          to: "메모 — 이직 결심",
          line1: "장점: 연봉, 새로운 기회…",
          line2: '단점: (안 적힘)…&nbsp;<span class="cursor">|</span>',
          line3: "다 좋아 보이는 게 함정",
          sticker: "확신 100%",
        },
        headline: '내 결정이\n<span class="tl big">완벽</span>해 보일 때\n오히려 위험하다면',
      },
      {
        type: "section",
        badge: "01",
        title: "동의받지 말고,\n공격받아라",
        before: { label: "찬성 근거만 모으기", body: "검색해도 내 생각과 같은\n글만 골라 보게 됨 (확증편향)" },
        after: { label: "일부러 반대편에 세우기", body: '"이 결정의 최악 시나리오는?"\n→ 안 보이던 구멍이 드러난다' },
        footer: 'AI에게 필요한 건 응원이 아니라\n<span class="tl">전제·허점·최악</span>입니다.',
      },
      {
        type: "timeline",
        badge: "02",
        title: "따질 3가지",
        items: [
          { icon: "target", title: "전제", desc: "무엇을 당연하게 믿고 있나 — 흔들어본다" },
          { icon: "pencil", title: "허점", desc: "이 논리에서 가장 약한 고리" },
          { icon: "people", title: "최악", desc: "틀렸을 때 치를 대가 — 감당 가능한가" },
        ],
        pill: '3가지만 물으면&nbsp;&nbsp;<span class="tl">확신 → 검증</span>',
      },
      {
        type: "chat",
        badge: "03",
        title: "복붙용 프롬프트",
        window: "AI 어시스턴트",
        prompt:
          "내 결정을 반박해줘.\n결정: 지금 회사 그만두고 창업\n" +
          "너는 냉정한 투자자 입장.\n① 내가 놓친 전제\n" +
          "② 가장 큰 허점\n③ 최악의 시나리오\n듣기 좋은 말은 빼고.",
        respTitle: "반대 논거 3가지",
        footer: '<span class="tl">"반박해줘"</span>가 값비싼 실수를 막는다',
      },
    ],
  },

  /* ===================================================================== *
   * 9) 눈높이 번역기                                                       *
   * ===================================================================== */
  {
    slug: "9-explain",
    title: "⑨ 눈높이 번역기",
    slides: [
      {
        type: "quote",
        headline: '못 알아듣는 건\n머리가 나빠서가 아니라\n<span class="tl">눈높이</span>가 안 맞아서다.',
        caption: "실전 AI 활용 가이드 — 2026",
      },
      {
        type: "hook",
        mail: {
          to: "브라우저 — 계약서 제3조",
          line1: "제3조 (손해배상의 예정)",
          line2: '…귀책사유로 인하여…&nbsp;<span class="cursor">|</span>',
          line3: "세 번 읽어도 모름",
          sticker: "법률 용어 지옥",
        },
        headline: '읽어도 모르는 문장에\n<span class="tl big">세 번째</span>\n같은 줄이라면',
      },
      {
        type: "section",
        badge: "01",
        title: "다시 읽지 말고,\n다시 설명받아라",
        before: { label: "어려운 그대로 붙들기", body: "용어 하나 검색하면\n그 설명에 또 모르는 말" },
        after: { label: "눈높이를 지정해 요청", body: '"중학생도 알게, 예시 들어서"\n→ 갑자기 이해되는 순간' },
        footer: 'AI에게 필요한 건 요약이 아니라\n<span class="tl">대상·비유·확인</span>입니다.',
      },
      {
        type: "timeline",
        badge: "02",
        title: "요청할 3가지",
        items: [
          { icon: "people", title: "대상", desc: "누구 눈높이로 — 중학생? 신입?" },
          { icon: "pencil", title: "비유", desc: "아는 것에 빗대서 — 일상 예시로" },
          { icon: "target", title: "확인", desc: "이해했는지 되물어줘 — 퀴즈 3개" },
        ],
        pill: '3가지만 주면&nbsp;&nbsp;<span class="tl">암호 → 이해</span>',
      },
      {
        type: "chat",
        badge: "03",
        title: "복붙용 프롬프트",
        window: "AI 어시스턴트",
        prompt:
          "이 계약 조항 쉽게 설명해줘.\n대상: 계약 처음 하는 사회초년생\n" +
          "비유: 일상 상황에 빗대서\n확인: 끝에 점검 질문 3개\n" +
          "원문 그대로가 아니라 뜻 중심으로.",
        respTitle: "쉬운 설명 + 점검 질문",
        footer: '<span class="tl">"질문 3개"</span>로 진짜 이해했는지 확인된다',
      },
    ],
  },

  /* ===================================================================== *
   * 10) 감정 쿨다운                                                        *
   * ===================================================================== */
  {
    slug: "10-cooldown",
    title: "⑩ 감정 쿨다운",
    slides: [
      {
        type: "quote",
        headline: '보내고 후회하는 건\n감정이 아니라\n<span class="tl">타이밍</span> 때문이다.',
        caption: "실전 AI 활용 가이드 — 2026",
      },
      {
        type: "hook",
        mail: {
          to: "메시지 — 입력 중…",
          line1: "님 진짜 너무하신 거…",
          line2: '이게 말이 됩니까?…&nbsp;<span class="cursor">|</span>',
          line3: "전송 직전 손 떨림",
          sticker: "감정 100%",
        },
        headline: '욱해서 쓴 메시지에\n<span class="tl big">엄지</span>가\n전송 위에 있다면',
      },
      {
        type: "section",
        badge: "01",
        title: "보내지 말고,\n한 번 통과시켜라",
        before: { label: "감정 그대로 전송", body: "5분은 시원한데\n관계는 오래 남아 후회" },
        after: { label: "AI에 한 번 걸러내기", body: '"내용은 살리되 톤만 낮춰줘"\n→ 할 말은 하되 적이 안 된다' },
        footer: 'AI에게 필요한 건 참으라는 말이 아니라\n<span class="tl">사실·요구·톤</span>입니다.',
      },
      {
        type: "timeline",
        badge: "02",
        title: "걸러낼 3가지",
        items: [
          { icon: "pencil", title: "사실", desc: "실제로 일어난 일 — 감정은 빼고" },
          { icon: "target", title: "요구", desc: "내가 진짜 원하는 것 — 비난 말고" },
          { icon: "people", title: "톤", desc: "상대가 방어 안 하게 — 공격을 제거" },
        ],
        pill: '한 번만 걸러도&nbsp;&nbsp;<span class="tl">후회 → 해결</span>',
      },
      {
        type: "chat",
        badge: "03",
        title: "복붙용 프롬프트",
        window: "AI 어시스턴트",
        prompt:
          "이 메시지 톤만 다듬어줘.\n상황: 동료가 마감을 또 어김\n" +
          "사실: 이번이 3번째\n요구: 다음부터 미리 공유\n" +
          "감정적 표현은 빼고, 할 말은 유지.",
        respTitle: "톤 정리된 메시지",
        footer: '<span class="tl">"톤만"</span>이면 할 말은 그대로 남는다',
      },
    ],
  },
];

/* ---- 아이콘 (인라인 SVG) ------------------------------------------------ */
const ICONS = {
  people: '<svg viewBox="0 0 24 24" fill="none" stroke="#06201d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="#06201d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="#06201d"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="#06201d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
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

/* ---- 하나의 슬라이드를 .card 엘리먼트로 생성 --------------------------- */
function buildCard(slide, index, total) {
  const card = document.createElement("div");
  card.className = `card t-${slide.type}`;
  card.dataset.index = index;
  card.innerHTML = (TEMPLATES[slide.type] || (() => ""))(slide);

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
  window.CAROUSELS = CAROUSELS;
  window.buildCard = buildCard;
}
