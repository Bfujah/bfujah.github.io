// Olabode T. Ajenifujah, research website
(function () {
  const root = document.documentElement;

  // Theme toggle (remembers choice; falls back to system setting)
  const themeBtn = document.getElementById('themeBtn');
  themeBtn.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // Mobile menu
  const menuBtn = document.getElementById('menuBtn');
  const navlist = document.getElementById('navlist');
  menuBtn.addEventListener('click', () => {
    const open = navlist.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  navlist.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navlist.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false');
  }));

  // Project filters
  const pf = document.querySelectorAll('#projects .filter');
  const cards = document.querySelectorAll('#projectGrid .card');
  pf.forEach(btn => btn.addEventListener('click', () => {
    pf.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    const f = btn.dataset.f;
    cards.forEach(c => { c.hidden = !(f === 'all' || c.dataset.cat.split(' ').includes(f)); });
  }));

  // Publication filters
  const pubBtns = document.querySelectorAll('.pub-tabs .filter');
  const groups = document.querySelectorAll('[data-group]');
  pubBtns.forEach(btn => btn.addEventListener('click', () => {
    pubBtns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    const p = btn.dataset.p;
    groups.forEach(g => {
      let shown = 0;
      g.querySelectorAll('li').forEach(li => {
        const ok = p === 'all' || li.dataset.t.split(' ').includes(p);
        li.hidden = !ok; if (ok) shown++;
      });
      g.hidden = shown === 0;
    });
  }));

  // Project detail dialog
  const modal = document.getElementById('modal');
  const mTitle = document.getElementById('modalTitle');
  const mBody = document.getElementById('modalBody');
  let lastFocus = null;
  function openModal(id) {
    const tpl = document.getElementById(id);
    if (!tpl) return;
    const frag = tpl.content.cloneNode(true);
    const h = frag.querySelector('h3');
    mTitle.innerHTML = '';
    if (h) { mTitle.appendChild(h); }
    mBody.innerHTML = '';
    mBody.appendChild(frag);
    mBody.scrollTop = 0;
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
  }
  function closeModal() {
    if (typeof modal.close === 'function') modal.close(); else modal.removeAttribute('open');
    try { history.replaceState(null, '', '#projects'); } catch (e) {}
    if (lastFocus) lastFocus.focus();
  }
  cards.forEach(c => c.addEventListener('click', () => { lastFocus = c; openModal(c.dataset.modal); }));
  document.getElementById('modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  modal.addEventListener('cancel', e => { e.preventDefault(); closeModal(); });
  if (location.hash.startsWith('#p-')) openModal(location.hash.slice(1));

  // Reveal on scroll
  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  } else { els.forEach(el => el.classList.add('in')); }

  document.getElementById('yr').textContent = new Date().getFullYear();

  // Liquid-glass refraction only where SVG backdrop filters are supported (Chromium)
  try { const b = navigator.userAgentData && navigator.userAgentData.brands; if (b && b.some(x => /Chrom/.test(x.brand))) root.classList.add('refract'); } catch (e) {}

  // Scroll-world progress bar
  const world = document.getElementById('world'), bar = document.querySelector('.world-progress span');
  if (world && bar) window.addEventListener('scroll', () => {
    const r = world.getBoundingClientRect(); const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
    bar.style.height = (p * 100) + '%';
  }, { passive: true });

  // Card tilt on pointer move
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-3px)`;
      });
      c.addEventListener('pointerleave', () => { c.style.transform = ''; });
    });
  }
})();
