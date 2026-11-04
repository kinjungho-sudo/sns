/* =========================================================================
   "왜 내 부탁엔 뻔한 답이 나올까?" — 60초 설명 영상
   -------------------------------------------------------------------------
   Render contract
   · window.seek(t) paints the frame at time t. Every frame is a pure function of t.
   · TIMELINE holds every beat, move, anchor, caption and sound cue.
   · No Math.random: the only randomness is the seeded noise in the audio bed.
   URL params: fmt=16x9|9x16|1x1  theme=paper|noir|blueprint  rm=1 (reduced motion)
               caps=0 (no burned captions)  export=1 (no playback loop)
   ========================================================================= */
(() => {
  const P = new URLSearchParams(location.search);
  const FMT_ID = P.get("fmt") || "16x9";
  const THEME_ID = P.get("theme") || "paper";
  const RM = P.get("rm") === "1";
  const CAPS = P.get("caps") !== "0";
  const DURATION = 60, FPS = 60;

  /* ---------------- tokens ---------------- */
  const THEMES = {
    // winner — warm paper ground, one teal accent (repo teal #17d0bb darkened for text contrast)
    paper: { ground: "#F4F1EA", surface: "#FFFDF8", ink: "#1E1D1A", muted: "#5E5A52", line: "#D6CFC2",
             accent: "#0B6B62", accentFill: "#DCEBE6", capBg: "#1E1D1A", capInk: "#FFFDF8" },
    // rejected — the repo's Teal Noir look
    noir: { ground: "#0A0B0B", surface: "#161918", ink: "#F4F6F5", muted: "#A3AAA8", line: "#2A2F2D",
            accent: "#17D0BB", accentFill: "#12322E", capBg: "#F4F6F5", capInk: "#0A0B0B" },
    // rejected — cool technical blueprint
    blueprint: { ground: "#EEF2F6", surface: "#FFFFFF", ink: "#14202E", muted: "#4A5868", line: "#C5D0DC",
                 accent: "#1F5FAD", accentFill: "#DCE7F5", capBg: "#14202E", capInk: "#FFFFFF" },
  };
  const C = THEMES[THEME_ID];
  const SANS = "Pretendard, sans-serif";
  const MONO = '"DejaVu Sans Mono", monospace';

  /* ---------------- formats (one grid per format: margin m, everything aligns to it) ---------------- */
  const FMTS = {
    "16x9": { W: 1920, H: 1080, m: 96,
      anchor: { y: 112, size: 66 }, content: { y0: 180, y1: 888 },
      cap: { cy: 970, size: 50, maxW: 1680 },
      zone: { x: 96, w: 500 }, chip: { w: 500, h: 132, gap: 30, label: 30, value: 42, flow: "stack" },
      frame: { x: 668, w: 1156 }, pushGap: 0,
      ui: { size: 50, lh: 64, pad: 26, gutter: 58, small: 30, head: 62 } },
    "9x16": { W: 1080, H: 1920, m: 72,
      anchor: { y: 196, size: 62 }, content: { y0: 296, y1: 1652 },
      cap: { cy: 1770, size: 44, maxW: 936 },
      zone: { x: 72, w: 936 }, chip: { w: 936, h: 112, gap: 22, label: 28, value: 42, flow: "stack" },
      frame: { x: 72, w: 936 }, pushGap: 96,
      ui: { size: 42, lh: 60, pad: 28, gutter: 50, small: 28, head: 58 } },
    "1x1": { W: 1080, H: 1080, m: 60,
      anchor: { y: 82, size: 50 }, content: { y0: 134, y1: 902 },
      cap: { cy: 986, size: 38, maxW: 960 },
      zone: { x: 60, w: 960 }, chip: { w: 304, h: 124, gap: 24, label: 24, value: 30, flow: "row" },
      frame: { x: 60, w: 960 }, pushGap: 70,
      ui: { size: 36, lh: 48, pad: 22, gutter: 42, small: 24, head: 46 } },
  };
  const F = FMTS[FMT_ID];
  const W = F.W, H = F.H;

  /* ---------------- the words ---------------- */
  const REQ = "납기 연장 요청 메일 써줘.";
  const CTX = [ // the three pieces of context: one name per thing, used everywhere
    { label: "관계", value: "3년 거래한 파트너", turn: "처음 거래하는 회사" },
    { label: "목적", value: "1주 연장 + 신뢰 유지" },
    { label: "톤", value: "정중히, 사과는 한 번만" },
  ];
  // reply A: the real answer to the bare request. b = which context piece the blank belongs to
  const REPLY_A = [
    [{ t: "[담당자명]", b: 0 }, { t: "님, 안녕하십니까." }],
    [{ t: "[사유]", b: 1 }, { t: "로 " }, { t: "[기간]", b: 1 }, { t: " 연장을 요청드립니다." }],
    [{ t: "불편을 드려 " }, { t: "대단히 죄송합니다.", b: 2 }],
  ];
  // reply B: the real answer once the three lines are in the window. h = which line shaped it
  const REPLY_B = [
    [{ t: "3년간 믿고 맡겨주셔서", h: 0 }, { t: " 감사합니다." }],
    [{ t: "납기를 " }, { t: "1주만 늦춰주실", h: 1 }, { t: " 수 있을까요?" }],
    [{ t: "죄송합니다.", h: 2 }, { t: " 끝까지 책임지겠습니다." }],
  ];
  const REPLY_B1_TURN = [{ t: "첫 거래를 맡겨주셔서", h: 0 }, { t: " 감사합니다." }];

  /* ---------------- TIMELINE: every beat, move, anchor, caption, cue ---------------- */
  const TIMELINE = {
    beats: [
      { id: "Q",  t0: 0,  t1: 6,  part: "Question" },
      { id: "M1", t0: 6,  t1: 10.5, part: "Model" },
      { id: "M2", t0: 10.5, t1: 15.5, part: "Model" },
      { id: "M3", t0: 15.5, t1: 21, part: "Model" },
      { id: "P1", t0: 21, t1: 27, part: "Proof" },
      { id: "P2", t0: 27, t1: 36, part: "Proof" },
      { id: "P3", t0: 36, t1: 45, part: "Proof" },
      { id: "T",  t0: 45, t1: 54, part: "Turn" },
      { id: "Y",  t0: 54, t1: 60, part: "Payoff" },
    ],
    camera: [ // focus rect key: "frame" | "wide"; move happens over [t, t+dur]
      { t: 0, key: "frame" }, { t: 6.0, dur: 1.0, key: "wide" },
      { t: 25.6, dur: 0.9, key: "frame" },
    ],
    moves: {
      replyA_type: [0.5, 0.55, 0.65],    // start of each reply-A line, 0.6 s each
      blanks_mark: 2.7,                  // dashed boxes on the blanks
      frame_name: 6.6,                   // accent outline + "AI가 읽는 창" legend
      zone_in: 10.6,
      chip_in: [10.9, 12.1, 13.3],
      chips_push: 15.8,                  // chips slide to the window edge and stop
      blank_links: [17.2, 18.3, 19.4],   // dashed link from each chip to its blank
      chip_land: [21.4, 22.9, 24.4],     // chip becomes a request line (0.9 s each)
      replyA_out: 27.1,
      replyB_type: [27.8, 29.0, 30.2],
      cause_links: [36.4, 38.9, 41.4],
      turn_swap: 46.6,
      turn_retype: 48.0,
      pay_reset: 54.0,
      pay_marks: 55.0,                   // blanks re-marked, now read against the empty slots
    },
    anchors: [
      { t0: 3.2, t1: 5.9, lines: ["왜 이렇게 뻔할까?"] },
      { t0: 7.2, t1: 10.4, lines: ["AI는 이 창만 읽는다"] },
      { t0: 10.8, t1: 15.4, lines: ["사정은 내 머릿속에"] },
      { t0: 16.6, t1: 20.9, lines: ["모르는 곳은 빈칸으로"] },
      { t0: 21.2, t1: 26.9, lines: ["사정을 창 안에 적는다"] },
      { t0: 27.4, t1: 35.9, lines: ["같은 AI, 다른 답"] },
      { t0: 36.2, t1: 44.9, lines: ["한 줄이 답의 한 부분을"] },
      { t0: 45.4, t1: 53.9, lines: ["관계만 바꾸면", "인사말이 바뀐다"], line2At: 49.6 },
      { t0: 55.2, t1: 60.5, lines: ["뻔한 답 = 빈칸", "다음 부탁엔 세 줄을 붙이세요"], line2At: 56.6 },
    ],
    captions: [
      { t0: 0.3, t1: 5.8, text: "짧게 부탁했더니, 누구에게 보내도 될 뻔한 메일이 나왔습니다." },
      { t0: 6.2, t1: 10.4, text: "AI는 이 창에 적힌 글만 읽고 답을 씁니다." },
      { t0: 10.7, t1: 15.4, text: "이 메일의 사정은 내 머릿속에만 있습니다. 누구에게, 왜, 어떤 말투로." },
      { t0: 15.6, t1: 20.9, text: "창 밖의 사정은 보이지 않으니, AI는 모르는 곳을 빈칸으로 두거나 무난한 말로 채웁니다." },
      { t0: 21.1, t1: 26.9, text: "그럼 사정을 세 줄로 적어, 같은 창 안에 넣어 봅니다." },
      { t0: 27.1, t1: 35.8, text: "같은 AI가 이번에는 이 관계와 목적, 말투에 맞춰 씁니다." },
      { t0: 36.1, t1: 44.8, text: "적어 넣은 한 줄이 답의 한 부분을 바꿉니다." },
      { t0: 45.1, t1: 53.8, text: "관계 한 줄만 바꾸면, 인사말부터 달라집니다." },
      { t0: 54.1, t1: 59.8, text: "뻔한 답은 대개 빈칸 때문입니다. 다음 부탁엔 관계·목적·톤, 세 줄을 붙이세요." },
    ],
    cues: [ // sound: only on actions that carry meaning
      { t: 10.9, kind: "pop" }, { t: 12.1, kind: "pop" }, { t: 13.3, kind: "pop" },
      { t: 16.5, kind: "thud" },
      { t: 17.2, kind: "tick" }, { t: 18.3, kind: "tick" }, { t: 19.4, kind: "tick" },
      { t: 22.2, kind: "tick" }, { t: 23.7, kind: "tick" }, { t: 25.2, kind: "tick" },
      { t: 27.1, kind: "swish" },
      { t: 31.0, kind: "motif" },              // same AI, different answer
      { t: 36.4, kind: "tick" }, { t: 38.9, kind: "tick" }, { t: 41.4, kind: "tick" },
      { t: 46.6, kind: "tick" }, { t: 48.0, kind: "swish" },
      { t: 49.4, kind: "motif" },              // one line changed, one part followed
      { t: 54.1, kind: "swish" },
      { t: 55.4, kind: "motif" },              // the opening image, read correctly
    ],
    bpm: 96,
  };

  /* ---------------- math ---------------- */
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  // custom settle: cubic-bezier(0.2, 0.0, 0.0, 1.0) — fast start, long quiet landing, never overshoots
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (u) => ((ax * u + bx) * u + cx) * u, sy = (u) => ((ay * u + by) * u + cy) * u;
    return (x) => { if (x <= 0) return 0; if (x >= 1) return 1;
      let lo = 0, hi = 1, u = x; for (let i = 0; i < 24; i++) { const v = sx(u); if (v < x) lo = u; else hi = u; u = (lo + hi) / 2; }
      return sy(u); };
  }
  const SETTLE = bezier(0.2, 0.0, 0.0, 1.0);
  const SOFT = bezier(0.4, 0.0, 0.2, 1.0);
  let T = 0; // current time
  const raw = (t0, dur) => clamp((T - t0) / dur);
  // position progress: eased, or a hard cut at the midpoint in reduced motion
  const mv = (t0, dur) => (RM ? (T >= t0 + dur * 0.5 ? 1 : 0) : SETTLE(raw(t0, dur)));
  // opacity progress: short linear fade either way (reduced motion keeps fades, drops travel)
  const fa = (t0, dur) => (RM ? clamp((T - (t0 + dur * 0.5) + 0.15) / 0.3) : SOFT(raw(t0, dur)));

  /* ---------------- canvas ---------------- */
  const canvas = document.getElementById("film");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const fitWarnings = new Set();
  window.__fitWarnings = fitWarnings;

  function font(size, weight = 500, mono = false) { return `${weight} ${size}px ${mono ? MONO : SANS}`; }
  function measure(str, size, weight = 500, mono = false) { ctx.font = font(size, weight, mono); ctx.letterSpacing = "0px"; return ctx.measureText(str).width; }
  function text(str, x, y, o = {}) {
    let size = o.size || 40; const weight = o.weight || 500;
    if (o.maxW) { const w = measure(str, size, weight, o.mono); if (w > o.maxW) { size *= o.maxW / w; fitWarnings.add(`${FMT_ID}: "${str}" shrunk to ${size.toFixed(1)}px`); } }
    ctx.save(); ctx.font = font(size, weight, o.mono); ctx.letterSpacing = "0px";
    ctx.fillStyle = o.color || C.ink; ctx.textAlign = o.align || "left"; ctx.textBaseline = "middle";
    ctx.globalAlpha *= o.alpha ?? 1; ctx.fillText(str, x, y); ctx.restore();
  }
  function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function dashedBox(x, y, w, h, r, color, alpha, lw = 2.5) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.setLineDash([lw * 3, lw * 2.4]); ctx.lineWidth = lw; ctx.strokeStyle = color;
    rrect(x, y, w, h, r); ctx.stroke(); ctx.restore();
  }
  function curve(x0, y0, x1, y1, color, k, o = {}) { // draws the first k (0..1) of a smooth S link
    if (k <= 0) return;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.strokeStyle = color; ctx.lineWidth = o.lw || 3; ctx.lineCap = "round";
    if (o.dash) ctx.setLineDash(o.dash);
    const horiz = o.horiz ?? Math.abs(x1 - x0) > Math.abs(y1 - y0);
    const c0 = horiz ? [lerp(x0, x1, 0.5), y0] : [x0, lerp(y0, y1, 0.5)], c1 = horiz ? [lerp(x0, x1, 0.5), y1] : [x1, lerp(y0, y1, 0.5)];
    const pt = (u) => { const a = 1 - u; return [a*a*a*x0 + 3*a*a*u*c0[0] + 3*a*u*u*c1[0] + u*u*u*x1, a*a*a*y0 + 3*a*a*u*c0[1] + 3*a*u*u*c1[1] + u*u*u*y1]; };
    ctx.beginPath(); const n = 48;
    for (let i = 0; i <= n * k; i++) { const [px, py] = pt(i / n); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();
    if (k >= 1 && o.dot) { ctx.beginPath(); ctx.arc(x1, y1, (o.lw || 3) * 1.8, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
    ctx.restore();
  }
  function elbow(pts, color, k, o = {}) { // draws the first k of a polyline
    if (k <= 0) return;
    const lens = pts.slice(1).map((p, j) => Math.hypot(p[0] - pts[j][0], p[1] - pts[j][1]));
    let left = lens.reduce((a, b) => a + b, 0) * k;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.strokeStyle = color; ctx.lineWidth = o.lw || 3; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath(); ctx.moveTo(...pts[0]);
    for (let j = 0; j < lens.length && left > 0; j++) {
      const f = clamp(left / (lens[j] || 1)); ctx.lineTo(lerp(pts[j][0], pts[j + 1][0], f), lerp(pts[j][1], pts[j + 1][1], f)); left -= lens[j];
    }
    ctx.stroke(); ctx.restore();
  }
  function wrap(str, maxW, size, weight) {
    const words = str.split(" "), out = []; let cur = "";
    for (const w of words) {
      const next = cur ? cur + " " + w : w;
      if (measure(next, size, weight) <= maxW) cur = next;
      else { if (cur) out.push(cur); cur = w; }
    }
    if (cur) out.push(cur);
    return out;
  }

  /* ---------------- layout (world coordinates) ---------------- */
  const U = F.ui, FR = F.frame;
  // the window is exactly as tall as its fullest state (4 request lines + 3 reply lines)
  FR.h = U.head + U.pad * 0.8 + (U.pad * 2 + 4 * U.lh) + U.pad * 1.1 + U.pad * 0.6 + 3 * U.lh + U.pad * 1.2;
  const zoneH = F.chip.label * 1.6 + (F.chip.flow === "stack" ? 3 * F.chip.h + 2 * F.chip.gap : F.chip.h);
  const midY = (F.content.y0 + F.content.y1) / 2;
  if (W > H) { FR.y = midY - FR.h / 2; F.zone.y = midY - zoneH / 2; }
  else { const top = midY - (zoneH + F.pushGap + FR.h) / 2; F.zone.y = top; FR.y = top + zoneH + F.pushGap; }
  const inner = { x: FR.x + U.pad, w: FR.w - U.pad * 2 };
  const promptTop = FR.y + U.head + U.pad * 0.8;
  const promptH = (n) => U.pad * 2 + n * U.lh;
  const promptLineY = (i) => promptTop + U.pad + U.lh * (i + 0.5);
  const textX = inner.x + U.gutter + U.pad * 0.6; // request text starts after the line-number gutter
  const replyTop = (n) => promptTop + promptH(n) + U.pad * 1.1;
  const replyLineY = (n, i) => replyTop(n) + U.pad * 0.6 + U.lh * (i + 0.5);
  const replyX = inner.x + U.pad * 0.9;

  function chipRect(i) {
    const c = F.chip, z = F.zone, top = z.y + F.chip.label * 1.6;
    if (c.flow === "stack") return { x: z.x, y: top + i * (c.h + c.gap), w: c.w, h: c.h };
    return { x: z.x + i * (c.w + c.gap), y: top, w: c.w, h: c.h };
  }
  // where the chips wait after being pushed against the window edge
  function chipPushed(i) {
    const r = chipRect(i);
    if (F.W > F.H) return { ...r, x: FR.x - r.w - 22 };          // row layout: push right
    const lastBottom = chipRect(2).y + chipRect(2).h;              // column layouts: push down, stop above the legend
    return { ...r, y: r.y + (FR.y - 8 - U.small * 0.9 - 14 - lastBottom) };
  }

  /* ---------------- camera ---------------- */
  const CONTENT = { x: 0, y: F.content.y0, w: W, h: F.content.y1 - F.content.y0 };
  const FOCUS = {
    wide: CONTENT,
    frame: { x: FR.x - F.m * 0.5, y: FR.y - 30, w: FR.w + F.m, h: FR.h + 60 },
  };
  function cameraRect() {
    if (RM) return FOCUS.wide;
    let cur = FOCUS[TIMELINE.camera[0].key];
    for (const k of TIMELINE.camera.slice(1)) {
      if (T < k.t) break;
      const to = FOCUS[k.key], e = SETTLE(clamp((T - k.t) / k.dur));
      cur = { x: lerp(cur.x, to.x, e), y: lerp(cur.y, to.y, e), w: lerp(cur.w, to.w, e), h: lerp(cur.h, to.h, e) };
    }
    return cur;
  }
  function applyCamera() {
    const r = cameraRect();
    const s = Math.min(CONTENT.w / r.w, CONTENT.h / r.h);
    ctx.translate(CONTENT.x + CONTENT.w / 2, CONTENT.y + CONTENT.h / 2);
    ctx.scale(s, s);
    ctx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
  }

  /* ---------------- pieces ---------------- */
  const M = TIMELINE.moves;

  function drawWindow() {
    // the chat window: real UI, always present
    ctx.save();
    rrect(FR.x, FR.y, FR.w, FR.h, 22); ctx.fillStyle = C.surface; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = C.line; ctx.stroke();
    ctx.fillStyle = C.line; ctx.fillRect(FR.x, FR.y + U.head, FR.w, 2);
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(FR.x + 30 + i * 22, FR.y + U.head / 2, 6, 0, Math.PI * 2); ctx.fillStyle = C.line; ctx.fill(); }
    text("AI 어시스턴트", FR.x + FR.w / 2, FR.y + U.head / 2, { size: U.small, weight: 600, color: C.muted, align: "center" });
    ctx.restore();
    // M1: the window gets its name — accent outline drawn around, legend on the top edge
    const k = mv(M.frame_name, 0.9);
    if (k > 0) {
      ctx.save(); ctx.strokeStyle = C.accent; ctx.lineWidth = 5;
      const per = 2 * (FR.w + FR.h);
      ctx.setLineDash([per * k, per]);
      rrect(FR.x - 8, FR.y - 8, FR.w + 16, FR.h + 16, 28); ctx.stroke(); ctx.restore();
      const la = fa(M.frame_name + 0.5, 0.4);
      const lw = measure("AI가 읽는 창", U.small, 700) + 28;
      ctx.save(); ctx.globalAlpha = la; ctx.fillStyle = C.ground; ctx.fillRect(FR.x + 26, FR.y - 8 - U.small * 0.7, lw, U.small * 1.4); ctx.restore();
      text("AI가 읽는 창", FR.x + 40, FR.y - 8, { size: U.small, weight: 700, color: C.accent, alpha: la });
    }
  }

  // how many request lines are in the window right now (fractional while one lands)
  function linesInPrompt() {
    if (T >= M.pay_reset) return 4;
    let n = 1;
    for (const t0 of M.chip_land) n += mv(t0, 0.9);
    return n;
  }

  function drawPrompt() {
    const n = linesInPrompt();
    const h = promptH(n);
    rrect(inner.x, promptTop, inner.w, h, 16); ctx.fillStyle = C.ground; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = C.line; ctx.stroke();
    // gutter
    ctx.fillStyle = C.line; ctx.fillRect(inner.x + U.gutter, promptTop + 10, 2, h - 20);
    const shown = Math.min(4, Math.ceil(n - 0.001));
    for (let i = 0; i < shown; i++) {
      const a = i === 0 ? 1 : clamp(n - i);
      text(String(i + 1), inner.x + U.gutter / 2, promptLineY(i), { size: U.small, mono: true, color: C.muted, align: "center", alpha: a });
    }
    text(REQ, textX, promptLineY(0), { size: U.size, weight: 600, maxW: inner.w - U.gutter - U.pad * 1.5 });
  }

  // a context line inside the request card: "관계: 3년 거래한 파트너"
  function contextLineParts(i, valueOverride) {
    const c = CTX[i], lab = c.label + ":", val = valueOverride ?? c.value;
    return { lab, val, labW: measure(lab + " ", U.size, 700) };
  }
  function drawContextLine(i, alpha, valueAlpha = 1, valueOverride, valueDy = 0) {
    const { lab, val, labW } = contextLineParts(i, valueOverride);
    const y = promptLineY(i + 1);
    text(lab, textX, y, { size: U.size, weight: 700, color: C.accent, alpha });
    text(val, textX + labW, y + valueDy, { size: U.size, weight: 500, alpha: alpha * valueAlpha, maxW: inner.w - U.gutter - U.pad * 1.5 - labW });
  }

  function drawChip(r, i, alpha, boxAlpha = 1) {
    if (alpha <= 0) return;
    const c = F.chip;
    ctx.save(); ctx.globalAlpha *= alpha * boxAlpha;
    rrect(r.x, r.y, r.w, r.h, 18); ctx.fillStyle = C.accentFill; ctx.fill();
    ctx.restore();
    text(CTX[i].label, r.x + 20, r.y + r.h * 0.3, { size: c.label, weight: 700, color: C.accent, alpha });
    text(CTX[i].value, r.x + 20, r.y + r.h * 0.66, { size: c.value, weight: 600, alpha, maxW: r.w - 30 });
  }

  // chips: appear (M2) → pushed to the window edge (M3) → become request lines (P1)
  function drawChipsAndLanding() {
    for (let i = 0; i < 3; i++) {
      const appear = fa(M.chip_in[i], 0.6);
      if (appear <= 0) continue;
      const home = chipRect(i), edge = chipPushed(i);
      const rise = RM ? 0 : (1 - SETTLE(raw(M.chip_in[i], 0.6))) * 24;
      const pk = mv(M.chips_push, 0.8);
      const r = { ...home, x: lerp(home.x, edge.x, pk), y: lerp(home.y, edge.y, pk) + rise };
      const land = M.chip_land[i];
      if (T < land) { drawChip(r, i, appear); continue; }
      if (T >= M.pay_reset + 0.6) continue; // in the payoff the lines become empty slots instead
      // morph: chip label/value travel to their places in the request line
      const k = mv(land, 0.9);
      const { labW } = contextLineParts(i);
      const y = promptLineY(i + 1);
      if (RM) {
        const f = fa(land, 0.9);
        drawChip(r, i, 1 - f);
        if (T < M.pay_reset && !(i === 0 && T >= M.turn_swap)) drawContextLine(i, f);
        continue;
      }
      if (k < 1) {
        ctx.save(); ctx.globalAlpha = 1 - k; rrect(lerp(r.x, textX - 14, k), lerp(r.y, y - U.lh / 2, k), lerp(r.w, inner.w - U.gutter - U.pad, k), lerp(r.h, U.lh, k), 18);
        ctx.fillStyle = C.accentFill; ctx.fill(); ctx.restore();
        const lx = lerp(r.x + 20, textX, k), ly = lerp(r.y + r.h * 0.3, y, k);
        const vx = lerp(r.x + 20, textX + labW, k), vy = lerp(r.y + r.h * 0.66, y, k);
        text(CTX[i].label + (k > 0.5 ? ":" : ""), lx, ly, { size: lerp(F.chip.label, U.size, k), weight: 700, color: C.accent });
        text(CTX[i].value, vx, vy, { size: lerp(F.chip.value, U.size, k), weight: lerp(600, 500, k) });
      } else if (T < M.turn_swap || i !== 0) {
        if (T < M.pay_reset) drawContextLine(i, 1);
      }
    }
  }

  // reply segments, with blank boxes (reply A) or cause highlights (reply B)
  function drawReplyLine(segs, x, y, o = {}) {
    let cx = x; const boxes = [];
    const full = segs.map((s) => s.t).join("");
    const reveal = o.reveal ?? 1; // fraction of characters shown (typing)
    let budget = Math.round([...full].length * reveal);
    for (const s of segs) {
      const chars = [...s.t], show = chars.slice(0, Math.max(0, Math.min(chars.length, budget))).join("");
      budget -= chars.length;
      const w = measure(s.t, U.size, 500);
      if (show) text(show, cx, y, { size: U.size, weight: s.h !== undefined && o.hi?.[s.h] ? 600 : 500,
        color: s.h !== undefined && o.hi?.[s.h] ? C.accent : C.ink, alpha: o.alpha ?? 1 });
      boxes.push({ ...s, x: cx, w, y });
      cx += w;
    }
    return boxes;
  }

  function replyState() {
    // which reply is on screen and how far it has typed
    if (T >= M.pay_reset) return { kind: "A", alpha: fa(M.pay_reset + 0.3, 0.6), reveal: [1, 1, 1] };
    if (T < M.replyA_out + 0.5) {
      const reveal = M.replyA_type.map((t0, i) => (RM ? fa(t0 + i * 0.6, 0.6) : clamp((T - (t0 + i * 0.6)) / 0.6)));
      return { kind: "A", alpha: 1 - fa(M.replyA_out, 0.5), reveal };
    }
    const reveal = M.replyB_type.map((t0) => (RM ? fa(t0, 0.9) : clamp((T - t0) / 0.9)));
    return { kind: "B", alpha: 1, reveal };
  }

  function drawReply() {
    const n = linesInPrompt();
    const rs = replyState();
    const top = replyTop(n);
    // the reply rule: a quiet bar marks "AI의 답"
    ctx.fillStyle = C.line; ctx.fillRect(inner.x, top + 4, 4, U.lh * 3 + U.pad * 0.6);
    const all = [];
    if (rs.kind === "A") {
      const markA = fa(M.blanks_mark, 0.5);
      const payMark = T >= M.pay_reset ? fa(M.pay_marks, 0.5) : 1;
      REPLY_A.forEach((segs, i) => {
        const b = drawReplyLine(segs, replyX, replyLineY(n, i), { reveal: rs.reveal[i], alpha: rs.alpha });
        for (const s of b) if (s.b !== undefined) {
          const visible = T < M.replyA_out + 0.5 ? markA * rs.alpha : payMark * rs.alpha;
          dashedBox(s.x - 6, s.y - U.size * 0.62, s.w + 12, U.size * 1.24, 8, C.muted, visible);
          all.push(s);
        }
      });
    } else {
      const hiOn = M.cause_links.map((t0) => T >= t0);
      REPLY_B.forEach((segs, i) => {
        let line = segs, reveal = rs.reveal[i];
        if (i === 0 && T >= M.turn_retype) { line = REPLY_B1_TURN; reveal = RM ? fa(M.turn_retype, 1.0) : clamp((T - M.turn_retype) / 1.0); }
        else if (i === 0 && T >= M.turn_swap + 0.2) { // old greeting erases before the retype
          reveal = RM ? 1 - fa(M.turn_swap + 0.2, 1.2) : 1 - clamp((T - (M.turn_swap + 0.2)) / 1.2);
        }
        const b = drawReplyLine(line, replyX, replyLineY(n, i), { reveal, hi: hiOn });
        for (const s of b) if (s.h !== undefined) all.push(s);
      });
    }
    return all;
  }

  // M3: dashed links from each waiting chip to the blank it caused
  function drawBlankLinks(blanks) {
    if (T < M.blank_links[0] || T >= M.chip_land[0] + 0.3) return;
    const out = fa(M.chip_land[0] - 0.4, 0.5);
    for (let i = 0; i < 3; i++) {
      const k = mv(M.blank_links[i], 0.7);
      if (k <= 0) continue;
      const r = chipPushed(i);
      const target = blanks.find((b) => b.b === i);
      if (!target) continue;
      const focus = i === 2 || T < M.blank_links[i + 1] ? 1 : 0.4; // one focal link at a time
      const row = F.W > F.H, kk = RM ? (k > 0 ? 1 : 0) : k, alpha = focus * (1 - out);
      if (!row && F.chip.flow === "stack") {
        const x0 = r.x + r.w, y0 = r.y + r.h / 2, x1 = target.x + target.w + 6, y1 = target.y;
        const mx = W - F.m * 0.45 - i * 9;
        elbow([[x0, y0], [mx, y0], [mx, y1], [x1, y1]], C.muted, kk, { dash: [10, 8], lw: 3, alpha });
        continue;
      }
      const x0 = row ? r.x + r.w : r.x + r.w / 2, y0 = row ? r.y + r.h / 2 : r.y + r.h;
      const x1 = row ? target.x - 6 : target.x + target.w / 2, y1 = row ? target.y : target.y - U.size * 0.62;
      curve(x0, y0, x1, y1, C.muted, kk, { dash: [10, 8], lw: 3, alpha, dot: true, horiz: row });
    }
  }

  // P3/T: solid accent links from each request line to the part of the reply it shaped
  function drawCauseLinks(segs) {
    if (T < M.cause_links[0] || T >= M.pay_reset) return;
    for (let i = 0; i < 3; i++) {
      const t0 = M.cause_links[i];
      const k = mv(t0, 0.8);
      if (k <= 0) continue;
      const seg = segs.find((s) => s.h === i);
      if (!seg) continue;
      let focus = i === 2 || T < M.cause_links[i + 1] ? 1 : 0.35;
      if (T >= 45) focus = i === 0 ? 1 : 0.2;           // the turn only cares about 관계
      const y0 = promptLineY(i + 1);
      const x0 = inner.x;
      const x1 = seg.x - 4, y1 = seg.y;
      // underline under the shaped words (not color alone)
      ctx.save(); ctx.globalAlpha = focus * k; ctx.fillStyle = C.accent;
      ctx.fillRect(seg.x, seg.y + U.size * 0.62, seg.w * k, 4); ctx.restore();
      // the link leaves the line's label on the left and enters the reply on the left
      const lx = inner.x - 8 - (2 - i) * 6;
      ctx.save(); ctx.globalAlpha = focus; ctx.strokeStyle = C.accent; ctx.lineWidth = 3; ctx.lineCap = "round";
      const pts = [[x0, y0], [lx, y0], [lx, y1], [x1, y1]];
      const lens = [x0 - lx, Math.abs(y1 - y0), x1 - lx], total = lens.reduce((a, b) => a + b, 0);
      let left = total * (RM ? (k > 0 ? 1 : 0) : k);
      ctx.beginPath(); ctx.moveTo(...pts[0]);
      for (let j = 0; j < 3; j++) {
        const [ax, ay] = pts[j], [bx, by] = pts[j + 1], L = lens[j], f = clamp(left / L);
        ctx.lineTo(lerp(ax, bx, f), lerp(ay, by, f)); left -= L; if (left <= 0) break;
      }
      ctx.stroke();
      ctx.beginPath(); ctx.arc(x0, y0, 5, 0, Math.PI * 2); ctx.fillStyle = C.accent; ctx.fill(); // where the cause starts
      ctx.restore();
    }
  }

  // T: the 관계 value swaps — the old words leave upward, the new ones arrive from below
  function drawTurnLine() {
    if (T < M.turn_swap || T >= M.pay_reset) return;
    const k = mv(M.turn_swap, 0.8);
    const lift = U.lh * 0.5;
    ctx.save();
    const y = promptLineY(1);
    ctx.beginPath(); ctx.rect(textX - 10, y - U.lh / 2, inner.w, U.lh); ctx.clip();
    text(CTX[0].label + ":", textX, y, { size: U.size, weight: 700, color: C.accent });
    const { labW } = contextLineParts(0);
    if (RM) {
      const f = fa(M.turn_swap, 0.8);
      text(CTX[0].value, textX + labW, y, { size: U.size, alpha: 1 - f });
      text(CTX[0].turn, textX + labW, y, { size: U.size, weight: 600, alpha: f });
    } else {
      text(CTX[0].value, textX + labW, y - lift * k, { size: U.size, alpha: 1 - k });
      text(CTX[0].turn, textX + labW, y + lift * (1 - k), { size: U.size, weight: 600, alpha: k });
    }
    ctx.restore();
  }

  // Y: the three request lines become empty slots — the opening image, read correctly
  function drawPayoffSlots() {
    if (T < M.pay_reset) return;
    const k = fa(M.pay_reset, 0.8);
    for (let i = 0; i < 3; i++) {
      const y = promptLineY(i + 1);
      const { labW } = contextLineParts(i);
      text(CTX[i].label + ":", textX, y, { size: U.size, weight: 700, color: C.accent });
      // the old value fades as the slot appears
      text(i === 0 ? CTX[0].turn : CTX[i].value, textX + labW, y, { size: U.size, alpha: 1 - k });
      const sw = Math.min(inner.w - U.gutter - U.pad * 2 - labW, U.size * 6.5);
      dashedBox(textX + labW, y - U.size * 0.6, sw, U.size * 1.2, 8, C.muted, k);
    }
  }
  function drawZoneLabel() {
    const a = fa(M.zone_in, 0.5) * (1 - fa(M.chips_push, 0.4));
    text("내 머릿속", F.zone.x, F.zone.y, { size: F.chip.label, weight: 700, color: C.muted, alpha: a });
  }

  /* ---------------- screen-space layers ---------------- */
  function drawAnchor() {
    for (const a of TIMELINE.anchors) {
      if (T < a.t0 - 0.01 || T > a.t1 + 0.4) continue;
      const inK = fa(a.t0, 0.45), outK = T > a.t1 ? fa(a.t1, 0.35) : 0;
      const rise = RM ? 0 : (1 - SETTLE(raw(a.t0, 0.45))) * 14;
      const alpha = inK * (1 - outK);
      const size = F.anchor.size;
      const twoLine = a.lines.length > 1;
      const y1 = F.anchor.y - (twoLine ? size * 0.62 : 0);
      text(a.lines[0], F.m, y1 + rise, { size, weight: 800, alpha, maxW: W - F.m * 2 });
      if (twoLine) {
        const k2 = fa(a.line2At, 0.45) * (1 - outK);
        const r2 = RM ? 0 : (1 - SETTLE(raw(a.line2At, 0.45))) * 14;
        text(a.lines[1], F.m, y1 + size * 1.24 + r2, { size: size * 0.86, weight: 700, color: C.accent, alpha: k2, maxW: W - F.m * 2 });
      }
    }
  }
  function drawCaption() {
    if (!CAPS) return;
    for (const c of TIMELINE.captions) {
      if (T < c.t0 || T > c.t1) continue;
      const a = Math.min(clamp((T - c.t0) / 0.15), clamp((c.t1 - T) / 0.15));
      const size = F.cap.size;
      const lines = wrap(c.text, F.cap.maxW - 48, size, 500).slice(0, 2);
      const lh = size * 1.36;
      const w = Math.max(...lines.map((l) => measure(l, size, 500))) + 48;
      const h = lines.length * lh + 24;
      const cy = F.cap.cy - (lines.length - 1) * lh * 0.5;
      ctx.save(); ctx.globalAlpha = a; rrect(W / 2 - w / 2, F.cap.cy - h / 2, w, h, 14); ctx.fillStyle = C.capBg; ctx.fill(); ctx.restore();
      lines.forEach((l, i) => text(l, W / 2, cy + i * lh, { size, weight: 500, color: C.capInk, align: "center", alpha: a }));
    }
  }
  function drawBrand() {
    const a = fa(56.6, 0.6);
    text("실전 AI 활용 가이드", W - F.m, F.anchor.y, { size: F.ui.small, weight: 600, color: C.muted, align: "right", alpha: a });
  }

  /* ---------------- frame ---------------- */
  function render(t) {
    T = clamp(t, 0, DURATION);
    ctx.save();
    ctx.fillStyle = C.ground; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, F.content.y0 - 40, W, F.content.y1 - F.content.y0 + 80); ctx.clip();
    applyCamera();
    drawZoneLabel();
    drawWindow();
    drawPrompt();
    // request lines that have already landed (drawn by the chip morph while landing)
    const blanks = drawReply();
    drawChipsAndLanding();
    drawTurnLine();
    drawPayoffSlots();
    drawBlankLinks(blanks);
    drawCauseLinks(blanks);
    ctx.restore();
    drawAnchor();
    drawBrand();
    drawCaption();
    ctx.restore();
  }

  /* ---------------- sound: tempo-locked procedural bed + motif + UI cues ---------------- */
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  async function renderAudio() {
    const SR = 48000, ac = new OfflineAudioContext(2, SR * DURATION, SR);
    const master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
    master.gain.setValueAtTime(0.8, DURATION - 1.2); master.gain.linearRampToValueAtTime(0.0001, DURATION);
    const beat = 60 / TIMELINE.bpm, bar = beat * 4;
    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    // bed level follows the arc: sparse question, fuller proof, quiet turn, resolved payoff
    const bed = ac.createGain(); bed.connect(master);
    const lv = [[0, 0.5], [6, 0.7], [21, 0.9], [45, 0.6], [54, 0.85], [DURATION, 0.85]];
    bed.gain.setValueAtTime(lv[0][1], 0); for (const [tt, v] of lv.slice(1)) bed.gain.linearRampToValueAtTime(v, tt);
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1100; lp.Q.value = 0.4; lp.connect(bed);
    // pad: D – Bm – G – A, two bars each (5 s at 96 bpm)
    const chords = [[50, 54, 57], [47, 50, 54], [43, 47, 50], [45, 49, 52]];
    for (let b = 0; b * bar * 2 < DURATION; b++) {
      const t0 = b * bar * 2, ch = chords[b % 4];
      for (const n of ch) for (const det of [-4, 4]) {
        const o = ac.createOscillator(); o.type = "triangle"; o.frequency.value = hz(n + 12); o.detune.value = det;
        const g = ac.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.022, t0 + 1.2);
        g.gain.setValueAtTime(0.022, t0 + bar * 2 - 0.6); g.gain.linearRampToValueAtTime(0, t0 + bar * 2 + 0.4);
        o.connect(g).connect(lp); o.start(t0); o.stop(Math.min(DURATION, t0 + bar * 2 + 0.5));
      }
      // bass root on each bar
      for (let k = 0; k < 2; k++) {
        const tb = t0 + k * bar; if (tb >= DURATION) break;
        const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = hz(ch[0] - 12);
        const g = ac.createGain(); g.gain.setValueAtTime(0, tb); g.gain.linearRampToValueAtTime(0.09, tb + 0.05); g.gain.exponentialRampToValueAtTime(0.0008, tb + bar * 0.95);
        o.connect(g).connect(bed); o.start(tb); o.stop(tb + bar);
      }
    }
    // soft pulse on beats 2 and 4 (seeded noise, band-passed) — keeps time without a drum kit
    const nb = ac.createBuffer(1, SR * 0.08, SR), nd = nb.getChannelData(0), r = rng(7);
    for (let i = 0; i < nd.length; i++) nd[i] = (r() * 2 - 1) * Math.pow(1 - i / nd.length, 3);
    for (let tb = beat; tb < DURATION - 1; tb += beat * 2) {
      if (tb < 6) continue;
      const s = ac.createBufferSource(); s.buffer = nb;
      const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 5200; bp.Q.value = 0.8;
      const g = ac.createGain(); g.gain.value = 0.05;
      s.connect(bp).connect(g).connect(bed); s.start(tb);
    }
    // motif: A4 – D5 – F#5, returns on the key idea
    const motif = (t0) => [69, 74, 78].forEach((n, i) => {
      const tt = t0 + i * beat * 0.5;
      for (const [type, mul, amp] of [["sine", 1, 0.11], ["triangle", 2, 0.015]]) {
        const o = ac.createOscillator(); o.type = type; o.frequency.value = hz(n) * mul;
        const g = ac.createGain(); g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(amp, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, tt + 1.4);
        o.connect(g).connect(master); o.start(tt); o.stop(tt + 1.5);
      }
    });
    const tick = (tt, f = 1760, amp = 0.12, dur = 0.06) => {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = f;
      const g = ac.createGain(); g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(amp, tt + 0.003); g.gain.exponentialRampToValueAtTime(0.0005, tt + dur);
      o.connect(g).connect(master); o.start(tt); o.stop(tt + dur + 0.02);
    };
    const pop = (tt) => { const o = ac.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(660, tt); o.frequency.exponentialRampToValueAtTime(990, tt + 0.07);
      const g = ac.createGain(); g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.1, tt + 0.008); g.gain.exponentialRampToValueAtTime(0.0005, tt + 0.16);
      o.connect(g).connect(master); o.start(tt); o.stop(tt + 0.2); };
    const thud = (tt) => { const o = ac.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(140, tt); o.frequency.exponentialRampToValueAtTime(70, tt + 0.18);
      const g = ac.createGain(); g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.22, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, tt + 0.3);
      o.connect(g).connect(master); o.start(tt); o.stop(tt + 0.35); };
    const swb = ac.createBuffer(1, SR * 0.6, SR), swd = swb.getChannelData(0), r2 = rng(11);
    for (let i = 0; i < swd.length; i++) { const u = i / swd.length; swd[i] = (r2() * 2 - 1) * Math.sin(Math.PI * u) ** 2; }
    const swish = (tt) => { const s = ac.createBufferSource(); s.buffer = swb;
      const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2; bp.frequency.setValueAtTime(600, tt); bp.frequency.exponentialRampToValueAtTime(3200, tt + 0.55);
      const lp2 = ac.createBiquadFilter(); lp2.type = "lowpass"; lp2.frequency.value = 3800;
      const g = ac.createGain(); g.gain.value = 0.07; s.connect(bp).connect(lp2).connect(g).connect(master); s.start(tt); };
    for (const c of TIMELINE.cues) {
      if (c.kind === "motif") motif(c.t); else if (c.kind === "tick") tick(c.t); else if (c.kind === "pop") pop(c.t);
      else if (c.kind === "thud") thud(c.t); else if (c.kind === "swish") swish(c.t);
    }
    const buf = await ac.startRendering();
    // 16-bit PCM WAV, base64
    const ch0 = buf.getChannelData(0), ch1 = buf.getChannelData(1), n = ch0.length;
    const ab = new ArrayBuffer(44 + n * 4), dv = new DataView(ab);
    const wstr = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    wstr(0, "RIFF"); dv.setUint32(4, 36 + n * 4, true); wstr(8, "WAVE"); wstr(12, "fmt "); dv.setUint32(16, 16, true);
    dv.setUint16(20, 1, true); dv.setUint16(22, 2, true); dv.setUint32(24, SR, true); dv.setUint32(28, SR * 4, true);
    dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); wstr(36, "data"); dv.setUint32(40, n * 4, true);
    for (let i = 0, o = 44; i < n; i++, o += 4) {
      dv.setInt16(o, Math.max(-1, Math.min(1, ch0[i])) * 32767, true); dv.setInt16(o + 2, Math.max(-1, Math.min(1, ch1[i])) * 32767, true);
    }
    const bytes = new Uint8Array(ab); let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    window.__audioBuffer = buf;
    return btoa(s);
  }

  /* ---------------- interface ---------------- */
  window.TIMELINE = TIMELINE;
  window.FILM = { W, H, FPS, DURATION, FMT_ID, THEME_ID, RM };
  window.seek = (t) => { render(t); return true; };
  window.frameAt = (t) => { render(t); return canvas.toDataURL("image/png"); };
  window.renderAudio = renderAudio;
  // contrast pairs actually used for text, for the accessibility check
  window.TEXT_PAIRS = [
    ["ink on ground", C.ink, C.ground], ["ink on surface", C.ink, C.surface], ["muted on surface", C.muted, C.surface],
    ["muted on ground", C.muted, C.ground], ["accent on ground", C.accent, C.ground], ["accent on surface", C.accent, C.surface],
    ["accent on chip", C.accent, C.accentFill], ["ink on chip", C.ink, C.accentFill], ["caption", C.capInk, C.capBg],
  ];

  Promise.all([400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px Pretendard`, "가Ag")))
    .then(() => document.fonts.ready)
    .then(() => { render(0); window.__ready = true; window.dispatchEvent(new Event("film-ready")); });
})();
