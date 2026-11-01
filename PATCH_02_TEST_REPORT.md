# ECHO Patch 02 — Test Report

Date: 2026-11-01. Baseline: the supplied `ECHO_PATCH_01_CINEMATIC(2).zip`.

## Environment and test method

Executed in **Linux, headless Chromium 153.0.8010.0**, using a real **WebGL 2** context backed by **ANGLE/SwiftShader**. SwiftShader is software GPU emulation; these results are not measurements of the owner's RTX 3050 laptop. Firefox was not available for execution.

The untouched Patch 01 ZIP was extracted separately. Development tests served both baseline and patched files over local HTTP. A development-only server appended read-only scene references for assertions; it did not install a story-state setter. Full ending routes were driven through the actual game buttons/keyboard/pointer inputs, without forcing state. Temporary long-text DOM fixtures were restored or replaced by the original file/dialogue contents before progressing. No test server, browser dependency, fixture or instrumentation is included in the release.

The final archive was also extracted afresh and checked through the real Python standard-library HTTP server, using the uninstrumented production files.

## Preservation checks

- `game.js` is byte-for-byte identical to the supplied Patch 01 file. SHA-256: `37bdd3935303fd5e262587bd2c54668d8e086491bce9d3417b47879f73edcf47`.
- Every original nonblank HTML text node, normalized only for markup whitespace during comparison, remains present. Every original DOM ID remains; no duplicate IDs were introduced.
- The human construction/geometry/update section beginning at `const echo = new T.Group()` is byte-identical to Patch 01. Only its earlier material/shader section changed.
- `scene-polish.js`, `software-renderer.js`, human body data, vendor module/license, both art images, `concept.html` and Patch 01 reports remain byte-identical.
- Application module syntax and relative imports were checked. All imported local modules resolve.
- The final stylesheet formatting pass was checked using Chromium's CSSOM: all **173 top-level rules** serialize identically before and after formatting. This guards the formatting step; intentional visual changes precede that comparison.

## Functional results

| Check actually executed | Result |
| --- | --- |
| Initial HTTP load, intro, start action, WebGL scene and visible subject | Passed |
| AudioContext activated by the real start click | Passed; context reports `running` |
| Dossier prerequisite before intercom | Passed; original warning and state preserved |
| Dossier 018 and 047, close button, Escape and outside-click close | Passed |
| Empty protocol, generated entries, close/reopen and scrolling | Passed |
| Generated evidence category/title/description order vs. original in-memory entries | Exact match |
| Real dialogue queue, Next/Space and all displayed choice buttons | Passed |
| Incorrect first answer, another incorrect verification, dossier recovery and retry | Passed |
| Correct first answer and both anomaly responses | Passed across two playthroughs |
| 018 → 047 asynchronous transition, restored subject and case change | Passed |
| Both truth-question choices, optional operator recording and direct continuation | Passed across two playthroughs |
| Damage 20 / 48 / 72, meter state and visible cracks | Passed; first damage shows five original crack lines |
| Archive shutters and both side reconstructions | Passed |
| Release ending, exact original title/copy and complete fade | Passed; central and archive subjects stay hidden |
| Reset ending and exact original title/copy | Passed |
| Restart after each ending | Passed; original intro/initial state restored |
| Graphics toggle, adaptive Speed sizing and repeated changes | Passed |
| Sound mute/unmute | Passed; master gain state checked with floating-point tolerance |
| D, E, J, R, Space, Escape and original focused-control rules | Passed |
| Mouse drag look/return and actual projected 3D dossier/intercom/monitor targets | Passed |
| Overlay focus entry, Tab/Shift+Tab loop, focus return and background inert state | Passed |
| Outside-click close does not activate the scene behind the dossier | Passed |
| Long dialogue, long document, long choice-list fixtures and pinned close action | Passed; overflow scrolls and original contents/buttons are retained |
| Repeated overlay/resize/graphics cycles | Passed; resources remain bounded |
| Reduced-motion preference | Passed; UI entrance animations and transitions disabled |
| Unexpected JavaScript, shader, failed local asset and external application requests | None in exercised WebGL routes |

The main functional/layout run completed **22 check groups and 35 state/viewport combinations**. Supplemental checks exercise pointer targets, scrolling stress, resource cycles, DPI/zoom equivalents and the CPU renderer.

## Responsive and visual checks

Each of the following viewports was exercised for the intro, dossier 018, live dialogue, three-choice screen, populated protocol and **both endings**:

