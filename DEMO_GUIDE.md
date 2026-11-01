# ECHO — Presentation Guide

## Launch locally

1. Extract the entire ZIP. Open the directory containing `index.html`.
2. In that directory, run:
   ```text
   py -m http.server 8000
   ```
   On systems without the Windows `py` launcher, use `python -m http.server 8000`.
3. Open `http://localhost:8000` in the presentation browser. Keep the server terminal open.
4. Use headphones or speakers. Press **ПОЧАТИ НІЧНУ ЗМІНУ** to start and initialize audio.
5. Select **ГРАФІКА · ШВИДКІСТЬ** with the graphics button after starting. Rehearse on the actual presentation laptop/browser.

All application files and Three.js are local. No build, npm, extra Python package, backend or application internet connection is required. Installed speech voices depend on the browser/OS; local voices are preferable for an offline presentation.

## What to show first

Let the opening screen sit briefly. Introduce the central idea: an operator checks reconstructed memories in a research laboratory. Start the shift, point out the glass-like person, warm desk lighting and cold equipment, then open the dossier. That connects the visual presentation to the actual interaction immediately.

## A 1–3 minute presentation

Use the existing **ДАЛІ →** control or Space to advance after making each point. These controls progress the real conversation; there is no demo shortcut.

- **0:00–0:25:** show the opening, start the shift, choose Speed and briefly drag on an empty part of the scene to demonstrate the 3D view.
- **0:25–0:50:** open **ДОСЬЄ**, mention that it contains the identity-check details, and close it. Click **ІНТЕРКОМ**.
- **0:50–1:25:** advance the first exchange and confirm **«Ластівка»**. Show the first cracks and the integrity change. Choose to mark the anomaly and end the check.
- **1:25–2:15:** let the original case transition finish. Show case 047 and the new dossier; close it and ask why Anna called the operator captain.
- **2:15–3:00:** advance to the truth question and choose either existing question. Continue listening to Anna to reach the archive. Show the side chambers, then briefly open the accumulated **ПРОТОКОЛ**. If time is short, stop at the case-047 reveal; complete the ending in the longer walkthrough.

Keep narration short when progressing quickly. For a story-focused presentation, allow more than three minutes and let the dialogue breathe.

## Longer gameplay walkthrough

Allow approximately the existing 4–6 minute session estimate, or longer if you read every subtitle aloud.

1. Start, select Speed, open case 018 and read its control details.
2. Close the file, activate the intercom, hear Olena and confirm **«Ластівка»**. A wrong answer remains recoverable through rechecking the file and retrying.
3. Ask what happened after the light was switched off, then let the transition load case 047.
4. Open Anna's dossier and compare the childhood memory with her dialogue. Ask about the captain nickname.
5. Ask either truth question. Optionally play the operator's archived recording before continuing.
6. When the archive opens, briefly look toward each side chamber. Open the protocol and scroll through the entries; close it to return to the same conversation.
7. For the release ending, select **Вислухати до кінця й звільнити відлуння**. Let the final exchange and full disappearance finish before speaking over the ending.
8. To demonstrate the other conclusion, restart and replay the session, then choose **Стерти власну пам’ять. Почати новий сеанс.** at the final decision. This is an existing ending, not a reset shortcut.

## Strong visual moments

- The opening's live laboratory composition.
- The human silhouette and subtle glass reflections against the darker chamber.
- The dossier's paper treatment and the growing scientific protocol.
- The 018 → 047 blackout/return and the first visible damage.
- The two archive chambers opening at high instability.
- The release fade and either final ECHO screen.

## Controls, restart and recovery

- Drag the scene to look around; click the existing dossier, intercom and monitor targets or use the four bottom buttons.
- `D`: dossier; `E`: intercom; `J`: protocol; `R`: repeat the current line; Space: next line; Escape: close documents/protocol.
- Hotkeys retain the original focused-control rules. When a button has keyboard focus, Tab to another control or click an empty part of the scene before using a global hotkey.
- Tab and Shift+Tab stay within an open overlay. The dossier body and evidence list can receive focus for arrow/Page Down/End scrolling.
- At either ending, choose **ПОЧАТИ СПОЧАТКУ ↺**. This reloads the original starting state. Before an ending, refreshing the browser also restarts the session.

If audio is blocked, start by clicking the start button directly. Check the sound toggle, browser tab/site sound permissions and system volume. Use **↺ ПОВТОРИТИ** for the current line. A missing English speech voice does not prevent reading Ukrainian subtitles or playing the game. Sound-state/API checks are documented separately; audible quality should be rehearsed locally.

If WebGL is unavailable, the existing **ГРАФІКА · CPU** fallback activates automatically and the graphics toggle is disabled. It remains playable with simpler shading. For the main presentation, prefer a hardware-accelerated browser and confirm the laptop's graphics driver/browser settings beforehand.
