/* =========================================================================
   "하루 커피값 5,000원, 30년이면?" — 30초 설명 영상
   -------------------------------------------------------------------------
   Render contract
   · window.seek(t) paints the frame at time t. Every frame is a pure function of t.
   · TIMELINE holds every beat, move, anchor, caption and sound cue.
   · No Math.random: the only randomness is seeded noise in the audio bed.
   Every number on screen is arithmetic on three inputs: 5,000원 × 365일 × 30년
   (see SOURCES.md). URL params: fmt=16x9|9x16|1x1 theme=paper|noir|blueprint rm=1 caps=0 export=1
   ========================================================================= */
(() => {
  const P = new URLSearchParams(location.search);
  const FMT_ID = P.get("fmt") || "16x9";
  const THEME_ID = P.get("theme") || "paper";
  const RM = P.get("rm") === "1";
  const CAPS = P.get("caps") !== "0";
  const DURATION = 30, FPS = 60;

  /* ---------------- inputs: the only three numbers ---------------- */
  const DAILY = 5000, DAYS_PER_YEAR = 365, YEARS = 30, LATE = 10;
  const YEAR_SUM = DAILY * DAYS_PER_YEAR;               // 1,825,000
  const TOTAL = YEAR_SUM * YEARS;                        // 54,750,000
  const TOTAL_DAYS = DAYS_PER_YEAR * YEARS;              // 10,950
  const LATE_TOTAL = YEAR_SUM * (YEARS - LATE);          // 36,500,000
  const won = (n) => Math.round(n).toLocaleString("en-US") + "원";
  const man = (n) => (n / 10000).toLocaleString("en-US") + "만";

  /* ---------------- tokens ---------------- */
  const THEMES = {
    paper: { ground: "#F4F1EA", surface: "#FFFDF8", ink: "#1E1D1A", muted: "#5E5A52", line: "#D6CFC2",
             accent: "#0B6B62", accentFill: "#DCEBE6", onAccent: "#FFFDF8", capBg: "#1E1D1A", capInk: "#FFFDF8", slot: "#B5AB99" },
    noir: { ground: "#0A0B0B", surface: "#161918", ink: "#F4F6F5", muted: "#A3AAA8", line: "#2A2F2D",
            accent: "#17D0BB", accentFill: "#12322E", onAccent: "#0A0B0B", capBg: "#F4F6F5", capInk: "#0A0B0B", slot: "#3A403E" },
    blueprint: { ground: "#EEF2F6", surface: "#FFFFFF", ink: "#14202E", muted: "#4A5868", line: "#C5D0DC",
                 accent: "#1F5FAD", accentFill: "#DCE7F5", onAccent: "#FFFFFF", capBg: "#14202E", capInk: "#FFFFFF", slot: "#A9B7C7" },
  };
  const C = THEMES[THEME_ID];
  const SANS = "Pretendard, sans-serif";

  /* ---------------- formats: each is its own composition on one margin grid ---------------- */
  const FMTS = {
    "16x9": { W: 1920, H: 1080, m: 96, anchor: { y: 104, size: 68 },
      counter: { y: 218, size: 96, sub: 36 }, content: { y0: 160, y1: 905 },
      cap: { bottom: 1040, size: 54, maxW: 1720 },
      card: { cx: 960, cy: 540, w: 980, icon: 108, title: 40, body: 64, pad: 40 }, cell: 230,
      grid: { cols: 37, cell: 32, gap: 6, cy: 590 },
      chart: { x0: 330, x1: 1824, top: 390, bot: 830, label: 36 }, foot: 36 },
    "9x16": { W: 1080, H: 1920, m: 72, anchor: { y: 214, size: 68 },
      counter: { y: 400, size: 108, sub: 40 }, content: { y0: 290, y1: 1400 },
      cap: { bottom: 1480, size: 48, maxW: 936 },        // ends above the Shorts/Reels overlay (y ≥ 1536)
      card: { cx: 540, cy: 845, w: 936, icon: 124, title: 44, body: 76, pad: 44 }, cell: 280,
      grid: { cols: 19, cell: 36, gap: 6, cy: 972 },
      chart: { x0: 236, x1: 1008, top: 610, bot: 1250, label: 38 }, foot: 40 },
    "1x1": { W: 1080, H: 1080, m: 60, anchor: { y: 78, size: 56 },
      counter: { y: 176, size: 84, sub: 32 }, content: { y0: 130, y1: 900 },
      cap: { bottom: 1040, size: 42, maxW: 960 },
      card: { cx: 540, cy: 520, w: 900, icon: 96, title: 36, body: 58, pad: 34 }, cell: 210,
      grid: { cols: 25, cell: 30, gap: 5, cy: 560 },
      chart: { x0: 220, x1: 1020, top: 300, bot: 800, label: 34 }, foot: 32 },
  };
  const F = FMTS[FMT_ID];
  const W = F.W, H = F.H;

  /* ---------------- TIMELINE ---------------- */
  const TIMELINE = {
    beats: [
      { id: "Q",  t0: 0,    t1: 3,    part: "Question" },
      { id: "M1", t0: 3,    t1: 5,    part: "Model" },
      { id: "M2", t0: 5,    t1: 10.5, part: "Model" },
      { id: "P1", t0: 10.5, t1: 19.9, part: "Proof" },
      { id: "P2", t0: 19.9, t1: 22.5, part: "Proof" },
      { id: "T",  t0: 22.5, t1: 27,   part: "Turn" },
      { id: "Y",  t0: 27,   t1: 30,   part: "Payoff" },
    ],
    camera: [{ t: 0, key: "card" }, { t: 4.6, dur: 0.8, key: "wide" }, { t: 27.0, dur: 0.8, key: "card" }],
    moves: {
      card_in: 0.15,          // notification arrives
      card_to_cell: 3.1,      // the notification becomes one day's cell (0.9 s)
      cell_to_grid: 5.0,      // the big cell takes its place as day 1 (0.6 s)
      fill: [5.6, 8.6],       // days 2..365 fill at a steady rate
      grid_to_bar: 10.6,      // the year collapses into bar 1 (1.2 s)
      axis_in: 11.4,
      bars: 12.5,             // bar 2 starts here; one bar every 0.25 s, each grows 0.3 s
      bar_step: 0.25,
      late_hollow: 22.8,      // first 10 bars go hollow (0.6 s)
      late_shrink: 23.3,      // bars 11..30 drop by 10 years (1.3 s)
      late_gap: 24.6,         // the lost top is marked
      out: 27.0,              // chart and counter leave (0.3 s)
      card_back: 27.35,
      card_line: 27.9,        // "× 10,950일 = 54,750,000원" types into the card
      foot: 28.5,
    },
    anchors: [
      { t0: 3.2, t1: 4.9, text: "하루 = 한 칸" },
      { t0: 5.3, t1: 10.4, text: "1년 = 365칸" },
      { t0: 19.9, t1: 22.4, text: "30년 = 10,950일" },
      { t0: 22.7, t1: 26.9, text: "10년 늦게 모으기 시작하면" },
      { t0: 28.0, t1: 30.4, text: "오늘 한 잔부터 세어 보세요" },
    ],
    captions: [
      { t0: 0.2, t1: 2.9, text: "커피 한 잔 5,000원, 푼돈이라고들 하죠." },
      { t0: 3.0, t1: 4.9, text: "이 5,000원을 하루 한 칸씩 모으면," },
      { t0: 5.0, t1: 8.5, text: "1년을 채우면 365칸," },
      { t0: 8.6, t1: 10.4, text: "182만 5천 원입니다." },
      { t0: 10.5, t1: 19.8, text: "이 1년을 30번 쌓으면," },
      { t0: 19.9, t1: 22.4, text: "1만 950일, 모두 5,475만 원입니다." },
      { t0: 22.5, t1: 24.5, text: "10년 늦게 모으기 시작하면" },
      { t0: 24.6, t1: 26.9, text: "1,825만 원이 덜 모입니다." },
      { t0: 27.0, t1: 29.9, text: "하루 5,000원, 30년이면 5,475만 원입니다." },
    ],
    cues: [
      { t: 0.35, kind: "ding" },       // the card payment lands
      { t: 3.3, kind: "pop" },         // it becomes one day
      { t: 8.6, kind: "tick" },        // day 365: a year is full
      { t: 10.6, kind: "swish" },      // the year collapses into one bar
      { t: 14.8, kind: "tick" }, { t: 17.3, kind: "tick" }, { t: 19.8, kind: "tick" }, // 10 / 20 / 30 years
      { t: 19.9, kind: "motif" },      // the total
      { t: 22.8, kind: "thud" },       // ten years gone
      { t: 24.6, kind: "low" },        // the smaller total lands
      { t: 27.9, kind: "motif" },      // the opening image, read correctly
    ],
    bpm: 96,
  };
  const M = TIMELINE.moves;

  /* ---------------- math ---------------- */
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (u) => ((ax * u + bx) * u + cx) * u, sy = (u) => ((ay * u + by) * u + cy) * u;
    return (x) => { if (x <= 0) return 0; if (x >= 1) return 1; let lo = 0, hi = 1, u = x;
      for (let i = 0; i < 24; i++) { if (sx(u) < x) lo = u; else hi = u; u = (lo + hi) / 2; } return sy(u); };
  }
  const SETTLE = bezier(0.2, 0.0, 0.0, 1.0);   // lands softly, never overshoots
  const SOFT = bezier(0.4, 0.0, 0.2, 1.0);
  let T = 0;
  const raw = (t0, d) => clamp((T - t0) / d);
  const mv = (t0, d) => (RM ? (T >= t0 + d * 0.5 ? 1 : 0) : SETTLE(raw(t0, d)));
  const fa = (t0, d) => (RM ? clamp((T - (t0 + d * 0.5) + 0.15) / 0.3) : SOFT(raw(t0, d)));

  /* ---------------- canvas helpers ---------------- */
  const canvas = document.getElementById("film");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const fitWarnings = new Set(); window.__fitWarnings = fitWarnings;
  const font = (s, w = 500) => `${w} ${s}px ${SANS}`;
  const measure = (str, s, w = 500) => { ctx.font = font(s, w); ctx.letterSpacing = "0px"; return ctx.measureText(str).width; };
  function text(str, x, y, o = {}) {
    let size = o.size || 40; const w = o.weight || 500;
    if (o.maxW) { const mw = measure(str, size, w); if (mw > o.maxW) { size *= o.maxW / mw; fitWarnings.add(`${FMT_ID}: "${str}" shrunk to ${size.toFixed(1)}px`); } }
    ctx.save(); ctx.font = font(size, w); ctx.letterSpacing = "0px"; ctx.fillStyle = o.color || C.ink;
    ctx.textAlign = o.align || "left"; ctx.textBaseline = o.baseline || "middle"; ctx.globalAlpha *= o.alpha ?? 1;
    ctx.fillText(str, x, y); ctx.restore();
  }
  // numbers in fixed digit slots so a counting number never jitters sideways
  function number(str, x, y, size, o = {}) {
    const dw = measure("0", size, 800), cw = measure(",", size, 800);
    let w = 0; for (const ch of str) w += ch === "," ? cw : /\d/.test(ch) ? dw : measure(ch, size * 0.62, 700) + 6;
    let cx = o.align === "right" ? x - w : o.align === "center" ? x - w / 2 : x;
    for (const ch of str) {
      if (/\d|,/.test(ch)) { const adv = ch === "," ? cw : dw; text(ch, cx + adv / 2, y, { size, weight: 800, align: "center", color: o.color, alpha: o.alpha }); cx += adv; }
      else { text(ch, cx + 6, y + size * 0.16, { size: size * 0.62, weight: 700, color: o.color, alpha: o.alpha }); cx += measure(ch, size * 0.62, 700) + 6; }
    }
    return w;
  }
  const rrect = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  function wrap(str, maxW, size, weight) {
    const words = str.split(" "), out = []; let cur = "";
    for (const wd of words) { const next = cur ? cur + " " + wd : wd; if (measure(next, size, weight) <= maxW) cur = next; else { if (cur) out.push(cur); cur = wd; } }
    if (cur) out.push(cur); return out;
  }

  /* ---------------- layout ---------------- */
  const CARD = (() => { const c = F.card, h = c.pad * 2 + c.title * 1.3 + c.body * 1.25; return { x: c.cx - c.w / 2, y: c.cy - h / 2, w: c.w, h }; })();
  const cardH = (extra) => CARD.h + extra * (F.card.pad * 0.6 + F.card.title * 1.5 + F.card.body * 1.55);
  const G = (() => { const g = F.grid, rows = Math.ceil(DAYS_PER_YEAR / g.cols), step = g.cell + g.gap;
    const w = g.cols * step - g.gap, h = rows * step - g.gap; return { ...g, rows, step, w, h, x: W / 2 - w / 2, y: g.cy - h / 2 }; })();
  const cellRect = (k) => ({ x: G.x + (k % G.cols) * G.step, y: G.y + Math.floor(k / G.cols) * G.step, w: G.cell, h: G.cell });
  const CH = (() => { const c = F.chart, slot = (c.x1 - c.x0) / YEARS, bw = slot * 0.7; return { ...c, slot, bw, unit: (c.bot - c.top) / YEARS }; })();
  const barX = (i) => CH.x0 + (i - 1) * CH.slot + (CH.slot - CH.bw) / 2;   // i = 1..30
  const BIG = (() => { const s = F.cell; return { x: F.card.cx - s / 2, y: F.card.cy - s / 2, w: s, h: s }; })();

  /* ---------------- camera ---------------- */
  const CONTENT = { x: 0, y: F.content.y0, w: W, h: F.content.y1 - F.content.y0 };
  const FOCUS = { wide: CONTENT, card: { x: CARD.x - 60, y: CARD.y - 60, w: CARD.w + 120, h: CARD.h + 120 } };
  function camScale(r) { return Math.min(1.12, Math.min(CONTENT.w / r.w, CONTENT.h / r.h)); }
  function applyCamera() {
    let cur = FOCUS[TIMELINE.camera[0].key];
    if (RM) cur = FOCUS.wide;
    else for (const k of TIMELINE.camera.slice(1)) {
      if (T < k.t) break; const to = FOCUS[k.key], e = SETTLE(clamp((T - k.t) / k.dur));
      cur = { x: lerp(cur.x, to.x, e), y: lerp(cur.y, to.y, e), w: lerp(cur.w, to.w, e), h: lerp(cur.h, to.h, e) };
    }
    // scale is blended separately so the wide shot is always exactly 1:1
    const s = camScale(cur) < 1 ? 1 : camScale(cur);
    ctx.translate(CONTENT.x + CONTENT.w / 2, CONTENT.y + CONTENT.h / 2); ctx.scale(s, s);
    ctx.translate(-(cur.x + cur.w / 2), -(cur.y + cur.h / 2));
  }

  /* ---------------- state as functions of t ---------------- */
  const filledDays = () => {
    if (T < M.cell_to_grid) return 0;
    if (T < M.fill[0]) return 1;
    const k = clamp((T - M.fill[0]) / (M.fill[1] - M.fill[0]));
    return 1 + Math.floor(k * (DAYS_PER_YEAR - 1) + 1e-9);
  };
  const barStart = (i) => (i === 1 ? M.grid_to_bar : M.bars + (i - 2) * M.bar_step);
  // cumulative height of bar i in "years", including the turn
  function barYears(i) {
    if (i === 1) return T >= M.grid_to_bar ? 1 : 0;
    const g = mv(barStart(i), 0.3);
    if (g <= 0) return 0;
    let h = (i - 1) + g;
    if (T >= M.late_shrink && i > LATE) h -= LATE * mv(M.late_shrink, 1.3);
    return h;
  }
  function yearsSoFar() { // what the counter says, in years of savings
    if (T < M.grid_to_bar) return filledDays() / DAYS_PER_YEAR;
    let y = 1; for (let i = 2; i <= YEARS; i++) if (T >= barStart(i)) y = Math.max(y, (i - 1) + mv(barStart(i), 0.3));
    if (T >= M.late_shrink) y -= LATE * mv(M.late_shrink, 1.3);
    return y;
  }

  /* ---------------- pieces ---------------- */
  function drawCard(alpha, extraLine) {
    if (alpha <= 0) return;
    const c = F.card, h = cardH(extraLine ? 1 : 0), y = F.card.cy - h / 2;
    ctx.save(); ctx.globalAlpha *= alpha;
    rrect(CARD.x, y, CARD.w, h, 28); ctx.fillStyle = C.surface; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.line; ctx.stroke();
    const ix = CARD.x + c.pad, iy = y + c.pad;
    rrect(ix, iy, c.icon, c.icon, 24); ctx.fillStyle = C.accentFill; ctx.fill();
    ctx.restore();
    text("₩", ix + c.icon / 2, iy + c.icon / 2, { size: c.icon * 0.5, weight: 800, color: C.accent, align: "center", alpha });
    const tx = ix + c.icon + c.pad * 0.75;
    text("카드 승인 · 카페", tx, iy + c.title * 0.55, { size: c.title, weight: 600, color: C.muted, alpha });
    text("오전 8:12", CARD.x + CARD.w - c.pad, iy + c.title * 0.55, { size: c.title, weight: 500, color: C.muted, align: "right", alpha });
    number("5,000원", tx, iy + c.title * 1.3 + c.body * 0.62, c.body, { alpha });
    if (extraLine) {
      const ly = iy + c.title * 1.3 + c.body * 1.25 + c.pad * 0.6;
      ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = C.line; ctx.fillRect(ix, ly, CARD.w - c.pad * 2, 2); ctx.restore();
      const a1 = alpha * clamp(extraLine.reveal * 2), a2 = alpha * clamp(extraLine.reveal * 2 - 1);
      text(`× ${TOTAL_DAYS.toLocaleString("en-US")}일 (30년)`, ix, ly + c.pad * 0.6 + c.title * 0.5, { size: c.title, weight: 700, color: C.accent, alpha: a1 });
      text(`= ${man(TOTAL)} 원`, ix, ly + c.pad * 0.6 + c.title * 1.25 + c.body * 0.7, { size: c.body * 1.3, weight: 800, color: C.accent, alpha: a2, maxW: CARD.w - c.pad * 2 });
    }
  }

  function drawCardToCell() {
    // Q → M1: the notification becomes one day's 5,000원 cell; M2: that cell becomes day 1 of the year
    const appear = fa(M.card_in, 0.5), rise = RM ? 0 : (1 - SETTLE(raw(M.card_in, 0.6))) * 30;
    if (T < M.card_to_cell) { ctx.save(); ctx.translate(0, rise); drawCard(appear); ctx.restore(); return; }
    const k = mv(M.card_to_cell, 0.9), tf = fa(M.card_to_cell, 0.35);
    if (T < M.cell_to_grid) {
      if (RM) { const f = fa(M.card_to_cell, 0.9); drawCard(1 - f); bigCell(BIG, f, f); return; }
      drawCard(1 - tf);
      const r = { x: lerp(CARD.x, BIG.x, k), y: lerp(CARD.y, BIG.y, k), w: lerp(CARD.w, BIG.w, k), h: lerp(CARD.h, BIG.h, k) };
      bigCell(r, k);
      return;
    }
    if (T >= M.grid_to_bar) return;
    const k2 = mv(M.cell_to_grid, 0.6), d0 = cellRect(0);
    if (RM) { const f = 1 - fa(M.cell_to_grid, 0.6); bigCell(BIG, f, f); return; }
    if (k2 < 1) bigCell({ x: lerp(BIG.x, d0.x, k2), y: lerp(BIG.y, d0.y, k2), w: lerp(BIG.w, d0.w, k2), h: lerp(BIG.h, d0.h, k2) }, 1 - k2);
  }
  function bigCell(r, labelAlpha, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha; rrect(r.x, r.y, r.w, r.h, Math.min(26, r.w * 0.18)); ctx.fillStyle = C.accent; ctx.fill(); ctx.restore();
    if (r.w > 80) text("5,000원", r.x + r.w / 2, r.y + r.h / 2, { size: r.w * 0.2, weight: 800, color: C.onAccent, align: "center", alpha: labelAlpha });
  }

  function drawGrid() {
    if (T < M.cell_to_grid || T >= M.grid_to_bar + 1.2) return;
    const n = filledDays();
    const collapse = mv(M.grid_to_bar, 1.2);
    const cellsAlpha = RM ? 1 - fa(M.grid_to_bar, 1.2) : clamp(1 - collapse * 2.2);
    // empty slots: the year waiting to be filled
    ctx.save(); ctx.globalAlpha = 0.9 * cellsAlpha * fa(M.cell_to_grid, 0.5);
    ctx.fillStyle = C.slot; for (let k = 0; k < DAYS_PER_YEAR; k++) { const r = cellRect(k); rrect(r.x, r.y, r.w, r.h, 6); ctx.fill(); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = cellsAlpha; ctx.fillStyle = C.accent;
    for (let k = (T < M.cell_to_grid + 0.6 && !RM ? 1 : 0); k < n; k++) { const r = cellRect(k); rrect(r.x, r.y, r.w, r.h, 6); ctx.fill(); }
    ctx.restore();
    // P: the full year folds into a single block that becomes bar 1
    if (T >= M.grid_to_bar && !RM) {
      const b = { x: barX(1), y: CH.bot - CH.unit, w: CH.bw, h: CH.unit };
      const r = { x: lerp(G.x, b.x, collapse), y: lerp(G.y, b.y, collapse), w: lerp(G.w, b.w, collapse), h: lerp(G.h, b.h, collapse) };
      ctx.save(); ctx.globalAlpha = clamp(collapse * 3); rrect(r.x, r.y, r.w, r.h, lerp(10, 4, collapse)); ctx.fillStyle = C.accent; ctx.fill(); ctx.restore();
    }
  }

  function drawChart() {
    if (T < M.axis_in - 0.01 || T >= M.out + 0.6) return;
    const out = 1 - fa(M.out, 0.3);
    const ax = fa(M.axis_in, 0.6) * out;
    ctx.save(); ctx.globalAlpha = ax; ctx.fillStyle = C.line; ctx.fillRect(CH.x0 - 10, CH.bot, CH.x1 - CH.x0 + 10, 3); ctx.restore();
    text("이자 없이 그대로 모은 돈", CH.x1, CH.top - CH.label * 1.15, { size: F.foot, weight: 600, color: C.muted, align: "right", alpha: ax });
    // x labels
    for (const [i, lab] of [[1, "1년"], [10, "10년"], [20, "20년"], [30, "30년"]])
      text(lab, barX(i) + CH.bw / 2, CH.bot + CH.label * 1.1, { size: CH.label, weight: 600, color: C.muted, align: "center", alpha: ax });
    // y gridlines appear as each decade is reached
    for (const yrs of [10, 20, 30]) {
      const a = fa(barStart(yrs) + 0.2, 0.4) * out; if (a <= 0) continue;
      const y = CH.bot - yrs * CH.unit;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(CH.x0 - 10, y); ctx.lineTo(CH.x1, y); ctx.stroke(); ctx.restore();
      text(man(YEAR_SUM * yrs), CH.x0 - 26, y, { size: CH.label, weight: 600, color: C.muted, align: "right", alpha: a });
    }
    // bars
    const hollow = T >= M.late_hollow ? (RM ? fa(M.late_hollow, 0.6) : mv(M.late_hollow, 0.6)) : 0;
    for (let i = 1; i <= YEARS; i++) {
      const yrs = barYears(i); if (yrs <= 0) continue;
      const x = barX(i), h = yrs * CH.unit;
      const isLate = i <= LATE;
      ctx.save(); ctx.globalAlpha = out * (isLate ? 1 - hollow : 1);
      rrect(x, CH.bot - h, CH.bw, h, Math.min(4, CH.bw / 4)); ctx.fillStyle = C.accent; ctx.fill(); ctx.restore();
      if (isLate && hollow > 0) { // the years you didn't save: outline only, dashed, thinner
        const full = i * CH.unit;
        ctx.save(); ctx.globalAlpha = out * hollow; ctx.strokeStyle = C.muted; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
        rrect(x + 1, CH.bot - full + 1, CH.bw - 2, full - 2, 3); ctx.stroke(); ctx.restore();
      }
    }
    // T: the top that went missing from the last bar, marked and labelled
    const gap = fa(M.late_gap, 0.5) * out;
    if (gap > 0) {
      const x = barX(YEARS), yTop = CH.bot - YEARS * CH.unit, yNew = CH.bot - (YEARS - LATE) * CH.unit;
      ctx.save(); ctx.globalAlpha = gap; ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.setLineDash([7, 5]);
      rrect(x - 2, yTop, CH.bw + 4, yNew - yTop, 4); ctx.stroke(); ctx.restore();
      text(`−${man(YEAR_SUM * LATE)} 원`, x - 18, (yTop + yNew) / 2, { size: CH.label * 1.05, weight: 800, align: "right", alpha: gap });
    }
  }

  function drawCounter() {
    if (T < M.cell_to_grid || T >= M.out + 0.6) return;
    const a = fa(M.cell_to_grid, 0.5) * (1 - fa(M.out, 0.3));
    const years = yearsSoFar();
    const falling = T >= M.late_shrink && T < M.late_shrink + 1.3;
    const wholeYears = Math.min(YEARS, Math.max(1, Math.round(years)));
    let value = T < M.grid_to_bar ? filledDays() * DAILY : falling ? Math.round(years * YEAR_SUM / DAILY) * DAILY : wholeYears * YEAR_SUM;
    number(won(value), F.m, F.counter.y, F.counter.size, { alpha: a });
    let sub;
    if (T < M.grid_to_bar) sub = `${filledDays()}일 × 5,000원`;
    else sub = `${wholeYears}년 × ${won(YEAR_SUM)}`;
    const subA = falling ? 0 : T >= M.late_shrink ? fa(M.late_shrink + 1.3, 0.3) : 1;
    text(sub, F.m, F.counter.y + F.counter.size * 0.78, { size: F.counter.sub, weight: 600, color: C.muted, alpha: a * subA, maxW: W - F.m * 2 });
  }

  function drawPayoff() {
    if (T < M.card_back) return;
    const a = fa(M.card_back, 0.6), rise = RM ? 0 : (1 - SETTLE(raw(M.card_back, 0.6))) * 30;
    const reveal = RM ? fa(M.card_line, 0.7) : clamp((T - M.card_line) / 0.7);
    ctx.save(); ctx.translate(0, rise); drawCard(a, T >= M.card_line ? { reveal } : null); ctx.restore();
    const fy = F.card.cy + cardH(1) / 2 + F.foot * 1.4;
    text("단순 합계 · 이자·물가 미반영", W / 2, fy, { size: F.foot, weight: 500, color: C.muted, align: "center", alpha: fa(M.foot, 0.5) });
  }

  /* ---------------- screen-space layers ---------------- */
  function drawAnchor() {
    for (const an of TIMELINE.anchors) {
      if (T < an.t0 - 0.01 || T > an.t1 + 0.4) continue;
      const inK = fa(an.t0, 0.4), outK = T > an.t1 ? fa(an.t1, 0.3) : 0;
      const rise = RM ? 0 : (1 - SETTLE(raw(an.t0, 0.4))) * 12;
      text(an.text, F.m, F.anchor.y + rise, { size: F.anchor.size, weight: 800, alpha: inK * (1 - outK), maxW: W - F.m * 2 });
    }
  }
  function drawCaption() {
    if (!CAPS) return;
    for (const c of TIMELINE.captions) {
      if (T < c.t0 || T > c.t1) continue;
      const a = Math.min(clamp((T - c.t0) / 0.12), clamp((c.t1 - T) / 0.12));
      const size = F.cap.size, lh = size * 1.36;
      const lines = wrap(c.text, F.cap.maxW - 48, size, 500).slice(0, 2);
      const w = Math.max(...lines.map((l) => measure(l, size, 500))) + 48, h = lines.length * lh + 24;
      const top = F.cap.bottom - h;
      ctx.save(); ctx.globalAlpha = a; rrect(W / 2 - w / 2, top, w, h, 14); ctx.fillStyle = C.capBg; ctx.fill(); ctx.restore();
      const y0 = top + 12 + lh / 2;
      lines.forEach((l, i) => text(l, W / 2, y0 + i * lh, { size, weight: 500, color: C.capInk, align: "center", alpha: a }));
    }
  }

  function render(t) {
    T = clamp(t, 0, DURATION);
    ctx.save();
    ctx.fillStyle = C.ground; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.rect(0, F.content.y0 - 30, W, F.content.y1 - F.content.y0 + 60); ctx.clip();
    applyCamera();
    drawChart();
    drawGrid();
    drawCardToCell();
    drawPayoff();
    ctx.restore();
    drawCounter();
    drawAnchor();
    drawCaption();
    ctx.restore();
  }

  /* ---------------- sound: tempo-locked bed + one motif + meaningful cues ---------------- */
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  async function renderAudio() {
    const SR = 48000, ac = new OfflineAudioContext(2, SR * DURATION, SR);
    const master = ac.createGain(); master.connect(ac.destination);
    master.gain.setValueAtTime(0.8, 0); master.gain.setValueAtTime(0.8, DURATION - 1.0); master.gain.linearRampToValueAtTime(0.0001, DURATION);
    const beat = 60 / TIMELINE.bpm, bar = beat * 4, hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const bed = ac.createGain(); bed.connect(master);
    const lv = [[0, 0.45], [3, 0.6], [10.5, 0.85], [22.5, 0.55], [27, 0.8], [DURATION, 0.8]];
    bed.gain.setValueAtTime(lv[0][1], 0); for (const [tt, v] of lv.slice(1)) bed.gain.linearRampToValueAtTime(v, tt);
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1100; lp.Q.value = 0.4; lp.connect(bed);
    const chords = [[50, 54, 57], [47, 50, 54], [43, 47, 50], [45, 49, 52]]; // D – Bm – G – A, two bars each
    for (let b = 0; b * bar * 2 < DURATION; b++) {
      const t0 = b * bar * 2, ch = chords[b % 4];
      for (const n of ch) for (const det of [-4, 4]) {
        const o = ac.createOscillator(); o.type = "triangle"; o.frequency.value = hz(n + 12); o.detune.value = det;
        const g = ac.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.022, t0 + 1.0);
        g.gain.setValueAtTime(0.022, t0 + bar * 2 - 0.6); g.gain.linearRampToValueAtTime(0, t0 + bar * 2 + 0.4);
        o.connect(g).connect(lp); o.start(t0); o.stop(Math.min(DURATION, t0 + bar * 2 + 0.5));
      }
      for (let k = 0; k < 2; k++) { const tb = t0 + k * bar; if (tb >= DURATION) break;
        const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = hz(ch[0] - 12);
        const g = ac.createGain(); g.gain.setValueAtTime(0, tb); g.gain.linearRampToValueAtTime(0.09, tb + 0.05); g.gain.exponentialRampToValueAtTime(0.0008, tb + bar * 0.95);
        o.connect(g).connect(bed); o.start(tb); o.stop(tb + bar); }
    }
    const nb = ac.createBuffer(1, SR * 0.08, SR), nd = nb.getChannelData(0), r1 = rng(7);
    for (let i = 0; i < nd.length; i++) nd[i] = (r1() * 2 - 1) * Math.pow(1 - i / nd.length, 3);
    for (let tb = beat; tb < DURATION - 1; tb += beat * 2) { if (tb < 3) continue;
      const s = ac.createBufferSource(); s.buffer = nb; const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 5200; bp.Q.value = 0.8;
      const g = ac.createGain(); g.gain.value = 0.045; s.connect(bp).connect(g).connect(bed); s.start(tb); }
    const tone = (tt, f, amp, dur, type = "sine", f2) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, tt);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, tt + dur * 0.6);
      const g = ac.createGain(); g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(amp, tt + 0.006); g.gain.exponentialRampToValueAtTime(0.0005, tt + dur);
      o.connect(g).connect(master); o.start(tt); o.stop(tt + dur + 0.02); };
    const motif = (t0) => [69, 74, 78].forEach((n, i) => { const tt = t0 + i * beat * 0.5; tone(tt, hz(n), 0.11, 1.4); tone(tt, hz(n) * 2, 0.015, 1.0, "triangle"); });
    const swb = ac.createBuffer(1, SR * 0.6, SR), swd = swb.getChannelData(0), r2 = rng(11);
    for (let i = 0; i < swd.length; i++) { const u = i / swd.length; swd[i] = (r2() * 2 - 1) * Math.sin(Math.PI * u) ** 2; }
    const swish = (tt) => { const s = ac.createBufferSource(); s.buffer = swb; const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(3200, tt); bp.frequency.exponentialRampToValueAtTime(600, tt + 0.55);   // falling: the year folds down
      const lp2 = ac.createBiquadFilter(); lp2.type = "lowpass"; lp2.frequency.value = 3800;
      const g = ac.createGain(); g.gain.value = 0.07; s.connect(bp).connect(lp2).connect(g).connect(master); s.start(tt); };
    for (const c of TIMELINE.cues) {
      if (c.kind === "motif") motif(c.t);
      else if (c.kind === "tick") tone(c.t, 1760, 0.12, 0.06);
      else if (c.kind === "pop") tone(c.t, 660, 0.1, 0.16, "sine", 990);
      else if (c.kind === "ding") { tone(c.t, hz(81), 0.09, 0.5); tone(c.t + 0.14, hz(76), 0.09, 0.7); }
      else if (c.kind === "thud") tone(c.t, 140, 0.22, 0.3, "sine", 70);
      else if (c.kind === "low") tone(c.t, hz(62), 0.1, 0.5);
      else if (c.kind === "swish") swish(c.t);
    }
    const buf = await ac.startRendering();
    const ch0 = buf.getChannelData(0), ch1 = buf.getChannelData(1), n = ch0.length;
    const ab = new ArrayBuffer(44 + n * 4), dv = new DataView(ab), wstr = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    wstr(0, "RIFF"); dv.setUint32(4, 36 + n * 4, true); wstr(8, "WAVE"); wstr(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true);
    dv.setUint32(24, SR, true); dv.setUint32(28, SR * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); wstr(36, "data"); dv.setUint32(40, n * 4, true);
    for (let i = 0, o = 44; i < n; i++, o += 4) { dv.setInt16(o, Math.max(-1, Math.min(1, ch0[i])) * 32767, true); dv.setInt16(o + 2, Math.max(-1, Math.min(1, ch1[i])) * 32767, true); }
    const bytes = new Uint8Array(ab); let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    window.__audioBuffer = buf; return btoa(s);
  }

  /* ---------------- interface ---------------- */
  window.TIMELINE = TIMELINE;
  window.FILM = { W, H, FPS, DURATION, FMT_ID, THEME_ID, RM, NUMBERS: { DAILY, DAYS_PER_YEAR, YEARS, LATE, YEAR_SUM, TOTAL, TOTAL_DAYS, LATE_TOTAL } };
  window.seek = (t) => { render(t); return true; };
  window.frameAt = (t) => { render(t); return canvas.toDataURL("image/png"); };
  window.renderAudio = renderAudio;
  window.TEXT_PAIRS = [
    ["ink on ground", C.ink, C.ground], ["ink on surface", C.ink, C.surface], ["muted on ground", C.muted, C.ground],
    ["muted on surface", C.muted, C.surface], ["accent on surface", C.accent, C.surface], ["accent on icon", C.accent, C.accentFill],
    ["label on cell", C.onAccent, C.accent], ["caption", C.capInk, C.capBg],
    ["bars vs ground (graphic, 3:1)", C.accent, C.ground], ["hollow bars vs ground (graphic, 3:1)", C.muted, C.ground],
  ];
  Promise.all([500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px Pretendard`, "가0₩")))
    .then(() => document.fonts.ready)
    .then(() => { render(0); window.__ready = true; window.dispatchEvent(new Event("film-ready")); });
})();
