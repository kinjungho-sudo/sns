# Narrated master with Typecast

The 16:9 master can carry a Korean voice from Typecast. The silent cuts stay as they are.

## Needs
- **API key:** `TYPECAST_API_KEY` in the environment. In cloud sessions, add it as an environment secret and never ask the user to paste it into chat. Optional: `TYPECAST_VOICE_ID` (otherwise the first voice the API lists is used; the full list is saved to `out/vo/voices.json`) and `TYPECAST_MODEL` (default `ssfm-v21`).
- **Network:** `api.typecast.ai` must be reachable. If a check like `curl -sS -m 10 https://api.typecast.ai/` fails, tell the user the host is blocked and how to allow it, then carry on with the rest.

## Script: `narration.json`
```json
{ "duration": 30, "hold": 1.0,
  "lines": [ { "id": "01", "at": 0.25, "until": 3.0, "say": "커피 한 잔, 오천 원. 푼돈이죠?", "show": "커피 한 잔, 5,000원. 푼돈이죠?" } ] }
```
- `say` is what the voice reads. Write numbers in Hangul (오천사백칠십오만 원) so they are pronounced correctly. `show` is the caption, with digits.
- `at` is the earliest start (usually the beat's start). `until` is the latest end, before the next visual beat.
- `duration` is the film's visual length. `hold` freezes the last frame so the final line can finish over the payoff image.
- Narration lines are usually shorter than silent captions. Aim for about 6 syllables per second of window.

## Run
```bash
npm run film                                      # once, for out/audio_raw.wav
TYPECAST_API_KEY=… npm run narrated                # → out/master_16x9_narrated.mp4 + captions_narrated.srt
TYPECAST_DRY_RUN=1 npm run narrated               # pipeline test with tones; delete its output, never ship it
```
What `tools/narrate.mjs` does:
1. Requests one clip per line, then trims leading and trailing silence.
2. Measures each clip and starts it at `max(at, previous end + 0.12 s)`.
3. Re-requests a line faster only if it would overrun `until`, and never beyond 1.25×.
4. Writes `out/vo/timing.json`, which `film.js?vo=1` uses for captions.
5. Side-chain ducks the bed under the voice (about −10 dB in testing) and normalizes the mix to −16 LUFS / −1.5 dBTP.

## API (as documented, unverified against a live call)
- `POST https://api.typecast.ai/v1/text-to-speech` with headers `X-API-KEY` and `Content-Type: application/json`. The body is `{voice_id, text, model, language:"kor", prompt:{emotion_preset, emotion_intensity}, output:{volume, audio_pitch, audio_tempo, audio_format:"wav"}, seed}`, and the response is audio bytes.
- `GET https://api.typecast.ai/v1/voices?model=…` lists voices (`voice_id` starts with `tc_`).
- The docs disagree on whether `audio_tempo` sits under `output` or at the top level. The script uses `output`. If the first real call fails, it prints the API's error body; adjust the body in `tts()` and say what changed.
