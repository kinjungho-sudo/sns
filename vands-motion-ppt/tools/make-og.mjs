// 공유 카드(카카오톡·SNS 링크 미리보기)와 파비콘 만들기
//   node tools/make-og.mjs  → assets/og.jpg (1200×630), favicon.svg, favicon-32.png, apple-touch-icon.png
import { chromium } from "playwright";
import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { serve } from "./server.mjs";
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const { srv, url } = await serve(ROOT);
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto(`${url}/tools/og/card.html`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
await p.screenshot({ path: `${ROOT}assets/og.jpg`, type: "jpeg", quality: 88 });
copyFileSync(`${ROOT}tools/og/icon.svg`, `${ROOT}favicon.svg`);
for (const [n, f] of [[32, "favicon-32.png"], [180, "apple-touch-icon.png"]]) {
  await p.setViewportSize({ width: n, height: n });
  await p.setContent(`<style>*{margin:0}body{background:transparent}</style><img src="${url}/favicon.svg" width="${n}" height="${n}">`);
  await p.waitForTimeout(150); await p.screenshot({ path: `${ROOT}${f}`, omitBackground: true });
}
await b.close(); srv.close(); console.log("✔ assets/og.jpg · favicon.svg · favicon-32.png · apple-touch-icon.png");