| CSS viewport | Result |
| --- | --- |
| 1920 × 1080 | Passed |
| 1366 × 768 | Passed |
| 1280 × 720 | Passed |
| 1024 × 768 | Passed |
| 768 × 768 | Passed |

Bounds checks found no horizontal page overflow, clipped visible buttons or dialogue/choice overlap with the bottom toolbar. Rendered screenshots were visually reviewed for the opening, glass subject, dossiers, protocol, archive/damage stage and both ending compositions, including smaller-width layouts. Document content can require scrolling at shorter sizes; close controls stay available.

Additional contexts:

- **DPR 2, 1920 × 1080:** Speed drawing buffer **1520 × 855** (1,299,600 pixels), within the preserved budget.
- **80% zoom-equivalent context:** CSS viewport **1600 × 900**, device scale factor approximately **0.8**, Speed buffer **1280 × 720** (921,600 pixels). This checks the corresponding CSS layout/pixel ratio; actual browser toolbar zoom was not operated. The normal contexts cover 100% scale.
- Reduced-motion emulation confirmed no entrance animation on the intro or ending and no UI transition duration.

## Objective performance evidence

Equivalent initial gameplay views at 1366 × 768, DPR 1:

| Renderer metric | Supplied Patch 01 | Patch 02 |
| --- | ---: | ---: |
| Draw calls per frame | 97 | 97 |
| Visible triangles per frame | 16,950 | 16,950 |
| Uploaded geometries | 79 | 79 |
| GPU textures | 9 | 9 |

No extra geometry, lights, textures, frame loop, shadow pass or transmission pass was introduced. Speed retains the original adaptive pixel budget and disables the same canvas filter/grain as before. The new overlay backgrounds do not use backdrop blur.

After activating the existing listening pulse, the renderer had **80 geometries and 9 textures**; those counts remained identical through **12 dossier/protocol open-close cycles**, five viewport changes and repeated graphics toggles. The one additional geometry is an existing effect first becoming visible, not a Patch 02 mesh.

A separate **60-second Speed runtime sample**, taken at five points approximately 15 seconds apart in the initial gameplay view, retained **79 geometries, 9 textures, 15 shader programs, 97 calls and 16,950 triangles** throughout. Its drawing buffer adapted from 1297 × 729 to 1265 × 711 under emulation. This is a bounded resource-growth observation, not a full heap/GPU-memory profiler or a long-session leak proof.

No claim of improved FPS, physical laptop frame times, driver behavior or thermal stability is made. Unchanged renderer counts support the workload constraint; the actual presentation browser/laptop still determines perceived smoothness.

## Software fallback

WebGL context creation was deliberately forced to fail before application startup. The original Canvas2D renderer activated and displayed the anatomical subject. Its CPU graphics label and disabled toggle were correct. A **complete release-ending playthrough** exercised dossiers, intercom, dialogue/choices, damage, archive, protocol, fade, ending and restart. No unexpected JavaScript errors occurred.

Three.js emits its expected `Error creating WebGL context` diagnostic during this deliberate failure. It is followed by the successful fallback, not an unhandled runtime failure. Canvas2D keeps its simpler lighting/affine texture mapping and does not implement WebGL specular glass, fine points or exact transparent sorting.

## Final packaging and static-server smoke test

The complete ZIP has `index.html` at its root, all local modules, both existing images, the human asset, Three.js/license and the four requested Patch 02 documents. Development files, browser packages, screenshots and caches are excluded.

A fresh extraction was launched with `python -m http.server` and opened without test instrumentation. Startup, start click, Speed selection, dossier, intercom/dialogue advancement, protocol, sound and restored background input passed. Every requested application file returned HTTP 200, with no external application request, JavaScript error or shader error. The production scene retained 97 calls, 16,950 triangles, 79 geometries and 9 textures. ZIP CRC and every archived byte were compared against the final source files.

## Honest limits and unresolved issues

- No unresolved functional regression was found in the executed paths.
- **Firefox and the physical presentation laptop were not tested.** Rehearse Speed mode, archive reveal and both endings on that device.
- AudioContext/mute/repeat behavior was checked programmatically; sound was not assessed by listening. Speech voice availability and whether a voice is local depend on browser/OS setup.
- Actual browser UI zoom at 80% was not operated; the corresponding viewport/device-ratio context was tested instead.
- This remains a desktop-first game. The required widths were tested; exhaustive phone, touch, screen-reader and multi-hour testing were not performed.
- Not every replay permutation was played independently. The entire gameplay file is unchanged; both endings and the principal alternative/recovery branches were exercised.
