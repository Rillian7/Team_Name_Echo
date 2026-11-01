# ECHO — archive interaction, guidance and desk secrets

Based on `main` at `6ec3e7881e2090e3c436aee45f558e320ce8c223`.

## Player-visible changes

- First case: projected equipment labels and matching toolbar highlights guide the player from dossier to intercom. A short contact-microphone check teaches that it hears the chamber rather than the intercom channel before the next case begins.
- Archive: a brief hush precedes two spatial shutter-motor tones. Both bays have named signal markers; markers outside the view point toward their source. The dialogue pauses for inspection with the archive open. Listening produces evidence and a new operator/Anna exchange about the retained reconstructions. Only then can the player close the archive and continue to the original final choice. A failed audio load offers retry or an explicitly named backup transcript. The transcript produces the same evidence without claiming that audio played.
- Archive visibility is tracked separately from the story revelation. Closing the bays also clears the live reveal flag, so later microphone use cannot incorrectly play an open-archive recording.
- Release ending: the hum fades to silence with a restrained soft tone. Repeated glass-cracking sounds during the release fade are removed. Reset ending: the audio cuts, then the original hum and activation tone return. Both ending choices and their original meaning remain.
- Desk: an original small brown night-shift bear with a black top hat and purple bow tie (FNAF reference), a clickable nose/hitbox with a quiet synthesized honk, and an original Phasmophobia ghost-hunting booklet. These do not alter case evidence or endings. The booklet is on the right of the dossier; the bear is left of the microphone. No downloaded game cover, model or audio is used.

## Implementation

`interaction-polish.js` owns five lightweight projected DOM markers and procedural Web Audio effects. Only active markers are projected, capped at 20 Hz. No added shadow map, postprocessing or physical glass pass. The new desk props use simple local geometry and one generated cover texture; the existing batching remains active. `game.js` owns all narrative progression and desk input guards.

## Executed validation

- `node tests/check-story.cjs`: complete release/reset paths with and without the family conversation; first microphone check; archive inspection gate; audio evidence; protocol open/close without losing choices; archive close state; unavailable audio and backup transcript through ending; prior dossier/captain regressions; selected case orders.
- `node tests/check-interaction.mjs`: dossier/intercom/microphone guidance; offscreen archive directions; hiding guidance during dialogue, listening, overlays and endings; procedural sound scheduling; original prop geometry and bear hitbox raycast using the repository's Three.js.
- `node tests/check-model.mjs`: existing character/Anna/archival geometry checks.
- Syntax checks for changed JavaScript; `git diff --check`.

## Limits

No browser visual or listening test was executed: this environment has no installed browser executable, and the browser download failed. The tests exercise real narrative functions with mocked DOM/audio, actual Three.js prop construction/raycasting, and sound event scheduling; they do not measure FPS, verify final pixel layout or evaluate sound quality on the presentation laptop. Before presenting, check label placement, desk prop visibility, mute behavior, both endings and archive audio in the actual browser.

## Follow-up: quiet atmosphere and desk cleanup

Removed the Phasmophobia booklet (geometry, cover texture, hit target and input handler) and the unused five-sheet bright stack at x=-2.8 beside the bear. The actual case dossier and bear remain.

Added atmosphere.js: a local filtered looping ventilation bed and softly scheduled sine melody, mixed through the existing master/mute control. Anomaly damage is remembered across case changes: first notes drop out, then the melody and air fade further. Dialogue and contact audio duck the background. Archive inspection is silent; after inspection the room fill softens and the existing desk light becomes warmer/brighter. Existing release/reset sound envelopes retain control during endings. No new lights, shadow passes, remote assets or timer loops.

Executed follow-up validation: check-story.cjs, check-interaction.mjs, check-atmosphere.mjs, check-model.mjs, syntax checks and diff whitespace checks passed. The new test covers cozy mixing, dialogue ducking, persistent deterioration across cases, silence, warm aftermath and ending-envelope ownership. Browser visual/audio testing remains unavailable as described above.
