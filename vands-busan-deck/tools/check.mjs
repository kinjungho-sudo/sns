// 완료 기준 자동 검사 → review/ 에 스크린샷과 check-report.txt
// node tools/check.mjs
import { chromium } from "playwright";
import { cpSync, mkdtempSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { serve } from "./server.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CDN = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
const lines = [], fails = [];
const CONTENT = JSON.parse(readFileSync(join(ROOT, "content.json"), "utf8"));
const N = CONTENT.slides.length, idx = (type) => CONTENT.slides.findIndex((s) => s.type === type) + 1;
const METRICS = idx("metrics"), VIDEO = idx("video");
// 큰 숫자 기대값: js/charts.js와 같은 규칙으로 content.json에서 계산
const bigOf = (v) => { const cur = (v.series.find((x) => x.role === "current") || v.series.at(-1)).values;
  return { sum: cur.reduce((a, b) => a + b, 0), product: cur.reduce((a, b) => a * b, 1), at: cur[v.big.index || 0] }[v.big.rule] ?? Math.max(...cur); };
const MV = CONTENT.slides[METRICS - 1].views, DEF = CONTENT.slides[METRICS - 1].defaultView || 0;
const log = (ok, name, detail = "") => { const l = `${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`; lines.push(l); console.log(l); if (!ok) fails.push(name); };
const note = (s) => { lines.push("      " + s); console.log("      " + s); };
const chromiumPath = () => {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const d = existsSync("/opt/pw-browsers") && readdirSync("/opt/pw-browsers").find((x) => /^chromium-\d+$/.test(x));
  return d ? `/opt/pw-browsers/${d}/chrome-linux/chrome` : undefined;
};
const browser = await chromium.launch({ executablePath: chromiumPath(), args: ["--autoplay-policy=no-user-gesture-required"] });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* 0. 영상 파일 사양 (실제 결과물) */
{
  const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", join(ROOT, "assets/video/promo.mp4")]).toString());
  const v = probe.streams.find((s) => s.codec_type === "video"), audio = probe.streams.some((s) => s.codec_type === "audio");
  const ok = v.codec_name === "h264" && v.width === 1920 && v.height === 1080 && v.r_frame_rate === "30/1" && Math.abs(+probe.format.duration - 15) < 0.05 && !audio && v.pix_fmt === "yuv420p";
  log(ok, "영상 사양: H.264 · 1920×1080 · 30fps · 15초 · 무음", `${v.codec_name} ${v.width}×${v.height} ${v.r_frame_rate} ${(+probe.format.duration).toFixed(2)}s 오디오 ${audio ? "있음" : "없음"}`);
  log(existsSync(join(ROOT, "assets/video/promo-poster.jpg")), "영상 포스터 promo-poster.jpg");
}

/* 검사용 브라우저(Playwright Chromium)는 특허 문제로 H.264를 재생하지 못한다. 크롬은 재생한다.
   그래서 재생 동작 검사는 같은 영상을 VP9(같은 .mp4 컨테이너)로 바꾼 임시 사본에서 한다. 결과물 파일은 그대로 둔다. */
const PLAY_ROOT = mkdtempSync(join(tmpdir(), "slides-play-"));
for (const f of ["index.html", "content.json", "css", "js", "assets", "tools"]) cpSync(join(ROOT, f), join(PLAY_ROOT, f), { recursive: true });
{
  const p = await (await browser.newContext()).newPage();
  const h264 = await p.evaluate(() => document.createElement("video").canPlayType('video/mp4; codecs="avc1.640028"'));
  if (!h264) {
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", join(ROOT, "assets/video/promo.mp4"), "-c:v", "libvpx-vp9", "-b:v", "2M", "-deadline", "realtime", "-cpu-used", "8", "-an", join(PLAY_ROOT, "assets/video/promo.mp4")]);
    note("검사 브라우저가 H.264를 못 읽어 재생 검사는 VP9 임시 사본으로 함 (실제 크롬은 H.264 재생)");
  }
}

async function open(ctx, url, { cdnLocal = true } = {}) {
  const page = await ctx.newPage(), errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  if (cdnLocal) await page.route(CDN, (r) => r.fulfill({ path: join(ROOT, "js/vendor/chart.umd.js"), contentType: "text/javascript" }));
  await page.goto(url);
  await page.waitForFunction(() => document.body.dataset.ready);
  return { page, errors };
}

// 겹침·넘침: 장 안의 [data-box] 끼리 겹치지 않고, 장 영역 밖으로 나가지 않고, 글자가 상자를 넘치지 않는다
const layoutProblems = (page) => page.evaluate(() => {
  const out = [], slide = document.querySelector(".slide.active"), area = slide.getBoundingClientRect();
  const boxes = [...slide.querySelectorAll("[data-box]")].map((el) => ({ el, r: el.getBoundingClientRect() }));
  const name = (el) => el.className || el.tagName;
  for (let i = 0; i < boxes.length; i++) {
    const a = boxes[i].r;
    if (a.left < area.left - 1 || a.right > area.right + 1 || a.top < area.top - 1 || a.bottom > area.bottom + 1) out.push(`영역 밖: ${name(boxes[i].el)}`);
    for (let j = i + 1; j < boxes.length; j++) {
      const b = boxes[j].r;
      if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) out.push(`겹침: ${name(boxes[i].el)} ↔ ${name(boxes[j].el)}`);
    }
  }
  const scope = [...slide.querySelectorAll("*"), ...document.querySelectorAll(".topbar *, .bottombar *")];
  for (const el of scope) {
    if (el.closest("svg") || el.tagName === "CANVAS" || el.tagName === "VIDEO" || !el.clientWidth) continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2) out.push(`글자 넘침: ${name(el)} "${el.textContent.trim().slice(0, 20)}"`);
    const r = el.getBoundingClientRect();
    if (el.closest(".slide") && (r.right > area.right + 1 || r.bottom > area.bottom + 1)) out.push(`장 밖으로 나간 글자: "${el.textContent.trim().slice(0, 20)}"`);
  }
  return out;
});

