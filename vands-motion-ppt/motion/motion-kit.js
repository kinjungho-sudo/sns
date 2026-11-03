// 모션그래픽 공통: 렌더 모드(?render=1)면 정지 상태로 window.seek(t)를 기다리고, 아니면 반복 재생한다.
// typeText: 글자를 시간에 따라 한 글자씩 보여 준다 (seek로 어느 시점이든 같은 화면).
window.motionKit = {
  typeText(tl, el, text, at, dur) {
    const o = { n: 0 };
    el.textContent = "";
    tl.to(o, { n: text.length, duration: dur, ease: "none", onUpdate: () => (el.textContent = text.slice(0, Math.round(o.n))) }, at);
  },
  async start(tl, duration, extra = () => {}) {
    const RENDER = new URLSearchParams(location.search).has("render");
    if (RENDER) document.body.classList.add("render");
    tl.set({}, {}, duration);
    window.DURATION = duration;
    window.seek = (t) => { tl.seek(t, false); extra(t); };
    if (RENDER) { window.seek(0); window.__ready = true; return; }
    const fit = () => document.getElementById("frame").style.setProperty("--s", Math.min(innerWidth / 1920, innerHeight / 1080));
    fit(); addEventListener("resize", fit);
    tl.repeat(-1).repeatDelay(.8).play();
    tl.eventCallback("onUpdate", () => extra(tl.time()));
  },
  ready: async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((im) => (im.complete ? 0 : new Promise((r) => (im.onload = im.onerror = r)))));
  },
};
