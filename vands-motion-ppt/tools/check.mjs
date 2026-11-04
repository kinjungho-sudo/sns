// 자동 검사 → review/ 스크린샷 + check-report.txt     node tools/check.mjs
import { chromium } from "playwright";
import { writeFileSync, existsSync, readdirSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url)), URL0 = pathToFileURL(join(ROOT, "index.html")).href;
const lines = [], fails = [];
const log = (ok, name, detail = "") => { const l = `${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`; lines.push(l); console.log(l); if (!ok) fails.push(name); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const exe = process.env.CHROMIUM_PATH || (() => { const d = existsSync("/opt/pw-browsers") && readdirSync("/opt/pw-browsers").find((x) => /^chromium-\d+$/.test(x)); return d ? `/opt/pw-browsers/${d}/chrome-linux/chrome` : undefined; })();
const browser = await chromium.launch({ executablePath: exe, args: ["--autoplay-policy=no-user-gesture-required"] });
rmSync(join(ROOT, "review"), { recursive: true, force: true }); mkdirSync(join(ROOT, "review"), { recursive: true });

async function open(ctx, q = "", hash = 1) {
  const page = await ctx.newPage(), errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text())); page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(`${URL0}${q}#${hash}`); await page.waitForFunction(() => window.__ready);
  return { page, errors };
}

/* 배경음악 */
{
  const f = join(ROOT, "assets/audio/bgm.m4a"), ok = existsSync(f);
  const d = ok ? +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString() : 0;
  log(ok && d > 40, "배경음악 파일 (반복 재생용)", `${d.toFixed(1)}초`);
}

