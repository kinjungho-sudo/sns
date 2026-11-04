/* Typecast 내레이션 만들기 → assets/audio/narration/slide-<n>.m4a + timing.js
   TYPECAST_API_KEY=... node tools/narrate.mjs
   필요: 환경변수 TYPECAST_API_KEY (채팅에 붙여 넣지 말고 환경 비밀값으로), api.typecast.ai 접속, ffmpeg
   선택: TYPECAST_VOICE_ID (없으면 목록의 첫 음성, 전체 목록은 assets/audio/narration/voices.json)
         TYPECAST_MODEL (기본 ssfm-v21)
   방식: narration.js 의 줄마다 음성 한 개 → 앞뒤 무음 제거 → 시작 = max(대본 시각, 앞 줄 끝 + 0.15초),
         다음 줄 시각을 넘으면 그 줄만 최대 1.2배까지 빠르게 → 장별 한 트랙으로 합쳐 -16 LUFS로 맞춤.
   발표 화면은 timing.js가 있으면 실제 음성 시각으로 자막을 띄우고 음성을 재생한다. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url)), OUT = `${ROOT}assets/audio/narration`;
const KEY = process.env.TYPECAST_API_KEY, MODEL = process.env.TYPECAST_MODEL || "ssfm-v21", API = "https://api.typecast.ai";
if (!KEY) { console.error("✖ TYPECAST_API_KEY 가 없습니다. 환경 비밀값으로 넣은 뒤 다시 실행하세요."); process.exit(2); }

const src = await readFile(`${ROOT}narration.js`, "utf8");
const N = JSON.parse(src.slice(src.indexOf("{"), src.lastIndexOf("}") + 1));
await mkdir(`${OUT}/clips`, { recursive: true });
const sh = (c, a) => execFileSync(c, a, { encoding: "utf8", maxBuffer: 1 << 28 });
const dur = (f) => +sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).trim();

async function pickVoice() {
  if (process.env.TYPECAST_VOICE_ID) return process.env.TYPECAST_VOICE_ID;
  const r = await fetch(`${API}/v1/voices?model=${MODEL}`, { headers: { "X-API-KEY": KEY } });
  if (!r.ok) throw new Error(`voices ${r.status}: ${await r.text()}`);
  const j = await r.json(), list = Array.isArray(j) ? j : j.voices || j.data || [];
  await writeFile(`${OUT}/voices.json`, JSON.stringify(list, null, 2));
  if (!list.length) throw new Error("음성 목록이 비어 있습니다");
  console.log(`  음성: ${list[0].voice_name || list[0].name} (${list[0].voice_id}) · 바꾸려면 TYPECAST_VOICE_ID`);
  return list[0].voice_id;
}
async function tts(voice, text, tempo, file) {
  const body = { voice_id: voice, text, model: MODEL, language: "kor", prompt: { emotion_preset: "normal", emotion_intensity: 1 },
    output: { volume: 100, audio_pitch: 0, audio_tempo: tempo, audio_format: "wav" }, seed: 42 };
  const r = await fetch(`${API}/v1/text-to-speech`, { method: "POST", headers: { "X-API-KEY": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`text-to-speech ${r.status}: ${await r.text()}`);   // 요청 형식이 다르면 이 오류 본문을 보고 body를 고친다
  await writeFile(`${file}.raw`, Buffer.from(await r.arrayBuffer()));
  sh("ffmpeg", ["-v", "error", "-y", "-i", `${file}.raw`, "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse", "-ar", "48000", "-ac", "1", file]);
}

const voice = await pickVoice(), timing = { voice, model: MODEL, slides: [] };
for (const S of N.slides) {
  const lines = []; let prevEnd = 0;
  for (let k = 0; k < S.lines.length; k++) {
    const L = S.lines[k], until = k + 1 < S.lines.length ? S.lines[k + 1].at - .1 : S.duration - .3, file = `${OUT}/clips/s${S.id}-${k + 1}.wav`;
    let tempo = 1; await tts(voice, L.say, tempo, file); let d = dur(file);
    const start = Math.max(L.at, prevEnd + .15);
    if (start + d > until) { tempo = Math.min(1.2, Math.ceil(((d / Math.max(.5, until - start)) * 100)) / 100 + .02); await tts(voice, L.say, tempo, file); d = dur(file); }
    const end = start + d; prevEnd = end;
    lines.push({ t0: +start.toFixed(3), t1: +(end + .25).toFixed(3), show: L.show, tempo, file });
    console.log(`  ${S.id}부 ${k + 1}  ${start.toFixed(2)}–${end.toFixed(2)}s  ×${tempo.toFixed(2)}${end > until ? "  ⚠ 다음 줄과 겹침" : ""}  ${L.say}`);
  }
  // 장별 트랙: 각 줄을 제 시각에 놓고 장 길이만큼
  const ins = lines.flatMap((l) => ["-i", l.file]);
  const fc = lines.map((l, i) => `[${i}]adelay=${Math.round(l.t0 * 1000)}|${Math.round(l.t0 * 1000)}[d${i}]`).join(";") + ";" + lines.map((_, i) => `[d${i}]`).join("") + `amix=inputs=${lines.length}:normalize=0,apad=whole_dur=${S.duration}[v]`;
  const raw = `${OUT}/slide-${S.id}.wav`;
  sh("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", fc, "-map", "[v]", "-ar", "48000", "-ac", "2", raw]);
  const ln = spawnSync("ffmpeg", ["-hide_banner", "-i", raw, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const m = JSON.parse(ln.slice(ln.lastIndexOf("{"), ln.lastIndexOf("}") + 1));
  sh("ffmpeg", ["-v", "error", "-y", "-i", raw, "-af", `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`, "-c:a", "aac", "-b:a", "160k", `${OUT}/slide-${S.id}.m4a`]);
  sh("rm", ["-f", raw]);
  timing.slides.push({ id: S.id, file: `assets/audio/narration/slide-${S.id}.m4a`, lines: lines.map(({ file, ...l }) => l) });
}
await writeFile(`${OUT}/timing.js`, "/* 자동 생성: tools/narrate.mjs (Typecast 실제 음성 시각) */\nwindow.NARRATION_TIMING = " + JSON.stringify(timing, null, 2) + ";\n");
console.log("✔ assets/audio/narration/slide-1~3.m4a + timing.js — 발표 화면을 새로고침하면 음성과 자막이 함께 나옵니다");
