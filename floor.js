// Agentic factory floor: an illustrative animation of the verified-agent vision.
(function () {
  const svg = document.getElementById('floorSvg');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(e);
    return e;
  };
  const logEl = document.getElementById('floorLog');
  const capEl = document.getElementById('floorCaption');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- layout ----------
  const agents = {
    coord: { x: 500, y: 52, w: 190, h: 44, label: 'Coordinator agent', sub: 'plans, explains' },
    sched: { x: 120, y: 138, w: 150, h: 40, label: 'Scheduler' },
    qual: { x: 310, y: 138, w: 150, h: 40, label: 'Quality' },
    diag: { x: 500, y: 138, w: 150, h: 40, label: 'Diagnostics' },
    cost: { x: 690, y: 138, w: 150, h: 40, label: 'Cost and energy' },
    sec: { x: 880, y: 138, w: 150, h: 40, label: 'Security' }
  };
  const stations = {
    stamp: { x: 95, label: 'Stamping', sub: 'press tonnage' },
    weld: { x: 255, label: 'Welding', sub: 'ultrasonic' },
    am: { x: 415, label: 'AM cell', sub: 'LPBF' },
    cnc: { x: 575, label: 'CNC', sub: 'machining' },
    insp: { x: 735, label: 'Inspection', sub: 'vision model' },
    ship: { x: 895, label: 'Ship', sub: 'released parts' }
  };
  const SY = 300, SW = 132, SH = 86, CY = 420;

  // floor grid
  const grid = el('g', { class: 'fl-grid' });
  for (let x = 0; x <= 1000; x += 40) el('line', { x1: x, y1: 0, x2: x, y2: 560 }, grid);
  for (let y = 0; y <= 560; y += 40) el('line', { x1: 0, y1: y, x2: 1000, y2: y }, grid);

  // engineer
  const eng = el('g', { class: 'fl-eng', transform: 'translate(62,52)' });
  el('circle', { cx: 0, cy: -10, r: 9 }, eng);
  el('path', { d: 'M-15 18 C -15 4, 15 4, 15 18 Z' }, eng);
  const engT = el('text', { x: 0, y: 34, class: 'fl-small', 'text-anchor': 'middle' }, eng); engT.textContent = 'Engineer';
  el('line', { x1: 86, y1: 52, x2: 405, y2: 52, class: 'fl-link' });

  // tool band
  el('rect', { x: 20, y: 205, width: 960, height: 34, rx: 8, class: 'fl-band' });
  const bt = el('text', { x: 500, y: 227, class: 'fl-band-text', 'text-anchor': 'middle' });
  bt.textContent = 'Validated models as tools  ·  code decides  ·  every call logged and graded';

  // agent links
  const agentEls = {};
  for (const k of ['sched', 'qual', 'diag', 'cost', 'sec']) {
    el('line', { x1: 500, y1: 74, x2: agents[k].x, y2: 118, class: 'fl-link' });
    el('line', { x1: agents[k].x, y1: 158, x2: agents[k].x, y2: 205, class: 'fl-link' });
  }
  for (const k in agents) {
    const a = agents[k];
    const g = el('g', { class: 'fl-agent' + (k === 'coord' ? ' core' : '') });
    el('rect', { x: a.x - a.w / 2, y: a.y - a.h / 2, width: a.w, height: a.h, rx: 10 }, g);
    const t = el('text', { x: a.x, y: a.y + (a.sub ? -2 : 5), 'text-anchor': 'middle', class: 'fl-agent-text' }, g); t.textContent = a.label;
    if (a.sub) { const s = el('text', { x: a.x, y: a.y + 13, 'text-anchor': 'middle', class: 'fl-agent-sub' }, g); s.textContent = a.sub; }
    agentEls[k] = g;
  }

  // stations
  const stEls = {};
  for (const k in stations) {
    const s = stations[k];
    const g = el('g', { class: 'fl-station' });
    el('rect', { x: s.x - SW / 2, y: SY - SH / 2, width: SW, height: SH, rx: 12 }, g);
    const t = el('text', { x: s.x, y: SY - 18, 'text-anchor': 'middle', class: 'fl-st-text' }, g); t.textContent = s.label;
    const u = el('text', { x: s.x, y: SY - 4, 'text-anchor': 'middle', class: 'fl-small' }, g); u.textContent = s.sub;
    // mini signal
    const pts = []; for (let i = 0; i <= 20; i++) pts.push([s.x - 50 + i * 5, SY + 24 - 8 * Math.sin(i / 3 + s.x)]);
    const spark = el('polyline', { points: pts.map(p => p.join(',')).join(' '), class: 'fl-spark' }, g);
    const badge = el('text', { x: s.x + SW / 2 - 12, y: SY - SH / 2 + 18, 'text-anchor': 'middle', class: 'fl-badge' }, g); badge.textContent = '';
    el('line', { x1: s.x, y1: SY + SH / 2, x2: s.x, y2: CY - 10, class: 'fl-link' });
    stEls[k] = { g, spark, badge, base: pts };
  }

  // conveyor
  el('rect', { x: 40, y: CY - 10, width: 920, height: 20, rx: 10, class: 'fl-conv' });
  const convPath = el('path', { d: `M 45 ${CY} L 955 ${CY}`, fill: 'none', stroke: 'none' });

  // rework bin and robot
  el('rect', { x: 618, y: 486, width: 70, height: 40, rx: 6, class: 'fl-bin' });
  const binT = el('text', { x: 653, y: 542, 'text-anchor': 'middle', class: 'fl-small' }); binT.textContent = 'rework';
  const robot = el('g', { class: 'fl-robot', transform: 'translate(760,505)' });
  el('rect', { x: -20, y: 0, width: 40, height: 16, rx: 4 }, robot);
  const arm1 = el('g', {}, robot);
  el('rect', { x: -5, y: -54, width: 10, height: 56, rx: 5 }, arm1);
  const arm2 = el('g', { transform: 'translate(0,-50)' }, arm1);
  el('rect', { x: -4, y: -46, width: 8, height: 48, rx: 4 }, arm2);
  const grip = el('circle', { cx: 0, cy: -46, r: 6, class: 'fl-grip' }, arm2);
  const robT = el('text', { x: 820, y: 540, 'text-anchor': 'middle', class: 'fl-small' }); robT.textContent = 'robot in the loop';

  // AGV
  const agv = el('g', { class: 'fl-agv' });
  el('rect', { x: -22, y: -10, width: 44, height: 20, rx: 5 }, agv);
  el('circle', { cx: -12, cy: 12, r: 4 }, agv); el('circle', { cx: 12, cy: 12, r: 4 }, agv);
  const agvT = el('text', { x: 300, y: 545, 'text-anchor': 'middle', class: 'fl-small' }); agvT.textContent = 'material AGV';

  // shield (security)
  const shield = el('g', { class: 'fl-shield', transform: 'translate(960,186)', opacity: 0 });
  el('path', { d: 'M0 -16 L13 -10 L13 2 C13 11, 6 16, 0 19 C-6 16,-13 11,-13 2 L-13 -10 Z' }, shield);
  el('path', { d: 'M-6 1 L-1 6 L7 -4', class: 'fl-shield-check' }, shield);

  // layers for moving things
  const partsLayer = el('g', {});
  const pulseLayer = el('g', {});

  // ---------- parts on the conveyor ----------
  const L = convPath.getTotalLength();
  const parts = [];
  for (let i = 0; i < 9; i++) parts.push({ s: (i / 9) * L, el: el('circle', { r: 7, class: 'fl-part' }, partsLayer), bad: false, held: false });
  let speed = 55; // px per second

  // ---------- pulses ----------
  const pulses = [];
  function pulse(points, cls, dur) {
    const c = el('circle', { r: 5, class: 'fl-pulse ' + (cls || '') }, pulseLayer);
    pulses.push({ points, c, t0: performance.now(), dur: dur || 1100 });
  }
  const A = k => [agents[k].x, agents[k].y];
  const toStation = (ak, sk) => [[agents[ak].x, agents[ak].y + 20], [agents[ak].x, 222], [stations[sk].x, 222], [stations[sk].x, SY - SH / 2]];
  const fromStation = (sk, ak) => toStation(ak, sk).slice().reverse();
  const toCoord = ak => [[agents[ak].x, agents[ak].y - 20], [500, 74]];
  const coordToEng = () => [[405, 52], [86, 52]];

  function along(points, f) {
    let segs = [], tot = 0;
    for (let i = 1; i < points.length; i++) { const d = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]); segs.push(d); tot += d; }
    let target = f * tot;
    for (let i = 0; i < segs.length; i++) {
      if (target <= segs[i]) { const r = segs[i] ? target / segs[i] : 0; return [points[i][0] + r * (points[i + 1][0] - points[i][0]), points[i][1] + r * (points[i + 1][1] - points[i][1])]; }
      target -= segs[i];
    }
    return points[points.length - 1];
  }

  // ---------- state helpers ----------
  function setActive(keys) { for (const k in agentEls) agentEls[k].classList.toggle('active', keys.includes(k)); }
  function stState(k, cls, badge) {
    const s = stEls[k];
    s.g.classList.remove('warn', 'good', 'busy');
    if (cls) s.g.classList.add(cls);
    s.badge.textContent = badge || '';
  }
  function resetStations() { for (const k in stEls) { stState(k, null, ''); setDrift(k, 0); } }
  function setDrift(k, amt) {
    const s = stEls[k];
    s.spark.setAttribute('points', s.base.map((p, i) => [p[0], p[1] - amt * Math.max(0, i - 10) * 1.2].join(',')).join(' '));
  }
  let armTarget = 0, armAngle = 0, extIntruder = null;
  function log(text, who) {
    const li = document.createElement('li');
    li.innerHTML = (who ? '<b>' + who + '</b> ' : '') + text;
    logEl.prepend(li);
    while (logEl.children.length > 6) logEl.lastChild.remove();
  }

  // ---------- scenarios ----------
  const S = {
    production: {
      caption: 'Production: agents read every station, code computes the schedule, and the coordinator splits work by items so the line stays balanced.',
      steps: [
        [0, () => { setActive(['sched']); ['stamp', 'weld', 'cnc'].forEach(k => pulse(toStation('sched', k))); log('reads queue lengths from every station through tools.', 'Scheduler'); }],
        [1500, () => { stState('weld', 'warn', '⏳'); speed = 32; log('finds the welding cell is the bottleneck.', 'Code'); }],
        [3000, () => { setActive(['coord', 'sched']); pulse(toCoord('sched')); log('splits the batch across two cells: split the items, not the expertise.', 'Coordinator'); }],
        [4500, () => { pulse(toStation('sched', 'weld')); pulse(toStation('sched', 'am')); stState('weld', 'good', '✓'); stState('am', 'busy', '↻'); speed = 70; log('line rebalanced; flow restored.', 'Scheduler'); }],
        [6200, () => { pulse(coordToEng()); log('sees the plan and the reason for it.', 'Engineer'); }]
      ]
    },
    quality: {
      caption: 'Quality control: a vision model scores every part, the plant policy is applied in code, and the robot removes a held part. The agent explains; it never invents a number.',
      steps: [
        [0, () => { setActive(['qual']); pulse(fromStation('insp', 'qual')); log('inspection model scores each part as it passes.', 'Quality'); }],
        [1600, () => { const p = nearest(stations.insp.x); if (p) { p.bad = true; } stState('insp', 'warn', '!'); log('policy applied in code: HOLD this part.', 'Code'); }],
        [3000, () => { armTarget = 1; const p = parts.find(q => q.bad); if (p) { const pt = convPath.getPointAtLength(p.s); p.held = { t0: performance.now(), from: [pt.x, pt.y], to: [653, 500] }; } log('moves the held part to rework.', 'Robot'); }],
        [4800, () => { armTarget = 0; stState('insp', 'good', '✓'); setActive(['qual', 'coord']); pulse(toCoord('qual')); log('drafts the report; every claim links to a model output.', 'Quality'); }],
        [6400, () => { pulse(coordToEng()); log('reviews the hold and the evidence.', 'Engineer'); }]
      ]
    },
    diagnostics: {
      caption: 'Diagnosis: the monitor sees the signal drift, the agent localizes it to one phase of the cycle, and a verified fingerprint names the cause before parts go bad.',
      steps: [
        [0, () => { setActive(['diag']); driftOn = 'weld'; log('welding signal drifts from its normal.', 'Monitor'); }],
        [1600, () => { pulse(fromStation('weld', 'diag')); stState('weld', 'warn', '~'); log('localizes the change to one phase of the cycle.', 'Diagnostics'); }],
        [3200, () => { pulse(toStation('diag', 'weld')); log('fingerprint matches a verified root cause: tool wear.', 'Code'); }],
        [4800, () => { setActive(['diag', 'coord']); pulse(toCoord('diag')); pulse(coordToEng(), '', 1300); log('approves maintenance at the next changeover.', 'Engineer'); }],
        [6400, () => { driftOn = null; setDrift('weld', 0); stState('weld', 'good', '🔧'); log('tool changed; signal back to normal.', 'Welding cell'); }]
      ]
    },
    cost: {
      caption: 'Cost: code compares ship, hold and inspect for every part, and energy-heavy AM builds move to off-peak hours, with the trade-off shown to the engineer.',
      steps: [
        [0, () => { setActive(['cost']); ['am', 'insp', 'stamp'].forEach(k => pulse(fromStation(k, 'cost'))); log('reads energy, scrap and inspection costs.', 'Cost agent'); }],
        [1700, () => { stState('am', 'busy', '🌙'); log('AM build moved to off-peak hours.', 'Code'); }],
        [3200, () => { stState('insp', 'busy', '◎'); pulse(toStation('cost', 'insp')); log('inspection sampled where risk is high, not on every part.', 'Code'); }],
        [4800, () => { setActive(['cost', 'coord']); pulse(toCoord('cost')); pulse(coordToEng(), '', 1300); log('lower cost per good part; trade-off shown.', 'Coordinator'); }]
      ]
    },
    security: {
      caption: 'Security: models run on the plant\'s own hardware, and no command reaches a machine without a signed, logged tool call checked against policy in code.',
      steps: [
        [0, () => { setActive(['sec']); extIntruder = { x: 1010, y: 150, t0: performance.now() }; log('unknown command arrives from outside the plant network.', 'Network'); }],
        [1700, () => { pulse(toStation('sec', 'ship'), 'sec'); log('checks the request against the access policy.', 'Security'); }],
        [2900, () => { shield.setAttribute('opacity', 1); extIntruder = null; log('BLOCKED: no tool call without a signed, logged request.', 'Code'); }],
        [4500, () => { setActive(['sec', 'coord']); pulse(toCoord('sec')); pulse(coordToEng(), '', 1300); log('alert and audit trail sent; plant data stay on the floor.', 'Coordinator'); }],
        [6400, () => { shield.setAttribute('opacity', 0); }]
      ]
    },
    robot: {
      caption: 'Robot in the loop: the agent asks for a second look, the robot presents the part to the camera, code releases it, and the engineer can take over at any step.',
      steps: [
        [0, () => { setActive(['qual']); const p = nearest(stations.insp.x); if (p) p.bad = true; stState('insp', 'warn', '?'); log('requests a re-inspection of an uncertain part.', 'Quality'); }],
        [1500, () => { armTarget = 0.6; log('picks the part and presents it to the camera.', 'Robot'); }],
        [3200, () => { pulse(fromStation('insp', 'qual')); stState('insp', 'good', '✓'); parts.forEach(p => p.bad = false); log('new image passes; code releases the part.', 'Code'); }],
        [4600, () => { armTarget = 0; setActive(['qual', 'coord']); pulse(coordToEng()); log('can take over at any step.', 'Engineer'); }]
      ]
    }
  };

  function nearest(x) {
    let best = null, bd = 1e9;
    parts.forEach(p => { const pt = convPath.getPointAtLength(p.s); const d = Math.abs(pt.x - x); if (d < bd) { bd = d; best = p; } });
    return best;
  }

  let mode = 'production', modeT0 = 0, fired = 0, driftOn = null, playing = !reduce, lastT = performance.now();
  const CYCLE = 8200;
  function startMode(m) {
    mode = m; modeT0 = performance.now(); fired = 0; speed = 55; armTarget = 0; driftOn = null;
    shield.setAttribute('opacity', 0); extIntruder = null; parts.forEach(p => { p.bad = false; p.held = false; });
    resetStations(); setActive([]); logEl.innerHTML = '';
    capEl.textContent = S[m].caption;
    document.querySelectorAll('.floor-modes button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    if (!playing) S[m].steps.forEach(st => st[1]());
  }
  document.querySelectorAll('.floor-modes button').forEach(b => b.addEventListener('click', () => { autoCycle = false; startMode(b.dataset.mode); }));
  const playBtn = document.getElementById('floorPlay');
  let autoCycle = true;
  playBtn.addEventListener('click', () => { playing = !playing; playBtn.textContent = playing ? 'Pause' : 'Play'; playBtn.setAttribute('aria-pressed', String(!playing)); if (playing) { lastT = performance.now(); startMode(mode); } });
  playBtn.textContent = playing ? 'Pause' : 'Play';

  // pause when off-screen
  let visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => visible = e.isIntersecting), { threshold: 0.05 }).observe(svg);

  const order = ['production', 'quality', 'diagnostics', 'cost', 'security', 'robot'];
  function frame(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (playing && visible) {
      const t = now - modeT0;
      const steps = S[mode].steps;
      while (fired < steps.length && t >= steps[fired][0]) { steps[fired][1](); fired++; }
      if (t > CYCLE) { if (autoCycle) startMode(order[(order.indexOf(mode) + 1) % order.length]); else startMode(mode); }

      // parts
      parts.forEach(p => {
        if (p.held) {
          const f = Math.min(1, (now - p.held.t0) / 1400), e = f * f * (3 - 2 * f);
          p.el.setAttribute('cx', p.held.from[0] + (p.held.to[0] - p.held.from[0]) * e);
          p.el.setAttribute('cy', p.held.from[1] + (p.held.to[1] - p.held.from[1]) * e - Math.sin(Math.PI * f) * 60);
          p.el.classList.add('bad'); return;
        }
        p.s += speed * dt; if (p.s > L) { p.s -= L; p.bad = false; }
        const pt = convPath.getPointAtLength(p.s);
        p.el.setAttribute('cx', pt.x); p.el.setAttribute('cy', pt.y);
        p.el.classList.toggle('bad', p.bad);
      });
      // drift
      if (driftOn) setDrift(driftOn, Math.min(2, (t / 1600)));
      // pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const q = pulses[i]; const f = (now - q.t0) / q.dur;
        if (f >= 1) { q.c.remove(); pulses.splice(i, 1); continue; }
        const [x, y] = along(q.points, f); q.c.setAttribute('cx', x); q.c.setAttribute('cy', y);
      }
      // robot arm
      armAngle += (armTarget - armAngle) * Math.min(1, dt * 3);
      arm1.setAttribute('transform', `rotate(${12 - armAngle * 70})`);
      arm2.setAttribute('transform', `translate(0,-50) rotate(${-armAngle * 40})`);
      grip.classList.toggle('holding', armTarget > 0);
      // AGV
      const ax = 140 + (Math.sin(now / 2600) * 0.5 + 0.5) * 380;
      agv.setAttribute('transform', `translate(${ax},508)`);
      // intruder
      if (extIntruder) {
        const f = Math.min(1, (now - extIntruder.t0) / 2600);
        if (!extIntruder.c) extIntruder.c = el('rect', { width: 14, height: 14, rx: 3, class: 'fl-intruder' }, pulseLayer);
        extIntruder.c.setAttribute('x', 1010 - f * 60 - 7); extIntruder.c.setAttribute('y', 179);
      } else { pulseLayer.querySelectorAll('.fl-intruder').forEach(n => n.remove()); }
    }
    requestAnimationFrame(frame);
  }
  // initial static positions
  parts.forEach(p => { const pt = convPath.getPointAtLength(p.s); p.el.setAttribute('cx', pt.x); p.el.setAttribute('cy', pt.y); });
  agv.setAttribute('transform', 'translate(300,508)');
  startMode('production');
  requestAnimationFrame(frame);
})();
