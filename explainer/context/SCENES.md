# Scene spec — 왜 내 부탁엔 뻔한 답이 나올까? (60 s)

**One idea:** the AI reads only what is written in its window, so context left in your head comes back as blanks.
**Viewer outcome:** they add 관계·목적·톤 to a request and can say which part of the answer each line changes.
**Question in their words:** "똑같은 AI인데 왜 내 부탁엔 뻔한 답이 나올까?"

Times come from `TIMELINE` in `film.js`. The film has no voice, so the "voice line" below is the caption track. Sound cue kinds: pop, tick, thud, swish, motif.

| ID | Time | Part | Teaches | Frame (in order of importance) | Motion | On-screen anchor | Caption (voice line) | Sound | Check: the viewer can now say |
|---|---|---|---|---|---|---|---|---|---|
| Q | 0–6 | Question | A short request gets a reply full of blanks. | 1 reply with [담당자명] [사유] [기간]; 2 the one-line request; 3 the window. Camera framed on the window. | Reply types in line by line (0.5–2.7 s); dashed boxes settle on the blanks at 2.7 s. | 왜 이렇게 뻔할까? | 짧게 부탁했더니, 누구에게 보내도 될 뻔한 메일이 나왔습니다. | Bed only (sparse) | "The reply has holes in it." |
| M1 | 6–10.5 | Model | The AI reads only what is in the window. | 1 accent outline around the window; 2 the name "AI가 읽는 창". | Camera pulls back to wide (6.0–7.0). The outline draws around the window, then the name settles. | AI는 이 창만 읽는다 | AI는 이 창에 적힌 글만 읽고 답을 씁니다. | Bed rises | "Only what's in that window counts." |
| M2 | 10.5–15.5 | Model | The context exists, but outside the window. | 1 three chips 관계·목적·톤, one at a time; 2 label "내 머릿속". | Each chip fades up with a 24 px rise and settles. One chip per beat. | 사정은 내 머릿속에 | 이 메일의 사정은 내 머릿속에만 있습니다. 누구에게, 왜, 어떤 말투로. | pop ×3 | "I know who, why and how. The AI doesn't." |
| M3 | 15.5–21 | Model | Missing context becomes blanks or safe defaults. | 1 dashed link from each chip to its blank; 2 chips stopped at the window edge. | The chips slide as a group to the window edge and stop (no bounce). The links draw one at a time, and earlier ones dim to 40%. | 모르는 곳은 빈칸으로 | 창 밖의 사정은 보이지 않으니, AI는 모르는 곳을 빈칸으로 두거나 무난한 말로 채웁니다. | thud at the edge, tick ×3 | "Each blank is a chip that didn't get in." |
| P1 | 21–27 | Proof | Writing the context down puts it in the window. | 1 the chip becoming a request line; 2 the request card growing to four lines. | Each chip's label and value travel into their line slot while the chip box dissolves. Three landings, 1.5 s apart. Camera reframes to the window after the last one. | 사정을 창 안에 적는다 | 그럼 사정을 세 줄로 적어, 같은 창 안에 넣어 봅니다. | tick on each landing | "Same window, three more lines." |
| P2 | 27–36 | Proof | The same AI now writes a specific reply. | 1 the new reply typing; 2 the full request above it. | The old reply fades out (0.5 s), then the new reply types line by line. Long hold for reading. | 같은 AI, 다른 답 | 같은 AI가 이번에는 이 관계와 목적, 말투에 맞춰 씁니다. | swish on clear, motif when the reply completes (31.0) | "Nothing changed but the request." |
| P3 | 36–45 | Proof | Each line shapes one part of the answer. | 1 accent link from request line to reply phrase; 2 underlined phrase. | The links draw one at a time and earlier ones dim to 35%. Each phrase is underlined and set in accent weight. | 한 줄이 답의 한 부분을 | 적어 넣은 한 줄이 답의 한 부분을 바꿉니다. | tick ×3 | "관계 → greeting, 목적 → the ask, 톤 → one apology." |
| T | 45–54 | Turn | Change one input and only its part follows. | 1 the 관계 value swapping; 2 the greeting retyping; 3 other links dimmed to 20%. | The old value lifts out as the new one rises in. The greeting erases, then retypes. Lines 2–3 hold still. | 관계만 바꾸면 / 인사말이 바뀐다 | 관계 한 줄만 바꾸면, 인사말부터 달라집니다. | tick on swap, swish on retype, motif (49.4) | "I can steer the answer one line at a time." |
| Y | 54–60 | Payoff | The opening image, read correctly: blank answer = blank request. | 1 the three request lines as empty dashed slots; 2 the reply's dashed blanks; 3 the next step. | The values fade into dashed slots, the reply reverts to the opening one, and its blanks are re-marked in the same dashed style. Two-line anchor. Sound fades over the last 1.2 s. | 뻔한 답 = 빈칸 / 다음 부탁엔 세 줄을 붙이세요 | 뻔한 답은 대개 빈칸 때문입니다. 다음 부탁엔 관계·목적·톤, 세 줄을 붙이세요. | swish, motif (55.4) | "Next time I'll add three lines." |

## Reduced-motion cut
The same beats, words and order. Nothing travels: positions cut at each move's midpoint under a 0.3 s crossfade, the camera stays wide, and typing becomes a fade.
