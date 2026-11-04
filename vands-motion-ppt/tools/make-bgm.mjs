// 배경음악 만들기: 밝고 극적인 시네마틱 루프 → assets/audio/bgm.m4a
// node tools/make-bgm.mjs      (Chromium의 OfflineAudioContext로 합성, ffmpeg로 인코딩·음량 맞춤)
// 저작권 걱정 없는 직접 합성 음원. D장조 100BPM, 16마디(약 38초) 반복.
//   1~8마디: 반짝이는 16분음표 아르페지오 + 패드 + 맥박 같은 베이스 (쌓아 올림)
//   8마디 끝: 상승 스윕(라이저) → 9마디 첫 박에 심벌·팀파니 히트
//   9~16마디: 킥 박자 + 패드 펌핑 + 금관 같은 리드 멜로디 (가장 웅장한 구간)
//   16마디 끝: 다시 라이저 → 반복 첫 마디로 이어짐
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
  const SR = 44100, BPM = 100, beat = 60 / BPM, bar = beat * 4, BARS = 16, loop = bar * BARS, LOOPS = 3, total = loop * LOOPS;
  const ac = new OfflineAudioContext(2, Math.ceil(SR * total), SR);
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // 공통: 잔향 + 마스터 (살짝 압축해 꽉 차게)
  const ir = ac.createBuffer(2, SR * 2.6, SR);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / d.length, 3); }
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .2; comp.connect(ac.destination);
  const master = ac.createGain(); master.gain.value = .85; master.connect(comp);
  const verb = ac.createConvolver(); verb.buffer = ir; const wet = ac.createGain(); wet.gain.value = .32; verb.connect(wet).connect(master);
  const bus = (verbAmt) => { const g = ac.createGain(); g.connect(master); const s = ac.createGain(); s.gain.value = verbAmt; g.connect(s).connect(verb); return g; };
  const noise = ac.createBuffer(1, SR * 4, SR); { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1; }

  // 화음 (MIDI): D – A/C# – Bm – G | D – A – G – A  (밝은 장조 진행, 끝에서 A로 다시 끌어올림)
  const CH = [[62, 66, 69, 74], [61, 64, 69, 73], [59, 62, 66, 71], [55, 62, 67, 71], [62, 66, 69, 74], [57, 61, 64, 69], [55, 59, 62, 67], [57, 61, 64, 69]];
  const ROOTS = [38, 37, 35, 31, 38, 33, 31, 33];

  // 패드 버스: 9~16마디에선 박마다 살짝 눌렀다 놓아 펌핑감(사이드체인 느낌)
  const padBus = bus(.8), padLP = ac.createBiquadFilter(); padLP.type = "lowpass"; padLP.Q.value = .5; padLP.connect(padBus);
  const duck = ac.createGain(); duck.connect(padLP);
  const bassBus = bus(.1), arpBus = bus(.6), leadBus = bus(.7), drumBus = bus(.35), fxBus = bus(.9);

  for (let L = 0; L < LOOPS; L++) {
    const T = L * loop;
    // 필터: 앞 8마디 동안 점점 열리고(빌드), 뒤 8마디는 활짝
    padLP.frequency.setValueAtTime(900, T); padLP.frequency.exponentialRampToValueAtTime(3200, T + bar * 8); padLP.frequency.setValueAtTime(4200, T + bar * 8); padLP.frequency.setValueAtTime(4200, T + loop - .01);
    duck.gain.setValueAtTime(1, T);
    for (let b = 0; b < BARS; b++) {
      const t0 = T + b * bar, ci = b % 8, ch = CH[ci], big = b >= 8;
      // 패드: 디튠 톱니 3겹
      for (const n of ch) for (const det of [-9, 0, 8]) {
        const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = hz(n); o.detune.value = det;
        const g = ac.createGain(), pk = big ? .010 : .007;
        g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(pk, t0 + .25); g.gain.setValueAtTime(pk, t0 + bar - .05); g.gain.linearRampToValueAtTime(0, t0 + bar + .35);
        o.connect(g).connect(duck); o.start(t0); o.stop(t0 + bar + .4);
      }
      if (big) for (let k = 0; k < 4; k++) { const t = t0 + k * beat; duck.gain.setValueAtTime(1, t); duck.gain.linearRampToValueAtTime(.45, t + .02); duck.gain.linearRampToValueAtTime(1, t + beat * .8); }
      // 베이스: 8분음표 맥박 (앞 2마디는 쉼 → 4마디부터 시작해 쌓이는 느낌)
      if (b >= 2) for (let k = 0; k < 8; k++) {
        const t = t0 + k * beat / 2, o = ac.createOscillator(); o.type = "triangle"; o.frequency.value = hz(ROOTS[ci] + (k % 2 && big ? 12 : 0));
        const s = ac.createOscillator(); s.type = "sine"; s.frequency.value = hz(ROOTS[ci] - 12);
        const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(big ? .11 : .08, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + beat / 2 - .02);
        o.connect(g); s.connect(g); g.connect(bassBus); o.start(t); s.start(t); o.stop(t + beat / 2); s.stop(t + beat / 2);
      }
      // 아르페지오: 16분음표 반짝이 (위·아래로 오르내림)
      const arp = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 3, 2, 1, 2];
      for (let k = 0; k < 16; k++) {
        const t = t0 + k * beat / 4, n = ch[arp[k]] + 12 + (big && k % 8 === 7 ? 12 : 0);
        const o = ac.createOscillator(); o.type = "square"; o.frequency.value = hz(n);
        const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = big ? 5200 : 3000;
        const g = ac.createGain(), a = (k % 4 === 0 ? .026 : .016) * (big ? 1 : .8);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .004); g.gain.exponentialRampToValueAtTime(.0005, t + .22);
        o.connect(f).connect(g).connect(arpBus); o.start(t); o.stop(t + .25);
      }
      // 킥: 뒤 8마디는 매 박, 5~8마디는 첫 박·셋째 박 (점점 고조)
      const kicks = big ? [0, 1, 2, 3] : b >= 4 ? [0, 2] : [];
      for (const k of kicks) {
        const t = t0 + k * beat, o = ac.createOscillator(); o.type = "sine";
        o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + .14);
        const g = ac.createGain(); g.gain.setValueAtTime(.55, t); g.gain.exponentialRampToValueAtTime(.001, t + .38);
        o.connect(g).connect(drumBus); o.start(t); o.stop(t + .4);
      }
      // 클랩(뒤 8마디 2·4박) + 하이햇(8분 뒷박)
      if (big) for (const k of [1, 3]) { const t = t0 + k * beat, s = ac.createBufferSource(); s.buffer = noise; const f = ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1600; f.Q.value = .8; const g = ac.createGain(); g.gain.setValueAtTime(.22, t); g.gain.exponentialRampToValueAtTime(.001, t + .22); s.connect(f).connect(g).connect(drumBus); s.start(t, rnd() * 3, .25); }
      if (b >= 4) for (let k = 0; k < 4; k++) { const t = t0 + k * beat + beat / 2, s = ac.createBufferSource(); s.buffer = noise; const f = ac.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 8000; const g = ac.createGain(); g.gain.setValueAtTime(big ? .07 : .045, t); g.gain.exponentialRampToValueAtTime(.001, t + .06); s.connect(f).connect(g).connect(drumBus); s.start(t, rnd() * 3, .08); }
      // 리드: 뒤 8마디, 금관 같은 밝은 멜로디 (2마디 동기 반복)
      if (big) {
        const MEL = [[[74, 0, 1.5], [76, 1.5, .5], [78, 2, 2]], [[76, 0, 1], [73, 1, 1], [69, 2, 2]], [[71, 0, 1.5], [73, 1.5, .5], [74, 2, 2]], [[74, 0, 1], [71, 1, 1], [79, 2, 2]],
                     [[78, 0, 1.5], [79, 1.5, .5], [81, 2, 2]], [[81, 0, 1], [76, 1, 1], [73, 2, 2]], [[74, 0, 1], [79, 1, 1], [78, 2, 2]], [[76, 0, 2], [73, 2, 1], [76, 3, 1]]];
        for (const [n, st, d] of MEL[ci]) {
          const t = t0 + st * beat, dur = d * beat;
          const f = ac.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 2; f.frequency.setValueAtTime(800, t); f.frequency.linearRampToValueAtTime(3600, t + .08); f.frequency.linearRampToValueAtTime(2000, t + dur);
          const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .05); g.gain.setValueAtTime(.045, t + dur - .06); g.gain.linearRampToValueAtTime(0, t + dur + .1);
          f.connect(g).connect(leadBus);
          for (const det of [-6, 6]) { const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = hz(n); o.detune.value = det; o.connect(f); o.start(t); o.stop(t + dur + .15); }
        }
      }
      // 라이저: 8·16마디 내내 노이즈가 위로 쓸려 올라감
      if (b === 7 || b === 15) {
        const s = ac.createBufferSource(); s.buffer = noise; const f = ac.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 3;
        f.frequency.setValueAtTime(300, t0); f.frequency.exponentialRampToValueAtTime(9000, t0 + bar);
        const g = ac.createGain(); g.gain.setValueAtTime(.001, t0); g.gain.exponentialRampToValueAtTime(.14, t0 + bar - .02); g.gain.linearRampToValueAtTime(0, t0 + bar);
        s.connect(f).connect(g).connect(fxBus); s.start(t0, 0, bar);
      }
      // 히트: 1·9마디 첫 박에 심벌 + 팀파니
      if (b === 0 || b === 8) {
        const s = ac.createBufferSource(); s.buffer = noise; const f = ac.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 5000;
        const g = ac.createGain(); g.gain.setValueAtTime(b ? .16 : .10, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + 3);
        s.connect(f).connect(g).connect(fxBus); s.start(t0, 0, 3.1);
        const o = ac.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(hz(38) * 1.5, t0); o.frequency.exponentialRampToValueAtTime(hz(38), t0 + .3);
        const tg = ac.createGain(); tg.gain.setValueAtTime(b ? .5 : .32, t0); tg.gain.exponentialRampToValueAtTime(.001, t0 + 1.8);
        o.connect(tg).connect(drumBus); o.start(t0); o.stop(t0 + 1.9);
      }
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
