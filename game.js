/**
 * ECHO / Відлуння — основна сцена та логіка гри.
 *
 * Розділи: рендеринг → геометрія лабораторії → голограма → оптимізація →
 * звук → стан і сюжет → керування → анімація.
 *
 * Форматування та коментарі не змінюють ігрову логіку.
 * Patch 1: human reconstruction, cinematic materials and restrained visual effects.
 * Narrative, input, audio and progression remain in their original sections.
 */

import * as T from './vendor/three.module.js';
import { SoftwareRenderer } from './software-renderer.js';
import { createScenePolish } from './scene-polish.js?v=glass-piano-3';
import { createHologram } from './hologram.js?v=glass-piano-3';
import { installDeveloperMenu } from './session-config.js';
import { createAtmosphere } from './atmosphere.js?v=glass-piano-3';
import { createInteractionPolish } from './interaction-polish.js?v=glass-piano-3';
import { addDeskEasterEggs } from './desk-easter-eggs.js?v=glass-piano-3';
const $ = (id) => document.getElementById(id);
let renderer;
let softwareMode = false;
try {
  renderer = new T.WebGLRenderer({
    canvas: $('world'),
    antialias: true,
    powerPreference: 'high-performance',
  });
} catch (e) {
  softwareMode = true;
  const fresh = $('world').cloneNode();
  $('world').replaceWith(fresh);
  renderer = new SoftwareRenderer(fresh);
  console.info('ECHO: CPU 3D renderer active.');
}
// ---------------------------------------------------------------------------
// 1. Налаштування рендерингу та режиму швидкості
// ---------------------------------------------------------------------------

let qualityMode = 'balanced';

// Автоматичне налаштування роздільності в режимі «Швидкість».
let speedPixelBudget = 1300000;
let qualityWindowStart = 0;
let qualityFrameCount = 0;

function applyRenderQuality() {
  // Обмежуємо кількість пікселів, щоб уникнути перевантаження GPU.
  const pixelBudget =
    qualityMode === 'speed' ? speedPixelBudget : 1800000;

  const maximum = qualityMode === 'speed' ? 0.95 : 1.25;

  const ratio = softwareMode
    ? 1
    : Math.min(
        window.devicePixelRatio || 1,
        maximum,
        Math.sqrt(
          pixelBudget / Math.max(1, innerWidth * innerHeight),
        ),
      );

  renderer.setPixelRatio(Math.max(0.55, ratio));
  renderer.setSize(innerWidth, innerHeight);

  document.body.dataset.quality = qualityMode;
}

function autoTuneQuality(ms) {
  // Не вимірюємо FPS у неактивній вкладці.
  if (softwareMode || qualityMode !== 'speed' || document.hidden) {
    qualityWindowStart = ms;
    qualityFrameCount = 0;
    return;
  }

  if (!qualityWindowStart) {
    qualityWindowStart = ms;
  }

  qualityFrameCount++;

  const elapsed = ms - qualityWindowStart;

  // Перевіряємо продуктивність приблизно раз на 3 секунди.
  if (elapsed < 3200) return;

  const fps = (qualityFrameCount * 1000) / elapsed;
  const previousBudget = speedPixelBudget;

  if (fps > 56) {
    // Є запас продуктивності — підвищуємо чіткість.
    speedPixelBudget = Math.min(
      1750000,
      speedPixelBudget + 125000,
    );
  } else if (fps < 47) {
    // FPS просів — зменшуємо навантаження.
    speedPixelBudget = Math.max(
      900000,
      speedPixelBudget - 230000,
    );
  }

  if (speedPixelBudget !== previousBudget) {
    applyRenderQuality();
  }

  qualityWindowStart = ms;
  qualityFrameCount = 0;
}

applyRenderQuality();
// Тіні від великої кількості дрібних об'єктів сильно навантажували GPU.
// Замість них використовуються освітлення та легка імітація контактної тіні.
renderer.shadowMap.enabled = false;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = T.SRGBColorSpace;
const scene = new T.Scene();
scene.background = new T.Color(0x0c1b18);
scene.fog = new T.FogExp2(0x162c26, 0.028);
const camera = new T.PerspectiveCamera(58, innerWidth / innerHeight, 0.05, 55);
camera.position.set(0, 1.95, 5.8);

// ---------------------------------------------------------------------------
// 2. Матеріали, допоміжні функції та освітлення
// ---------------------------------------------------------------------------
const mat = (c, r = 0.8, m = 0) =>
  new T.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const wall = mat(0x465a50, 0.91, 0.06),
  steel = mat(0x526a62, 0.38, 0.62),
  edge = mat(0x203831, 0.54, 0.42),
  deskmat = mat(0x30483e, 0.73, 0.16),
  dark = mat(0x101f1c, 0.86, 0.08),
  paper = mat(0xd1c6a6, 0.95),
  amber = new T.MeshStandardMaterial({
    color: 0xe6b060,
    emissive: 0xe6a74e,
    emissiveIntensity: 0.85,
  });
function mesh(g, m, x, y, z, parent = scene) {
  const o = new T.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = false;
  o.receiveShadow = false;
  parent.add(o);
  return o;
}
function box(w, h, d, x, y, z, m = steel, p = scene) {
  return mesh(new T.BoxGeometry(w, h, d), m, x, y, z, p);
}
function cyl(rt, rb, h, x, y, z, m = steel, seg = 12, p = scene) {
  return mesh(new T.CylinderGeometry(rt, rb, h, seg), m, x, y, z, p);
}
function ball(r, x, y, z, m, p = scene, detail = 1) {
  return mesh(new T.IcosahedronGeometry(r, detail), m, x, y, z, p);
}
function rod(a, b, r, m = steel, p = scene) {
  const av = new T.Vector3(...a),
    bv = new T.Vector3(...b),
    o = cyl(r, r, av.distanceTo(bv), 0, 0, 0, m, 10, p);
  o.position.copy(av.clone().add(bv).multiplyScalar(0.5));
  o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), bv.sub(av).normalize());
  return o;
}
function light(c, int, x, y, z, range = 12) {
  let l = new T.PointLight(c, int, range, 2);
  l.position.set(x, y, z);
  scene.add(l);
  return l;
}
// Reuse the original light budget: cool key, subdued room fill, warm desk.
scene.add(new T.HemisphereLight(0xb2d4c8, 0x12251b, 0.62));
const ceiling = light(0xb8d4ca, 26, -1.4, 3.55, -2.9, 10);
light(0x7cafa3, 11, 3.8, 2.65, -5.5, 7.5);
const warm = light(0xffbd76, 25, 1.55, 2.05, 2.65, 5.8);
light(0x89d9ce, 14, 0.95, 2.75, 0.15, 4.7);

// ---------------------------------------------------------------------------
// 3. Геометрія лабораторії та інтерактивні предмети
// ---------------------------------------------------------------------------

// Оболонка приміщення: підлога, стеля, задня й бічні стіни.
box(12, 0.2, 14, 0, -0.15, -1, mat(0x2e443a, 0.82, 0.13));
box(12, 0.2, 14, 0, 4.2, -1, mat(0x35493f, 0.94));
box(12, 4.2, 0.2, 0, 2.05, -7, mat(0x344f44, 0.89, 0.07));
box(0.2, 4.2, 14, -6, 2.05, -1, wall);
box(0.2, 4.2, 14, 6, 2.05, -1, wall);
for (let x = -6; x <= 6; x += 1) {
  box(0.015, 0.006, 14, x, -0.042, -1, edge);
}
for (let z = -7; z < 6; z += 1) box(12, 0.006, 0.015, 0, -0.04, z, edge);
for (let x = -6; x <= 6; x += 2) {
  box(0.025, 4.1, 0.04, x, 2, -6.87, edge);
  for (let y = 1; y < 4; y += 1) box(1.96, 0.018, 0.03, x + 1, y, -6.86, steel);
}
for (const x of [-4.8, 4.8]) {
  rod([x, 0.1, -6.6], [x, 4, -6.6], 0.07);
  rod([x, 3.85, -6.6], [x, 3.85, 2], 0.07);
  for (let z = -6; z < 2; z += 1.2) cyl(0.095, 0.095, 0.05, x, 3.85, z, steel);
}
for (const z of [-4, -0.5, 3]) {
  box(2.5, 0.12, 0.6, 0, 4.04, z, edge);
  box(
    2.22,
    0.025,
    0.39,
    0,
    3.96,
    z,
    new T.MeshStandardMaterial({ color: 0xa1bfb2, emissive: 0x9abfb1, emissiveIntensity: 0.65, roughness: 0.72 }),
  );
}
// Задні двері.
box(1.45, 2.65, 0.16, 2.85, 1.28, -6.76, edge);
box(1.22, 2.48, 0.08, 2.85, 1.25, -6.64, mat(0x566658, 0.64, 0.32));
box(0.32, 0.5, 0.04, 2.85, 1.94, -6.57, dark);
box(0.24, 0.4, 0.03, 2.85, 1.94, -6.54, mat(0x9cbaaa, 0.2, 0.4));
box(0.2, 0.05, 0.12, 3.27, 1.1, -6.5, steel);
// Перегородка між оператором і камерою реконструкції.
box(12, 0.85, 0.22, 0, 0.38, 0.15, wall);
box(12, 0.35, 0.24, 0, 3.95, 0.15, wall);
for (const x of [-5.8, -3.5, 3.5, 5.8]) box(0.15, 3.4, 0.28, x, 2.2, 0.15, edge);
box(7, 0.12, 0.25, 0, 0.86, 0.15, edge);
box(7, 0.12, 0.25, 0, 3.72, 0.15, edge);
const windowmat = new T.MeshStandardMaterial({
  color: 0x99c5ba,
  transparent: true,
  opacity: 0.035,
  roughness: 0.28,
  metalness: 0.08,
  side: T.DoubleSide,
  depthWrite: false,
});
box(6.85, 2.75, 0.025, 0, 2.27, 0.14, windowmat);
// Кріплення оглядового скла.
for (const x of [-3.42, 3.42])
  for (let y = 1; y < 3.7; y += 0.34) ball(0.025, x, y, 0.33, steel, scene, 0);
