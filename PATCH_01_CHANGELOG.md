# ECHO — Patch 01: Cinematic & Visual Overhaul

Date: 2026-11-01. Scope: Patch 1 only.

## Human reconstruction

- Replaced the primitive mannequin with a compact, continuous human body surface: shaped shoulders, clavicles, torso, waist, hips, tapered limbs, hands and feet. The body asset has 952 vertices and 1,900 triangles.
- Built a separate articulated head with a human skull/jaw profile, subtle nose planes, resting eye creases, a mouth and a restrained tonal hair region. All facial features now follow the existing head pivot.
- Removed the protruding spherical ears, the skirt-like lower body, the overlapping inner skull/chest shells and the all-over polygon wireframe.
- Replaced reflective physical glass with a rough, translucent phosphor material. A small single-pass shader adds view-dependent contour light, faint stationary surface bands and stress-driven fragmentation. There is no transmission pass or full-screen effect.
- Kept the original `echo`, `body`, `headEcho`, `glass`, `cracks` and `hiddenEchoes` references, including the original 0.53 fade opacity expected by the release ending.
- Fit damage lines to the new anatomical surface using construction-time local raycasts. Their original number, visibility thresholds and narrative triggers are unchanged.
- Moved archive projections and their contact shadows forward within the existing bays, so their faces clear the observation-window posts.

## Lighting and materials

- Rebalanced the existing light sources into cool chamber light, darker forest-green room fill, a subtle rear rim and a warm operator-desk pool. The light count remains unchanged: seven point lights and one hemisphere light.
- Reduced fixture emission and ceiling glare. Retained the original narrative-controlled ceiling light, blackout and flicker behavior.
- Gave walls, ceiling, floor, doors, metal frames, desk, equipment, paper and canisters distinct roughness and restrained metal finishes.
- Reduced observation-glass opacity and removed its unnecessary physical-material specialization. No shadow maps or post-processing were introduced.
- Moved bright reference panels away from the transparent subject's silhouette to preserve its readable volume.

## Laboratory and equipment

- Added a fixed reconstruction gantry with ceramic emitter tiles, brass fittings, floor service conduits and brackets. It stays behind the character and never sweeps across the face.
- Added a back-wall diagnostic rack, equipment housings, controls, cable runs, monitor vents, feet, fasteners, small labels and dossier clips.
- Shared one 512 × 256 local canvas atlas between the new equipment labels.
- Refined the signal monitor's graticule, restrained CRT mask, frame and trace. Its existing text and signal behavior are preserved.
- Prepainted static monitor detail once, removed the per-update canvas shadow blur, and kept the original 66 ms update gate.

## Gameplay HUD

- Refined the ECHO top bar, status alignment, graphics/audio controls, typography, borders and hover/focus states.
- Reworked the current-session and integrity panels with lighter framing, clearer hierarchy, a segmented integrity meter and more deliberate spacing.
- Standardized the four bottom actions while retaining their labels, order, identifiers and actions.
- Refined speaker identification, dialogue typography, panel spacing, continuation/repeat controls and response buttons.
- Added a short dialogue appearance transition, disabled under `prefers-reduced-motion`. Core panels do not use backdrop blur.
- Preserved the intro, dossier, protocol and ending layouts for Patch 2. `index.html` is byte-for-byte unchanged.

## Atmosphere and performance

- Replaced 24 individually rendered translucent shards with one bounded 24-point system. Its small buffer updates at most 20 times per second.
- Tied contour, particle and halo fades to the existing reconstruction opacity. Retained subtle breathing, head motion, projector light, dust and the brief listening pulse.
- Did not add a permanent moving scanning ring.
- Extended static batching to normalized cylinders, rods and icosahedral fasteners in addition to boxes. Interactive meshes and moving characters/shutters remain separate. CPU rendering bypasses instancing.
- Reused canister and chart materials; stopped periodic uploads to the hidden diagnostic display; removed unused visual materials and routine performance console output.
- Preserved adaptive resolution, Speed/Balanced controls, the pixel budgets, disabled dynamic shadows and lightweight contact shadows.
- Updated the CPU renderer to honor vertex colors and selective line segments. The shader enhancement is skipped without WebGL.

## Small visual bug fix

The archive animation previously re-enabled archive figures every frame even after the release ending hid them. It now respects the central reconstruction's visibility. The original ending condition, timer and narrative output remain unchanged.

## Files

Modified:
- `game.js` — visual integration, lighting/materials, batching, cached monitor drawing and archive placement. The complete audio/state/story/input block remains byte-for-byte identical to the supplied source.
- `scene-polish.js` — fixed hardware, equipment details, shared labels, restrained effects and fade synchronization.
- `software-renderer.js` — readable formatting, vertex-color support and selective segment rendering.
- `style.css` — scoped core-HUD pass; no full stylesheet rewrite.
- `README.md` — appended Patch 1 links and the requested Python launch command.

Added:
- `hologram.js` — human construction, projection material and visual updates.
- `art/human-body.js` — compact local indexed human geometry, shared by archive clones.
- `PATCH_01_CHANGELOG.md` and `PATCH_01_TEST_REPORT.md`.

Unchanged required resources, including `index.html`, local Three.js, its license, existing art and `concept.html`, are included. No backend, CDN, build step or runtime package installation is required. No remote repository was modified.
