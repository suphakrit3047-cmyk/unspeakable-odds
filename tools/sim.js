// Balance bot: plays whole runs with the game's own rules (src/rules/rules.js).
// Only the decisions live here: which foe to pick, which dice to re-roll, what to buy.
//   node tools/sim.js [runs]
const D = require('../src/data/data.js'),
  RL = require('../src/data/relics.js'),
  RULES = require('../src/rules/rules.js');
const { DICE, CHAPTERS, SKILLS } = D;
const R = n => Math.floor(Math.random() * n);
const ORDER = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'];
const CH = id => CHAPTERS.find(c => c.id === id);
const LOCK = D.LOCKED_START;
const OUT = { win: 'win', body: 'dead', mind: 'mad' };

/* ---------- how the bot values things ---------- */
// relic value for buying / replacing
const RV = {
  knife: 5,
  stone: 4,
  twins: 5,
  eye: 3,
  hourglass: 4,
  scroll: 4,
  tooth: 7,
  jar: 5,
  pearl: 3,
  star: 5,
  cylinder: 5,
  cup: 4,
  coin: 3,
  golddie: 3,
  flask: 3,
  skull: 5,
  lens: 8,
  mask: 6,
  bell: 7,
  ember: 9,
  idol: 8,
  azeye: 9,
  nail: 4,
  candle: 3,
  mirror: 4,
  web: 3,
  chalk: 4,
  tome: 5,
  lantern: 4,
  silver: 4,
  organ: 4,
  crown: 7,
  heart: 6,
  aegis: 6,
  clock: 5,
  tentacle: 5,
  bounty: 3,
  key: 3,
  salt: 4,
};
// extra value of a die's skill
const SKILL_EV = {
  ghoul: 2,
  deep: 3,
  gaunt: 2,
  migo: 4,
  spider: 3,
  elder: 2,
  yith: 3,
  shog: 3,
  colour: 4,
  cat: 2,
  ghast: 3,
  moon: 3,
  polyp: 4,
};
const ev = (id, ups) =>
  (SKILL_EV[id] || 0) +
  DICE[id].faces.reduce(
    (a, f) =>
      a +
      (f.t === 'mad' ? -1.5 * f.v : f.t === 'none' ? 0 : (f.t === 'weak' ? 2 : 1) * (f.v + ((ups && ups[id]) || 0))),
    0
  );
function offers(tiers, n) {
  const pool = Object.keys(DICE).filter(k => tiers.includes(DICE[k].tier) && !LOCK.includes(k));
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(R(pool.length), 1)[0]);
  return out;
}

/* ---------- stats ---------- */
const ST = { pw: {}, ch: {}, fights: 0, turns: 0, bossF: 0, bossT: 0, taken: 0, coinsEnd: [], spent: 0, ups: 0 };

