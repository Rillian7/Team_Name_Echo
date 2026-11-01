# Merge verification

## Automated tests run

- `node --check game.js` — JavaScript syntax valid.
- `node --check hologram.js` and `node --check session-config.js` — valid.
- `node tests/check-model.mjs` — original indexed glass mesh kept; shoulder
  deformation applied; two-piece low-poly haircut attached to Anna's head;
  archived duplicates retain that haircut; shared glass material preserved.
- `node tests/check-story.cjs` — full three-case narrative with **both endings**,
  **with and without** optional family conversation; dossier reopening;
  paused dialogue recovery; audio evidence; alternate case order.
- Local Python HTTP server + HTTP GET — all 11 essential assets (HTML, JS,
  CSS, local Three.js, indexed character, all three MP3s) returned **200 OK**
  with appropriate content types. The server was stopped after the check.

## Manual checks recommended on the presentation laptop

1. Serve the extracted folder: `py -m http.server 8000`.
2. Open `http://localhost:8000` and click operator 071 in the intro; enable
   default 017 → 018 → 019 order.
3. Check graphical balance/speed selector and FPS through each case.
4. Confirm Anna's short bob and all women's shoulders from the front.
5. Check the 3 microphone clips and both endings (restart for second ending).
6. In browser developer tools, verify no network or console failures.

The automated tests cannot measure Firefox/Windows GPU frame rate or establish
visual rendering on the user's actual hardware. No hosted production deploy
was made by this merge.
