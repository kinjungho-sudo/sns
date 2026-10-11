/* =========================================================================
   영상 타임라인 엔진 — 결정적(deterministic) 프레임 렌더
   -------------------------------------------------------------------------
   모든 움직임은 Web Animations API 로 만든 뒤 "일시정지"해 두고,
   seek(t) 로 특정 시각(초)의 상태를 그대로 그립니다.
   → 같은 원고면 언제 뽑아도 똑같은 영상이 나옵니다.

     anim(el, keyframes, start, dur, easing)  : 시각 start 부터 dur 초 동안 애니메이션
     tick(fn)                                 : 매 프레임 fn(t) 호출 (타이핑·카운트업 등)
     show(el, from, to)                       : [from, to) 구간에만 보이기
     cue(name, t, gain)                       : 효과음 큐 (audio.mjs 가 읽어서 합성)
   장면 안의 시각은 모두 "원고 기준"이고, 전체 속도(EPISODE.pace)는 seek 에서 한 번에 적용됩니다.
   ========================================================================= */
(function () {
  // base = 원고 기준 길이(초), pace = 전체 속도 배율(1.3 이면 30% 느리게), duration = 실제 영상 길이
  const TL = { duration: 0, base: 0, pace: 1, anims: [], ticks: [], cues: [], voice: [], scenes: [] };

  const EASE = {
    out: "cubic-bezier(.16,1,.3,1)",       // 부드럽게 멈춤 (기본)
    inOut: "cubic-bezier(.65,0,.35,1)",
    back: "cubic-bezier(.34,1.56,.64,1)",  // 살짝 튕김
    linear: "linear",
  };

  function anim(el, keyframes, start, dur, easing = "out") {
    const a = el.animate(keyframes, {
      delay: start * 1000,
      duration: dur * 1000,
      fill: "both",
      easing: EASE[easing] || easing,
    });
    a.pause();
    TL.anims.push(a);
    return a;
  }

  function tick(fn) { TL.ticks.push(fn); }

  function show(el, from, to) {
    tick((t) => { el.style.visibility = t >= from && t < to ? "visible" : "hidden"; });
  }

  function cue(name, t, gain = 1) { TL.cues.push({ name, t: +t.toFixed(3), gain }); }

  // t = 실제 영상 시각(초). 내부 타임라인은 원고 기준 시각(t / pace)으로 그림
  function seek(t) {
    const b = t / TL.pace;
    for (const a of TL.anims) a.currentTime = b * 1000;
    for (const f of TL.ticks) f(b);
  }

  // 공용 프리셋 ---------------------------------------------------------
  const fx = {
    // 아래에서 떠오르기
    up(el, t, dist = 40, dur = 0.6) {
      return anim(el, [
        { opacity: 0, transform: `translateY(${dist}px)` },
        { opacity: 1, transform: "translateY(0)" },
      ], t, dur);
    },
    // 팝 (작게 → 크게 튕김)
    pop(el, t, dur = 0.5, rot = 0) {
      return anim(el, [
        { opacity: 0, transform: `scale(.6) rotate(${rot}deg)` },
        { opacity: 1, transform: `scale(1) rotate(${rot}deg)` },
      ], t, dur, "back");
    },
    // 장면 퇴장
    out(el, t, dur = 0.35) {
      return anim(el, [
        { opacity: 1, transform: "translateY(0)", filter: "blur(0px)" },
        { opacity: 0, transform: "translateY(-24px)", filter: "blur(6px)" },
      ], t, dur, "inOut");
    },
    // 하이라이트 밑줄 그리기 (.hl 요소)
    underline(el, t, dur = 0.5) {
      return anim(el, [
        { backgroundSize: "0% 34%" },
        { backgroundSize: "100% 34%" },
      ], t, dur, "inOut");
    },
    // 글자 타이핑 (일반 텍스트)
    type(el, text, t, cps = 28) {
      const dur = text.length / cps;
      tick((now) => {
        const n = Math.max(0, Math.min(text.length, Math.floor((now - t) * cps)));
        el.textContent = now < t ? "" : text.slice(0, n);
      });
      return dur;
    },
    // 숫자 카운트업
    count(el, to, t, dur, fmt = (n) => n.toLocaleString("ko-KR")) {
      tick((now) => {
        const p = Math.max(0, Math.min(1, (now - t) / dur));
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(to * e));
      });
    },
  };

  // HTML 도우미 ---------------------------------------------------------
  function h(html) {
    const tpl = document.createElement("template");
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  window.TL = TL;
  window.VE = { anim, tick, show, cue, seek, fx, h, EASE };
  window.seek = seek;
})();
