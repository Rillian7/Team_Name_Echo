# ECHO — PATCH 02 + Roman StoryFix: merge record

## The preserved baseline

The entire rendering path, static batching, adaptive resolution and quality
selector, software fallback, laboratory construction, textures, cinematics,
optimized Three.js integration and PATCH 02 interface come from our original
`ECHO_PATCH_02_FINAL` archive. The team's older `scene-polish.js`, renderer,
styling and three-dimensional scene were **not substituted**.

## Story changes transplanted from Roman's rebuilt version

| Source | Change | Integration point |
| --- | --- | --- |
| Roman `site/game.js` | Three complete case stories (017/018/019), evidence ledger, dialogue sequences, case transitions, choices, family scene, both endings | `game.js` story section only |
| Roman `site/session-config.js` | Optional operator service menu, selected cases, reordering, family-conversation toggle | `session-config.js`; imported in `game.js` |
| Roman `site/audio/*.mp3` | Three local acoustic evidence clips | `audio/` and `game.js` clip playback |
| Roman Anna geometry idea | A short, asymmetric polygonal bob | Two lightweight meshes under our existing `headEcho` in `hologram.js` |
| User feedback | Narrower shoulders for the female cast | One-time vertex deformation of our existing indexed body mesh in `hologram.js` |

## Deliberately not transplanted

- Roman's older lab scene, lighting, human mesh or glass material.
- Roman's unoptimized screen update and render settings.
- Roman's CSS/UI theme and older monitor, dossier or protocol layout.
- His high-mesh-count physical shatter finale. The new story invokes the
  original PATCH 02 lightweight fade so FPS is not compromised.

## Other integration fixes

- Retained our graph-quality toggle while implementing Roman's new Start,
  Enter, Space, Escape and number-key logic.
- Ensured the two archived projections have Anna's haircut too.
- Kept the optional developer menu out of the normal overlay focus trap.
- Added scoped styles for operator configuration and dossier stamps.
- Made optional audio preloads handle failures without unhandled promise
  rejections; an explicit listening action reports unavailable clips.
- Corrected the opening note to state there are three cases.

## Most relevant files

`game.js`, `hologram.js`, `session-config.js`, `style.css`, `ui-polish.js`,
`index.html`, `audio/*.mp3`; automated checks in `tests/`.
