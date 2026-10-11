/* 에피소드를 AutoFlowCut 프로젝트 재료로 변환 → CapCut/Premiere/Vrew 로 내보내 편집용
   실행: EP=ep01-meeting npm run afc     (EP 생략 시 모든 에피소드)
   결과: out/afc/<ep>/
     scenes.csv              AutoFlowCut 씬 CSV (prompt · subtitle · 시간). 문장 1개 = 컷 1개
     scenes/scene_N.jpg      각 컷 이미지 = 우리 영상에서 그 문장이 끝나는 순간의 화면 (브랜드 디자인 그대로)
     media/narration.wav     장면별 타입캐스트 음성을 영상 시각대로 이어 붙인 나레이션 (vo 가 있을 때만)
     media/narration.srt     문장 단위 자막
     media/sfx/bgm_0000.wav  BGM + 효과음 (0초부터, 나레이션 없음)
   AutoFlowCut 은 media/ 의 첫 오디오를 나레이션, .srt 를 자막, media/sfx/*_MMSS.wav 를 효과음으로 인식합니다.
   나레이션 타이밍은 vo/manifest.json 의 단어 타이밍(타입캐스트 with-timestamps)이 있으면 그걸로, 없으면 글자 수로 추정. */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdir, readdir, writeFile, rm } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "../server.mjs";
import { renderAudio } from "./audio.mjs";

