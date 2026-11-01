# ECHO Patch 01 — Test Report

Date: 2026-11-01.

## Environment and method

The untouched supplied project was extracted separately and retained as the baseline. Both versions were run over local HTTP in headless Chromium 153.0.8010.0 with an actual WebGL context backed by ANGLE/SwiftShader. This compiles and renders the real Three.js materials; it is software GPU emulation, not an RTX 3050 benchmark.

Development-only browser tools and test fixtures live outside the delivered project. Gameplay was driven through the actual buttons, keyboard events and pointer events. Test-only read-only scene references were appended by the test server for assertions; they are absent from the ZIP. No story state was forced for the ending playthroughs.

## Technical results

| Check | Result |
| --- | --- |
| Syntax of every application JavaScript module and the new geometry module | Passed |
| Relative module imports and HTML asset references | Passed; all local paths resolve |
| Original and patched application startup over HTTP | Passed |
| Three.js scene and projection shader initialization | Passed; no shader errors |
| Balanced and Speed quality switches | Passed |
| Adaptive Speed rendering budget | Passed; changed from 1,300,000 to 1,070,000 pixels under the emulated renderer's load |
| Resize and repeated quality changes | Passed; geometry/texture counts remained stable across the exercised cycles |
| Signal-monitor upload cap | Passed; 8 updates in a measured 1,103 ms interval, below the original approximately 15 Hz ceiling |
| Forced WebGL failure | Passed; Canvas2D fallback starts, displays the scene and operates dossier/dialogue controls |
| Fresh ZIP extraction and Python HTTP-server smoke test | Passed; uninstrumented production modules and controls operate |

All exercised WebGL sessions completed without JavaScript, shader or failed asset-request errors. The forced-failure test emits Three.js's expected “Error creating WebGL context” diagnostic before successfully switching to Canvas2D; this is the deliberately simulated failure.

## Visual review

Rendered screenshots were inspected at **1920 × 1080**, **1366 × 768** and **1280 × 720**, including Speed mode. Review covered the human silhouette, face/head proportions, material volume, chamber framing, lighting contrast, observation glass, desk equipment, HUD and dialogue. Dialogue and bottom-action bounds were also checked programmatically at the required sizes. The archive/damage stage and the CPU fallback were rendered and inspected separately.

The new geometry has real depth and separate head articulation; it is not a billboard. The rough projection uses partial transparency and selective contour accents, without the previous glass reflection or dense polygon edges. Bright rear panels are outside its silhouette. The new gantry stays fixed.

Core dialogue has no backdrop filter. A reduced-motion media emulation confirmed that the new dialogue animation is disabled. Intro, dossier, evidence and ending designs have not received the reserved Patch 2 redesign.

## Functional regression results

Passed through the real game controls:

- Start a shift and retain the dossier requirement before intercom activation.
- Open and close dossiers by button and Escape, including case 047 and the incorrect-answer recovery path.
- Activate listening, repeat a current dialogue line and advance through dialogue.
- Follow the correct first answer and the incorrect-answer/dossier/retry route.
- Follow both anomaly responses and both later truth-question choices across the two playthroughs.
- Exercise both the operator-recording branch and the direct continuation branch.
- Observe damage values 20, 48 and 72; check the meter and visible damage-line count.
- Complete the asynchronous 018 → 047 transition and preserve the new head pivot's narrative tilt.
- Open the archive, animate shutters and show the archive reconstructions.
- Open/close the protocol and retain the accumulated evidence entries.
- Complete **both original endings**, preserving their displayed titles and text.
- Verify the release fade reaches opacity zero and hides all reconstructions; verify the archive update does not resurrect them.
- Restart after both endings and return to the original intro/initial state.
- Toggle sound and verify master gain mutes/restores correctly. This is an API/state check, not an auditory assessment.
- Use D, E, J, R, Space and Escape with the original focused-control rules.
- Drag to look around and click the existing 3D dossier, monitor and intercom targets using projected screen positions and actual pointer events.