/* ---------- one fight ---------- */
function fight(ch, s, key, run, rank) {
  const e = RULES.newFoe(ch, key, { stage: s, rank, curse: run.curse || 0, cursed: run.cursedNext });
  run.cursedNext = false;
  const b = RULES.newBattle(e, run);
  run.extraReroll = 0;
  const boss = !!e.boss,
    hp0 = run.hp;
  const fin = res => {
    const P = (ST.ch[ch.id] = ST.ch[ch.id] || { n: 0, t: 0, bn: 0, bt: 0, lost: 0 });
    if (res === 'win') {
      if (boss) {
        P.bn++;
        P.bt += b.turn;
      } else {
        P.n++;
        P.t += b.turn;
        P.lost += Math.max(0, hp0 - run.hp);
      }
    }
    ST.fights++;
    ST.turns += b.turn;
    if (boss) {
      ST.bossF++;
      ST.bossT += b.turn;
    }
    ST.taken += Math.max(0, hp0 - run.hp);
    return res;
  };
  while (true) {
    const st = RULES.startTurn(b, run);
    if (st.out) return fin(OUT[st.out]);
    // bot: how good is a face right now
    const incoming = RULES.curIntent(b)
      .filter(p => p.t === 'atk' || p.t === 'drain')
      .reduce((a, p) => a + RULES.atkValue(b, run, p.v), 0);
    const score = f =>
      f.t === 'none'
        ? 0
        : f.t === 'mad'
          ? -2 * f.v
          : f.t === 'blk'
            ? incoming > 0
              ? f.v
              : 0.3 * f.v
            : f.t === 'san'
              ? run.san < 12
                ? 1.5 * f.v
                : 0.3 * f.v
              : f.t === 'heal'
                ? run.hp < run.maxHp * 0.6
                  ? f.v
                  : 0.3 * f.v
                : f.v;
    const avg = id => DICE[id].faces.reduce((a, f) => a + score(f), 0) / 6;
    const slack = RL.hasRelic(run.relics, 'hourglass') ? 1.5 : 0;
    // bot: re-roll the dice that rolled below their average (hold the rest)
    while (b.rerolls > 0) {
      const free = b.rolls.filter(x => !x.frozen && !x.banished);
      if (e.noHold) {
        // can't hold: re-roll everything only if most dice are bad
        if (free.filter(x => score(x.face) < avg(x.id)).length * 2 <= b.rolls.length) break;
        free.forEach(x => (x.held = false));
      } else {
        free.forEach(x => (x.held = score(x.face) >= avg(x.id) - slack));
        if (free.every(x => x.held)) break;
      }
      b.rolls.filter(RULES.canReroll).forEach(x => RULES.rerollDie(x, run));
      b.rerolls--;
    }
    const T = RULES.tally(b, run);
    {
      const Q = (ST.pw[ch.id] = ST.pw[ch.id] || { n: 0, atk: 0, blk: 0, heal: 0, inc: 0, dice: 0, rel: 0 });
      Q.n++;
      Q.atk += T.s.atk;
      Q.blk += T.s.blk;
      Q.heal += T.s.heal;
      Q.inc += incoming;
      Q.dice += run.dice.length;
      Q.rel += run.relics.length;
    }
    const me = RULES.playerResolve(b, run, T);
    if (me.out) return fin(OUT[me.out]);
    const en = RULES.enemyTurn(b, run);
    if (en.out) return fin(OUT[en.out]);
    if (b.turn > 60) return fin('dead');
  }
}

/* ---------- between fights ---------- */
function event(run) {
  const evx = RL.EVENTS[R(RL.EVENTS.length)];
  const api = RULES.eventApi(run, LOCK);
  const ok = evx.opts.filter(o => !o.need || o.need(run));
  let pick = ok[0];
  if (run.hp < run.maxHp * 0.4) pick = ok.find(o => /เลือด \+/.test(o.d)) || ok[ok.length - 1];
  else if (evx.id === 'merchant' && run.dice.length < 5)
    pick = ok.find(o => o.t.startsWith('ซื้อ')) || ok[ok.length - 1];
  else if (evx.id === 'tarot') pick = ok[1] || ok[ok.length - 1];
  pick.go(run, api);
}
function shop(run, L) {
  const c0 = run.coins;
  let pot = 0;
  while (run.hp < run.maxHp * 0.6 && run.coins >= RULES.potionCost(pot, run.relics)) RULES.drinkPotion(run, pot++);
  let rerolls = 0;
  for (let pass = 0; pass < 3; pass++) {
    const offer = RL.shopRelics(run.relics, 3).sort((a, b) => RV[b] - RV[a]);
    for (const id of offer) {
      const c = RL.relicCost(id, L, run.relics);
      if (run.coins < c) continue;
      if (run.relics.length < RL.relicMax(run)) {
        run.coins -= c;
        run.relics.push({ id, n: 0 });
      } else {
        let wi = 0;
        run.relics.forEach((r, i) => {
          if (RV[r.id] < RV[run.relics[wi].id]) wi = i;
        });
        if (RV[id] > RV[run.relics[wi].id] + 2) {
          run.coins += RL.sellPrice(run.relics[wi].id) - c;
          run.relics[wi] = { id, n: 0 };
        }
      }
    }
    const rc = 2 + rerolls;
    if (run.coins >= rc + 6 && run.relics.length < RL.relicMax(run)) {
      run.coins -= rc;
      rerolls++;
    } else break;
  }
  for (let k = 0; k < 6; k++) {
    const kinds = [...new Set(run.dice)]
      .map(id => ({ id, n: run.dice.filter(x => x === id).length, lv: run.ups[id] || 0 }))
      .filter(x => (x.lv < RL.UP_MAX && DICE[x.id].tier > 0) || (x.lv < 1 && x.n >= 2))
      .sort((a, b) => b.n * ev(b.id) - a.n * ev(a.id));
    const t = kinds.find(x => run.coins >= RL.upCost(x.lv));
    if (!t) break;
    run.coins -= RL.upCost(t.lv);
    run.ups[t.id] = t.lv + 1;
    ST.ups++;
  }
  ST.spent += c0 - run.coins;
}