const PORT = 8094;
const EXEC = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const eps = process.env.EP
  ? [process.env.EP]
  : (await readdir("video/episodes", { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);

// 장면 종류별 영문 프롬프트 (AutoFlowCut 에서 AI 이미지로 바꿔 만들고 싶을 때만 사용)
const STYLE = "clean flat editorial graphic, cream paper background with subtle dot texture, rust orange accent, Korean office worker productivity theme, no text";
const PROMPT = {
  hook: "bold title card teasing a finished office document, " + STYLE,
  before: "messy desk with scattered receipts and handwritten notes, tired office worker, " + STYLE,
  sheet: "neatly organized expense report table appearing on a laptop screen, " + STYLE,
  doc: "clean meeting minutes document with checklist and action table on a laptop, " + STYLE,
  steps: "three simple numbered steps cards, " + STYLE,
  cta: "smartphone comment box with a friendly call to action, " + STYLE,
};

const sentences = (t) => t.split(/(?<=[.?!])\s+/).map((x) => x.trim()).filter(Boolean);
const srtTime = (x) => new Date(Math.max(0, x) * 1000).toISOString().slice(11, 23).replace(".", ",");
const csvCell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

// 한 장면의 나레이션을 문장 단위 컷으로 나눔 → [{ text, t0, t1 }] (실제 영상 시각)
function splitShots(v, item) {
  const ss = sentences(v.text);
  const words = item?.words || [];
  if (words.length) {
    // 단어 타이밍을 문장 경계에 맞춰 묶음 (각 문장의 어절 수만큼 단어를 소비)
    let k = 0;
    return ss.map((s) => {
      const n = s.split(/\s+/).length;
      const ws = words.slice(k, k + n); k += n;
      const a = ws[0]?.start ?? 0, b = ws[ws.length - 1]?.end ?? item.dur;
      return { text: s, t0: v.t + a, t1: v.t + b };
    });
  }
  const total = ss.reduce((a, s) => a + s.length, 0);
  let acc = 0;
  return ss.map((s) => {
    const a = acc / total; acc += s.length;
    return { text: s, t0: v.t + a * v.dur, t1: v.t + (acc / total) * v.dur };
  });
}

const server = createServer(process.cwd()).listen(PORT);
const browser = await chromium.launch({ executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });

for (const ep of eps) {
  const out = `out/afc/${ep}`;
  await rm(out, { recursive: true, force: true });
  await mkdir(`${out}/scenes`, { recursive: true });
  await mkdir(`${out}/media/sfx`, { recursive: true });

  await page.goto(`http://localhost:${PORT}/video/video.html?ep=${ep}&render=1`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.body.dataset.ready === "1", { timeout: 15000 });
  const { duration, cues, voice, scenes } = await page.evaluate(() => ({
    duration: window.TL.duration, cues: window.TL.cues, voice: window.TL.voice, scenes: window.TL.scenes,
  }));
  const mfPath = `video/episodes/${ep}/vo/manifest.json`;
  const manifest = existsSync(mfPath) ? JSON.parse(readFileSync(mfPath, "utf8")) : { items: [] };

  // 1) 컷 목록: 장면마다 문장 단위로 쪼개고, 컷 경계는 다음 문장 시작(또는 장면 끝)까지
  const shots = [];
  for (const sc of scenes) {
    const v = voice.find((x) => x.scene === sc.i);
    const parts = v ? splitShots(v, manifest.items.find((x) => x.scene === sc.i)) : [{ text: "", t0: sc.t0, t1: sc.t1 }];
    parts.forEach((p, j) => {
      const start = j === 0 ? sc.t0 : p.t0;
      const end = j === parts.length - 1 ? sc.t1 : parts[j + 1].t0;
      shots.push({ scene: sc, text: p.text, start, end, say0: p.t0, say1: p.t1, grab: Math.min(end - 0.2, Math.max(p.t1, start + 0.6)) });
    });
  }

  // 2) 컷 이미지: 문장이 끝나는 순간의 화면 (장면 퇴장 애니메이션 직전)
  for (const [n, s] of shots.entries()) {
    await page.evaluate((t) => window.seek(t), s.grab);
    await page.screenshot({ path: `${out}/scenes/scene_${n + 1}.jpg`, type: "jpeg", quality: 92 });
  }

  // 3) 씬 CSV (AutoFlowCut csv-scenes-schema)
  const head = "prompt,prompt_ko,subtitle,shot_type,duration,start_time,end_time,parent_scene";
  const rows = shots.map((s) => [
    PROMPT[s.scene.type] || STYLE,
    `${s.scene.type} 장면`,
    s.text,
    "narration",
    (s.end - s.start).toFixed(3), s.start.toFixed(3), s.end.toFixed(3),
    `S${String(s.scene.i + 1).padStart(3, "0")}`,
  ].map(csvCell).join(","));
  await writeFile(`${out}/scenes.csv`, "﻿" + [head, ...rows].join("\n") + "\n");

  // 4) 자막 (문장 단위, 실제로 말하는 구간)
  const srt = shots.filter((s) => s.text).map((s, i) => `${i + 1}\n${srtTime(s.say0)} --> ${srtTime(s.say1)}\n${s.text}\n`).join("\n");
  await writeFile(`${out}/media/narration.srt`, srt);

  // 5) 오디오: BGM+효과음 트랙, 그리고 (음성이 있으면) 나레이션 트랙
  await renderAudio({ duration, cues, voice: [], out: `${out}/media/sfx/bgm_0000.wav` });
  const spoken = voice.filter((v) => v.file && existsSync(v.file));
  if (spoken.length) {
    const inputs = spoken.flatMap((v) => ["-i", v.file]);
    const delays = spoken.map((v, i) => `[${i}:a]adelay=${Math.round(v.t * 1000)}|${Math.round(v.t * 1000)}[a${i}]`).join(";");
    const mix = `${delays};${spoken.map((_, i) => `[a${i}]`).join("")}amix=inputs=${spoken.length}:normalize=0,apad,atrim=0:${duration}`;
    execFileSync("ffmpeg", ["-y", "-v", "error", ...inputs, "-filter_complex", mix, "-ac", "1", "-ar", "44100", `${out}/media/narration.wav`]);
  }
  console.log(`✔ ${out}  (컷 ${shots.length}개 · ${duration}s · 나레이션 ${spoken.length ? "포함" : "없음 → npm run tts 후 다시 실행"})`);
}

await browser.close();
server.close();
