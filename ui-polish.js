/**
 * Presentation-only layer. Observes existing overlays; never advances dialogue,
 * changes story state, or replaces any game button/keyboard handler.
 */
const byId = (id) => document.getElementById(id);
const layers = ['intro', 'ending', 'document', 'evidence'].map(byId);
const background = [document.querySelector('header'), byId('hud'), byId('world')];
const focusTargets = {
  intro: byId('start'),
  document: byId('close-doc'),
  evidence: byId('close-evidence'),
  ending: byId('restart'),
};
let activeLayer = null;
let returnFocus = null;

function syncLayers() {
  const nextLayer = layers.filter((layer) => !layer.hidden).at(-1) || null;
  if (nextLayer === activeLayer) return;

  if (!activeLayer && nextLayer) returnFocus = document.activeElement;
  activeLayer = nextLayer;
  for (const element of background) element.inert = !!activeLayer;
  for (const layer of layers) layer.inert = layer.hidden || (!!activeLayer && layer !== activeLayer);

  if (activeLayer) {
    focusTargets[activeLayer.id].focus({ preventScroll: true });
  } else {
    const target = returnFocus?.isConnected && !returnFocus.closest('[hidden]')
      ? returnFocus : byId('world');
    (target === document.body ? byId('world') : target).focus({ preventScroll: true });
    returnFocus = null;
  }
}

const observer = new MutationObserver(syncLayers);
for (const layer of layers) observer.observe(layer, { attributes: true, attributeFilter: ['hidden'] });
syncLayers();

// Keep Tab inside a visible overlay; Escape/backdrop clicks retain game.js behavior.
document.addEventListener('keydown', (event) => {
  // The developer service panel is a separate, later dialog with its own
  // focus trap; do not drag focus back into the opening overlay.
  if (!byId('developer-menu')?.hidden) return;
  if (event.key !== 'Tab' || !activeLayer) return;
  const focusable = [...activeLayer.querySelectorAll('button, a[href], [tabindex="0"]')]
    .filter((element) => !element.disabled && element.getClientRects().length);
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && (document.activeElement === first || !activeLayer.contains(document.activeElement))) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !activeLayer.contains(document.activeElement))) {
    event.preventDefault();
    first?.focus();
  }
});
