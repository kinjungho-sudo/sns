// 자동 검사 → review/ 스크린샷 + check-report.txt     실행: node tools/check.mjs
import { chromium } from "playwright";
import { cpSync, mkdtempSync, writeFileSync, existsSync, readdirSync, rmSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const lines = [], fails = [];
const log = (ok, name, detail = "") => { const l = `${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`; lines.push(l); console.log(l); if (!ok) fails.push(name); };
const note = (s) => { lines.push("      " + s); console.log("      " + s); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const exe = process.env.CHROMIUM_PATH || (() => { const d = existsSync("/opt/pw-browsers") && readdirSync("/opt/pw-browsers").find((x) => /^chromium-\d+$/.test(x)); return d ? `/opt/pw-browsers/${d}/chrome-linux/chrome` : undefined; })();
const browser = await chromium.launch({ executablePath: exe, args: ["--autoplay-policy=no-user-gesture-required"] });

/* 영상 사양 */
for (const [name, sec] of [["sns", 17], ["brain", 15], ["interpret", 15], ["voice", 11]]) {
  const p = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", join(ROOT, `assets/video/${name}.mp4`)]).toString());
  const v = p.streams.find((s) => s.codec_type === "video"), audio = p.streams.some((s) => s.codec_type === "audio");
  log(v.codec_name === "h264" && v.width === 1920 && v.height === 1080 && v.r_frame_rate === "30/1" && Math.abs(+p.format.duration - sec) < .05 && !audio,
    `${name} 영상: H.264 · 1920×1080 · 30fps · ${sec}초 · 무음`, `${v.codec_name} ${v.width}×${v.height} ${v.r_frame_rate} ${(+p.format.duration).toFixed(2)}s`);
  const y = execFileSync("ffprobe", ["-v", "error", "-f", "lavfi", "-i", `movie=${join(ROOT, `assets/video/${name}.mp4`)},signalstats`, "-show_entries", "frame_tags=lavfi.signalstats.YAVG", "-of", "csv=p=0"]).toString()
    .split("\n").map((x) => parseFloat(x)).filter((x) => !isNaN(x));
  const jumps = y.filter((v, i) => i && Math.abs(v - y[i - 1]) >= 21.9).length;
  log(jumps <= 3, `${name} 영상: 밝기 급변(프레임 간 10% 이상) 3회 이하`, `${jumps}회`);
}

// 검사 브라우저(Playwright Chromium)는 H.264를 재생하지 못한다. 재생 동작은 같은 영상을 VP9(.mp4)로 바꾼 임시 사본에서 확인한다.
const PLAY = mkdtempSync(join(tmpdir(), "vands-play-"));
for (const f of readdirSync(ROOT)) if (!["node_modules", "review", "verification-original"].includes(f)) cpSync(join(ROOT, f), join(PLAY, f), { recursive: true });
for (const dir of ["", "noir/", "ivory/", "blush/"]) for (const name of ["sns", "brain", "interpret", "voice"]) execFileSync("ffmpeg", ["-v", "error", "-y", "-i", join(ROOT, `assets/video/${dir}${name}.mp4`), "-c:v", "libvpx-vp9", "-b:v", "2M", "-deadline", "realtime", "-cpu-used", "8", "-an", join(PLAY, `assets/video/${dir}${name}.mp4`)]);   // 기본 테마(noir)를 포함해 모든 테마 영상
note("재생 검사는 VP9 임시 사본으로 함 (검사 브라우저가 H.264 미지원, 크롬은 H.264 재생)");

async function open(ctx, root, hash = 1) {
  const page = await ctx.newPage(), errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(pathToFileURL(join(root, "index.html")).href + "?nostart#" + hash);   // 검사에선 첫 화면 '발표 시작' 버튼을 건너뜀
  await page.waitForFunction(() => document.body.dataset.ready);
  return { page, errors };
}
const N = 13;   // 부마다 표지 1 + 1부 4 + 2부 3 + 3부 3

/* 1. 오프라인 더블클릭: 외부 요청 전부 차단, 폰트 로드, 이미지 누락 없음, 3부 시연 영상 자동 재생 */
{
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await ctx.route("**/*", (r) => (r.request().url().startsWith("file:") ? r.continue() : r.abort()));
  const { page, errors } = await open(ctx, PLAY, 13);
  await wait(1600);
  const st = await page.evaluate(() => ({ fonts: [...document.fonts].filter((f) => f.family.replace(/"/g, "") === "Pretendard").map((f) => `${f.weight}:${f.status}`),
    v: (() => { const v = document.querySelector("#scene video"); return { paused: v.paused, t: v.currentTime, muted: v.muted }; })() }));
  log(["400", "700", "800"].every((w) => st.fonts.includes(`${w}:loaded`)), "오프라인: 내장 폰트 로드", st.fonts.join(" "));
  log(!st.v.paused && st.v.t > .5 && st.v.muted, "오프라인: 3부 시연 영상 무음 자동 재생", `${st.v.t.toFixed(2)}s`);
  const deckT = await page.evaluate(() => +document.querySelector("#seek").value);
  log(Math.abs(deckT - st.v.t) < 1, "시연 영상: 장면 진행 막대가 영상 시간을 따라감", `막대 ${deckT.toFixed(2)}s`);
  await page.keyboard.press("."); await wait(300);
  const paused = await page.evaluate(() => [location.hash, document.querySelector("#title").textContent]);
  log(paused[0] === "#14" && paused[1] === "참고 · 만들 수 있는 것들", ". 키: 시연 영상 장면 → 다음 장면", paused.join(" "));
  // 이미지 누락
  let broken = [];
  for (let n = 1; n <= N; n++) { await page.evaluate((n) => (location.hash = String(n)), n); await wait(150);
    await page.evaluate(() => { const s = document.querySelector("#seek"); s.value = s.max; s.dispatchEvent(new Event("input")); });
    broken.push(...await page.evaluate(() => [...document.querySelectorAll("#scene img")].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute("src")))); }
  await wait(300);
  log(broken.length === 0, `오프라인: ${N}개 장면 이미지 누락 없음`, broken.join(", "));
  log(errors.length === 0, "오프라인: 콘솔 오류 0건", errors.join(" / "));
  await ctx.close();
}

/* 2. 두 해상도 × 22장: 마지막 단계 스크린샷, 경계·넘침 */
for (const [w, h] of [[1920, 1080], [1366, 768]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const { page, errors } = await open(ctx, ROOT, 1);
  const bad = [];
  for (let n = 1; n <= N; n++) {
    await page.evaluate((n) => (location.hash = String(n)), n); await wait(200);
    await page.evaluate(() => { const s = document.querySelector("#seek"); s.value = s.max; s.dispatchEvent(new Event("input")); });
    await wait(n === 1 ? 600 : 250);
    await page.screenshot({ path: join(ROOT, `review/${w}x${h}-${String(n).padStart(2, "0")}.png`) });
    const probs = await page.evaluate(() => {
      const out = [], area = document.querySelector("#scene").getBoundingClientRect(), tol = 2;
      for (const el of document.querySelectorAll("#scene .reveal")) { const r = el.getBoundingClientRect(); if (!r.width) continue;
        if (r.left < area.left - tol || r.right > area.right + tol || r.top < area.top - tol || r.bottom > area.bottom + tol) out.push(`장면 밖: ${el.className} (${Math.round(r.bottom - area.bottom)}px)`); }
      for (const el of document.querySelectorAll("#scene *, .heading *, .source *")) { if (el.closest("svg") || ["IMG", "VIDEO"].includes(el.tagName) || !el.clientWidth) continue;
        if (![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
        if (el.scrollWidth > el.clientWidth + 2) out.push(`가로 넘침: "${el.textContent.trim().slice(0, 18)}"`); }
      return out; });
    if (probs.length) bad.push(`#${n}: ${probs.join(" / ")}`);
  }
  log(bad.length === 0, `${w}×${h}: ${N}개 장면 경계·글자 넘침 없음`, bad.join(" | "));
  log(errors.length === 0, `${w}×${h}: 콘솔 오류 0건`, errors.join(" / "));
  await ctx.close();
}

/* 3. 이동·재생 */
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 930 } });
  const { page, errors } = await open(ctx, PLAY, 1);
  const T = () => page.evaluate(() => +document.querySelector("#seek").value), H = () => page.evaluate(() => location.hash);
  const ui = await page.evaluate(() => ["footer", "#rail", "#theme-select"].map((q) => { const e = document.querySelector(q); return e ? getComputedStyle(e).display : "없음"; }));
  log(ui[0] === "none" && ui[1] === "none" && ui[2] === "없음", "하단 조작 막대·좌측 번호 숨김, 테마 선택 없음", ui.join(" / "));
  await page.keyboard.press("Space"); await wait(6600); const auto = await H();   // 표지(내레이션 길이에 맞춰 약 5.8초) 뒤 다음 장면으로 자동 진행
  await page.keyboard.press("Space");
  log(auto === "#2", "Space 재생: 부 안에서 다음 장면으로 자동 진행", auto);
  await page.keyboard.press("."); const dot = await H();
  await page.keyboard.press("ArrowRight"); const p2 = await H();
  await page.keyboard.press("ArrowRight"); const p3 = await H();
  await page.keyboard.press("ArrowLeft"); const pb = await H();
  await page.keyboard.press("1"); const k1 = await H();
  await page.click('[data-part="3"]'); const c3 = await page.evaluate(() => [location.hash, document.querySelectorAll("#rail button").length]);
  await page.keyboard.press("End"); const end = await H();
  await page.reload(); await page.waitForFunction(() => document.body.dataset.ready); const kept = await H();
  log(dot === "#3" && p2 === "#7" && p3 === "#12" && pb === "#7" && k1 === "#1" && c3[0] === "#12" && c3[1] === 5, ". 장면 이동, → ← 부 이동, 숫자·탭으로 부 바로 가기", `. ${dot} → ${p2} → ${p3} ← ${pb} 1 ${k1} 탭3 ${c3.join("/")}`);
  log(end === "#16" && kept === "#16", "End, 새로고침 후 장면 유지", `${end} ${kept}`);
  // 시연 영상 장면을 떠나면 영상 정지
  await page.evaluate(() => (location.hash = "13")); await wait(1200);
  const before = await page.evaluate(() => !document.querySelector("#scene video").paused);
  const vid = await page.evaluateHandle(() => document.querySelector("#scene video"));
  await page.keyboard.press("."); await wait(300);
  const after = await vid.evaluate((v) => v.paused);
  log(before && after, "시연 영상: 다른 장면으로 가면 영상 정지");
  for (const n of [13, 14, 15, 16]) {
    await page.evaluate((n) => (location.hash = String(n)), n); await wait(1300);
    const st = await page.evaluate(() => { const v = document.querySelector("#scene video"); return v ? [v.paused, v.currentTime, v.getAttribute("src")] : null; });
    log(st && !st[0] && st[1] > .5, `3부 #${n}: 시연 영상 자동 재생`, st ? `${st[2]} ${st[1].toFixed(2)}s` : "영상 없음");
  }
  await page.evaluate(() => (location.hash = "13")); await wait(800);
  await page.click("#scene video"); await wait(300);
  const big = await page.evaluate(() => { const p = document.querySelector(".player.big"); return p ? [true, Math.round(p.getBoundingClientRect().width), innerWidth] : [false, 0, innerWidth]; });
  await page.click(".player video"); await wait(300);
  const small = await page.evaluate(() => !!document.querySelector(".player.big") || !document.querySelector("#scene .player"));
  log(big[0] && big[1] >= big[2] - 2 && !small, "시연 영상: 클릭하면 화면 가득, 다시 클릭하면 원래대로", `${big.join(" ")} → ${small}`);
  log(errors.length === 0, "이동·재생 중 콘솔 오류 0건", errors.join(" / "));
  await ctx.close();
}

/* 테마: 4종 모두 오류 없이 열리고, 테마별 영상 경로를 쓴다 · 대표 장면 스크린샷 */
{
  mkdirSync(join(ROOT, "review/themes"), { recursive: true });
  for (const th of ["violet", "noir", "ivory", "blush"]) {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 930 } });
    const page = await ctx.newPage(), errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text())); page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(pathToFileURL(join(ROOT, "index.html")).href + `?theme=${th}&nostart#13`); await page.waitForFunction(() => document.body.dataset.ready);
    const src = await page.evaluate(() => [document.querySelector("#theme-css").getAttribute("href"), document.querySelector("#scene video").getAttribute("src")]);
    const vidOk = existsSync(join(ROOT, src[1]));
    for (const n of [1, 4, 8, 11]) {
      await page.evaluate((n) => (location.hash = String(n)), n); await wait(200);
      await page.evaluate(() => { const s = document.querySelector("#seek"); s.value = s.max; s.dispatchEvent(new Event("input")); }); await wait(250);
      await page.screenshot({ path: join(ROOT, `review/themes/${th}-${String(n).padStart(2, "0")}.png`) });
    }
    log(errors.length === 0 && vidOk, `테마 ${th}: 오류 없이 열림, 영상 파일 있음`, `${src.join(" · ")}${errors.length ? " / " + errors.join(" / ") : ""}`);
    await ctx.close();
  }
}