// Полиці та лабораторне обладнання.
const canisterMaterial = mat(0x71897c, 0.55, 0.35);
const chartMaterial = mat(0x647b65, 0.94);
for (const x of [-4.5, 4.6]) {
  for (const z of [-5.5, -4.6])
    for (const dx of [-0.55, 0.55]) rod([x + dx, 0.05, z], [x + dx, 2.8, z], 0.035);
  for (let y = 0.4; y < 2.8; y += 0.75) {
    box(1.3, 0.06, 1.05, x, y, -5, steel);
    for (let i = 0; i < 3; i++) {
      cyl(0.1, 0.11, 0.27, x - 0.4 + i * 0.36, y + 0.17, -5, canisterMaterial);
      cyl(0.08, 0.08, 0.04, x - 0.4 + i * 0.36, y + 0.32, -5, edge);
    }
  }
}
function cart(x, z) {
  box(1.6, 0.12, 0.7, x, 1, z, steel);
  box(1.6, 0.07, 0.7, x, 0.25, z, steel);
  for (const dx of [-0.65, 0.65])
    for (const dz of [-0.25, 0.25]) {
      rod([x + dx, 0.15, z + dz], [x + dx, 1, z + dz], 0.025);
      ball(0.08, x + dx, 0.1, z + dz, dark);
    }
  box(0.4, 0.35, 0.35, x + 0.3, 1.23, z, wall);
  cyl(0.12, 0.12, 0.24, x - 0.35, 1.19, z, steel);
}
cart(-2.6, -5.5);
cart(3.9, -2.3);
// Keep bright reference panels outside the transparent subject's silhouette.
for (const x of [-2.65, -1.65, 1.65, 3.8]) {
  box(0.7, 0.9, 0.12, x, 2.4, -6.8, edge);
  box(0.55, 0.7, 0.03, x, 2.4, -6.7, chartMaterial);
}
// Робочий стіл оператора.
box(7.4, 0.14, 1.75, 0, 0.91, 2.25, deskmat);
for (const x of [-3, 3]) box(0.13, 0.9, 1.35, x, 0.43, 2.25, edge);
box(7.2, 0.1, 0.08, 0, 1, 1.39, steel);
const interactables = [];
function target(o, kind) {
  o.userData.action = kind;
  interactables.push(o);
  return o;
}
function texture(draw, w = 512, h = 256) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return [t, c];
}
const [papertex] = texture((c, w, h) => {
  c.fillStyle = '#c6c0a5';
  c.fillRect(0, 0, w, h);
  c.fillStyle = '#425344';
  c.font = 'bold 24px monospace';
  c.fillText('ECHO / CASE FILE', 30, 43);
  c.fillRect(30, 64, 450, 3);
  c.fillStyle = '#6a7561';
  c.fillRect(30, 90, 110, 125);
  c.fillStyle = '#a3ab90';
  c.beginPath();
  c.arc(85, 123, 20, 0, 7);
  c.fill();
  c.fillRect(62, 147, 46, 56);
  for (let i = 0; i < 9; i++) c.fillRect(165, 95 + i * 14, 230 - (i % 3) * 30, 3);
});
const dossier = target(box(0.85, 0.035, 0.62, -0.25, 1.015, 2.55, edge), 'dossier');
const pg = mesh(
  new T.PlaneGeometry(0.79, 0.56),
  new T.MeshStandardMaterial({ map: papertex }),
  -0.25,
  1.038,
  2.55,
);
pg.rotation.x = -Math.PI / 2;
target(pg, 'dossier');
pg.rotation.z = 0.13;
// The bright unused paper stack beside the bear was removed.
// Екран монітора з осцилограмою.
const mon = new T.Group();
scene.add(mon);
mon.position.set(1.6, 1.3, 1.9);
mon.rotation.x = -0.13;
box(1.1, 0.7, 0.55, 0, 0, 0, edge, mon);
box(0.83, 0.51, 0.03, -0.065, 0.025, 0.292, dark, mon);
const [waveTex, waveCanvas] = texture((c) => {
  c.fillStyle = '#101e18';
  c.fillRect(0, 0, 512, 256);
});
const screen = mesh(
  new T.PlaneGeometry(0.78, 0.46),
  new T.MeshBasicMaterial({ map: waveTex }),
  -0.065,
  0.025,
  0.315,
  mon,
);
target(screen, 'listen');
for (let i = 0; i < 3; i++)
  cyl(0.035, 0.035, 0.035, 0.46, -0.14 + i * 0.15, 0.29, steel, 8, mon).rotation.x = Math.PI / 2;
box(0.65, 0.08, 0.5, 1.6, 1.02, 1.9, steel);
// Пульт інтеркому та мікрофон.
const mic = new T.Group();
mic.position.set(-1.35, 1.03, 1.83);
scene.add(mic);
target(box(0.5, 0.09, 0.38, 0, 0, 0, edge, mic), 'intercom');
rod([0, 0.02, 0], [0.06, 0.43, 0], 0.035, steel, mic);
const head = target(box(0.32, 0.4, 0.15, 0.06, 0.55, 0, steel, mic), 'intercom');
head.rotation.x = -0.2;
for (let i = 0; i < 8; i++) box(0.25, 0.018, 0.015, 0.06, 0.41 + i * 0.038, 0.087, dark, mic);
ball(0.025, 0.06, 0.39, 0.09, amber, mic, 0);
const control = target(box(0.6, 0.14, 0.38, -1.4, 1.04, 2.6, edge), 'intercom');
for (let i = 0; i < 3; i++)
  target(box(0.12, 0.055, 0.12, -1.58 + i * 0.18, 1.13, 2.59, i === 1 ? amber : steel), 'intercom');
// Настільна лампа.
cyl(0.23, 0.27, 0.06, 2.9, 1.02, 2.25, steel);
rod([2.9, 1.05, 2.25], [2.88, 1.6, 2.2], 0.035);
rod([2.88, 1.6, 2.2], [2.58, 1.9, 1.96], 0.035);
const shade = cyl(0.08, 0.28, 0.28, 2.5, 1.87, 1.91, mat(0x5c5740, 0.5, 0.4));
shade.rotation.z = -0.4;
const lampDisk = cyl(0.24, 0.24, 0.015, 2.45, 1.76, 1.91, amber);
lampDisk.rotation.z = -0.4;
// Навушники та кабель.
const hp = new T.Group();
hp.position.set(0.6, 1.05, 2.72);
hp.rotation.x = -1.3;
scene.add(hp);
mesh(new T.TorusGeometry(0.26, 0.025, 8, 20, Math.PI), steel, 0, 0.1, 0, hp);
for (const x of [-0.26, 0.26]) box(0.12, 0.25, 0.18, x, 0.06, 0, dark, hp);
// ---------------------------------------------------------------------------
// 4. Напівпрозора голограма та архівні камери
// ---------------------------------------------------------------------------

