/* 인터랙티브 미리보기 뷰어 — 카드 자체(styles.css)와는 분리된 UI 로직 */
(function () {
  const frame = document.getElementById("frame");
  const counter = document.getElementById("counter");
  const total = window.SLIDES.length;
  let cur = 0;

  // 화면 높이에 맞춰 축소 비율 계산 (카드 1350px 기준)
  function fitScale() {
    const avail = Math.min(window.innerHeight - 210, window.innerWidth - 200);
    const s = Math.max(0.2, Math.min(0.62, avail / 1350));
    document.documentElement.style.setProperty("--s", s.toFixed(4));
  }

  function render() {
    frame.innerHTML = "";
    frame.appendChild(window.buildCard(window.SLIDES[cur], cur, total));
    counter.textContent = `${cur + 1} / ${total}`;
  }

  function go(delta) {
    cur = (cur + delta + total) % total;
    render();
  }

  document.getElementById("prev").addEventListener("click", () => go(-1));
  document.getElementById("next").addEventListener("click", () => go(1));
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  });
  window.addEventListener("resize", fitScale);

  fitScale();
  render();
})();