/* 확대·축소: 화면 캡처 클릭 → 커짐, 다시 클릭(또는 Esc) → 원래 칸 */
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 930 } });
  const { page } = await open(ctx, ROOT, 2);
  await page.evaluate(() => { const s = document.querySelector("#seek"); s.value = s.max; s.dispatchEvent(new Event("input")); }); await wait(200);
  const sz = () => page.evaluate(() => document.querySelector("#scene .zoomable").getBoundingClientRect().width);
  const w0 = await sz(); await page.click("#scene .zoomable"); await wait(800); const w1 = await sz();
  await page.keyboard.press("Escape"); await wait(800); const w2 = await sz();
  // 등장 연출: 장면 시작 직후에는 칸보다 크게, 2초 뒤에는 원래 칸
  await page.evaluate(() => { const s = document.querySelector("#seek"); s.value = 0.5; s.dispatchEvent(new Event("input")); }); await wait(100); const e0 = await sz();
  log(w1 > w0 * 1.2 && Math.abs(w2 - w0) < 2 && e0 > w0 * 1.2, "화면 캡처: 크게 등장 → 칸으로, 클릭 확대 · Esc 복귀", `칸 ${w0.toFixed(0)}px, 등장 ${e0.toFixed(0)}px, 클릭 ${w1.toFixed(0)}px, 복귀 ${w2.toFixed(0)}px`);
  await ctx.close();
}

