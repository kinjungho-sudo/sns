/* Render tool for one film project. Run from the film folder (the one with film.html):
     node tools/render.mjs <command> [--fmt 16x9|9x16|1x1] [--rm] [--vo] [--theme paper] [--fps 60] [--t N] [--out file]
   commands
     frame --t N   one PNG at time N → out/frame.png (or --out)
     stills        one still per beat (just before the beat ends) → out/stills/<fmt>[_rm]/<beat>.png
     contact       16:9 beat stills tiled → contact.png
     video         frames t = n/fps piped to ffmpeg (libx264, crf 16, yuv420p) → out/video_<fmt>[_rm][_vo].mp4
     audio         the Web Audio bed rendered offline → out/audio_raw.wav
     captions      TIMELINE.captions → captions.srt
     determinism   frames at 30/64.5/85% (or --t) rendered in two fresh page loads, byte-compared
     fit           every format, normal + reduced motion, every 0.25 s: lists any text that had to shrink
     contrast      WCAG ratio of every text/background pair the theme declares (window.TEXT_PAIRS)
     timing        caption reading speed in characters (no spaces) per second; fails above 9
   Chromium: CHROMIUM_PATH, else /opt/pw-browsers/chromium-<ver>/chrome-linux/chrome if present, else Playwright's own. */
import { chromium } from "playwright";
import { mkdir, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "./server.mjs";

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true); };
const FMT = opt("fmt", "16x9"), THEME = opt("theme", "paper"), RM = !!opt("rm", false), VO = !!opt("vo", false);
const FPS = Number(opt("fps", 60));
const OUT = "out";
const SIZES = { "16x9": [1920, 1080], "9x16": [1080, 1920], "1x1": [1080, 1080] };

async function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  try { for (const d of (await readdir("/opt/pw-browsers")).filter((d) => d.startsWith("chromium-")).sort().reverse()) {
    const p = `/opt/pw-browsers/${d}/chrome-linux/chrome`; if (existsSync(p)) return p; } } catch {}
  return undefined; // Playwright's bundled browser (npx playwright install chromium)
}

const server = createServer(process.cwd());
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;
const browser = await chromium.launch({ executablePath: await chromiumPath() });

async function openFilm(fmt = FMT, extra = "") {
  const [w, h] = SIZES[fmt];
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => { console.error(`✖ page error: ${e.message}`); process.exitCode = 1; });
  await page.goto(`http://localhost:${PORT}/film.html?export=1&fmt=${fmt}&theme=${THEME}${RM ? "&rm=1" : ""}${VO ? "&vo=1" : ""}${extra}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__ready === true, { timeout: 20000 });
  return page;
}
const png = async (page, t) => { const d = await page.evaluate((t) => window.frameAt(t), t); return Buffer.from(d.slice(d.indexOf(",") + 1), "base64"); };
const sha = (b) => createHash("sha256").update(b).digest("hex").slice(0, 16);
const stillTimes = (tl) => tl.beats.map((b) => ({ id: b.id, t: Math.max(b.t0 + 0.5, b.t1 - 0.6) }));

if (cmd === "frame") {
  const page = await openFilm(); const t = Number(opt("t", 0)); const file = opt("out", `${OUT}/frame.png`);
  await mkdir(OUT, { recursive: true }); await writeFile(file, await png(page, t)); console.log(`✔ ${file} (t=${t})`);
}

if (cmd === "stills" || cmd === "contact") {
  const page = await openFilm(cmd === "contact" ? "16x9" : FMT);
  const tl = await page.evaluate(() => window.TIMELINE), ground = await page.evaluate(() => window.FILM.GROUND || "#F4F1EA");
  const dir = `${OUT}/stills/${cmd === "contact" ? "16x9" : FMT}${RM ? "_rm" : ""}${THEME !== "paper" ? "_" + THEME : ""}`;
  await mkdir(dir, { recursive: true });
  const files = [];
  for (const { id, t } of stillTimes(tl)) { const f = `${dir}/${id}.png`; await writeFile(f, await png(page, t)); files.push(f); console.log(`✔ ${f} (t=${t.toFixed(2)})`); }
  if (cmd === "contact") {
    const cols = 4, n = files.length, rows = Math.ceil(n / cols), blanks = rows * cols - n;
    const ins = files.flatMap((f) => ["-i", f]);
    for (let i = 0; i < blanks; i++) ins.push("-f", "lavfi", "-i", `color=c=0x${ground.slice(1)}:s=1920x1080:d=1`);
    const total = n + blanks;
    const fc = Array.from({ length: total }, (_, i) => `[${i}:v]scale=640:-1[s${i}]`).join(";") + ";" +
      Array.from({ length: total }, (_, i) => `[s${i}]`).join("") + `xstack=inputs=${total}:grid=${cols}x${rows}`;
    execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", fc, "-frames:v", "1", "contact.png"]);
    console.log("✔ contact.png");
  }
}

if (cmd === "video") {
  const page = await openFilm();
  const { DURATION } = await page.evaluate(() => window.FILM);
  const [w, h] = SIZES[FMT]; const scale = opt("scale", null);
  await mkdir(OUT, { recursive: true });
  const file = opt("out", `${OUT}/video_${FMT}${RM ? "_rm" : ""}${VO ? "_vo" : ""}.mp4`);
  const vf = scale ? ["-vf", `scale=${Math.round(w * scale / 2) * 2}:${Math.round(h * scale / 2) * 2}`] : [];
  const ff = spawn("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    ...vf, "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", file], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg " + c)))));
  const total = Math.round(DURATION * FPS), t0 = Date.now();
  for (let n = 0; n < total; n++) {
    const buf = await png(page, n / FPS);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (n % (FPS * 5) === 0) console.log(`  ${FMT}${RM ? " rm" : ""}${VO ? " vo" : ""} frame ${n}/${total} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await done; console.log(`✔ ${file} (${total} frames @ ${FPS}fps)`);
}

