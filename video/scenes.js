/* =========================================================================
   장면 템플릿 — 시리즈 2 7장 구조를 영상 장면으로 옮긴 것
   -------------------------------------------------------------------------
   hook   : 표지(훅 + 결과물 티저 + 입력칩 흐름)            ← 카드 1
   before : 문제 상황 — 지저분한 원본 (영수증 더미 / 회의 메모)  ← 카드 2
   sheet  : 빈 양식 → 30초 뒤 채워진 결과물 (표형)        ← 카드 3·4
   doc    : 빈 양식 → 30초 뒤 채워진 결과물 (문서형)      ← 카드 3·4
   steps  : 딱 3단계                                      ← 카드 5·6
   cta    : 댓글 키워드 + 팔로우                           ← 카드 7

   각 템플릿은 (stage, scene, t0) 를 받아 DOM 을 만들고 타임라인에 애니메이션을 등록합니다.
   t0 = 이 장면의 시작 시각(초), scene.dur = 장면 길이(초)

   결과물(sheet/doc)은 "값이 모두 채워진 DOM" 으로 만들고, 각 칸의 .ph(빈칸 막대)와
   .val(실제 값)을 시각에 따라 바꿔 보여줍니다. 그래서 hook 티저는 같은 DOM 을 그대로 씁니다.
   ========================================================================= */
