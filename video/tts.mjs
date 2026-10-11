/* 타입캐스트(Typecast) API 로 장면별 나레이션 음성 + 단어 타이밍 만들기
   실행: npm run tts                        → 모든 에피소드
         EP=ep01-meeting npm run tts        → 특정 에피소드만
         npm run tts -- --voices            → 쓸 수 있는 목소리 목록 (한국어 지원만)

   API 키: TYPECAST_API_KEY 환경변수, 없으면 `cast login` 이 저장한 ~/.typecast/config.yaml 을 읽음
   목소리: TYPECAST_VOICE_ID (필수, --voices 로 확인)
   선택  : TYPECAST_MODEL (기본 ssfm-v30) · TYPECAST_EMOTION_PRESET (지정하면 smart 대신 프리셋: normal/happy/toneup…)
           TYPECAST_TEMPO (기본 1.0) · TYPECAST_REMOVE_SILENCE_MS (기본 300, 문장 사이 무음을 최대 300ms 만 남김)

   호출: POST https://api.typecast.ai/v1/text-to-speech/with-timestamps?granularity=word
         → base64 음성 + 단어별 시작/끝 시각. ssfm-v30 의 emotion_type "smart" 에
           앞·뒤 장면 문장(previous_text/next_text)을 넘겨 장면이 이어지는 말투로 읽게 함.
   결과: video/episodes/<ep>/vo/NN-<장면>.wav + manifest.json (길이 · 단어 타이밍)
   원고·목소리·설정이 바뀐 줄만 다시 만들고 나머지는 재사용 → 유료 요청 최소화.
   manifest.json 의 길이(dur)에 맞춰 영상 장면 길이가 자동으로 늘어납니다. */
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import vm from "node:vm";

const API = process.env.TYPECAST_BASE_URL || "https://api.typecast.ai";
const VOICE = process.env.TYPECAST_VOICE_ID;
const MODEL = process.env.TYPECAST_MODEL || "ssfm-v30";
const PRESET = process.env.TYPECAST_EMOTION_PRESET || "";
const TEMPO = Number(process.env.TYPECAST_TEMPO || 1);
const SILENCE = Number(process.env.TYPECAST_REMOVE_SILENCE_MS ?? 300);

// 타입캐스트 연동 출처 표시 (API 페이지의 안내에 따라 User-Agent 끝에 붙임)
const INTEGRATION_SOURCE = process.env.TYPECAST_INTEGRATION_SOURCE || "api-page";
const GENERATED_BY = process.env.TYPECAST_GENERATED_BY || "claude-code";
const USER_AGENT = `sns-video-tts/1.0 node/${process.versions.node} typecast-integration/1 (source=${INTEGRATION_SOURCE}; generated_by=${GENERATED_BY})`;

function apiKey() {
  if (process.env.TYPECAST_API_KEY) return process.env.TYPECAST_API_KEY;
  const cfg = join(homedir(), ".typecast", "config.yaml"); // cast login 이 저장하는 위치
  if (existsSync(cfg)) {
    const m = readFileSync(cfg, "utf8").match(/^\s*api_key:\s*["']?([^"'\s]+)/m);
    if (m) return m[1];
  }
  return null;
}
const KEY = apiKey();
if (!KEY) {
  console.error("타입캐스트 API 키가 없습니다. TYPECAST_API_KEY 환경변수를 넣거나 `cast login` 을 먼저 해주세요.");
  process.exit(1);
}

async function call(path, body) {
  const res = await fetch(API + path, {
    method: body ? "POST" : "GET",
    headers: { "X-API-KEY": KEY, "Content-Type": "application/json", "User-Agent": USER_AGENT },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const hint = { 401: "API 키 확인", 402: "요금제·크레딧 확인", 403: "API 키 권한 확인", 429: "요청 한도 초과 — 잠시 후 다시" }[res.status] || "";
    throw new Error(`Typecast ${path} → ${res.status} ${hint}\n${await res.text()}`);
  }
  return res.json();
}

if (process.argv.includes("--voices")) {
  const list = await call(`/v1/voices?model=${MODEL}`);
  for (const v of list) {
    const langs = v.language || v.languages || [];
    if (langs.length && !String(langs).includes("kor")) continue;
    console.log(`${v.voice_id}\t${v.voice_name}\t${v.gender || ""}\t${v.age || ""}\t${(v.emotions || []).join(",")}`);
  }
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

// 화면 글자와 읽는 글자가 다를 때(숫자·영문) 읽기용으로만 바꿈. 화면/자막 원고(vo)는 그대로.
const speakable = (t) => t.replace(/30초/g, "삼십 초").replace(/40분/g, "사십 분").replace(/Claude/g, "클로드").replace(/ChatGPT/g, "챗지피티");

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
  const vos = E.scenes.map((s) => (s.vo ? speakable(s.vo) : ""));

  for (const [i, s] of E.scenes.entries()) {
    if (!s.vo) continue;
    const prompt = PRESET
      ? { emotion_type: "preset", emotion_preset: PRESET, emotion_intensity: 1 }
      : { emotion_type: "smart", previous_text: vos[i - 1] || undefined, next_text: vos[i + 1] || undefined };
    const body = {
      voice_id: VOICE, text: vos[i], model: MODEL, language: "kor", prompt,
      output: { audio_format: "wav", audio_tempo: TEMPO, remove_silence_ms: SILENCE, target_lufs: -16 },
    };
    const hash = createHash("sha1").update(JSON.stringify(body)).digest("hex").slice(0, 12);
    const name = `${String(i + 1).padStart(2, "0")}-${s.type}.wav`;
    const file = `${dir}/${name}`;
    const prev = old.items.find((x) => x.scene === i);
    if (prev && prev.hash === hash && existsSync(file)) { items.push(prev); console.log(`= ${file} (그대로)`); continue; }

    const r = await call("/v1/text-to-speech/with-timestamps?granularity=word", body);
    await writeFile(file, Buffer.from(r.audio, "base64"));
    const dur = +Number(r.audio_duration).toFixed(3);
    items.push({ scene: i, type: s.type, file: `video/episodes/${ep}/vo/${name}`, text: s.vo, hash, dur, words: r.words || [] });
    console.log(`✔ ${file} (${dur}s)`);
  }
  await writeFile(mfPath, JSON.stringify({ voice: VOICE, model: MODEL, preset: PRESET || "smart", tempo: TEMPO, items }, null, 2) + "\n");
  console.log(`→ ${mfPath}`);
}
