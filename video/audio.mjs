/* BGM + 효과음을 코드로 합성해 WAV 로 저장 (외부 음원·저작권 걱정 없음)
   - BGM : 96bpm 로파이 패드 + 부드러운 킥/하이햇 + 벨 아르페지오
   - SFX : whoosh(장면전환) · pop(등장) · drop(영수증 떨어짐) · type(행 입력) · ding(합계) · stamp(도장)
   큐는 scenes.js 에서 cue(name, t, gain) 로 등록 → TL.cues 로 전달됩니다.
   자체 음원을 쓰려면 BGM=path/to/music.mp3 로 지정 (ffmpeg 로 길이 맞춰 믹스). */
import { writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const SR = 44100;
const TAU = Math.PI * 2;

// 결정적 노이즈 (매번 같은 소리)
function rng(seed = 1) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
}
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

/* ------------------------------------------------------------------ BGM */
function bgm(L, R, dur) {
  const bpm = 96, beat = 60 / bpm, bar = beat * 4;
  // Fmaj7 – Em7 – Dm7 – Cmaj7 (각 1마디)
  const chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
  const n = Math.floor(dur * SR);
  const noise = rng(7);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const bi = Math.floor(t / bar), ch = chords[bi % 4], tb = t - bi * bar;
    // 패드: 살짝 디튠된 사인+삼각, 마디마다 부드러운 어택
    const env = Math.min(1, tb / 0.4) * (0.75 + 0.25 * Math.cos(TAU * tb / bar));
    let pad = 0;
    for (const m of ch) {
      const f = mtof(m);
      pad += Math.sin(TAU * f * t) * 0.5 + Math.sin(TAU * f * 1.003 * t) * 0.35;
      pad += (2 / Math.PI) * Math.asin(Math.sin(TAU * f * 0.5 * t)) * 0.15;
    }
    pad *= 0.022 * env;
    // 베이스 (루트 한 옥타브 아래)
    const bass = Math.sin(TAU * mtof(ch[0] - 12) * t) * 0.06 * Math.min(1, tb / 0.05) * Math.exp(-tb * 0.9);
    // 킥 (1, 3박)
    const tbeat = t % (beat * 2);
    const kick = Math.sin(TAU * (50 + 90 * Math.exp(-tbeat * 30)) * tbeat) * Math.exp(-tbeat * 9) * 0.16;
    // 하이햇 (8분음 뒷박)
    const th = (t + beat / 2) % beat;
    const hat = noise() * Math.exp(-th * 60) * 0.025;
    // 벨 아르페지오 (8분음)
    const e8 = beat / 2, ai = Math.floor(t / e8), te = t - ai * e8;
    const note = ch[[0, 2, 1, 3, 2, 1, 3, 2][ai % 8]] + 12;
    const bell = (Math.sin(TAU * mtof(note) * t) + 0.3 * Math.sin(TAU * mtof(note) * 3 * t)) * Math.exp(-te * 7) * 0.022;
    let s = pad + bass + kick + hat + bell;
    lp += (s - lp) * 0.35; // 살짝 따뜻하게
    // 시작 페이드인 0.3s / 끝 페이드아웃 1.2s
    const fade = Math.min(1, t / 0.3, (dur - t) / 1.2);
    const v = lp * Math.max(0, fade);
    L[i] += v * (1 + 0.15 * Math.sin(TAU * 0.13 * t));
    R[i] += v * (1 - 0.15 * Math.sin(TAU * 0.13 * t));
  }
}