(function () {
  const { anim, tick, show, cue, fx, h } = window.VE;

  const ICONS = {
    camera: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>',
    table: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M3.5 14.5h17M10 9.5v10"/></svg>',
    mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  };

  const won = (n) => n.toLocaleString("ko-KR");
  const ph = (w) => `<span class="ph" style="width:${w}%"></span>`;

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

  // 빈칸(.ph) ↔ 값(.val) 전환: 시각 t 이후 값이 보임
  function reveal(cell, t) {
    const p = cell.querySelector(".ph"), v = cell.querySelector(".val");
    tick((now) => {
      const on = now >= t;
      if (p) p.style.display = on ? "none" : "block";
      v.style.visibility = on ? "visible" : "hidden";
    });
    return v;
  }

  // 한 칸 채우기 연출: 종류에 따라 타이핑 / 팝 / 카운트업
  function fillCell(cell, kind, value, t) {
    const v = reveal(cell, t);
    if (kind === "pill" || kind === "tag") { fx.pop(v.firstElementChild || v, t + 0.05, 0.4); }
    else if (kind === "num") { fx.count(v, value, t, 0.45); }
    else { fx.type(v, String(value), t, 32); }
  }

  /* ------------------------------------------------------ 결과물: 표형 */
  function sheetHTML(s) {
    const cls = (c) => (c.type === "num" || c.type === "center" ? c.type : "");
    const head = s.cols.map((c) => `<th class="${cls(c)}">${c.h}</th>`).join("");
    const cell = (c, r) => {
      const val = r[c.k];
      const inner = c.type === "pill" ? `<span class="acct">${val}</span>` : c.type === "num" ? won(val) : val;
      return `<td class="${cls(c)}">${ph(c.type === "center" ? 40 : 75)}<span class="val">${inner}</span></td>`;
    };
    const rows = s.rows.map((r) => `<tr>${s.cols.map((c) => cell(c, r)).join("")}</tr>`).join("");
    const total = s.rows.reduce((a, r) => a + r[s.sumKey], 0);
    const appr = s.approval
      ? `<div class="appr">${s.approval.map((a) => `<div><span>${a}</span><i></i></div>`).join("")}</div>`
      : "";
    return `
      <div class="paper sheet">
        <div class="sheet-head"><div><div class="sheet-title">${s.title}</div><div class="sheet-meta">${s.meta}</div></div>${appr}</div>
        <table class="tbl">
          <colgroup>${s.cols.map((c) => `<col style="width:${c.w}%">`).join("")}</colgroup>
          <thead><tr>${head}</tr></thead>
          <tbody>${rows}
            <tr class="total"><td colspan="${s.cols.length - 1}">${s.totalLabel}</td><td class="num"><span class="sum">${won(total)}원</span></td></tr>
          </tbody>
        </table>
      </div>`;
  }

  function animateSheet(wrap, s, start, gap = 0.55) {
    const trs = wrap.querySelectorAll("tbody tr:not(.total)");
    s.rows.forEach((r, i) => {
      const tr = trs[i], t = start + i * gap;
      anim(tr, [
        { backgroundColor: "rgba(240,220,207,0)" },
        { backgroundColor: "rgba(240,220,207,1)", offset: 0.15 },
        { backgroundColor: "rgba(240,220,207,0)" },
      ], t, 1.0, "linear");
      s.cols.forEach((c, j) => fillCell(tr.children[j], c.type, r[c.k], t + j * 0.05));
      cue("type", t, 0.9);
    });
    const doneAt = start + s.rows.length * gap + 0.3;
    const sum = wrap.querySelector(".sum");
    const total = s.rows.reduce((a, r) => a + r[s.sumKey], 0);
    fx.count(sum, total, doneAt - 0.1, 0.8, (n) => won(n) + "원");
    tick((now) => { if (now < doneAt - 0.1) sum.textContent = "—"; });
    cue("ding", doneAt + 0.7, 1);
    return doneAt + 0.7;
  }

  /* ------------------------------------------------------ 결과물: 문서형 */
  function docHTML(d) {
    const kv = d.info.map(([k, v, wide]) =>
      `<div class="kv${wide ? " wide" : ""}"><b>${k}</b><span class="cell">${ph(70)}<span class="val">${v}</span></span></div>`).join("");
    const sec = (no, title, body) => `<div class="doc-sec"><div class="doc-h"><span>${no}</span>${title}</div>${body}</div>`;
    const list = (items) => `<ul>${items.map((it) => {
      const [text, tag] = Array.isArray(it) ? it : [it];
      return `<li><span class="cell">${ph(85)}<span class="val">${text}${tag ? ` <span class="tag">${tag}</span>` : ""}</span></span></li>`;
    }).join("")}</ul>`;
    const acts = `<table class="tbl mini">
        <colgroup><col style="width:58%"><col style="width:20%"><col style="width:22%"></colgroup>
        <thead><tr><th>조치 내용</th><th>담당</th><th>기한</th></tr></thead>
        <tbody>${d.actions.map(([a, who, due]) => {
          const dv = /확인/.test(due) ? `<span class="tag">${due}</span>` : due;
          return `<tr><td>${ph(80)}<span class="val">${a}</span></td><td>${ph(60)}<span class="val">${who}</span></td><td>${ph(60)}<span class="val">${dv}</span></td></tr>`;
        }).join("")}</tbody></table>`;
    return `
      <div class="paper doc">
        <div class="doc-head"><div class="doc-title">${d.title}</div><div class="sheet-meta">${d.meta}</div></div>
        <div class="doc-info">${kv}</div>
        ${sec(d.sections[0].no, d.sections[0].title, list(d.sections[0].items))}
        ${sec(d.sections[1].no, d.sections[1].title, list(d.sections[1].items))}
        ${sec(d.actionsNo, "조치 사항", acts)}
      </div>`;
  }

  function animateDoc(wrap, d, start, gap = 0.36) {
    let t = start;
    // 회의 정보 → 결정 → 미정 → 조치 순서로 한 줄씩
    wrap.querySelectorAll(".doc-info .cell").forEach((c) => { fillCell(c, "text", c.querySelector(".val").textContent, t); t += gap * 0.6; });
    cue("type", start, 0.6);
    wrap.querySelectorAll(".doc-sec li .cell").forEach((c) => {
      const v = c.querySelector(".val");
      const tag = v.querySelector(".tag");
      const text = v.firstChild.textContent;
      const at = t; // t 는 루프에서 계속 바뀌므로 이 줄의 시작 시각을 고정
      reveal(c, at);
      const node = v.firstChild;
      tick((now) => { node.textContent = now < at ? "" : text.slice(0, Math.floor((now - at) * 40)); });
      if (tag) { fx.pop(tag, at + text.length / 40, 0.4); cue("pop", at + text.length / 40, 0.6); }
      cue("type", at, 0.8);
      t += gap;
    });
    wrap.querySelectorAll(".mini tbody tr").forEach((tr) => {
      [...tr.children].forEach((td, j) => {
        const v = td.querySelector(".val");
        const tag = v.querySelector(".tag");
        if (tag) { reveal(td, t + j * 0.08); fx.pop(tag, t + j * 0.08, 0.4); cue("pop", t + j * 0.08, 0.6); }
        else fillCell(td, "text", v.textContent, t + j * 0.08);
      });
      anim(tr, [
        { backgroundColor: "rgba(240,220,207,0)" },
        { backgroundColor: "rgba(240,220,207,1)", offset: 0.15 },
        { backgroundColor: "rgba(240,220,207,0)" },
      ], t, 0.9, "linear");
      cue("type", t, 0.8);
      t += gap;
    });
    cue("ding", t + 0.2, 1);
    return t + 0.2;
  }

  const RESULT = {
    sheet: { html: (s) => sheetHTML(s.sheet), animate: (w, s, t) => animateSheet(w, s.sheet, t) },
    doc: { html: (s) => docHTML(s.doc), animate: (w, s, t) => animateDoc(w, s.doc, t) },
  };

  const T = {};

  /* ---------------------------------------------------------------- hook */
  T.hook = (stage, s, t0, ep) => {
    const el = sceneBox(stage, t0, s.dur);
    headline(el, { headline: s.headline, cls: "xl" }, t0 + 0.05);
    const sub = h(`<div class="sub">${s.sub}</div>`);
    el.appendChild(sub);
    fx.up(sub, t0 + 0.45, 30);

    // 결과물 티저: 완성본 윗부분을 기울여 살짝 보여줌
    const res = ep.scenes.find((x) => RESULT[x.type]);
    const teaser = h(`<div class="teaser"><div class="teaser-in">${RESULT[res.type].html(res)}</div></div>`);
    el.appendChild(teaser);
    teaser.querySelectorAll(".ph").forEach((p) => (p.style.display = "none"));
    fx.pop(teaser, t0 + 0.75, 0.7, -3);
    cue("pop", t0 + 0.75, 0.7);
    cue("ding", t0 + 1.9, 0.5);

    // 입력칩 흐름: 원본 → Claude → 결과물
    const flow = h('<div class="flow" style="position:absolute;left:80px;right:80px;top:1070px;justify-content:center"></div>');
    s.flow.forEach((c, i) => {
      if (i > 0) flow.appendChild(h('<span class="arrow">→</span>'));
      flow.appendChild(h(`<div class="chip${c.on ? " on" : ""}">${ICONS[c.icon] || ""}${c.text}</div>`));
    });
    el.appendChild(flow);
    [...flow.children].forEach((c, i) => fx.pop(c, t0 + 1.2 + i * 0.12, 0.45));
    cue("pop", t0 + 1.2, 0.5); cue("pop", t0 + 1.45, 0.5); cue("pop", t0 + 1.7, 0.6);
  };

  /* -------------------------------------------------------------- before */
  function receiptsPile(el, s, t0) {
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
  }

  function memoPile(el, s, t0) {
    const m = s.memo;
    const card = h(`<div class="memo-paper"><div class="memo-top">${m.title}</div>${m.lines.map((l) => `<div class="ml">${l}</div>`).join("")}</div>`);
    el.appendChild(card);
    anim(card, [
      { opacity: 0, transform: "translateY(60px) rotate(-6deg)" },
      { opacity: 1, transform: "translateY(0) rotate(-2.5deg)" },
    ], t0 + 0.35, 0.6, "back");
    cue("drop", t0 + 0.6, 0.7);
    card.querySelectorAll(".ml").forEach((l, i) => anim(l, [{ opacity: 0 }, { opacity: 1 }], t0 + 0.6 + i * 0.12, 0.2));
    // 흩어진 다른 원본들 (녹취 · 사진 · 단톡)
    const spots = [[700, 560, 6], [736, 760, -5], [690, 960, 4]];
    m.extras.forEach((x, i) => {
      const [left, top, rot] = spots[i];
      const c = h(`<div class="chip scrap" style="position:absolute;left:${left}px;top:${top}px;transform:rotate(${rot}deg)">${ICONS[x.icon] || ""}${x.text}</div>`);
      el.appendChild(c);
      fx.pop(c, t0 + 1.0 + i * 0.3, 0.45, rot);
      cue("pop", t0 + 1.0 + i * 0.3, 0.6);
    });
  }

  T.before = (stage, s, t0) => {
    const el = sceneBox(stage, t0, s.dur);
    cue("whoosh", t0);
    headline(el, s, t0 + 0.1);
    if (s.receipts) receiptsPile(el, s, t0);
    if (s.memo) memoPile(el, s, t0);

    // 걸린 시간 카운터
    const timer = h(`<div class="status" style="position:absolute;left:80px;top:1150px;background:var(--rust)">⏱ ${s.timer.prefix}<b class="n">0</b>${s.timer.unit}</div>`);
    el.appendChild(timer);
    fx.pop(timer, t0 + 1.0, 0.45);
    fx.count(timer.querySelector(".n"), s.timer.to, t0 + 1.1, s.dur - 1.6, (n) => String(n));
  };

  /* -------------------------------------------- sheet / doc (빈 양식 → After) */
  function resultScene(stage, s, t0) {
    const el = sceneBox(stage, t0, s.dur);
    cue("whoosh", t0);
    const swap = s.swapAt; // 빈 양식 → After 로 넘어가는 시점(장면 기준 초)

    // 헤드라인 A (빈 양식) → B (결과)
    const a = headline(el, { label: s.frame.label, headline: s.frame.headline }, t0 + 0.1);
    a.style.position = "absolute";
    fx.out(a, t0 + swap - 0.3, 0.3);
    const b = headline(el, { label: s.after.label, headline: s.after.headline }, t0 + swap);
    b.style.position = "absolute";

    // 결과물 (처음엔 빈 양식)
    const wrap = h(`<div style="position:absolute;left:80px;right:80px;top:${s.top || 470}px">${RESULT[s.type].html(s)}</div>`);
    el.appendChild(wrap);
    fx.up(wrap, t0 + 0.35, 80, 0.8);
    cue("pop", t0 + 0.45, 0.5);

    const start = t0 + swap + 0.6;
    const doneAt = RESULT[s.type].animate(wrap, s, start);

    // 처리 상태 칩
    const st = h(`<div class="status" style="position:absolute;right:110px;top:${(s.top || 470) - 30}px;z-index:5"><span class="spinner"></span><span class="txt"></span></div>`);
    el.appendChild(st);
    const spin = st.querySelector(".spinner"), txt = st.querySelector(".txt");
    tick((t) => {
      const done = t >= doneAt - 0.4;
      spin.style.display = done ? "none" : "block";
      spin.style.transform = `rotate(${(t * 540) % 360}deg)`;
      txt.textContent = done ? s.status.done : s.status.working;
      st.style.background = done ? "var(--rust)" : "var(--ink)";
    });
    fx.pop(st, t0 + swap + 0.1, 0.4);
    cue("pop", t0 + swap + 0.1, 0.5);

    // 도장
    const stamp = h(`<div class="stamp" style="left:790px;top:195px"><b>${s.stamp.big}</b><span>${s.stamp.small}</span></div>`);
    el.appendChild(stamp);
    anim(stamp, [
      { opacity: 0, transform: "scale(2.2) rotate(-24deg)" },
      { opacity: 1, transform: "scale(1) rotate(-12deg)" },
    ], doneAt + 0.2, 0.35, "inOut");
    cue("stamp", doneAt + 0.5, 1);
  }
  T.sheet = resultScene;
  T.doc = resultScene;

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
  // 나레이션 길이 추정(초) — 실제 음성(vo/manifest.json)이 없을 때 장면 길이를 잡는 용도
  function estimateVo(text) {
    const chars = text.replace(/\s/g, "").length;
    const pauses = (text.match(/[,.?!…]/g) || []).length;
    return chars / 6.2 + pauses * 0.25;
  }

  // vo: tts.mjs 가 만든 manifest ({ items: [{ scene, file, dur }] }) 또는 null
  function build(stage, ep, vo) {
    // 공통 상단 태그 · 하단 로고 · 진행바
    stage.appendChild(h(`<div class="chrome-top"><span class="pill">${ep.tag}</span><span class="ep">${ep.ep} · ${ep.topic}</span></div>`));
    const bot = h('<div class="chrome-bot"><div class="logo">Co<b>Mind</b>works</div><div class="progress"><i></i></div></div>');
    stage.appendChild(bot);

    const pace = ep.pace || 1;
    const LEAD = 0.35, TAIL = 0.6; // 장면 시작 후 말 시작까지 / 말 끝나고 다음 장면까지 (실제 초)
    let t = 0;
    ep.scenes.forEach((s, i) => {
      if (!T[s.type]) throw new Error(`알 수 없는 장면 type: ${s.type}`);
      // 나레이션이 장면 안에 다 들어가도록 장면 길이를 늘림 (줄이지는 않음)
      const item = vo && vo.items.find((x) => x.scene === i);
      const voDur = item ? item.dur : s.vo ? estimateVo(s.vo) : 0;
      if (voDur) {
        s.dur = Math.max(s.dur, (LEAD + voDur + TAIL + (i === ep.scenes.length - 1 ? 0.8 : 0)) / pace);
        window.TL.voice.push({ scene: i, t: +(t * pace + LEAD).toFixed(3), dur: +voDur.toFixed(3), file: item ? item.file : null, text: s.vo });
      }
      T[s.type](stage, s, t, ep);
      window.TL.scenes.push({ i, type: s.type, t0: +(t * pace).toFixed(3), t1: +((t + s.dur) * pace).toFixed(3) });
      t += s.dur;
    });
    const TL = window.TL;
    TL.pace = pace;
    TL.base = +(t + (ep.tail || 0)).toFixed(3);
    TL.duration = +(TL.base * pace).toFixed(3);
    TL.cues = TL.cues.map((c) => ({ ...c, t: +(c.t * pace).toFixed(3) })); // 효과음도 실제 시각으로
    const bar = bot.querySelector(".progress i");
    tick((now) => { bar.style.width = `${Math.min(100, (now / TL.base) * 100)}%`; });
  }

  window.buildVideo = build;
})();
