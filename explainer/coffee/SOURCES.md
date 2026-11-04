# SOURCES — 커피값 30년

Every number in the film comes from three inputs given in the brief or chosen in DECISIONS.md, plus multiplication. There are no external statistics.

| Input | Value | Where it comes from |
|---|---|---|
| Daily amount | 5,000원 | The brief |
| Days per year | 365 | Calendar year; leap days ignored (DECISIONS 4) |
| Years | 30 | The brief |
| Late start | 10 years | Chosen turn variable (DECISIONS 6) |

| Number on screen | Calculation |
|---|---|
| 1,825,000원 (182만 5천 원) | 5,000 × 365 |
| 10,950일 (1만 950일) | 365 × 30 |
| 54,750,000원 (5,475만 원) | 5,000 × 10,950 = 1,825,000 × 30 |
| 1,825만 / 3,650만 / 5,475만 (axis) | 1,825,000 × 10 / 20 / 30 |
| 36,500,000원 (3,650만 원) | 1,825,000 × 20 |
| −18,250,000원 (−1,825만 원) | 54,750,000 − 36,500,000 |

**What the plain sum leaves out (stated on the final frame):**
- Interest: savings interest would add to the total, minus the 15.4% tax on Korean interest income.
- Inflation: 5,475만 원 in 30 years buys less than 5,475만 원 today.
- Leap days: about 7 in 30 years, which would add roughly 35,000원.

The numbers are computed in `film.js` from the three inputs (`DAILY`, `DAYS_PER_YEAR`, `YEARS`), not typed in.
