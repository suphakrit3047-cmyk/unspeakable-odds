// ===== Procedural creature portraits (original designs, drawn on canvas) =====
var ARCH = {
  zoog: 'swarm', rat: 'beast', cultist: 'robed', ghoul: 'beast', ghoulPack: 'beast', ghoulKing: 'beast', corpse: 'wraith', ghast: 'beast',
  hybrid: 'fish', deep: 'fish', deepElite: 'fish', dagon: 'fish', hydra: 'fish',
  gaunt: 'wing', shantak: 'wing', spider: 'spider', leng: 'robed', gug: 'beast', moonbeast: 'blob', nyar: 'robed',
  elder: 'elder', migo: 'wing', penguin: 'penguin', shog: 'blob', shogKing: 'blob', polyp: 'wraith', spawn: 'tentacle', cthulhu: 'tentacle',
  mask: 'robed', actor: 'robed', ysign: 'robed', hali: 'wraith', hastur: 'robed',
  whip: 'swarm', druid: 'robed', witch: 'robed', child: 'tentacle', brood: 'tentacle', shub: 'tentacle',
  whateley: 'robed', wilbur: 'robed', colourFoe: 'void', dunwich: 'blob', yog: 'orbs',
  piper: 'robed', drummer: 'robed', azathoth: 'void', yith: 'cone', cat: 'cat',
};
// which portrait a summonable die uses
var DIE_ART = { cultA: 'cultA', cultB: 'cultB', colour: 'colourFoe', moon: 'moonbeast' };
ARCH.cultA = 'robed'; ARCH.cultB = 'robed';
var SPRITE_IMG = {};
function getSprite(k) {
  if (typeof SPRITES === 'undefined' || !SPRITES[k] || typeof Image === 'undefined') return null;
  var im = SPRITE_IMG[k];
  if (!im) { im = new Image(); im.onload = function () { document.querySelectorAll('canvas.portrait[data-foe="' + k + '"]').forEach(function (cv) { cv.dataset.drawn = ''; }); }; im.src = SPRITES[k]; SPRITE_IMG[k] = im; }
  return im;
}
var EXTRA_COL = { yith: '#8a7fb0', cat: '#2a2630' };
// per-creature tweaks
var LOOK = {
  gaunt: { faceless: true, horns: true }, shantak: { beak: true }, migo: { insect: true },
  leng: { horns: true }, nyar: { crown: 'pharaoh' }, mask: { mask: true }, actor: { book: true }, ysign: { sign: true },
  hastur: { crown: 'tatter', tall: true }, piper: { flute: true }, drummer: { drum: true }, witch: { hat: true },
  wilbur: { tall: true }, ghoulKing: { crown: 'spikes' }, dagon: { crown: 'fins' }, cthulhu: { wings: true },
  penguin: { pale: true, beak: true }, rat: { small: true }, dunwich: { faint: true }, child: { tree: true }, brood: { many: true },
  ghoulPack: { many: true }, zoog: { small: true }, gug: { vmaw: true },
};
function seeded(str) {
  var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return function () { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
function hexA(hex, a) {
  var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
}
function shade(hex, f) {
  var n = parseInt(hex.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
  var m = function (c) { return Math.max(0, Math.min(255, Math.round(f < 0 ? c * (1 + f) : c + (255 - c) * f))); };
  return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
}
function glowEye(c, x, y, r, col, open) {
  if (open < 0.08) { c.strokeStyle = col; c.lineWidth = r * 0.4; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.stroke(); return; }
  var g = c.createRadialGradient(x, y, 0, x, y, r * 3);
  g.addColorStop(0, hexA('#fff6d0', 0.9)); g.addColorStop(0.25, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3, 0, 7); c.fill();
  c.fillStyle = col; c.beginPath(); c.ellipse(x, y, r, r * 0.8 * open, 0, 0, 7); c.fill();
  c.fillStyle = '#0a0504'; c.beginPath(); c.ellipse(x, y, r * 0.18, r * 0.7 * open, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,250,230,.85)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.3 * open, r * 0.16, 0, 7); c.fill();
}
function bodyGrad(c, x, y, r, col) {
  var g = c.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r * 1.2);
  g.addColorStop(0, shade(col, 0.25)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.6)); return g;
}
function blink(t, seed) { var p = (t * 0.35 + seed * 7) % 4; return p < 0.12 ? Math.abs(p - 0.06) / 0.06 : 1; }

