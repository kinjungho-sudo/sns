// 배경음악 만들기: 경쾌한 마림바 · 건반 팝 루프 → assets/audio/bgm.m4a
// node tools/make-bgm.mjs      (Chromium의 OfflineAudioContext로 합성, ffmpeg로 인코딩·음량 맞춤)
// 저작권 걱정 없는 직접 합성 음원. G장조 118BPM, 16마디(약 33초) 반복.
//   1~8마디: 마림바 아르페지오 + 엇박 건반 + 통통 튀는 베이스, 가벼운 킥·스냅·셰이커
//   9~16마디: 마림바 멜로디, 킥이 매 박으로 (조금 더 신나게)
// 앞뒤로 한 바퀴씩 더 렌더한 뒤 가운데 바퀴만 잘라 이음매 없이 반복된다.
import { chromium } from "playwright";
import { writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const exe = process.env.CHROMIUM_PATH || (() => { const d = existsSync("/opt/pw-browsers") && readdirSync("/opt/pw-browsers").find((x) => /^chromium-\d+$/.test(x)); return d ? `/opt/pw-browsers/${d}/chrome-linux/chrome` : undefined; })();
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage();
const b64 = await page.evaluate(async () => {
  const SR = 44100, BPM = 118, beat = 60 / BPM, bar = beat * 4, BARS = 16, loop = bar * BARS, LOOPS = 3, total = loop * LOOPS;
  const ac = new OfflineAudioContext(2, Math.ceil(SR * total), SR);
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let seed = 9; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const ir = ac.createBuffer(2, SR * 1.8, SR);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / d.length, 3.5); }
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.connect(ac.destination);
  const master = ac.createGain(); master.gain.value = .9; master.connect(comp);
  const verb = ac.createConvolver(); verb.buffer = ir; const wet = ac.createGain(); wet.gain.value = .35; verb.connect(wet).connect(master);
  const bus = (amt, pan = 0) => { const g = ac.createGain(), p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p).connect(master); const s = ac.createGain(); s.gain.value = amt; g.connect(s).connect(verb); return g; };
  const keysB = bus(.3, -.15), marB = bus(.4, .2), bassB = bus(.05), drumB = bus(.12), padB = bus(.6);
  const noise = ac.createBuffer(1, SR * 2, SR); { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1; }
  // 건반: 배음을 더한 짧은 피아노 소리
  const key = (m, t, vel, out, len) => { for (let k = 1; k <= 5; k++) { const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = hz(m) * k * (1 + .0004 * k * k); const g = ac.createGain(), a = vel / Math.pow(k, 1.5), d = len / (1 + k * .5); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(out); o.start(t); o.stop(t + d + .02); } };
  // 마림바: 기음 + 4배음, 빠르게 사라지는 나무 소리
  const mar = (m, t, vel) => { for (const [mul, a, d] of [[1, 1, .55], [3.98, .35, .12], [9.9, .08, .04]]) { const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = hz(m) * mul; const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * a, t + .002); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(marB); o.start(t); o.stop(t + d + .02); } };
  const hit = (t, type, f, q, vol, len, out = drumB) => { const s = ac.createBufferSource(); s.buffer = noise; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + len); s.connect(fl).connect(g).connect(out); s.start(t, rnd() * 1.5, len + .02); };
  const kick = (t, vol) => { const o = ac.createOscillator(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(48, t + .12); const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .3); o.connect(g).connect(drumB); o.start(t); o.stop(t + .32); };
  // 화음: G – D – Em – C (밝고 경쾌한 장조 진행)
  const CH = [[55, 59, 62, 67], [50, 54, 57, 62], [52, 55, 59, 64], [48, 52, 55, 60]];
  const ROOT = [43, 38, 40, 36];
  const MEL = [[79, 0], [78, .5], [79, 1], [83, 1.5], [81, 2.5], [79, 3]], MEL2 = [[78, 0], [76, .5], [74, 1], [76, 2], [78, 2.5], [79, 3.5]];
  for (let L = 0; L < LOOPS; L++) for (let b = 0; b < BARS; b++) {
    const t0 = L * loop + b * bar, ci = b % 4, ch = CH[ci], B = b >= 8;
    // 부드러운 패드(아주 작게)
    for (const n of ch) { const o = ac.createOscillator(); o.type = "triangle"; o.frequency.value = hz(n); const g = ac.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.006, t0 + .3); g.gain.setValueAtTime(.006, t0 + bar - .1); g.gain.linearRampToValueAtTime(0, t0 + bar + .2); o.connect(g).connect(padB); o.start(t0); o.stop(t0 + bar + .25); }
    // 건반: 뒷박 엇박 스탭 (통통 튀는 느낌)
    for (let k = 0; k < 4; k++) for (const n of ch.slice(1)) key(n + 12, t0 + k * beat + beat / 2, .05, keysB, .5);
    // 베이스: 8분음표, 옥타브를 오가며
    for (let k = 0; k < 8; k++) { const t = t0 + k * beat / 2, n = ROOT[ci] + (k % 4 === 3 ? 12 : k === 6 ? 7 : 0); const o = ac.createOscillator(); o.type = "triangle"; o.frequency.value = hz(n); const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .008); g.gain.exponentialRampToValueAtTime(.002, t + beat / 2 - .03); o.connect(g).connect(bassB); o.start(t); o.stop(t + beat / 2); }
    // 마림바: 앞 8마디는 아르페지오, 뒤 8마디는 멜로디
    if (!B) [0, 1, 2, 3, 2, 1, 3, 2].forEach((ix, k) => mar(ch[ix] + 12, t0 + k * beat / 2, k % 2 ? .05 : .08));
    else (b % 2 ? MEL2 : MEL).forEach(([n, st]) => mar(n - (ci === 3 ? 2 : 0), t0 + st * beat, .11));
    // 드럼: 킥(앞: 1·3박, 뒤: 매 박), 스냅(2·4박), 셰이커(16분)
    for (let k = 0; k < 4; k++) if (B || k % 2 === 0) kick(t0 + k * beat, B ? .5 : .42);
    for (const k of [1, 3]) hit(t0 + k * beat, "bandpass", 1900, 1.2, B ? .2 : .14, .14);
    for (let k = 0; k < 16; k++) hit(t0 + k * beat / 4, "highpass", 7500, .7, (k % 2 ? .05 : .025) * (b >= 2 ? 1 : .5), .05);
    if (b === 7 || b === 15) for (let k = 0; k < 4; k++) hit(t0 + 3 * beat + k * beat / 4, "bandpass", 1900, 1.2, .08 + k * .04, .1);   // 다음 구간으로 넘어가는 작은 필인
  }
  const buf = await ac.startRendering();
  const from = Math.round(loop * SR), len = Math.round(loop * SR);
  const L = buf.getChannelData(0).slice(from, from + len), R = buf.getChannelData(1).slice(from, from + len);
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
// 이전보다 존재감 있게: -18 LUFS, 피크 -2 dBTP. 재생 볼륨은 발표 화면에서 한 번 더 조절한다.
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wav, "-af", "loudnorm=I=-18:TP=-2:LRA=9", "-ar", "44100", "-c:a", "aac", "-b:a", "192k", `${ROOT}assets/audio/bgm.m4a`]);
execFileSync("rm", [wav]);
console.log("✔ assets/audio/bgm.m4a");
