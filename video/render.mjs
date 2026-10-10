/* 에피소드 영상을 MP4 로 렌더링 (사전 설치된 Chromium + ffmpeg)
   실행: npm run video                         → 모든 에피소드
         EP=ep01-receipt npm run video         → 특정 에피소드만
         STILLS=1.5,6,12 EP=... npm run video  → 해당 시각 스틸 PNG 만 (빠른 확인용)
   결과: out/video/<ep>/<ep>.mp4 · cover.png · audio.wav */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, readdir } from "node:fs/promises";
import { createServer } from "../server.mjs";
import { renderAudio } from "./audio.mjs";

const FPS = Number(process.env.FPS || 30);
const PORT = 8092;
const EXEC = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const STILLS = process.env.STILLS ? process.env.STILLS.split(",").map(Number) : null;

const eps = process.env.EP
  ? [process.env.EP]
  : (await readdir("video/episodes", { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);

const server = createServer(process.cwd()).listen(PORT);
const browser = await chromium.launch({ executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });

for (const ep of eps) {
  const dir = `out/video/${ep}`;
  await mkdir(dir, { recursive: true });
  await page.goto(`http://localhost:${PORT}/video/video.html?ep=${ep}&render=1`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 15000 });
  const { duration, cues, coverAt } = await page.evaluate(() => ({
    duration: window.TL.duration, cues: window.TL.cues, coverAt: window.EPISODE.coverAt ?? 2.6,
  }));
  const shot = async (t, path) => {
    await page.evaluate((t) => window.seek(t), t);
    return page.screenshot({ path, type: "png" });
  };

  if (STILLS) {
    for (const t of STILLS) await shot(t, `${dir}/still-${t.toFixed(1)}s.png`);
    console.log(`✔ ${ep}: 스틸 ${STILLS.length}장 → ${dir}/`);
    continue;
  }

  // 1) 오디오 (BGM + 효과음 큐)
  const wav = `${dir}/audio.wav`;
  await renderAudio({ duration, cues, out: wav });

  // 2) 프레임 → ffmpeg 파이프
  const mp4 = `${dir}/${ep}.mp4`;
  const ff = spawn("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
    "-i", wav,
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart",
    mp4,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const closed = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg 종료 코드 ${c}`)))));

  const total = Math.round(duration * FPS);
  for (let i = 0; i < total; i++) {
    const buf = await shot(i / FPS);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % FPS === 0) process.stdout.write(`\r  ${ep}: ${i}/${total} 프레임`);
  }
  ff.stdin.end();
  await closed;
  await shot(coverAt, `${dir}/cover.png`);
  console.log(`\r✔ ${mp4}  (${duration}s · ${total}프레임 · 1080×1350)`);
}

await browser.close();
server.close();
