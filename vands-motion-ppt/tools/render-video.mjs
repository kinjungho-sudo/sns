// motion/<이름>.html → assets/video/<이름>.mp4 (1920×1080, 30fps, H.264, 무음) + <이름>-poster.jpg
// 프레임마다 window.seek(n/30)을 부르고 스크린샷을 ffmpeg로 넘긴다. 같은 소스는 항상 같은 영상이 된다.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { serve } from "./server.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url)), FPS = 30;
// 사용: node tools/render-video.mjs [이름 ...]  (기본: sns brain interpret voice)
// 테마: --theme noir|ivory|blush (기본 violet = 원본 motion/<이름>.html)
const argv = process.argv.slice(2), ti = argv.indexOf("--theme"), THEME = ti >= 0 ? argv.splice(ti, 2)[1] : "violet";
const NAMES = argv.length ? argv : ["sns", "brain", "interpret", "voice"];
const SRC = (n) => THEME === "violet" ? `motion/${n}.html` : `motion/${n}.${THEME}.html`;
const DIR = THEME === "violet" ? "assets/video/" : `assets/video/${THEME}/`;
mkdirSync(`${ROOT}${DIR}`, { recursive: true });
const POSTER_AT = { sns: 4.6, brain: 13.5, interpret: 2.8, voice: 8.9 };
const chromiumPath = () => {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const d = existsSync("/opt/pw-browsers") && readdirSync("/opt/pw-browsers").find((x) => /^chromium-\d+$/.test(x));
  return d ? `/opt/pw-browsers/${d}/chrome-linux/chrome` : undefined;   // 없으면 Playwright 기본 브라우저
};
const { srv, url } = await serve(ROOT);
const browser = await chromium.launch({ executablePath: chromiumPath() });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => { console.error("page error:", e.message); process.exitCode = 1; });
for (const name of NAMES) {
  await page.goto(`${url}/${SRC(name)}?render=1`);
  await page.waitForFunction(() => window.__ready === true);
  const frame = page.locator("#frame");
  const DURATION = await page.evaluate(() => window.DURATION), total = Math.round(DURATION * FPS);
  const out = `${ROOT}${DIR}${name}.mp4`;
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(FPS), "-an", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((ok, no) => ff.on("close", (c) => (c ? no(new Error("ffmpeg " + c)) : ok())));
  const t0 = Date.now();
  for (let n = 0; n < total; n++) {
    await page.evaluate((t) => window.seek(t), n / FPS);
    const png = await frame.screenshot({ type: "png" });
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end(); await done;
  // 포스터: 장면 내용이 다 보이는 순간
  await page.evaluate((t) => window.seek(t), POSTER_AT[name] ?? 2);
  await frame.screenshot({ path: `${ROOT}${DIR}${name}-poster.jpg`, type: "jpeg", quality: 88 });
  console.log(`✔ ${DIR}${name}.mp4 (${total} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s)  + ${name}-poster.jpg`);
}
await browser.close(); srv.close();