/* 1. 오프라인 더블클릭 · 시작 화면 · 화면에 조작 버튼 없음 · 키보드 조작 */
{
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await ctx.route("**/*", (r) => (r.request().url().startsWith("file:") ? r.continue() : r.abort()));
  const { page, errors } = await open(ctx);
  const st0 = await page.evaluate(() => ({ start: !!document.querySelector("#start"), buttons: document.querySelectorAll("#stage button, footer, nav").length,
    fonts: [...document.fonts].filter((f) => f.family.replace(/"/g, "") === "Pretendard").map((f) => `${f.weight}:${f.status}`) }));
  log(st0.start && st0.buttons === 0, "화면에 조작 버튼·하단바·레일 없음, 시작 화면 표시", `버튼 ${st0.buttons}개`);
  log(["700", "800"].every((w) => st0.fonts.includes(`${w}:loaded`)), "오프라인: 내장 폰트 로드", st0.fonts.join(" "));
  await page.keyboard.press("Space"); await wait(1500);
  const t1 = await page.evaluate(() => [!document.querySelector("#start"), document.querySelector("#cap").textContent, document.querySelector("#bar").style.width]);
  log(t1[0] && t1[1].length > 0 && parseFloat(t1[2]) > 0, "Space로 시작 → 1장 재생, 자막 표시", `자막 "${t1[1]}" · 진행 ${t1[2]}`);
  await page.keyboard.press("Space"); const w1 = await page.evaluate(() => document.querySelector("#bar").style.width); await wait(600);
  const w2 = await page.evaluate(() => document.querySelector("#bar").style.width);
  log(w1 === w2, "Space로 일시정지", `${w1} → ${w2}`);
  await page.keyboard.press("."); const afterBeat = await page.evaluate(() => parseFloat(document.querySelector("#bar").style.width));
  log(afterBeat > parseFloat(w2), ". 키로 다음 장면으로 건너뛰기", `${w2} → ${afterBeat.toFixed(1)}%`);
  await page.keyboard.press("ArrowRight"); await wait(200); const h2 = await page.evaluate(() => [location.hash, document.querySelector(".slide.on").dataset.n]);
  await page.keyboard.press("3"); await wait(200); const h3 = await page.evaluate(() => document.querySelector(".slide.on").dataset.n);
  await page.keyboard.press("ArrowLeft"); await wait(200); const hb = await page.evaluate(() => document.querySelector(".slide.on").dataset.n);
  await page.keyboard.press("c"); const nocap = await page.evaluate(() => document.body.classList.contains("nocap")); await page.keyboard.press("c");
  await page.keyboard.press("?"); const help = await page.evaluate(() => document.querySelector("#help").classList.contains("show")); await page.keyboard.press("Escape");
  log(h2[1] === "2" && h3 === "3" && hb === "2" && nocap && help, "→ ← 1·2·3 장 이동, C 자막, ? 도움말", `→${h2.join(" ")} 3→${h3} ←${hb}`);
  log(errors.length === 0, "오프라인: 콘솔 오류 0건", errors.join(" / "));
  await ctx.close();
}

/* 2. 장마다 장면 끝 무렵 스크린샷 + 글자가 무대 밖으로 나가거나 잘리지 않음 (1920×1080, 1366×768) */
const SHOTS = { 1: [5.5, 15.8, 26, 33.5], 2: [5.8, 13.5, 21.5, 31.5], 3: [3.8, 14, 21.8, 28.6, 32.8] };
for (const [w, h] of [[1920, 1080], [1366, 768]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const bad = [];
  for (const n of [1, 2, 3]) {
    const { page } = await open(ctx, `?render=1&slide=${n}`);
    for (const t of SHOTS[n]) {
      await page.evaluate((t) => window.seek(t), t); await wait(60);
      await page.screenshot({ path: join(ROOT, `review/${w}x${h}-s${n}-${String(t).replace(".", "_")}.png`) });
      const probs = await page.evaluate(() => {
        const out = [], S = document.querySelector("#stage").getBoundingClientRect(), k = S.width / 1920;
        for (const el of document.querySelectorAll(".slide.on .big, .slide.on .chip, .slide.on .kicker, .slide.on .issues b, .slide.on .step b, .slide.on .lab, .slide.on .q, .slide.on .ans, .slide.on .chart, .slide.on .phone, #cap")) {
          const cs = getComputedStyle(el); let vis = cs.visibility !== "hidden"; let a = el; while (vis && a && a !== document.body) { if (+getComputedStyle(a).opacity < .05 || getComputedStyle(a).visibility === "hidden") vis = false; a = a.parentElement; }
          if (!vis || !el.textContent.trim()) continue;
          const r = el.getBoundingClientRect(); if (!r.width) continue;
          if (r.left < S.left - 2 || r.right > S.right + 2 || r.bottom > S.bottom + 2) out.push(`무대 밖: "${el.textContent.trim().slice(0, 16)}" (${Math.round((r.right - S.right) / k)}px)`);
          if (el.scrollWidth > el.clientWidth + 2 && cs.overflow !== "visible") out.push(`잘림: "${el.textContent.trim().slice(0, 16)}"`);
        }
        return out; });
      if (probs.length) bad.push(`${n}장 ${t}s: ${[...new Set(probs)].join(" / ")}`);
    }
    await page.close();
  }
  log(bad.length === 0, `${w}×${h}: 3장 모든 장면에서 글자가 무대 안`, bad.join(" | "));
  await ctx.close();
}

/* 3. 자막: 대본의 모든 줄이 제 시각에 나온다 */
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const miss = [];
  for (const n of [1, 2, 3]) {
    const { page } = await open(ctx, `?render=1&slide=${n}`);
    const L = await page.evaluate((n) => window.NARRATION.slides[n - 1].lines, n);
    for (const l of L) { await page.evaluate((t) => window.seek(t), l.at + .3); await wait(30); const c = await page.evaluate(() => document.querySelector("#cap").textContent); if (c !== l.show) miss.push(`${n}장 ${l.at}s`); }
    await page.close();
  }
  log(miss.length === 0, "자막: 대본 19줄이 모두 제 시각에 표시", miss.join(", "));
  await ctx.close();
}

/* 4. 동작 줄이기: 장을 열면 바로 완성된 화면 */
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, reducedMotion: "reduce" });
  const { page } = await open(ctx, "", 2);
  await page.keyboard.press("Space"); await wait(300);
  const p = await page.evaluate(() => document.querySelector("#bar").style.width);
  log(parseFloat(p) >= 99.9, "동작 줄이기: 장을 열면 바로 완성 화면", p);
  await ctx.close();
}

await browser.close();
writeFileSync(join(ROOT, "review/check-report.txt"), lines.join("\n") + `\n\n${fails.length ? fails.length + "개 실패" : "모두 통과"}\n`);
console.log(fails.length ? `\n✘ ${fails.length}개 실패` : "\n✔ 모두 통과"); process.exitCode = fails.length ? 1 : 0;
