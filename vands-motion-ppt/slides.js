/* 3장 슬라이드. 장마다 GSAP 타임라인 하나 = 영상 한 편처럼 재생된다.
   큰 글씨는 줄 단위로 아래에서 솟아오르거나(mask), 글자 단위로 생성된다(chars).
   수치·문구 출처: 기존·신규 홈페이지 진단 보고서(2026.11.03), 기획 스토리보드. 3부는 향후 도입 가상 예시. */
(function () {
  "use strict";
  const A = "assets/";
  // 줄 단위 마스크: <span class="mask"><span>글</span></span>
  const L = (html, cls = "") => `<span class="mask"><span class="${cls}">${html}</span></span>`;
  // 글자 단위: 공백은 그대로 두고 글자마다 span
  const C = (text, cls = "") => `<span class="mask"><span class="${cls}">${[...text].map((c) => (c === " " ? " " : `<span class="ch">${c}</span>`)).join("")}</span></span>`;
  const shot = (img, style, cls = "") => `<div class="shot ${cls}" style="${style}"><img src="${A}${img}" alt=""></div>`;
  const E = { ease: "power4.out" };

  // 화면 전환: 골드 막이 지나감
  function wipe(tl, root, at) {
    const w = root.querySelector(".wipe");
    tl.set(w, { xPercent: -101, visibility: "visible" }, Math.max(0, at - .01))
      .to(w, { xPercent: 0, duration: .32, ease: "power3.in" }, at)
      .to(w, { xPercent: 101, duration: .42, ease: "power3.out" }, at + .34)
      .set(w, { visibility: "hidden" }, at + .8);
  }
  // 줄들이 아래에서 솟아오름
  // 대상이 마스크(.mask)면 그 안의 글자 줄을 움직인다 (마스크가 잘라 내야 아래에서 솟아오르는 효과가 난다)
  const inner = (e) => (e && e.classList && e.classList.contains("mask") ? e.firstElementChild : e);
  const rise = (tl, els, at, stagger = .12, dur = .9) => tl.from([].concat(els).map(inner), { yPercent: 115, duration: dur, stagger, ...E }, at);
  // 글자 생성
  const pop = (tl, els, at, stagger = .045) => tl.from(els, { yPercent: 120, rotate: 8, opacity: 0, duration: .7, stagger, ease: "back.out(1.6)" }, at);
  // 숫자 세기
  function count(tl, el, to, at, dur = 1.4, fmt = (v) => Math.round(v)) {
    const o = { v: 0 }; tl.to(o, { v: to, duration: dur, ease: "expo.out", onUpdate: () => (el.textContent = fmt(o.v)) }, at);
  }
  const show = (tl, layer, at) => tl.set(layer, { autoAlpha: 1 }, at);
  const hide = (tl, layer, at) => tl.set(layer, { autoAlpha: 0 }, at);
  const $ = (root, s) => root.querySelector(s), $$ = (root, s) => [...root.querySelectorAll(s)];

  /* ───────── 1부 · 진단 (34초) ───────── */
  function slide1(root) {
    root.innerHTML = `
    <div class="layer" data-l="a">
      ${shot("homepage.png", "inset:0;border-radius:0", "full")}
      <div class="shade"></div>
      <div class="scanline"></div>
      <div class="tags">${["진료과", "진료시간", "위치", "시술 안내"].map((t, i) => `<span class="chip" style="left:${[1180, 1500, 1260, 1560][i]}px;top:${[260, 400, 640, 760][i]}px">${t}</span>`).join("")}</div>
      <div style="position:absolute;left:110px;top:250px">
        <p class="kicker">${L("AI Search Diagnosis")}</p>
        <h1 class="big" style="font-size:150px;margin-top:34px">${C("AI는")}${C("이 홈페이지를")}${C("어떻게 읽을까?", "gold")}</h1>
      </div>
    </div>
    <div class="layer" data-l="b">
      <p class="kicker" style="position:absolute;left:0;right:0;top:150px;text-align:center">${L("기존 홈페이지 진단 · 2026.11.03")}</p>
      ${[["65", "/100", "홈페이지 준비도", "기초 단계"], ["19", "%", "AI 답변에 나온 비율", "54번 중 10번 언급"], ["96", "%", "병원 정보 정확도", "답한 56건 중 틀림 2건"]].map(([n, u, a, b], i) =>
        `<div class="met" data-i="${i}" style="left:${[150, 750, 1350][i]}px"><div class="num"><b>0</b><small>${u}</small></div><p class="lab">${a}</p><p class="sub">${b}</p></div>`).join("")}
      <p class="note" style="position:absolute;left:0;right:0;top:820px;text-align:center;font-size:30px">${L("서로 다른 세 지표 · 더하거나 평균 내지 않습니다", "muted")}</p>
    </div>
    <div class="layer" data-l="c">
      <div class="four">4</div>
      <p class="kicker" style="position:absolute;left:640px;top:170px">${L("확인된 과제")}</p>
      <ol class="issues">${[["모두닥 정보 불일치", "AI가 14번 참고한 외부 정보가 공식 정보와 다름"], ["화면 ≠ AI가 읽는 진료과", "화면과 AI가 읽는 진료과 정보가 서로 다름"], ["읽을 수 없는 진료시간", "AI가 읽을 수 있는 형식의 진료시간 정보가 없음"], ["Perplexity 접근 제한", "AI 검색 서비스가 홈페이지에 들어오지 못함"]]
        .map(([t, d], i) => `<li><em>0${i + 1}</em><div><b>${t}</b><span>${d}</span></div></li>`).join("")}</ol>
    </div>
    <div class="layer" data-l="d" style="display:grid;place-items:center;text-align:center">
      <div>
        <h2 class="big muted" style="font-size:84px">${L("전면 재구축이 아니라,")}</h2>
        <h2 class="big" style="font-size:150px;margin-top:20px">${C("항목별로 고치고")}${C("같은 질문으로 재측정", "gold")}</h2>
      </div>
    </div>
    <p class="src">출처 · 기존 홈페이지 진단 보고서 (Dr.GEO, 2026.11.03)</p>
    <div class="wipe"></div><div class="vign"></div>`;

    const tl = gsap.timeline({ paused: true });
    const [a, b, c, d] = ["a", "b", "c", "d"].map((k) => $(root, `[data-l="${k}"]`));
    tl.set([b, c, d], { autoAlpha: 0 }, 0);
    // A. 실제 홈페이지가 열리듯 드러나고, AI 스캔선이 훑는다
    tl.fromTo($(a, ".shot"), { clipPath: "inset(48% 48% 48% 48%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" }, 0)
      .fromTo($(a, ".shot img"), { scale: 1.35, filter: "brightness(1)" }, { scale: 1.05, duration: 6.8, ease: "power2.out" }, 0)
      .to($(a, ".shot img"), { filter: "brightness(.45) saturate(.7)", duration: 1.0 }, 1.1)   // 큰 글씨가 나올 때 배경을 눌러 줌
      .from($(a, ".shade"), { opacity: 0, duration: 1 }, .6)
      .fromTo($(a, ".scanline"), { y: -40, autoAlpha: 0 }, { y: 1080, autoAlpha: 1, duration: 2.6, ease: "none" }, 1.4);
    rise(tl, $(a, ".kicker span"), 1.0);
    pop(tl, $$(a, "h1 .ch"), 1.3, .05);
    tl.from($$(a, ".tags .chip"), { scale: 0, autoAlpha: 0, duration: .5, stagger: .35, ease: "back.out(2.4)" }, 2.2);
    wipe(tl, root, 6.5);
    // B. 거대한 숫자가 하나씩 화면을 채운 뒤 제자리 칸으로
    hide(tl, a, 6.85); show(tl, b, 6.85);
    rise(tl, $(b, ".kicker span"), 6.95);
    $$(b, ".met").forEach((m, i) => {
      const at = 7.6 + i * 2.2, dx = 960 - (150 + 210 + i * 600);
      tl.fromTo(m, { x: dx, scale: 2.2, autoAlpha: 0 }, { autoAlpha: 1, duration: .35 }, at)
        .to(m, { x: 0, scale: 1, duration: .9, ease: "expo.inOut" }, at + 1.25);
      count(tl, $(m, "b"), [65, 19, 96][i], at, 1.2);
      tl.from([$(m, ".lab"), $(m, ".sub")], { y: 30, autoAlpha: 0, duration: .5, stagger: .1 }, at + 1.7);
    });
    rise(tl, $(b, ".note span"), 14.6);
    // C. 거대한 4와 과제 네 줄
    tl.to(b, { autoAlpha: 0, scale: .96, duration: .4, ease: "power2.in" }, 16.5);
    show(tl, c, 16.9);
    tl.from($(c, ".four"), { xPercent: -40, autoAlpha: 0, duration: 1.1, ease: "expo.out" }, 16.9);
    rise(tl, $(c, ".kicker span"), 17.2);
    $$(c, ".issues li").forEach((li, i) => tl.from(li, { x: 220, autoAlpha: 0, duration: .8, ease: "expo.out" }, 19.6 + i * 1.6)
      .from($(li, "em"), { scale: 2.4, duration: .6, ease: "back.out(2)" }, 19.6 + i * 1.6));
    // D. 결론 문장
    tl.to(c, { autoAlpha: 0, duration: .35 }, 26.6);
    show(tl, d, 27.0);
    rise(tl, $(d, "h2.muted span"), 27.1);
    pop(tl, $$(d, "h2:not(.muted) .ch"), 27.9, .04);
    tl.set({}, {}, 34);
    return { tl, duration: 34, beats: [0, 6.85, 16.9, 27.0] };
  }

  /* ───────── 2부 · 이번 제공 범위 (32초) ───────── */
  function slide2(root) {
    root.innerHTML = `
    <div class="layer" data-l="a">
      ${shot("new-homepage-hero.png", "left:0;top:0;width:1920px;height:1080px;border-radius:0", "hero")}
      <div class="shade bottom" style="z-index:3"></div>
      <div style="position:absolute;left:110px;bottom:190px;z-index:4">
        <p class="kicker">${L("GEO Website · Draft")}</p>
        <h1 class="big" style="font-size:150px;margin-top:26px">${C("GEO 관점으로")}${C("다시 만든 홈페이지", "gold")}</h1>
      </div>
      <span class="chip solid draftchip" style="position:absolute;left:110px;top:120px;z-index:4">고객 전달 시안 · 최종 확정 전</span>
      <div class="score">
        <p class="kicker">${L("신규 시안 · 홈페이지 AI 검색 준비도")}</p>
        <div class="num83"><b>0</b><small>/100</small><svg viewBox="0 0 700 360"><ellipse cx="350" cy="180" rx="330" ry="150" pathLength="1"/></svg></div>
        <p class="good">${L("양호 단계", "gold")}</p>
        <p class="cmp">${L("측정 조건이 달라 기존 진단(65점)과 전후 비교하지 않습니다", "muted")}</p>
      </div>
    </div>
    <div class="layer" data-l="c">
      <h2 class="big" style="position:absolute;left:110px;top:110px;font-size:118px">${C("AI가 읽는 화면으로")}</h2>
      ${shot("new-treatments.png", "left:110px;top:330px;width:830px;height:520px", "tcard")}
      ${shot("new-location.png", "left:980px;top:330px;width:830px;height:520px", "lcard")}
      <span class="chip" style="position:absolute;left:150px;top:300px">시술 안내</span>
      <span class="chip" style="position:absolute;left:1020px;top:300px">진료시간 · 위치</span>
      <span class="chip solid pend" style="position:absolute;left:50%;top:890px;transform:translateX(-50%)">보완 예정 · 공식 진료과 코드</span>
    </div>
    <div class="layer" data-l="d">
      <p class="kicker" style="position:absolute;left:110px;top:150px">${L("이번 제공 범위")}</p>
      <div class="track"><i class="fill"></i></div>
      ${[["GEO 진단", "수행", 1], ["시안 전달", "전달", 1], ["요구사항 반영", "예정", 0], ["홈페이지 납품", "고객 확인 후", 0]].map(([t, s, done], i) =>
        `<div class="step ${done ? "done" : ""}" style="left:${110 + i * 440}px"><span class="no">0${i + 1}</span><b>${t}</b><span class="chip ${done ? "solid" : ""}">${s}</span></div>`).join("")}
    </div>
    <p class="src">출처 · 신규 시안 진단 보고서 p.1·p.3 (vands-eight.vercel.app, 2026.11.03)</p>
    <div class="wipe"></div><div class="vign"></div>`;

    const tl = gsap.timeline({ paused: true });
    const [a, c, d] = ["a", "c", "d"].map((k) => $(root, `[data-l="${k}"]`));
    const hero = $(a, ".hero");
    tl.set([c, d], { autoAlpha: 0 }, 0).set($(a, ".score"), { autoAlpha: 0 }, 0);
    wipe(tl, root, 0);
    // A. 시안 화면이 화면 가득, 천천히 밀고 들어감
    tl.fromTo($(hero, "img"), { scale: 1.25, filter: "brightness(.42) saturate(.7)" }, { scale: 1.04, duration: 6.5, ease: "power2.out" }, .3)   // 처음엔 어둡게: 큰 글씨가 또렷하게
      .to($(hero, "img"), { filter: "brightness(1) saturate(1)", duration: 1.0 }, 6.4)
      .fromTo($(root, ".src"), { autoAlpha: 0 }, { autoAlpha: 1, duration: .5 }, 7.0);
    rise(tl, $(a, ".kicker span"), .9);
    pop(tl, $$(a, "h1 .ch"), 1.2, .045);
    tl.from($(a, ".draftchip"), { y: -40, autoAlpha: 0, duration: .6, ease: "back.out(2)" }, 2.4);
    // B. 화면 가득하던 시안이 오른쪽 카드로 줄어들고, 왼쪽에 83이 생성
    tl.to([$(a, "h1"), $(a, ".kicker"), $(a, ".shade")], { autoAlpha: 0, duration: .4 }, 6.2)
      .to(hero, { left: 980, top: 230, width: 830, height: 470, borderRadius: 18, duration: 1.1, ease: "expo.inOut" }, 6.4)
      .to(hero, { rotateY: -14, transformPerspective: 1600, duration: 1.4, ease: "power2.out" }, 7.3)
      .set($(a, ".score"), { autoAlpha: 1 }, 6.9);
    rise(tl, $(a, ".score .kicker span"), 6.9);
    tl.from($(a, ".num83"), { scale: 2.6, autoAlpha: 0, duration: 1.0, ease: "expo.out" }, 7.2);
    count(tl, $(a, ".num83 b"), 83, 7.2, 1.4);
    tl.fromTo($(a, ".num83 ellipse"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" }, 8.4);
    rise(tl, $(a, ".good span"), 8.8);
    rise(tl, $(a, ".cmp span"), 10.8);
    // C. 실제 화면 두 장, 확대해서 정보 영역을 보여 줌
    tl.to(a, { autoAlpha: 0, duration: .35 }, 13.9);
    show(tl, c, 14.2);
    pop(tl, $$(c, "h2 .ch"), 14.3, .04);
    tl.from($(c, ".tcard"), { y: 140, rotate: -5, autoAlpha: 0, duration: .9, ease: "expo.out" }, 14.6)
      .from($(c, ".lcard"), { y: 140, rotate: 5, autoAlpha: 0, duration: .9, ease: "expo.out" }, 15.0)
      .from($$(c, ".chip:not(.pend)"), { scale: 0, duration: .45, stagger: .25, ease: "back.out(2.4)" }, 15.6)
      .to($(c, ".tcard img"), { scale: 1.5, xPercent: 8, yPercent: 10, duration: 2.6, ease: "power2.inOut" }, 16.0)
      .to($(c, ".lcard img"), { scale: 1.45, xPercent: -12, yPercent: 6, duration: 2.6, ease: "power2.inOut" }, 17.0)
      .from($(c, ".pend"), { y: 60, autoAlpha: 0, duration: .6, ease: "back.out(2)" }, 18.6);
    // D. 네 단계가 필름처럼 지나가고, 끝난 단계까지 골드 선이 찬다
    tl.to(c, { autoAlpha: 0, duration: .35 }, 21.8);
    show(tl, d, 22.2);
    rise(tl, $(d, ".kicker span"), 22.2);
    tl.from($(d, ".track"), { scaleX: 0, transformOrigin: "left center", duration: .8, ease: "expo.out" }, 22.3);
    $$(d, ".step").forEach((s, i) => tl.from(s, { y: 90, autoAlpha: 0, duration: .8, ease: "expo.out" }, 22.7 + i * .55)
      .from($(s, ".no"), { scale: 2.2, duration: .7, ease: "expo.out" }, 22.7 + i * .55));
    tl.fromTo($(d, ".fill"), { scaleX: 0 }, { scaleX: 1, duration: 1.8, ease: "power2.inOut" }, 25.4);
    tl.to($$(d, ".step:not(.done)"), { y: -10, duration: .5, yoyo: true, repeat: 1, stagger: .2 }, 27.6);
    tl.set({}, {}, 32);
    return { tl, duration: 32, beats: [0, 6.4, 14.2, 22.2] };
  }

  /* ───────── 3부 · 향후 로드맵 (33초, 가상 예시) ───────── */
  function slide3(root) {
    const tiles = ["카드<br>뉴스", "숏폼", "진료<br>안내", "EN", "카드<br>뉴스", "숏폼", "위치", "카드<br>뉴스", "日本語"];
    const bars = Array.from({ length: 64 }, (_, i) => `<i style="height:${30 + Math.round(120 * Math.abs(Math.sin(i * .9) * Math.cos(i * .31)))}px"></i>`).join("");
    root.innerHTML = `
    <span class="chip solid" style="position:absolute;left:110px;top:56px;z-index:45">향후 도입 가상 예시 · 별도 협의 옵션</span>
    <div class="layer" data-l="a" style="display:grid;place-items:center;text-align:center">
      <div><h1 class="big" style="font-size:150px">${C("다음 단계,")}${C("함께 검토할 선택지", "gold")}</h1>
      <div class="trio">${["SNS 콘텐츠", "업무 도우미", "보이스 차트"].map((t) => `<span>${t}</span>`).join("")}</div></div>
    </div>
    <div class="layer" data-l="b">
      <div class="phone"><div class="pf"><i>V</i><div><b>밴스의원 부산점</b><span>예시 피드 · 가상 화면</span></div></div>
        <div class="grid">${tiles.map((t, i) => `<div class="tile t${i % 4}">${t}</div>`).join("")}</div></div>
      <div style="position:absolute;left:820px;top:200px">
        <p class="kicker">${L("SNS 콘텐츠 자동화")}</p>
        <div class="rotor">${["카드뉴스", "숏폼", "다국어 안내"].map((w) => `<h2 class="big gold">${w}</h2>`).join("")}</div>
        <p class="lead">${L("확인된 병원 정보로 AI가 초안을 만들고")}</p>
        <div class="checks">${["의료광고 기준 점검", "담당자 승인", "예약 게시"].map((t) => `<span class="chip"><i>✓</i>${t}</span>`).join("")}</div>
        <p class="like">비슷한 기능 · Canva Magic Studio, Buffer · Hootsuite</p>
      </div>
    </div>
    <div class="layer" data-l="c">
      <div class="ghost">출처와 함께</div>
      <p class="kicker" style="position:absolute;left:110px;top:170px">${L("업무 도우미")}</p>
      <div class="qa">
        <div class="q"><small>상담 직원</small><span></span></div>
        <div class="ans"><span></span><em class="chip">📄 출처 · 공식 병원 정보 · 진료시간</em></div>
      </div>
      <p class="like" style="position:absolute;left:110px;top:900px">비슷한 기능 · Notion AI, ChatGPT 프로젝트, Glean</p>
    </div>
    <div class="layer" data-l="d">
      <p class="kicker" style="position:absolute;left:110px;top:170px">${L("보이스 차트")}</p>
      <div class="words"><h2 class="big">${C("말하면")}</h2><h2 class="big gold">${C("차트 초안")}</h2><h2 class="big">${C("의사가 확인")}</h2></div>
      <div class="wave">${bars}</div>
      <div class="chart paperc"><b>차트 초안 <small>AI 정리 · 가상 예시</small></b>
        ${[["주요 증상", "볼 부위 건조감, 당김"], ["문진 내용", "지난달 보습 크림 변경"], ["소견 · 계획", "의사가 직접 입력"]].map(([k, v], i) => `<label>${k}</label><div class="f${i === 2 ? " todo" : ""}" data-v="${v}"></div>`).join("")}
        <span class="ok">✓ 의사 확인 후 저장</span></div>
      <p class="like" style="position:absolute;left:110px;top:900px">비슷한 기능 · 퍼즐에이아이, 비트컴퓨터 AI 보이스 EMR, Abridge</p>
    </div>
    <div class="layer" data-l="e" style="display:grid;place-items:center;text-align:center">
      <div><p class="muted" style="font-size:34px">${L("모두 별도 협의 옵션입니다")}</p>
      <h2 class="big" style="font-size:150px;margin-top:30px">${C("Dr.GEO × CoMindWorks", "gold")}</h2>
      <p style="font-size:40px;margin-top:26px">${L("밴스의원 부산점")}</p></div>
    </div>
    <div class="wipe"></div><div class="vign"></div>`;

    const tl = gsap.timeline({ paused: true });
    const [a, b, c, d, e] = ["a", "b", "c", "d", "e"].map((k) => $(root, `[data-l="${k}"]`));
    tl.set([b, c, d, e], { autoAlpha: 0 }, 0);
    // A. 제목
    pop(tl, $$(a, "h1 .ch"), .4, .04);
    tl.from($$(a, ".trio span"), { y: 40, autoAlpha: 0, duration: .6, stagger: .2, ease: "expo.out" }, 1.8);
    wipe(tl, root, 4.0);
    // B. SNS: 휴대폰 피드가 채워지고, 오른쪽 큰 단어가 바뀜
    hide(tl, a, 4.35); show(tl, b, 4.35);
    tl.from($(b, ".phone"), { y: 200, rotate: -6, autoAlpha: 0, duration: 1, ease: "expo.out" }, 4.4);
    rise(tl, $(b, ".kicker span"), 4.6);
    const words = $$(b, ".rotor h2");
    words.forEach((w, i) => { const at = 5.0 + i * 1.3;
      tl.fromTo(w, { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .55, ease: "expo.out", immediateRender: false }, at);
      if (i < words.length - 1) tl.to(w, { yPercent: -110, autoAlpha: 0, duration: .45, ease: "power3.in" }, at + 1.0); });
    tl.set(words, { autoAlpha: 0 }, 0);
    rise(tl, $(b, ".lead span"), 5.4);
    tl.from($$(b, ".tile"), { scale: 0, autoAlpha: 0, duration: .4, stagger: .18, ease: "back.out(2)" }, 5.2)
      .from($$(b, ".checks .chip"), { x: 60, autoAlpha: 0, duration: .5, stagger: .6, ease: "back.out(2)" }, 9.0)
      .from($(b, ".like"), { autoAlpha: 0, duration: .6 }, 11.0);
    // C. 업무 도우미: 질문과 답이 타이핑되고, 뒤에 거대한 문구가 흐름
    tl.to(b, { autoAlpha: 0, x: -80, duration: .4, ease: "power2.in" }, 14.5);
    show(tl, c, 14.9);
    tl.fromTo($(c, ".ghost"), { x: 300 }, { x: -500, duration: 8, ease: "none" }, 14.9);
    rise(tl, $(c, ".kicker span"), 15.0);
    tl.from($(c, ".q"), { x: 120, autoAlpha: 0, duration: .5, ease: "expo.out" }, 15.3);
    type(tl, $(c, ".q span"), "주말에도 진료하나요? 손님께 어떻게 안내해요?", 15.5, 1.6);
    tl.from($(c, ".ans"), { x: -120, autoAlpha: 0, duration: .5, ease: "expo.out" }, 17.4);
    type(tl, $(c, ".ans span"), "평일은 20시까지, 토·일요일도 진료합니다. 세부 시간은 공식 병원 정보로 안내해 주세요.", 17.6, 2.4);
    tl.from($(c, ".ans em"), { scale: .5, autoAlpha: 0, duration: .5, ease: "back.out(2)" }, 20.2)
      .from($(c, ".like"), { autoAlpha: 0, duration: .5 }, 20.6);
    // D. 보이스 차트: 파형 → 차트 초안 → 확인
    tl.to(c, { autoAlpha: 0, duration: .35 }, 22.1);
    show(tl, d, 22.4);
    rise(tl, $(d, ".kicker span"), 22.4);
    const hs = $$(d, ".words h2");
    hs.forEach((h, i) => { const at = 22.8 + i * 1.9; tl.set(h, { autoAlpha: 1 }, at); pop(tl, $$(h, ".ch"), at, .05); if (i < 2) tl.to(h, { autoAlpha: 0, duration: .3 }, at + 1.7); });
    tl.set(hs, { autoAlpha: 0 }, 0);
    tl.from($(d, ".wave"), { scaleY: 0, duration: .6, ease: "expo.out" }, 22.6)
      .to($(d, ".wave"), { scaleX: .45, autoAlpha: .5, duration: 1, ease: "expo.inOut" }, 24.6)
      .from($(d, ".chart"), { x: 160, autoAlpha: 0, duration: .8, ease: "expo.out" }, 24.9);
    $$(d, ".chart .f").forEach((f, i) => type(tl, f, f.dataset.v, 25.4 + i * .8, .6));
    tl.from($(d, ".ok"), { autoAlpha: 0, x: -20, duration: .4 }, 27.6).from($(d, ".like"), { autoAlpha: 0, duration: .5 }, 27.8);
    // E. 끝
    tl.to(d, { autoAlpha: 0, duration: .35 }, 28.9);
    show(tl, e, 29.2);
    rise(tl, $(e, "p.muted span"), 29.3);
    pop(tl, $$(e, "h2 .ch"), 29.8, .03);
    rise(tl, $(e, "p:last-child span"), 31.0);
    tl.set({}, {}, 33);
    // 파형은 시각으로 계산 (어느 시점이든 같은 화면)
    const bar = $$(d, ".wave i");
    tl.eventCallback("onUpdate", () => { const t = tl.time(); const on = t > 22.6 && t < 25; bar.forEach((x, i) => (x.style.transform = `scaleY(${on ? .25 + .75 * Math.abs(Math.sin(t * 6 + i * .5)) : .3})`)); });
    return { tl, duration: 33, beats: [0, 4.35, 14.9, 22.4, 29.2] };
  }

  // 글자를 시간에 따라 한 글자씩
  function type(tl, el, text, at, dur) { const o = { n: 0 }; el.textContent = ""; tl.to(o, { n: text.length, duration: dur, ease: "none", onUpdate: () => (el.textContent = text.slice(0, Math.round(o.n))) }, at); }

  window.SLIDES = [slide1, slide2, slide3];
})();
