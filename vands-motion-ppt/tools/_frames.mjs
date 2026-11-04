import { chromium } from "playwright";
import { serve } from "./server.mjs";
const [name, ...ts] = process.argv.slice(2);
const { srv, url } = await serve(new URL("..", import.meta.url).pathname);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on("pageerror", (e) => console.log("ERR", e.message));
await p.goto(`${url}/motion/${name}.html?render=1`); await p.waitForFunction(() => window.__ready);
for (const t of ts) { await p.evaluate((t) => window.seek(+t), t); await p.locator("#frame").screenshot({ path: `/tmp/claude-0/-home-user-sns/3aee8f2e-2d1d-5491-be7d-97eab28ec669/scratchpad/${name}-${t}.png` }); }
await b.close(); srv.close();
