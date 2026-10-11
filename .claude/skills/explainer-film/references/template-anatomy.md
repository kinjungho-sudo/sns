# Anatomy of film.js

`film.js` is a single file in two layers. **Keep the engine** and **rewrite the story**. The example story (coffee money) is there to copy patterns from, so delete what your film doesn't use.

| Section (search for the comment) | Layer | What to do |
|---|---|---|
| URL params (`fmt`, `theme`, `rm`, `caps`, `vo`) | engine | keep |
| `inputs` (`DAILY`, `YEARS`, …) | story | replace with your film's inputs. Compute every displayed number from them |
| `THEMES` | story/brand | keep the Paper theme or retune its tokens. Keep `slot`, `onAccent`, `capBg`, `capInk` |
| `FMTS` (16x9 / 9x16 / 1x1) | story | lay out each format separately. 9:16 captions end at `bottom ≤ 1480` |
| `TIMELINE` (beats, camera, moves, anchors, captions, cues, bpm) | story | everything that happens, with times. Beat ids name the stills |
| math: `bezier`, `SETTLE`, `mv` (position progress), `fa` (fade progress) | engine | keep. `mv`/`fa` already handle reduced motion |
| canvas helpers: `text` (with `maxW` fit warning), `number` (fixed digit slots), `rrect`, `wrap` | engine | keep |
| layout: `CARD`, `G` (grid), `CH` (chart), `BIG` | story | replace with your objects' geometry |
| camera: `FOCUS`, `applyCamera` (scale clamped at 1.12) | engine + story | keep the mechanism; define your focus rects |
| state as functions of t (`filledDays`, `barYears`, `yearsSoFar`) | story | write pure functions of `T`; never store state between frames |
| pieces: `drawCard`, `drawGrid`, `drawChart`, `drawCounter`, `drawPayoff` | story | your scenes. Draw objects that persist across beats and transform them |
| `drawAnchor`, `drawCaption` | engine | keep (captions are bottom-anchored and grow upward) |
| `render(t)` | both | keep the order: ground → clipped world under the camera → screen-space counter, anchors, captions |
| `renderAudio` | engine + story | keep the bed, motif and cue synths; edit chords, levels and cue kinds |
| interface: `window.TIMELINE`, `FILM`, `seek`, `frameAt`, `renderAudio`, `TEXT_PAIRS` | engine | keep. Add every text/background pair you use to `TEXT_PAIRS` (`graphic` in the name means 3:1) |
| voice loading (`vo=1` → `out/vo/timing.json`) | engine | keep |

## Patterns worth reusing
- **Morph by interpolating rects.** One object becomes another by blending `{x, y, w, h}` with `mv(t0, dur)` while text fades with `fa`. In reduced motion, crossfade the two end states instead.
- **Counting.** Fill or grow at a steady rate for time passing, and use `SETTLE` for things arriving. Show values in whole units when an equation sits next to them.
- **Stills.** `stills` captures each beat at `t1 − 0.6 s`, so make each beat fully built by then.
