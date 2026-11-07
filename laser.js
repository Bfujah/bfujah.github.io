// Hero animation: a laser scans a powder bed, melts a track and ejects spatter (2D canvas, no libraries).
(function () {
  const cv = document.getElementById('laserCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let bead = [], pause = 0, W = 0, H = 0, dpr = 1, bedY = 0, powder = [], spatter = [], sparks = [], track = [], lx = 0, dir = 1, last = performance.now();
  const rnd = (a, b) => a + Math.random() * (b - a);

  // size-coloured powder, like the DEM output (blue small, white medium, red large)
  function pcolor(u) {
    const lerp = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const lo = [79, 127, 217], mid = [235, 232, 226], hi = [192, 57, 43];
    const c = u < .5 ? lerp(lo, mid, u * 2) : lerp(mid, hi, (u - .5) * 2);
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }
  function build() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bedY = H * 0.6; powder = []; track = new Array(Math.ceil(W / 4)).fill(0); bead = new Array(Math.ceil(W / 4)).fill(0);
    const R = Math.max(5, W / 52);
    for (let layer = 0; layer < 5; layer++) {
      for (let x = rnd(0, R); x < W + R; x += R * rnd(1.55, 1.9)) {
        const r0 = R * rnd(0.6, 1.15);
        powder.push({ x, y: bedY + layer * R * 1.45 + rnd(-1.5, 1.5) + r0, r: r0, c: pcolor((r0 / R - .6) / .55), melt: 0 });
      }
    }
    lx = W * 0.12; dir = 1; spatter = []; sparks = [];
  }
  function heatAt(x) { return track[Math.max(0, Math.min(track.length - 1, Math.floor(x / 4)))] || 0; }

  function step(dt) {
    const speed = W * 0.10;
    if (pause > 0) { pause -= dt; if (pause <= 0) { build(); } }
    else { lx += speed * dt; dir = 1; if (lx > W * 0.94) { pause = 1.2; } }
    // deposit heat along the track
    const i0 = Math.floor(lx / 4);
    if (pause <= 0) for (let k = -3; k <= 3; k++) { const j = i0 + k; if (j >= 0 && j < track.length) { track[j] = Math.min(1, track[j] + dt * 5 * (1 - Math.abs(k) / 4)); bead[j] = 1; } }
    for (let j = 0; j < track.length; j++) track[j] = Math.max(0, track[j] - dt * 0.35);
    // powder near the spot melts (fades into the track)
    if (pause <= 0) for (const p of powder) if (p.y < bedY + p.r * 4 && Math.abs(p.x - lx) < p.r * 1.6) p.melt = Math.min(1, p.melt + dt * 4);
    // spatter: hot droplets ejected backward and upward by recoil pressure
    const rate = pause > 0 ? 0 : 75;
    for (let n = 0; n < rate * dt * rnd(0.5, 1.5); n++) {
      const ang = rnd(-Math.PI * 0.92, -Math.PI * 0.12) + (dir > 0 ? -0.25 : 0.25);
      const v = rnd(H * 0.45, H * 1.25);
      spatter.push({ x: lx + rnd(-4, 4), y: bedY - 2, vx: Math.cos(ang) * v * 0.7 - dir * rnd(10, 60), vy: Math.sin(ang) * v, r: rnd(1.5, 4), t: 0, life: rnd(0.9, 2.0) });
    }
    if (pause <= 0) for (let n = 0; n < 90 * dt; n++) sparks.push({ x: lx + rnd(-3, 3), y: bedY - rnd(0, 4), vx: rnd(-40, 40), vy: rnd(-120, -40), t: 0, life: rnd(0.15, 0.4) });
    const g = H * 1.6;
    for (const s of spatter) { s.t += dt; s.vy += g * dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.y > bedY - s.r) { s.y = bedY - s.r; s.vy *= -0.25; s.vx *= 0.5; } }
    for (const s of sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; }
    spatter = spatter.filter(s => s.t < s.life && s.x > -10 && s.x < W + 10);
    sparks = sparks.filter(s => s.t < s.life);
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    // substrate
    const sub = ctx.createLinearGradient(0, bedY + 20, 0, H);
    sub.addColorStop(0, 'rgba(27,42,68,.95)'); sub.addColorStop(1, 'rgba(15,27,45,1)');
    ctx.fillStyle = sub; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, bedY + 4, W, H - bedY, 14) : ctx.rect(0, bedY + 4, W, H - bedY); ctx.fill();
    // powder
    for (const p of powder) {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      const gr = ctx.createRadialGradient(p.x - p.r * .35, p.y - p.r * .35, p.r * .1, p.x, p.y, p.r);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, p.c); gr.addColorStop(1, 'rgba(10,18,30,.9)');
      ctx.fillStyle = gr; ctx.globalAlpha = 1 - p.melt * 0.85; ctx.fill();
    }
    ctx.globalAlpha = 1;
    // solidified bead (metallic) where the laser has passed
    for (let j = 0; j < bead.length; j++) {
      if (!bead[j]) continue; const x = j * 4;
      const g2 = ctx.createLinearGradient(0, bedY - 10, 0, bedY + 8);
      g2.addColorStop(0, '#e7e2da'); g2.addColorStop(.45, '#9a8f86'); g2.addColorStop(1, '#4a4440');
      ctx.fillStyle = g2; ctx.fillRect(x, bedY - 9, 4.5, 16);
    }
    // hot track
    for (let j = 0; j < track.length; j++) {
      const h = track[j]; if (h <= 0.01) continue;
      const x = j * 4;
      ctx.fillStyle = `rgba(${Math.round(120 + 135 * h)},${Math.round(60 + 120 * h * h)},${Math.round(30 + 40 * h * h * h)},${0.55 + 0.45 * h})`;
      ctx.fillRect(x, bedY - 9 - 4 * h, 4.5, 16 + 4 * h);
    }
    // melt pool glow
    const pool = ctx.createRadialGradient(lx, bedY, 2, lx, bedY, 46);
    pool.addColorStop(0, 'rgba(255,245,210,1)'); pool.addColorStop(0.25, 'rgba(255,170,80,.9)'); pool.addColorStop(1, 'rgba(255,90,30,0)');
    if (pause <= 0) { ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(lx, bedY + 2, 46, 20, 0, 0, Math.PI * 2); ctx.fill(); }
    // laser beam
    const beam = ctx.createLinearGradient(lx, 0, lx, bedY);
    beam.addColorStop(0, 'rgba(255,122,69,0)'); beam.addColorStop(0.6, 'rgba(255,122,69,.55)'); beam.addColorStop(1, 'rgba(255,220,170,.95)');
    if (pause <= 0) { ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(lx - 9, 0); ctx.lineTo(lx + 9, 0); ctx.lineTo(lx + 2.5, bedY); ctx.lineTo(lx - 2.5, bedY); ctx.closePath(); ctx.fill(); }
    // plume
    ctx.fillStyle = 'rgba(255,180,120,.10)'; ctx.beginPath(); ctx.ellipse(lx - dir * 10, bedY - 26, 22, 30, 0, 0, Math.PI * 2); ctx.fill();
    // sparks and spatter
    ctx.globalCompositeOperation = 'lighter';
    for (const s of sparks) { const a = 1 - s.t / s.life; ctx.fillStyle = `rgba(255,230,170,${a})`; ctx.fillRect(s.x, s.y, 1.6, 1.6); }
    for (const s of spatter) {
      const a = 1 - s.t / s.life, hot = Math.max(0, 1 - s.t / 0.7);
      ctx.strokeStyle = `rgba(255,${Math.round(140 + 90 * hot)},${Math.round(60 + 80 * hot)},${0.35 * a})`; ctx.lineWidth = s.r * 0.8;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.025, s.y - s.vy * 0.025); ctx.stroke();
      ctx.fillStyle = `rgba(255,${Math.round(150 + 100 * hot)},${Math.round(70 + 120 * hot)},${a})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  let visible = true;
  new IntersectionObserver(es => es.forEach(e => visible = e.isIntersecting)).observe(cv);
  function loop(now) {
    const dt = Math.min(0.04, (now - last) / 1000); last = now;
    if (visible) { step(dt); if (pause <= 0 || pause > 0) draw(now); }
    requestAnimationFrame(loop);
  }
  build(); window.addEventListener('resize', () => { build(); });
  if (reduce) { for (let i = 0; i < 90; i++) step(1 / 60); draw(0); }
  else requestAnimationFrame(loop);
})();
