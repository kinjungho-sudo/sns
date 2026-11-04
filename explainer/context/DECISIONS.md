# DECISIONS — stand-in film (superseded)

> Built while the brief's placeholders were still blank. The user then supplied the real brief, the coffee-money film in `../coffee/`. This film is kept as source only and is not rendered by `npm run film`.

One line per call made without input. Newest at the bottom.

1. **Brief was blank.** The template's {{TOPIC}}, {{AUDIENCE}}, {{OUTCOME}} and {{SECONDS}} were unfilled, so the brief comes from this repo's own subject: the 관계·목적·톤 lesson in the carousels and the Claude lecture sample.
2. **Topic:** why a short request to an AI assistant gets a generic answer, and what fixes it (context in the window).
3. **Audience:** Korean office workers who already use an AI assistant and believe "짧게 물어도 알아서 맞춰 쓴다 / 답이 뻔하면 AI 성능 탓".
4. **Outcome:** after watching they can add three lines (관계·목적·톤) to a request and predict which part of the answer each line changes.
5. **Length:** 60 s. Five arc parts need room for Korean reading speed; captions stay under 9 characters per second.
6. **Question in the viewer's words:** "똑같은 AI인데 왜 내 부탁엔 뻔한 답이 나올까?"
7. **Hook (the wrong belief):** "답이 뻔하면 AI 성능 탓이다." The film opens on a real generic reply full of [빈칸].
8. **No metaphor.** The real thing is a chat window, so the film shows a chat window. The only abstraction is naming it "AI가 읽는 창".
9. **./brand, ./refs, ./screens do not exist.** Brand is taken from the repo: Pretendard and the teal accent #17d0bb. Teal is darkened to #0B6B62 so text passes 4.5:1 on a warm ground.
10. **Second typeface:** DejaVu Sans Mono, used only for the line-number gutter in the request card. The machine has no other Hangul family, and Pretendard carries all Korean text.
11. **Real UI without branding:** the window is titled "AI 어시스턴트", as in the carousels, so the film does not imitate any company's product chrome.
12. **The replies are real.** They were written by Claude in this session for the exact prompts on screen, then trimmed to three lines. See SOURCES.md.
13. **No voice-over.** No Korean TTS engine is installed and a robotic voice would hurt more than help. The narration lives in captions, burned in and in captions.srt. With no voice, there is nothing to duck the bed under.
14. **"Max two lines on screen"** applies to headline anchors. The window's request and reply text is UI content and is exempt.
15. **No numbers on screen** beyond the example's own "3년" and "1주", which are inputs to the example, not claims. No metrics, so SOURCES.md has nothing to back except the two doc quotes and the replies.
16. **MP4 files stay out of git,** as in the reel. The source plus `npm run film` re-renders them. Stills, captions and the contact sheet are committed.
