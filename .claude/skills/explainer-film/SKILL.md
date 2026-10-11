---
name: explainer-film
description: Make a finished short explainer or motion-graphics video — 30–90 s, rendered MP4 with sound and captions, in 16:9 plus 9:16 (Shorts/Reels) and 1:1 recompositions — drawn entirely in code (canvas, no video-generation AI), with optional Korean narration via the Typecast API. Use this whenever someone wants an 설명 영상, 모션그래픽, 쇼츠/릴스 영상, 인포그래픽 영상, 숫자·데이터를 보여주는 짧은 영상, an "explainer film", "motion graphics", "animated explainer", a video that teaches one idea, or a narrated (나레이션/타입캐스트) version of such a video — even if they only describe a topic and an audience, or paste a brief with {{TOPIC}}/{{AUDIENCE}} slots. Not for editing existing footage or generating photoreal video.
---

# Explainer film

Turn a topic into a finished film that leaves one audience with one new understanding. The deliverable is **rendered video with sound and captions plus the source that re-renders it**. A plan, a storyboard or a still frame is not the deliverable.

The bundled template is a complete, reviewed 30 s film ("하루 커피값 5,000원, 30년이면?"). You rewrite its story and keep its engine: the renderer, camera, captions, counter, sound, export and checks are already solved and tested.

## Setup (once per film)

```bash
bash <this-skill>/scripts/new-film.sh films/<slug>     # scaffold: film.html, film.js (the example), fonts, tools/, package.json, npm install
cd films/<slug> && npm run preview                       # http://localhost:8080/film.html?fmt=9x16  (&rm=1 reduced motion)
```

Needs node, ffmpeg with libx264 and a Chromium. The tools use `CHROMIUM_PATH`, then `/opt/pw-browsers/chromium-*`, then Playwright's own browser (`npx playwright install chromium`). Fonts (Pretendard 500–800) ship with the template, so text renders the same offline.

## Workflow

Work through these in order. When the brief is thin, make the call, log it as one line in `DECISIONS.md`, and keep moving. Stop to ask only for missing rights, unsafe content, or an ambiguity that changes the goal. Empty template slots like `{{TOPIC}}` count as that last case if nothing in the conversation fills them. When you fill them yourself, log it and say so up front.

1. **One idea.** Write the question the viewer would ask, in their own words, and the one sentence they can say afterward. Split facts into must-know and a cut list, and the cut list stays out. Find the hook: the belief most viewers hold that turns out to be wrong.
2. **Numbers and sources.** Every number on screen needs a line in `SOURCES.md`, either a citation or the arithmetic that produces it. Compute numbers in code from their inputs instead of typing them. If a claim needs a rate or statistic you can't source, drop it and say on screen what the plain version leaves out.
3. **Story arc.** Question (0–10%) → Model (10–35%) → Proof (35–75%) → Turn (75–90%) → Payoff (90–100%). Open on the misconception as an image, not a title card. In the turn, change one variable and show what follows. The payoff brings back the opening image, now read correctly, plus one next step. Write `SCENES.md` with one row per beat: teaches, frame, motion, words, sound, and what the viewer can now say.
4. **Tokens and directions.** Pull palette and type from the brand into tokens. The template's Paper theme is warm neutral with one accent. Render the same key frame in 3 directions (`theme=` param) and keep a `directions.html` that marks the winner and why.
5. **Build.** Rewrite `film.js`'s story section; `references/template-anatomy.md` says what to keep and what to replace. Check beat stills for all three formats early (`node tools/render.mjs stills --fmt 9x16`). Check mid-motion frames too (`frame --t`), because most bugs live between beats.
6. **Sound and captions.** Keep the procedural bed and one motif that returns on the key idea, with cues only on meaningful actions. Captions are the voice track, at no more than 9 characters per second, and each one lands when its number does.
7. **Verify** (next section). Get an independent design review: spawn a subagent with the stills and `SCENES.md`, not your own conclusions. Fix what it finds and keep before/after frame pairs in `out/review/`.
8. **Export.** Run `npm run film`, which builds the audio, all four videos, captions, stills, contact sheet and the checks. For a narrated master, see `references/typecast.md`.

Read `references/craft.md` before step 3. It holds the rules for copy, motion, visuals, sound and accessibility. Read `references/pitfalls.md` before step 7. It lists real bugs from past films and is the fastest way to avoid repeating them.

## Verify: run these, don't just claim them

| Check | Command | Pass |
|---|---|---|
| Contrast | `node tools/render.mjs contrast` | text ≥ 4.5:1, graphics ≥ 3:1 |
| Caption speed | `node tools/render.mjs timing` | ≤ 9 chars/s |
| Text fit | `node tools/render.mjs fit` | nothing shrinks, any format, normal + reduced motion |
| Determinism | `node tools/render.mjs determinism` | identical bytes |
| Flashes, loudness | `node tools/check-video.mjs out/<file>.mp4` | ≤ 3 luma jumps/s; −16 ±1 LUFS; ≤ −1.5 dBTP |
| Phone width | scale 9:16 stills to 390 px wide and read every line | essential text ≥ ~36 px in the 1080-wide frame |
| Shorts overlay | caption box bottom in 9:16 | above y ≈ 1536 |
| Muted and audio-only | 1-fps frame sheet; waveform/spectrum vs `TIMELINE.cues` | story reads without sound; cues land on their actions |

`npm run check` runs the first four. If you cannot listen to the audio, say so. Loudness and cue timing are measured, not heard.

## Deliver

- `out/master_16x9.mp4`, `out/cut_9x16.mp4`, `out/cut_1x1.mp4`, `out/master_16x9_reduced_motion.mp4`
- `captions.srt`, `contact.png`
- the source
- `README.md`, listing **only what was tested**, with measured numbers. Say plainly what was not tested.

Send the videos to the user, if a file-sending tool exists, rather than only naming paths. Keep MP4/WAV out of git (the scaffold's `.gitignore` does this); the source plus `npm run film` re-renders them.
