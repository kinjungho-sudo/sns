/* 쇼츠 쇼릴을 MP4 로 내보내기 (사전 설치된 Chromium + ffmpeg)
   실행: npm run reel            →  out/reel/reel.mp4 (1080×1920, 30fps) + 씬별 스틸 PNG
   옵션: START=10 END=18 npm run reel   특정 구간만 (초)
         STILLS=1 npm run reel         MP4 없이 스틸만
   프레임은 디스크에 쓰지 않고 ffmpeg 표준입력으로 바로 흘려보냅니다. */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createServer } from "./server.mjs";

const PORT = 8092, OUT = "out/reel";
const EXEC = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const FFMPEG = process.env.FFMPEG || "ffmpeg";

await mkdir(OUT, { recursive: true });
const server = createServer(process.cwd()).listen(PORT);
const browser = await chromium.launch({ executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(`http://localhost:${PORT}/reel.html?export=1`, { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__ready === true, { timeout: 15000 });
const { FPS, DURATION, SCENES } = await page.evaluate(() => window.REEL);

const frameAt = async (t, type = "image/png", q) => {
  const dataUrl = await page.evaluate(([t, type, q]) => window.__frame(t, type, q), [t, type, q]);
  return Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
};

// 1) 씬별 대표 스틸 (썸네일·검수용)
const stillTimes = SCENES.map(([a, b]) => a + (b - a) * 0.55);
for (let i = 0; i < stillTimes.length; i++) {
  const name = `${OUT}/still-${String(i + 1).padStart(2, "0")}.png`;
  await writeFile(name, await frameAt(stillTimes[i]));
  console.log(`✔ ${name}  (t=${stillTimes[i].toFixed(2)}s)`);
}

// 2) MP4
if (!process.env.STILLS) {
  const start = Number(process.env.START || 0), end = Number(process.env.END || DURATION);
  const total = Math.round((end - start) * FPS);
  const mp4 = `${OUT}/reel.mp4`;
  const ff = spawn(FFMPEG, [
    "-y", "-hide_banner", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", mp4,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const ffDone = new Promise((res, rej) => ff.on("close", (code) => (code === 0 ? res() : rej(new Error(`ffmpeg exit ${code}`)))));

  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    const buf = await frameAt(start + f / FPS);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % FPS === 0 || f === total - 1)
      process.stdout.write(`\r  frame ${f + 1}/${total}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await ffDone;
  console.log(`\n✔ ${mp4}  (${total} frames, ${end - start}s @ ${FPS}fps, 1080×1920)`);
}

await browser.close();
server.close();
