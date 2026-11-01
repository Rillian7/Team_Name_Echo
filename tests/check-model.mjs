/** Geometry-only regression test, without a browser or WebGL context. */
import assert from 'node:assert/strict';
import * as Three from '../vendor/three.module.js';
import { humanBody } from '../art/human-body.js';
import { createHologram } from '../hologram.js';

const { echo, body, headEcho, annaHair, glass } = createHologram(Three, true);
const silhouette = body.getObjectByName('Echo / continuous anatomical surface');

assert.ok(silhouette);
assert.equal(silhouette.material, glass);
assert.equal(silhouette.geometry.index.count, humanBody.indices.length);
assert.equal(annaHair.parent, headEcho);
assert.equal(annaHair.visible, true);
assert.equal(annaHair.children.length, 2);
assert.ok(annaHair.children.every((mesh) => mesh.material === glass));
assert.ok(annaHair.children.every((mesh) => mesh.geometry.attributes.color));

const positions = silhouette.geometry.getAttribute('position');
let shouldersChecked = 0;
for (let i = 0; i < positions.count; i++) {
  const y = positions.getY(i);
  if (Math.abs(y - 1.71) > 0.13 || Math.abs(humanBody.positions[i * 3]) < 0.2) continue;
  assert.ok(Math.abs(positions.getX(i)) < Math.abs(humanBody.positions[i * 3]));
  shouldersChecked++;
}
assert.ok(shouldersChecked > 5, `Only ${shouldersChecked} shoulder vertices checked`);

const archive = echo.clone();
const archiveHair = archive.getObjectByName('Anna / chin-length rounded bob');
assert.ok(archiveHair);
archiveHair.visible = true;
assert.equal(archiveHair.children.length, 2);

console.log('PASS indexed memory-glass model; narrowed shoulders; Anna bob on main and archive characters');

assert.ok(glass.isMeshPhysicalMaterial);
assert.ok(glass.roughness < .1);
assert.ok(glass.clearcoat > .9);
