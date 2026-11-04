# Craft rules

These are the rules the template film was built and reviewed against. Each rule has a reason, so you can judge the cases it doesn't cover.

## Principles
- **Shape before polish.** Settle the one idea and the viewer's mental model first. Polish is the last pass, because polishing a muddled idea only hides the muddle.
- **Ask the review questions before designing.** Who is this for? What are we communicating? Does anything need a name, or can it stay invisible? A new term is a cost the viewer pays, so name only what has to be named.
- **Never start from nothing.** Anchor to the brand, the product and real screenshots or real UI. Starting from a blank canvas produces the generic look every model makes.
- **Go wide, then decide.** Put 3–4 directions side by side in one HTML page that also serves as the decision log.
- **Restraint is taste.** You can build anything, so cut whatever doesn't serve the idea. Decoration competes with the one thing the viewer should watch.

## Visual system
- Use a warm neutral ground, one accent, at most two typefaces and one margin grid per format. In the template, Pretendard alone is enough, in 3–4 weights.
- Prefer real UI, real data and clean diagrams over illustration. A familiar UI fragment, like the card-payment notification, makes "this is about me" instant.
- **Banned:** neon glow, stock 3D blobs, gradient title cards, floating particles, fake metrics, mascots, coin or piggy-bank clip art. They signal "AI hype ad" and erode trust in the numbers.
- 9:16 and 1:1 are recompositions, not crops. Re-lay each one so its elements use the frame.

## Motion language
- Motion carries meaning: things move to show grouping, order, cause or scale. If a move doesn't do one of those, cut it.
- One focal action at a time while everything else holds still. When several things move, the eye picks one at random.
- Keep objects alive across scenes and transform them instead of replacing them. In the template, the notification becomes a cell, the cell becomes day 1, the year becomes bar 1, and the card comes back at the end. Continuity is what makes the cause visible.
- Use custom easing that settles without bounce; the template uses `cubic-bezier(0.2, 0, 0, 1)`. The camera reframes between ideas and holds still while text is read.

## Copy
- At most two anchor lines on screen at once, with plain words before jargon. An anchor that repeats its caption should be cut.
- Never put the full voice line on screen. On-screen words are anchors, and captions are the voice track.
- Use one name per thing, every time. Pick one number format per channel: exact digits on the counter, spoken 만 원 forms in captions.
- Every number has a source in SOURCES.md, or it goes.
- Say each number when it appears on screen, not before. A caption that announces 182만 원 while the counter reads 5,000원 spoils the reveal.

## Sound
- Use a tempo-locked procedural bed (Web Audio, OfflineAudioContext) with one motif that returns on the key idea, and lower the bed's level in the turn.
- Add soft UI cues only on actions that carry meaning, such as a day landing, a year filling or a total arriving. Duck the bed under any voice.
- Target −16 LUFS integrated with true peak at most −1.5 dBTP, using two-pass loudnorm. Check the film muted and audio-only.

## Accessibility
- Contrast is at least 4.5:1 for text and 3:1 for meaningful graphics. Empty slots and outlines count as graphics.
- Burn captions in and also ship them as `.srt`.
- Color is never the only signal. Missed or inactive items change outline (dashed, hollow) or weight as well as color.
- No more than 3 flashes per second.
- The reduced-motion cut has the same sequence of ideas with no travel: crossfades instead of moves, bars appear instead of growing, and the camera stays wide.

## Render contract
- `window.seek(t)` paints the frame at time t, and every frame is a pure function of t. Never keep state between frames, or a skipped frame breaks the film.
- One `TIMELINE` object holds every beat, move, anchor, caption and cue.
- Use seeded randomness only.
- Headless Chrome steps t = n/60 and pipes PNG frames to ffmpeg (libx264, crf 16, yuv420p).
