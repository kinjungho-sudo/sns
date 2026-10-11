/* BGM + 효과음 + 나레이션을 WAV 한 트랙으로 믹스 (BGM·효과음은 코드로 합성 → 저작권 걱정 없음)
   - BGM : 108bpm D장조, 기타 스트럼(플럭) + 베이스 + 글로켄 + 킥/클랩/셰이커 — 밝고 경쾌하게
   - 나레이션: tts.mjs 가 만든 음성을 장면 시각에 맞춰 얹고, 그 구간은 BGM 을 낮춤(덕킹)
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
// 카플러스-스트롱 플럭(통기타·우쿨렐레 느낌) — 밝고 가벼운 소리
function pluck(freq, len, seed, bright = 0.5) {
  const out = new Float32Array(Math.floor(len * SR));
  const N = Math.max(2, Math.round(SR / freq));
  const r = rng(seed), buf = new Float32Array(N);
  for (let i = 0; i < N; i++) buf[i] = r();
  let idx = 0;
  for (let i = 0; i < out.length; i++) {
    const a = buf[idx], b = buf[(idx + 1) % N];
    const y = (a * bright + b * (1 - bright)) * 0.996;
    buf[idx] = y; out[i] = a; idx = (idx + 1) % N;
  }
  return out;
}

function addAt(L, R, buf, t, gain, pan = 0) {
  const s0 = Math.floor(t * SR);
  const gl = gain * (1 - pan) , gr = gain * (1 + pan);
  for (let i = 0; i < buf.length && s0 + i < L.length; i++) { L[s0 + i] += buf[i] * gl; R[s0 + i] += buf[i] * gr; }
}

function bgm(L, R, dur) {
  const bpm = 108, beat = 60 / bpm, bar = beat * 4;
  // D – A – Bm – G (장조, 밝은 진행)
  const chords = [[62, 66, 69, 74], [61, 64, 69, 73], [59, 62, 66, 71], [59, 62, 67, 71]];
  const roots = [50, 45, 47, 43];
  const noise = rng(21);
  const cache = new Map();
  const pl = (m, len, seed, br) => {
    const k = `${m}|${len}|${seed}|${br}`;
    if (!cache.has(k)) cache.set(k, pluck(mtof(m), len, seed, br));
    return cache.get(k);
  };
  const bars = Math.ceil(dur / bar);
  for (let b = 0; b < bars; b++) {
    const ch = chords[b % 4], t0 = b * bar;
    // 기타 스트럼: 다운·다운업·업다운업 리듬
    for (const [beatPos, up, g] of [[0, 0, 1], [1, 0, 0.7], [1.5, 1, 0.55], [2.5, 1, 0.55], [3, 0, 0.7], [3.5, 1, 0.5]]) {
      const notes = up ? [...ch].reverse() : ch;
      notes.forEach((m, j) => addAt(L, R, pl(m, 1.0, 3 + j, 0.5), t0 + beatPos * beat + j * 0.012, 0.055 * g, (j - 1.5) * 0.12));
    }
    // 베이스
    for (const bp of [0, 2, 2.5]) addAt(L, R, pl(roots[b % 4], 0.6, 9, 0.7), t0 + bp * beat, 0.16);
    // 글로켄 멜로디 (화음 구성음)
    const mel = [ch[3] + 12, ch[2] + 12, ch[1] + 12, ch[2] + 12];
    [[0, 0], [0.75, 1], [1.5, 2], [2.5, 3]].forEach(([bp, k]) => {
      const f = mtof(mel[k]), s0 = Math.floor((t0 + bp * beat) * SR), n = Math.floor(0.7 * SR);
      for (let i = 0; i < n && s0 + i < L.length; i++) {
        const t = i / SR, v = (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * f * 4 * t) * Math.exp(-t * 12)) * Math.exp(-t * 5) * 0.03;
        L[s0 + i] += v * 0.8; R[s0 + i] += v * 1.2;
      }
    });
  }
  // 리듬: 킥(1·3) · 클랩(2·4) · 셰이커(16분)
  const n = Math.floor(dur * SR);
  let hp = 0, prev = 0, cl = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const tk = t % (beat * 2);
    const kick = Math.sin(TAU * (55 + 110 * Math.exp(-tk * 35)) * tk) * Math.exp(-tk * 11) * 0.18;
    const tc = (t + beat) % (beat * 2);
    const nz = noise();
    cl += (nz - cl) * 0.6;
    const clap = (nz - cl) * Math.exp(-tc * 28) * 0.07;
    const ts = t % (beat / 4);
    hp = 0.85 * (hp + nz - prev); prev = nz;
    const shaker = hp * Math.exp(-ts * 70) * (Math.floor(t / (beat / 4)) % 2 ? 0.018 : 0.011);
    const v = kick + clap + shaker;
    L[i] += v; R[i] += v;
  }
  // 시작 페이드인 0.3s / 끝 페이드아웃 1.5s
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = Math.max(0, Math.min(1, t / 0.3, (dur - t) / 1.5));
    L[i] *= f; R[i] *= f;
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

// 음성 파일 → 44.1kHz 모노 Float32 (ffmpeg 로 디코딩)
function decode(file) {
  const raw = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-f", "f32le", "-ac", "1", "-ar", String(SR), "-"], { maxBuffer: 1 << 28 });
  return new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
}

// 나레이션 구간에서 BGM 을 낮춤 (덕킹)
function duckGain(n, voice, low = 0.3, ramp = 0.2) {
  const g = new Float32Array(n).fill(1);
  for (const v of voice) {
    const a = v.t, b = v.t + v.dur;
    for (let i = Math.max(0, Math.floor((a - ramp) * SR)); i < Math.min(n, Math.ceil((b + ramp) * SR)); i++) {
      const t = i / SR;
      const k = t < a ? (a - t) / ramp : t > b ? (t - b) / ramp : 0;
      g[i] = Math.min(g[i], low + (1 - low) * Math.min(1, k));
    }
  }
  return g;
}

/* voice: [{ file, t, dur }] — file 이 없으면(아직 TTS 전) 덕킹 없이 BGM 만 */
export async function renderAudio({ duration, cues, voice = [], out }) {
  const n = Math.ceil(duration * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  const spoken = voice.filter((v) => v.file);

  // 1) BGM (+ 나레이션 구간 덕킹)
  if (!process.env.BGM) {
    const bl = new Float32Array(n), br = new Float32Array(n);
    bgm(bl, br, duration);
    const g = duckGain(n, spoken);
    const level = spoken.length ? 0.8 : 1;
    for (let i = 0; i < n; i++) { L[i] += bl[i] * g[i] * level; R[i] += br[i] * g[i] * level; }
  }
  // 2) 효과음 (나레이션이 있으면 살짝 작게)
  for (const c of cues) mixCue(L, R, { ...c, gain: c.gain * (spoken.length ? 0.6 : 1) });
  // 3) 나레이션
  for (const v of spoken) {
    const buf = decode(v.file);
    addAt(L, R, buf, v.t, 1.6);
  }
  await writeFile(out, toWav(L, R));

  // 외부 BGM 지정 시: 위 트랙 위에 BGM(-14dB, 나레이션 구간 추가 감쇄, 끝 1.5초 페이드아웃)을 섞음
  if (process.env.BGM) {
    const tmp = out.replace(/\.wav$/, ".mix.wav");
    execFileSync("mv", [out, tmp]);
    const duck = spoken.map((v) => `volume=enable='between(t,${(v.t - 0.2).toFixed(2)},${(v.t + v.dur + 0.2).toFixed(2)})':volume=0.35`).join(",");
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tmp, "-stream_loop", "-1", "-i", process.env.BGM,
      "-filter_complex",
      `[1:a]volume=0.2${duck ? "," + duck : ""},afade=t=out:st=${(duration - 1.5).toFixed(2)}:d=1.5[b];[0:a][b]amix=inputs=2:duration=first:normalize=0`,
      "-t", String(duration), out]);
    execFileSync("rm", [tmp]);
  }
}
