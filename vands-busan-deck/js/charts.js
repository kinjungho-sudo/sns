/* 수치 장(metrics): Chart.js 막대 + 큰 숫자 + 해설 + 보기 버튼 연동
   보기(view)마다 계열(series)·단위·큰 숫자 규칙(max/sum)을 content.json에서 받는다.
   Chart.js는 cdnjs에서 받고, 받지 못하면(오프라인) js/vendor/chart.umd.js 사본을 쓴다. */
(() => {
  "use strict";
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function ensureChart() {
    if (window.Chart) return Promise.resolve(window.Chart);
    return new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = "js/vendor/chart.umd.js"; s.onload = () => ok(window.Chart); s.onerror = () => fail(new Error("Chart.js를 불러오지 못했습니다."));
      document.head.appendChild(s);
    });
  }

  // 큰 숫자는 값을 손으로 적지 않고 계열에서 계산한다
  const bigValue = (view) => {
    const cur = (view.series.find((s) => s.role === "current") || view.series.at(-1)).values;
    switch (view.big.rule) {
      case "sum": return cur.reduce((a, b) => a + b, 0);
      case "product": return cur.reduce((a, b) => a * b, 1);   // 예: 질문 6 × 모델 3 × 반복 3
      case "at": return cur[view.big.index || 0];               // 특정 막대 하나의 값
      default: return Math.max(...cur);
    }
  };

  document.addEventListener("content:ready", async (e) => {
    const C = e.detail, { countUp, RM } = window.SlideFX;
    const Chart = await ensureChart();
    Chart.defaults.font.family = "Pretendard, system-ui, sans-serif";
    Chart.defaults.font.size = 15;
    Chart.defaults.color = css("--muted");
    Chart.defaults.animation.duration = RM ? 0 : 850;
    Chart.defaults.animation.easing = "easeOutCubic";
    const ink = css("--ink"), line = css("--line"), accent = css("--accent"), deep = css("--accent-deep");
    const style = (role) => role === "compare"
      ? { backgroundColor: line, hoverBackgroundColor: "#d9d7e0" }
      : { backgroundColor: accent, hoverBackgroundColor: deep };

    window.DeckCharts = [];
    document.querySelectorAll('.slide[data-type="metrics"]').forEach((el) => {
      const S = C.slides[+el.dataset.slide - 1];
      let vi = S.defaultView || 0;
      const canvas = el.querySelector("canvas"), legend = el.querySelector(".legend"), bigNum = el.querySelector(".big .num"),
        unit = el.querySelector(".big .unit"), label = el.querySelector(".big-label"), notes = el.querySelector(".notes"), btns = el.querySelector(".year-btns");
      const V = () => S.views[vi];
      const datasets = (v) => v.series.map((s) => ({ label: s.name, data: s.values.slice(), borderRadius: 6, borderSkipped: false, ...style(s.role) }));

      const chart = new Chart(canvas, {
        type: "bar",
        data: { labels: V().labels, datasets: datasets(V()) },
        options: {
          responsive: true, maintainAspectRatio: false,
          datasets: { bar: { categoryPercentage: 0.62, barPercentage: 0.9 } },
          layout: { padding: { top: 8 } },
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: ink, padding: 12, cornerRadius: 8, titleFont: { weight: 700 }, displayColors: false,
              callbacks: { label: (c) => `${c.dataset.label}  ${c.parsed.y.toLocaleString("ko-KR")}${V().unit}` } },
          },
          scales: {
            x: { grid: { display: false }, border: { color: line }, ticks: { color: ink, font: { size: 16, weight: 700 } } },
            y: { beginAtZero: true, grid: { color: line }, border: { display: false },
              ticks: { maxTicksLimit: 6, callback: (v) => `${v.toLocaleString("ko-KR")}${V().unit === "%" ? "%" : ""}` } },
          },
        },
      });

      function panel(animate) {
        const v = V(), from = +bigNum.textContent.replace(/[^\d.-]/g, "") || 0;
        bigNum.dataset.count = bigValue(v);
        unit.textContent = v.unit; label.textContent = v.big.label;
        legend.innerHTML = v.series.map((s) => `<span><i class="sw ${s.role === "compare" ? "sw-prev" : "sw-cur"}"></i><b>${esc(s.name)}</b></span>`).join("");
        if (animate) countUp(bigNum, from);
        const html = (v.notes || []).map((n) => `<li>${esc(n)}</li>`).join("");
        if (RM || !notes.innerHTML) notes.innerHTML = html;
        else { notes.classList.add("swap"); setTimeout(() => { notes.innerHTML = html; notes.classList.remove("swap"); }, 200); }
        canvas.setAttribute("aria-label", `${v.button} (${v.unit}): ` + v.labels.map((l, i) => `${l} ${v.series.map((s) => `${s.name} ${s.values[i]}`).join(", ")}`).join(" · "));
      }

      // 보기 버튼: 차트 데이터만 바꿔서 애니메이션, 숫자는 이전 값에서 새 값으로
      btns.innerHTML = S.views.map((v, i) => `<button type="button" data-view="${i}" aria-pressed="${i === vi}">${esc(v.button)}</button>`).join("");
      btns.addEventListener("click", (ev) => {
        const b = ev.target.closest("button[data-view]"); if (!b || +b.dataset.view === vi) return;
        vi = +b.dataset.view;
        btns.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", +x.dataset.view === vi));
        const v = V();
        chart.data.labels = v.labels;
        // 계열 수가 같으면 값만 바꿔 막대가 이어서 움직이고, 다르면 새로 그린다
        if (chart.data.datasets.length === v.series.length) v.series.forEach((s, i) => Object.assign(chart.data.datasets[i], { label: s.name, data: s.values.slice(), ...style(s.role) }));
        else chart.data.datasets = datasets(v);
        chart.update();
        panel(true);
      });

      const refill = () => { chart.reset(); chart.update(); countUp(bigNum); };
      el.querySelector(".chart-wrap").addEventListener("mouseenter", () => { chart.reset(); chart.update(); });
      bigNum.addEventListener("mouseenter", () => countUp(bigNum));
      document.addEventListener("slide:enter", (ev) => { if (ev.detail.el === el) refill(); });

      panel(false);
      window.DeckCharts.push({ el, chart, get view() { return vi; }, bigValue: () => bigValue(V()) });
      if (el.classList.contains("active")) refill();
    });
    document.body.dataset.charts = "1";
  });
})();
