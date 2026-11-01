/** Lightweight projected guidance and procedural audio; no new 3D render passes. */
export function createInteractionPolish({ getAudio, getView, project, inspectArchive }) {
  const layer = document.createElement('div');
  layer.id = 'interaction-guides';
  document.body.append(layer);
  const anchors = [
    { key: 'dossier', point: [-0.25, 1.07, 2.55], label: '01 · ВІДКРИЙТЕ ДОСЬЄ' },
    { key: 'intercom', point: [-1.29, 1.58, 1.83], label: '02 · УВІМКНІТЬ ІНТЕРКОМ' },
    { key: 'listen', point: [1.54, 1.33, 2.22], label: '03 · КОНТАКТНИЙ МІКРОФОН' },
    { key: 'archive', point: [-4.6, 2.2, 0.4], label: 'КАМЕРА 01 · СИГНАЛ' },
    { key: 'archive', point: [4.6, 2.2, 0.4], label: 'КАМЕРА 02 · СИГНАЛ' },
  ].map(anchor => {
    const node = document.createElement(anchor.key === 'archive' ? 'button' : 'div');
    node.className = 'interaction-guide';
    node.textContent = anchor.label;
    node.hidden = true;
    if (anchor.key === 'archive') {
      node.type = 'button';
      node.setAttribute('aria-label', anchor.label + '. Прослухати обидві архівні камери');
      node.onclick = inspectArchive;
    } else node.setAttribute('aria-hidden', 'true');
    layer.append(node);
    return { ...anchor, node };
  });
  let previousGuide = null;
  const tools = ['dossier', 'intercom', 'listen'];
  const toolNodes = tools.map(key => document.getElementById(key + '-btn'));
  let nextGuideFrame = 0;
  function update(time) {
    const v = getView();
    let guide = null;
    if (v.started && !v.ending && !v.overlay && !v.currentLine && !v.listening) {
      if (v.activeCase === '017' && v.state === 'first') guide = v.docRead ? 'intercom' : 'dossier';
      if (v.state === 'microphoneTraining') guide = 'listen';
      if (v.state === 'archiveInspect' && v.archiveOpen && !v.archiveHeard) guide = 'archive';
    }
    if (guide !== previousGuide) {
      tools.forEach((key, index) => toolNodes[index].classList.toggle('guided-tool', key === guide || key === 'listen' && guide === 'archive'));
      previousGuide = guide;
      nextGuideFrame = 0;
    }
    // Project only active markers, at 20 Hz. Hide markers behind/outside camera.
    if (time < nextGuideFrame) return;
    nextGuideFrame = time + 0.05;
    for (const anchor of anchors) {
      const active = anchor.key === guide;
      if (!active) { anchor.node.hidden = true; continue; }
      const p = project(anchor.point);
      const visible = p.z > -1 && p.z < 1 && (anchor.key === 'archive' || Math.abs(p.x) < 0.9) && Math.abs(p.y) < 0.84;
      anchor.node.hidden = !visible;
      if (visible) {
        const x = anchor.key === 'archive' ? Math.max(-0.76, Math.min(0.76, p.x)) : p.x;
        anchor.node.textContent = anchor.label + (anchor.key === 'archive' && Math.abs(p.x) > 0.9 ? (p.x < 0 ? ' ←' : ' →') : '');
        anchor.node.style.left = `${(x + 1) * 50}%`;
        anchor.node.style.top = `${(1 - p.y) * 50}%`;
      }
    }
  }
  function humTo(value, duration) {
    const { audio, humGain } = getAudio();
    if (!audio || !humGain) return;
    const gain = humGain.gain;
    gain.cancelScheduledValues(audio.currentTime);
    gain.setValueAtTime(gain.value, audio.currentTime);
    gain.linearRampToValueAtTime(value, audio.currentTime + duration);
  }
  function note(frequency, duration, volume, delay = 0, type = 'sine', endFrequency = frequency, pan = 0) {
    const { audio, master } = getAudio();
    if (!audio || !master) return;
    const start = audio.currentTime + delay;
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    osc.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + Math.min(0.06, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    const panner = audio.createStereoPanner?.();
    if (panner) { panner.pan.value = pan; gain.connect(panner); panner.connect(master); }
    else gain.connect(master);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); panner?.disconnect(); };
    osc.start(start); osc.stop(start + duration);
  }
  return {
    update,
    restoreHum: () => humTo(0.025, 1.2),
    calibrationSound() { note(125, 1.5, 0.035); note(1450, 0.75, 0.007, 0.7); },
    noseHonk() { note(440, 0.15, 0.045, 0, 'triangle', 620); note(330, 0.14, 0.025, 0.09, 'sine', 220); },
    archiveSound() {
      // A breath of silence, then two slow shutter motors from opposite sides.
      humTo(0.002, 0.25);
      note(95, 1.8, 0.055, 0.8, 'triangle', 48, -0.75);
      note(110, 1.8, 0.045, 1, 'triangle', 55, 0.75);
      note(640, 0.16, 0.025, 0.82, 'sine', 210, -0.6);
      note(610, 0.16, 0.022, 1.02, 'sine', 200, 0.6);
    },
    releaseSound() {
      // No breakage: the room settles as the conversation is finally completed.
      humTo(0, 3.5);
      note(330, 3.6, 0.018); note(495, 2.8, 0.009, 0.5);
    },
    resetSound() {
      humTo(0, 0.05);
      note(720, 0.24, 0.045, 0, 'triangle', 65);
      // Return of the exact initial electrical hum suggests the next loop.
      const { audio, humGain } = getAudio();
      if (audio && humGain) {
        humGain.gain.setValueAtTime(0, audio.currentTime + 0.8);
        humGain.gain.linearRampToValueAtTime(0.025, audio.currentTime + 1.5);
      }
      note(520, 0.3, 0.035, 1.1);
    },
  };
}
