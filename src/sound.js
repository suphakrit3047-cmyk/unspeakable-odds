// ===== Sound: soft, quiet, synthesised with Web Audio (no files) =====
// mode: 1 = sound effects on, 0 = muted (background music removed: it was harsh)
var SND = (function () {
  var ctx = null, master, sfx, mus, noiseBuf, musicNodes = null, bellTimer = 0;
  var mode = 1;
  try { var v = localStorage.getItem('abyss-dice-sound3'); if (v !== null) mode = +v ? 1 : 0; } catch (e) {}
  var ROOT = { tut: 98, c1: 87.3, c2: 73.4, c3: 82.4, c4: 65.4, c5: 55, c6: 92.5, c7: 61.7, c8: 69.3, az: 46.2, title: 55 };
  var MASTER = 0.32, MUSIC = 0.05;
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }
    master = ctx.createGain(); master.gain.value = mode ? MASTER : 0; master.connect(ctx.destination);
    // gentle low-pass on everything removes harsh highs
    var soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 3200; soft.Q.value = 0.5; soft.connect(master);
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -24; comp.ratio.value = 4; comp.connect(soft);
    sfx = ctx.createGain(); sfx.gain.value = 0.6; sfx.connect(comp);
    mus = ctx.createGain(); mus.gain.value = 0; mus.connect(comp);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.0, ctx.sampleRate);
    var ch = noiseBuf.getChannelData(0); for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    return true;
  }
  function now() { return ctx.currentTime; }
  function env(g, t0, a, peak, d) { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d); }
  function noise(t0, dur, freq, peak) {
    var s = ctx.createBufferSource(); s.buffer = noiseBuf;
    var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    var g = ctx.createGain(); env(g, t0, 0.003, peak, dur);
    s.connect(f); f.connect(g); g.connect(sfx); s.start(t0); s.stop(t0 + dur + 0.05);
  }
  function tone(t0, freq, dur, peak, freqTo, type) {
    var o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    if (freqTo) o.frequency.exponentialRampToValueAtTime(freqTo, t0 + dur);
    var g = ctx.createGain(); env(g, t0, 0.008, peak, dur);
    o.connect(g); g.connect(sfx); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function setMusic(on) {
    if (!ctx || !musicNodes) return;
    mus.gain.setTargetAtTime(on ? MUSIC : 0, now(), 0.8);
  }
  var LABEL = ['ปิดเสียง', 'เสียง: เปิด'];
  var api = {
    get on() { return mode > 0; },
    get mode() { return mode; },
    get label() { return LABEL[mode]; },
    unlock: function () { init(); },
    toggle: function () {
      mode = mode ? 0 : 1;
      try { localStorage.setItem('abyss-dice-sound3', String(mode)); } catch (e) {}
      if (init()) master.gain.setTargetAtTime(mode ? MASTER : 0, now(), 0.05);
      return mode > 0;
    },
    play: function (name, arg) {
      if (!mode || !init()) return;
      var fn = SFX[name]; if (fn) try { fn(now(), arg || 0); } catch (e) {}
    },
    music: function () { return; },
    _oldMusic: function (key, boss) {
      if (!init()) return;
      var root = ROOT[key] || 55, t = now();
      if (!musicNodes) {
        var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400; lp.Q.value = 0.7; lp.connect(mus);
        var oscs = [[1, 0.5], [1.5, 0.25], [2.002, 0.18]].map(function (o) {
          var os = ctx.createOscillator(); os.type = 'sine'; os.frequency.value = root * o[0]; var g = ctx.createGain(); g.gain.value = o[1];
          os.connect(g); g.connect(lp); os.start(); return { os: os, mul: o[0] };
        });
        musicNodes = { oscs: oscs, lp: lp, root: root };
        setMusic(mode === 2);
        var bell = function () {
          if (mode === 2 && ctx.state === 'running') {
            var scale = [2, 2.4, 3, 3.6, 4], f = musicNodes.root * scale[Math.floor(Math.random() * scale.length)], b = now();
            var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
            var g = ctx.createGain(); env(g, b, 0.05, 0.25, 4); o.connect(g); g.connect(mus); o.start(b); o.stop(b + 4.2);
          }
          bellTimer = setTimeout(bell, 9000 + Math.random() * 9000);
        };
        bellTimer = setTimeout(bell, 6000);
      }
      musicNodes.root = root;
      musicNodes.oscs.forEach(function (o) { o.os.frequency.setTargetAtTime(root * o.mul, t, 1.5); });
      musicNodes.lp.frequency.setTargetAtTime(boss ? 650 : 400, t, 1.5);
    },
  };
  var SFX = {
    ui: function (t) { tone(t, 520, 0.08, 0.05); },
    dice: function (t, n) { n = Math.min(n || 4, 4); for (var i = 0; i < n; i++) noise(t + i * 0.05 + Math.random() * 0.03, 0.04, 900, 0.12); },
    land: function (t, i) { tone(t, 210 + i * 12, 0.07, 0.05, 160); },
    hit: function (t, p) { var big = p >= 20; tone(t, big ? 120 : 150, big ? 0.35 : 0.22, big ? 0.32 : 0.22, 55); noise(t, 0.12, 500, big ? 0.18 : 0.1); },
    block: function (t) { tone(t, 330, 0.18, 0.08); tone(t, 495, 0.14, 0.04); },
    heal: function (t) { [523, 659].forEach(function (f, i) { tone(t + i * 0.08, f, 0.35, 0.06); }); },
    san: function (t) { tone(t, 440, 0.4, 0.05); tone(t + 0.1, 554, 0.4, 0.04); },
    poison: function (t) { tone(t, 220, 0.18, 0.06, 140); },
    mad: function (t) { tone(t, 196, 0.6, 0.07, 185); tone(t, 207.6, 0.6, 0.05, 196); },
    hurt: function (t, p) { tone(t, 110, 0.25, Math.min(0.28, 0.12 + p / 60), 60); },
    combo: function (t, lv) {
      var notes = [0, 4, 7, 12, 16], n = 2 + lv;
      for (var i = 0; i < n; i++) tone(t + i * 0.07, 330 * Math.pow(2, notes[i] / 12), 0.3, 0.07, null, 'triangle');
    },
    boss: function (t) { tone(t, 55, 1.6, 0.25, 45); tone(t, 82.4, 1.6, 0.12, 70); },
    win: function (t) { [392, 494, 587].forEach(function (f, i) { tone(t + i * 0.09, f, 0.35, 0.06, null, 'triangle'); }); },
    chapter: function (t) { [262, 330, 392, 523].forEach(function (f, i) { tone(t + i * 0.12, f, 0.9, 0.06, null, 'triangle'); }); },
    lose: function (t) { [220, 196, 165].forEach(function (f, i) { tone(t + i * 0.3, f, 0.8, 0.07); }); },
    coin: function (t) { tone(t, 880, 0.12, 0.04); tone(t + 0.06, 1175, 0.18, 0.035); },
    tick: function (t, k) { var f = 330 * Math.pow(2, Math.min(k, 10) * 2 / 12); tone(t, f, 0.14, 0.06, null, 'triangle'); },
  };
  return api;
})();
