// Per-chapter tuner using snapshots of runs entering each chapter.
const S = require('./sim.js');
const D = require('../src/data/data.js');
const ORDER = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'];
const target = process.env.TGT ? JSON.parse(process.env.TGT) : [0.9, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5];
const N = +process.env.N || 600;
const TB = { c1: 6.5, c2: 7.5, c3: 8, c4: 8, c5: 8.5, c6: 7, c7: 8, c8: 8.5 },
  TN = 4;
const CH = id => D.CHAPTERS.find(c => c.id === id);
const PRE = process.env.PRE ? JSON.parse(process.env.PRE) : {};
ORDER.forEach(id => Object.assign(CH(id), { atkAdd: 0 }, PRE[id] || {}));
let snaps = [null];
function measure(k) {
  S.ST.ch = {};
  let cleared = 0;
  const next = [];
  for (let i = 0; i < N; i++) {
    const st = snaps[i % snaps.length];
    const r = S.playRun('smart', { state: st, from: k, to: k });
    if (r.reached > k) {
      cleared++;
      next.push(r.state);
    }
  }
  const P = S.ST.ch[ORDER[k]] || { n: 1, t: 0, bn: 1, bt: 0, lost: 0 };
  return {
    rate: cleared / N,
    tn: P.n ? P.t / P.n : 99,
    tb: P.bn ? P.bt / P.bn : 99,
    lost: P.lost / Math.max(1, P.n),
    next,
  };
}
const out = {};
for (let k = 0; k < ORDER.length; k++) {
  const c = CH(ORDER[k]);
  if (!PRE[c.id] || process.env.RETUNE) {
    c.atkMul = 0.4;
    let lo = 0.3,
      hi = 300;
    for (let it = 0; it < 11; it++) {
      c.hpMul = +((lo + hi) / 2).toFixed(2);
      if (measure(k).tn < TN) lo = c.hpMul;
      else hi = c.hpMul;
    }
    lo = 0.5;
    hi = 3;
    for (let it = 0; it < 8; it++) {
      c.bossHp = +((lo + hi) / 2).toFixed(2);
      if (measure(k).tb < TB[c.id]) lo = c.bossHp;
      else hi = c.bossHp;
    }
    // if even weak attacks can't reach the target (madness etc.), shorten the boss
    for (let g = 0; g < 6 && c.bossHp > 0.45 && measure(k).rate < target[k] + 0.05; g++)
      c.bossHp = +(c.bossHp * 0.8).toFixed(2);
    lo = 0.3;
    hi = 15;
    for (let it = 0; it < 9; it++) {
      c.atkMul = +((lo + hi) / 2).toFixed(2);
      if (measure(k).rate > target[k]) lo = c.atkMul;
      else hi = c.atkMul;
    }
  }
  const m = measure(k);
  snaps = m.next.length ? m.next : snaps;
  out[c.id] = { hpMul: c.hpMul, bossHp: c.bossHp, atkMul: c.atkMul };
  console.error(
    c.id,
    JSON.stringify(out[c.id]),
    'rate',
    m.rate.toFixed(2),
    'turns',
    m.tn.toFixed(1),
    m.tb.toFixed(1),
    'lost/fight',
    m.lost.toFixed(1)
  );
}
console.log(JSON.stringify(out));
S.report(1500);