function drawCreature(c, S, key, t, opt) {
  opt = opt || {};
  var F = (typeof FOES !== 'undefined' && FOES[key]) || { col: EXTRA_COL[key] || '#888888' };
  var col = F.col, arch = ARCH[key] || 'blob', L = LOOK[key] || {}, rnd = seeded(key), boss = !!F.boss;
  var eye = '#ffd27a';
  c.save(); c.clearRect(0, 0, S, S);
  // aura
  var ag = c.createRadialGradient(S / 2, S * 0.55, 0, S / 2, S * 0.55, S * 0.55);
  ag.addColorStop(0, hexA(col, boss ? 0.45 : 0.28)); ag.addColorStop(1, hexA(col, 0));
  c.fillStyle = ag; c.fillRect(0, 0, S, S);
  if (boss) { // rune ring
    c.strokeStyle = hexA(col, 0.5); c.lineWidth = S * 0.006; c.setLineDash([S * 0.01, S * 0.02]);
    c.beginPath(); c.arc(S / 2, S / 2, S * 0.46, t * 0.1, t * 0.1 + 6.283); c.stroke(); c.setLineDash([]);
  }
  if (L.faint) c.globalAlpha = 0.45 + 0.2 * Math.sin(t * 1.3);
  var spr = getSprite(key);
  if (spr) {
    if (spr.complete && spr.naturalWidth) {
      var bob = Math.sin(t * 1.6 + rnd() * 6) * S * 0.01, sy = 1 + 0.014 * Math.sin(t * 1.6 + 1);
      var D = S * 0.88;
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.translate(S / 2, S * 0.96 + bob); c.scale(1, sy);
      c.drawImage(spr, -D / 2, -D, D, D);
    }
    c.restore(); return;
  }
  var u = S / 100, br = 1 + 0.025 * Math.sin(t * 1.6 + rnd() * 6);
  c.translate(S / 2, S / 2); c.scale(u, u);
  var A = DRAW[arch]; A(c, col, t, rnd, L, br, eye, boss);
  c.restore();
}
var DRAW = {
  beast: function (c, col, t, rnd, L, br, eye, boss) {
    var n = L.many ? 3 : 1;
    for (var k = 0; k < n; k++) {
      c.save();
      if (n > 1) { c.translate((k - 1) * 26, k === 1 ? -4 : 8); c.scale(k === 1 ? 0.8 : 0.62, k === 1 ? 0.8 : 0.62); }
      if (L.small) c.scale(0.7, 0.7);
      var col2 = L.pale ? '#c9d2d6' : col;
      c.save(); c.scale(1, br);
      // arms
      c.strokeStyle = shade(col2, -0.35); c.lineCap = 'round'; c.lineWidth = 7;
      for (var s = -1; s <= 1; s += 2) { c.beginPath(); c.moveTo(s * 16, 4); c.quadraticCurveTo(s * 30, 18 + Math.sin(t * 2 + s) * 3, s * 22, 34); c.stroke();
        c.lineWidth = 2.2; for (var cl = -1; cl <= 1; cl++) { c.beginPath(); c.moveTo(s * 22, 34); c.lineTo(s * 22 + cl * 4, 41); c.stroke(); } c.lineWidth = 7; }
      c.fillStyle = bodyGrad(c, 0, 14, 26, col2); c.beginPath(); c.ellipse(0, 14, 24, 21, 0, 0, 7); c.fill();
      c.restore();
      // head
      var hy = -12 + Math.sin(t * 1.6) * 1.2;
      c.fillStyle = bodyGrad(c, 0, hy, 15, col2);
      c.beginPath(); c.moveTo(-11, hy - 4); c.lineTo(-20, hy - 16); c.lineTo(-7, hy - 11); c.quadraticCurveTo(0, hy - 14, 7, hy - 11); c.lineTo(20, hy - 16); c.lineTo(11, hy - 4);
      c.quadraticCurveTo(10, hy + 8, 6, hy + 20); c.quadraticCurveTo(0, hy + 24, -6, hy + 20); c.quadraticCurveTo(-10, hy + 8, -11, hy - 4); c.fill();
      c.fillStyle = '#140b08'; c.beginPath(); c.ellipse(0, hy + 18, 3, 2, 0, 0, 7); c.fill();
      c.strokeStyle = hexA('#000000', 0.28); c.lineWidth = 1.2;
      for (var rb = 0; rb < 4; rb++) { c.beginPath(); c.arc(0, 4 + rb * 5, 13 - rb, 0.5, Math.PI - 0.5); c.stroke(); }
      if (L.beak) { c.fillStyle = '#d9a441'; c.beginPath(); c.moveTo(-4, hy + 4); c.lineTo(0, hy + 13); c.lineTo(4, hy + 4); c.fill(); }
      else if (L.vmaw) { c.fillStyle = '#1a0d0a'; c.beginPath(); c.ellipse(0, hy + 2, 3.5, 13 + Math.sin(t * 1.5) * 1.5, 0, 0, 7); c.fill();
        c.fillStyle = '#e8e0c8'; for (var v = -9; v <= 12; v += 3) { c.beginPath(); c.moveTo(-3, hy + v); c.lineTo(0, hy + v + 1.2); c.lineTo(-3, hy + v + 2.4); c.moveTo(3, hy + v); c.lineTo(0, hy + v + 1.2); c.lineTo(3, hy + v + 2.4); c.fill(); } }
      else { c.fillStyle = '#1a0d0a'; c.beginPath(); c.moveTo(-6, hy + 11); c.quadraticCurveTo(0, hy + 16 + Math.sin(t * 2) * 1.5, 6, hy + 11); c.closePath(); c.fill();
        c.fillStyle = '#e8e0c8'; for (var i = -5; i <= 4; i += 2.2) { c.beginPath(); c.moveTo(i, hy + 11); c.lineTo(i + 1, hy + 14); c.lineTo(i + 2, hy + 11); c.fill(); } }
      var bl = blink(t, rnd());
      if (L.vmaw) { glowEye(c, -9, hy - 3, 2.4, '#ff5a3a', bl); glowEye(c, 9, hy - 3, 2.4, '#ff5a3a', bl); }
      else { glowEye(c, -5, hy + 1, 2.4, '#ff5a3a', bl); glowEye(c, 5, hy + 1, 2.4, '#ff5a3a', bl); }
      c.restore();
    }
    if (L.crown === 'spikes') { c.fillStyle = '#c9a24a'; for (var j = -2; j <= 2; j++) { c.beginPath(); c.moveTo(j * 6 - 3, -32); c.lineTo(j * 6, -43 - (j === 0 ? 5 : 0)); c.lineTo(j * 6 + 3, -32); c.fill(); } }
  },
  fish: function (c, col, t, rnd, L, br, eye, boss) {
    var sw = Math.sin(t * 1.2) * 3;
    c.save(); c.rotate(sw * 0.01);
    // fins/spines
    c.fillStyle = hexA(shade(col, 0.2).replace('rgb', 'rgba').replace(')', ',1)'), 1);
    c.fillStyle = shade(col, 0.15);
    var spines = boss || L.crown ? 9 : 5;
    for (var i = 0; i < spines; i++) { var a = -2.4 + i * (1.7 / (spines - 1)); c.beginPath(); c.moveTo(Math.cos(a) * 14, -14 + Math.sin(a) * 14); c.lineTo(Math.cos(a) * (30 + (i % 2) * 6), -14 + Math.sin(a) * (30 + (i % 2) * 6)); c.lineTo(Math.cos(a + 0.18) * 14, -14 + Math.sin(a + 0.18) * 14); c.fill(); }
    // body
    c.fillStyle = bodyGrad(c, 0, 10, 30, col); c.beginPath(); c.ellipse(0, 12 * br, 20, 30 * br, 0, 0, 7); c.fill();
    // scales
    c.strokeStyle = hexA('#000000', 0.25); c.lineWidth = 0.8;
    for (var y = 0; y < 34; y += 5) for (var x = -14 + (y % 10 ? 2.5 : 0); x < 15; x += 5) { c.beginPath(); c.arc(x, y + 2, 2.4, 0.2, Math.PI - 0.2); c.stroke(); }
    // head
    c.fillStyle = bodyGrad(c, 0, -16, 17, col); c.beginPath(); c.ellipse(0, -16, 17, 14, 0, 0, 7); c.fill();
    // gills
    c.strokeStyle = shade(col, -0.5); c.lineWidth = 1.2;
    for (var g = 0; g < 3; g++) { c.beginPath(); c.arc(-15, -14 + g * 4, 4, -0.8, 0.8); c.stroke(); c.beginPath(); c.arc(15, -14 + g * 4, 4, Math.PI - 0.8, Math.PI + 0.8); c.stroke(); }
    // mouth
    c.fillStyle = '#081210'; c.beginPath(); c.moveTo(-11, -6); c.quadraticCurveTo(0, -12 - Math.sin(t * 2) * 1.5, 11, -6); c.quadraticCurveTo(0, -1, -11, -6); c.fill();
    c.fillStyle = '#d8e8e0'; for (var tt = -8; tt <= 7; tt += 3) { c.beginPath(); c.moveTo(tt, -7.5); c.lineTo(tt + 1.2, -4.5); c.lineTo(tt + 2.4, -7.5); c.fill(); }
    var bl = blink(t, rnd());
    glowEye(c, -11, -19, 4.2, '#b8f0d8', bl); glowEye(c, 11, -19, 4.2, '#b8f0d8', bl);
    // arms
    c.strokeStyle = shade(col, -0.3); c.lineWidth = 5; c.lineCap = 'round';
    for (var s = -1; s <= 1; s += 2) { c.beginPath(); c.moveTo(s * 17, 4); c.quadraticCurveTo(s * 32, 16 - sw, s * 28, 30); c.stroke(); }
    c.restore();
  },
  wing: function (c, col, t, rnd, L, br, eye, boss) {
    var f = Math.sin(t * 3.2) * 0.35;
    for (var s = -1; s <= 1; s += 2) {
      c.save(); c.scale(s, 1); c.rotate(-f);
      c.fillStyle = hexA('#000000', 0.001); c.fillStyle = shade(col, -0.35);
      c.beginPath(); c.moveTo(6, -6); c.lineTo(44, -30); c.lineTo(40, -12); c.lineTo(46, 0); c.lineTo(36, 4); c.lineTo(38, 16); c.lineTo(10, 8); c.closePath(); c.fill();
      c.strokeStyle = shade(col, 0.15); c.lineWidth = 1.4;
      [[44, -30], [46, 0], [38, 16]].forEach(function (p) { c.beginPath(); c.moveTo(6, -4); c.lineTo(p[0], p[1]); c.stroke(); });
      c.restore();
    }
    c.fillStyle = bodyGrad(c, 0, 4, 14, col); c.beginPath(); c.ellipse(0, 6 * br, 11, 20 * br, 0, 0, 7); c.fill();
    if (L.insect) { c.strokeStyle = shade(col, -0.4); c.lineWidth = 1.5; for (var i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-10, i * 6 - 2); c.lineTo(10, i * 6 - 2); c.stroke(); } }
    // tail
    c.strokeStyle = shade(col, -0.2); c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, 24); c.quadraticCurveTo(10 * Math.sin(t * 2), 38, -4, 44); c.stroke();
    // head
    c.fillStyle = bodyGrad(c, 0, -18, 10, col); c.beginPath(); c.ellipse(0, -18, 9, 10, 0, 0, 7); c.fill();
    if (L.horns) { c.strokeStyle = shade(col, 0.3); c.lineWidth = 2.5; for (var h = -1; h <= 1; h += 2) { c.beginPath(); c.moveTo(h * 5, -25); c.quadraticCurveTo(h * 14, -34, h * 9, -42); c.stroke(); } }
    if (L.beak) { c.fillStyle = shade(col, 0.35); c.beginPath(); c.moveTo(-4, -14); c.lineTo(0, -2); c.lineTo(4, -14); c.fill(); }
    if (L.insect) { c.fillStyle = '#d98ad0'; for (var k = 0; k < 6; k++) { c.beginPath(); c.arc(-6 + (k % 3) * 6, -22 + Math.floor(k / 3) * 5, 2, 0, 7); c.fill(); } }
    if (!L.faceless && !L.insect) { var bl = blink(t, rnd()); glowEye(c, -3.5, -19, 2, eye, bl); glowEye(c, 3.5, -19, 2, eye, bl); }
  },
  tentacle: function (c, col, t, rnd, L, br, eye, boss) {
    var n = L.many ? 11 : boss ? 9 : 7;
    // wings for the great dreamer
    if (L.wings) for (var s = -1; s <= 1; s += 2) {
      c.save(); c.scale(s, 1); c.rotate(-0.1 * Math.sin(t)); c.fillStyle = shade(col, -0.45);
      c.beginPath(); c.moveTo(14, -16); c.lineTo(48, -42); c.lineTo(44, -22); c.lineTo(50, -12); c.lineTo(30, -6); c.closePath(); c.fill(); c.restore();
    }
    // tentacles
    for (var i = 0; i < n; i++) {
      var x0 = -16 + (32 * i) / (n - 1), ph = i * 1.3 + rnd() * 2, len = 34 + rnd() * 12;
      var grad = c.createLinearGradient(x0, 6, x0, 6 + len); grad.addColorStop(0, shade(col, -0.1)); grad.addColorStop(1, shade(col, -0.6));
      c.strokeStyle = grad; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0, 6);
      var px = x0, py = 6;
      for (var k = 1; k <= 8; k++) { var yy = 6 + (len * k) / 8, xx = x0 + (x0 * 0.5 * k) / 8 + Math.sin(t * 1.8 + ph + k * 0.6) * (k * 1.1); c.lineWidth = 6 - k * 0.6; c.lineTo(xx, yy); c.stroke(); c.beginPath(); c.moveTo(xx, yy); }
      if (L.tree) { c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0, 20); c.lineTo(x0 + 6, 14); c.stroke(); }
    }
    // head mass
    var hg = bodyGrad(c, 0, -10, 28, col);
    c.fillStyle = hg; c.beginPath();
    for (var a = 0; a <= 6.3; a += 0.3) { var r = (L.tree ? 18 : 24) + Math.sin(a * 3 + t) * 1.5; var x = Math.cos(a) * r, y = -10 + Math.sin(a) * r * 0.9 * br; a === 0 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.fill();
    if (L.tree) { c.strokeStyle = shade(col, -0.5); c.lineWidth = 2; for (var b = 0; b < 5; b++) { var ang = -2.6 + b * 0.5; c.beginPath(); c.moveTo(Math.cos(ang) * 16, -10 + Math.sin(ang) * 16); c.lineTo(Math.cos(ang) * 34, -10 + Math.sin(ang) * 36); c.stroke(); } }
    var eyes = boss ? 3 : L.many ? 4 : 2, bl = blink(t, rnd());
    for (var e = 0; e < eyes; e++) { var ex = (e - (eyes - 1) / 2) * (eyes > 2 ? 10 : 12), ey = -12 + (e % 2) * (eyes > 2 ? 5 : 0); glowEye(c, ex, ey, boss ? 3.6 : 3, boss ? '#ff9a6a' : eye, bl); }
    if (L.many || boss) { c.fillStyle = '#140808'; c.beginPath(); c.ellipse(0, 4, 3 + Math.sin(t * 1.5), 6, 0, 0, 7); c.fill(); }
  },
  blob: function (c, col, t, rnd, L, br, eye, boss) {
    var R0 = boss ? 34 : 28, pts = 40;
    var bumps = []; for (var b = 0; b < 6; b++) bumps.push([rnd() * 6.28, 1 + rnd() * 2, rnd() * 4]);
    c.fillStyle = bodyGrad(c, 0, 4, R0, col); c.beginPath();
    for (var i = 0; i <= pts; i++) {
      var a = (i / pts) * 6.283, r = R0;
      bumps.forEach(function (bb) { r += Math.sin(a * bb[1] + t * 0.9 + bb[2]) * 2.2; });
      var x = Math.cos(a) * r, y = 6 + Math.sin(a) * r * 0.82;
      i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.fill();
    // drips
    c.fillStyle = shade(col, -0.3);
    for (var d = 0; d < 4; d++) { var dx = -18 + d * 12, dl = 6 + ((t * 4 + d * 3) % 10); c.beginPath(); c.ellipse(dx, 28 + dl / 2, 2.5, dl / 2 + 2, 0, 0, 7); c.fill(); }
    var n = boss ? 14 : 9;
    for (var e = 0; e < n; e++) {
      var ea = rnd() * 6.28, er = rnd() * (R0 - 8), sz = 1.5 + rnd() * 3, ph = rnd() * 9;
      glowEye(c, Math.cos(ea + t * 0.05) * er, 6 + Math.sin(ea + t * 0.05) * er * 0.8, sz, e % 3 ? eye : '#e6f0ff', blink(t, ph));
    }
  },
  robed: function (c, col, t, rnd, L, br, eye, boss) {
    var sway = Math.sin(t * 1.1) * 2, tall = L.tall ? 1.15 : 1;
    c.save(); c.scale(1, tall);
    // robe
    var rg = c.createLinearGradient(0, -30, 0, 46); rg.addColorStop(0, shade(col, -0.1)); rg.addColorStop(1, shade(col, -0.7));
    c.fillStyle = rg; c.beginPath(); c.moveTo(0, -38); c.quadraticCurveTo(18, -30, 16, -10); c.lineTo(28 + sway, 44);
    var tat = L.crown === 'tatter';
    for (var x = 28; x >= -28; x -= 7) c.lineTo(x + sway, 44 + (tat ? ((x / 7) % 2 ? 7 : 0) + Math.sin(t * 2 + x) * 2 : 0));
    c.lineTo(-16, -10); c.quadraticCurveTo(-18, -30, 0, -38); c.fill();
    // hood opening
    c.fillStyle = '#07060a'; c.beginPath(); c.ellipse(0, -18, 9, 11, 0, 0, 7); c.fill();
    if (L.mask) { c.fillStyle = '#e8e2cc'; c.beginPath(); c.ellipse(0, -18, 7, 9, 0, 0, 7); c.fill(); c.fillStyle = '#07060a'; c.beginPath(); c.ellipse(-2.8, -20, 1.4, 2, 0, 0, 7); c.ellipse(2.8, -20, 1.4, 2, 0, 0, 7); c.fill(); }
    else { var bl = blink(t, rnd()); glowEye(c, -3.5, -19, 1.8, boss ? '#ffe070' : eye, bl); glowEye(c, 3.5, -19, 1.8, boss ? '#ffe070' : eye, bl); }
    // headgear
    if (L.horns) { c.strokeStyle = '#d8cfb4'; c.lineWidth = 2.2; for (var h = -1; h <= 1; h += 2) { c.beginPath(); c.moveTo(h * 8, -32); c.quadraticCurveTo(h * 18, -40, h * 12, -48); c.stroke(); } }
    if (L.hat) { c.fillStyle = '#16101c'; c.beginPath(); c.moveTo(-18, -32); c.lineTo(18, -32); c.lineTo(4, -56); c.closePath(); c.fill(); }
    if (L.crown === 'pharaoh') { c.fillStyle = '#c9a24a'; c.beginPath(); c.moveTo(-10, -34); c.lineTo(0, -60); c.lineTo(10, -34); c.closePath(); c.fill(); c.fillStyle = '#2a1a40'; c.fillRect(-1.5, -56, 3, 20); }
    if (tat) { c.fillStyle = '#e0c040'; c.beginPath(); for (var k = 0; k < 5; k++) { var a = -1.57 + k * 1.2566; c.lineTo(Math.cos(a) * 6, -48 + Math.sin(a) * 6); a += 0.628; c.lineTo(Math.cos(a) * 2.5, -48 + Math.sin(a) * 2.5); } c.fill(); }
    c.restore();
    // hands + items
    c.fillStyle = '#cdbfa6';
    c.beginPath(); c.arc(-12, 8, 3, 0, 7); c.arc(12, 8, 3, 0, 7); c.fill();
    if (L.flute) { c.strokeStyle = '#d8c48a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-12, 8); c.lineTo(14, -10); c.stroke(); }
    if (L.drum) { c.fillStyle = '#5a3a2a'; c.beginPath(); c.ellipse(0, 16, 14, 6, 0, 0, 7); c.fill(); c.fillStyle = '#d8c8a0'; c.beginPath(); c.ellipse(0, 12, 14, 5, 0, 0, 7); c.fill(); }
    if (L.book) { c.fillStyle = '#8a1a1a'; c.fillRect(-8, 4, 16, 11); c.fillStyle = '#e0c040'; c.fillRect(-1, 4, 2, 11); }
    if (L.sign || L.crown === 'tatter' || (!L.flute && !L.drum && !L.book)) {
      var gl = c.createRadialGradient(0, 8, 0, 0, 8, 12); gl.addColorStop(0, L.sign || L.crown === 'tatter' ? 'rgba(240,210,70,.95)' : hexA(eye, 0.8)); gl.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gl; c.beginPath(); c.arc(0, 8, 12 + Math.sin(t * 2) * 1.5, 0, 7); c.fill();
      if (L.sign) { c.strokeStyle = '#3a2a00'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-4, 4); c.quadraticCurveTo(4, 6, -2, 10); c.quadraticCurveTo(5, 12, 3, 14); c.moveTo(1, 3); c.lineTo(5, 8); c.stroke(); }
    }
  },
  penguin: function (c, col, t, rnd, L, br, eye, boss) {
    for (var k = 0; k < 3; k++) {
      c.save(); c.translate((k - 1) * 24, k === 1 ? 0 : 10); var sc = k === 1 ? 1 : 0.75; c.scale(sc, sc); c.rotate(Math.sin(t * 1.4 + k) * 0.06);
      c.fillStyle = '#c4ccd0'; c.beginPath(); c.ellipse(0, 6, 14, 24 * br, 0, 0, 7); c.fill();
      c.fillStyle = '#eef3f4'; c.beginPath(); c.ellipse(0, 10, 9, 18, 0, 0, 7); c.fill();
      c.fillStyle = '#a8b2b6'; c.beginPath(); c.ellipse(-14, 8, 4, 12, 0.3, 0, 7); c.ellipse(14, 8, 4, 12, -0.3, 0, 7); c.fill();
      c.fillStyle = '#c99a4a'; c.beginPath(); c.moveTo(-3, -10); c.lineTo(0, -3); c.lineTo(3, -10); c.fill();
      c.fillStyle = '#8a969a'; c.beginPath(); c.ellipse(-5, -12, 2.2, 1.2, 0, 0, 7); c.ellipse(5, -12, 2.2, 1.2, 0, 0, 7); c.fill();
      c.restore();
    }
  },
  cone: function (c, col, t, rnd, L, br, eye, boss) {
    // ridged cone body
    var g = c.createLinearGradient(-22, 0, 22, 0); g.addColorStop(0, shade(col, -0.5)); g.addColorStop(0.5, shade(col, 0.15)); g.addColorStop(1, shade(col, -0.5));
    c.fillStyle = g; c.beginPath(); c.moveTo(-6, -8); c.lineTo(6, -8); c.lineTo(24, 44); c.quadraticCurveTo(0, 50, -24, 44); c.closePath(); c.fill();
    c.strokeStyle = hexA('#000000', 0.3); c.lineWidth = 1;
    for (var i = 0; i < 6; i++) { var y = -2 + i * 8, w = 7 + i * 3; c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(0, y + 3, w, y); c.stroke(); }
    // four limbs from the apex
    var limbs = [[-1, -0.9, 'claw'], [1, -0.9, 'claw'], [-1, -1.6, 'trumpet'], [1, -1.6, 'head']];
    limbs.forEach(function (lb, k) {
      var sw = Math.sin(t * 1.4 + k) * 4, ex = lb[0] * (26 + (lb[2] === 'head' ? -6 : 0)) + sw, ey = lb[1] * 26 - 6;
      c.strokeStyle = shade(col, -0.2); c.lineWidth = 3.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(lb[0] * 3, -8); c.quadraticCurveTo(lb[0] * 8, ey + 10, ex, ey); c.stroke();
      if (lb[2] === 'claw') { c.lineWidth = 2; c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + lb[0] * 5, ey - 5); c.moveTo(ex, ey); c.lineTo(ex + lb[0] * 6, ey + 2); c.stroke(); }
      if (lb[2] === 'trumpet') { c.fillStyle = shade(col, 0.3); c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex - 6, ey - 6); c.lineTo(ex + 4, ey - 8); c.closePath(); c.fill(); }
      if (lb[2] === 'head') { c.fillStyle = bodyGrad(c, ex, ey, 7, col); c.beginPath(); c.ellipse(ex, ey, 7, 6, 0, 0, 7); c.fill();
        var bl = blink(t, rnd()); glowEye(c, ex - 3, ey - 1, 1.6, '#c8b0ff', bl); glowEye(c, ex + 2, ey - 2, 1.6, '#c8b0ff', bl); glowEye(c, ex, ey + 2, 1.3, '#c8b0ff', bl); }
    });
  },
  cat: function (c, col, t, rnd, L, br, eye, boss) {
    // tail
    c.strokeStyle = '#1c1820'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(14, 36); c.quadraticCurveTo(34, 30 + Math.sin(t * 1.5) * 6, 28 + Math.sin(t * 1.5) * 4, 10); c.stroke();
    // body
    c.fillStyle = bodyGrad(c, 0, 22, 20, '#2a2630'); c.beginPath(); c.ellipse(0, 24 * br, 17, 20 * br, 0, 0, 7); c.fill();
    // head
    c.fillStyle = bodyGrad(c, 0, -8, 14, '#2a2630');
    c.beginPath(); c.moveTo(-13, -4); c.lineTo(-13, -22); c.lineTo(-5, -14); c.lineTo(5, -14); c.lineTo(13, -22); c.lineTo(13, -4); c.quadraticCurveTo(13, 8, 0, 9); c.quadraticCurveTo(-13, 8, -13, -4); c.fill();
    var bl = blink(t, rnd());
    glowEye(c, -5, -6, 3, '#9ef08a', bl); glowEye(c, 5, -6, 3, '#9ef08a', bl);
    c.fillStyle = '#c87a8a'; c.beginPath(); c.moveTo(-1.5, 0); c.lineTo(1.5, 0); c.lineTo(0, 2); c.fill();
    c.strokeStyle = hexA('#e8e0d0', 0.4); c.lineWidth = 0.6;
    for (var w = -1; w <= 1; w += 2) for (var k = 0; k < 3; k++) { c.beginPath(); c.moveTo(w * 4, 1 + k); c.lineTo(w * 15, -1 + k * 3); c.stroke(); }
    // moon behind
    c.globalCompositeOperation = 'destination-over';
    var mg = c.createRadialGradient(0, -14, 0, 0, -14, 34); mg.addColorStop(0, 'rgba(240,230,190,.35)'); mg.addColorStop(1, 'rgba(240,230,190,0)');
    c.fillStyle = mg; c.beginPath(); c.arc(0, -14, 34, 0, 7); c.fill();
    c.globalCompositeOperation = 'source-over';
  },
  spider: function (c, col, t, rnd, L, br, eye, boss) {
    c.strokeStyle = shade(col, -0.3); c.lineCap = 'round';
    for (var s = -1; s <= 1; s += 2) for (var i = 0; i < 4; i++) {
      var a0 = -0.9 + i * 0.55, tw = Math.sin(t * 3 + i + s) * 0.08;
      var kx = s * (22 + i * 3), ky = -16 + i * 12, ex = s * (40 + (i % 2) * 4), ey = 6 + i * 12;
      c.lineWidth = 3.4; c.beginPath(); c.moveTo(s * 8, i * 4); c.lineTo(kx, ky + tw * 30); c.lineTo(ex, ey); c.stroke();
    }
    c.fillStyle = bodyGrad(c, 0, 18, 18, col); c.beginPath(); c.ellipse(0, 18 * br, 16, 18 * br, 0, 0, 7); c.fill();
    c.strokeStyle = hexA('#000000', 0.3); c.lineWidth = 1; c.beginPath(); c.moveTo(-6, 10); c.lineTo(0, 30); c.lineTo(6, 10); c.stroke();
    c.fillStyle = bodyGrad(c, 0, -4, 11, col); c.beginPath(); c.ellipse(0, -4, 11, 9, 0, 0, 7); c.fill();
    var bl = blink(t, rnd());
    [[-5, -6, 2.4], [5, -6, 2.4], [-2, -9, 1.6], [2, -9, 1.6], [-8, -3, 1.3], [8, -3, 1.3]].forEach(function (e) { glowEye(c, e[0], e[1], e[2], '#ff6a8a', bl); });
  },
  wraith: function (c, col, t, rnd, L, br, eye, boss) {
    c.globalAlpha *= 0.9;
    var g = c.createLinearGradient(0, -36, 0, 46); g.addColorStop(0, hexA(col, 0.95)); g.addColorStop(1, hexA(col, 0));
    c.fillStyle = g; c.beginPath(); c.moveTo(0, -38);
    c.bezierCurveTo(26, -36, 22, 0, 30 + Math.sin(t) * 4, 44);
    for (var x = 30; x >= -30; x -= 5) c.lineTo(x + Math.sin(t * 2 + x * 0.3) * 3, 40 + Math.sin(t * 3 + x) * 5);
    c.bezierCurveTo(-22, 0, -26, -36, 0, -38); c.fill();
    c.strokeStyle = hexA('#ffffff', 0.12); c.lineWidth = 1;
    for (var i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-14 + i * 7, -10); c.quadraticCurveTo(-14 + i * 7 + Math.sin(t + i) * 5, 14, -16 + i * 8, 38); c.stroke(); }
    c.fillStyle = '#05070a'; c.beginPath(); c.ellipse(-6, -20, 4, 6, 0.1, 0, 7); c.ellipse(6, -20, 4, 6, -0.1, 0, 7); c.fill();
    glowEye(c, -6, -19, 1.2, '#bfe8ff', 1); glowEye(c, 6, -19, 1.2, '#bfe8ff', 1);
    c.fillStyle = '#05070a'; c.beginPath(); c.ellipse(0, -6, 3, 5 + Math.sin(t * 2) * 1.5, 0, 0, 7); c.fill();
  },
  swarm: function (c, col, t, rnd, L, br, eye, boss) {
    var n = 14;
    for (var i = 0; i < n; i++) {
      var a = rnd() * 6.28 + t * (0.3 + rnd() * 0.5) * (i % 2 ? 1 : -1), r = 8 + rnd() * 30;
      var x = Math.cos(a) * r, y = Math.sin(a) * r * 0.7 + Math.sin(t * 3 + i) * 2, sz = 3 + rnd() * 3;
      c.fillStyle = bodyGrad(c, x, y, sz * 1.4, col); c.beginPath(); c.ellipse(x, y, sz * 1.4, sz, 0, 0, 7); c.fill();
      c.strokeStyle = shade(col, -0.4); c.lineWidth = 1;
      var fl = Math.sin(t * 12 + i) * sz;
      c.beginPath(); c.moveTo(x - sz, y); c.lineTo(x - sz * 2.2, y - fl); c.moveTo(x + sz, y); c.lineTo(x + sz * 2.2, y - fl); c.stroke();
      glowEye(c, x + sz * 0.5, y - sz * 0.2, sz * 0.32, eye, 1);
    }
  },
  orbs: function (c, col, t, rnd, L, br, eye, boss) {
    var n = 11;
    for (var i = 0; i < n; i++) {
      var a = i * 2.4 + t * 0.25 * (i % 2 ? 1 : -0.7), r = 6 + (i % 4) * 9, x = Math.cos(a) * r, y = Math.sin(a) * r * 0.85, sz = 6 + ((i * 7) % 5) * 1.6 + Math.sin(t * 2 + i) * 1.2;
      var g = c.createRadialGradient(x - sz * 0.3, y - sz * 0.3, 0, x, y, sz * 1.6);
      g.addColorStop(0, '#fff7ff'); g.addColorStop(0.3, hexA(col, 0.95)); g.addColorStop(1, hexA(col, 0));
      c.fillStyle = g; c.beginPath(); c.arc(x, y, sz * 1.6, 0, 7); c.fill();
      c.strokeStyle = hexA('#ffffff', 0.5); c.lineWidth = 0.8; c.beginPath(); c.arc(x, y, sz, 0, 7); c.stroke();
    }
  },
  void: function (c, col, t, rnd, L, br, eye, boss) {
    var arms = boss ? 7 : 4;
    for (var k = 0; k < arms; k++) {
      c.strokeStyle = 'hsla(' + ((k * 50 + t * 40) % 360) + ',80%,65%,.55)'; c.lineWidth = boss ? 3 : 2;
      c.beginPath();
      for (var s = 0; s < 60; s++) { var a = k * (6.283 / arms) + s * 0.12 + t * 0.6, r = s * 0.75; var x = Math.cos(a) * r, y = Math.sin(a) * r; s ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    }
    var cg = c.createRadialGradient(0, 0, 0, 0, 0, 16); cg.addColorStop(0, '#000'); cg.addColorStop(0.7, '#000'); cg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = cg; c.beginPath(); c.arc(0, 0, 16, 0, 7); c.fill();
    if (boss) for (var e = 0; e < 5; e++) { var a2 = e * 1.256 + t * 0.4; glowEye(c, Math.cos(a2) * 30, Math.sin(a2) * 30, 2.4, '#ff8ae0', blink(t, e * 1.7)); }
    else glowEye(c, 0, 0, 3, '#e8b0ff', blink(t, rnd()));
  },
  elder: function (c, col, t, rnd, L, br, eye, boss) {
    // folded wings
    c.strokeStyle = shade(col, -0.35); c.lineWidth = 3;
    for (var s = -1; s <= 1; s += 2) { c.beginPath(); c.moveTo(s * 12, -6); c.quadraticCurveTo(s * (30 + Math.sin(t) * 2), 6, s * 16, 30); c.stroke(); }
    // barrel
    c.fillStyle = bodyGrad(c, 0, 8, 22, col); c.beginPath(); c.ellipse(0, 8, 15, 26 * br, 0, 0, 7); c.fill();
    c.strokeStyle = hexA('#000000', 0.3); c.lineWidth = 1.2;
    for (var r = -2; r <= 2; r++) { c.beginPath(); c.ellipse(r * 5, 8, 2, 24, 0, 0, 7); c.stroke(); }
    // star head
    c.save(); c.translate(0, -26); c.rotate(Math.sin(t * 0.8) * 0.15);
    c.fillStyle = shade(col, 0.25);
    for (var k = 0; k < 5; k++) { c.save(); c.rotate(k * 1.2566); c.beginPath(); c.moveTo(-3, 0); c.quadraticCurveTo(0, -16 - Math.sin(t * 2 + k) * 2, 3, 0); c.fill(); glowEye(c, 0, -13 - Math.sin(t * 2 + k) * 2, 1.4, '#ff5040', blink(t, k)); c.restore(); }
    c.beginPath(); c.arc(0, 0, 5, 0, 7); c.fill();
    c.restore();
    // tentacle feet
    c.strokeStyle = shade(col, -0.2); c.lineWidth = 2;
    for (var f = 0; f < 5; f++) { c.beginPath(); c.moveTo(-8 + f * 4, 32); c.quadraticCurveTo(-12 + f * 6 + Math.sin(t * 2 + f) * 3, 40, -14 + f * 7, 46); c.stroke(); }
  },
};
