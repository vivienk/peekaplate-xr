# Original audio implementation

`src/glimmer/audio.ts` uses the original packaged OGG clips. It creates reusable music, ambience, kitchen-loop and capped one-shot channels once; audio starts only after the caller invokes `unlock()` from a user gesture. Call `dispose()` when tearing down the app.

Integration API:

- `unlock()` — start or retry gesture-authorized audio playback.
- `setDistrict(id)` — use the authoritative district IDs.
- `play(id)` — original sound IDs; unknown IDs are ignored. `sfx-step-wet` chooses a nonrepeating variant; `sfx-talk-blip` defaults to speaker variant 1, while explicit variants are available.
- `update(dt, {x, y}, paused, ar, sitting)` — seconds and original map tile coordinates. Call each frame, including during Pause, so music ducking can settle while weather audio continues.
- `setMusicMuted(bool)`, `setSoundMuted(bool)` — independent channels, matching the GDD's music vs ambience/SFX/UI groups.
- `dispose()` — stop all sources and close the optional Web Audio context.

The initial loops fade in over two seconds. District music and ambience crossfade at equal power over 1.5 seconds. The shared rain element never restarts during travel. District music resumes its playing position. Kitchen loops fade across district changes over 0.3 seconds, use random offsets on arrival when media duration is available, attenuate linearly from full volume at two tiles to silence at eight, and allow at most two audible kitchens. Their source locations match the original restaurant fixture pivots. Stereo panning uses Web Audio when available; distance attenuation still works with plain HTML media.

Pause and AR Portal duck music by 6 dB; AR ducks ambience by 3 dB. Sitting uses the original awning-rain blend and 4 dB music duck. Order-place, order-ready and finale clips temporarily duck music by 6 dB; overlapping duck conditions use the largest attenuation, not their sum. The district and grand finale clips cannot overlap. Unlock audio is delayed until 0.5 seconds after a find. Orbit ticks are limited to one per 80 ms. Fogline Pier gulls occur every 25–60 active seconds with the specified pitch and panning variations. Pause suspends scheduled gull/unlock countdowns, but does not stop rain. Footstep/cat/gull pitches use the original ranges.

Verification: TypeScript typecheck passed. A temporary mocked-media smoke test checked all audio URLs exist, no autoplay before a gesture, authored levels after the startup fade, district crossfade, rain continuity, order ducking, independent music/sound mutes, unknown-ID handling and disposal. This verifies control behavior, not perceptual quality. Actual browser/headset output, gapless HTMLAudio looping, browser-specific autoplay permissions and perceived spatial balance need listening checks.

Known scope: cat, wish-board and order-ready one-shots currently use the 2D SFX channel because `play(id)` does not receive a world position. Kitchen loops do have map-based positional attenuation and panning. The caller owns synchronization of footsteps, dialogue blips, puddle reveals, menu events and order timing; this mixer does not infer gameplay events.