/* 4. 동작 줄이기: 처음부터 완성 상태, 시연 영상 자동 재생 안 함 */
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 930 }, reducedMotion: "reduce" });
  const { page } = await open(ctx, PLAY, 5);
  await wait(200);
  const st = await page.evaluate(() => ({ nums: [...document.querySelectorAll(".metric strong")].map((s) => s.firstChild.textContent), op: [...document.querySelectorAll("#scene .reveal")].every((e) => e.style.opacity === "1") }));
  await page.evaluate(() => (location.hash = "13")); await wait(800);
  const v = await page.evaluate(() => document.querySelector("#scene video").paused);
  log(st.nums.join(",") === "65,19,96" && st.op && v, "동작 줄이기: 점수·요소가 바로 완성, 시연 영상 자동 재생 안 함", `${st.nums.join(",")} 영상 정지 ${v}`);
  await ctx.close();
}

await browser.close(); rmSync(PLAY, { recursive: true, force: true });
writeFileSync(join(ROOT, "review/check-report.txt"), lines.join("\n") + `\n\n${fails.length ? fails.length + "개 실패" : "모두 통과"}\n`);
console.log(fails.length ? `\n✘ ${fails.length}개 실패` : "\n✔ 모두 통과"); process.exitCode = fails.length ? 1 : 0;
