/* 모든 캐러셀의 각 슬라이드를 PNG 로 내보내기 (사전 설치된 Chromium 사용)
   실행: npm run export  →  out/<slug>/slide-NN.png
   특정 캐러셀만: SLUG=2-meeting npm run export */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { createServer } from "./server.mjs";

// deviceScaleFactor: 1 = 정확히 1080×1350, 2 = 2160×2700(고해상도). 기본 2.
const SCALE = Number(process.env.SCALE || 2);
const ONLY = process.env.SLUG || null; // 특정 캐러셀 slug 만 내보내기
const PORT = 8091;

const server = createServer(process.cwd()).listen(PORT);

// 사전 설치된 Chromium 사용 (환경변수로 재정의 가능). playwright install 불필요.
const EXEC = process.env.CHROMIUM_PATH ||
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({ executablePath: EXEC });
const page = await browser.newPage({
  viewport: { width: 1080, height: 1350 },
  deviceScaleFactor: SCALE,
});

// 캐러셀 메타(slug, 슬라이드 수) 읽어오기
await page.goto(`http://localhost:${PORT}/render.html?c=0&i=0`, { waitUntil: "networkidle" });
const meta = await page.evaluate(() =>
  window.CAROUSELS.map((c) => ({ slug: c.slug, count: c.slides.length })));

let done = 0;
for (let c = 0; c < meta.length; c++) {
  if (ONLY && meta[c].slug !== ONLY) continue;
  await mkdir(`out/${meta[c].slug}`, { recursive: true });
  for (let i = 0; i < meta[c].count; i++) {
    await page.goto(`http://localhost:${PORT}/render.html?c=${c}&i=${i}`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 10000 });
    const name = `out/${meta[c].slug}/slide-${String(i + 1).padStart(2, "0")}.png`;
    await page.locator(".card").screenshot({ path: name });
    console.log(`✔ ${name}`);
    done++;
  }
}

await browser.close();
server.close();
console.log(`\n완료 — ${done}장 (${1080 * SCALE}×${1350 * SCALE}px) → out/`);
