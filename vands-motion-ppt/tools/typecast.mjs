// 타입캐스트 API로 내레이션 만들기 → assets/audio/narration/<키>.mp3 + files.js 갱신
//   TYPECAST_API_KEY=... node tools/typecast.mjs              (아직 음성이 없는 줄만: 1-img, 2-txt, 3-0)
//   TYPECAST_API_KEY=... node tools/typecast.mjs --all        (모든 줄을 새로 · 목소리 통일)
//   TYPECAST_VOICE_ID=tc_xxx 로 목소리 지정 (없으면 한국어 목소리 목록을 보여 주고 첫 번째 사용)
// 대본은 narration-script.txt 의 [키.mp3] 줄. 키는 직접 쓰지 말고 환경변수로만 넣는다.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const KEY = process.env.TYPECAST_API_KEY;
if (!KEY) { console.error("TYPECAST_API_KEY 환경변수가 없습니다."); process.exit(1); }
const API = "https://api.typecast.ai/v1", MODEL = process.env.TYPECAST_MODEL || "ssfm-v21";
const H = { "X-API-KEY": KEY, "Content-Type": "application/json" };
const ALL = process.argv.includes("--all");

const lines = [...readFileSync(`${ROOT}narration-script.txt`, "utf8").matchAll(/^\[([\w-]+)\.mp3\]\s*(.+?)(?:\s+←.*)?$/gm)].map((m) => ({ key: m[1], text: m[2].trim() }));
const dir = `${ROOT}assets/audio/narration/`;
const todo = lines.filter((l) => ALL || !existsSync(`${dir}${l.key}.mp3`));
if (!todo.length) { console.log("새로 만들 줄이 없습니다. (--all 로 전체 재생성)"); process.exit(0); }

let voice = process.env.TYPECAST_VOICE_ID;
if (!voice) {
  const r = await fetch(`${API}/voices?model=${MODEL}`, { headers: H });
  if (!r.ok) throw new Error(`목소리 목록 실패 ${r.status}: ${await r.text()}`);
  const list = await r.json(), arr = Array.isArray(list) ? list : list.voices || list.result || [];
  console.log("목소리 예시:", arr.slice(0, 15).map((v) => `${v.voice_id} ${v.voice_name || v.name || ""}`).join(" | "));
  voice = arr[0]?.voice_id; if (!voice) throw new Error("사용할 목소리가 없습니다.");
}
console.log(`목소리 ${voice} · ${todo.length}줄`);
for (const { key, text } of todo) {
  const r = await fetch(`${API}/text-to-speech`, { method: "POST", headers: H,
    body: JSON.stringify({ voice_id: voice, text, model: MODEL, language: "kor", prompt: { emotion_preset: "normal", emotion_intensity: 1 }, output: { audio_format: "mp3", audio_tempo: 1, volume: 100 } }) });
  if (!r.ok) throw new Error(`${key} 실패 ${r.status}: ${await r.text()}`);
  const raw = `${dir}${key}.raw.mp3`; writeFileSync(raw, Buffer.from(await r.arrayBuffer()));
  // 다른 줄과 음량 맞춤
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", raw, "-af", "loudnorm=I=-16:TP=-1.5", "-ar", "44100", "-b:a", "128k", `${dir}${key}.mp3`]); execFileSync("rm", [raw]);
  const sec = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `${dir}${key}.mp3`]).toString().trim();
  console.log(`✔ ${key}.mp3 ${(+sec).toFixed(1)}초`);
}
// files.js: 실제로 있는 파일만 등록
const keys = lines.map((l) => l.key).filter((k) => existsSync(`${dir}${k}.mp3`));
writeFileSync(`${dir}files.js`, `// 장면별 내레이션 음성 (키 = 부-순서). 파일이 있으면 장면이 시작될 때 자동 재생된다.\nwindow.VO_FILES = Object.fromEntries(${JSON.stringify(keys)}.map(k => [k, \`assets/audio/narration/\${k}.mp3\`]));\n`);
console.log("✔ files.js 갱신 · 장면 길이는 app.js 의 VO_LEN 을 위 초에 맞춰 조정");