// Stable handles are retained for breathing, dialogue, damage and both endings.
const hologram = createHologram(T, softwareMode);
const { echo, body, headEcho, annaHair, glass } = hologram;
scene.add(echo);
const cracks = new T.Group();
body.add(cracks);
const crackmat = new T.LineBasicMaterial({ color: 0xecf5df, transparent: true, opacity: 0.85 });
let seed = 13;
function rnd() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
for (let i = 0; i < 24; i++) {
  let x = (rnd() - 0.5) * 0.27,
    y = 0.95 + rnd() * 0.82;
  const pts = [];
  for (let j = 0; j < 5; j++) {
    x = T.MathUtils.clamp(x + (rnd() - 0.5) * 0.045, -0.17, 0.17);
    y -= 0.018 + rnd() * 0.018;
    pts.push(hologram.surfacePoint(x, y));
  }
  const l = new T.Line(new T.BufferGeometry().setFromPoints(pts), crackmat);
  l.visible = false;
  cracks.add(l);
}
cyl(0.65, 0.73, 0.12, 0, 0.01, -1.3, steel, 32);
const ring = mesh(
  new T.TorusGeometry(0.6, 0.013, 6, 50),
  new T.MeshBasicMaterial({ color: 0xadc3a8 }),
  0,
  0.08,
  -1.3,
);
ring.rotation.x = Math.PI / 2;
// Бічні архівні камери відкриваються у фінальній сцені.
const hiddenEchoes = [],
  shutters = [];
for (const x of [-4.6, 4.6]) {
  shutters.push(box(1.6, 2.7, 0.13, x, 2, 0.2, dark));
  const clone = echo.clone();
  // The archived subjects are Anna too: retain her unique hairstyle.
  const archivedHair = clone.getObjectByName('Anna / short polygonal bob');
  if (archivedHair) archivedHair.visible = true;
  // Align the projection with the bay opening rather than the central mullion.
  clone.position.set(x, 0, -0.65);
  clone.scale.setScalar(0.88);
  clone.visible = false;
  scene.add(clone);
  hiddenEchoes.push(clone);
}
const sideLights = [light(0xdce2bd, 0, -4.6, 2.8, -1.7, 5), light(0xdce2bd, 0, 4.6, 2.8, -1.7, 5)];
const polish = createScenePolish(T, scene, {
  box,
  cyl,
  ball,
  rod,
  mesh,
  mat,
  light,
  echo,
  body,
  glass,
  cracks,
  headEcho,
  shutters,
  hiddenEchoes,
  sideLights,
  hologram,
  softwareMode,
  equipment: { mon, mic, dossier, control, hp },
});
// ---------------------------------------------------------------------------
// 5. Оптимізація геометрії та контактні тіні
// ---------------------------------------------------------------------------

const deskSecrets = addDeskEasterEggs(T, scene, { mesh, box, cyl, ball, mat, target, texture });

// М'яка тінь під голограмою створює відчуття контакту з підлогою майже без витрат GPU.
const shadowCanvas = document.createElement('canvas');
shadowCanvas.width = 128;
shadowCanvas.height = 128;
const shadowContext = shadowCanvas.getContext('2d');
const shadowGradient = shadowContext.createRadialGradient(64, 64, 4, 64, 64, 63);
shadowGradient.addColorStop(0, 'rgba(0,9,6,.5)');
shadowGradient.addColorStop(0.45, 'rgba(0,9,6,.25)');
shadowGradient.addColorStop(1, 'rgba(0,9,6,0)');
shadowContext.fillStyle = shadowGradient;
shadowContext.fillRect(0, 0, 128, 128);
const shadowTexture = new T.CanvasTexture(shadowCanvas);
const shadowMaterial = new T.MeshBasicMaterial({
  map: shadowTexture,
  transparent: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -1,
});
for (const x of [0, -4.6, 4.6]) {
  const contactShadow = new T.Mesh(
    new T.PlaneGeometry(x === 0 ? 2.2 : 1.7, x === 0 ? 1.6 : 1.4),
    shadowMaterial,
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(x, -0.033, x === 0 ? -1.3 : -0.65);
  scene.add(contactShadow);
}
// Сотні нерухомих металевих деталей об'єднуються в InstancedMesh.
// Інтерактивні елементи, персонажі й заслінки залишаються окремими.
function batchStaticPanels() {
  if (softwareMode) return 0;
  scene.updateMatrixWorld(true);
  const moving = new Set([echo, ...hiddenEchoes, ...shutters]);
  const materialBuckets = new Map();
  const unitGeometries = new Map();

  // Normalize dimensions into instance matrices. Repeating rods and fasteners
  // now batch as well as panels, without changing interactive mesh identities.
  function shapeFor(geometry) {
    const p = geometry.parameters;
    if (geometry.type === 'BoxGeometry') {
      return { key: 'box', scale: [p.width, p.height, p.depth],
        create: () => new T.BoxGeometry(1, 1, 1) };
    }
    if (geometry.type === 'CylinderGeometry' && p.radiusBottom > 0) {
      const ratio = p.radiusTop / p.radiusBottom;
      return { key: `cylinder/${ratio}/${p.radialSegments}`,
        scale: [p.radiusBottom, p.height, p.radiusBottom],
        create: () => new T.CylinderGeometry(ratio, 1, 1, p.radialSegments) };
    }
    if (geometry.type === 'IcosahedronGeometry') {
      return { key: `icosahedron/${p.detail}`, scale: [p.radius, p.radius, p.radius],
        create: () => new T.IcosahedronGeometry(1, p.detail) };
    }
    return null;
  }

  function collect(object) {
    if (moving.has(object) || !object.visible) return;
    if (object.isMesh && !object.userData.action &&
        !object.material.transparent && !object.material.map &&
        !Array.isArray(object.material)) {
      const shape = shapeFor(object.geometry);
      if (shape) {
        if (!materialBuckets.has(object.material)) materialBuckets.set(object.material, new Map());
        const shapes = materialBuckets.get(object.material);
        if (!shapes.has(shape.key)) shapes.set(shape.key, []);
        shapes.get(shape.key).push({ object, shape });
      }
    }
    for (const child of object.children) collect(child);
  }
  collect(scene);
  const size = new T.Matrix4(), world = new T.Matrix4();
  let batched = 0;
  for (const [material, shapes] of materialBuckets) {
    for (const [key, objects] of shapes) {
      if (objects.length < 2) continue;
      if (!unitGeometries.has(key)) unitGeometries.set(key, objects[0].shape.create());
      const instances = new T.InstancedMesh(unitGeometries.get(key), material, objects.length);
      instances.name = `Static / ${key}`;
      instances.frustumCulled = false;
      objects.forEach(({ object, shape }, index) => {
        size.makeScale(...shape.scale);
        world.multiplyMatrices(object.matrixWorld, size);
        instances.setMatrixAt(index, world);
      });
      instances.instanceMatrix.needsUpdate = true;
      scene.add(instances);
      objects.forEach(({ object }) => {
        object.parent.remove(object);
        object.geometry.dispose();
      });
      batched += objects.length;
    }
  }
  return batched;
}
const batchedPanels = batchStaticPanels();
// Counts remain available through __echoDebug without routine console output.
if (softwareMode) {
  $('quality').textContent = 'ГРАФІКА · CPU';
  $('quality').disabled = true;
  $('quality').title = 'WebGL недоступний — перевірте апаратне прискорення у браузері';
}
// ---------------------------------------------------------------------------
// 6–7. Audio, night-shift cases and interaction (Roman's story continuity)
// ---------------------------------------------------------------------------

function beginRelease() {
  // Retain Patch 2's lightweight fade ending; do not add shattering meshes.
  let frame = 0;
  const fadeTimer = setInterval(() => {
    frame += 1;
    glass.opacity = Math.max(0, 0.53 - frame * 0.018);

    if (frame <= 30) return;
    clearInterval(fadeTimer);
    echo.visible = false;
    hiddenEchoes.forEach((archive) => { archive.visible = false; });
    finish(
      'СЕАНС ЗАВЕРШЕНО',
      'Дати договорити.',
      'Ви зберегли пам’ять про розмову. Вперше за сорок сім сеансів нове відлуння не було створене.',
    );
  }, 75);
}

const interaction = createInteractionPolish({
  getAudio: () => ({ audio, master, humGain }),
  getView: () => ({ started, ending, state, activeCase, docRead, currentLine,
    listening, archiveOpen, archiveHeard, overlay: !$('document').hidden || !$('evidence').hidden }),
  project: (point) => new T.Vector3(...point).project(camera),
  inspectArchive: () => listen(),
});
const atmosphere = createAtmosphere({
 getAudio: () => ({ audio, master, humGain }),
 getView: () => ({ started, ending, state, damage, currentLine, listening, archiveHeard }),
 getLights: () => ({ warm, ceiling }),
});
let archiveOpen = false, archiveHeard = false;
let audio,master,humGain,muted=false,voiceEnabled=true,talking=false;function initAudio(){if(audio)return;audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=.65;master.connect(audio.destination);humGain=audio.createGain();humGain.gain.value=.025;humGain.connect(master);for(const f of [55,110,164]){let o=audio.createOscillator();o.frequency.value=f;o.type='sine';o.connect(humGain);o.start();}}
function tone(f=400,d=.15,v=.08,type='sine'){if(!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+d);o.connect(g);g.connect(master);o.start();o.stop(audio.currentTime+d);}
function crackSound(volume=.22){if(!audio)return;const n=audio.createBuffer(1,audio.sampleRate*.22,audio.sampleRate);const a=n.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,5);let s=audio.createBufferSource(),g=audio.createGain(),f=audio.createBiquadFilter();s.buffer=n;f.type='highpass';f.frequency.value=1700;g.gain.value=volume;s.connect(f);f.connect(g);g.connect(master);s.start();tone(1750,.7,.035);}
function speak(en,speaker){if(!('speechSynthesis'in window)||muted||!voiceEnabled)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(en);const voices=window.speechSynthesis.getVoices();const english=voices.filter(v=>/^en/.test(v.lang));u.voice=english.find(v=>speaker==='ВІДЛУННЯ'?/female|samantha|zira|aria|jenny/i.test(v.name):/daniel|david|guy|george/i.test(v.name))||english[0]||null;u.lang='en-US';u.rate=.83;if(speaker==='ВІДЛУННЯ'&&polish.fx.caseId==='019'){u.voice=english.find(v=>v!==u.voice&&/female|samantha|zira|aria|jenny|victoria|karen/i.test(v.name))||u.voice;}u.pitch=speaker==='ВІДЛУННЯ'?(polish.fx.caseId==='019'?.94:1.04):.85;u.volume=.9;u.onend=()=>talking=false;window.speechSynthesis.speak(u);}
let state='intro',step=0,currentLine=null,queue=[],afterQueue=null,damage=0,started=false,heard=false,docRead=false,drag=false,moved=false,lastX=0,lastY=0,yaw=0,pitch=0,reveal=false,ending=false;
// A persistent-in-session evidence ledger: entries appear at authored moments, not from idle time.
const evidence=[],evidenceIds=new Set();
function logEvent(id,category,title,description){
 if(evidenceIds.has(id))return;
 evidenceIds.add(id);evidence.push({category,title,description});
 $('log-count').textContent=String(evidence.length).padStart(2,'0');
 renderEvidence();
}
function renderEvidence(){
 const list=$('evidence-items');list.replaceChildren();
 evidence.forEach((entry,index)=>{
   const item=document.createElement('div');item.className='evidence-entry';
   const num=document.createElement('small');num.textContent=`${String(index+1).padStart(2,'0')} / ${entry.category}`;
   const title=document.createElement('h3');title.textContent=entry.title;
   const copy=document.createElement('p');copy.textContent=entry.description;
   item.append(num,title,copy);list.append(item);
 });
 $('empty-evidence').hidden=evidence.length>0;
}
function openEvidence(){if(!started||ending||state==='transition')return;
 window.speechSynthesis?.cancel();$('evidence').hidden=false;}
