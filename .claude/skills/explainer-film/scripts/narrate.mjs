/* Typecast narration for a film's 16:9 master.
   node tools/narrate.mjs        (run in the film folder; needs TYPECAST_API_KEY and network access to api.typecast.ai)
   env: TYPECAST_API_KEY (required) · TYPECAST_VOICE_ID (optional; default = first voice the API lists for the model)
        TYPECAST_MODEL (default ssfm-v21) · TYPECAST_DRY_RUN=1 (pipeline test only: tones instead of speech, never shipped)
   Steps: 1) one TTS clip per line → out/vo/<id>.wav  2) measure, schedule, speed up a line (≤1.25×) only if it overruns
   its window  3) voice track + bed ducked under voice, loudness-normalised to -16 LUFS / -1.5 dBTP → out/audio_narrated.wav
   4) out/vo/timing.json (captions retimed to the real voice) + captions_narrated.srt. render.mjs --vo burns those captions. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFileSync, spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : args[i + 1]; };
const DIR = ".", OUT = "out", VO = "out/vo";
const KEY = process.env.TYPECAST_API_KEY, DRY = process.env.TYPECAST_DRY_RUN === "1";
const MODEL = process.env.TYPECAST_MODEL || "ssfm-v21";
const API = "https://api.typecast.ai";
if (!KEY && !DRY) { console.error("✖ TYPECAST_API_KEY is not set. Add it as an environment secret, then re-run."); process.exit(2); }

const script = JSON.parse(await readFile(`${DIR}/narration.json`, "utf8"));
await mkdir(VO, { recursive: true });
const sh = (cmd, a) => execFileSync(cmd, a, { encoding: "utf8", maxBuffer: 1 << 28 });
const dur = (f) => +sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).trim();

async function pickVoice() {
  if (process.env.TYPECAST_VOICE_ID) return process.env.TYPECAST_VOICE_ID;
  const r = await fetch(`${API}/v1/voices?model=${MODEL}`, { headers: { "X-API-KEY": KEY } });
  if (!r.ok) throw new Error(`voices ${r.status}: ${await r.text()}`);
  const j = await r.json(); const list = Array.isArray(j) ? j : j.voices || j.data || [];
  await writeFile(`${VO}/voices.json`, JSON.stringify(list, null, 2));
  if (!list.length) throw new Error("no voices returned");
  console.log(`  voice: ${list[0].voice_name || list[0].name} (${list[0].voice_id}) — first of ${list.length}; see out/vo/voices.json, set TYPECAST_VOICE_ID to change`);
  return list[0].voice_id;
}

async function tts(voice, text, tempo, file) {
  if (DRY) { // test tone, ~6.5 syllables/s at tempo 1 — exercises scheduling and mixing only
    const secs = Math.max(0.6, [...text.replace(/[\s,.?!]/g, "")].length / 6.5 / tempo);
    sh("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", `sine=frequency=330:duration=${secs.toFixed(3)}`, "-ar", "48000", "-ac", "1", file]);
    return;
  }
  const body = { voice_id: voice, text, model: MODEL, language: "kor", prompt: { emotion_preset: "normal", emotion_intensity: 1 },
    output: { volume: 100, audio_pitch: 0, audio_tempo: tempo, audio_format: "wav" }, seed: 42 };
  const r = await fetch(`${API}/v1/text-to-speech`, { method: "POST", headers: { "X-API-KEY": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`text-to-speech ${r.status}: ${await r.text()}`);
  const raw = `${file}.raw`; await writeFile(raw, Buffer.from(await r.arrayBuffer()));
  // trim leading/trailing silence so timing is about the words, then 48 kHz mono
  sh("ffmpeg", ["-v", "error", "-y", "-i", raw, "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse", "-ar", "48000", "-ac", "1", file]);
}

const voice = DRY ? "dry-run" : await pickVoice();
const timing = []; let prevEnd = 0;
for (const L of script.lines) {
  const file = `${VO}/${L.id}.wav`;
  let tempo = 1.0; await tts(voice, L.say, tempo, file); let d = dur(file);
  let start = Math.max(L.at, prevEnd + 0.12);
  const room = L.until - start;
  if (d > room) { // only as fast as needed, never past 1.25×
    tempo = Math.min(1.25, Math.ceil((d / room) * 100) / 100 + 0.02);
    await tts(voice, L.say, tempo, file); d = dur(file);
  }
  const end = start + d;
  const over = end - L.until;
  timing.push({ id: L.id, t0: +start.toFixed(3), t1: +end.toFixed(3), text: L.show, say: L.say, tempo, overrun: over > 0.01 ? +over.toFixed(2) : 0 });
  console.log(`  ${L.id} ${start.toFixed(2)}–${end.toFixed(2)} s  tempo ${tempo.toFixed(2)}${over > 0.01 ? `  ⚠ overruns its window by ${over.toFixed(2)} s` : ""}  ${L.say}`);
  prevEnd = end;
}
await writeFile(`${VO}/timing.json`, JSON.stringify({ voice, model: MODEL, dryRun: DRY, hold: script.hold, captions: timing }, null, 2));

// voice track
const total = (script.duration || 30) + (script.hold || 0);   // narration.json "duration" = the film's visual length
const inputs = timing.flatMap((c) => ["-i", `${VO}/${c.id}.wav`]);
const delays = timing.map((c, i) => `[${i}]adelay=${Math.round(c.t0 * 1000)}|${Math.round(c.t0 * 1000)}[d${i}]`).join(";");
sh("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", `${delays};${timing.map((_, i) => `[d${i}]`).join("")}amix=inputs=${timing.length}:normalize=0,apad=whole_dur=${total}[v]`, "-map", "[v]", "-ar", "48000", "-ac", "2", `${VO}/voice.wav`]);
// bed (padded for the hold) ducked under the voice, then mixed and normalised
const mixF = `[0]apad=whole_dur=${total}[bed];[1]asplit=2[sc][vo];[bed][sc]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=350:makeup=1[duck];[duck][vo]amix=inputs=2:normalize=0:weights=1 1.6[m]`;
sh("ffmpeg", ["-v", "error", "-y", "-i", `${OUT}/audio_raw.wav`, "-i", `${VO}/voice.wav`, "-filter_complex", mixF, "-map", "[m]", "-ar", "48000", `${VO}/mix_raw.wav`]);
const ln = spawnSync("ffmpeg", ["-hide_banner", "-i", `${VO}/mix_raw.wav`, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], { encoding: "utf8" }).stderr;
const m = JSON.parse(ln.slice(ln.lastIndexOf("{"), ln.lastIndexOf("}") + 1));
sh("ffmpeg", ["-v", "error", "-y", "-i", `${VO}/mix_raw.wav`, "-af",
  `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
  "-ar", "48000", `${OUT}/audio_narrated.wav`]);
// srt
const ts = (s) => { const ms = Math.round(s * 1000); return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`; };
await writeFile(`${DIR}/captions_narrated.srt`, timing.map((c, i) => `${i + 1}\n${ts(c.t0)} --> ${ts(c.t1 + 0.25)}\n${c.text}\n`).join("\n"));
console.log(`✔ ${OUT}/audio_narrated.wav (${total} s)  ✔ ${VO}/timing.json  ✔ ${DIR}/captions_narrated.srt${DRY ? "  (DRY RUN: tones, not speech)" : ""}`);
