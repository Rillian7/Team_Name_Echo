# ECHO — Patch 02: Final Cinematic Polish

Date: 2026-11-01. Based only on the supplied `ECHO_PATCH_01_CINEMATIC(2).zip`.

## What changed

- **Opening:** an institutional ECHO identity, a framed live laboratory view, restrained research markings, a clear brass start action and a short entrance. The underlying gameplay header is concealed during the opening to avoid competing labels. The original title, description, notes, operator stamp and start handler are retained.
- **Dossier:** a warm archival paper surface, structured file heading, small decorative access markings and stronger typography. The close button and file footer stay outside the scrolling document body. Original content is inserted into the same IDs by the unchanged game code.
- **Protocol:** a coordinated dark research archive, numbered entries, subdued separators, readable category/title/body hierarchy and a framed empty state. The header, close control and footer remain available while entries scroll. Entry order, descriptions and generation logic are unchanged.
- **Both endings:** a quiet ECHO composition, controlled green/brass atmosphere, a thin frame, a restrained text reveal and an obvious restart action. The existing critical status gives the reset ending a slightly warmer background. All ending titles, descriptions, conditions and timers are unchanged.
- **HUD:** the Patch 01 header, session, integrity and four-button composition is preserved. A bounded conversation wrapper keeps long lines and choice lists above the action bar; both can scroll. Notifications have a readable width cap and consistent framing. Hover and keyboard focus remain visible.
- **Memory glass:** the existing human mesh uses lower roughness, very slight metalness, reduced emission, soft contour light and slow spatial density variation. Fine phosphor stripes are removed. This is lightly frosted translucent material rather than physically refractive glass. The base opacity remains exactly `0.53` for the original release fade. Anatomy, facial geometry, pivots, damage behavior and archive clones are retained.

## Files modified

| File | Scope |
| --- | --- |
| `index.html` | Readable markup, presentation wrappers, decorative identity marks, dialog/region labels, keyboard-scrollable dialogue and document regions, local inline favicon; original IDs and text retained. |
| `style.css` | Consolidated styles grouped into foundations, HUD, dialogue, opening, dossier, protocol, endings, feedback, motion and responsive sections. Replaces layered legacy overrides. |
| `hologram.js` | Material constants and the existing single-pass shader only; the complete geometry/construction/update section is unchanged. |
| `README.md` | Patch 02 launch and documentation links. |

Added: `ui-polish.js`, this changelog, `PATCH_02_TEST_REPORT.md`, `DEMO_GUIDE.md` and `PATCH_02_MERGE_NOTES.md`.

## Input and accessibility

`ui-polish.js` observes only the existing overlay `hidden` attributes. It moves keyboard focus into the visible overlay, contains Tab/Shift+Tab there, marks the underlying controls/canvas inert and restores focus on close. It does not install replacement game handlers or read/write story variables. Escape, outside-click close, all four action handlers, start/audio initialization and restart still belong to the original game.

The opening fade uses a CSS discrete-display transition where supported, with an immediate functional dismissal as the compatibility fallback. All interface animations and transitions honor reduced-motion preferences. Existing 3D motion and narrative timers remain unchanged.

## Performance and preserved architecture

- Removed the old full-screen dossier and protocol backdrop blurs. No new full-screen filter, transmission pass, shadow map, light, particle system or mesh was added.
- `ui-polish.js` has one observer watching four overlay visibility attributes and one Tab listener, registered once. It has no frame loop, interval or per-frame DOM work.
- The optimized/adaptive rendering, Speed pixel budget, static batching, monitor update gate, local dependencies and Canvas2D renderer are unchanged.
- Equivalent initial views retain **97 draw calls, 16,950 triangles, 79 uploaded geometries and 9 textures** in the measured Chromium environment. This is renderer workload evidence, not a physical laptop FPS benchmark.
- Laboratory lighting and equipment are intentionally retained from Patch 01. Their existing balance already supports the new material; extra equipment would add risk without helping the presentation.

## Preservation and intentional departures

**The complete `game.js` is byte-for-byte identical to Patch 01**, including story, audio, inputs, choices, evidence/documents, state transitions, both endings and animation logic.

SHA-256: `37bdd3935303fd5e262587bd2c54668d8e086491bce9d3417b47879f73edcf47`.

`scene-polish.js`, `software-renderer.js`, `art/human-body.js`, both art images, the Three.js module/license, `concept.html` and Patch 01 reports are also unchanged. No teammate changes have been merged or reconstructed. No repository or deployment was created.

Intentional visual departures are the four redesigned overlay families, a frosted-glass rather than phosphor surface, the removal of expensive overlay blur and the new bounded conversation layout. UI fixes include competing opening/header labels, keyboard focus escaping dialogs, off-screen long replies and close actions being part of a scrolling document.

## Limits

See the test report for exact executed checks and environments. Firefox and the presentation laptop's RTX hardware were not available for execution. Canvas2D preserves its simpler shading and texture mapping; it does not reproduce WebGL specular glass. Speech voices remain dependent on browser/OS configuration. No story or gameplay shortcuts were added.