/* 1. 오프라인 더블클릭 (file://, 외부 요청 전부 차단) */
{
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await ctx.route("**/*", (r) => (r.request().url().startsWith("file:") ? r.continue() : r.abort()));
  const { page, errors } = await open(ctx, pathToFileURL(join(PLAY_ROOT, "index.html")).href + "#" + METRICS, { cdnLocal: false });
  await page.evaluate(() => document.fonts.ready);
  await wait(1500);
  const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.family.replace(/"/g, "") === "Pretendard").map((f) => `${f.weight}:${f.status}`));
  const need = ["400", "700", "800"].every((w) => fonts.includes(`${w}:loaded`));
  log(need, "1. 오프라인 file://: Pretendard 내장 폰트 로드", fonts.join(" "));
  const chartOk = await page.evaluate(() => (window.DeckCharts || []).length > 0 && window.DeckCharts[0].chart.data.datasets[0].data.length > 0);
  log(chartOk, "1. 오프라인 file://: CDN 실패 시 로컬 Chart.js 사본으로 차트 표시");
  await page.evaluate((n) => (location.hash = String(n)), VIDEO); await wait(1500);
  const v = await page.evaluate(() => { const v = document.querySelector(".slide.active video"); return { rs: v.readyState, paused: v.paused, t: v.currentTime, d: v.duration }; });
  log(v.rs >= 2 && !v.paused && v.t > 0.3, "1. 오프라인 file://: 영상 재생", `readyState ${v.rs}, ${v.t.toFixed(2)}s / ${v.d}s`);
  const other = errors.filter((e) => !/Failed to load resource/.test(e));
  log(other.length === 0, "1. 오프라인 file://: CDN 차단 외 오류 없음", errors.length ? `차단된 CDN 요청 로그 ${errors.length - other.length}건 (예상됨)` : "");
  other.forEach(note);
  await ctx.close();
}

/* 2·5. 1920×1080, 1366×768 스크린샷 + 넘침·겹침 + 콘솔 오류 */
const { srv, url } = await serve(ROOT);
for (const [w, h] of [[1920, 1080], [1366, 768]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const { page, errors } = await open(ctx, `${url}/index.html#1`);
  for (let n = 1; n <= N; n++) {
    await page.evaluate((n) => (location.hash = String(n)), n);
    await wait(n === 1 ? 2300 : 1800);   // 등장·흐름선·카운트업이 끝난 뒤
    await page.screenshot({ path: join(ROOT, `review/${w}x${h}-slide${n}.png`) });
    const probs = await layoutProblems(page);
    log(probs.length === 0, `2. ${w}×${h} 장 ${n}: 글자 넘침·겹침 없음`, probs.join(" / "));
  }
  log(errors.length === 0, `5. ${w}×${h}: 콘솔 오류 0건`, errors.join(" / "));
  await ctx.close();
}

/* 3. 보기 버튼이 차트·숫자·해설을 모두 바꾼다 */
{
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const { page, errors } = await open(ctx, `${url}/index.html#${METRICS}`);
  await wait(1500);
  const views = CONTENT.slides[METRICS - 1].views, seen = [];
  for (let i = 0; i < views.length; i++) {
    if (i !== (CONTENT.slides[METRICS - 1].defaultView || 0) || seen.length) await page.click(`.slide.active .year-btns button[data-view="${i}"]`);
    await wait(1400);
    seen.push(await page.evaluate(() => { const el = document.querySelector(".slide.active"), c = window.DeckCharts[0].chart;
      return { big: el.querySelector(".big .num").textContent, unit: el.querySelector(".big .unit").textContent, notes: el.querySelector(".notes").textContent,
        data: c.data.datasets.map((d) => d.data.join(",")).join("|"), labels: c.data.labels.join(",") }; }));
    await page.screenshot({ path: join(ROOT, `review/metrics-view-${i + 1}.png`) });
  }
  const distinct = (k) => new Set(seen.map((x) => x[k])).size === views.length;
  const expect = views.map((v) => bigOf(v).toLocaleString("ko-KR"));
  log(distinct("data") && distinct("labels"), `3. 보기 버튼 ${views.length}개: 차트 데이터가 바뀜`, seen.map((x) => x.labels).join(" | "));
  log(seen.every((x, i) => x.big === expect[i]), `3. 보기 버튼 ${views.length}개: 큰 숫자가 계열에서 계산한 값과 일치`, seen.map((x) => x.big + x.unit).join(", "));
  log(distinct("notes"), `3. 보기 버튼 ${views.length}개: 해설이 바뀜`);
  log(errors.length === 0, "5. 버튼 조작 중 콘솔 오류 0건", errors.join(" / "));
  await ctx.close();
}

/* 4. 장 3 진입 시 자동 재생, 이탈 시 정지 · 네비게이션 · 편집 모드 */
{
  const sp = await serve(PLAY_ROOT);
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, hasTouch: true });
  const { page, errors } = await open(ctx, `${sp.url}/index.html#1`);
  await page.keyboard.press("ArrowRight"); await wait(300);
  const h2 = await page.evaluate(() => location.hash);
  await page.evaluate((n) => (location.hash = String(n - 1)), VIDEO); await wait(300);
  await page.keyboard.press("PageDown"); await wait(1500);
  const playing = await page.evaluate(() => { const v = document.querySelector(".slide.active video"); return { paused: v.paused, t: v.currentTime, muted: v.muted }; });
  log(!playing.paused && playing.t > 0.5 && playing.muted, "4. 영상 장 진입: 무음 자동 재생", `${playing.t.toFixed(2)}s, muted ${playing.muted}`);
  await page.keyboard.press("PageUp"); await wait(400);
  const paused = await page.evaluate((n) => document.querySelectorAll(".slide")[n - 1].querySelector("video").paused, VIDEO);
  log(paused, "4. 영상 장 이탈: 영상 정지");
  await page.click('.rail button[data-go="1"]'); await wait(200);
  const h1 = await page.evaluate(() => location.hash);
  await page.click("#next"); await wait(200);
  const hNext = await page.evaluate(() => location.hash);
  await page.reload(); await page.waitForFunction(() => document.body.dataset.ready);
  const kept = await page.evaluate(() => [location.hash, document.querySelector(".slide.active").dataset.slide]);
  await page.evaluate(() => (location.hash = "2")); await wait(200);
  // 스와이프: 왼쪽으로 밀면 다음 장
  await page.evaluate(() => {
    const t = (x) => [new Touch({ identifier: 1, target: document.body, clientX: x, clientY: 500 })];
    dispatchEvent(new TouchEvent("touchstart", { touches: t(900), changedTouches: t(900) }));
    dispatchEvent(new TouchEvent("touchend", { touches: [], changedTouches: t(600) }));
  });
  await wait(200);
  const hSwipe = await page.evaluate(() => location.hash);
  log(h2 === "#2" && h1 === "#1" && hNext === "#2" && kept[0] === "#2" && kept[1] === "2" && hSwipe === "#3",
    "7. 이동: ←/→·PageUp/Down·레일·하단 버튼·스와이프·해시 유지", `→${h2} 레일${h1} 다음${hNext} 새로고침${kept.join("/")} 스와이프${hSwipe}`);
  await page.keyboard.press("e"); await wait(100);
  const ed = await page.evaluate(() => ({ bar: !document.querySelector("#edit-bar").hidden, n: document.querySelectorAll('[contenteditable="plaintext-only"]').length }));
  await page.keyboard.press("e");
  log(ed.bar && ed.n > 10, "7. 편집 모드: E로 켜고 끄기", `편집 가능한 글자 ${ed.n}곳`);
  log(errors.length === 0, "5. 이동·영상 조작 중 콘솔 오류 0건", errors.join(" / "));
  await ctx.close(); sp.srv.close();
}