/* ---------- a whole run ---------- */
// policy: 'smart' picks the foe rank by how healthy it is, 'normal' always picks the middle one
function playRun(policy = 'smart', opt = {}) {
  const run = opt.state
    ? JSON.parse(JSON.stringify(opt.state))
    : {
        hp: 45,
        maxHp: 45,
        san: 20,
        maxSan: 20,
        dice: ['cultA', 'cultA', 'cultB', 'cultB'],
        coins: 0,
        relics: [],
        ups: {},
        curse: 0,
      };
  const c0 = opt.from || 0,
    c1 = opt.to != null ? opt.to : ORDER.length - 1;
  for (let ci = c0; ci <= c1; ci++) {
    if (opt.snap && ci > c0) opt.snap(ci, JSON.parse(JSON.stringify(run)));
    const ch = CH(ORDER[ci]);
    for (let s = 0; s < 4; s++) {
      let key,
        rank = 2;
      if (s === 3) key = ch.boss;
      else {
        if (policy === 'smart')
          rank = run.hp >= run.maxHp * 0.65 && run.san >= 12 ? 3 : run.hp < run.maxHp * 0.35 ? 1 : 2;
        else if (policy === 'normal') rank = 2;
        else rank = 1;
        const p = ch.pool[rank];
        key = p[R(p.length)];
      }
      const r = fight(ch, s, key, run, rank);
      if (r !== 'win') {
        ST.coinsEnd.push(run.coins);
        return { reached: ci, stage: s, coins: run.coins, how: r };
      }
      RULES.winSpoils(run, { boss: s === 3, rank: s === 3 ? 2 : rank, inRun: true });
      if (s === 3) break;
      const rw = RULES.stageReward(run, ch, s, rank);
      if (run.hp < run.maxHp * 0.45 && rw.picks === 1) RULES.restPick(run);
      else {
        const off = offers(rw.tiers, rw.n).sort((a, b) => ev(b) - ev(a));
        for (let k = 0; k < rw.picks && k < off.length; k++) {
          const pick = off[k];
          if (run.dice.length < 6) run.dice.push(pick);
          else {
            let wi = 0;
            run.dice.forEach((d, i) => {
              if (ev(d, run.ups) < ev(run.dice[wi], run.ups)) wi = i;
            });
            if (ev(pick, run.ups) > ev(run.dice[wi], run.ups)) run.dice[wi] = pick;
          }
        }
      }
      if (s === 0) event(run);
      if (s === 1) shop(run, ch.level);
    }
    ST.coinsEnd.push(run.coins);
    RULES.restBetween(run);
    if (ci < ORDER.length - 1) shop(run, CH(ORDER[ci + 1]).level);
  }
  if (opt.snap && c1 < ORDER.length - 1) opt.snap(c1 + 1, JSON.parse(JSON.stringify(run)));
  return { reached: c1 + 1, won: c1 === ORDER.length - 1, coins: run.coins, state: run };
}

function report(N = 1500, pols = ['smart', 'normal']) {
  for (const pol of pols) {
    Object.assign(ST, { fights: 0, turns: 0, bossF: 0, bossT: 0, taken: 0, coinsEnd: [], spent: 0, ups: 0 });
    const reach = Array(9).fill(0),
      how = {};
    for (let i = 0; i < N; i++) {
      const r = playRun(pol);
      reach[r.reached]++;
      if (r.how) how[r.how] = (how[r.how] || 0) + 1;
    }
    let acc = 0;
    const c = [];
    for (let k = 8; k >= 1; k--) {
      acc += reach[k];
      c.unshift(((100 * acc) / N).toFixed(0));
    }
    const nb = ST.fights - ST.bossF;
    console.log(
      pol.padEnd(7),
      'clear c1..c8 %:',
      c.join(' / '),
      `| turns: normal ${((ST.turns - ST.bossT) / nb).toFixed(1)} boss ${(ST.bossT / ST.bossF).toFixed(1)} | hp lost/fight ${(ST.taken / ST.fights).toFixed(1)} | coins left avg ${(ST.coinsEnd.reduce((a, b) => a + b, 0) / ST.coinsEnd.length).toFixed(1)} | ups/run ${(ST.ups / N).toFixed(1)} | deaths`,
      JSON.stringify(how)
    );
  }
}
module.exports = { playRun, report, fight, ST };
if (require.main === module) report(+process.argv[2] || 1500);
