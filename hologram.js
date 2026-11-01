/**
 * A deliberately incomplete human reconstruction, built entirely from local
 * geometry. The game owns the returned groups and the shared fade material.
 * No narrative state or interaction is handled in this module.
 */
import { humanBody } from './art/human-body.js';

export function createHologram(T, softwareMode = false) {
  const uniforms = {
    echoTime: { value: 0 },
    echoStress: { value: 0 },
  };

  // Lightly frosted memory glass, using the existing single material pass.
  // Keep the original .53 opacity: the existing release ending fades it.
  const glass = new T.MeshPhysicalMaterial({
    color: 0xe5fff8,
    emissive: 0x000000,
    emissiveIntensity: 0,
    roughness: 0.018,
    transmission: softwareMode ? 0 : 1,
    thickness: 0.24,
    attenuationColor: new T.Color(0x9ce0d2),
    attenuationDistance: 2.5,
    envMapIntensity: 1.6,
    ior: 1.46,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: softwareMode ? 0.22 : 1,
    depthWrite: false,
    side: T.FrontSide,
    vertexColors: false,
  });
  glass.name = 'Reconstruction / frosted memory glass';

  if (!softwareMode) {
    // One ordinary material pass. No transmission, scene copy, or postprocess.
    glass.onBeforeCompile = (shader) => {
      shader.uniforms.echoTime = uniforms.echoTime;
      shader.uniforms.echoStress = uniforms.echoStress;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 echoPosition;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nechoPosition = position;');
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          varying vec3 echoPosition;
          uniform float echoTime;
          uniform float echoStress;`,
        )
        .replace(
          '#include <opaque_fragment>',
          `
          float facing = abs(dot(normal, normalize(vViewPosition)));
          float contour = pow(1.0 - facing, 3.0);
          float surfaceDepth = 0.985 + 0.015 * sin(echoPosition.y * 11.0 + echoPosition.x * 7.0);
          float instability = step(0.992, sin(echoPosition.y * 83.0
            + floor(echoTime * 7.0) * 1.73)) * echoStress * 0.22;
          outgoingLight += vec3(0.09, 0.17, 0.15) * contour;
          diffuseColor.a *= (0.9 + contour * 0.1) * surfaceDepth * (1.0 - instability);
          #include <opaque_fragment>`,
        );
    };
    glass.customProgramCacheKey = () => 'echo-clear-refractive-glass-v4';
  }

  const echo = new T.Group();
  echo.name = 'Echo / human reconstruction';
  echo.position.set(0, 0, -1.3);
  echo.scale.setScalar(1.13);
  const body = new T.Group();
  body.name = 'Echo / breathing pivot';
  echo.add(body);

  // Each row: height, half width, half depth, horizontal offset, depth offset.
  // Elliptical sections allow anatomical planes without disconnected spheres.
  function loft(rows, segments = 16, tint = 'body') {
    const positions = [],
      colors = [],
      indices = [];
    for (const [y, rx, rz, cx = 0, cz = 0] of rows) {
      for (let j = 0; j < segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        const front = Math.cos(angle);
        const x = cx + Math.sin(angle) * rx;
        const z = cz + front * rz;
        positions.push(x, y, z);

        // Quiet tonal planes also read in the CPU fallback; no skin textures.
        let shade = 0.79 + front * 0.08 + Math.sin(angle * 2) * 0.035;
        if (tint === 'head') {
          // A swept-back hair silhouette, open at the brow and cheeks.
          const hairline = 0.1 - (1 - front) * 0.15;
          if (y > hairline) shade *= 0.96;
        }
        colors.push(shade * 0.88, shade, shade * 0.96);
      }
    }
    for (let i = 0; i < rows.length - 1; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * segments + j;
        const b = i * segments + ((j + 1) % segments);
        const c = a + segments,
          d = b + segments;
        indices.push(a, b, d, a, d, c);
      }
    }
    // Close only the two ends; the intermediate sections remain continuous.
    for (const [row, top] of [
      [0, false],
      [rows.length - 1, true],
    ]) {
      const [y, , , x = 0, z = 0] = rows[row];
      const center = positions.length / 3;
      positions.push(x, y, z);
      colors.push(0.72, 0.82, 0.78);
      for (let j = 0; j < segments; j++) {
        const a = row * segments + j;
        const b = row * segments + ((j + 1) % segments);
        indices.push(...(top ? [center, a, b] : [center, b, a]));
      }
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  function merge(parts) {
    const attributes = { position: [], normal: [], color: [] };
    for (const geometry of parts) {
      const flat = geometry.toNonIndexed();
      for (const name of Object.keys(attributes)) {
        attributes[name].push(...flat.attributes[name].array);
      }
      flat.dispose();
      geometry.dispose();
    }
    const geometry = new T.BufferGeometry();
    for (const [name, values] of Object.entries(attributes)) {
      geometry.setAttribute(name, new T.Float32BufferAttribute(values, 3));
    }
    geometry.computeBoundingSphere();
    return geometry;
  }

  // A single closed surface avoids overlapping transparent primitive joints.
  // This compact authored asset is indexed and shared by archive clones.
  const bodyGeometry = new T.BufferGeometry();
  bodyGeometry.setAttribute('position', new T.Float32BufferAttribute(humanBody.positions, 3));
  bodyGeometry.setIndex(humanBody.indices);
  // All three subjects are women. Shape the existing asset in place without
  // replacing its single indexed mesh or adding per-frame deformation work.
  const position = bodyGeometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i);
    const shoulderInfluence = Math.max(0, 1 - Math.abs(y - 1.71) / 0.39);
    const waist = Math.max(0, 1 - Math.abs(y - 1.32) / .24);
    const hips = Math.max(0, 1 - Math.abs(y - 1.02) / .22);
    const x = position.getX(i);
    position.setX(i, x * (1 - .33 * shoulderInfluence - .07 * waist + .065 * hips));
    if (Math.abs(x) > .22) position.setY(i, y - .055 * shoulderInfluence);
  }
  position.needsUpdate = true;
  const bodyColors = new Float32Array(humanBody.positions.length);
  for (let i = 0; i < humanBody.positions.length; i += 3) {
    const x = humanBody.positions[i],
      z = humanBody.positions[i + 2];
    const shade = 0.79 + Math.min(0.07, z * 0.34) - Math.abs(x) * 0.035;
    bodyColors[i] = shade * 0.88;
    bodyColors[i + 1] = shade;
    bodyColors[i + 2] = shade * 0.96;
  }
  bodyGeometry.setAttribute('color', new T.BufferAttribute(bodyColors, 3));
  bodyGeometry.computeVertexNormals();
  bodyGeometry.computeBoundingSphere();
  const silhouette = new T.Mesh(bodyGeometry, glass);
  silhouette.name = 'Echo / continuous anatomical surface';
  body.add(silhouette);

  // Construction-time local raycasts fit existing damage lines to the new
  // surface. This probe is never rendered and does no work in the frame loop.
  const probeMesh = new T.Mesh(bodyGeometry, glass);
  const probeRay = new T.Raycaster(new T.Vector3(), new T.Vector3(0, 0, -1));
  function surfacePoint(x, y) {
    probeRay.ray.origin.set(x, y, 0.6);
    let hits = probeRay.intersectObject(probeMesh, false);
    if (!hits.length) {
      probeRay.ray.origin.x = (x < 0 ? -1 : 1) * 0.12;
      hits = probeRay.intersectObject(probeMesh, false);
    }
    const point = hits.length ? hits[0].point : new T.Vector3(x, y, 0.12);
    point.z += 0.005;
    return point;
  }

  const skull = loft(
    [
      [-0.163, 0.047, 0.052, 0, 0.025],
      [-0.143, 0.072, 0.065, 0, 0.017],
      [-0.105, 0.094, 0.08, 0, 0.009],
      [-0.058, 0.114, 0.091, 0, 0.003],
      [-0.005, 0.121, 0.102],
      [0.047, 0.12, 0.105, 0, -0.003],
      [0.099, 0.11, 0.099, 0, -0.007],
      [0.145, 0.084, 0.08, 0, -0.008],
      [0.175, 0.044, 0.044, 0, -0.006],
      [0.183, 0.005, 0.008, 0, -0.004],
    ],
    20,
    'head',
  );

  // The nose is a restrained set of facial planes, part of the head mesh.
  const nose = new T.BufferGeometry();
  const nosePoints = [
    -0.016, 0.01, 0.096, 0.016, 0.01, 0.096, 0, -0.044, 0.151, -0.016, 0.01, 0.096, 0, -0.044,
    0.151, -0.024, -0.056, 0.105, 0.016, 0.01, 0.096, 0.024, -0.056, 0.105, 0, -0.044, 0.151,
    -0.024, -0.056, 0.105, 0, -0.044, 0.151, 0.024, -0.056, 0.105,
  ];
  nose.setAttribute('position', new T.Float32BufferAttribute(nosePoints, 3));
  nose.setAttribute(
    'color',
    new T.Float32BufferAttribute(
      Array.from({ length: nosePoints.length / 3 }, () => [0.76, 0.88, 0.82]).flat(),
      3,
    ),
  );
  nose.setIndex([0, 2, 1, 3, 5, 4, 6, 8, 7, 9, 11, 10]);
  nose.computeVertexNormals();
  const headEcho = new T.Mesh(merge([skull, nose]), glass);
  headEcho.name = 'Echo / head and face pivot';
  headEcho.position.set(0, 2.178, 0);
  headEcho.scale.x = 1.06;
  body.add(headEcho);

  // Anna's jaw-length, asymmetric bob is the one model detail brought over
  // from the story-fix version. Its proportions match our smaller head and it
  // reuses the original memory-glass shader (no new materials or effects).
  const annaHair = new T.Group();
  annaHair.name = 'Anna / chin-length rounded bob';
  annaHair.visible = false;
  headEcho.add(annaHair);

  const bobRows = [
    [0.025, 0.202], [0.104, 0.171], [0.144, 0.116],
    [0.157, 0.035], [0.159, -0.055], [0.156, -0.14],
    [0.145, -0.205],
  ];
  const hairSegments = 40;
  const hairPositions = [];
  const hairColors = [];
  const hairIndices = [];
  for (let row = 0; row < bobRows.length; row++) {
    for (let col = 0; col <= hairSegments; col++) {
      const angle = 0.67 + (col / hairSegments) * (Math.PI * 2 - 1.34);
      const [radius, y] = bobRows[row];
      const silhouette = 1 + 0.035 * Math.cos(angle * 5 + 0.4);
      const asymmetry = 0;
      const tips = row === bobRows.length - 1 ? 0.002 * Math.cos(angle * 7) : 0;
      hairPositions.push(
        Math.sin(angle) * radius * silhouette,
        y + asymmetry + tips,
        Math.cos(angle) * radius * 0.93 - 0.014,
      );
      hairColors.push(0.8, 0.92, 0.9);
    }
  }
  for (let row = 0; row < bobRows.length - 1; row++) {
    for (let col = 0; col < hairSegments; col++) {
      const a = row * (hairSegments + 1) + col;
      const b = a + hairSegments + 1;
      hairIndices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const bobGeometry = new T.BufferGeometry();
  bobGeometry.setAttribute('position', new T.Float32BufferAttribute(hairPositions, 3));
  bobGeometry.setAttribute('color', new T.Float32BufferAttribute(hairColors, 3));
  bobGeometry.setIndex(hairIndices);
  bobGeometry.computeVertexNormals();
  annaHair.add(new T.Mesh(bobGeometry, glass));

  // The slanted fringe exposes Anna's face while distinguishing her outline.
  const fringePositions = [];
  const fringeColors = [];
  const fringeIndices = [];
  const fringeSegments = 30;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col <= fringeSegments; col++) {
      const f = col / fringeSegments;
      const x = T.MathUtils.lerp(-0.118, 0.12, f);
      const top = 0.193 - Math.abs(x) * 0.23;
      const bottom = 0.132 - Math.pow(Math.abs(x) / .12, 1.5) * .125;
      fringePositions.push(x, T.MathUtils.lerp(top, bottom, row / 2), 0.116 + Math.sin(f * Math.PI) * 0.022);
      fringeColors.push(0.8, 0.92, 0.9);
    }
  }
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < fringeSegments; col++) {
      const a = row * (fringeSegments + 1) + col;
      const b = a + fringeSegments + 1;
      fringeIndices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const fringeGeometry = new T.BufferGeometry();
  fringeGeometry.setAttribute('position', new T.Float32BufferAttribute(fringePositions, 3));
  fringeGeometry.setAttribute('color', new T.Float32BufferAttribute(fringeColors, 3));
  fringeGeometry.setIndex(fringeIndices);
  fringeGeometry.computeVertexNormals();
  annaHair.add(new T.Mesh(fringeGeometry, glass));

  const contourMaterial = new T.LineBasicMaterial({
    color: 0xb5f0dd,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
  });
  const faceMaterial = new T.LineBasicMaterial({
    color: 0x377c73,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
  });
  function lines(segments, material, parent) {
    const points = segments.flatMap(([a, b]) => [new T.Vector3(...a), new T.Vector3(...b)]);
    const line = new T.LineSegments(new T.BufferGeometry().setFromPoints(points), material);
    parent.add(line);
    return line;
  }
  // Short eye creases and a resting mouth: no large luminous alien eyes.
  lines(
    [
      [
        [-0.078, -0.012, 0.083],
        [-0.048, -0.016, 0.101],
      ],
      [
        [-0.048, -0.016, 0.101],
        [-0.025, -0.011, 0.102],
      ],
      [
        [0.025, -0.011, 0.102],
        [0.048, -0.016, 0.101],
      ],
      [
        [0.048, -0.016, 0.101],
        [0.078, -0.012, 0.083],
      ],
      [
        [-0.026, -0.092, 0.094],
        [0, -0.095, 0.099],
      ],
      [
        [0, -0.095, 0.099],
        [0.026, -0.092, 0.094],
      ],
    ],
    faceMaterial,
    headEcho,
  );
  const contourSegments = [];
  for (const side of [-1, 1]) {
    contourSegments.push(
      [
        [side * 0.06, 1.91, 0.091],
        [side * 0.18, 1.865, 0.121],
      ],
      [
        [side * 0.18, 1.865, 0.121],
        [side * 0.275, 1.86, 0.082],
      ],
      [
        [side * 0.209, 1.47, 0.025],
        [side * 0.245, 1.34, 0.022],
      ],
      [
        [side * 0.39, 1.39, 0.081],
        [side * 0.363, 1.22, 0.109],
      ],
    );
  }
  for (const segment of contourSegments) {
    for (const point of segment) point[0] *= 0.88;
  }
  lines(contourSegments, contourMaterial, body);

  function update(time, stress) {
    uniforms.echoTime.value = time;
    uniforms.echoStress.value = stress;
    const fade = Math.min(1, glass.opacity / (softwareMode ? .22 : 1));
    contourMaterial.opacity = (0.12 + stress * 0.07) * fade;
    faceMaterial.opacity = 0.62 * fade;
  }

  return { echo, body, headEcho, annaHair, glass, update, surfacePoint };
}
