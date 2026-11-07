(function () {
// Scroll world: from powder to verified decision, a scroll-driven three.js scene.
// three.js is loaded from a pinned CDN build only when the section approaches the viewport.
const section = document.getElementById('world');
const canvas = document.getElementById('worldCanvas');
const panels = [...document.querySelectorAll('.world-panel')];
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function fallback() { section.classList.add('static'); }

if (!section || !canvas || reduce || !window.WebGLRenderingContext) { if (section) fallback(); }
else {
  section.classList.remove('static');
  const io = new IntersectionObserver(async (es) => {
    if (!es.some(e => e.isIntersecting)) return;
    io.disconnect();
    try {
      const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
      start(THREE);
    } catch (e) { fallback(); }
  }, { rootMargin: '600px 0px' });
  io.observe(section);
}

function start(THREE) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { fallback(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xdfe8f5, 0x223044, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(4, 8, 6); scene.add(sun);

  // build plate
  const plate = new THREE.Mesh(new THREE.BoxGeometry(11, 0.5, 4.6), new THREE.MeshStandardMaterial({ color: 0x1b2a44, roughness: 0.6, metalness: 0.4 }));
  plate.position.y = -0.27; scene.add(plate);

  // powder particles (colored by radius, like the DEM output)
  const R = 0.12, cols = 38, rows = 15, layers = 2;
  const N = cols * rows * layers;
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.55 });
  const powder = new THREE.InstancedMesh(geo, mat, N);
  const target = [], start = [], rad = [], delay = [], base = [];
  const cLow = new THREE.Color(0x4f7fd9), cMid = new THREE.Color(0xf2efe9), cHigh = new THREE.Color(0xc0392b), tmp = new THREE.Color();
  let k = 0;
  for (let l = 0; l < layers; l++) for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const r = R * (0.65 + Math.random() * 0.6);
    const x = -4.8 + i * 0.26 + (Math.random() - 0.5) * 0.08 + (l ? 0.13 : 0);
    const z = -1.85 + j * 0.26 + (Math.random() - 0.5) * 0.08 + (l ? 0.13 : 0);
    const y = r + l * 0.2 + Math.random() * 0.03;
    target.push(new THREE.Vector3(x, y, z));
    start.push(new THREE.Vector3(x + (Math.random() - 0.5) * 1.2, y + 1.4 + Math.random() * 2.2, z + (Math.random() - 0.5) * 1.2));
    rad.push(r); delay.push((x + 4.8) / 9.6 * 0.55 + Math.random() * 0.25);
    const u = (r / R - 0.65) / 0.6;
    tmp.copy(u < 0.5 ? cLow.clone().lerp(cMid, u * 2) : cMid.clone().lerp(cHigh, (u - 0.5) * 2));
    base.push(tmp.clone()); powder.setColorAt(k, tmp); k++;
  }
  scene.add(powder);

  // recoater roller
  const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 4.8, 32), new THREE.MeshStandardMaterial({ color: 0x223a66, roughness: 0.4, metalness: 0.6 }));
  roller.rotation.x = Math.PI / 2; scene.add(roller);

  // laser beam, spot and melt track
  const laserMat = new THREE.MeshBasicMaterial({ color: 0xff7a45, transparent: true, opacity: 0.85 });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.06, 6, 12), laserMat); scene.add(beam);
  const spot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 16), new THREE.MeshBasicMaterial({ color: 0xffd08a })); scene.add(spot);
  const glow = new THREE.PointLight(0xff6a2a, 0, 4); scene.add(glow);
  const track = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.42), new THREE.MeshStandardMaterial({ color: 0x8a3b1d, emissive: 0xff5a1f, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.8 }));
  scene.add(track);

  // spatter droplets
  const SP = 140;
  const spMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb36b }), SP);
  const sp = []; for (let i = 0; i < SP; i++) sp.push({ b: 0.40 + Math.random() * 0.26, v: new THREE.Vector3((Math.random() - 0.6) * 1.6, 2.2 + Math.random() * 2.4, (Math.random() - 0.5) * 1.6) });
  scene.add(spMesh);

  // agents above the bed
  const agentGroup = new THREE.Group(); scene.add(agentGroup);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), new THREE.MeshStandardMaterial({ color: 0x0f1b2d, emissive: 0x157a8a, emissiveIntensity: 0.35, metalness: 0.3, roughness: 0.3 }));
  core.position.set(0, 4.2, 0); agentGroup.add(core);
  const nodes = [], lineMat = new THREE.LineBasicMaterial({ color: 0x3fb3c3, transparent: true, opacity: 0.7 });
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), new THREE.MeshStandardMaterial({ color: i < 3 ? 0xe0592a : 0x3fb3c3, emissive: i < 3 ? 0xe0592a : 0x157a8a, emissiveIntensity: 0.4 }));
    n.position.set(Math.cos(a) * 2.6, 3.4, Math.sin(a) * 1.4); agentGroup.add(n); nodes.push(n);
    agentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([core.position, n.position]), lineMat));
    agentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([n.position, new THREE.Vector3(n.position.x * 1.2, 0.3, n.position.z)]), lineMat));
  }
  const pulses = []; for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffb36b })); agentGroup.add(p); pulses.push(p); }

  // helpers
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = x => x * x * (3 - 2 * x);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3();
  const camA = new THREE.Vector3(0, 5.2, 10.5), camB = new THREE.Vector3(0, 2.7, 6.2), camC = new THREE.Vector3(0, 6.6, 10.5);
  const lookA = new THREE.Vector3(0, 0.6, 0), lookC = new THREE.Vector3(0, 2.2, 0);
  const cam = new THREE.Vector3(), look = new THREE.Vector3();

  function progress() {
    const r = section.getBoundingClientRect();
    return clamp(-r.top / (r.height - window.innerHeight));
  }
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w < 640 ? 55 : 40; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);

  let visible = false;
  new IntersectionObserver(es => es.forEach(e => visible = e.isIntersecting)).observe(section);

  function render(now) {
    requestAnimationFrame(render);
    if (!visible) return;
    const p = progress(), t = now / 1000;

    // stage 1: settle powder and sweep the roller (0 to 0.25)
    const s1 = seg(p, 0.0, 0.25);
    for (let i = 0; i < N; i++) {
      const f = smooth(clamp(s1 * 1.6 - delay[i]));
      P.lerpVectors(start[i], target[i], f);
      if (f < 1) P.y += Math.sin(f * Math.PI) * 0.2;
      S.setScalar(rad[i] * (0.25 + 0.75 * clamp(f * 3)));
      M.compose(P, Q, S); powder.setMatrixAt(i, M);
    }
    powder.instanceMatrix.needsUpdate = true;
    roller.position.set(-6 + 12 * s1, 0.55, 0); roller.rotation.y = 0; roller.visible = s1 < 1;

    // stage 2: laser scan (0.25 to 0.68)
    const s2 = seg(p, 0.25, 0.68), lx = -4.6 + 9.2 * s2, laserOn = p > 0.25 && p < 0.7;
    beam.visible = spot.visible = laserOn; glow.intensity = laserOn ? 6 : 0;
    beam.position.set(lx, 3.3, 0); spot.position.set(lx, 0.42, 0); glow.position.set(lx, 0.8, 0);
    spot.scale.setScalar(1 + 0.15 * Math.sin(t * 20));
    const len = Math.max(0.001, lx + 4.6); track.scale.x = len; track.position.set(-4.6 + len / 2, 0.38, 0); track.visible = p > 0.25;
    track.material.emissiveIntensity = 0.3 + 0.7 * (1 - seg(p, 0.68, 0.85));
    if (p > 0.25) {
      for (let i = 0; i < N; i++) {
        if (Math.abs(target[i].z) < 0.3 && target[i].x < lx) { tmp.set(0x6b2d17); powder.setColorAt(i, tmp); }
        else powder.setColorAt(i, base[i]);
      }
    } else for (let i = 0; i < N; i++) powder.setColorAt(i, base[i]);
    powder.instanceColor.needsUpdate = true;

    // stage 3: spatter (droplets born between 0.40 and 0.66)
    for (let i = 0; i < SP; i++) {
      const d = sp[i], age = (p - d.b) * 9;
      if (age <= 0 || age > 1.6) { S.setScalar(0); M.compose(P.set(0, -10, 0), Q, S); spMesh.setMatrixAt(i, M); continue; }
      const ox = -4.6 + 9.2 * seg(d.b, 0.25, 0.68);
      P.set(ox + d.v.x * age, 0.45 + d.v.y * age - 4.9 * age * age * 0.6, d.v.z * age);
      if (P.y < 0.3) P.y = 0.3;
      S.setScalar(1); M.compose(P, Q, S); spMesh.setMatrixAt(i, M);
    }
    spMesh.instanceMatrix.needsUpdate = true;

    // stage 4: agents appear above the bed (0.7 to 1)
    const s4 = smooth(seg(p, 0.68, 0.9));
    agentGroup.visible = s4 > 0.01;
    agentGroup.scale.setScalar(0.6 + 0.4 * s4); agentGroup.position.y = (1 - s4) * -1.5;
    lineMat.opacity = 0.7 * s4;
    pulses.forEach((q, i) => { const n = nodes[i]; const f = (t * 0.6 + i / 6) % 1; q.position.lerpVectors(core.position, n.position, f); q.visible = s4 > 0.5; });
    core.rotation.y = t * 0.4;

    // camera path
    if (p < 0.25) { cam.copy(camA); look.copy(lookA); }
    else if (p < 0.68) { const f = smooth(seg(p, 0.25, 0.35)); cam.lerpVectors(camA, camB.clone().setX(lx * 0.6 + 0.8), f); look.lerpVectors(lookA, new THREE.Vector3(lx * 0.8, 0.4, 0), f); }
    else { const f = smooth(seg(p, 0.68, 0.9)); cam.lerpVectors(camB.clone().setX(4.6 * 0.6 + 0.8), camC, f); look.lerpVectors(new THREE.Vector3(3.7, 0.4, 0), lookC, f); }
    camera.position.copy(cam); camera.lookAt(look);

    // panels
    const stage = p < 0.25 ? 0 : p < 0.45 ? 1 : p < 0.68 ? 2 : 3;
    panels.forEach((el, i) => el.classList.toggle('on', i === stage));
    renderer.render(scene, camera);
  }
  requestAnimationFrame(render);
  section.classList.add('live');
}

})();
