/* Checks a finished MP4: flashes, loudness, true peak, duration and size.
   node explainer/check-video.mjs explainer/out/master_16x9.mp4
   Flash rule: no more than 3 frame-to-frame luminance jumps of 10% or more in any 1-second window. */
import { execFileSync, spawnSync } from "node:child_process";

const file = process.argv[2];
const run = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "pipe"] });
const runErr = (cmd, args) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 28 }).stderr || ""; // ffmpeg reports on stderr

const probe = JSON.parse(run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt:format=duration", "-of", "json", file]));
const v = probe.streams.find((s) => s.codec_type === "video"), a = probe.streams.find((s) => s.codec_type === "audio");
console.log(`${file}\n  video ${v.codec_name} ${v.width}x${v.height} ${v.r_frame_rate} ${v.pix_fmt}  audio ${a ? a.codec_name : "none"}  ${(+probe.format.duration).toFixed(2)} s`);

// per-frame average luma
const out = run("ffprobe", ["-v", "error", "-f", "lavfi", "-i", `movie=${file},signalstats`, "-show_entries", "frame_tags=lavfi.signalstats.YAVG", "-of", "csv=p=0"]);
const y = out.trim().split("\n").map((l) => parseFloat(l)).filter((n) => !Number.isNaN(n));
const fps = eval(v.r_frame_rate);
const jumps = [];
for (let i = 1; i < y.length; i++) if (Math.abs(y[i] - y[i - 1]) / 255 >= 0.10) jumps.push(i / fps);
let worst = 0;
for (const t of jumps) worst = Math.max(worst, jumps.filter((u) => u >= t && u < t + 1).length);
const range = [Math.min(...y), Math.max(...y)].map((n) => (n / 2.55).toFixed(0) + "%");
console.log(`  luma ${range[0]}–${range[1]}, ${jumps.length} jumps ≥10%, worst ${worst} in any 1 s → ${worst <= 3 ? "pass" : "FAIL"}`);

if (a) {
  const e = runErr("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const I = +(e.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop()?.match(/-?[\d.]+/)[0];
  const tp = +(e.match(/Peak:\s+(-?[\d.]+) dBFS/g) || []).pop()?.match(/-?[\d.]+/)[0];
  const ok = Math.abs(I + 16) <= 1 && tp <= -1.0;
  console.log(`  loudness ${I} LUFS integrated, true peak ${tp} dBTP → ${ok ? "pass" : "FAIL"} (target -16 ±1, ≤ -1.5 before AAC)`);
  if (!ok) process.exitCode = 1;
}
if (worst > 3) process.exitCode = 1;