if (cmd === "audio") {
  const page = await openFilm(); const b64 = await page.evaluate(() => window.renderAudio());
  await mkdir(OUT, { recursive: true }); await writeFile(`${OUT}/audio_raw.wav`, Buffer.from(b64, "base64")); console.log(`✔ ${OUT}/audio_raw.wav`);
}

if (cmd === "captions") {
  const page = await openFilm(); const tl = await page.evaluate(() => window.TIMELINE);
  const ts = (s) => { const ms = Math.round(s * 1000); return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`; };
  await writeFile("captions.srt", tl.captions.map((c, i) => `${i + 1}\n${ts(c.t0)} --> ${ts(c.t1)}\n${c.text}\n`).join("\n")); console.log("✔ captions.srt");
}

if (cmd === "timing") {
  const page = await openFilm(); const tl = await page.evaluate(() => window.TIMELINE); let worst = 0;
  for (const c of tl.captions) { const cps = [...c.text.replace(/\s/g, "")].length / (c.t1 - c.t0); worst = Math.max(worst, cps);
    console.log(`${c.t0.toFixed(1).padStart(5)}–${c.t1.toFixed(1).padEnd(5)} ${cps.toFixed(1).padStart(5)} cps  ${c.text}`); }
  console.log(`worst ${worst.toFixed(1)} chars/s (limit 9)`); if (worst > 9) process.exitCode = 1;
}

if (cmd === "determinism") {
  const page0 = await openFilm(); const { DURATION } = await page0.evaluate(() => window.FILM); await page0.close();
  // three times across the film by default (one may be a quiet frame); --t checks one specific time
  const times = opt("t") ? [Number(opt("t"))] : [0.3, 0.645, 0.85].map((k) => +(DURATION * k).toFixed(2));
  for (const t of times) {
    const a = await png(await openFilm(), t), b = await png(await openFilm(), t);
    console.log(`t=${t}: run A ${sha(a)}  run B ${sha(b)}  ${a.equals(b) ? "IDENTICAL" : "DIFFERENT"}`); if (!a.equals(b)) process.exitCode = 1;
  }
}

if (cmd === "fit") {
  let warnings = [];
  for (const fmt of Object.keys(SIZES)) for (const rm of ["", "&rm=1"]) {
    const page = await openFilm(fmt, rm); const { DURATION } = await page.evaluate(() => window.FILM);
    for (let t = 0; t <= DURATION; t += 0.25) await page.evaluate((t) => window.seek(t), t);
    warnings.push(...(await page.evaluate(() => [...(window.__fitWarnings || [])]))); await page.close();
  }
  warnings = [...new Set(warnings)]; console.log(warnings.length ? warnings.join("\n") : "no text had to shrink in any format");
  if (warnings.length) process.exitCode = 1;
}

if (cmd === "contrast") {
  const page = await openFilm(); const pairs = await page.evaluate(() => window.TEXT_PAIRS || []);
  const lum = (hex) => { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  let fail = 0;
  for (const [name, fg, bg] of pairs) {
    const need = /graphic/.test(name) ? 3 : 4.5; const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x), r = (a + 0.05) / (b + 0.05);
    if (r < need) fail++; console.log(`${r >= need ? "pass" : "FAIL"} ${r.toFixed(2).padStart(6)}:1 (≥${need})  ${name.padEnd(22)} ${fg} on ${bg}`);
  }
  if (fail) process.exitCode = 1;
}

await browser.close();
server.close();
