// 배경음악 만들기: 잔잔한 앰비언트 패드 + 드문 벨 소리, 이음매 없이 반복되도록 렌더 → assets/audio/bgm.m4a
// node tools/make-bgm.mjs      (Chromium의 OfflineAudioContext로 합성, ffmpeg로 인코딩·음량 맞춤)
// 저작권 걱정 없는 직접 합성 음원. 반복 구간 = 화음 4개 × 2바퀴(약 53초).
import { chromium } from "playwright";
import { writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const exe = process.env.CHROMIUM_PATH || (() => { const d = existsSync("/opt/pw-browsers") && readdirSync("/opt/pw-browsers").find((x) => /^chromium-\d+$/.test(x)); return d ? `/opt/pw-browsers/${d}/chrome-linux/chrome` : undefined; })();
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage();
const b64 = await page.evaluate(async () => {
  const SR = 44100, BPM = 72, beat = 60 / BPM, bar = beat * 4, chordLen = bar * 2, cycle = chordLen * 4;
  const CYCLES = 4, total = cycle * CYCLES;
  const ac = new OfflineAudioContext(2, Math.ceil(SR * total), SR);
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // 잔향: 3초 노이즈 감쇠
  const ir = ac.createBuffer(2, SR * 3.2, SR);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.2); }
  const verb = ac.createConvolver(); verb.buffer = ir;
  const master = ac.createGain(); master.gain.value = .9; master.connect(ac.destination);
  const wet = ac.createGain(); wet.gain.value = .55; verb.connect(wet).connect(master);
  const dry = ac.createGain(); dry.gain.value = .6; dry.connect(master);
  const send = (node) => { node.connect(dry); node.connect(verb); };

  // 화음: Dmaj9 – Bm9 – Gmaj9 – A6/9 (따뜻하고 밝게)
  const CH = [[50, 57, 61, 64, 66], [47, 54, 57, 61, 62], [43, 50, 54, 57, 59], [45, 52, 54, 57, 59]];
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1100; lp.Q.value = .3; send(lp);
  for (let k = 0; k < CYCLES * 4; k++) {
    const t0 = k * chordLen, ch = CH[k % 4];
    for (const n of ch) for (const det of [-7, 6]) {
      const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = hz(n + 12); o.detune.value = det;
      const g = ac.createGain(); const peak = .010;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + 2.2);
      g.gain.setValueAtTime(peak, t0 + chordLen - .4); g.gain.linearRampToValueAtTime(0, t0 + chordLen + 1.6);
      o.connect(g).connect(lp); o.start(t0); o.stop(t0 + chordLen + 1.7);
    }
    // 낮은 사인 베이스
    const b = ac.createOscillator(); b.type = "sine"; b.frequency.value = hz(ch[0] - 12);
    const bg = ac.createGain(); bg.gain.setValueAtTime(0, t0); bg.gain.linearRampToValueAtTime(.05, t0 + 1.5); bg.gain.setValueAtTime(.05, t0 + chordLen - .5); bg.gain.linearRampToValueAtTime(0, t0 + chordLen + 1);
    b.connect(bg); send(bg); b.start(t0); b.stop(t0 + chordLen + 1.1);
  }
  // 벨: 두 바퀴마다 같은 무늬가 반복되도록 (이음매 없는 반복)
  const pattern = [];
  for (let k = 0; k < 8; k++) for (let s = 0; s < 8; s++) if (rnd() < .32) pattern.push([k, s, Math.floor(rnd() * 5), rnd() < .3 ? 24 : 12]);
  for (let rep = 0; rep < CYCLES / 2; rep++) for (const [k, s, idx, oct] of pattern) {
    const t = (rep * 8 + k) * chordLen + s * beat, n = CH[k % 4][idx] + oct;
    for (const [mul, amp] of [[1, .045], [2.01, .012], [3.98, .005]]) {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = hz(n) * mul;
      const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + 2.6);
      o.connect(g); send(g); o.start(t); o.stop(t + 2.7);
    }
  }
  const buf = await ac.startRendering();
  // 가운데 두 바퀴(1~3번째 바퀴)만 잘라내면 앞뒤 잔향이 이어져 이음매가 없다
  const from = Math.round(cycle * 1 * SR), len = Math.round(cycle * 2 * SR);
  const L = buf.getChannelData(0).slice(from, from + len), R = buf.getChannelData(1).slice(from, from + len);
  // WAV(16bit) 인코딩
  const dv = new DataView(new ArrayBuffer(44 + len * 4)); const ws = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
  ws(0, "RIFF"); dv.setUint32(4, 36 + len * 4, true); ws(8, "WAVEfmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true);
  dv.setUint32(24, SR, true); dv.setUint32(28, SR * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); ws(36, "data"); dv.setUint32(40, len * 4, true);
  for (let i = 0; i < len; i++) { dv.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); dv.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
  const bytes = new Uint8Array(dv.buffer); let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
});
await browser.close();
mkdirSync(`${ROOT}assets/audio`, { recursive: true });
const wav = `${ROOT}assets/audio/bgm-raw.wav`; writeFileSync(wav, Buffer.from(b64, "base64"));
// 배경용이라 조용하게: -23 LUFS, 피크 -3 dBTP. 재생 볼륨은 발표 화면에서 한 번 더 낮춘다.
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wav, "-af", "loudnorm=I=-23:TP=-3:LRA=11", "-ar", "44100", "-c:a", "aac", "-b:a", "160k", `${ROOT}assets/audio/bgm.m4a`]);
execFileSync("rm", [wav]);
console.log("✔ assets/audio/bgm.m4a");
