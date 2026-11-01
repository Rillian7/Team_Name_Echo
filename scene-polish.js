/**
 * ECHO / Відлуння — візуальне оформлення лабораторії.
 *
 * Тут створюються декоративні об'єкти сцени та їхня анімація:
 * стіни, таблички, архівні камери, деталі голограми й світлові ефекти.
 *
 * Усі об'єкти й текстури генеруються локально, без зовнішніх ресурсів.
 * Логіка гри залишається в game.js.
 */

export function createScenePolish(T, scene, api) {
  const {
    box,
    cyl,
    mesh,
    mat,
    light,
    echo,
    body,
    glass,
    shutters,
    hiddenEchoes,
    sideLights,
    hologram,
    equipment,
  } = api;

  // Матеріали лабораторії.
  const nickel = mat(0x76978a, 0.37, 0.64);
  const charcoal = mat(0x142923, 0.82, 0.2);
  const enamel = mat(0x3b584a, 0.74, 0.22);
  const brass = mat(0xa48c5f, 0.43, 0.58);

  // Напівпрозорі світлові акценти.
  const dimPhosphor = new T.MeshBasicMaterial({
    color: 0x8dbfaa,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });

  const signalAmber = new T.MeshBasicMaterial({
    color: 0xf4bc74,
    transparent: true,
    opacity: 0.76,
    depthWrite: false,
  });

  const signalRed = new T.MeshBasicMaterial({
    color: 0xef8b75,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });

  // Параметри ефектів змінюються іншими частинами гри через методи нижче.
  const fx = {
    archive: 0,
    archiveTarget: 0,
    stress: 0,
    stressTarget: 0,
    flash: 0,
    caseId: '018',
    listening: 0,
  };

  // ---------------------------------------------------------------------------
  // Таблички та службові екрани
  // ---------------------------------------------------------------------------

  function flatPanel(w, h, x, y, z, draw, resolution = 512) {
    const c = document.createElement('canvas');
    c.width = resolution;
    c.height = Math.round((resolution * h) / w);

    const g = c.getContext('2d');
    draw(g, c.width, c.height);

    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 4;

    const surface = new T.MeshBasicMaterial({
      map: tex,
      side: T.DoubleSide,
      transparent: false,
    });

    const plane = mesh(new T.PlaneGeometry(w, h), surface, x, y, z);
    plane.castShadow = false;

    return { plane, canvas: c, ctx: g, texture: tex };
  }

  const sign = (title, small, x, y, z, w = 1.4, h = 0.35) =>
    flatPanel(w, h, x, y, z, (g, W, H) => {
      g.fillStyle = '#142a23';
      g.fillRect(0, 0, W, H);

      g.fillStyle = '#a3bdab';
      g.fillRect(0, 0, W, 3);
      g.fillRect(0, H - 3, W, 2);

      g.fillStyle = '#cae9cf';
      g.font = `700 ${Math.round(H * 0.41)}px monospace`;
      g.fillText(title, 16, H * 0.54);

      g.fillStyle = '#719c86';
      g.font = `${Math.round(H * 0.19)}px monospace`;
      g.fillText(small, 16, H * 0.82);
    });

  // ---------------------------------------------------------------------------
  // Геометрія лабораторії: стіни, підлога, задня панель
  // ---------------------------------------------------------------------------

  // Технічні модулі на бічних стінах.
  for (const x of [-5.88, 5.88]) {
    for (let z = -6.4; z < 5.4; z += 1.35) {
      box(0.052, 0.82, 0.46, x, 3.37, z, charcoal);

      for (let i = 0; i < 5; i++) {
        box(0.058, 0.018, 0.35, x, 3.14 + i * 0.105, z, nickel);
      }
    }

    for (let z = -6; z < 5; z += 2.1) {
      box(0.15, 0.13, 0.32, x, 2.45, z, enamel);
    }
  }

  // Сигнальна розмітка на підлозі.
  const yellow = mat(0x907b55, 0.9, 0.03);

  for (let i = 0; i < 12; i++) {
    const z = -5.7 + i * 0.88;

    for (const x of [-3.37, 3.37]) {
      const mark = box(0.11, 0.009, 0.48, x, -0.039, z, yellow);
      mark.rotation.y = 0.48;
    }
  }

  // Напрямні навколо зони реконструкції.
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const p = box(0.055, 0.014, 1.05, s * (1.22 + i * 0.17), -0.031, -1.3, enamel);
      p.rotation.y = 0;
    }
  }

  // Багатошарові панелі задньої стіни.
  for (const x of [-4.75, -3.75, 3.75, 4.75]) {
    box(0.64, 2.52, 0.1, x, 1.45, -6.74, charcoal);
    box(0.49, 2.32, 0.018, x, 1.45, -6.67, enamel);

    for (let y = 0.5; y < 2.4; y += 0.38) {
      box(0.38, 0.02, 0.018, x, y, -6.65, nickel);
    }
  }

  sign('ECHO / UNIT 04', 'AUTHORIZED PERSONNEL ONLY', -4.05, 3.46, -6.63, 2.1, 0.42);

  // Службовий дисплей залишається прихованим, щоб не перекривати голограму.
  const readout = flatPanel(1.64, 0.53, -0.65, 2.85, -6.67, () => {});
  readout.plane.visible = false;

  function drawReadout(t = 0) {
    const g = readout.ctx;
    const W = readout.canvas.width;
    const H = readout.canvas.height;

    g.fillStyle = '#071711';
    g.fillRect(0, 0, W, H);

    g.strokeStyle = '#294d3d';
    for (let x = 0; x < W; x += 36) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, H);
      g.stroke();
    }

    g.fillStyle = '#b5dabe';
    g.font = '700 30px monospace';
    g.fillText(`SUBJECT ${fx.caseId}`, 22, 43);

    g.fillStyle = fx.stressTarget > 0.2 ? '#e6af87' : '#7cbb93';
    g.font = '20px monospace';
    g.fillText(fx.stressTarget > 0.2 ? 'SIGNAL DEVIATION' : 'RECONSTRUCTION ACTIVE', 22, 73);

    g.fillStyle = '#7da892';
    g.font = '15px monospace';
    g.fillText(`OP. 071    UNIT 04    ${Math.floor(t * 3) % 2 ? '●' : '○'}`, 22, 103);

    readout.texture.needsUpdate = true;
  }

  drawReadout();

  sign('BIO-MEMETIC ARRAY', 'DO NOT DISCONNECT', 2.05, 3.46, -6.67, 1.95, 0.35);

  // ---------------------------------------------------------------------------
  // Платформа реконструкції та архівні камери
  // ---------------------------------------------------------------------------

  // Кільця на підлозі. Додаткову рамку сканера колись прибрали,
  // щоб не перекривати голову персонажа.
  const platform = new T.Group();
  platform.position.set(0, 0.09, -1.3);
  scene.add(platform);

  for (const r of [0.77, 0.88, 0.98]) {
    const line = mesh(
      new T.TorusGeometry(r, 0.008, 5, 64),
      r === 0.88 ? signalAmber : dimPhosphor,
      0,
      0,
      0,
      platform,
    );
    line.rotation.x = Math.PI / 2;
    line.castShadow = false;
  }

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 2 * Math.PI;
    const o = box(0.13, 0.025, 0.04, Math.sin(a) * 0.93, 0.1, -1.3 + Math.cos(a) * 0.93, brass);
    o.rotation.y = a;
  }

  // Каркаси двох архівних камер.
  const shuttersOriginal = shutters.map((o) => o.position.y);

  for (const x of [-4.6, 4.6]) {
    const p = box(1.9, 3.05, 0.22, x, 2, 0.14, charcoal);

    // Центральна частина каркаса не повинна закривати прохід.
    p.visible = false;

    for (const s of [-1, 1]) {
      box(0.14, 3.1, 0.34, x + s * 0.88, 2.02, 0.14, nickel);

      for (let y = 0.62; y < 3.47; y += 0.32) {
        box(0.04, 0.04, 0.05, x + s * 0.88, y, 0.36, brass);
      }
    }

    box(1.9, 0.16, 0.34, x, 3.63, 0.14, nickel);
    box(1.9, 0.16, 0.34, x, 0.43, 0.14, nickel);

    const n = x < 0 ? '01' : '02';
    sign(`ARCHIVE ${n}`, 'ISOLATION BAY', x, 3.82, 0.37, 1.45, 0.26);
    box(0.25, 0.085, 0.11, x + 0.72, 0.42, 0.39, signalRed);
  }

  // Ребра прикріплені до заслінок і рухаються разом із ними.
  shutters.forEach((s, i) => {
    s.material = mat(0x1b2c25, 0.7, 0.38);

    for (let j = 0; j < 8; j++) {
      const rib = box(1.42, 0.055, 0.05, 0, -1.16 + j * 0.32, 0.092, j % 2 ? enamel : nickel, s);
      rib.castShadow = false;
    }
  });

  // ---------------------------------------------------------------------------
  // Patch 1 / fixed reconstruction hardware and operator equipment
  // ---------------------------------------------------------------------------

  const ceramic = mat(0x9aaf9b, 0.93, 0.04);
  const cableMaterial = mat(0x14221d, 0.94, 0.02);
  const emitter = new T.MeshBasicMaterial({ color: 0x799e8a });
  const standby = new T.MeshBasicMaterial({ color: 0xb39b68 });

  // A fixed gantry behind the subject. Nothing travels across the body or face.
  for (const side of [-1, 1]) {
    const x = side * 1.47;
    box(0.21, 2.8, 0.32, x, 1.42, -2.65, charcoal);
    box(0.052, 2.61, 0.36, x + side * 0.105, 1.45, -2.65, nickel);
    box(0.09, 2.48, 0.035, x - side * 0.025, 1.43, -2.464, enamel);
    for (let i = 0; i < 8; i++) {
      const y = 0.32 + i * 0.315;
      box(0.125, 0.16, 0.06, x - side * 0.025, y, -2.43, ceramic);
      box(0.058, 0.019, 0.009, x - side * 0.025, y, -2.395, emitter);
    }
    box(0.43, 0.11, 0.62, x, 0.055, -2.65, nickel);
    box(0.32, 0.13, 0.43, x, 2.87, -2.65, brass);
    box(0.065, 0.09, 2.9, x + side * 0.19, 0.03, -4.17, charcoal);
    for (let i = 0; i < 5; i++) {
      box(0.25, 0.055, 0.06, x + side * 0.19, 0.065, -3.05 - i * 0.58, nickel);
    }
  }
  box(3.13, 0.19, 0.32, 0, 2.99, -2.65, charcoal);
  box(2.66, 0.025, 0.027, 0, 2.94, -2.47, brass);

  // Back-wall instruments, kept to one side of the human silhouette.
  box(1.02, 1.17, 0.24, -2.1, 1.5, -6.65, charcoal);
  box(0.91, 1.05, 0.018, -2.1, 1.5, -6.515, enamel);
  for (let row = 0; row < 3; row++) {
    const y = 1.15 + row * 0.34;
    box(0.49, 0.205, 0.03, -2.21, y, -6.49, charcoal);
    box(0.27, 0.012, 0.012, -2.24, y, -6.466, emitter);
    cyl(0.045, 0.045, 0.025, -1.79, y, -6.47, brass, 10).rotation.x = Math.PI / 2;
    box(0.026, 0.026, 0.018, -1.92, y + 0.065, -6.46, standby);
  }

  // A single texture atlas for equipment/service labels.
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 512;
  labelCanvas.height = 256;
  const labelContext = labelCanvas.getContext('2d');
  labelContext.fillStyle = '#172a23';
  labelContext.fillRect(0, 0, 512, 256);
  const labels = [
    ['SIGNAL / 04', 'BIO-MEMETIC ARRAY'],
    ['INTERCOM / 071', 'CONTACT MICROPHONE'],
    ['RECONSTRUCTION', 'AUTHORIZED PERSONNEL ONLY'],
    ['CAUTION', 'DO NOT DISCONNECT'],
  ];
  labels.forEach(([title, subtitle], i) => {
    const y = i * 64;
    labelContext.fillStyle = '#afbc9f';
    labelContext.fillRect(12, y + 12, 3, 39);
    labelContext.font = '600 23px monospace';
    labelContext.fillText(title, 27, y + 29);
    labelContext.fillStyle = '#739281';
    labelContext.font = '12px monospace';
    labelContext.fillText(subtitle, 28, y + 49);
  });
  const labelTexture = new T.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = T.SRGBColorSpace;
  const labelMaterial = new T.MeshBasicMaterial({ map: labelTexture });
  function equipmentLabel(row, w, h, x, y, z, parent = scene) {
    const geometry = new T.PlaneGeometry(w, h);
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setY(i, (3 - row + uv.getY(i)) / 4);
    return mesh(geometry, labelMaterial, x, y, z, parent);
  }
  equipmentLabel(2, 0.96, 0.12, 0, 2.99, -2.478);
  equipmentLabel(3, 0.67, 0.085, -2.1, 2.19, -6.5);

  // Monitor frame, vent slots, feet and brass fasteners. Screen remains clear.
  const { mon, mic, dossier, control } = equipment;
  for (const side of [-1, 1]) {
    box(0.025, 0.56, 0.025, -0.065 + side * 0.435, 0.025, 0.312, nickel, mon);
    box(0.18, 0.035, 0.25, side * 0.34, -0.37, 0.02, charcoal, mon);
    for (const y of [-0.29, 0.29]) {
      cyl(0.012, 0.012, 0.009, side * 0.492, y, 0.282, brass, 6, mon).rotation.x = Math.PI / 2;
    }
  }
  for (let i = 0; i < 7; i++) {
    box(0.009, 0.2, 0.025, -0.38 + i * 0.105, 0.365, -0.04, charcoal, mon);
  }
  equipmentLabel(0, 0.55, 0.069, -0.09, -0.286, 0.282, mon);
  equipmentLabel(1, 0.4, 0.05, -0.04, -0.044, 0.198, mic);
  for (const side of [-1, 1]) {
    box(0.018, 0.045, 0.21, control.position.x + side * 0.279, 1.11, 2.6, brass);
  }
  // Clip and two corner tabs leave the existing dossier raycast plane intact.
  box(0.2, 0.015, 0.04, dossier.position.x, 1.047, 2.277, brass);
  for (const x of [-0.59, 0.09]) box(0.045, 0.012, 0.05, x, 1.046, 2.77, nickel);

  function cable(points, radius = 0.012) {
    const path = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p)));
    return mesh(new T.TubeGeometry(path, 20, radius, 5, false), cableMaterial, 0, 0, 0);
  }
  cable([
    [-1.36, 1.07, 1.68],
    [-1.85, 1.01, 1.7],
    [-1.94, 1.01, 2.28],
    [-1.66, 1.08, 2.6],
  ]);
  cable(
    [
      [1.8, 1.11, 1.58],
      [2.2, 1.01, 1.44],
      [2.47, 0.96, 1.4],
      [2.52, 0.15, 1.35],
    ],
    0.016,
  );
  cable([
    [0.83, 1.01, 2.73],
    [1.0, 1.01, 2.9],
    [0.96, 1.01, 3.02],
    [0.4, 1.01, 2.97],
  ]);

  // ---------------------------------------------------------------------------
  // Голограма: внутрішні шари та частинки
  // ---------------------------------------------------------------------------

  // The human surface and its selective contours live in hologram.js.
  // Avoid the previous overlapping skull/chest shells and polygon wireframes.
  // Створюємо маленьку текстуру з плавним світловим градієнтом.
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 128;
  glowCanvas.height = 128;

  const glowContext = glowCanvas.getContext('2d');

  const glowGradient = glowContext.createRadialGradient(64, 64, 0, 64, 64, 64);

  glowGradient.addColorStop(0, 'rgba(161,255,221,.64)');
  glowGradient.addColorStop(0.27, 'rgba(105,238,187,.25)');
  glowGradient.addColorStop(0.64, 'rgba(72,183,154,.08)');
  glowGradient.addColorStop(1, 'rgba(72,183,154,0)');

  glowContext.fillStyle = glowGradient;
  glowContext.fillRect(0, 0, 128, 128);

  const glowTexture = new T.CanvasTexture(glowCanvas);

  // Напівпрозорий матеріал із додаванням світла.
  const glowMaterial = (opacity) =>
    new T.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      opacity,
      blending: T.AdditiveBlending,
      depthWrite: false,
      side: T.DoubleSide,
    });

  // М'який ореол позаду голограми.
  const halo = mesh(new T.PlaneGeometry(2, 3.1), glowMaterial(0.32), 0, 1.37, -0.55, echo);

  // Світлова пляма на платформі під ногами.
  const projectorGlow = mesh(
    new T.PlaneGeometry(1.65, 1.65),
    glowMaterial(0.46),
    0,
    0.075,
    0,
    echo,
  );

  projectorGlow.rotation.x = -Math.PI / 2;

  // One bounded particle draw instead of 24 transparent tetrahedron draws.
  const moteCount = 24;
  const motePositions = new Float32Array(moteCount * 3);
  const moteHeights = new Float32Array(moteCount);
  for (let i = 0; i < moteCount; i++) {
    const angle = i * 2.399963;
    const radius = 0.44 + (i % 7) * 0.035;
    motePositions[i * 3] = Math.cos(angle) * radius;
    motePositions[i * 3 + 1] = moteHeights[i] = 0.24 + (i % 15) * 0.14;
    motePositions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const moteGeometry = new T.BufferGeometry();
  const moteAttribute = new T.BufferAttribute(motePositions, 3);
  moteAttribute.setUsage(T.DynamicDrawUsage);
  moteGeometry.setAttribute('position', moteAttribute);
  const moteMaterial = new T.PointsMaterial({
    color: 0xade2ce,
    size: 0.014,
    transparent: true,
    opacity: 0.27,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const motes = new T.Points(moteGeometry, moteMaterial);
  motes.frustumCulled = false;
  body.add(motes);

  // Фоновий пил: 120 точок у спільній геометрії.
  const dustCount = 120;
  const dustGeo = new T.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);

  let seed = 82;
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (random() - 0.5) * 10;
    dustPos[i * 3 + 1] = random() * 3.6;
    dustPos[i * 3 + 2] = -6 + random() * 9;
  }

  dustGeo.setAttribute('position', new T.BufferAttribute(dustPos, 3));

  const dustMat = new T.PointsMaterial({
    color: 0xa9c1ab,
    size: 0.022,
    transparent: true,
    opacity: 0.27,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const dust = new T.Points(dustGeo, dustMat);
  scene.add(dust);

  // Короткий імпульс при прослуховуванні (це інший, штатний ефект).
  const listeningRing = mesh(
    new T.TorusGeometry(0.47, 0.012, 6, 48),
    signalAmber.clone(),
    0,
    1.8,
    -1.3,
  );
  listeningRing.visible = false;
  listeningRing.castShadow = false;

  const skyLamp = light(0x74c8b6, 0, -0.8, 2.7, -2.2, 3.5);

  // ---------------------------------------------------------------------------
  // Керування ефектами з game.js
  // ---------------------------------------------------------------------------

  function setCase(id) {
    fx.caseId = id;
    drawReadout();
  }

  function setStress(value) {
    fx.stressTarget = value / 100;
    drawReadout();
    fx.flash = 1;
  }

  function setArchive(open) {
    fx.archiveTarget = open ? 1 : 0;
    fx.flash = 1.1;
  }

  function listenPulse() {
    fx.listening = 1;
    fx.flash = 0.23;
  }

  function flash() {
    fx.flash = 1;
  }

  // No allocations in the atmospheric update; narrative timing is external.
  const lerp = (a, b, k) => a + (b - a) * Math.min(1, k);
  function update(time, dt) {
    fx.archive = lerp(fx.archive, fx.archiveTarget, dt * 1.65);
    fx.stress = lerp(fx.stress, fx.stressTarget, dt * 3.5);
    fx.flash = Math.max(0, fx.flash - dt * 2.5);
    fx.listening = Math.max(0, fx.listening - dt * 0.55);

    // Відкриття заслінок і поява архівних фігур.
    for (let i = 0; i < shutters.length; i++) {
      const shutter = shutters[i];
      shutter.position.y = shuttersOriginal[i] + fx.archive * 3.1;
      shutter.visible = fx.archive < 0.995;
      hiddenEchoes[i].visible = fx.archive > 0.14 && echo.visible;
      sideLights[i].intensity = fx.archive * (8 + Math.sin(time * 1.5 + i) * 1.4);
    }

    if (fx.archive > 0.05) {
      for (let i = 0; i < hiddenEchoes.length; i++) {
        const other = hiddenEchoes[i];
        other.rotation.y = Math.sin(time * 0.35 + i) * 0.03;
        other.position.y = Math.sin(time * 0.7 + i * 2) * 0.012;
      }
    }

    const fade = Math.min(1, glass.opacity / 0.53);
    halo.material.opacity = (0.2 + Math.sin(time * 1.3) * 0.012 + fx.flash * 0.025) * fade;
    projectorGlow.material.opacity =
      (0.31 + Math.sin(time * 1.8) * 0.022 + fx.stress * 0.04) * fade;
    dimPhosphor.opacity = 0.19 + fx.stress * 0.08;
    glass.emissiveIntensity = 0.35 + fx.stress * 0.1 + fx.flash * 0.13;
    skyLamp.intensity = 3.4 + fx.stress * 1.4 + fx.flash * 1.8;
    moteMaterial.opacity = (0.2 + fx.stress * 0.13) * fade;
    hologram.update(time, fx.stress);

    // Upload this tiny 24-point buffer at 20 Hz, not on every animation frame.
    if (Math.floor(time * 20) !== Math.floor((time - dt) * 20)) {
      for (let i = 0; i < moteCount; i++) {
        motePositions[i * 3 + 1] = moteHeights[i] + Math.sin(time * 0.6 + i * 0.81) * 0.014;
      }
      moteAttribute.needsUpdate = true;
    }

    dust.rotation.y = Math.sin(time * 0.05) * 0.015;

    // Хвиля від інтеркому вмикається лише на час прослуховування.
    listeningRing.visible = fx.listening > 0.02;

    if (listeningRing.visible) {
      const f = 1 + (1 - fx.listening) * 0.9;
      listeningRing.scale.setScalar(f);
      listeningRing.material.opacity = 0.13 + fx.listening * 0.45;
    }

    // Оновлення текстури службового екрана двічі на секунду.
    if (readout.plane.visible && Math.floor(time * 2) !== Math.floor((time - dt) * 2)) {
      drawReadout(time);
    }
  }

  return {
    update,
    setCase,
    setStress,
    setArchive,
    listenPulse,
    flash,
    fx,
  };
}
