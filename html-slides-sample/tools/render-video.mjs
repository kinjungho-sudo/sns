// motion/promo.html → assets/video/promo.mp4 (15초, 1920×1080, 30fps, H.264, 무음) + promo-poster.jpg
// 프레임마다 window.seek(n/30)을 부르고 스크린샷을 ffmpeg로 넘긴다. 같은 소스는 항상 같은 영상이 된다.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { serve } from "./server.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url)), FPS = 30;
const chromiumPath = () => {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const d = existsSync("/opt/pw-browsers") && readdirSync("/opt/pw-browsers").find((x) => /^chromium-\d+$/.test(x));
  return d ? `/opt/pw-browsers/${d}/chrome-linux/chrome` : undefined;   // 없으면 Playwright 기본 브라우저
};
const { srv, url } = await serve(ROOT);
const browser = await chromium.launch({ executablePath: chromiumPath() });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => { console.error("page error:", e.message); process.exitCode = 1; });
await page.goto(`${url}/motion/promo.html?render=1`);
await page.waitForFunction(() => window.__ready === true);
const frame = page.locator("#frame");
const DURATION = await page.evaluate(() => window.DURATION), total = Math.round(DURATION * FPS);

const out = `${ROOT}assets/video/promo.mp4`;
const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(FPS), "-an", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((ok, no) => ff.on("close", (c) => (c ? no(new Error("ffmpeg " + c)) : ok())));
const t0 = Date.now();
for (let n = 0; n < total; n++) {
  await page.evaluate((t) => window.seek(t), n / FPS);
  const png = await frame.screenshot({ type: "png" });
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
  if (n % (FPS * 3) === 0) console.log(`  frame ${n}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end(); await done;
// 포스터: 첫 장면(키워드가 다 나온 순간)
await page.evaluate((t) => window.seek(t), 2.3);
await frame.screenshot({ path: `${ROOT}assets/video/promo-poster.jpg`, type: "jpeg", quality: 88 });
await browser.close(); srv.close();
console.log(`✔ assets/video/promo.mp4 (${total} frames @ ${FPS}fps)  ✔ assets/video/promo-poster.jpg`);
