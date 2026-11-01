/** Small original desk props referencing two ghost/night-shift games. */
export function addDeskEasterEggs(T, scene, { mesh, box, cyl, ball, mat, target }) {
  const bear = new T.Group();
  bear.name = 'Night-shift bear / nose honk';
  bear.position.set(-2.12, 1.01, 2.06);
  bear.rotation.y = 0.12;
  scene.add(bear);
  const fur = mat(0x97733e, 0.94), muzzle = mat(0xbda26a, 0.96);
  const black = mat(0x151b18, 0.82), purple = mat(0x665276, 0.8);
  ball(0.13, 0, 0.15, 0, fur, bear, 1).scale.set(0.88, 1.1, 0.8);
  ball(0.115, 0, 0.34, 0.01, fur, bear, 1);
  for (const side of [-1, 1]) {
    ball(0.048, side * 0.09, 0.43, 0.01, fur, bear, 1);
    ball(0.027, side * 0.09, 0.43, 0.047, muzzle, bear, 1);
    ball(0.055, side * 0.105, 0.06, 0.06, fur, bear, 1);
    ball(0.048, side * 0.135, 0.19, 0.01, fur, bear, 1).scale.y = 1.45;
    ball(0.015, side * 0.044, 0.36, 0.107, black, bear, 0);
    const tie = box(0.045, 0.03, 0.025, side * 0.024, 0.245, 0.105, purple, bear);
    tie.rotation.z = side * 0.3;
  }
  ball(0.057, 0, 0.305, 0.102, muzzle, bear, 1).scale.set(1.25, 0.65, 0.6);
  const nose = ball(0.026, 0, 0.326, 0.139, black, bear, 1);
  nose.scale.set(1.15, 0.72, 0.8);
  target(nose, 'bear');
  // A generous invisible hitbox keeps the tiny desk collectible usable.
  const hitMaterial = new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  target(mesh(new T.BoxGeometry(0.32, 0.51, 0.29), hitMaterial, 0, 0.25, 0.025, bear), 'bear');
  cyl(0.10, 0.10, 0.018, 0, 0.453, 0.01, black, 12, bear);
  cyl(0.065, 0.07, 0.09, 0, 0.502, 0.01, black, 12, bear);
  cyl(0.068, 0.07, 0.018, 0, 0.474, 0.01, purple, 12, bear);

  return { bear };
}
