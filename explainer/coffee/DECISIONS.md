# DECISIONS — 커피값 30년

One line per call made without input.

1. **Brief (from the user):** a 30 s Korean film for early-career Koreans who think 5,000원 a day is pocket change. Outcome: they can say what 5,000원 a day becomes in 30 years, as a number.
2. **Question in their words:** "커피값 5,000원, 30년 모아 봤자 얼마나 된다고?"
3. **Hook (the wrong belief):** "이 정도는 푼돈." The film opens on the thing they actually see, a card-payment notification for 5,000원.
4. **No interest, no inflation, no leap days.** The brief asks what the money *becomes when saved*, and every extra assumption needs a sourced rate. Interest would also need a tax rule (15.4% on Korean interest income). The film shows the plain sum, and the last frame says so: "단순 합계 · 이자·물가·윤년 미반영".
5. **One unit on screen: 1 day = 1 cell = 5,000원.** No metaphor. A cell is a day, a row of cells is a year, and a bar is a year's total.
6. **Turn variable: starting 10 years later.** That variable matters most to someone at the start of a career, and it stays pure arithmetic (20 years instead of 30). Doubling the daily amount was the other option. It was cut because the audience already believes doubling doubles.
7. **Counter numbers are exact won (54,750,000원); speech-style amounts (5,475만 원) appear in captions and axis labels.** Each place uses one form consistently.
8. **Brand:** Pretendard and the repo's teal, darkened to #0B6B62 for contrast. Same Paper tokens as the stand-in film.
9. **One typeface.** The machine has no second Hangul family worth adding, so Pretendard alone carries all text, in three weights. Digits are drawn in fixed-width slots so the counter never jitters.
10. **No voice-over.** No Korean TTS engine is installed. Captions carry the narration, burned in and in captions.srt.
11. **9:16 safe area:** captions sit at y≈1510, above the Shorts/Reels overlay, and every essential label is at least 36 px (13 px at 390 px wide).
12. **Design-review lessons carried over from the stand-in film:** no window chrome, no brand tag, no decorative labels. Dimmed elements change outline style, not only lightness.
13. **MP4 and WAV files stay out of git.** `npm run film` rebuilds them. Stills, captions and the contact sheet are committed.
14. **Design review applied.**
    - The turn now says *saving* starts late ("10년 늦게 모으기 시작하면").
    - The chart is labelled "이자 없이 그대로 모은 돈" from its first frame.
    - "= 5,475만 원" is the largest figure on the payoff card.
    - Captions say each number when the counter reaches it.
    - The counter steps in whole years, and its sub-line hides while the total falls, so the equation on screen is never false.
    - 9:16 captions end at y=1480, above the Shorts overlay.
    - Empty day slots are about 2:1 against the background.
    - Footnote: 40 px in 9:16; "윤년" removed (it is still in SOURCES.md).
    - Cut: the Q and P1 anchors, which repeated their captions, and the "10년 늦게 시작" sub-line suffix.
    - Kept: "오전 8:12". The card has to read as a real notification for the payoff to land.
15. **Kept the turn rather than cutting it.** The reviewer offered cutting it as an option. The arc needs one changed variable, and "starting later" is the most useful lever for this audience. The payoff then restores 5,475만 원 as the last and largest number.
