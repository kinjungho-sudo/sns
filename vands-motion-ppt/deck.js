/* 발표 진행: 장마다 타임라인 하나를 영상처럼 재생한다. 화면에는 조작 버튼을 두지 않고 키보드로만 다룬다.
   소리: 배경음악(잔잔하게, 내레이션 중엔 더 작게) + 장별 Typecast 내레이션(있으면). 자막은 내레이션 대본. */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const P = new URLSearchParams(location.search), RENDER = P.has("render");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stage = $("#stage"), cap = $("#cap"), bar = $("#bar"), hud = $("#hud"), bgm = $("#bgm"), vo = $("#vo");
  const N = window.NARRATION, T = window.NARRATION_TIMING;   // T: tools/narrate.mjs가 만든 실제 음성 시각 (없으면 대본 시각)
  const els = [...document.querySelectorAll(".slide")];
  const decks = els.map((el, i) => window.SLIDES[i](el));
  let cur = -1, started = RENDER, muted = false;

  const fit = () => stage.style.setProperty("--s", Math.min(innerWidth / 1920, innerHeight / 1080));
  addEventListener("resize", fit); fit();

  // 자막 줄: 실제 음성 시각이 있으면 그것을, 없으면 대본의 at ~ 다음 줄 at
  function linesOf(i) {
    const t = T && T.slides && T.slides[i];
    if (t) return t.lines;
    const L = N.slides[i].lines, D = decks[i].duration;
    return L.map((l, k) => ({ t0: l.at, t1: Math.min(k + 1 < L.length ? L[k + 1].at - .15 : D, l.at + 6.5), show: l.show }));
  }
  const voFile = (i) => (T && T.slides && T.slides[i] && T.slides[i].file) || null;

  function show(i, { play = true } = {}) {
    i = Math.max(0, Math.min(decks.length - 1, i));
    decks.forEach((d, k) => { if (k !== i) d.tl.pause(); });
    els.forEach((el, k) => el.classList.toggle("on", k === i));
    cur = i;
    const d = decks[i];
    d.tl.pause(0);
    vo.pause(); const f = voFile(i); if (f) { vo.src = f; vo.currentTime = 0; } else vo.removeAttribute("src");
    if (reduced && !RENDER) d.tl.progress(1);
    else if (play && started) playCur();
    if (!RENDER && location.hash !== "#" + (i + 1)) history.replaceState(null, "", "#" + (i + 1));
    hud.textContent = `${i + 1} / ${decks.length}`;
    tick();
  }
  function playCur() {
    const d = decks[cur]; if (d.tl.progress() >= 1) d.tl.seek(0);
    d.tl.play();
    if (vo.getAttribute("src") && !muted) { vo.currentTime = d.tl.time(); vo.play().catch(() => {}); }
    if (!muted) bgm.play().catch(() => {});
  }
  function pauseCur() { decks[cur].tl.pause(); vo.pause(); }
  const playing = () => !decks[cur].tl.paused() && decks[cur].tl.progress() < 1;
  function toggle() { playing() ? pauseCur() : playCur(); tick(); }
  function jumpBeat(dir) {
    const d = decks[cur], t = d.tl.time(), b = d.beats;
    const to = dir > 0 ? b.find((x) => x > t + .3) : [...b].reverse().find((x) => x < t - 1);
    if (to === undefined) return dir > 0 ? show(cur + 1) : show(cur - 1);
    d.tl.seek(to); if (vo.getAttribute("src")) vo.currentTime = to; tick();
  }

  // 매 프레임: 자막 · 진행선 · 배경음악 볼륨(내레이션 중엔 낮춤)
  function tick() {
    if (cur < 0) return;
    const d = decks[cur], t = d.tl.time();
    const line = linesOf(cur).find((l) => t >= l.t0 && t <= l.t1);
    const text = line ? line.show : "";
    if (cap.textContent !== text) cap.textContent = text;
    bar.style.width = (d.tl.progress() * 100).toFixed(2) + "%";
    const target = muted ? 0 : line ? .10 : .22;
    bgm.volume += (target - bgm.volume) * .08;
  }
  (function loop() { tick(); requestAnimationFrame(loop); })();

  function start() { if (started) return; started = true; $("#start").remove(); show(cur < 0 ? 0 : cur); }
  const fullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});

  addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    if (!started) { if (k === " " || k === "Enter" || k === "ArrowRight") { e.preventDefault(); start(); } return; }
    if ([" ", "ArrowRight", "ArrowLeft", "PageDown", "PageUp"].includes(k)) e.preventDefault();
    if (k === "ArrowRight" || k === "PageDown") show(cur + 1);
    else if (k === "ArrowLeft" || k === "PageUp") show(cur - 1);
    else if (k === " ") toggle();
    else if (k === "r" || k === "R") { show(cur); }
    else if (k === ".") jumpBeat(1);
    else if (k === ",") jumpBeat(-1);
    else if (k === "1" || k === "2" || k === "3") show(+k - 1);
    else if (k === "m" || k === "M") { muted = !muted; bgm.muted = vo.muted = muted; }
    else if (k === "c" || k === "C") document.body.classList.toggle("nocap");
    else if (k === "f" || k === "F") fullscreen();
    else if (k === "?" || k === "h" || k === "H") $("#help").classList.toggle("show");
    else if (k === "Escape") $("#help").classList.remove("show");
  });
  $("#start").addEventListener("click", start);
  stage.addEventListener("click", () => started && toggle());
  // 터치: 좌우로 밀면 이전·다음 장
  let tx = null; addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
  addEventListener("touchend", (e) => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 60) show(cur + (dx < 0 ? 1 : -1)); tx = null; }, { passive: true });
  // 마우스를 2.5초 움직이지 않으면 커서와 쪽수 숨김
  let idle; addEventListener("mousemove", () => { document.body.classList.remove("idle"); clearTimeout(idle); idle = setTimeout(() => document.body.classList.add("idle"), 2500); });
  addEventListener("hashchange", () => { const n = parseInt(location.hash.slice(1), 10); if (n && n - 1 !== cur) show(n - 1); });

  // 영상 내보내기용(tools/render-video.mjs): ?render=1&slide=N → window.seek(t)
  if (RENDER) {
    $("#start").remove(); document.body.classList.add("render");
    const n = (parseInt(P.get("slide"), 10) || 1) - 1;
    show(n, { play: false });
    window.DURATION = decks[n].duration;
    window.seek = (t) => { decks[n].tl.seek(t, false); tick(); };
    if (P.has("nocap")) document.body.classList.add("nocap");
  }
  document.fonts.ready.then(() => {
    if (!RENDER) show((parseInt(location.hash.slice(1), 10) || 1) - 1, { play: false });
    document.body.dataset.ready = "1"; window.__ready = true;
  });
})();
