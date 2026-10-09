/* =========================================================================
   쇼츠 쇼릴 — "실전 AI 활용 가이드" 40초 모션그래픽 (1080×1920, 9:16)
   디자인: Teal Noir  ·  톤: 단언체   (규칙은 DESIGN.md 참고)
   -------------------------------------------------------------------------
   영상 생성 AI·외부 API 없이, 모든 프레임을 <canvas> 에 코드로 그립니다.
   모든 애니메이션은 시간 t(초)의 순수 함수라서 어느 프레임이든 재현 가능하며,
   export-reel.mjs 가 프레임을 하나씩 뽑아 ffmpeg 로 MP4 를 만듭니다.

   구조 (레퍼런스 쇼츠와 같은 리듬):
     S0 훅(빠른 컷)  → S1 터미널  → S2 키네틱 타이포 + 바우하우스 그리드
     → S3 3D 파티클 → S4 대시보드 → S5 터널 + 글리치 텍스트 → S6 타이틀
   내용·톤만 바꾸려면 아래 COPY 만 수정하면 됩니다.
   ========================================================================= */
(() => {
  const W = 1080, H = 1920;
  const FPS = 30, DURATION = 40;

  /* ---- 디자인 토큰 (styles.css 의 :root 와 동일) ---- */
  const C = {
    bg: "#0a0b0b", bg2: "#0d0f0f", accent: "#17d0bb", dim: "#0f7d72",
    ink: "#f4f6f5", soft: "#d6dad9", muted: "#8b9290", muted2: "#5f6664",
    card: "#161918", card2: "#1b1f1e", line: "#2a2f2d", paper: "#ece9e2",
  };
  const SANS = "Pretendard, sans-serif";
  const MONO = '"DejaVu Sans Mono", "Liberation Mono", Pretendard, monospace';

  /* ---- 카피 (여기만 바꾸면 "우리 것"이 됩니다) ---- */
  const COPY = {
    brand: "실전 AI 활용 가이드", year: "2026",
    hook: [
      { dur: 0.9, bg: "bg", lines: ["AI한테", "시키는 건"] },
      { dur: 0.8, bg: "accent", lines: ["다들", "합니다."] },
      { dur: 0.9, bg: "paper", lines: ["문제는"] },
      { dur: 1.2, bg: "bg", lines: ["뭘,", "어떻게", "시키느냐."], hi: 1 },
      { dur: 0.9, bg: "bg", lines: ["10편 · 50장"], small: true },
      { dur: 0.9, bg: "accent", lines: ["전부", "코드로."] },
    ],
    cmd: "> ai-guide --render series_2026",
    topics: ["영어 이메일", "회의록 정리", "보고서 초안", "엑셀 · 데이터", "자기소개서",
             "거절의 기술", "협상 리허설", "악마의 변호인", "눈높이 번역기", "감정 쿨다운"],
    done: "▶ 10 topics · 50 slides · 1 html file",
    pairs: [["번역하지 말고", "설명하라"], ["받아쓰지 말고", "뽑아내라"],
            ["묻지 말고", "지시하라"], ["쓰지 말고", "구조화하라"]],
    mantra: ["나는 문장을 쓰지 않는다.", "나는 구조를 지시한다."],
    keys: ["관계", "목적", "톤"],
    dashTitle: "구조가 전부다.",
    layers: ["관계", "목적", "톤", "형식"],
    title: "실전 AI 활용 가이드",
    sub: "2026 · 10편 · 50장",
    outro: "모든 장면을 코드로 그렸습니다.",
  };

  /* ---- 유틸 ---- */
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    back: (t) => { const s = 1.70158; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); },
  };
  function rng(seed) {                       // 결정적 난수 (mulberry32)
    return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
  }
  const fmt = (n) => Math.round(n).toLocaleString("en-US");

  const canvas = document.getElementById("reel");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  /* ---- 그리기 조각 ---- */
  function fill(color) { ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); }
  function brandBg() {                       // styles.css .card 배경과 동일한 청록 라디얼
    fill(C.bg);
    let g = ctx.createRadialGradient(W * 0.84, H * 0.12, 0, W * 0.84, H * 0.12, W * 0.6);
    g.addColorStop(0, "rgba(23,208,187,0.13)"); g.addColorStop(1, "rgba(23,208,187,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(W * 0.16, H * 0.96, 0, W * 0.16, H * 0.96, W * 0.62);
    g.addColorStop(0, "rgba(23,208,187,0.10)"); g.addColorStop(1, "rgba(23,208,187,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function text(str, x, y, o = {}) {
    ctx.save();
    ctx.font = `${o.weight || 800} ${o.size || 80}px ${o.mono ? MONO : SANS}`;
    ctx.fillStyle = o.color || C.ink;
    ctx.textAlign = o.align || "center";
    ctx.textBaseline = o.baseline || "middle";
    ctx.letterSpacing = `${o.ls ?? -(o.size || 80) * 0.02}px`;
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.fillText(str, x, y);
    ctx.restore();
  }
  function lines(arr, cx, cy, size, o = {}) {  // 여러 줄 중앙 정렬
    const lh = size * (o.lh || 1.12);
    const top = cy - ((arr.length - 1) * lh) / 2;
    arr.forEach((s, i) => text(s, cx, top + i * lh, { ...o, size, color: (o.colors && o.colors[i]) || o.color }));
  }
  function rrect(x, y, w, h, r) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.closePath();
  }
  function header(color = C.muted) {         // 좌상단 브랜드 · 우상단 연도
    text(COPY.brand, 72, 96, { size: 30, weight: 700, color, align: "left", ls: 0 });
    text(COPY.year, W - 72, 96, { size: 30, weight: 700, color, align: "right", ls: 0 });
  }
  function glitch(amount, seed) {            // 화면을 가로 띠로 썰어 좌우로 어긋내기
    if (amount <= 0) return;
    const r = rng(seed);
    const n = 6 + Math.floor(r() * 8);
    for (let i = 0; i < n; i++) {
      const y = Math.floor(r() * H), h = 8 + Math.floor(r() * 90);
      const dx = Math.round((r() - 0.5) * 2 * 140 * amount);
      ctx.drawImage(canvas, 0, y, W, h, dx, y, W, h);
    }
    ctx.save(); ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.35 * amount;
    ctx.drawImage(canvas, 0, 0, W, H, Math.round(14 * amount), 0, W, H);
    ctx.restore();
  }
  function scanlines(alpha = 0.12) {
    ctx.save(); ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 3);
    ctx.restore();
  }
  function vignette(a = 0.55) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${a})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  /* =====================================================================
     S0 훅 — 빠른 컷 (0 ~ 5.6s)
     ===================================================================== */
  const HOOK_T = []; { let acc = 0; for (const c of COPY.hook) { HOOK_T.push(acc); acc += c.dur; } }
  function s0(t) {
    let idx = 0; for (let i = 0; i < HOOK_T.length; i++) if (t >= HOOK_T[i]) idx = i;
    const cut = COPY.hook[idx], lt = t - HOOK_T[idx];
    const bg = cut.bg === "accent" ? C.accent : cut.bg === "paper" ? C.paper : null;
    if (bg) fill(bg); else brandBg();
    const fg = bg ? C.bg : C.ink;
    header(bg ? "rgba(10,11,11,.55)" : C.muted);

    const p = E.expo(seg(lt, 0, 0.22));
    const size = cut.small ? 118 : cut.lines.length >= 3 ? 150 : 176;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(lerp(1.18, 1, p), lerp(1.18, 1, p));
    ctx.globalAlpha = p;
    const colors = cut.lines.map((_, i) => (cut.hi === i ? C.accent : fg));
    lines(cut.lines, 0, 0, size, { weight: 900, colors, ls: -size * 0.035 });
    ctx.restore();

    // 컷 번호 (좌하단, 레퍼런스의 러닝 캡션 역할)
    text(`CUT ${String(idx + 1).padStart(2, "0")} / ${String(COPY.hook.length).padStart(2, "0")}`,
      72, H - 96, { size: 26, weight: 500, mono: true, color: bg ? "rgba(10,11,11,.55)" : C.muted2, align: "left", ls: 2 });
    glitch(lt < 0.1 ? (0.1 - lt) * 9 : 0, idx * 97 + Math.floor(t * FPS));
  }

  /* =====================================================================
     S1 터미널 (5.6 ~ 9.4s)
     ===================================================================== */
  function s1(t) {
    brandBg(); header();
    const x = 72, y = 420, w = W - 144, h = 1120;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 80; ctx.shadowOffsetY = 30;
    rrect(x, y, w, h, 26); ctx.fillStyle = "#121514"; ctx.fill();
    ctx.restore();
    rrect(x, y, w, h, 26); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
    // 타이틀 바
    ctx.fillStyle = C.line; ctx.fillRect(x, y + 92, w, 2);
    [["#ff5f57", 0], ["#febc2e", 1], ["#28c840", 2]].forEach(([c, i]) => {
      ctx.beginPath(); ctx.arc(x + 44 + i * 34, y + 46, 10, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
    });
    text("terminal — ai-guide", x + w / 2, y + 46, { size: 28, weight: 500, mono: true, color: C.muted, ls: 0 });

    // 명령어 타이핑
    const typed = Math.floor(seg(t, 0.1, 1.2) * COPY.cmd.length);
    const cur = Math.floor(t * 2.5) % 2 === 0 ? "▌" : " ";
    const lineY = y + 170, lh = 68;
    text(COPY.cmd.slice(0, typed) + (typed < COPY.cmd.length ? cur : ""), x + 44, lineY,
      { size: 34, weight: 700, mono: true, color: C.ink, align: "left", ls: 0 });

    // 로딩 라인
    const start = 1.45, step = 0.17;
    COPY.topics.forEach((name, i) => {
      const at = start + i * step; if (t < at) return;
      const a = E.out(seg(t, at, at + 0.12));
      const yy = lineY + lh * (i + 1);
      ctx.save(); ctx.globalAlpha = a;
      text("[OK]", x + 44, yy, { size: 32, weight: 700, mono: true, color: C.accent, align: "left", ls: 0 });
      const label = `${String(i + 1).padStart(2, "0")}  ${name}`;
      text(label, x + 136, yy, { size: 32, weight: 500, mono: true, color: C.soft, align: "left", ls: 0 });
      text("loaded", x + w - 44, yy, { size: 32, weight: 500, mono: true, color: C.soft, align: "right", ls: 0 });
      ctx.font = `500 32px ${MONO}`; ctx.letterSpacing = "0px";
      const from = x + 136 + ctx.measureText(label).width + 22, to = x + w - 44 - ctx.measureText("loaded").width - 22;
      ctx.fillStyle = C.muted2;
      for (let dx = from; dx < to; dx += 14) ctx.fillRect(dx, yy + 8, 4, 4);
      ctx.restore();
    });
    const doneAt = start + COPY.topics.length * step + 0.25;
    if (t >= doneAt) {
      const a = E.out(seg(t, doneAt, doneAt + 0.2));
      const yy = lineY + lh * (COPY.topics.length + 1.6);
      ctx.save(); ctx.globalAlpha = a;
      rrect(x + 36, yy - 40, w - 72, 80, 14); ctx.fillStyle = "rgba(23,208,187,.12)"; ctx.fill();
      text(COPY.done, x + 60, yy, { size: 32, weight: 700, mono: true, color: C.accent, align: "left", ls: 0 });
      ctx.restore();
      if (t >= doneAt + 0.35) text(cur, x + 44, lineY + lh * (COPY.topics.length + 2.8),
        { size: 34, weight: 700, mono: true, color: C.ink, align: "left" });
    }
    // 하단 캡션
    text("MCP ✕   외부 API ✕   영상 생성 AI ✕", W / 2, H - 150, { size: 30, weight: 600, color: C.muted, ls: 1 });
    text("JUST CODE.", W / 2, H - 92, { size: 34, weight: 900, color: C.accent, ls: 6 });
    scanlines(0.06);
  }

  /* =====================================================================
     S2 키네틱 타이포 + 바우하우스 그리드 (9.4 ~ 17.4s)
     ===================================================================== */
  function kineticPair(lt, pair, seed) {     // 1.4초: 0~0.6 첫 구절(다크) / 0.6~1.4 결론(청록)
    if (lt < 0.6) {
      brandBg(); header();
      const p = E.out(seg(lt, 0, 0.25));
      ctx.save(); ctx.globalAlpha = p; ctx.translate(0, (1 - p) * 60);
      text(pair[0], W / 2, H / 2, { size: 132, weight: 900, color: C.ink, ls: -5 });
      ctx.restore();
    } else {
      const l2 = lt - 0.6;
      fill(C.accent); header("rgba(10,11,11,.55)");
      const p = E.expo(seg(l2, 0, 0.18));
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(lerp(1.5, 1, p), lerp(1.5, 1, p));
      text(pair[1], 0, 0, { size: pair[1].length > 4 ? 168 : 210, weight: 900, color: C.bg, ls: -9 });
      ctx.restore();
      glitch(l2 < 0.12 ? (0.12 - l2) * 7 : 0, seed + Math.floor(l2 * FPS));
    }
  }
  function bauhaus(lt) {
    fill(C.bg2);
    const cols = 4, rows = 7, cell = (W - 144) / cols, x0 = 72, y0 = (H - rows * cell) / 2;
    const frame = Math.floor(lt / 0.2);
    const r = rng(1234 + frame * 7);
    const palette = [C.accent, C.ink, C.dim, C.card2, C.paper, C.accent];
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const x = x0 + j * cell, y = y0 + i * cell, kind = Math.floor(r() * 6), col = palette[Math.floor(r() * palette.length)];
      ctx.fillStyle = col;
      ctx.save(); ctx.translate(x + cell / 2, y + cell / 2); ctx.rotate(Math.floor(r() * 4) * Math.PI / 2);
      const s = cell * 0.46;
      ctx.beginPath();
      if (kind === 0) ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2);
      else if (kind === 1) { ctx.moveTo(-s, s); ctx.arc(-s, s, s * 2, -Math.PI / 2, 0); }     // 1/4 원
      else if (kind === 2) { ctx.arc(0, 0, s * 0.95, Math.PI, 0); }                              // 반원
      else if (kind === 3) { ctx.moveTo(-s, s); ctx.lineTo(s, s); ctx.lineTo(-s, -s); }          // 삼각
      else if (kind === 4) ctx.rect(-s, -s * 0.28, s * 2, s * 0.56);                              // 바
      else ctx.rect(-s * 0.9, -s * 0.9, s * 1.8, s * 1.8);                                        // 사각
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
    header(C.muted);
    text("GRID  ·  " + String(frame).padStart(3, "0"), W / 2, H - 92, { size: 26, weight: 500, mono: true, color: C.muted2, ls: 4 });
  }
  function s2(t) {
    if (t < 2.8) return kineticPair(t % 1.4, COPY.pairs[Math.floor(t / 1.4)], 11);
    if (t < 4.2) return bauhaus(t - 2.8);
    if (t < 7.0) { const l = t - 4.2; return kineticPair(l % 1.4, COPY.pairs[2 + Math.floor(l / 1.4)], 23); }
    // 만트라 두 줄
    brandBg(); header();
    const l = t - 7.0;
    COPY.mantra.forEach((s, i) => {
      const p = E.out(seg(l, i * 0.18, i * 0.18 + 0.35));
      ctx.save(); ctx.globalAlpha = p; ctx.translate(0, (1 - p) * 40);
      text(s, W / 2, H / 2 - 60 + i * 120, { size: 72, weight: i ? 900 : 600, color: i ? C.accent : C.soft, ls: -2 });
      ctx.restore();
    });
  }

  /* =====================================================================
     S3 3D 파티클 — 구 → 토러스 → 이중나선 (17.4 ~ 24.4s)
     ===================================================================== */
  const N = 2400;
  const SHAPES = (() => {
    const sphere = [], torus = [], helix = [];
    const r = rng(42);
    for (let i = 0; i < N; i++) {
      const k = (i + 0.5) / N, y = 1 - 2 * k, rad = Math.sqrt(1 - y * y), th = i * 2.399963;   // 피보나치 구
      sphere.push([rad * Math.cos(th) * 300, y * 300, rad * Math.sin(th) * 300]);
      const u = r() * Math.PI * 2, v = r() * Math.PI * 2, R = 240, rr = 100;
      torus.push([(R + rr * Math.cos(v)) * Math.cos(u), rr * Math.sin(v), (R + rr * Math.cos(v)) * Math.sin(u)]);
      const s = i % 2 ? Math.PI : 0, a = (i / N) * Math.PI * 7 + s, yy = (i / N - 0.5) * 760;
      const rung = i % 11 === 0 ? r() : 1;                                                   // 가끔 가로 가로대
      helix.push([Math.cos(a) * 150 * (i % 11 === 0 ? (rung * 2 - 1) : 1), yy, Math.sin(a) * 150 * (i % 11 === 0 ? (rung * 2 - 1) : 1)]);
    }
    return { sphere, torus, helix };
  })();
  function s3(t) {
    brandBg(); header();
    // 형상 단계
    let A, B, m, label;
    if (t < 2.0) { A = SHAPES.sphere; B = SHAPES.sphere; m = 0; label = "SPHERE"; }
    else if (t < 2.6) { A = SHAPES.sphere; B = SHAPES.torus; m = E.inOut(seg(t, 2.0, 2.6)); label = "MORPH"; }
    else if (t < 4.3) { A = SHAPES.torus; B = SHAPES.torus; m = 0; label = "TORUS"; }
    else if (t < 4.9) { A = SHAPES.torus; B = SHAPES.helix; m = E.inOut(seg(t, 4.3, 4.9)); label = "MORPH"; }
    else { A = SHAPES.helix; B = SHAPES.helix; m = 0; label = "HELIX"; }
    const ry = t * 0.9, rx = Math.sin(t * 0.5) * 0.35 + 0.25;
    const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    const intro = E.out(seg(t, 0, 0.8));
    const pts = [];
    for (let i = 0; i < N; i++) {
      let x = lerp(A[i][0], B[i][0], m), y = lerp(A[i][1], B[i][1], m), z = lerp(A[i][2], B[i][2], m);
      let x1 = x * cy - z * sy, z1 = x * sy + z * cy;
      let y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
      const persp = 900 / (900 + z2);
      pts.push([W / 2 + x1 * persp * intro, H / 2 - 40 + y1 * persp * intro, z2, persp]);
    }
    pts.sort((a, b) => b[2] - a[2]);
    for (const [x, y, z, p] of pts) {
      const depth = clamp((z + 320) / 640);
      ctx.fillStyle = `rgba(23,208,187,${lerp(0.9, 0.18, depth)})`;
      const s = lerp(4.2, 1.6, depth) * p;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
    // 코너 라벨 (레퍼런스의 기술 UI 오버레이)
    const mono = { size: 26, weight: 500, mono: true, color: C.muted, align: "left", ls: 3 };
    text(`PARTICLES  ${fmt(N)}`, 72, H - 190, mono);
    text(`SHAPE      ${label}`, 72, H - 150, mono);
    text(`ROT        ${(ry % (Math.PI * 2) * 57.3).toFixed(1).padStart(6)}°`, 72, H - 110, mono);
    COPY.keys.forEach((k, i) => {
      const on = Math.floor(t / 0.7) % 3 === i;
      text(k, W - 72, H - 190 + i * 40, { size: 28, weight: on ? 800 : 500, color: on ? C.accent : C.muted2, align: "right", ls: 0 });
    });
    text("3 KEYS", W - 72, H - 230, { size: 22, weight: 500, mono: true, color: C.muted2, align: "right", ls: 4 });
    vignette(0.45);
  }

  /* =====================================================================
     S4 대시보드 (24.4 ~ 30.4s)
     ===================================================================== */
  function card(x, y, w, h, title, delay, t, body) {
    const p = E.back(seg(t, delay, delay + 0.45));
    if (p <= 0) return;
    ctx.save(); ctx.globalAlpha = clamp(p); ctx.translate(0, (1 - p) * 50);
    rrect(x, y, w, h, 26); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
    text(title, x + 36, y + 46, { size: 24, weight: 600, mono: true, color: C.muted, align: "left", ls: 3 });
    ctx.save(); ctx.translate(x, y); body(w, h, clamp(seg(t, delay + 0.2, delay + 1.6))); ctx.restore();
    ctx.restore();
  }
  function s4(t) {
    brandBg(); header();
    const M = 72, G = 28, cw = (W - M * 2 - G) / 2;
    // A: 작업 시간 30분 → 3분
    card(M, 200, W - M * 2, 330, "작업 시간", 0, t, (w, h, p) => {
      const v = lerp(30, 3, E.inOut(p));
      text(`${Math.round(v)}분`, 36, 170, { size: 150, weight: 900, color: v <= 3.5 ? C.accent : C.ink, align: "left", ls: -6 });
      const sa = seg(p, 0.55, 1);                                 // 끝나갈수록 "30분" 에 취소선
      text("30분", w - 36, 178, { size: 64, weight: 800, color: C.muted, align: "right", ls: -2 });
      ctx.font = `800 64px ${SANS}`; ctx.letterSpacing = "-2px";
      const tw = ctx.measureText("30분").width;
      ctx.fillStyle = C.accent; ctx.fillRect(w - 36 - tw, 174, tw * sa, 8);
      text("BEFORE", w - 36, 118, { size: 22, weight: 500, mono: true, color: C.muted2, align: "right", ls: 3 });
      ctx.fillStyle = C.line; ctx.fillRect(36, 262, w - 72, 10);
      ctx.fillStyle = C.accent; ctx.fillRect(36, 262, (w - 72) * (v / 30), 10);
    });
    // B: 프롬프트 3요소 바
    card(M, 558, cw, 470, "프롬프트 3요소", 0.25, t, (w, h, p) => {
      COPY.keys.forEach((k, i) => {
        const y = 110 + i * 112, f = E.out(seg(p, i * 0.2, i * 0.2 + 0.6));
        text(k, 36, y, { size: 38, weight: 800, color: C.soft, align: "left", ls: -1 });
        text(`${Math.round(f * 100)}%`, w - 36, y, { size: 30, weight: 600, mono: true, color: C.accent, align: "right", ls: 0 });
        ctx.fillStyle = C.line; ctx.fillRect(36, y + 36, w - 72, 8);
        ctx.fillStyle = C.accent; ctx.fillRect(36, y + 36, (w - 72) * f, 8);
      });
    });
    // C: 카운터
    card(M + cw + G, 558, cw, 470, "OUTPUT", 0.4, t, (w, h, p) => {
      [["SLIDES", 50], ["TOPICS", 10], ["PROMPTS", 10]].forEach(([k, n], i) => {
        const y = 118 + i * 118, v = Math.round(n * E.out(seg(p, i * 0.15, i * 0.15 + 0.7)));
        text(k, 36, y - 34, { size: 22, weight: 500, mono: true, color: C.muted2, align: "left", ls: 3 });
        text(String(v).padStart(2, "0"), 36, y + 18, { size: 76, weight: 900, color: i === 0 ? C.accent : C.ink, align: "left", ls: -3 });
      });
    });
    // D: 이징 곡선 + 핵심 카피
    card(M, 1056, W - M * 2, 430, "STRUCTURE CURVE", 0.6, t, (w, h, p) => {
      const gx = 36, gy = 90, gw = w - 72, gh = 240;
      ctx.strokeStyle = C.line; ctx.lineWidth = 2;
      for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(gx, gy + gh * i / 4); ctx.lineTo(gx + gw, gy + gh * i / 4); ctx.stroke(); }
      ctx.beginPath(); ctx.strokeStyle = C.accent; ctx.lineWidth = 6; ctx.lineCap = "round";
      const upTo = E.out(p);
      for (let i = 0; i <= 200; i++) { const u = i / 200; if (u > upTo) break;
        const x = gx + gw * u, y = gy + gh - gh * E.inOut(u); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      const dx = gx + gw * upTo, dy = gy + gh - gh * E.inOut(upTo);
      ctx.beginPath(); ctx.arc(dx, dy, 12, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill();
      text(COPY.dashTitle, w / 2, 388, { size: 44, weight: 900, color: C.ink, ls: -1, alpha: seg(p, 0.7, 1) });
    });
    // E: 에너지 파형
    card(M, 1514, W - M * 2, 260, "ENERGY", 0.8, t, (w, h, p) => {
      ctx.beginPath(); ctx.strokeStyle = C.accent; ctx.lineWidth = 4;
      for (let x = 36; x <= w - 36; x += 4) {
        const u = (x - 36) / (w - 72), ph = t * 6;
        const y = 150 + Math.sin(u * 18 + ph) * 28 * Math.sin(u * 3 + ph * 0.3) * p + Math.sin(u * 47 - ph * 2) * 12 * p;
        x === 36 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      text(`${(128 + Math.sin(t * 2) * 1.5).toFixed(0)} BPM`, w - 36, 46, { size: 24, weight: 600, mono: true, color: C.accent, align: "right", ls: 3 });
    });
    text("1 HTML FILE  ·  0 PLUGINS", W / 2, H - 92, { size: 26, weight: 500, mono: true, color: C.muted2, ls: 4 });
  }

  /* =====================================================================
     S5 터널 + 글리치 레이어 (30.4 ~ 36.4s)
     ===================================================================== */
  function s5(t) {
    if (t < 2.6) {
      fill(C.bg);
      const depth = 14, speed = t * 2.2;
      for (let i = depth; i >= 0; i--) {
        const z = (i - (speed % 1)) / depth;              // 0(가까움) ~ 1(멀리)
        if (z <= 0) continue;
        const s = Math.pow(z, 1.6), w = 1080 * 0.78 / s * 0.28, h = w * 1.25;   // 4:5 카드 비율
        const a = clamp(1 - z) * 0.9;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, H / 2);
        ctx.rotate(Math.sin(t * 0.8 + i * 0.1) * 0.03);
        rrect(-w / 2, -h / 2, w, h, w * 0.04);
        ctx.strokeStyle = i % 3 === 0 ? C.ink : C.accent; ctx.lineWidth = lerp(1, 7, 1 - z); ctx.stroke();
        ctx.restore();
      }
      // 대각 가이드 라인
      ctx.save(); ctx.strokeStyle = "rgba(23,208,187,.25)"; ctx.lineWidth = 2;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
        ctx.beginPath(); ctx.moveTo(W / 2, H / 2); ctx.lineTo(W / 2 + sx * W, H / 2 + sy * H * 0.6); ctx.stroke();
      });
      ctx.restore();
      text("ZOOM", W / 2, H - 92, { size: 26, weight: 500, mono: true, color: C.muted2, ls: 8 });
      scanlines(0.1); header();
      return;
    }
    const l = t - 2.6, idx = Math.min(COPY.layers.length - 1, Math.floor(l / 0.85)), lt = l % 0.85;
    const colors = [C.bg, C.accent, C.paper, C.bg];
    fill(colors[idx]);
    const fg = idx === 1 || idx === 2 ? C.bg : C.ink;
    // RGB 스플릿 느낌: 청록·흰 레이어를 어긋나게 두 번 찍고 본문
    const p = E.expo(seg(lt, 0, 0.16)), off = (1 - p) * 60;
    const size = 230;
    ctx.save(); ctx.globalCompositeOperation = idx === 0 || idx === 3 ? "screen" : "multiply";
    text(COPY.layers[idx], W / 2 - off, H / 2, { size, weight: 900, color: C.accent, ls: -10, alpha: 0.85 });
    text(COPY.layers[idx], W / 2 + off, H / 2, { size, weight: 900, color: idx === 1 ? C.ink : C.dim, ls: -10, alpha: 0.6 });
    ctx.restore();
    text(COPY.layers[idx], W / 2, H / 2, { size, weight: 900, color: fg, ls: -10 });
    // 이전 레이어들을 위로 쌓기
    for (let k = 0; k < idx; k++)
      text(COPY.layers[k], W / 2, H / 2 - 300 - (idx - 1 - k) * 110, { size: 90, weight: 800, color: fg, ls: -3, alpha: 0.35 });
    text(`LAYER ${idx + 1}/${COPY.layers.length}`, W / 2, H - 92, { size: 26, weight: 500, mono: true, color: idx === 1 || idx === 2 ? "rgba(10,11,11,.5)" : C.muted2, ls: 6 });
    scanlines(0.1);
    glitch(lt < 0.14 ? (0.14 - lt) * 6 : 0, 500 + idx * 31 + Math.floor(lt * FPS));
  }

  /* =====================================================================
     S6 타이틀 (36.4 ~ 40s)
     ===================================================================== */
  function s6(t) {
    brandBg();
    const p1 = E.out(seg(t, 0.1, 0.6)), p2 = E.out(seg(t, 0.45, 0.9)), p3 = E.out(seg(t, 0.8, 1.3)), p4 = E.out(seg(t, 1.4, 2.0));
    ctx.save(); ctx.globalAlpha = p1; ctx.translate(0, (1 - p1) * 30);
    text("“", W / 2 - 400, H / 2 - 250, { size: 220, weight: 700, color: C.accent, align: "left" });
    text(COPY.title, W / 2, H / 2 - 60, { size: 96, weight: 900, color: C.ink, ls: -4 });
    ctx.restore();
    ctx.fillStyle = C.accent; ctx.fillRect(W / 2 - 48 * p2, H / 2 + 40, 96 * p2, 6);
    text(COPY.sub, W / 2, H / 2 + 120, { size: 40, weight: 500, color: C.muted, ls: 1, alpha: p3 });
    text(COPY.outro, W / 2, H - 200, { size: 34, weight: 600, color: C.soft, ls: 0, alpha: p4 });
    text("JUST CODE.", W / 2, H - 140, { size: 26, weight: 800, color: C.accent, ls: 6, alpha: p4 });
    // 페이드 아웃
    const fade = seg(t, 2.9, 3.6);
    if (fade > 0) { ctx.fillStyle = `rgba(10,11,11,${fade})`; ctx.fillRect(0, 0, W, H); }
  }

  /* ---- 타임라인 ---- */
  const SCENES = [
    [0.0, 5.6, s0], [5.6, 9.4, s1], [9.4, 17.4, s2], [17.4, 24.4, s3],
    [24.4, 30.4, s4], [30.4, 36.4, s5], [36.4, 40.0, s6],
  ];
  function render(t) {
    t = clamp(t, 0, DURATION - 1e-6);
    ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.letterSpacing = "0px";
    for (const [a, b, fn] of SCENES) if (t >= a && t < b) { fn(t - a); break; }
    // 씬 경계 플래시 (1프레임)
    for (const [a] of SCENES.slice(1)) if (t >= a && t < a + 1 / FPS) { ctx.fillStyle = C.accent; ctx.globalAlpha = 0.9; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }

  /* ---- 외부 인터페이스 ---- */
  window.REEL = { W, H, FPS, DURATION, SCENES: SCENES.map(([a, b]) => [a, b]) };
  window.__seek = (t) => { render(t); return true; };
  window.__frame = (t, type = "image/png", q) => { render(t); return canvas.toDataURL(type, q); };

  const weights = [400, 500, 600, 700, 800, 900];
  Promise.all(weights.map((w) => document.fonts.load(`${w} 40px Pretendard`, "가Ag")))
    .then(() => document.fonts.ready)
    .then(() => { window.__ready = true; document.body.dataset.ready = "1"; render(0); window.dispatchEvent(new Event("reel-ready")); });
})();