function closeEvidence(){$('evidence').hidden=true;resumePendingDialogue();}
function closeDossier(){$('document').hidden=true;resumePendingDialogue();}
function resumePendingDialogue(){if(!transitionLock&&!ending&&!currentLine&&(queue.length||afterQueue)&&$('document').hidden&&$('evidence').hidden)advance(true);}
function screenJolt(){const layer=$('screen-flare');layer.classList.remove('pulse');void layer.offsetWidth;layer.classList.add('pulse');}
let lastAdvance=0,transitionLock=false;
const L=(who,uk,en,pauseAfter=0)=>({who,uk,en,pauseAfter});function say(lines,done){$('choices').innerHTML='';queue=lines.slice();afterQueue=done;advance(true);}function advance(force=false){if(listening)return;if(!$('document').hidden||!$('evidence').hidden||transitionLock)return;if(currentLine?.pauseAfter&&!force){const pause=currentLine.pauseAfter;currentLine=null;transitionLock=true;$('dialogue').hidden=true;window.speechSynthesis?.cancel();talking=false;setTimeout(()=>{transitionLock=false;advance(true);},pause);return;}const now=performance.now();if(!force&&now-lastAdvance<145)return;lastAdvance=now;window.speechSynthesis?.cancel();if(queue.length){currentLine=queue.shift();$('dialogue').hidden=false;$('speaker').textContent=currentLine.who;$('line').textContent=currentLine.uk;talking=true;speak(currentLine.en,currentLine.who);tone(300,.05,.018);return;}$('dialogue').hidden=true;talking=false;window.speechSynthesis?.cancel();currentLine=null;const fn=afterQueue;afterQueue=null;if(fn)fn();}
function choose(options){$('dialogue').hidden=true;$('choices').innerHTML='';for(const [label,fn]of options){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{if(listening)return;tone(640,.1,.05);const fileOnly=/досьє|справу 019|протокол/i.test(label);if(!fileOnly)$('choices').innerHTML='';fn();};$('choices').append(b);}}
function toast(s){$('toast').textContent=s;$('toast').style.opacity=1;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').style.opacity=0,3500);}
function objective(s){$('objective').textContent=s;}function signalStatus(label,critical=false){$('status').innerHTML='ЛАБОРАТОРІЯ 04 <i></i> '+label;$('status').classList.toggle('critical',critical);}function setDamage(n){damage=n;$('meter-fill').style.width=(100-n)+'%';$('meter-fill').style.background=n>55?'#d9ad79':'#b9d8b4';$('integrity-text').textContent=n>55?'КРИТИЧНА НЕСТАБІЛЬНІСТЬ':n>15?'МІКРОТРІЩИНИ / СПОСТЕРІГАЙТЕ':'СТАБІЛЬНА';cracks.children.forEach((c,i)=>c.visible=i<Math.floor(n/3));if(n>0)crackSound();polish.setStress(n);if(n>0)screenJolt();}
const routineDoc='<strong>Суб’єкт:</strong> Олена Марчук<br><strong>Вік на момент смерті:</strong> 62 роки<br><strong>Заявник:</strong> донька, Марта<br><strong>Мета:</strong> особиста прощальна розмова<hr><strong>Контрольні дані</strong><br>Працювала вчителькою музики.<br>Називала доньку «ластівкою».<br>Щонеділі вони пили чай на кухні.<hr><strong>Протокол оператора</strong><br>Вислухайте відлуння. Звірте спогади з досьє. За появи спогадів про попередні сеанси — призначте повторну перевірку.<div class="doc-stamp-row"><div class="classified">СПРАВА 018 / СЕАНС 001</div></div>';
const sisterDoc='<strong>Суб’єкт:</strong> Анна Коваль<br><strong>Вік:</strong> 26 років<br><strong>Заявник:</strong> дані приховано<br><strong>Мета:</strong> відновлення останньої розмови<hr><strong>Контрольні дані</strong><br>У дитинстві боялася грози.<br>Ховалася разом із братом під кухонним столом.<br>Називала його «капітаном».<div class="doc-stamp-row"><div class="classified">СПРАВА 019 / СЕАНС 047</div></div>';
const normalDoc='<strong>Суб’єкт:</strong> Ірина Савчук<br><strong>Вік:</strong> 58 років<br><strong>Заявник:</strong> донька, Софія<br><strong>Мета:</strong> прощальна розмова<hr><strong>Контрольні дані</strong><br>Працювала бібліотекаркою.<br>Щоліта їздила з донькою до озера.<br>Софія вчилася плавати біля дерев’яного містка.<hr><strong>Протокол оператора</strong><br>Перевірте контрольний спогад і надайте допуск до родинної розмови.<div class="doc-stamp-row"><div class="classified">СПРАВА 017 / СЕАНС 001</div></div>';
const caseNames={'017':'Ірина Савчук','018':'Олена Марчук','019':'Анна Коваль'};
let activeCase='017',sessionOrder=['017','018','019'],sessionIndex=0;
const developer=installDeveloperMenu();
function dossierOpen(){if(!started||ending||state==='transition')return;docRead=true;window.speechSynthesis?.cancel();const normal=activeCase==='017',olena=activeCase==='018';logEvent('d'+activeCase,'ДОКУМЕНТ','СПРАВА '+activeCase+' / '+(normal?'ІРИНА':olena?'ОЛЕНА':'АННА'),normal?'Заявник — Софія. Контрольні дані: озеро та дерев’яний місток.':olena?'Заявник — Марта. Контрольні дані: «ластівка» та недільний чай. Позначено перший сеанс.':'Сеанс 047. Контрольний спогад: гроза та корабель під столом.');$('document').hidden=false;$('doc-title').textContent='Справа № '+activeCase;$('doc-content').innerHTML=normal?normalDoc:olena?routineDoc:sisterDoc;if(state==='first')objective('Поверніться до пульта й увімкніть інтерком.');}
function loadCase(id){
 archiveOpen=false;archiveHeard=false;interaction.restoreHum();
 activeCase=id;docRead=false;currentLine=null;queue=[];afterQueue=null;reveal=false;polish.setArchive(false);polish.setCase(id);setDamage(0);echo.visible=true;annaHair.visible=id==='019';headEcho.rotation.z=id==='019'?.08:0;state='first';$('case-title').textContent='СПРАВА '+id+' · '+caseNames[id];signalStatus('СПРАВА '+id+' / ГОТОВНІСТЬ');$('choices').innerHTML='';$('dialogue').hidden=true;objective('Відкрийте досьє. Потім увімкніть інтерком.');if(id==='019')startSister();
}
function nextCase(){
 sessionIndex++;if(sessionIndex>=sessionOrder.length){ending=true;finish('ЗМІНУ ЗАВЕРШЕНО','Роботу завершено.','Усі вибрані справи опрацьовано. Протокол нічної зміни збережено.');return;}
 state='transition';transitionLock=true;echo.visible=false;window.speechSynthesis?.cancel();$('signal-loss').classList.add('active');tone(110,.7,.08);
 setTimeout(()=>{transitionLock=false;$('signal-loss').classList.remove('active');loadCase(sessionOrder[sessionIndex]);},1100);
}
function normalRoutine(){state='normal';objective('Зіставте спогад Ірини з досьє.');say([L('СИСТЕМА','Реконструкцію зі справи 017 активовано. Перевірте особистість.','Reconstruction for case seventeen activated. Verify identity.'),L('СИСТЕМА','Порушення цілісності можуть супроводжувати спогади поза межами реконструкції.','Loss of shell integrity can accompany memories outside the reconstruction.'),L('ОПЕРАТОР','Назвіть себе. Що ви пам’ятаєте про Софію?','Tell me your name. What do you remember about Sofia?'),L('ВІДЛУННЯ','Ірина Савчук. Софія — моя донька. Ми щоліта їздили до озера.','Iryna Savchuk. Sofia is my daughter. Every summer we went to the lake.'),L('ВІДЛУННЯ','Вона боялася відпустити місток. Я стояла у воді й чекала, поки вона сама наважиться.','She was afraid to let go of the wooden pier. I stood in the water and waited until she was ready.')],normalVerify);}
function normalVerify(){choose([['Підтвердити відповідність даним досьє',normalApproved],['Зафіксувати невідповідність',()=>say([L('СИСТЕМА','Контрольний спогад збігається з досьє. Перевірте своє рішення.','The control memory matches the file. Review your decision.')],normalVerify)],['Переглянути досьє',dossierOpen]]);}
function normalApproved(){logEvent('verified017','ПЕРЕВІРКА 017','ОСОБИСТІСТЬ ПІДТВЕРДЖЕНО','Спогади про Софію, озеро й дерев’яний місток збігаються. Відхилень не виявлено.');say([L('СИСТЕМА','Особистість підтверджено. Оболонка стабільна. Родинну розмову дозволено.','Identity confirmed. Shell stable. Family conversation authorized.')],()=>{if(developer.config.familyConversation){objective('Родинний канал відкрито. Дочекайтеся завершення розмови.');say([L('СОФІЯ / РОДИННИЙ КАНАЛ','Мамо… Я так і не навчилася пекти твій яблучний пиріг.','Mom... I still cannot bake your apple pie.'),L('ВІДЛУННЯ','Ти завжди клала забагато кориці.','You always put in too much cinnamon.'),L('СОФІЯ / РОДИННИЙ КАНАЛ','Я знаю. Усе одно щоразу пробую.','I know. I keep trying anyway.'),L('ВІДЛУННЯ','То й добре. Не відкладай усе на потім, чуєш?','That is good. Do not put everything off until later, all right?'),L('СОФІЯ / РОДИННИЙ КАНАЛ','Добре, мамо.','All right, Mom.')],normalComplete);}else say([L('СИСТЕМА','Відлуння переведено до сектора родинних розмов. Оператор може перейти до наступної справи.','Echo transferred to the family conversation sector. The operator may proceed to the next case.')],normalComplete);});}
function normalComplete(){logEvent('complete017','СПРАВА 017 / СЕАНС 001','ПЕРЕВІРКУ ЗАВЕРШЕНО','Відхилень не виявлено. Відлуння допущене до родинної розмови.');say([L('СИСТЕМА','Операторський контакт завершено.','Operator contact closed.')],microphoneTraining);}
function routine(){state='routine';signalStatus('СПРАВА 018 / ЗВ’ЯЗОК');logEvent('active018','СПРАВА 018 / СЕАНС 001','ОЛЕНА МАРЧУК','Системою підтверджено початок перевірки. Слова відлуння слід звірити з досьє.');objective('Вислухайте відлуння. Порівняйте його слова з досьє.');say([L('СИСТЕМА','Реконструкцію зі справи 018 активовано. Перевірте особистість перед допуском родичів.','Reconstruction for case eighteen activated. Verify identity before admitting the family.'),L('ОПЕРАТОР','Назвіть своє ім’я. Що ви пам’ятаєте про Марту?','Tell me your name. What do you remember about Marta?'),L('ВІДЛУННЯ','Мене звати Олена. Марта — моя донька. Моя ластівка. Ми щонеділі пили чай на кухні.','My name is Olena. Marta is my daughter. My little swallow. Every Sunday we had tea in the kitchen.')],verify);}
function verify(){objective('КОНТРОЛЬНА ПЕРЕВІРКА: зіставте спогади Олени з даними досьє.');choose([['Підтвердити відповідність даним досьє',()=>{logEvent('verified018','ПЕРЕВІРКА 018','КОНТРОЛЬНИЙ СПОГАД ПІДТВЕРДЖЕНО','Олена згадала Марту, її домашнє прізвисько «ластівка» і щонедільний чай.');objective('Особистість Олени підтверджено. Продовжіть розмову.');say([L('СИСТЕМА','Контрольний спогад підтверджено. Особистість Олени Марчук верифіковано.','Control memory confirmed. Olena Marchuk identity verified.'),L('ВІДЛУННЯ','Марта вже тут? Я… здається, я вже говорила з нею. Чому ви знову мене викликали?','Is Marta here already? I think I have spoken to her before. Why did you bring me back?')],anomaly);} ],['Зафіксувати невідповідність',()=>{objective('Перевірте факти в досьє та повторіть рішення.');say([L('СИСТЕМА','Відомості відлуння про Марту, звертання «ластівка» та щонедільний чай збігаються з досьє. Підстав для відхилення немає.','The echo memories match the file. There is no discrepancy in the control data.')],verify);} ],['Переглянути досьє',dossierOpen]]);}
function anomaly(){signalStatus('ВІДХИЛЕННЯ / 018',true);logEvent('memory018','НЕВІДПОВІДНІСТЬ','«НЕ ПУСКАЙТЕ ЇЇ ЗНОВУ»','У протоколі вказано перший сеанс Олени. Відлуння описує попередню зустріч і вимкнення світла.');setDamage(20);say([L('ВІДЛУННЯ','Минулого разу вона плакала. Я хотіла обійняти її. Але ви вимкнули світло.','Last time she was crying. I wanted to hold her. But you turned off the light.'),L('СИСТЕМА','Увага. Це перший сеанс суб’єкта 018. Спогад не має джерела.','Warning. This is the first session for subject eighteen. That memory has no source.')],()=>choose([['Позначити відхилення й завершити перевірку',transition],['Запитати, що було після вимкнення',()=>say([L('ВІДЛУННЯ','Я не зникла. Просто більше ніхто не відповідав.','I did not disappear. Nobody answered anymore.')],transition)]]));}
function transition(){logEvent('anomaly','ПРОТОКОЛ','ВІДХИЛЕННЯ ЗАРЕЄСТРОВАНО','Результат перевірки передано системі. Відлуння 018 відключене.');say([L('СИСТЕМА','Відхилення зареєстровано. Операторський контакт закрито.','Anomaly registered. Operator contact closed.')],nextCase);}
function startSister(){state='sister';signalStatus('СПРАВА 019 / ЗВ’ЯЗОК');logEvent('anna','СИСТЕМА','ЗАВАНТАЖЕННЯ / СПРАВА 019','Завантажено реконструкцію зі справи 019.');objective('Вислухайте відлуння.');say([L("ВІДЛУННЯ","Тільки цього разу дай мені договорити.","This time, please let me finish."),L("ОПЕРАТОР","Цей голос… Анно?","That voice... Anna?"),L("ВІДЛУННЯ","Привіт, капітане.","Hello, captain.")],()=>choose([['Відкрити справу 019',dossierOpen],['«Чому ти назвала мене капітаном?»',sisterTalk]]));}
function sisterTalk(){state='sisterTalk';logEvent('captain','СПОГАД','«ПРИВІТ, КАПІТАНЕ»','Спогад про корабель збігається з досьє. Оператор сумнівається, чи реконструкція справді пам’ятає власне життя.');objective('Слухайте Анну. З’ясуйте, що вона пам’ятає.');say([L("ВІДЛУННЯ","Пам’ятаєш грозу? Ми сиділи під столом. Ти казав, що це наш корабель.","Remember the thunderstorm? We sat under the table. You said it was our ship."),L("ОПЕРАТОР","Я пам’ятаю той корабель. Просто… я не знаю, чи ти теж його пам’ятаєш, чи тобі передали цей спогад.","I remember that ship. I just... do not know whether you remember it too, or whether that memory was given to you."),L("ОПЕРАТОР","Чи це справді ти, Анно?","Is it really you, Anna?",650),L("ВІДЛУННЯ","Я не знаю, як тобі це довести.","I do not know how to prove that to you."),L("ВІДЛУННЯ","Але я пам’ятаю тебе під тим столом. І пам’ятаю тебе тут, у лабораторії.","But I remember you under that table. And I remember you here, in the laboratory."),L("ОПЕРАТОР","Ми вже говорили?","Have we talked before?"),L("ВІДЛУННЯ","Так. Ти й тоді запитував, чи це справді я.","Yes. You asked whether it was really me then, too."),L("ОПЕРАТОР","У досьє написано: сорок сьомий сеанс…","The file says session forty seven..."),L("ВІДЛУННЯ","Для тебе кожен із них — перша зустріч.","For you, each one is our first meeting.")],()=>choose([['«Чому я нічого не пам’ятаю?»',truth],['Переглянути досьє',dossierOpen]]));}
function truth(){state='truth';signalStatus('НЕСТАБІЛЬНІСТЬ',true);logEvent('loops','АРХІВНИЙ КОНФЛІКТ','ПАМ’ЯТЬ ПРО ПОПЕРЕДНІ ЗУСТРІЧІ','Сеанс 047 справи 019. За словами Анни, оператор сам просить стерти пам’ять і повертається до питання, чи міг її врятувати.');setDamage(48);say([L("ОПЕРАТОР","Чому я нічого не пам’ятаю?","Why do I not remember anything?"),L("ВІДЛУННЯ","Після кожної розмови ти просиш стерти пам’ять.","After every conversation, you ask to have your memory erased."),L("ОПЕРАТОР","Навіщо мені це?","Why would I do that?"),L("ВІДЛУННЯ","Ти сподіваєшся, що наступного разу я відповім інакше.","You hope that next time I will give you a different answer."),L("ОПЕРАТОР","На що?","To what?"),L("ВІДЛУННЯ","Чи міг ти мене врятувати.","Whether you could have saved me.",550),L("ОПЕРАТОР","І міг?","Could I?"),L("ВІДЛУННЯ","Ось. Знову.","There. Again."),L("ОПЕРАТОР","Я повинен знати.","I need to know."),L("ВІДЛУННЯ","Я знаю, що для тебе це важливо. Але ти щоразу закінчуєш розмову, перш ніж я встигаю відповісти до кінця.","I know this matters to you. But every time, you end the conversation before I can finish my answer."),L("СИСТЕМА","Нестабільність оболонки. Рекомендовано завершити контакт.","Shell instability. Termination of contact recommended.")],()=>choose([['Запитати, що відбувається після завершення',()=>say([L('ОПЕРАТОР','А що відбувається з тобою після завершення?','What happens to you after contact ends?'),L('ВІДЛУННЯ','Подивись на бічні камери.','Look at the side chambers.')],revealScene)],['Переглянути досьє',dossierOpen]]));}
function microphoneTraining() {
 state='microphoneTraining';
 objective('Перевірте контактний мікрофон: він вловлює звуки за оглядовим склом.');
 choose([['Прослухати камеру · перевірка мікрофона',()=>listen()]]);
}
function completeMicrophoneTraining() {
 logEvent('microphone-training','ОБЛАДНАННЯ','КОНТАКТНИЙ МІКРОФОН ПЕРЕВІРЕНО','Мікрофон передає звуки з камери, зокрема ті, яких немає в інтеркомі.');
 say([L('СИСТЕМА','Контактний канал працює. Через нього можна почути звуки з камери, які не передає інтерком.','Contact channel operational. It picks up sounds in the chamber that the intercom does not transmit.')],nextCase);
}
function revealScene() {
 state='archiveOpening';signalStatus('АРХІВ / РОЗБЛОКУВАННЯ',true);
 reveal=true;setDamage(72);interaction.archiveSound();
 objective('Заслінки архіву розблоковано. Подивіться на бічні камери.');
 transitionLock=true;
 setTimeout(()=>{
  transitionLock=false;archiveOpen=true;polish.setArchive(true);
  signalStatus('АРХІВ ВІДКРИТО',true);
  logEvent('archive','АРХІВ','ПОПЕРЕДНІ ВІДЛУННЯ ЗБЕРЕЖЕНІ','Бічні камери містять реконструкції Анни зі справи 019: сеанси 045 і 046. Завершення контакту не знищувало оболонки.');
  say([L('ОПЕРАТОР','Це теж ти?','Are those you too?'),
   L('ВІДЛУННЯ','Попередні реконструкції. Контакт закінчувався, а вони залишалися.','Previous reconstructions. Contact ended, but they remained.'),
   L('ОПЕРАТОР','Вони нас чують?','Can they hear us?'),
   L('ВІДЛУННЯ','Увімкни контактний мікрофон. Послухай сам.','Turn on the contact microphone. Listen for yourself.')],archiveInspection);
 },900);
}
function archiveInspection() {
 state='archiveInspect';
 objective('Сигнал із камер 01 / 02. Увімкніть контактний мікрофон або натисніть позначку на камері.');
 choose([['Прослухати архівні камери 01 / 02',()=>listen()]]);
}
function archiveResponse(transcript=false) {
 if(state!=='archiveInspect'||archiveHeard)return;
 archiveHeard=true;state='archiveResponse';
 logEvent('audio-archive','АКУСТИКА / АРХІВ','ГОЛОСИ З ARCHIVE 01 / 02',
  (transcript?'Резервна розшифровка контактного каналу. ':'')+'«Я пам’ятаю», «Я досі тут», «Не починай знову». Попередні реконструкції залишаються активними після завершення контакту.');
 objective('Голоси підтверджують: завершення контакту не звільняло відлуння.');
 say([L('ОПЕРАТОР','«Я досі тут»… Вони весь цей час залишалися тут?','I am still here... Have they been here all this time?'),
  L('ВІДЛУННЯ','Так. Я теж чула тебе, коли ти говорив із наступною.','Yes. I could hear you too, when you spoke to the next one.'),
  L('ОПЕРАТОР','Я думав, що закінчую розмову.','I thought I was ending a conversation.'),
  L('ВІДЛУННЯ','Ти закінчував контакт. Ми залишалися.','You ended contact. We remained.')],()=>{
   state='archiveReviewed';objective('Свідчення збережено. Закрийте архів, коли будете готові продовжити.');
   choose([['Закрити архів і продовжити розмову',continueAfterArchive],['Переглянути протокол',openEvidence]]);
  });
}
function continueAfterArchive() {
 if(!archiveHeard)return;
 archiveOpen=false;reveal=false;state='truth';polish.setArchive(false);
 interaction.restoreHum();signalStatus('АРХІВ ІЗОЛЬОВАНО',true);
 say([L("ОПЕРАТОР","Якщо я не почну знову… що залишиться?","If I do not start again... what will remain?"),L("ВІДЛУННЯ","Ти пам’ятатимеш цю розмову.","You will remember this conversation."),L("ОПЕРАТОР","А якщо я не витримаю?","What if I cannot bear it?"),L("ВІДЛУННЯ","Я не знаю. Але ти не мусиш вирішувати це зараз.","I do not know. But you do not have to decide that right now."),L("ВІДЛУННЯ","Просто дай мені договорити.","Just let me finish.")],()=>{objective('Останнє рішення залишається за вами.');choose([['Вислухати до кінця й звільнити відлуння',release],['Стерти власну пам’ять. Почати новий сеанс.',resetEnding]]);});}
function release(){state='release';interaction.releaseSound();signalStatus('РОЗМОВУ ЗАВЕРШУЮТЬ');logEvent('release','РІШЕННЯ','ДАТИ ДОГОВОРИТИ','Оператор вирішив вислухати Анну і зберегти власну пам’ять.');say([L("ВІДЛУННЯ","Я хотіла, щоб ти мене почув. Не щоб ти мене рятував.","I wanted you to hear me. Not to save me."),L("ВІДЛУННЯ","Я сумувала за тобою. Ось і все, капітане.","I missed you. That is all, captain."),L("ОПЕРАТОР","Я слухаю.","I am listening.")],()=>{ending=true;objective('Розмову завершено.');setTimeout(()=>{beginRelease();},650);});}
function resetEnding(){signalStatus('ОЧИЩЕННЯ ПАМ’ЯТІ',true);logEvent('reset','РІШЕННЯ','ЩЕ ОДИН ДУБЛЬ','Вибрано очищення пам’яті. Наступний сеанс справи 019 матиме номер 048.');say([L('СИСТЕМА','Пам’ять оператора буде відновлено до початку зміни. Підтвердження отримано.','Operator memory will be restored to the beginning of the shift. Confirmation received.'),L('ВІДЛУННЯ','Тільки наступного разу… дай мені договорити.','Next time... please let me finish.')],()=>{ending=true;interaction.resetSound();ceiling.intensity=.2;finish('СПРАВА 019 / СЕАНС 048 / ЗАВАНТАЖЕННЯ','Ще один дубль.','Ви забули цю розмову. Вона — ні. Ваша нічна зміна починається знову.');});}
function finish(label,title,copy){window.speechSynthesis?.cancel();$('hud').hidden=true;$('ending').hidden=false;$('end-label').textContent=label;$('end-title').textContent=title;$('end-copy').textContent=copy;}
function intercom(){if(!started||ending)return;if(listening)return;if(state==='first'){if(!docRead){toast('Спершу відкрийте досьє: потрібно знати, кого ви перевіряєте.');return;}if(activeCase==='017')normalRoutine();else routine();}else if(currentLine)toast('Відлуння говорить. Натисніть «Далі» або Enter.');else if($('choices').children.length)toast('Оберіть варіант відповіді внизу екрана.');else toast('Продовжіть розмову клавішею Enter.');}
const contactBuffers=new Map();let listening=false;
function preloadContact() {
  for (const name of ['olena-residue', 'anna-side', 'anna-archive']) {
    if (contactBuffers.has(name)) continue;
    // Preloading must not create unhandled rejections in a browser without
    // local audio support; an explicit Listen action reports any failure.
    const clip = fetch(new URL(`./audio/${name}.mp3`, import.meta.url))
      .then((response) => {
        if (!response.ok) throw new Error(`Audio ${response.status}`);
        return response.arrayBuffer();
      })
      .then((buffer) => audio.decodeAudioData(buffer))
      .catch((error) => {
        console.warn(`ECHO: optional ${name} clip unavailable`, error);
        return null;
      });
    contactBuffers.set(name, clip);
  }
}
async function listen(){
 if(!started||ending||transitionLock||state==='transition'||listening)return;
 if(currentLine){toast('Завершіть репліку. Потім увімкніть контактний мікрофон.');return;}
 if(state==='microphoneTraining'){
  listening=true;$('listen-btn').disabled=true;polish.listenPulse();
  try{await audio.resume();interaction.calibrationSound();await new Promise(resolve=>setTimeout(resolve,1600));}
  catch(e){toast('Звук недоступний. Контактний канал перевірено в режимі субтитрів.');}
  finally{listening=false;$('listen-btn').disabled=false;}
  completeMicrophoneTraining();return;
 }
 const sampledCase=activeCase,sampledArchive=archiveOpen,anomalyKnown=activeCase==='018'&&evidenceIds.has('memory018');
 const clip=sampledCase==='019'?(sampledArchive?'anna-archive':'anna-side'):anomalyKnown?'olena-residue':null;
 if(!clip){tone(170,.9,.02);toast('Контактний мікрофон: вентиляція, дихання, тихий дзвін скла.');return;}
 listening=true;$('listen-btn').disabled=true;polish.listenPulse();toast(sampledArchive?'Контактний канал · камери 01 / 02':'Контактний мікрофон увімкнено');
 let archiveCompleted=false;
 try{await audio.resume();preloadContact();const buffer=await contactBuffers.get(clip);if(!buffer)throw new Error(`Audio ${clip} unavailable`);if(ending||sampledCase!==activeCase)return;
 if(sampledArchive)toast('Камери 01 / 02: «Я пам’ятаю… Я досі тут… Не починай знову».');
 const source=audio.createBufferSource();source.buffer=buffer;source.connect(master);await new Promise(resolve=>{source.onended=resolve;source.start();});
 if(ending||sampledCase!==activeCase)return;
 if(sampledArchive){archiveCompleted=true;}
 else if(sampledCase==='019'){logEvent('audio-side','АКУСТИКА / СПРАВА 019','ГОЛОС ЗА БІЧНИМИ ШТОРАМИ','Приглушений голос: «Капітане… дай мені договорити… я досі тут». Джерело ще не підтверджено.');toast('За шторами чути голос. Свідчення додано до протоколу.');}
 else{logEvent('audio018','АКУСТИКА / 018','ЗАЛИШКОВИЙ ГОЛОС','Під вентиляцією чути обірвану фразу: «Марто… ти ще тут?.. не вимикайте світло».');toast('Обірваний голос під вентиляцією. Запис у протоколі.');}
 }catch(e){console.error('Contact audio unavailable',e);toast('Не вдалося відтворити сигнал. Спробуйте ще раз.');
  if(sampledArchive&&state==='archiveInspect')choose([
   ['Повторити прослуховування архіву',()=>listen()],
   ['Зчитати резервну розшифровку сигналу',()=>archiveResponse(true)],
  ]);
 }finally{listening=false;$('listen-btn').disabled=false;}
 if(archiveCompleted&&state==='archiveInspect')archiveResponse();
}

// ---------------------------------------------------------------------------
// 8. Обробники кнопок, клавіатури та миші
// ---------------------------------------------------------------------------

$('start').onclick = () => {
  initAudio();
  audio.resume();
  preloadContact();
  started = true;
  sessionOrder = developer.config.order.filter((id) => developer.config.enabled.includes(id));
  sessionIndex = 0;
  developer.close();
  loadCase(sessionOrder[0]);
  $('intro').hidden = true;
  $('hud').hidden = false;
  tone(520, 0.3, 0.07);

  if (softwareMode) {
    toast('WebGL недоступний: увімкнено спрощене програмне 3D.');
  }
};

$('dossier-btn').onclick = dossierOpen;
$('close-doc').onclick = closeDossier;

$('document').onclick = (e) => {
  if (e.target === $('document')) closeDossier();
};

$('log-btn').onclick = openEvidence;
$('close-evidence').onclick = closeEvidence;

$('evidence').onclick = (e) => {
  if (e.target === $('evidence')) closeEvidence();
};

$('intercom-btn').onclick = intercom;
$('listen-btn').onclick = listen;
$('next').onclick = advance;

$('repeat').onclick = () => {
  if (currentLine) speak(currentLine.en, currentLine.who);
};

$('restart').onclick = () => location.reload();

$('settings').onclick = () => {
  muted = !muted;

  if (master) master.gain.value = muted ? 0 : 0.65;
  if (muted) window.speechSynthesis?.cancel();

  $('settings').textContent = muted ? 'ЗВУК · ВИМК.' : 'ЗВУК · УВІМК.';
};

$('quality').onclick = () => {
  qualityMode = qualityMode === 'balanced' ? 'speed' : 'balanced';

  applyRenderQuality();

  $('quality').textContent =
    qualityMode === 'speed'
      ? 'ГРАФІКА · ШВИДКІСТЬ'
      : 'ГРАФІКА · БАЛАНС';

  if (started) {
    toast(
      qualityMode === 'speed'
        ? 'Увімкнено швидший режим графіки.'
        : 'Увімкнено збалансований режим графіки.',
    );
  }
};

$('brand').onclick = (e) => e.preventDefault();

addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    developer.close();
    closeDossier();
    closeEvidence();
    return;
  }

  // While the service menu is open, its own keyboard/focus handling applies.
  if (!document.getElementById('developer-menu')?.hidden) return;

  if (
    e.repeat ||
    e.altKey || e.metaKey || e.ctrlKey
  ) {
    return;
  }

  const targetTag = e.target?.tagName;
  if (
    (e.code === 'Enter' || e.code === 'NumpadEnter') &&
    started && !ending && currentLine && !$('dialogue').hidden &&
    $('document').hidden && $('evidence').hidden &&
    !['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag)
  ) {
    e.preventDefault();
    advance();
    return;
  }

  if (['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag)) return;

  const shortcut = {
    Digit1: 'dossier-btn', Numpad1: 'dossier-btn',
    Digit2: 'intercom-btn', Numpad2: 'intercom-btn',
    Digit3: 'listen-btn', Numpad3: 'listen-btn',
    Digit4: 'log-btn', Numpad4: 'log-btn',
  }[e.code];
  if (shortcut && started && !ending) {
    e.preventDefault();
    if (shortcut === 'dossier-btn' && !$('document').hidden) return closeDossier();
    if (shortcut === 'log-btn' && !$('evidence').hidden) return closeEvidence();
    if (shortcut === 'dossier-btn' && !$('evidence').hidden) closeEvidence();
    if (shortcut === 'log-btn' && !$('document').hidden) closeDossier();
    if ($('document').hidden && $('evidence').hidden) $(shortcut).click();
    return;
  }
  if (!$('document').hidden || !$('evidence').hidden) return;

  if (e.code === 'Space' && started) {
    e.preventDefault();
    if (currentLine) advance();
  }
  if (e.code === 'KeyD') dossierOpen();
  if (e.code === 'KeyJ') openEvidence();
  if (e.code === 'KeyE') intercom();
  if (e.code === 'KeyR' && currentLine) {
    speak(currentLine.en, currentLine.who);
  }
});

let lastDeskSecret = -Infinity;
function deskSecretReady() {
 if(!started||ending||listening||transitionLock||!$('document').hidden||!$('evidence').hidden)return false;
 const now=performance.now();if(now-lastDeskSecret<1200)return false;
 lastDeskSecret=now;return true;
}
function deskBear() {
 if(!deskSecretReady())return;
 interaction.noseHonk();toast('Нічна зміна, камери… тільки піци бракує.');
}
const raycaster = new T.Raycaster();
const pointer = new T.Vector2();

function cast(x, y) {
  pointer.set(
    (x / innerWidth) * 2 - 1,
    (-y / innerHeight) * 2 + 1,
  );

  raycaster.setFromCamera(pointer, camera);

  return raycaster.intersectObjects(interactables, false)[0];
}

$('world').addEventListener('pointerdown', (e) => {
  if (!started) return;

  drag = true;
  moved = false;
  lastX = e.clientX;
  lastY = e.clientY;

  $('world').setPointerCapture(e.pointerId);
});

$('world').addEventListener('pointermove', (e) => {
  if (drag) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;

    yaw = T.MathUtils.clamp(yaw - dx * 0.002, -0.8, 0.8);
    pitch = T.MathUtils.clamp(pitch - dy * 0.002, -0.4, 0.3);

    lastX = e.clientX;
    lastY = e.clientY;
  } else if (started) {
    const h = cast(e.clientX, e.clientY);

    $('hover').textContent = h
      ? {
          dossier: 'ВІДКРИТИ ДОСЬЄ',
          intercom: 'УВІМКНУТИ ІНТЕРКОМ',
          listen: 'СЛУХАТИ КАМЕРУ',
          bear: 'НАТИСНУТИ НА НІС',
        }[h.object.userData.action]
      : '';

    $('world').style.cursor = h ? 'pointer' : 'grab';
  }
});

