// 테마: 주소의 ?theme= → 지난번 선택 → 기본(violet). 테마마다 themes/<이름>.css와 assets/video/<이름>/ 영상을 쓴다.
(function () {
  const THEMES = { violet: "바이올렛 (원본)", noir: "블랙 · 샴페인 골드", ivory: "아이보리 · 골드", blush: "누드 · 로즈골드" };
  let saved = null; try { saved = localStorage.getItem("vands-theme"); } catch {}
  const q = new URLSearchParams(location.search).get("theme");
  const theme = THEMES[q] ? q : THEMES[saved] ? saved : "violet";
  try { localStorage.setItem("vands-theme", theme); } catch {}
  window.THEME = theme; window.THEMES = THEMES;
  document.documentElement.dataset.theme = theme;
  if (theme !== "violet") document.getElementById("theme-css").href = `themes/${theme}.css`;
  // 영상 경로: 바이올렛은 assets/video/, 다른 테마는 assets/video/<테마>/
  window.vid = (name, ext = ".mp4") => (theme === "violet" ? "assets/video/" : `assets/video/${theme}/`) + name + ext;
  addEventListener("DOMContentLoaded", () => {
    const sel = document.getElementById("theme-select"); if (!sel) return;
    sel.innerHTML = Object.entries(THEMES).map(([k, v]) => `<option value="${k}"${k === theme ? " selected" : ""}>${v}</option>`).join("");
    sel.onchange = () => { const u = new URL(location.href); u.searchParams.set("theme", sel.value); location.href = u.toString(); };
  });
})();
