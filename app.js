/* 인터랙티브 미리보기 뷰어 — 카드 자체(styles.css)와는 분리된 UI 로직 */
(function () {
  const frame = document.getElementById("frame");
  const counter = document.getElementById("counter");
  const picker = document.getElementById("picker");
  const carousels = window.CAROUSELS;
  let cIdx = 0; // 현재 캐러셀
  let sIdx = 0; // 현재 슬라이드

  // 화면 크기에 맞춰 축소 비율 계산 (카드 1350px 기준)
  function fitScale() {
    const avail = Math.min(window.innerHeight - 260, window.innerWidth - 200);
    const s = Math.max(0.2, Math.min(0.6, avail / 1350));
    document.documentElement.style.setProperty("--s", s.toFixed(4));
  }

  function render() {
    const slides = carousels[cIdx].slides;
    frame.innerHTML = "";
    frame.appendChild(window.buildCard(slides[sIdx], sIdx, slides.length));
    counter.textContent = `${carousels[cIdx].title}  ·  ${sIdx + 1} / ${slides.length}`;
    [...picker.children].forEach((b, i) => b.classList.toggle("on", i === cIdx));
  }

  function selectCarousel(i) { cIdx = i; sIdx = 0; render(); }
  function go(delta) {
    const n = carousels[cIdx].slides.length;
    sIdx = (sIdx + delta + n) % n;
    render();
  }

  // 캐러셀 선택 버튼
  carousels.forEach((c, i) => {
    const b = document.createElement("button");
    b.textContent = c.title;
    b.addEventListener("click", () => selectCarousel(i));
    picker.appendChild(b);
  });

  document.getElementById("prev").addEventListener("click", () => go(-1));
  document.getElementById("next").addEventListener("click", () => go(1));
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowUp") selectCarousel((cIdx - 1 + carousels.length) % carousels.length);
    if (e.key === "ArrowDown") selectCarousel((cIdx + 1) % carousels.length);
  });
  window.addEventListener("resize", fitScale);

  fitScale();
  render();
})();
