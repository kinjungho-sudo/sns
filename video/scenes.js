/* =========================================================================
   장면 템플릿 — 시리즈 2 7장 구조를 영상 장면으로 옮긴 것
   -------------------------------------------------------------------------
   hook   : 표지(훅 + 결과물 티저 + 입력칩 흐름)            ← 카드 1
   before : 문제 상황 — 지저분한 원본이 쌓임               ← 카드 2
   sheet  : 빈 양식 → 30초 뒤 채워진 결과물 (표형)        ← 카드 3·4
   steps  : 딱 3단계                                      ← 카드 5·6
   cta    : 댓글 키워드 + 팔로우                           ← 카드 7

   각 템플릿은 (stage, scene, t0) 를 받아 DOM 을 만들고 타임라인에 애니메이션을 등록합니다.
   t0 = 이 장면의 시작 시각(초), scene.dur = 장면 길이(초)
   ========================================================================= */
(function () {
  const { anim, tick, show, cue, fx, h } = window.VE;

  const ICONS = {
    camera: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>',
    table: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M3.5 14.5h17M10 9.5v10"/></svg>',
  };

  const won = (n) => n.toLocaleString("ko-KR");

  // 장면 컨테이너 + 공통 입·퇴장
  function sceneBox(stage, t0, dur, { exit = true } = {}) {
    const el = h('<section class="scene"></section>');
    stage.appendChild(el);
    show(el, t0, t0 + dur + (exit ? 0 : 99));
    if (exit) fx.out(el, t0 + dur - 0.35);
    return el;
  }

  function headline(el, { label, headline, cls = "" }, t) {
    const box = h(`<div>${label ? `<div class="label">${label}</div>` : ""}<div class="headline ${cls}">${headline}</div></div>`);
    el.appendChild(box);
    if (label) fx.up(box.querySelector(".label"), t, 20, 0.5);
    fx.up(box.querySelector(".headline"), t + 0.08, 50, 0.7);
    box.querySelectorAll(".hl").forEach((u) => fx.underline(u, t + 0.55));
    return box;
  }

  // 표 HTML (빈칸 플레이스홀더 + 실제 값) — sheet / hook 티저 공용
  function sheetHTML(s, { rows = s.rows, compact = false } = {}) {
    const cols = s.cols.map((c) => `<th>${c}</th>`).join("");
    const body = rows.map((r) => `
      <tr>
        <td><span class="ph" style="width:70%"></span><span class="val" data-k="date"></span></td>
        <td><span class="ph" style="width:80%"></span><span class="val" data-k="store"></span></td>
        <td><span class="ph" style="width:60%"></span><span class="val" data-k="acct"></span></td>
        <td><span class="ph" style="width:75%"></span><span class="val" data-k="amount"></span></td>
      </tr>`).join("");
    return `
      <div class="paper sheet"${compact ? ' style="padding:30px 34px 26px"' : ""}>
        <div class="sheet-head"><div class="sheet-title">${s.title}</div><div class="sheet-meta">${s.meta}</div></div>
        <table class="tbl">
          <colgroup>${s.widths.map((w) => `<col style="width:${w}%">`).join("")}</colgroup>
          <thead><tr>${cols}</tr></thead>
          <tbody>${body}
            <tr class="total"><td colspan="3">${s.totalLabel}</td><td><span class="sum">—</span></td></tr>
          </tbody>
        </table>
      </div>`;
  }

  function fillRowStatic(tr, r) {
    tr.querySelectorAll(".ph").forEach((p) => (p.style.display = "none"));
    tr.querySelector('[data-k="date"]').textContent = r.date;
    tr.querySelector('[data-k="store"]').textContent = r.store;
    tr.querySelector('[data-k="acct"]').innerHTML = `<span class="acct">${r.acct}</span>`;
    tr.querySelector('[data-k="amount"]').textContent = won(r.amount);
  }

  const T = {};

  /* ---------------------------------------------------------------- hook */
  T.hook = (stage, s, t0, ep) => {
    const el = sceneBox(stage, t0, s.dur);
    headline(el, { headline: s.headline, cls: "xl" }, t0 + 0.05);
    const sub = h(`<div class="sub">${s.sub}</div>`);
    el.appendChild(sub);
    fx.up(sub, t0 + 0.45, 30);

    // 결과물 티저: 완성된 표 일부를 기울여 미리 보여줌
    const data = ep.scenes.find((x) => x.type === "sheet").sheet;
    const teaser = h(`<div style="position:absolute;left:150px;right:150px;top:600px">${sheetHTML(data, { rows: data.rows.slice(0, 3), compact: true })}</div>`);
    el.appendChild(teaser);
    teaser.querySelectorAll("tbody tr:not(.total)").forEach((tr, i) => fillRowStatic(tr, data.rows[i]));
    teaser.querySelectorAll(".tbl td").forEach((td) => { td.style.height = "66px"; td.style.fontSize = "25px"; });
    const total = data.rows.reduce((a, r) => a + r.amount, 0);
    fx.count(teaser.querySelector(".sum"), total, t0 + 1.0, 1.0, (n) => won(n) + "원");
    fx.pop(teaser.firstElementChild, t0 + 0.75, 0.7, -3);
    cue("pop", t0 + 0.75, 0.7);
    cue("ding", t0 + 2.0, 0.6);

    // 입력칩 흐름: 사진 → Claude → 결과물
    const flow = h('<div class="flow" style="position:absolute;left:80px;right:80px;top:1060px;justify-content:center"></div>');
    s.flow.forEach((c, i) => {
      if (i > 0) flow.appendChild(h('<span class="arrow">→</span>'));
      flow.appendChild(h(`<div class="chip${c.on ? " on" : ""}">${ICONS[c.icon] || ""}${c.text}</div>`));
    });
    el.appendChild(flow);
    [...flow.children].forEach((c, i) => fx.pop(c, t0 + 1.2 + i * 0.12, 0.45));
    cue("pop", t0 + 1.2, 0.5); cue("pop", t0 + 1.45, 0.5); cue("pop", t0 + 1.7, 0.6);
  };

  /* -------------------------------------------------------------- before */
  T.before = (stage, s, t0) => {
    const el = sceneBox(stage, t0, s.dur);
    cue("whoosh", t0);
    headline(el, s, t0 + 0.1);

    const spots = [[96, 560, -8], [392, 545, 5], [690, 575, -4], [210, 800, 7], [540, 810, -6]];
    s.receipts.forEach((r, i) => {
      const [x, y, rot] = spots[i % spots.length];
      const lines = r.items.map(([n, p]) => `<div class="r-line"><span>${n}</span><span>${won(p)}</span></div>`).join("");
      const rc = h(`
        <div class="receipt" style="left:${x}px;top:${y}px;transform:rotate(${rot}deg)">
          <div class="r-store">${r.store}</div><div class="r-date">${r.date}</div>
          ${lines}<div class="r-sep"></div>
          <div class="r-total"><span>합계</span><span>${won(r.total)}</span></div>
        </div>`);
      el.appendChild(rc);
      const t = t0 + 0.45 + i * 0.3;
      anim(rc, [
        { opacity: 0, transform: `translateY(-420px) rotate(${rot + 18}deg)` },
        { opacity: 1, transform: `translateY(0) rotate(${rot}deg)` },
      ], t, 0.5, "back");
      cue("drop", t + 0.32, 0.8);
    });

    // 걸린 시간 카운터
    const timer = h(`<div class="status" style="position:absolute;left:80px;top:1150px;background:var(--rust)">⏱ ${s.timer.prefix}<b class="n">0</b>${s.timer.unit}</div>`);
    el.appendChild(timer);
    fx.pop(timer, t0 + 1.0, 0.45);
    fx.count(timer.querySelector(".n"), s.timer.to, t0 + 1.1, s.dur - 1.6, (n) => String(n));
  };

  /* --------------------------------------------------------------- sheet */
  T.sheet = (stage, s, t0) => {
    const el = sceneBox(stage, t0, s.dur);
    cue("whoosh", t0);
    const swap = s.swapAt; // 빈 양식 → After 로 넘어가는 시점(장면 기준 초)

    // 헤드라인 A (빈 양식) → B (결과)
    const a = headline(el, { label: s.frame.label, headline: s.frame.headline }, t0 + 0.1);
    a.style.position = "absolute";
    fx.out(a, t0 + swap - 0.3, 0.3);
    const b = headline(el, { label: s.after.label, headline: s.after.headline }, t0 + swap);
    b.style.position = "absolute";

    // 표
    const total = s.sheet.rows.reduce((acc, r) => acc + r.amount, 0);
    const wrap = h(`<div style="position:absolute;left:80px;right:80px;top:470px">${sheetHTML(s.sheet)}</div>`);
    el.appendChild(wrap);
    fx.up(wrap, t0 + 0.35, 80, 0.8);
    cue("pop", t0 + 0.45, 0.5);

    // 처리 상태 칩
    const st = h('<div class="status" style="position:absolute;right:110px;top:440px;z-index:5"><span class="spinner"></span><span class="txt"></span></div>');
    el.appendChild(st);
    const spin = st.querySelector(".spinner"), txt = st.querySelector(".txt");
    const rowsStart = t0 + swap + 0.6, rowGap = 0.55;
    const doneAt = rowsStart + s.sheet.rows.length * rowGap + 0.3;
    tick((t) => {
      const done = t >= doneAt;
      spin.style.display = done ? "none" : "block";
      spin.style.transform = `rotate(${(t * 540) % 360}deg)`;
      txt.textContent = done ? s.status.done : s.status.working;
      st.style.background = done ? "var(--rust)" : "var(--ink)";
    });
    fx.pop(st, t0 + swap + 0.1, 0.4);
    cue("pop", t0 + swap + 0.1, 0.5);

    // 행 채우기
    const trs = wrap.querySelectorAll("tbody tr:not(.total)");
    s.sheet.rows.forEach((r, i) => {
      const tr = trs[i], t = rowsStart + i * rowGap;
      const phs = tr.querySelectorAll(".ph");
      tick((now) => phs.forEach((p) => (p.style.display = now >= t ? "none" : "block")));
      anim(tr, [
        { backgroundColor: "rgba(240,220,207,0)" },
        { backgroundColor: "rgba(240,220,207,1)", offset: 0.15 },
        { backgroundColor: "rgba(240,220,207,0)" },
      ], t, 1.0, "linear");
      fx.type(tr.querySelector('[data-k="date"]'), r.date, t, 40);
      fx.type(tr.querySelector('[data-k="store"]'), r.store, t + 0.05, 30);
      const acct = h(`<span class="acct">${r.acct}</span>`);
      tr.querySelector('[data-k="acct"]').appendChild(acct);
      fx.pop(acct, t + 0.2, 0.4);
      tick((now) => { acct.style.display = now >= t ? "inline-block" : "none"; });
      const amt = tr.querySelector('[data-k="amount"]');
      fx.count(amt, r.amount, t + 0.1, 0.4);
      tick((now) => { if (now < t + 0.1) amt.textContent = ""; });
      cue("type", t, 0.9);
    });

    // 합계 카운트업 + 딩
    const sum = wrap.querySelector(".sum");
    const sumAt = doneAt - 0.1;
    fx.count(sum, total, sumAt, 0.8, (n) => won(n) + "원");
    tick((now) => { if (now < sumAt) sum.textContent = "—"; });
    cue("ding", sumAt + 0.8, 1);

    // 도장
    const stamp = h(`<div class="stamp" style="left:790px;top:205px"><b>${s.stamp.big}</b><span>${s.stamp.small}</span></div>`);
    el.appendChild(stamp);
    anim(stamp, [
      { opacity: 0, transform: "scale(2.2) rotate(-24deg)" },
      { opacity: 1, transform: "scale(1) rotate(-12deg)" },
    ], sumAt + 1.0, 0.35, "inOut");
    cue("stamp", sumAt + 1.3, 1);
  };

  /* --------------------------------------------------------------- steps */
  T.steps = (stage, s, t0) => {
    const el = sceneBox(stage, t0, s.dur);
    cue("whoosh", t0);
    headline(el, s, t0 + 0.1);
    const list = h('<div class="steps"></div>');
    el.appendChild(list);
    s.steps.forEach((st, i) => {
      const card = h(`<div class="paper step"><div class="num">${i + 1}</div><div><div class="st">${st.title}</div><div class="sd">${st.desc}</div></div></div>`);
      list.appendChild(card);
      const t = t0 + 0.45 + i * 0.4;
      anim(card, [
        { opacity: 0, transform: "translateX(80px)" },
        { opacity: 1, transform: "translateX(0)" },
      ], t, 0.55);
      cue("pop", t, 0.7);
    });
    if (s.note) {
      const note = h(`<div class="sub" style="font-size:30px;margin-top:34px">${s.note}</div>`);
      el.appendChild(note);
      fx.up(note, t0 + 1.8, 20);
    }
  };

  /* ----------------------------------------------------------------- cta */
  T.cta = (stage, s, t0) => {
    const el = sceneBox(stage, t0, s.dur, { exit: false });
    cue("whoosh", t0);
    headline(el, { label: s.label, headline: s.headline, cls: "xl" }, t0 + 0.1);
    // 댓글 입력창 목업: 키워드가 타이핑됨
    const cm = h(`<div class="paper comment"><span class="av"></span><span class="ctext"><span class="v"></span><span class="caret"></span></span><span class="post">게시</span></div>`);
    el.appendChild(cm);
    fx.up(cm, t0 + 0.5, 40, 0.6);
    fx.type(cm.querySelector(".v"), s.keyword, t0 + 0.9, 8);
    tick((now) => { cm.querySelector(".caret").style.opacity = Math.floor(now * 2.5) % 2 ? 0 : 1; });
    cue("type", t0 + 0.9, 0.7);
    anim(cm.querySelector(".post"), [{ opacity: .35 }, { opacity: 1 }], t0 + 1.25, 0.2);
    const box = h(`<div class="paper cta-box"><div class="k">${s.box.k}</div><div class="d">${s.box.d}</div></div>`);
    el.appendChild(box);
    fx.up(box, t0 + 1.4, 50, 0.7);
    cue("pop", t0 + 1.45, 0.7);
    const f = h(`<div class="follow"><span class="plus">+</span>${s.follow}</div>`);
    el.appendChild(f);
    fx.up(f, t0 + 1.8, 30);
    cue("ding", t0 + 1.9, 0.5);
  };

  /* -------------------------------------------------------------- build */
  function build(stage, ep) {
    // 공통 상단 태그 · 하단 로고 · 진행바
    stage.appendChild(h(`<div class="chrome-top"><span class="pill">${ep.tag}</span><span class="ep">${ep.ep} · ${ep.topic}</span></div>`));
    const bot = h('<div class="chrome-bot"><div class="logo">Co<b>Mind</b>works</div><div class="progress"><i></i></div></div>');
    stage.appendChild(bot);

    let t = 0;
    for (const s of ep.scenes) {
      if (!T[s.type]) throw new Error(`알 수 없는 장면 type: ${s.type}`);
      T[s.type](stage, s, t, ep);
      t += s.dur;
    }
    window.TL.duration = +(t + (ep.tail || 0)).toFixed(3);
    const bar = bot.querySelector(".progress i");
    tick((now) => { bar.style.width = `${Math.min(100, (now / window.TL.duration) * 100)}%`; });
  }

  window.buildVideo = build;
})();
