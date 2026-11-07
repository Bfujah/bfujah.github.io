// Molten pool with thermal memory: an arc moves over a plate in layered passes; heat stored in the
// workpiece accumulates, and the pool grows with it (2D canvas heat field, no libraries).
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GX = 72, GY = 40;

  function cmap(v) { // inferno-like: dark blue -> purple -> orange -> yellow
    const stops = [[0, [12, 18, 40]], [0.25, [70, 24, 110]], [0.5, [180, 50, 80]], [0.75, [245, 125, 30]], [1, [252, 240, 160]]];
    v = Math.max(0, Math.min(1, v));
    for (let i = 1; i < stops.length; i++) if (v <= stops[i][0]) {
      const [a, ca] = stops[i - 1], [b, cb] = stops[i], t = (v - a) / (b - a);
      return ca.map((c, k) => Math.round(c + (cb[k] - c) * t));
    }
    return stops[stops.length - 1][1];
  }

  function init(cv) {
    if (cv._pool) return; cv._pool = true;
    const ctx = cv.getContext('2d');
    const off = document.createElement('canvas'); off.width = GX; off.height = GY;
    const octx = off.getContext('2d'); const img = octx.createImageData(GX, GY);
    let heat = new Float32Array(GX * GY), tmp = new Float32Array(GX * GY);
    let W, H, tx, ty, pass, dir, bead = [], stored = 0, poolSize = 0, last = performance.now(), hold = 0;
    const big = cv.classList.contains('big');

    function reset() { heat.fill(0); pass = 0; dir = 1; tx = 6; ty = GY * 0.78; bead = [[]]; stored = 0; hold = 0; }
    function size() { const r = cv.getBoundingClientRect(); const d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
    size(); reset(); window.addEventListener('resize', size);

    function step(dt) {
      if (hold > 0) { hold -= dt; if (hold <= 0) reset(); }
      else {
        tx += dir * dt * 15;
        if (tx > GX - 6 || tx < 6) { pass++; dir = -dir; ty -= 4.2; bead.push([]); if (pass >= 7) hold = 1.6; }
        bead[bead.length - 1].push([tx, ty]);
      }
      // source
      if (hold <= 0) for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
        const gx = Math.round(tx + x), gy = Math.round(ty + y); if (gx < 0 || gy < 0 || gx >= GX || gy >= GY) continue;
        heat[gy * GX + gx] += dt * 5.5 * Math.exp(-(x * x + y * y) / 3);
      }
      // diffusion with slow cooling (the workpiece remembers heat)
      for (let it = 0; it < 2; it++) {
        for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) {
          const i = y * GX + x, l = x > 0 ? heat[i - 1] : heat[i], r = x < GX - 1 ? heat[i + 1] : heat[i], u = y > 0 ? heat[i - GX] : heat[i], d = y < GY - 1 ? heat[i + GX] : heat[i];
          tmp[i] = heat[i] + 0.18 * (l + r + u + d - 4 * heat[i]);
        }
        const t2 = heat; heat = tmp; tmp = t2;
      }
      let sum = 0; for (let i = 0; i < heat.length; i++) { heat[i] *= (1 - dt * 0.02); sum += heat[i]; }
      stored = Math.min(1, sum / (GX * GY * 0.22));
      const local = heat[Math.round(ty) * GX + Math.round(Math.max(0, Math.min(GX - 1, tx)))] || 0;
      poolSize += ((0.35 + 0.65 * Math.min(1, local * 0.9) + 0.4 * stored) - poolSize) * Math.min(1, dt * 3);
    }

    function draw(t) {
      for (let i = 0; i < heat.length; i++) { const c = cmap(Math.pow(Math.min(1, heat[i] * 1.6), 0.6)); img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255; }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, W, H);
      const sx = W / GX, sy = H / GY;
      // deposited beads
      ctx.lineCap = 'round';
      for (const b of bead) { if (b.length < 2) continue; ctx.strokeStyle = 'rgba(210,205,200,.35)'; ctx.lineWidth = sy * 1.3; ctx.beginPath(); b.forEach(([x, y], k) => k ? ctx.lineTo(x * sx, y * sy) : ctx.moveTo(x * sx, y * sy)); ctx.stroke(); }
      if (hold <= 0) {
        // molten pool: elongated behind the arc, larger as stored heat grows
        const px = tx * sx, py = ty * sy, rx = (10 + 22 * poolSize) * (W / 360), ry = (6 + 9 * poolSize) * (W / 360);
        const g = ctx.createRadialGradient(px - dir * rx * 0.3, py, 1, px - dir * rx * 0.3, py, rx);
        g.addColorStop(0, 'rgba(255,255,235,1)'); g.addColorStop(0.45, 'rgba(255,215,120,.95)'); g.addColorStop(1, 'rgba(255,140,40,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px - dir * rx * 0.3, py, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
        // arc glow and flicker
        const f = 0.8 + 0.2 * Math.sin(t / 40);
        const a = ctx.createRadialGradient(px, py, 0, px, py, 34 * f * (W / 360));
        a.addColorStop(0, 'rgba(200,225,255,.95)'); a.addColorStop(0.4, 'rgba(140,180,255,.35)'); a.addColorStop(1, 'rgba(140,180,255,0)');
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = a; ctx.beginPath(); ctx.arc(px, py, 34 * f * (W / 360), 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      }
      // two-state readout
      const fs = big ? 13 : 10, bw = big ? 150 : 96, x0 = 12, y0 = H - (big ? 46 : 34);
      ctx.font = `600 ${fs}px Inter, system-ui, sans-serif`;
      [['pool geometry', poolSize / 1.4, '#ffd27a'], ['stored heat', stored, '#ff7a45']].forEach(([lab, v, col], k) => {
        const y = y0 + k * (fs + 8);
        ctx.fillStyle = 'rgba(10,16,28,.55)'; ctx.fillRect(x0 - 4, y - fs, bw + 92 * (big ? 1.2 : 1), fs + 6);
        ctx.fillStyle = '#e9eef5'; ctx.fillText(lab, x0, y);
        const bx = x0 + (big ? 108 : 78);
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(bx, y - fs + 3, bw, fs - 4);
        ctx.fillStyle = col; ctx.fillRect(bx, y - fs + 3, bw * Math.max(0, Math.min(1, v)), fs - 4);
      });
      if (big) { ctx.fillStyle = 'rgba(233,238,245,.85)'; ctx.font = `500 12px Inter, system-ui, sans-serif`; ctx.fillText(`layer ${Math.min(pass + 1, 7)} · the same input makes a larger pool on a hotter workpiece`, 12, 22); }
    }

    let visible = true;
    new IntersectionObserver(es => es.forEach(e => visible = e.isIntersecting)).observe(cv);
    function loop(now) {
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      if (visible && cv.isConnected) { step(dt); draw(now); }
      if (cv.isConnected) requestAnimationFrame(loop);
    }
    if (reduce) { for (let i = 0; i < 400; i++) step(1 / 30); draw(0); } else requestAnimationFrame(loop);
  }

  function scan(root) { (root || document).querySelectorAll('canvas.pool-canvas').forEach(init); }
  scan();
  const mb = document.getElementById('modalBody');
  if (mb) new MutationObserver(() => scan(mb)).observe(mb, { childList: true });
})();
