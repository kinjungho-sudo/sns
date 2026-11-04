/* 슬라이드 본체: content.json의 slides 배열로 장을 만들고, 전환·이동·카운트업·영상·편집 모드를 담당한다.
   장 종류(type): cover · list · cards · tokens · structure · metrics · video · checklist
   문구는 이 파일에 쓰지 않는다. 전부 content.json에서 온다. */
(() => {
  "use strict";
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stage = $("#stage");
  let C = null, slides = [], TOTAL = 0, cur = 0, editing = false;

  /* ───────── 내용 불러오기 ───────── */
  async function loadContent() {
    // 더블클릭(file://)이면 브라우저가 fetch를 막으므로 사본을 바로 쓴다 (콘솔 오류 방지)
    if (location.protocol === "file:" && window.CONTENT_FALLBACK) return window.CONTENT_FALLBACK;
    try {
      const r = await fetch("content.json", { cache: "no-store" });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch {
      if (window.CONTENT_FALLBACK) return window.CONTENT_FALLBACK;
      throw new Error("content.json을 읽지 못했고 js/content.js 사본도 없습니다.");
    }
  }
  const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  const set = (obj, path, v) => { const ks = path.split("."), last = ks.pop(); ks.reduce((o, k) => o[k], obj)[last] = v; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const emHtml = (s) => esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");
  const firstEmHtml = (s) => { const i = s.indexOf(" "); return i < 0 ? `<em>${esc(s)}</em>` : `<em>${esc(s.slice(0, i))}</em>${esc(s.slice(i))}`; };

  /* ───────── 장 만들기 ───────── */
  // k: 편집 모드에서 고칠 수 있는 글자 (content.json 경로)
  const K = (path, tag = "span", cls = "", attrs = "") => `<${tag}${cls ? ` class="${cls}"` : ""} data-k="${path}"${attrs}></${tag}>`;
  const head = (p, s, withSub = true) =>
    `<div class="head" data-box>${K(`${p}.eyebrow`, "p", "eyebrow st")}${K(`${p}.title`, "h2", "title st", " data-em")}${withSub && s.subtitle ? K(`${p}.subtitle`, "p", "subtitle st") : ""}</div>`;
  const source = (i) => `<p class="source st" data-source="slides.${i}"></p>`;
  const luminance = (hex) => { const c = [1, 3, 5].map((j) => parseInt(hex.slice(j, j + 2), 16) / 255); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };

  const R = {
    cover: (s, i, p) => `
      <div class="cover-left" data-box>
        ${K(`${p}.eyebrow`, "p", "eyebrow st")}
        <h1 class="cover-title st">${s.titleLines.map((_, j) => K(`${p}.titleLines.${j}`, "span", "line", " data-first-em")).join("")}</h1>
        <p class="subtitle st">${s.subtitleLines.map((_, j) => K(`${p}.subtitleLines.${j}`)).join("<br />")}</p>
        <button class="cta st" data-go="2" data-k="${p}.cta"></button>
      </div>
      <div class="cover-art st" data-box aria-hidden="true">
        <div class="art-tilt"><div class="art-circle"></div><div class="art-arc"></div><div class="art-bars"><i></i><i></i><i></i></div><div class="art-dots"></div></div>
        <div class="stamp"><svg viewBox="0 0 200 200"><defs><path id="stamp-path-${i}" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" /></defs>
          <circle cx="100" cy="100" r="96" /><g class="stamp-ring"><text><textPath href="#stamp-path-${i}">${esc(s.stamp)}</textPath></text></g>
          <text class="stamp-center" x="100" y="100">${esc(s.stampCenter)}</text></svg></div>
      </div>
      <div class="flow st" data-box>
        <svg class="flow-svg" viewBox="0 0 1000 20" preserveAspectRatio="none" aria-hidden="true">
          <line class="flow-track" x1="0" y1="10" x2="1000" y2="10" /><line class="flow-line" x1="0" y1="10" x2="1000" y2="10" pathLength="1" /></svg>
        <ol class="flow-steps">${s.steps.map((_, j) => `<li><i></i><span class="n">${String(j + 1).padStart(2, "0")}</span>${K(`${p}.steps.${j}`, "b")}</li>`).join("")}</ol>
      </div>${source(i)}`,

    list: (s, i, p) => `${head(p, s)}
      <ol class="rows st" data-box>${s.rows.map((r, j) => `<li><span class="no">${String(j + 1).padStart(2, "0")}</span>${K(`${p}.rows.${j}.label`, "span", "label")}
        <span class="value">${r.swatch ? `<i class="chip" style="background:${esc(r.swatch)}"></i>` : ""}${K(`${p}.rows.${j}.value`)}</span>${K(`${p}.rows.${j}.note`, "span", "note")}</li>`).join("")}</ol>
      ${K(`${p}.caution`, "div", "caution st", " data-box")}${source(i)}`,

    cards: (s, i, p) => `${head(p, s)}
      <div class="step-cards st" data-box style="--n:${s.cards.length}">${s.cards.map((c, j) => `<article class="step-card">
        <span class="step-no">${String(j + 1).padStart(2, "0")}</span>${K(`${p}.cards.${j}.name`, "h3")}${c.lead ? K(`${p}.cards.${j}.lead`, "p", "lead") : ""}
        <ul>${c.points.map((_, q) => K(`${p}.cards.${j}.points.${q}`, "li")).join("")}</ul></article>`).join("")}</div>
      ${s.caution ? K(`${p}.caution`, "div", "caution cards-caution st", " data-box") : ""}${source(i)}`,

    tokens: (s, i, p) => `${head(p, s)}
      <div class="swatches st" data-box>${s.colors.map((c, j) => `<div class="swatch"><div class="chip${luminance(c.hex) > 0.8 ? " light" : ""}" style="background:${esc(c.hex)}"></div>
        ${K(`${p}.colors.${j}.name`, "b")}<span class="hex">${esc(c.hex)}</span>${K(`${p}.colors.${j}.role`, "span", "role")}</div>`).join("")}</div>
      <ul class="scale st" data-box>${s.typeScale.map((t, j) => `<li><div class="meta">${K(`${p}.typeScale.${j}.role`, "b")}${K(`${p}.typeScale.${j}.spec`)}</div>
        <div class="sample ${t.kind}" style="font-size:${t.px * 1.2}px;font-weight:${t.weight}">${t.kind === "title" ? emHtml(t.sample) : esc(t.sample)}${t.unit ? `<span class="unit">${esc(t.unit)}</span>` : ""}</div></li>`).join("")}</ul>
      ${K(`${p}.typeNote`, "p", "type-note st")}${source(i)}`,

    structure: (s, i, p) => `${head(p, s)}
      <div class="wire st" data-box aria-label="고정 틀 도식">
        <div class="w-top">${esc(s.frameLabels.top)}</div>
        <div class="w-rail"><i class="on">01</i><i>02</i><i>03</i></div>
        <div class="w-content">${esc(s.frameLabels.content)}</div>
        <div class="w-bottom">${esc(s.frameLabels.bottom)}</div>
        <div class="w-progress"></div>
      </div>
      <p class="wire-cap st"><b>━</b> ${esc(s.frameLabels.progress)} · 좌측 ${esc(s.frameLabels.rail)}은 현재 장을 강조</p>
      <div class="struct-cards st" data-box>${s.cards.map((c, j) => `<article class="card"><div>${K(`${p}.cards.${j}.no`, "p", "no")}${K(`${p}.cards.${j}.name`, "h3")}</div>
        <ul>${c.points.map((_, q) => K(`${p}.cards.${j}.points.${q}`, "li")).join("")}</ul></article>`).join("")}</div>${source(i)}`,

    metrics: (s, i, p) => `${head(p, s)}
      <div class="chart-col st" data-box><div class="legend" aria-hidden="true"></div><div class="chart-wrap"><canvas role="img"></canvas></div></div>
      <aside class="panel st" data-box>
        <p class="big-label"></p>
        <p class="big"><span class="num" data-count="0">0</span><span class="unit"></span></p>
        <hr /><ul class="notes"></ul>
        ${K(`${p}.caution`, "div", "caution")}
      </aside>
      <div class="year-btns st" role="group" aria-label="보기 선택" data-box></div>${source(i)}`,

    video: (s, i, p) => `${head(p, s, false)}
      <div class="player st" data-box>
        <video muted playsinline preload="auto"></video>
        <div class="controls">
          <button class="v-btn v-play" aria-label="재생">▶ 재생</button>
          <button class="v-btn v-replay" aria-label="다시 보기">↻ 다시 보기</button>
          <span class="v-time">0:00 / 0:00</span>
          <input class="v-seek" id="v-seek-${i}" type="range" min="0" max="1000" value="0" step="1" aria-label="탐색" />
          <button class="v-btn v-fs" aria-label="영상 전체화면">전체화면</button>
        </div>
      </div>${source(i)}`,

    checklist: (s, i, p) => `${head(p, s)}
      <ol class="checks st" data-box>${s.items.map((it, j) => `<li><span class="t">${K(`${p}.items.${j}.text`)}${K(`${p}.items.${j}.result`, "span", "r")}</span>${it.status ? K(`${p}.items.${j}.status`, "span", "ok todo") : K(`${p}.statusLabel`, "span", s.statusDone === false ? "ok todo" : "ok")}</li>`).join("")}</ol>
      <aside class="out st" data-box>${K(`${p}.outTitle`, "h3")}<ul>${s.outOfScope.map((_, j) => K(`${p}.outOfScope.${j}`, "li")).join("")}</ul></aside>${source(i)}`,
  };

  function build() {
    const box = $("#slides");
    box.innerHTML = C.slides.map((s, i) => {
      const render = R[s.type]; if (!render) { console.warn(`알 수 없는 장 종류: ${s.type}`); return ""; }
      return `<section class="slide ${s.type}" data-slide="${i + 1}" data-type="${s.type}" aria-label="${esc(s.railTitle)}">${render(s, i, `slides.${i}`)}</section>`;
    }).join("");
    slides = $$(".slide", box); TOTAL = slides.length;
    slides.forEach((el, i) => { el.dataset.title = C.slides[i].railTitle; $$(".st", el).forEach((x, j) => x.style.setProperty("--i", j)); });
    $("#rail").innerHTML = slides.map((_, i) => `<button data-go="${i + 1}" title="${esc(C.slides[i].railTitle)}">${String(i + 1).padStart(2, "0")}</button>`).join("");
    $("#total").textContent = String(TOTAL).padStart(2, "0");
  }

  function bind() {
    for (const el of $$("[data-k]")) {
      const v = get(C, el.dataset.k); if (v == null) continue;
      if (el.hasAttribute("data-em")) el.innerHTML = emHtml(v);
      else if (el.hasAttribute("data-first-em")) el.innerHTML = firstEmHtml(v);
      else el.textContent = v;
    }
    for (const el of $$("[data-source]")) {
      const s = get(C, el.dataset.source + ".source") || "";
      el.innerHTML = (C.dummy ? `<span class="dummy">${esc(C.meta.dummyLabel || "예시 데이터")}</span> · ` : "") + esc(s);
    }
    document.title = `${C.meta.brand} · ${C.meta.deckSubtitle}`;
  }

  /* ───────── 무대 크기 ───────── */
  const fit = () => stage.style.setProperty("--scale", Math.min(innerWidth / 1920, innerHeight / 1080));
  addEventListener("resize", fit);

  /* ───────── 카운트업: data-count / data-decimals / data-sign ───────── */
  const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
  const fmt = (v, d, sign) => (sign && v > 0 ? sign : "") + v.toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d });
  function countUp(el, from = 0) {
    const to = +el.dataset.count, d = +(el.dataset.decimals || 0), sign = el.dataset.sign || "";
    cancelAnimationFrame(el._raf);
    if (RM) { el.textContent = fmt(to, d, sign); return; }
    const t0 = performance.now(), dur = 1100;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), v = from + (to - from) * easeOutCubic(k);
      el.textContent = fmt(+v.toFixed(d), d, sign);
      if (k < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  }
  window.SlideFX = { countUp, RM };

  /* ───────── 장 이동 ───────── */
  function go(n, { fromHash = false } = {}) {
    n = Math.max(1, Math.min(TOTAL, n));
    if (n === cur) return;
    const prev = cur; cur = n;
    slides.forEach((s, i) => s.classList.toggle("active", i === n - 1));
    $$(".rail button").forEach((b) => b.setAttribute("aria-current", +b.dataset.go === n ? "true" : "false"));
    $("#cur").textContent = String(n).padStart(2, "0");
    $("#slide-title").textContent = slides[n - 1].dataset.title || "";
    $("#progress").style.width = `${(n / TOTAL) * 100}%`;
    $("#prev").disabled = n === 1; $("#next").disabled = n === TOTAL;
    if (!fromHash && location.hash !== "#" + n) location.hash = String(n);
    document.dispatchEvent(new CustomEvent("slide:leave", { detail: { n: prev, el: slides[prev - 1] } }));
    document.dispatchEvent(new CustomEvent("slide:enter", { detail: { n, el: slides[n - 1] } }));
  }
  const hashSlide = () => parseInt(location.hash.slice(1), 10) || 1;
  addEventListener("hashchange", () => go(hashSlide(), { fromHash: true }));

  function toggleFullscreen(el = document.documentElement) {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.().catch(() => {});
  }

  function wireNav() {
    document.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b && !editing) go(+b.dataset.go); });
    $("#prev").onclick = () => go(cur - 1);
    $("#next").onclick = () => go(cur + 1);
    $("#fs-btn").onclick = () => toggleFullscreen();
    addEventListener("keydown", (e) => {
      if (e.target.isContentEditable || /INPUT|TEXTAREA/.test(e.target.tagName)) { if (e.key === "Escape") e.target.blur(); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(cur + 1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(cur - 1); }
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
      else if (e.key === "e" || e.key === "E") toggleEdit();
    });
    let sx = 0, sy = 0;
    addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ───────── 표지: 그림이 마우스 따라 최대 4° 기울어짐 ───────── */
  function wireCovers() {
    if (RM) return;
    for (const art of $$(".cover-art")) {
      const tilt = $(".art-tilt", art);
      art.addEventListener("mousemove", (e) => {
        const r = art.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.transform = `rotateY(${(x * 8).toFixed(2)}deg) rotateX(${(-y * 8).toFixed(2)}deg)`;
      });
      art.addEventListener("mouseleave", () => (tilt.style.transform = ""));
    }
  }

  /* ───────── 영상 장: 직접 만든 컨트롤, 진입 시 무음 자동 재생, 이탈 시 정지 ───────── */
  function wireVideos() {
    slides.filter((el) => el.dataset.type === "video").forEach((el) => {
      const s = C.slides[+el.dataset.slide - 1], v = $("video", el), play = $(".v-play", el), seek = $(".v-seek", el), time = $(".v-time", el);
      v.src = s.video; v.poster = s.poster;
      const mmss = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;
      let seeking = false;
      const ui = () => {
        const d = v.duration || 0;
        time.textContent = `${mmss(v.currentTime)} / ${mmss(d)}`;
        if (!seeking) seek.value = d ? Math.round((v.currentTime / d) * 1000) : 0;
        play.textContent = v.paused ? "▶ 재생" : "❚❚ 일시정지";
        play.setAttribute("aria-label", v.paused ? "재생" : "일시정지");
      };
      ["timeupdate", "play", "pause", "loadedmetadata", "ended"].forEach((ev) => v.addEventListener(ev, ui));
      play.onclick = () => (v.paused ? v.play() : v.pause());
      $(".v-replay", el).onclick = () => { v.currentTime = 0; v.play(); };
      seek.addEventListener("input", () => { seeking = true; if (v.duration) v.currentTime = (seek.value / 1000) * v.duration; });
      seek.addEventListener("change", () => (seeking = false));
      $(".v-fs", el).onclick = () => toggleFullscreen($(".player", el));
      document.addEventListener("slide:enter", (e) => {
        if (e.detail.el !== el) return;
        v.muted = true; v.currentTime = 0;
        if (!RM) v.play().catch(() => {});   // 동작 줄이기 설정이면 자동 재생하지 않음
      });
      document.addEventListener("slide:leave", (e) => { if (e.detail.el === el) v.pause(); });
    });
  }

  /* ───────── 편집 모드 (E) ───────── */
  function toggleEdit() {
    editing = !editing;
    document.body.classList.toggle("editing", editing);
    $("#edit-bar").hidden = !editing;
    $$("[data-k]").forEach((el) => (editing ? el.setAttribute("contenteditable", "plaintext-only") : el.removeAttribute("contenteditable")));
  }
  function saveEdits() {
    const out = structuredClone(C);
    for (const el of $$("[data-k]")) {
      let v = el.hasAttribute("data-em") ? el.innerHTML.replace(/<em>(.*?)<\/em>/g, "*$1*").replace(/<[^>]+>/g, "") : el.textContent;
      const tmp = document.createElement("textarea"); tmp.innerHTML = v; v = tmp.value.replace(/\s+/g, " ").trim();
      set(out, el.dataset.k, v);
    }
    const blob = new Blob([JSON.stringify(out, null, 2) + "\n"], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "content.json" });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ───────── 시작 ───────── */
  loadContent().then((data) => {
    C = data; window.CONTENT = C;
    build(); bind(); fit(); wireNav(); wireCovers(); wireVideos();
    $("#edit-save").onclick = saveEdits; $("#edit-close").onclick = toggleEdit;
    document.dispatchEvent(new CustomEvent("content:ready", { detail: C }));
    go(hashSlide(), { fromHash: true });
    document.body.dataset.ready = "1";
  }).catch((err) => { console.error(err); document.body.dataset.ready = "error"; });
})();
