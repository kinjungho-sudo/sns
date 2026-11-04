// 배경음악 만들기: 피아노 + 현악 시네마틱 루프 → assets/audio/bgm.m4a
// node tools/make-bgm.mjs      (Chromium의 OfflineAudioContext로 합성, ffmpeg로 인코딩·음량 맞춤)
// 저작권 걱정 없는 직접 합성 음원. C장조 88BPM, 16마디(약 44초) 반복.
//   1~4마디: 피아노 8분음표 반주만 (잔잔하게 시작)
//   5~8마디: 현악 패드·저음이 들어오고 심장 박동 같은 낮은 북
//   8마디 끝: 현악이 부풀어 오름 → 9마디 첫 박 팀파니
//   9~16마디: 높은 현악 + 피아노 멜로디 (밝고 벅찬 구간)
// 앞뒤로 한 바퀴씩 더 렌더한 뒤 가운데 바퀴만 잘라 잔향까지 이음매 없이 반복된다.
import { chromium } from "playwright";
import { writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const exe = process.env.CHROMIUM_PATH || (() => { const d = existsSync("/opt/pw-browsers") && readdirSync("/opt/pw-browsers").find((x) => /^chromium-\d+$/.test(x)); return d ? `/opt/pw-browsers/${d}/chrome-linux/chrome` : undefined; })();
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage();
const b64 = await page.evaluate(async () => {
  const SR = 44100, BPM = 88, beat = 60 / BPM, bar = beat * 4, BARS = 16, loop = bar * BARS, LOOPS = 3, total = loop * LOOPS;
  const ac = new OfflineAudioContext(2, Math.ceil(SR * total), SR);
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // 홀 잔향(3.5초) + 마스터
  const ir = ac.createBuffer(2, SR * 3.5, SR);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / d.length, 2.6) * (i < SR * .02 ? i / (SR * .02) : 1); }
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 2.5; comp.connect(ac.destination);
  const master = ac.createGain(); master.gain.value = .9; master.connect(comp);
  const verb = ac.createConvolver(); verb.buffer = ir; const wet = ac.createGain(); wet.gain.value = .5; verb.connect(wet).connect(master);
  const bus = (amt, pan = 0) => { const g = ac.createGain(), p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p).connect(master); const s = ac.createGain(); s.gain.value = amt; g.connect(s).connect(verb); return g; };
  const pianoBus = bus(.45), strBus = bus(.9), lowBus = bus(.2), melBus = bus(.55, .1);

  // 피아노: 배음을 더하고 높은 배음일수록 빨리 사라지게 + 짧은 해머 소리
  const piano = (m, t, vel, out, len = 2.6) => {
    const f = hz(m);
    for (let k = 1; k <= 7; k++) {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = f * k * (1 + .0004 * k * k);
      const g = ac.createGain(), a = vel * .9 / Math.pow(k, 1.6), d = len / (1 + k * .55);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .004); g.gain.exponentialRampToValueAtTime(a * .35, t + .12); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(out); o.start(t); o.stop(t + d + .05);
    }
  };
  // 현악: 톱니파 여러 개를 살짝 어긋나게 + 비브라토 + 부드러운 필터, 천천히 차오름
  const strings = (notes, t, len, vol, cut, swell = false) => {
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = .4;
    lp.frequency.setValueAtTime(cut * .6, t); lp.frequency.linearRampToValueAtTime(cut, t + len * .5);
    if (swell) lp.frequency.linearRampToValueAtTime(cut * 2.2, t + len);
    const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(1.4, len * .4));
    if (swell) g.gain.linearRampToValueAtTime(vol * 1.9, t + len); else g.gain.setValueAtTime(vol, t + len - .3);
    g.gain.linearRampToValueAtTime(0, t + len + .9);
    lp.connect(g).connect(strBus);
    const vib = ac.createOscillator(); vib.frequency.value = 5.2; const vd = ac.createGain(); vd.gain.value = 6; vib.connect(vd); vib.start(t); vib.stop(t + len + 1);
    for (const n of notes) for (const det of [-11, -4, 3, 10]) {
      const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = hz(n); o.detune.value = det; vd.connect(o.detune);
      o.connect(lp); o.start(t); o.stop(t + len + 1);
    }
  };
  const drum = (t, f0, f1, vol, len) => { const o = ac.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + .25); const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + len); o.connect(g).connect(lowBus); o.start(t); o.stop(t + len + .05); };

  // 화음: C – G/B – Am – F | C – G – F – G (밝은 장조)
  const CH = [[48, 55, 64, 67], [47, 55, 62, 67], [45, 52, 60, 64], [41, 48, 57, 60], [48, 55, 64, 67], [43, 50, 59, 62], [41, 48, 57, 60], [43, 50, 59, 62]];
  // 9~16마디 멜로디 (박 단위: [음, 시작, 길이])
  const MEL = [[[76, 0, 1.5], [74, 1.5, .5], [72, 2, 2]], [[74, 0, 1], [71, 1, 1], [67, 2, 2]], [[72, 0, 1.5], [74, 1.5, .5], [76, 2, 2]], [[77, 0, 1], [76, 1, 1], [72, 2, 2]],
               [[79, 0, 1.5], [77, 1.5, .5], [76, 2, 2]], [[74, 0, 1], [76, 1, 1], [79, 2, 2]], [[81, 0, 1], [79, 1, 1], [77, 2, 1], [76, 3, 1]], [[74, 0, 3], [71, 3, 1]]];
  for (let L = 0; L < LOOPS; L++) {
    const T = L * loop;
    for (let b = 0; b < BARS; b++) {
      const t0 = T + b * bar, ci = b % 8, ch = CH[ci], big = b >= 8;
      // 피아노 반주: 근음-5도-10도를 오르내리는 8분음표
      const pat = [ch[0], ch[1], ch[2], ch[1], ch[3], ch[1], ch[2], ch[1]];
      pat.forEach((n, k) => piano(n + (k === 0 ? 0 : 12), t0 + k * beat / 2, (k === 0 ? .12 : .075) * (big ? 1.1 : 1), pianoBus, k === 0 ? 3.2 : 1.6));
      if (b >= 4) {
        strings(ch.slice(1).map((n) => n + 12), t0, bar, big ? .016 : .011, big ? 2600 : 1500, b === 7 || b === 15);
        piano(ch[0] - 12, t0, .16, lowBus, 3.5);                                   // 낮은 저음
        drum(t0, 70, 42, big ? .55 : .4, .8);                                      // 첫 박 낮은 북
        if (big) drum(t0 + beat * 2, 70, 42, .35, .7);
      }
      if (big) {
        strings(ch.slice(1).map((n) => n + 24), t0, bar, .008, 4200);            // 높은 현악
        for (const [n, st, d] of MEL[ci]) { piano(n, t0 + st * beat, .2, melBus, 2.4 + d); piano(n - 12, t0 + st * beat, .07, melBus, 2 + d); }
      }
      if (b === 0 || b === 8) { drum(t0, 110, 48, b ? .9 : .5, 2.2); drum(t0 + .02, 220, 70, b ? .25 : .12, 1.2); }   // 팀파니
    }
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