The CPU fallback received a scene/dossier/dialogue smoke test; complete ending playthroughs were performed in WebGL.

## Narrative preservation

The entire source block from `let audio,` through the end of the original resize/input handlers is **byte-for-byte identical** to the supplied `game.js`. This covers audio, story variables, dialogue/choices, dossier/evidence content, narrative/ending conditions, state transitions, interaction requirements, controls and restart.

SHA-256 of that unchanged block:
`8fda6bec1673c376bcdb84a6ba478792fe1d2bde1d812720467f8221269a4d6c`

`index.html`, local Three.js, the existing two art images and `concept.html` were retained unchanged. The original README text was retained and an English Patch 1 section appended.

## Equivalent-view renderer comparison

Measured at 1366 × 768, device scale factor 1, in the same initial gameplay view. Both graphics modes gave the same scene counts. Balanced buffers were 1366 × 768; the initial Speed buffers were 1297 × 729.

| Metric | Original | Patch 01 |
| --- | ---: | ---: |
| Draw calls per frame | 265 | 97 |
| Visible triangles per frame | 14,786 | 16,950 |
| Uploaded geometries | 232 | 79 |
| GPU textures | 8 | 9 |
| Transparent meshes in the scene | 89 | 18 |
| Unique mesh materials in the scene | 69 | 47 |
| Static objects batched | 344 | 551 |
| Lights, including hemisphere fill | 8 | 8 |

Draw calls fell by **63.4%**. Visible triangles rose by **14.6%** for the human geometry and added hardware. The additional texture is a 512 × 256 local label atlas. Total GPU texture bytes were not measured. The archive-stage patched view recorded 165 calls and 21,486 triangles at 960 × 540; it is not an equivalent-view baseline comparison.

The exercised quality/resize cycles retained 79 uploaded geometries and 9 textures. This is a bounded resource-growth check, not a long-duration memory profiler. Dynamic shadows remain disabled; no bloom, transmission or post-processing pass was introduced.

## Limits and recommended manual checks

- **Physical RTX 3050 FPS, frame times, thermals and driver behavior were not measured.** SwiftShader timing cannot establish performance on the presentation laptop. No laptop FPS claim is made.
- **Firefox was not available for execution.** Chromium was rendered/tested; Firefox remains a required manual check. No browser-specific runtime dependency was added.
- English speech voice availability and audible quality depend on the browser/OS. Sound state, master gain and repeat controls were checked, but playback was not listened to.
- Canvas2D keeps its simpler painter-sorted lighting and affine texture mapping. It does not reproduce the WebGL phosphor shader, fine points or exact glass sorting. Existing CPU-renderer texture seams can remain visible.
- No live GitHub Pages deployment was performed, as requested. Relative local imports and static hosting were checked.
- Full mobile/responsive coverage, long-duration profiling and every possible replay combination remain outside this Patch 1 validation. The narrative block comparison guards the untouched branches.

On the presentation laptop, use Firefox with hardware acceleration, select Speed, replay both endings and check English voice output. Compare smoothness at 1920 × 1080 and 1366 × 768, including the archive reveal. This device-specific review is still necessary.

## Final archive verification

The ZIP contains the complete game, local vendor module/license, both original images, the human asset, reference concept and documentation. Temporary browser/npm/Python dependencies, test fixtures, screenshots, IDE files and caches are excluded.

The fresh extraction was served by `python -m http.server` and opened in Chromium 153.0.8010.0 without test instrumentation. WebGL startup, start/dossier/intercom/dialogue advancement, quality and audio controls passed. Every requested application file returned HTTP 200, with no external application requests or runtime/shader errors. This production build again recorded 97 draw calls, 16,950 triangles, 79 uploaded geometries and 9 textures.

Final ZIP CRC and byte-for-byte comparison against every source deliverable passed. The archive has 15 files with `index.html` directly at its root.
