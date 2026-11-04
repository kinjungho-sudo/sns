/* 장 2: Chart.js 막대 차트 + 큰 숫자 + 해설 + 연도 버튼 연동
   Chart.js는 cdnjs에서 받고, 받지 못하면(오프라인) js/vendor/chart.umd.js 사본을 쓴다. */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  function ensureChart() {
    if (window.Chart) return Promise.resolve(window.Chart);
    return new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = "js/vendor/chart.umd.js"; s.onload = () => ok(window.Chart); s.onerror = () => fail(new Error("Chart.js를 불러오지 못했습니다."));
      document.head.appendChild(s);
    });
  }

  document.addEventListener("content:ready", async (e) => {
    const C = e.detail, M = C.metrics, { countUp, RM } = window.SlideFX;
    const Chart = await ensureChart();

    // 숫자는 원자료(분기 값)에서 계산한다. 합계·증감률을 손으로 적지 않는다.
    const years = Object.keys(M.years).sort();
    const prevOf = (y) => years[years.indexOf(y) - 1];
    const total = (y) => M.years[y].quarters.reduce((a, b) => a + b, 0);
    const change = (y) => { const p = prevOf(y); return p ? ((total(y) - total(p)) / total(p)) * 100 : 0; };

    // 전역 글꼴·색을 토큰과 맞춘다
    Chart.defaults.font.family = "Pretendard, system-ui, sans-serif";
    Chart.defaults.font.size = 15;
    Chart.defaults.color = css("--muted");
    Chart.defaults.animation.duration = RM ? 0 : 850;
    Chart.defaults.animation.easing = "easeOutCubic";

    const ink = css("--ink"), line = css("--line"), accent = css("--accent"), deep = css("--accent-deep");
    let year = M.defaultYear;
    const ctx = $("#chart");
    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: M.quarterLabels,
        datasets: [
          { label: prevOf(year), data: M.years[prevOf(year)].quarters, backgroundColor: line, hoverBackgroundColor: "#d9d7e0", borderRadius: 6, borderSkipped: false },
          { label: year, data: M.years[year].quarters, backgroundColor: accent, hoverBackgroundColor: deep, borderRadius: 6, borderSkipped: false },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        datasets: { bar: { categoryPercentage: 0.62, barPercentage: 0.9 } },
        layout: { padding: { top: 8 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: ink, padding: 12, cornerRadius: 8, titleFont: { weight: 700 }, displayColors: false,
            callbacks: { label: (c) => `${c.dataset.label}년  ${c.parsed.y.toLocaleString("ko-KR")}${M.unit}` },
          },
        },
        scales: {
          x: { grid: { display: false }, border: { color: line }, ticks: { color: ink, font: { size: 16, weight: 700 } } },
          // 축 최대값을 모든 해의 최대로 고정: 연도를 바꿔도 같은 눈금이라 막대 높이로 차이가 보인다
          y: { beginAtZero: true, suggestedMax: Math.max(...years.flatMap((k) => M.years[k].quarters)), grid: { color: line }, border: { display: false }, ticks: { maxTicksLimit: 6, callback: (v) => v.toLocaleString("ko-KR") } },
        },
      },
    });

    const bigNum = $("#big-num"), chgNum = $("#chg-num"), notes = $("#notes");
    function describe() {
      const p = prevOf(year);
      ctx.setAttribute("aria-label", `${year}년과 ${p}년 분기별 처리 건수. ` +
        M.quarterLabels.map((q, i) => `${q} ${M.years[year].quarters[i]}${M.unit}(전년 ${M.years[p].quarters[i]})`).join(", "));
    }
    function setPanel(animate) {
      const fromBig = +bigNum.textContent.replace(/[^\d.-]/g, "") || 0, fromChg = +chgNum.textContent.replace(/[^\d.-]/g, "") || 0;
      bigNum.dataset.count = total(year); chgNum.dataset.count = change(year).toFixed(1);
      $("#big-label").textContent = M.bigLabel.replace("{year}", year);
      $("#lg-prev").textContent = `${prevOf(year)}년`; $("#lg-cur").textContent = `${year}년`;
      if (animate) { countUp(bigNum, fromBig); countUp(chgNum, fromChg); }
      const html = (M.years[year].notes || []).map((n) => `<li>${n.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</li>`).join("");
      if (RM || !notes.innerHTML) notes.innerHTML = html;
      else { notes.classList.add("swap"); setTimeout(() => { notes.innerHTML = html; notes.classList.remove("swap"); }, 200); }
      describe();
    }

    // 연도 버튼: 차트 데이터만 바꿔서 애니메이션, 숫자는 이전 값에서 새 값으로 카운트
    const btns = $(".year-btns");
    btns.innerHTML = M.buttons.map((y) => `<button type="button" data-year="${y}" aria-pressed="${y === year}">${y}</button>`).join("");
    btns.addEventListener("click", (ev) => {
      const b = ev.target.closest("button[data-year]"); if (!b || b.dataset.year === year) return;
      year = b.dataset.year;
      btns.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x.dataset.year === year));
      chart.data.datasets[0].label = prevOf(year); chart.data.datasets[0].data = M.years[prevOf(year)].quarters;
      chart.data.datasets[1].label = year; chart.data.datasets[1].data = M.years[year].quarters;
      chart.update();
      setPanel(true);
    });

    // 진입할 때와 마우스를 올릴 때 다시 채우기
    const refill = () => { chart.reset(); chart.update(); countUp(bigNum); countUp(chgNum); };
    $("#chart-wrap").addEventListener("mouseenter", () => { chart.reset(); chart.update(); });
    bigNum.addEventListener("mouseenter", () => countUp(bigNum));
    chgNum.addEventListener("mouseenter", () => countUp(chgNum));
    document.addEventListener("slide:enter", (ev) => { if (ev.detail === 2) refill(); });

    setPanel(false);
    window.DeckChart = { chart, total, change, get year() { return year; } };
    if (document.querySelector(".slide.active")?.dataset.slide === "2") refill();
  });
})();
