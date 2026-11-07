// Shader gradient: an animated, theme-aware WebGL background for the hero (no libraries).
(function () {
  const canvas = document.getElementById('heroGradient');
  if (!canvas) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, alpha: true });
  if (!gl) { canvas.remove(); return; }

  const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
  const fs = `precision highp float;
  uniform vec2 r; uniform float t; uniform vec3 c1; uniform vec3 c2; uniform vec3 c3; uniform vec3 bg; uniform float a;
  vec3 hash3(vec2 p){ vec3 q = vec3(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)), dot(p,vec2(419.2,371.9))); return fract(sin(q)*43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
    float n00=dot(hash3(i).xy*2.-1., f), n10=dot(hash3(i+vec2(1,0)).xy*2.-1., f-vec2(1,0));
    float n01=dot(hash3(i+vec2(0,1)).xy*2.-1., f-vec2(0,1)), n11=dot(hash3(i+vec2(1,1)).xy*2.-1., f-vec2(1,1));
    return mix(mix(n00,n10,u.x), mix(n01,n11,u.x), u.y); }
  float fbm(vec2 p){ float s=0., w=.5; for(int i=0;i<5;i++){ s+=w*noise(p); p*=2.02; w*=.5; } return s; }
  void main(){
    vec2 uv = gl_FragCoord.xy / r; vec2 p = uv * vec2(r.x/r.y, 1.) * 1.6;
    float tt = t * .06;
    vec2 q = vec2(fbm(p + tt), fbm(p + vec2(5.2,1.3) - tt));
    vec2 w = vec2(fbm(p + 3.*q + vec2(1.7,9.2) + tt*1.3), fbm(p + 3.*q + vec2(8.3,2.8) - tt));
    float f = fbm(p + 2.5*w);
    vec3 col = mix(c1, c2, smoothstep(-.35, .45, f));
    col = mix(col, c3, smoothstep(.15, .7, length(w)) * .55);
    float fade = smoothstep(0., .9, uv.x) * .85 + .15;   // stronger on the right, behind the diagram
    gl_FragColor = vec4(mix(bg, col, a * fade), 1.);
  }`;
  function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(prog, n);
  const uR = U('r'), uT = U('t'), u1 = U('c1'), u2 = U('c2'), u3 = U('c3'), uBg = U('bg'), uA = U('a');

  const hex = h => { h = h.trim().replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  function colors() {
    const cs = getComputedStyle(document.documentElement);
    const dark = cs.getPropertyValue('--bg').trim().toLowerCase() !== '#ffffff';
    gl.uniform3fv(u1, hex(cs.getPropertyValue('--bg-alt')));
    gl.uniform3fv(u2, hex(cs.getPropertyValue('--teal')));
    gl.uniform3fv(u3, hex(cs.getPropertyValue('--accent')));
    gl.uniform3fv(uBg, hex(cs.getPropertyValue('--bg')));
    gl.uniform1f(uA, dark ? 0.55 : 0.38);
  }
  colors();
  new MutationObserver(colors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', colors);

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * 0.6; // render at reduced resolution; it is a soft gradient
    canvas.width = Math.max(1, canvas.clientWidth * dpr); canvas.height = Math.max(1, canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(uR, canvas.width, canvas.height);
  }
  size(); window.addEventListener('resize', size);
  let visible = true;
  new IntersectionObserver(es => es.forEach(e => visible = e.isIntersecting)).observe(canvas);
  const t0 = performance.now();
  function draw(now) {
    if (visible) { gl.uniform1f(uT, reduce ? 12 : (now - t0) / 1000); gl.drawArrays(gl.TRIANGLES, 0, 3); }
    if (!reduce) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
