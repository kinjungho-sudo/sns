# Pitfalls found in real films

Each item below shipped in a draft, was caught by a check or a design review, and was fixed. Look for them before your own review does.

## Story and copy
- **A turn without a subject.** "10년 늦게 시작하면" — starting what? If the film never says what is being saved or done, the turn reads as good news or as nonsense. Name the action ("모으기 시작").
- **The answer isn't the biggest thing in the payoff.** The number the viewer must repeat should be the largest element on the final frame. It should not sit inside a line of small text under a big headline.
- **A plain sum that looks like an investment chart.** A rising cumulative bar chart reads as "returns". Label it from its first frame ("이자 없이 그대로 모은 돈") and repeat the caveat at the end.
- **Captions that run ahead of the visuals.** Split a caption so its number is spoken when the counter or bar reaches it.
- **Anchors that duplicate captions.** If the caption already says it, cut the anchor.
- **Claims that don't match the example.** If the example's parts don't map one-to-one onto the model, viewers notice. In one film, a blank labelled with one cause was actually filled by another.

## Numbers and counters
- **A false equation mid-animation.** The counter showed 52,925,000원 under "그 1년을 30번" before any bar existed. The year count must only include bars that have started (`if (T >= barStart(i))`).
- **The sub-line disagrees with the counter.** "20년 × …" showed while the counter was still falling from 30 years. Count in whole units so the equation is always true, and hide the sub-line while the value is moving.
- **Decimals drawn as units.** Use `number()` for values like 45.6; it gives `.` a fixed slot. Any other character in the string is drawn small, as a unit (원, 일).
- **Jittering digits.** Proportional digits make a counting number wobble, so draw each digit in a fixed-width slot.

## Layout
- **The 9:16 grid collides with the counter.** Size grids from the space actually left below the counter, not from the frame.
- **9:16 captions under the Shorts/Reels overlay.** Anything below y ≈ 1536 in a 1920-tall frame is covered. Anchor captions by their bottom edge (≤ 1480) so two-line captions grow upward.
- **Two-line captions hitting chart labels.** Leave room above the caption for its second line.
- **Payoff lines too close together.** Space them from the actual font sizes, not fixed multipliers.
- **Small essential labels.** At 390 px phone width, 28 px text in a 1080-wide frame is about 10 px. Keep essential text at ≥ 36 px.
- **Faint empty containers.** Empty slots at 1.3:1 vanish on a phone. They are graphics, so they need 3:1 like any other: the template draws them hollow (surface fill, 3.1:1 outline) and lists the pair in `TEXT_PAIRS` so the contrast check sees it.

## Motion and rendering
- **A reduced-motion leftover.** A shape that fades only its label (not its fill) stays on top of the next scene. Fade the whole object, and check reduced-motion frames mid-beat too.
- **A camera move overlapping a beat's still.** Beat stills are taken just before each beat ends. Don't schedule a camera move there.
- **A brief empty frame between scenes.** It's acceptable if the luminance is steady, but keep crossfades overlapped to avoid a dead frame.

## Audio and tooling
- **A mix tuned to someone else's timeline.** The bed level and the hi-hat entry come from `TIMELINE.bed` and the second beat. Retime `bed` when you retime the beats.
- **Captions cut silently.** A caption that wraps to 3 lines used to lose its last line without a warning. `fit` now reports it; shorten the caption.
- **Broadband swishes and a loud motif.** Low-pass the noise cues and keep the motif modest. Check the spectrum image.
- **A loudness checker that reads nothing.** ffmpeg writes ebur128 results to stderr even on success, so use `spawnSync(...).stderr`, not a try/catch that only reads stderr on failure.
- **Blocked hosts.** Cloud sessions may block a site or API at the network level. Say which host is blocked and how to allow it, then do everything that doesn't depend on it. Never substitute made-up content.