/* 동작 줄이기: 애니메이션 0 */
{
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: "reduce" });
  const { page } = await open(ctx, `${url}/index.html#${METRICS}`);
  await wait(300);
  const rm = await page.evaluate(() => ({ big: document.querySelector(".slide.active .big .num").textContent, tr: getComputedStyle(document.querySelector(".slide")).transitionDuration,
    anim: window.DeckCharts?.[0]?.chart.options.animation.duration }));
  log(rm.big === bigOf(MV[DEF]).toLocaleString("ko-KR") && /^0s(, 0s)*$/.test(rm.tr) && rm.anim === 0, "동작 줄이기: 전환·카운트업·차트 애니메이션 0", JSON.stringify(rm));
  await ctx.close();
}

/* 6. content.json 문구 하나를 바꾸면 코드 수정 없이 반영 */
{
  const tmp = mkdtempSync(join(tmpdir(), "slides-"));
  for (const f of ["index.html", "content.json", "css", "js", "assets", "tools"]) cpSync(join(ROOT, f), join(tmp, f), { recursive: true });
  const c = JSON.parse(readFileSync(join(tmp, "content.json"), "utf8"));
  c.slides[METRICS - 1].title = "바뀐 *제목* 확인용"; const cv = c.slides[METRICS - 1].views[DEF], cs = cv.series.find((x) => x.role === "current") || cv.series.at(-1); cs.values = cs.values.map((x) => x + 1);
  const want = bigOf(cv).toLocaleString("ko-KR");
  writeFileSync(join(tmp, "content.json"), JSON.stringify(c, null, 2));
  const s2 = await serve(tmp);
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const { page } = await open(ctx, `${s2.url}/index.html#${METRICS}`);
  await wait(1500);
  const got = await page.evaluate(() => [document.querySelector(".slide.active .title").innerHTML, document.querySelector(".slide.active .big .num").textContent]);
  log(got[0] === "바뀐 <em>제목</em> 확인용" && got[1] === want, "6. content.json 수정 → 서버로 열면 바로 반영", got.join(" · "));
  execFileSync("node", [join(tmp, "tools/sync-content.mjs")]);
  const { page: p2 } = await open(ctx, pathToFileURL(join(tmp, "index.html")).href + "#" + METRICS);
  const got2 = await p2.evaluate(() => document.querySelector(".slide.active .title").textContent);
  log(got2 === "바뀐 제목 확인용", "6. content.json 수정 → sync 후 더블클릭(file://)으로도 반영", got2);
  await ctx.close(); s2.srv.close(); rmSync(tmp, { recursive: true, force: true });
}

