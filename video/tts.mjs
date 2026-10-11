/* 타입캐스트(Typecast)로 장면별 나레이션 음성 만들기
   실행: npm run tts                        → 모든 에피소드
         EP=ep01-meeting npm run tts        → 특정 에피소드만
         npm run tts -- --voices            → 쓸 수 있는 목소리 목록 출력

   필요한 환경변수
     TYPECAST_API_KEY   : 타입캐스트 API 키 (필수)
     TYPECAST_VOICE_ID  : 목소리 ID (필수, --voices 로 확인)
     TYPECAST_MODEL     : 기본 ssfm-v21
     TYPECAST_EMOTION   : 기본 normal (목소리가 지원하면 happy 등)
     TYPECAST_TEMPO     : 말 빠르기, 기본 1.0 (0.9 = 10% 느리게)

   결과: video/episodes/<ep>/vo/NN-<장면>.wav + manifest.json
   원고(vo)·목소리·설정이 바뀐 줄만 다시 만들고, 나머지는 그대로 재사용합니다.
   manifest.json 의 길이(dur)에 맞춰 영상의 장면 길이가 자동으로 늘어납니다. */
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import vm from "node:vm";

const API = "https://api.typecast.ai/v1";
const KEY = process.env.TYPECAST_API_KEY;
const VOICE = process.env.TYPECAST_VOICE_ID;
const MODEL = process.env.TYPECAST_MODEL || "ssfm-v21";
const EMOTION = process.env.TYPECAST_EMOTION || "normal";
const TEMPO = Number(process.env.TYPECAST_TEMPO || 1);

if (!KEY) {
  console.error("TYPECAST_API_KEY 가 없습니다. 환경변수로 API 키를 넣어주세요.");
  process.exit(1);
}

async function call(path, init = {}) {
  const res = await fetch(API + path, { ...init, headers: { "X-API-KEY": KEY, "Content-Type": "application/json", ...init.headers } });
  if (!res.ok) throw new Error(`Typecast ${path} → ${res.status} ${await res.text()}`);
  return res;
}

if (process.argv.includes("--voices")) {
  const list = await (await call(`/voices?model=${MODEL}`)).json();
  for (const v of list) console.log(`${v.voice_id}\t${v.voice_name}\t${(v.emotions || []).join(",")}`);
  process.exit(0);
}
if (!VOICE) {
  console.error("TYPECAST_VOICE_ID 가 없습니다. `npm run tts -- --voices` 로 목소리 ID 를 고른 뒤 넣어주세요.");
  process.exit(1);
}

async function loadEpisode(ep) {
  const ctx = { window: {} };
  vm.runInNewContext(await readFile(`video/episodes/${ep}/episode.js`, "utf8"), ctx);
  return ctx.window.EPISODE;
}

const probe = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

const eps = process.env.EP
  ? [process.env.EP]
  : (await readdir("video/episodes", { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);

for (const ep of eps) {
  const E = await loadEpisode(ep);
  const dir = `video/episodes/${ep}/vo`;
  await mkdir(dir, { recursive: true });
  const mfPath = `${dir}/manifest.json`;
  const old = existsSync(mfPath) ? JSON.parse(await readFile(mfPath, "utf8")) : { items: [] };
  const items = [];

  for (const [i, s] of E.scenes.entries()) {
    if (!s.vo) continue;
    const hash = createHash("sha1").update(JSON.stringify([s.vo, VOICE, MODEL, EMOTION, TEMPO])).digest("hex").slice(0, 12);
    const name = `${String(i + 1).padStart(2, "0")}-${s.type}.wav`;
    const file = `${dir}/${name}`;
    const prev = old.items.find((x) => x.scene === i);
    if (prev && prev.hash === hash && existsSync(file)) { items.push(prev); console.log(`= ${file} (그대로)`); continue; }

    const res = await call("/text-to-speech", {
      method: "POST",
      body: JSON.stringify({
        voice_id: VOICE,
        text: s.vo,
        model: MODEL,
        language: "kor",
        prompt: { emotion_preset: EMOTION, emotion_intensity: 1 },
        output: { volume: 100, audio_pitch: 0, audio_tempo: TEMPO, audio_format: "wav" },
      }),
    });
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    const dur = +probe(file).toFixed(3);
    items.push({ scene: i, type: s.type, file: `video/episodes/${ep}/vo/${name}`, text: s.vo, hash, dur });
    console.log(`✔ ${file} (${dur}s)`);
  }
  await writeFile(mfPath, JSON.stringify({ voice: VOICE, model: MODEL, emotion: EMOTION, tempo: TEMPO, items }, null, 2) + "\n");
  console.log(`→ ${mfPath}`);
}
