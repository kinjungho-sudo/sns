/* Render pipeline for the explainer film.
   node explainer/render.mjs <command> [--fmt 16x9|9x16|1x1] [--rm] [--theme paper] [--fps 60]
   commands:
     stills       one still per beat (mid-beat) + every anchor/caption moment → out/stills/<fmt>/
     frame --t N  one PNG at time N → out/frame.png
     video        frames t = n/fps piped to ffmpeg (libx264, crf 16, yuv420p) → out/video_<fmt>[_rm].mp4
     audio        Web Audio bed rendered offline → out/audio_raw.wav
     captions     TIMELINE.captions → captions.srt
     determinism  same frame rendered in two fresh page loads, byte-compared
     fit          renders every beat in every format and lists any text that had to shrink
     contrast     contrast ratio of every text/background pair in the theme
     timing       caption reading speed (characters per second)
   Paths are relative to the repo root; run from there. */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "../server.mjs";

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true); };
const FMT = opt("fmt", "16x9"), THEME = opt("theme", "paper"), RM = !!opt("rm", false);
const FPS = Number(opt("fps", 60));
const OUT = "explainer/out";
const EXEC = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const SIZES = { "16x9": [1920, 1080], "9x16": [1080, 1920], "1x1": [1080, 1080] };

const server = createServer(process.cwd());
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;
const browser = await chromium.launch({ executablePath: EXEC });

async function openFilm(fmt = FMT, extra = "") {
  const [w, h] = SIZES[fmt];
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => { console.error(`✖ page error: ${e.message}`); process.exitCode = 1; });
  await page.goto(`http://localhost:${PORT}/explainer/film.html?export=1&fmt=${fmt}&theme=${THEME}${RM ? "&rm=1" : ""}${extra}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__ready === true, { timeout: 20000 });
  return page;
}
const png = async (page, t) => {
  const d = await page.evaluate((t) => window.frameAt(t), t);
  return Buffer.from(d.slice(d.indexOf(",") + 1), "base64");
};
const sha = (b) => createHash("sha256").update(b).digest("hex").slice(0, 16);

if (cmd === "frame") {
  const page = await openFilm();
  const t = Number(opt("t", 0));
  const file = opt("out", `${OUT}/frame.png`);
  await writeFile(file, await png(page, t)); console.log(`✔ ${file} (t=${t})`);
}

if (cmd === "stills") {
  const page = await openFilm();
  const tl = await page.evaluate(() => window.TIMELINE);
  const dir = opt("dir", `${OUT}/stills/${FMT}${RM ? "_rm" : ""}${THEME !== "paper" ? "_" + THEME : ""}`);
  await mkdir(dir, { recursive: true });
  // the moment each beat is fully built: just before its end
  const times = tl.beats.map((b) => ({ id: b.id, t: Math.max(b.t0 + 0.5, b.t1 - 0.6) }));
  for (const { id, t } of times) {
    const f = `${dir}/${id}.png`; await writeFile(f, await png(page, t)); console.log(`✔ ${f} (t=${t.toFixed(2)})`);
  }
}

if (cmd === "video") {
  const page = await openFilm();
  const { DURATION } = await page.evaluate(() => window.FILM);
  const [w, h] = SIZES[FMT];
  const scale = opt("scale", null);
  const file = opt("out", `${OUT}/video_${FMT}${RM ? "_rm" : ""}.mp4`);
  const vf = scale ? ["-vf", `scale=${Math.round(w * scale / 2) * 2}:${Math.round(h * scale / 2) * 2}`] : [];
  const ff = spawn("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    ...vf, "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", file],
    { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg " + c)))));
  const total = Math.round(DURATION * FPS), t0 = Date.now();
  for (let n = 0; n < total; n++) {
    const buf = await png(page, n / FPS);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (n % (FPS * 5) === 0) console.log(`  ${FMT}${RM ? " rm" : ""} frame ${n}/${total} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await done;
  console.log(`✔ ${file} (${total} frames @ ${FPS}fps)`);
}

if (cmd === "audio") {
  const page = await openFilm();
  const b64 = await page.evaluate(() => window.renderAudio());
  const file = `${OUT}/audio_raw.wav`;
  await writeFile(file, Buffer.from(b64, "base64")); console.log(`✔ ${file}`);
}

if (cmd === "captions") {
  const page = await openFilm();
  const tl = await page.evaluate(() => window.TIMELINE);
  const ts = (s) => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`; };
  const srt = tl.captions.map((c, i) => `${i + 1}\n${ts(c.t0)} --> ${ts(c.t1)}\n${c.text}\n`).join("\n");
  await writeFile("explainer/captions.srt", srt); console.log("✔ explainer/captions.srt");
}

if (cmd === "timing") {
  const page = await openFilm();
  const tl = await page.evaluate(() => window.TIMELINE);
  let worst = 0;
  for (const c of tl.captions) {
    const chars = [...c.text.replace(/\s/g, "")].length, d = c.t1 - c.t0, cps = chars / d; worst = Math.max(worst, cps);
    console.log(`${c.t0.toFixed(1).padStart(5)}–${c.t1.toFixed(1).padEnd(5)} ${cps.toFixed(1).padStart(5)} cps  ${c.text}`);
  }
  console.log(`worst ${worst.toFixed(1)} chars/s (limit 9)`); if (worst > 9) process.exitCode = 1;
}

if (cmd === "determinism") {
  const t = Number(opt("t", 39.37));
  const a = await png(await openFilm(), t), b = await png(await openFilm(), t);
  console.log(`t=${t}: run A ${sha(a)}  run B ${sha(b)}  ${a.equals(b) ? "IDENTICAL" : "DIFFERENT"}`);
  if (!a.equals(b)) process.exitCode = 1;
}

if (cmd === "fit") {
  let warnings = [];
  for (const fmt of Object.keys(SIZES)) for (const rm of ["", "&rm=1"]) {
    const page = await openFilm(fmt, rm);
    for (let t = 0; t <= 60; t += 0.25) await page.evaluate((t) => window.seek(t), t);
    warnings.push(...(await page.evaluate(() => [...window.__fitWarnings])));
    await page.close();
  }
  warnings = [...new Set(warnings)];
  console.log(warnings.length ? warnings.join("\n") : "no text had to shrink in any format");
}

if (cmd === "contrast") {
  const page = await openFilm();
  const pairs = await page.evaluate(() => window.TEXT_PAIRS);
  const lum = (hex) => { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  let fail = 0;
  for (const [name, fg, bg] of pairs) {
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x), r = (a + 0.05) / (b + 0.05);
    if (r < 4.5) fail++;
    console.log(`${r >= 4.5 ? "pass" : "FAIL"} ${r.toFixed(2).padStart(6)}:1  ${name.padEnd(18)} ${fg} on ${bg}`);
  }
  if (fail) process.exitCode = 1;
}

await browser.close();
server.close();
