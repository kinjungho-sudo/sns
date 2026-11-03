/* 슬라이드 본체: 내용 채우기 · 장 전환 · 네비게이션 · 카운트업 · 영상 · 편집 모드
   모든 문구와 수치는 content.json에서 온다. 이 파일에는 문구를 쓰지 않는다. */
(() => {
  "use strict";
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stage = $("#stage"), slides = $$(".slide"), TOTAL = slides.length;
  let C = null, cur = 0, editing = false;

  /* ───────── 내용 불러오기: content.json → 실패하면(file://) js/content.js 사본 ───────── */
  async function loadContent() {
    // 더블클릭(file://)으로 열면 브라우저가 fetch를 막으므로 시도하지 않고 사본을 쓴다 (콘솔 오류 방지)
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
  const emHtml = (s) => esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");                 // *핵심어* → 강조색
  const firstEmHtml = (s) => { const i = s.indexOf(" "); return i < 0 ? `<em>${esc(s)}</em>` : `<em>${esc(s.slice(0, i))}</em>${esc(s.slice(i))}`; };

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
    ["cover", "metrics", "motion"].forEach((k, i) => (slides[i].dataset.title = C[k].railTitle));
    $("#total").textContent = String(TOTAL).padStart(2, "0");
  }

  /* ───────── 무대 크기: 1920×1080을 비율 유지해 화면에 맞춤 ───────── */
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
    document.dispatchEvent(new CustomEvent("slide:leave", { detail: prev }));
    document.dispatchEvent(new CustomEvent("slide:enter", { detail: n }));
  }
  const hashSlide = () => parseInt(location.hash.slice(1), 10) || 1;
  addEventListener("hashchange", () => go(hashSlide(), { fromHash: true }));

  function toggleFullscreen(el = document.documentElement) {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.().catch(() => {});
  }

  function wireNav() {
    $$("[data-go]").forEach((b) => b.addEventListener("click", () => go(+b.dataset.go)));
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

  /* ───────── 장 1: 그림이 마우스 따라 최대 4° 기울어짐 ───────── */
  function wireCover() {
    const art = $(".cover-art"), tilt = $(".art-tilt");
    if (RM) return;
    art.addEventListener("mousemove", (e) => {
      const r = art.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `rotateY(${(x * 8).toFixed(2)}deg) rotateX(${(-y * 8).toFixed(2)}deg)`;   // ±4°
    });
    art.addEventListener("mouseleave", () => (tilt.style.transform = ""));
  }

  /* ───────── 장 3: 영상 플레이어 (직접 만든 컨트롤) ───────── */
  function wireVideo() {
    const v = $("#promo"), play = $("#v-play"), seek = $("#v-seek"), time = $("#v-time");
    v.src = C.motion.video; v.poster = C.motion.poster;
    const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const ui = () => {
      const d = v.duration || 0;
      time.textContent = `${mmss(v.currentTime)} / ${mmss(d)}`;
      if (!seeking) seek.value = d ? Math.round((v.currentTime / d) * 1000) : 0;
      play.textContent = v.paused ? "▶ 재생" : "❚❚ 일시정지";
      play.setAttribute("aria-label", v.paused ? "재생" : "일시정지");
    };
    let seeking = false;
    ["timeupdate", "play", "pause", "loadedmetadata", "ended"].forEach((ev) => v.addEventListener(ev, ui));
    play.onclick = () => (v.paused ? v.play() : v.pause());
    $("#v-replay").onclick = () => { v.currentTime = 0; v.play(); };
    seek.addEventListener("input", () => { seeking = true; if (v.duration) v.currentTime = (seek.value / 1000) * v.duration; });
    seek.addEventListener("change", () => (seeking = false));
    $("#v-fs").onclick = () => toggleFullscreen($("#player"));
    document.addEventListener("slide:enter", (e) => {
      if (e.detail !== 3) return;
      v.muted = true; v.currentTime = 0;
      if (!RM) v.play().catch(() => {});   // 동작 줄이기 설정이면 자동 재생하지 않음
    });
    document.addEventListener("slide:leave", (e) => { if (e.detail === 3) v.pause(); });
  }

  /* ───────── 편집 모드 (E): 글자를 고치고 content.json으로 내려받기 ───────── */
  function toggleEdit() {
    editing = !editing;
    document.body.classList.toggle("editing", editing);
    $("#edit-bar").hidden = !editing;
    $$("[data-k]").forEach((el) => (editing ? el.setAttribute("contenteditable", "plaintext-only") : el.removeAttribute("contenteditable")));
  }
  function saveEdits() {
    const out = structuredClone(C);
    for (const el of $$("[data-k]")) {
      let v;
      if (el.hasAttribute("data-em")) v = el.innerHTML.replace(/<em>(.*?)<\/em>/g, "*$1*").replace(/<[^>]+>/g, "");
      else v = el.textContent;
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
    bind(); fit(); wireNav(); wireCover(); wireVideo();
    $("#edit-save").onclick = saveEdits; $("#edit-close").onclick = toggleEdit;
    slides.forEach((s) => $$(".st", s).forEach((el, i) => el.style.setProperty("--i", i)));
    document.dispatchEvent(new CustomEvent("content:ready", { detail: C }));
    go(hashSlide(), { fromHash: true });
    document.body.dataset.ready = "1";
  }).catch((err) => { console.error(err); document.body.dataset.ready = "error"; });
})();
