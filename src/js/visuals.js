/* ---------- visuals: portraits, ambience, floating numbers ---------- */
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const AMB_TINT = {
  tut: '#3d3358',
  c1: '#4f4330',
  c2: '#1d4f4b',
  c3: '#3f2c68',
  c4: '#2c4f62',
  c5: '#1d4f3d',
  c6: '#665a1c',
  c7: '#2c5022',
  c8: '#4f3c58',
  az: '#64184f',
};
let ambFog = [];
function sizeCanvas(cv, scale) {
  const dpr = Math.min(2, window.devicePixelRatio || 1) * (scale || 1);
  const w = Math.max(1, Math.round(cv.clientWidth * dpr)),
    h = Math.max(1, Math.round(cv.clientHeight * dpr));
  if (cv.width !== w || cv.height !== h) {
    cv.width = w;
    cv.height = h;
    cv.dataset.drawn = '';
  }
}
function drawPortraits(t) {
  document.querySelectorAll('canvas.portrait').forEach(cv => {
    if (!cv.offsetParent) return;
    sizeCanvas(cv);
    const isStatic = cv.hasAttribute('data-static') || REDUCED || !cv.closest('#enemy, .splash, .hero');
    if (isStatic && cv.dataset.drawn) return;
    try {
      const c2 = cv.getContext('2d');
      drawCreature(c2, cv.width, cv.dataset.foe, isStatic ? 1.3 : t);
      if (cv.dataset.tint) {
        const tint = getComputedStyle(cv).getPropertyValue('--duo').trim() || '#c63f2b';
        c2.save();
        c2.globalCompositeOperation = 'source-atop';
        c2.globalAlpha = 0.72;
        c2.fillStyle = tint;
        c2.fillRect(0, 0, cv.width, cv.height);
        c2.restore();
      }
    } catch (e) {}
    cv.dataset.drawn = '1';
  });
}
function drawAmbient(t) {
  const cv = $('#amb');
  if (!cv) return;
  sizeCanvas(cv, 0.25);
  const c = cv.getContext('2d'),
    W = cv.width,
    H = cv.height;
  const tint = run && run.ch && AMB_TINT[run.ch.id] && $('#s-title').hidden ? AMB_TINT[run.ch.id] : '#2b3540';
  if (!ambFog.length)
    for (let i = 0; i < 8; i++)
      ambFog.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.25 + Math.random() * 0.35,
        s: (Math.random() - 0.5) * 0.012,
        p: Math.random() * 6,
      });
  c.clearRect(0, 0, W, H);
  ambFog.forEach(f => {
    const x = ((((f.x + t * f.s) % 1.4) + 1.4) % 1.4) - 0.2,
      y = f.y + Math.sin(t * 0.15 + f.p) * 0.04,
      r = f.r * Math.max(W, H);
    const g = c.createRadialGradient(x * W, y * H, 0, x * W, y * H, r);
    g.addColorStop(0, hexA(tint, 0.32));
    g.addColorStop(1, hexA(tint, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  });
  const v = c.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.25, W / 2, H * 0.5, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,.55)');
  c.fillStyle = v;
  c.fillRect(0, 0, W, H);
}
let lastFrame = 0,
  lastAmb = 0;
function frame(now) {
  // ~20 fps for the breathing portrait; the fog moves slowly, so it only redraws ~5 times a second
  if (now - lastFrame > 50 && !document.hidden) {
    lastFrame = now;
    const t = REDUCED ? 1.3 : now / 1000;
    drawPortraits(t);
    drawRelicIcons();
    if ((!REDUCED && now - lastAmb > 200) || !$('#amb').dataset.drawn) {
      lastAmb = now;
      drawAmbient(t);
      $('#amb').dataset.drawn = '1';
    }
  }
  requestAnimationFrame(frame);
}
if (window.requestAnimationFrame) requestAnimationFrame(frame);
function quake(n) {
  if (REDUCED) return;
  const b = document.body;
  b.classList.remove('quake', 'quake2');
  void b.offsetWidth;
  b.classList.add(n >= 2 ? 'quake2' : 'quake');
  setTimeout(() => b.classList.remove('quake', 'quake2'), 600);
}
function relicIcon(id, cls) {
  return `<canvas class="ricon ${cls || ''}" data-relic="${id}" aria-hidden="true"></canvas>`;
}
function drawRelicIcons() {
  document.querySelectorAll('canvas.ricon:not([data-drawn])').forEach(cv => {
    cv.dataset.drawn = '1';
    const art = window.RELIC_ART && window.RELIC_ART[cv.dataset.relic];
    if (art) {
      const im = new Image();
      im.onload = () => {
        cv.width = cv.height = 64;
        const g = cv.getContext('2d');
        g.clearRect(0, 0, 64, 64);
        g.imageSmoothingEnabled = true;
        g.imageSmoothingQuality = 'high';
        g.drawImage(im, 0, 0, 64, 64);
      };
      im.src = art;
      return;
    }
    try {
      const N = 16,
        t = document.createElement('canvas');
      t.width = t.height = N;
      const c = t.getContext('2d');
      c.font = '13px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(RELICS[cv.dataset.relic].icon, N / 2, N / 2 + 1);
      const src = c.getImageData(0, 0, N, N).data,
        M = N + 2,
        out = new ImageData(M, M);
      const on = (x, y) => x >= 0 && y >= 0 && x < N && y < N && src[(y * N + x) * 4 + 3] > 110;
      for (let y = 0; y < M; y++)
        for (let x = 0; x < M; x++) {
          const sx = x - 1,
            sy = y - 1,
            o = (y * M + x) * 4;
          if (on(sx, sy)) {
            const i = (sy * N + sx) * 4;
            for (let k = 0; k < 3; k++) out.data[o + k] = Math.round(src[i + k] / 42) * 42;
            out.data[o + 3] = 255;
          } else if (on(sx - 1, sy) || on(sx + 1, sy) || on(sx, sy - 1) || on(sx, sy + 1)) {
            out.data[o] = 12;
            out.data[o + 1] = 10;
            out.data[o + 2] = 14;
            out.data[o + 3] = 255;
          }
        }
      const m = document.createElement('canvas');
      m.width = m.height = M;
      m.getContext('2d').putImageData(out, 0, 0);
      cv.width = cv.height = M * 4;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(m, 0, 0, M * 4, M * 4);
    } catch (e) {}
  });
}
function floatNum(sel, text, kind) {
  const el = typeof sel === 'string' ? $(sel) : sel;
  if (!el || !el.offsetParent) return;
  const r = el.getBoundingClientRect(),
    s = document.createElement('span');
  s.className = 'fnum ' + (kind || '');
  s.textContent = text;
  s.style.left = r.left + r.width / 2 + (Math.random() - 0.5) * r.width * 0.3 + 'px';
  s.style.top = r.top + r.height * 0.35 + 'px';
  $('#fx').appendChild(s);
  setTimeout(() => s.remove(), 1100);
}