/* ------------------------------------------------------------------ SFX */
const SFX = {
  whoosh(len = 0.45) {
    const n = rng(3), out = new Float32Array(len * SR); let lp = 0, bp = 0;
    for (let i = 0; i < out.length; i++) {
      const p = i / out.length, k = 0.02 + 0.25 * Math.sin(Math.PI * p);
      lp += (n() - lp) * k; bp += (lp - bp) * 0.5;
      out[i] = (lp - bp) * Math.sin(Math.PI * p) ** 2 * 1.1;
    }
    return out;
  },
  pop(len = 0.12) {
    const out = new Float32Array(len * SR);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR, f = 520 + 900 * Math.exp(-t * 40);
      out[i] = Math.sin(TAU * f * t) * Math.exp(-t * 38) * 0.45;
    }
    return out;
  },
  drop(len = 0.22) {
    const n = rng(11), out = new Float32Array(len * SR); let lp = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / SR; lp += (n() - lp) * 0.25;
      out[i] = (lp * 0.9 + Math.sin(TAU * 140 * t) * 0.4) * Math.exp(-t * 26) * 0.6;
    }
    return out;
  },
  type(len = 0.3) {
    // 짧은 키 클릭 4번
    const n = rng(5), out = new Float32Array(len * SR);
    for (const [o, g] of [[0, 1], [0.06, 0.8], [0.13, 0.9], [0.2, 0.7]]) {
      const s0 = Math.floor(o * SR);
      for (let i = 0; i < 0.03 * SR && s0 + i < out.length; i++) {
        const t = i / SR;
        out[s0 + i] += (n() * 0.5 + Math.sin(TAU * 1800 * t) * 0.5) * Math.exp(-t * 180) * 0.4 * g;
      }
    }
    return out;
  },
  ding(len = 1.4) {
    const out = new Float32Array(len * SR);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      out[i] = (Math.sin(TAU * 1318.5 * t) + 0.5 * Math.sin(TAU * 1975.5 * t) + 0.25 * Math.sin(TAU * 2637 * t))
        * Math.exp(-t * 3.2) * Math.min(1, t / 0.003) * 0.28;
    }
    return out;
  },
  stamp(len = 0.35) {
    const n = rng(9), out = new Float32Array(len * SR); let lp = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / SR; lp += (n() - lp) * 0.12;
      out[i] = (Math.sin(TAU * (70 + 60 * Math.exp(-t * 25)) * t) * 0.9 + lp * 1.2) * Math.exp(-t * 14) * 0.7;
    }
    return out;
  },
};

function mixCue(L, R, { name, t, gain }) {
  const buf = SFX[name]?.();
  if (!buf) return;
  const s0 = Math.floor(t * SR);
  for (let i = 0; i < buf.length && s0 + i < L.length; i++) {
    L[s0 + i] += buf[i] * gain;
    R[s0 + i] += buf[i] * gain;
  }
}

function toWav(L, R) {
  const n = L.length, data = Buffer.alloc(n * 4);
  // 피크 정규화 → -1 dBFS
  let peak = 1e-9;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = Math.min(4, 0.89 / peak);
  for (let i = 0; i < n; i++) {
    data.writeInt16LE(Math.round(Math.tanh(L[i] * g) * 32767), i * 4);
    data.writeInt16LE(Math.round(Math.tanh(R[i] * g) * 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

export async function renderAudio({ duration, cues, out }) {
  const n = Math.ceil(duration * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  if (!process.env.BGM) bgm(L, R, duration);
  for (const c of cues) mixCue(L, R, c);
  await writeFile(out, toWav(L, R));

  // 외부 BGM 지정 시: 효과음 트랙 위에 BGM(-14dB, 끝 1.2초 페이드아웃)을 섞음
  if (process.env.BGM) {
    const tmp = out.replace(/\.wav$/, ".sfx.wav");
    execFileSync("mv", [out, tmp]);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tmp, "-stream_loop", "-1", "-i", process.env.BGM,
      "-filter_complex",
      `[1:a]volume=0.2,afade=t=out:st=${(duration - 1.2).toFixed(2)}:d=1.2[b];[0:a][b]amix=inputs=2:duration=first:normalize=0`,
      "-t", String(duration), out]);
    execFileSync("rm", [tmp]);
  }
}
