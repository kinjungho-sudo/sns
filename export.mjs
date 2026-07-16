/* 각 슬라이드를 1080×1350 PNG 로 내보내기 (사전 설치된 Chromium 사용)
   실행: npm run export  →  out/slide-01.png ... */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { createServer } from "./server.mjs";

// deviceScaleFactor: 1 = 정확히 1080×1350, 2 = 2160×2700(고해상도). 기본 2.
const SCALE = Number(process.env.SCALE || 2);
const PORT = 8091;

const server = createServer(process.cwd()).listen(PORT);
await mkdir("out", { recursive: true });

// 사전 설치된 Chromium 을 사용 (환경변수로 재정의 가능). playwright install 불필요.
const EXEC = process.env.CHROMIUM_PATH ||
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({ executablePath: EXEC });
const page = await browser.newPage({
  viewport: { width: 1080, height: 1350 },
  deviceScaleFactor: SCALE,
});

// 첫 로드에서 슬라이드 개수 파악
await page.goto(`http://localhost:${PORT}/render.html?i=0`, { waitUntil: "networkidle" });
const total = await page.evaluate(() => window.SLIDES.length);
if (!total) { console.error("슬라이드를 찾지 못했습니다."); process.exit(1); }

for (let i = 0; i < total; i++) {
  await page.goto(`http://localhost:${PORT}/render.html?i=${i}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 10000 });
  const card = page.locator(".card");
  const name = `out/slide-${String(i + 1).padStart(2, "0")}.png`;
  await card.screenshot({ path: name });
  console.log(`✔ ${name}`);
}

await browser.close();
server.close();
console.log(`\n완료 — ${total}장 (${1080 * SCALE}×${1350 * SCALE}px) → out/`);
