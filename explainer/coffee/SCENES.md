# Scene spec — 하루 커피값 5,000원, 30년이면? (30 s)

**One idea:** 5,000원 is small, but it repeats 10,950 times in 30 years, so it adds up to 5,475만 원.
**Viewer outcome:** they can say "하루 5,000원, 30년이면 5,475만 원".
**Question in their words:** "커피값 5,000원, 30년 모아 봤자 얼마나 된다고?"

No voice-over, so the voice line is the caption track. Times come from `TIMELINE` in `film.js`.

| ID | Time | Part | Teaches | Frame (in order of importance) | Motion | On-screen anchor | Caption (voice line) | Sound | Check: the viewer can now say |
|---|---|---|---|---|---|---|---|---|---|
| Q | 0–3 | Question | The thing they shrug off: one 5,000원 payment. | 1 card-payment notification "5,000원". Camera close on the card. | The card rises 30 px and settles (0.15–0.75 s), then holds. | (none; the caption carries it) | 커피 한 잔 5,000원, 푼돈이라고들 하죠. | ding as the payment lands | "That's just one coffee." |
| M1 | 3–5 | Model | One day = one cell = 5,000원 set aside. | 1 a single teal cell labelled 5,000원. | The card shrinks into the cell as its text fades (0.9 s). The camera eases back. | 하루 = 한 칸 | 이 5,000원을 하루 한 칸씩 모으면, | pop | "A day is a cell." |
| M2 | 5–10.5 | Model | 365 cells make a year: 1,825,000원. | 1 the year grid filling; 2 the counter and "N일 × 5,000원". | The cell moves to day 1, then days 2–365 fill at a steady rate (3 s) with the counter in lockstep. | 1년 = 365칸 | 1년을 채우면 365칸, / 182만 5천 원입니다. (the amount is spoken when day 365 lands) | tick when day 365 lands | "A year of coffee is 182만 원." |
| P1 | 10.5–19.9 | Proof | Repeat the year 30 times. | 1 bars rising one per year; 2 the counter in whole years; 3 "이자 없이 그대로 모은 돈"; 4 gridlines at 10/20/30 years. | The grid folds into bar 1, then one bar every 0.25 s, each settling in 0.3 s. The counter steps one year at a time so its equation is always true. | (none; the caption carries it) | 이 1년을 30번 쌓으면, | tick at 10, 20 and 30 years | "It grows the same amount every year." |
| P2 | 19.9–22.5 | Proof | The total: 54,750,000원. | 1 the counter at 54,750,000원; 2 the finished chart. | Hold. Nothing moves while the number is read. | 30년 = 10,950일 | 1만 950일, 모두 5,475만 원입니다. | motif | "5,475만 원." |
| T | 22.5–27 | Turn | Start saving 10 years later and you end with 1,825만 원 less. | 1 the first 10 bars hollow and dashed; 2 the counter falling to 36,500,000원; 3 the missing top of the last bar, marked −1,825만 원. | Ten bars go hollow (0.6 s), the other 20 drop by 10 years (1.3 s), then the gap is outlined. The sub-line hides while the total falls. | 10년 늦게 모으기 시작하면 | 10년 늦게 모으기 시작하면 / 1,825만 원이 덜 모입니다. (said when the gap is marked) | thud, then a low tone when the total lands | "Starting late costs a third." |
| Y | 27–30 | Payoff | The opening card, read correctly. | 1 "= 5,475만 원", the largest figure on screen; 2 the same 5,000원 notification with "× 10,950일 (30년)"; 3 footnote "단순 합계 · 이자·물가 미반영"; 4 next step. | The chart leaves (0.3 s), the card returns, and the two lines reveal in order (0.7 s). Sound fades over the last second. | 오늘 한 잔부터 세어 보세요 | 하루 5,000원, 30년이면 5,475만 원입니다. | motif | "This 5,000원 is 5,475만 원." |

## Reduced-motion cut
The same beats, words and order. Nothing travels: the card-to-cell and grid-to-bar morphs become 0.3 s crossfades, bars appear at full height instead of growing, and the camera stays wide.
