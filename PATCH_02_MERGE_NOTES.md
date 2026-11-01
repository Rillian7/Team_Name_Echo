# Patch 02 — Future Merge Boundaries

The teammate's version is not part of this patch. Compare it separately before merging.

## Authoritative preserved gameplay

`game.js` is **entirely unchanged** from the supplied Patch 01 ZIP. SHA-256:

`37bdd3935303fd5e262587bd2c54668d8e086491bce9d3417b47879f73edcf47`

Useful anchors in that file:

- `let audio,` / `initAudio()` / `speak()` — audio and English speech.
- `let state = 'intro'` — story state and interaction flags.
- `logEvent()` / `renderEvidence()` — evidence storage, generation order and entry rendering.
- `say()` / `advance()` / `choose()` — Ukrainian subtitles, English speech, queue progression and choice handlers.
- `routineDoc` / `sisterDoc` / `dossierOpen()` — exact dossier contents and access rules.
- `routine()` through `revealScene()` — first case, verification/recovery paths, case transition, Anna, truth, optional recording and archive reveal.
- `release()` / `resetEnding()` / `finish()` — both existing ending conditions, output and fade/timer logic.
- Button assignments, `keydown`, pointer handlers — existing controls and their focus/input guards.
- `animate()` and `window.__echoDebug` — existing rendering updates and read-only diagnostics.

Prefer comparing by these anchors; line numbers may move in the teammate's version.

## Patch 02 visual ownership

- `hologram.js`: only the material/shader section before `const echo = new T.Group()` changed. Everything from that anchor to the end is byte-identical to Patch 01. Base `glass.opacity = 0.53`, returned group/material names and update API remain compatible with the original release ending.
- `style.css`: the consolidated presentation layer, including core HUD, overlay skins, scrolling bounds, focus and responsive/reduced-motion rules. Bring this over as a coherent stylesheet rather than stacking the old overrides beneath it.
- `index.html`: preserves every original ID and visible text. New wrappers are `.document-head`, `.document-body`, `.document-foot` and `#conversation`. Keep `#dialogue` and `#choices` within `#conversation`; leave `#doc-title` and `#doc-content` in `.document-body`.
- `ui-polish.js`: presentation-only overlay focus/inert management. It observes `hidden` on `#intro`, `#ending`, `#document` and `#evidence`. It does not own story progression, Escape/outside-click close, audio or restart.
- `scene-polish.js`, the software renderer, human geometry and vendor resources: unchanged by Patch 02.

## Practical merge check

1. Start with a clean comparison against the supplied Patch 01 baseline. Identify the teammate's actual additions; do not replace unknown gameplay changes blindly.
2. Retain their intended dialogue/branch changes in `game.js`, then apply this patch's HTML/CSS/material files while preserving the DOM IDs their version uses.
3. Check whether their code assumes `#dialogue` or `#choices` is a direct child of `#hud`, or scrolls the dossier's `<article>` itself. Patch 02 uses a conversation wrapper and a separate scrolling document body.
4. If they introduce another overlay, explicitly extend the focus layer list and target mapping in `ui-polish.js`. The present helper only knows the four existing overlays.
5. Replay the incorrect-answer recovery, both case dossiers, optional recording, archive reveal, release fade, reset and restart. Check that every retained/added choice is visible above the toolbar at 1280 × 720 and 768 px width.

Do not copy development test instrumentation into production. The delivered game contains no test-only state setter, test server or presentation shortcut.