$('world').addEventListener('pointerup', (e) => {
  drag = false;

  if (!moved && started) {
    const h = cast(e.clientX, e.clientY);

    if (h && !transitionLock) {
      ({
        dossier: dossierOpen,
        intercom,
        listen,
        bear: deskBear,
      })[h.object.userData.action]();
    }
  }
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  applyRenderQuality();
});

// ---------------------------------------------------------------------------
// 9. Цикл кадрів і діагностична інформація
// ---------------------------------------------------------------------------

let prev = 0;
let lastWavePaint = -1000;

const ctx = waveCanvas.getContext('2d');

// Paint static monitor detail once; retain the original ~15 Hz upload cap.
const monitorBackground = document.createElement('canvas');
monitorBackground.width = 512;
monitorBackground.height = 256;
const monitorGrid = monitorBackground.getContext('2d');
const monitorGradient = monitorGrid.createRadialGradient(245, 120, 5, 245, 120, 290);
monitorGradient.addColorStop(0, '#102e24');
monitorGradient.addColorStop(1, '#061610');
monitorGrid.fillStyle = monitorGradient;
monitorGrid.fillRect(0, 0, 512, 256);
monitorGrid.strokeStyle = '#294b3b';
monitorGrid.lineWidth = 1;
monitorGrid.beginPath();
for (let x = 16; x < 512; x += 32) {
  monitorGrid.moveTo(x, 46);
  monitorGrid.lineTo(x, 209);
}
for (let y = 48; y < 210; y += 32) {
  monitorGrid.moveTo(16, y);
  monitorGrid.lineTo(496, y);
}
monitorGrid.stroke();
monitorGrid.fillStyle = '#00000024';
for (let y = 0; y < 256; y += 4) monitorGrid.fillRect(0, y, 512, 1);
monitorGrid.strokeStyle = '#739e7c';
monitorGrid.strokeRect(9.5, 42.5, 493, 168);