/* 색 대비 (WCAG): 토큰 조합 */
{
  const L = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const cr = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const pairs = [["ink / bg (제목·본문)", "#292a33", "#ffffff", 4.5], ["accent / bg (강조어, 큰 글자)", "#e81768", "#ffffff", 3], ["흰 글자 / accent (버튼, 굵은 20px = 큰 글자)", "#ffffff", "#e81768", 3],
    ["accent-deep / bg (예시 데이터 표시)", "#920951", "#ffffff", 4.5], ["ink / accent-pale (주의 박스)", "#292a33", "#fbedf3", 4.5]];
  for (const [n, a, b, need] of pairs) { const r = cr(a, b); log(r >= need, `대비 ${n}`, `${r.toFixed(2)}:1 (기준 ${need}:1)`); }
  // --muted 는 설계 문서가 정한 토큰이라 그대로 두고 경고만 남긴다
  const m = cr("#787983", "#ffffff");
  const warn = `WARN  대비 muted / bg (부제·출처·축 글자)  — ${m.toFixed(2)}:1, 작은 글자 기준 4.5:1에 조금 못 미침. 설계 토큰을 유지함 (#737480 이면 ${cr("#737480", "#ffffff").toFixed(2)}:1)`;
  lines.push(warn); console.log(warn);
}

srv.close(); await browser.close(); rmSync(PLAY_ROOT, { recursive: true, force: true });
writeFileSync(join(ROOT, "review/check-report.txt"), lines.join("\n") + `\n\n${fails.length ? fails.length + "개 실패" : "모두 통과"}\n`);
console.log(fails.length ? `\n✘ ${fails.length}개 실패` : "\n✔ 모두 통과"); process.exitCode = fails.length ? 1 : 0;