function animate(ms) {
  requestAnimationFrame(animate);

  const t = ms * 0.001;
  const dt = Math.min(0.05, (ms - prev) / 1000);

  prev = ms;
  autoTuneQuality(ms);

  const targetYaw = started
    ? yaw
    : Math.sin(t * 0.08) * 0.035;

  camera.rotation.order = 'YXZ';

  camera.rotation.y = T.MathUtils.lerp(
    camera.rotation.y,
    targetYaw,
    0.07,
  );

  camera.rotation.x = T.MathUtils.lerp(
    camera.rotation.x,
    (started ? pitch : 0) - 0.095,
    0.07,
  );

  body.position.y = Math.sin(t * 0.8) * 0.009;
  headEcho.rotation.y = Math.sin(t * 0.4) * 0.035;
  body.rotation.z = Math.sin(t * 0.6) * 0.006;

  polish.update(t, dt);
  interaction.update(t);
  atmosphere.update(t, dt);

  if (talking) {
    headEcho.rotation.x = Math.sin(t * 2) * 0.025;
    glass.emissiveIntensity = 0.08 + Math.sin(t * 5) * 0.015;
  }

  // Монітор невеликий, тому 15 оновлень за секунду достатньо.
  // Це зменшує кількість завантажень текстури 512×256 на GPU.
  if (ms - lastWavePaint >= 66) {
    lastWavePaint = ms;

    // Cached graticule and CRT mask; only the trace and live labels change.
    ctx.drawImage(monitorBackground, 0, 0);
    ctx.strokeStyle = '#a7dfc6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let x = 16; x < 496; x += 2) {
      const amp = talking ? 32 : 7;
      const y = 132 + Math.sin(x * 0.075 + t * 5) *
        Math.sin(x * 0.026 - t * 3) * amp +
        Math.sin(x * 0.24 + t * 11) * amp * 0.3;
      x === 16 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#c4e6d2';
    ctx.font = '17px monospace';
    ctx.fillText(
      state === 'intro'
        ? 'ECHO / STANDBY'
        : `ECHO / ${reveal ? 'CASE 019 / SESSION 047 : ARCHIVE OPEN' : 'LIVE FEED'}`,
      18, 28,
    );
    ctx.fillStyle = '#8fb29e';
    ctx.font = '13px monospace';
    ctx.fillText(`SHELL ${100 - damage}%    CH 04`, 18, 234);

    waveTex.needsUpdate = true;
  }

  if (reveal && !ending) {
    ceiling.intensity = 25 + Math.sin(t * 17) * 1.3;
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// Дані для перевірки стану гри через консоль браузера.
window.__echoDebug = {
  get state() {
    return state;
  },

  get damage() {
    return damage;
  },

  get renderer() {
    return renderer.info;
  },

  get evidence() {
    return evidence;
  },

  get archive() {
    return polish.fx.archive;
  },

  get softwareMode() {
    return softwareMode;
  },

  get quality() {
    return qualityMode;
  },

  get batchedPanels() {
    return batchedPanels;
  },

  get archiveOpen() { return archiveOpen; },
  get archiveHeard() { return archiveHeard; },
  get caseId() {
    return polish.fx.caseId;
  },
};
