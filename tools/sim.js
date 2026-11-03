// Full-run bot v6: traits, dice upgrades, new economy. Mirrors the rules in src/js/battle.js.
const D = require('../src/data/data.js'),
  RL = require('../src/data/relics.js');
const { DICE, FOES, CHAPTERS, F, SKILLS, computeTally, bagHas, traitOf } = D;
const R = n => Math.floor(Math.random() * n);
const ORDER = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'];
const CH = id => CHAPTERS.find(c => c.id === id);
const CFG = {
  win: { 1: 1, 2: 2, 3: 4 },
  boss: 6,
  winHeal: 3,
  winSan: 3,
  r3heal: 5,
  r3san: 2,
  r1heal: 3,
  rest: { hp: 10, san: 4 },
  restPick: { hp: 12, san: 5 },
  stageHp: 0.04,
  rankHp: { 1: 1, 2: 1, 3: 0.85 },
  potion: 3,
  bossMaxHp: 5,
  ups: true,
  traits: true,
};
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
const LOCK = D.LOCKED_START;
function offers(tiers, n) {
  let pool = Object.keys(DICE).filter(k => tiers.includes(DICE[k].tier) && !LOCK.includes(k));
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(R(pool.length), 1)[0]);
  return out;
}
const ST = { pw: {}, ch: {}, fights: 0, turns: 0, bossF: 0, bossT: 0, taken: 0, coinsEnd: [], spent: 0, ups: 0 };
function fight(ch, s, key, run, rank) {
  const E = FOES[key],
    L = ch.level,
    boss = !!E.boss;
  const e0 = Math.round(
    E.hp * ch.hpMul * (1 + CFG.stageHp * s) * (boss ? ch.bossHp || 1 : CFG.rankHp[rank]) * (run.cursedNext ? 1.25 : 1)
  );
  run.cursedNext = false;
  const tr = CFG.traits && !boss ? traitOf(key, { L, maxHp: e0, atkMul: ch.atkMul || 1 }) : null;
  const sc = it => it.map(p => D.scaleFoePart(p, ch, 0, e0 / E.hp));
  const e = {
    hp: e0,
    maxHp: e0,
    block: 0,
    poison: 0,
    weak: 0,
    str: 0,
    ii: 0,
    intents: E.intents.map(sc),
    phased: false,
    t: 0,
  };
  const av = v => v;
  const feast = E.feast ? Math.round(E.feast * (ch.atkMul || 1)) : 0,
    regen = E.regen ? Math.round(((E.regen * e0) / E.hp) * 0.7) : 0;
  let freeze = 0,
    daze = 0,
    turns = 0,
    bleed = 0;
  const bonusRR = run.extraReroll || 0;
  run.extraReroll = 0;
  const salt = RL.hasRelic(run.relics, 'salt');
  const hp0 = run.hp;
  const fin = res => {
    const P = (ST.ch[ch.id] = ST.ch[ch.id] || { n: 0, t: 0, bn: 0, bt: 0, lost: 0 });
    if (res === 'win') {
      if (boss) {
        P.bn++;
        P.bt += turns;
      } else {
        P.n++;
        P.t += turns;
        P.lost += Math.max(0, hp0 - run.hp);
      }
    }
    ST.fights++;
    ST.turns += turns;
    if (boss) {
      ST.bossF++;
      ST.bossT += turns;
    }
    ST.taken += Math.max(0, hp0 - run.hp);
    return res;
  };
  while (true) {
    turns++;
    if (bleed) {
      run.hp -= bleed;
      bleed--;
      if (run.hp <= 0) return fin('dead');
    }
    let pBlock = 0;
    const intent = e.intents[e.ii % e.intents.length];
    const hit = p =>
      Math.floor(
        (av(p.v) + e.str + (E.feast && run.hp < run.maxHp / 2 ? feast : 0)) *
          (tr && tr.key === 'enrage' && e.hp < e.maxHp / 2 ? 1.5 : 1) *
          (e.weak ? 0.7 : 1)
      );
    const incoming = intent.filter(p => p.t === 'atk' || p.t === 'drain').reduce((a, p) => a + hit(p), 0);
    const roll = id => {
      let f = { ...DICE[id].faces[R(6)] };
      if (run.san <= 8 && !(SKILLS[id] && SKILLS[id].noDistort) && Math.random() < 0.3) {
        if (f.t !== 'none' && f.t !== 'mad' && Math.random() < 0.5) f.v *= 2;
        else f = F('mad', 1);
      } else if (run.ups[id] && f.t !== 'none' && f.t !== 'mad') f.v += run.ups[id];
      return f;
    };
    const rolls = run.dice.map(id => ({ id, face: roll(id), frozen: false, fresh: true }));
    const cand = rolls.filter(x => !(SKILLS[x.id] && SKILLS[x.id].noFreeze));
    for (let i = 0; i < freeze && i < cand.length; i++) cand[i].frozen = true;
    if (E.chaos) {
      const free = rolls.filter(x => !x.frozen);
      const all = Object.keys(DICE);
      for (let i = 0; i < E.chaos && free.length; i++) {
        const x = free.splice(R(free.length), 1)[0];
        x.face = { ...DICE[all[R(all.length)]].faces[R(6)] };
      }
    }
    if (E.banish) {
      const free = rolls.filter(x => !x.frozen);
      for (let i = 0; i < E.banish && free.length; i++) {
        const x = free.splice(R(free.length), 1)[0];
        x.banished = true;
        x.frozen = true;
      }
    }
    freeze = 0;
    const rr = Math.min(E.maxReroll != null ? E.maxReroll : 2, Math.max(0, 2 - daze)) + bonusRR;
    daze = 0;
    run.relics.forEach(r => (r.off = false));
    if (E.relicOff)
      run.relics
        .map((_, i) => i)
        .sort(() => Math.random() - 0.5)
        .slice(0, E.relicOff)
        .forEach(i => (run.relics[i].off = true));
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
    const reroll1 = x => {
      const nf = roll(x.id);
      x.fresh = false;
      if (SKILLS[x.id] && SKILLS[x.id].keepBetter && score(x.face) > score(nf)) return;
      x.face = nf;
    };
    let used = 0;
    for (let r = 0; r < rr; r++) {
      if (E.noHold) {
        const bad = rolls.filter(
          x => !x.frozen && score(x.face) < DICE[x.id].faces.reduce((a, f) => a + score(f), 0) / 6
        ).length;
        if (bad * 2 > rolls.length) {
          rolls.forEach(x => {
            if (!x.frozen) reroll1(x);
          });
          used++;
        }
        continue;
      }
      let did = false;
      rolls.forEach(x => {
        if (x.frozen) return;
        const avg = DICE[x.id].faces.reduce((a, f) => a + score(f), 0) / 6;
        if (score(x.face) < avg - (RL.hasRelic(run.relics, 'hourglass') ? 1.5 : 0)) {
          reroll1(x);
          did = true;
        }
      });
      if (did) used++;
    }
    const T = computeTally(rolls, {
      eHp: e.hp / e.maxHp,
      ePoison: e.poison,
      eWeak: e.weak,
      san: run.san,
      maxSan: run.maxSan,
      armor: E.armor || (tr && tr.key === 'hide' ? tr.v : 0),
      lull: !!E.lull,
      comboMin: E.comboMin,
    });
    const sm = T.s;
    RL.applyRelics(run.relics, {
      noHeal: E.noHeal,
      noSan: E.noSan,
      halfSan: E.halfSan,
      noMul: E.noMulAsleep && !e.phased,
      shuffle: E.shuffleRelics,
      s: sm,
      rolls,
      cnt: T.cnt,
      combos: T.combos,
      lv: T.lv,
      san: run.san,
      maxSan: run.maxSan,
      hp: run.hp,
      maxHp: run.maxHp,
      eHp: e.hp / e.maxHp,
      ePoison: e.poison,
      rerollsLeft: Math.max(0, rr - used),
      turn: turns,
    });
    if (T.combos.length) {
      run.relics.forEach(r => {
        if (RL.RELICS[r.id].grow === 'combo') r.n = (r.n || 0) + 1;
      });
      if (RL.hasRelic(run.relics, 'golddie')) run.coins += 2;
    }
    {
      const Q = (ST.pw[ch.id] = ST.pw[ch.id] || { n: 0, atk: 0, blk: 0, heal: 0, inc: 0, dice: 0, rel: 0 });
      Q.n++;
      Q.atk += sm.atk;
      Q.blk += sm.blk;
      Q.heal += sm.heal;
      Q.inc += incoming;
      Q.dice += run.dice.length;
      Q.rel += run.relics.length;
    }
    const ab = Math.min(e.block, sm.atk);
    e.block -= ab;
    const dealt = sm.atk - ab;
    e.hp -= dealt;
    pBlock += sm.blk;
    e.poison += sm.poison;
    e.weak += sm.weak;
    if (tr && tr.key === 'thorns' && dealt > 0 && !salt) run.hp -= tr.v;
    if (tr && tr.key === 'vengeful' && !sm.atk) e.str += tr.v;
    run.hp = Math.min(run.maxHp, run.hp + sm.heal);
    run.san = Math.max(0, Math.min(run.maxSan, run.san + sm.san - sm.mad));
    if (e.hp <= 0) return fin('win');
    if (run.hp <= 0) return fin('dead');
    if (run.san <= 0) return fin('mad');
    const ph = () => {
      if (E.phase2 && !e.phased && e.hp <= e.maxHp * E.phase2.at) {
        e.phased = true;
        e.intents = E.phase2.intents.map(sc);
        e.ii = 0;
      }
    };
    ph();
    e.block = 0;
    if (e.poison > 0) {
      e.hp -= e.poison;
      if (!bagHas(run.dice, 'poisonStay')) e.poison--;
      if (e.hp <= 0) return fin('win');
      ph();
    }
    if (regen) e.hp = Math.min(e.maxHp, e.hp + regen);
    for (const p of intent) {
      if (p.t === 'atk' || p.t === 'drain') {
        const d = hit(p);
        const a = Math.min(pBlock, d);
        pBlock -= a;
        const tk = d - a;
        run.hp -= tk;
        if (p.t === 'drain') e.hp += tk;
        if (tk > 0 && tr && tr.key === 'thief' && !salt) run.coins = Math.max(0, run.coins - tr.v);
        if (tk > 0 && tr && tr.key === 'bleed' && !salt) bleed += tr.v;
      } else if (p.t === 'blk') e.block += p.v;
      else if (p.t === 'mad') run.san -= p.v;
      else if (p.t === 'str') e.str += p.v;
      else if (p.t === 'freeze') freeze = p.v;
      else if (p.t === 'daze') daze = p.v;
    }
    e.t++;
    if (tr && tr.key === 'harden') e.block += tr.v;
    if (tr && tr.key === 'grow') e.str += tr.v;
    if (tr && tr.key === 'dread') run.san -= tr.v;
    if (E.aura) run.san -= E.aura;
    if (E.wave && e.t % E.wave === 0) freeze = run.dice.length;
    if (e.weak > 0) e.weak--;
    e.ii = E.randomIntent ? R(e.intents.length) : e.ii + 1;
    if (run.hp <= 0) return fin('dead');
    if (run.san <= 0) return fin('mad');
    if (turns > 60) return fin('dead');
  }
}
function giveRelic(run, rar) {
  if (run.relics.length >= RL.relicMax(run)) {
    run.coins += 4;
    return;
  }
  let p = RL.RELIC_KEYS.filter(k => !RL.hasRelic(run.relics, k) && (!rar || RL.RELICS[k].rar === rar));
  if (p.length) run.relics.push({ id: p[R(p.length)], n: 0 });
}
function event(run) {
  const evx = RL.EVENTS[R(RL.EVENTS.length)];
  const api = {
    giveRelic: rar => giveRelic(run, rar),
    sellWeakest: v => {
      let wi = 0;
      run.dice.forEach((d, i) => {
        if (ev(d) < ev(run.dice[wi])) wi = i;
      });
      run.dice.splice(wi, 1);
      run.coins += v;
    },
    giveDie: id => {
      if (run.dice.length < 6) run.dice.push(id);
      else run.coins += 4;
    },
    upgradeRandom: (n, st) => {
      [...new Set(run.dice)]
        .filter(id => (run.ups[id] || 0) < 3)
        .sort(() => Math.random() - 0.5)
        .slice(0, n)
        .forEach(id => (run.ups[id] = Math.min(3, (run.ups[id] || 0) + (st || 1))));
    },
    upgradeAll: () => {
      [...new Set(run.dice)].forEach(id => (run.ups[id] = Math.min(3, (run.ups[id] || 0) + 1)));
    },
    tradeUp: () => {
      let wi = 0;
      run.dice.forEach((d, i) => {
        if (ev(d) < ev(run.dice[wi])) wi = i;
      });
      const t = Math.min(3, DICE[run.dice[wi]].tier + 1);
      const p = Object.keys(DICE).filter(k => DICE[k].tier === t && !LOCK.includes(k));
      if (p.length) run.dice[wi] = p[R(p.length)];
    },
  };
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
  while (run.hp < run.maxHp * 0.6 && run.coins >= CFG.potion + 2 * pot) {
    run.coins -= CFG.potion + 2 * pot;
    pot++;
    run.hp = Math.min(run.maxHp, run.hp + 12);
  }
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
  if (CFG.ups)
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
      run.relics.forEach(x => {
        if (RL.RELICS[x.id].grow === 'kill') x.n = (x.n || 0) + 1;
      });
      run.coins +=
        (s === 3 ? CFG.boss : CFG.win[rank]) +
        (RL.hasRelic(run.relics, 'coin') ? 1 : 0) +
        (RL.hasRelic(run.relics, 'bounty') && (s === 3 || rank === 3) ? 3 : 0) +
        RL.interest(run.coins, run.relics);
      run.san = Math.min(run.maxSan, run.san + CFG.winSan);
      run.hp = Math.min(run.maxHp, run.hp + CFG.winHeal);
      if (s === 3) {
        run.maxHp += CFG.bossMaxHp;
        run.hp += CFG.bossMaxHp;
        break;
      }
      const base = ch.tiers[s] || [1];
      const rw =
        rank === 1
          ? { tiers: [Math.max(1, Math.min(...base) - 1)], n: 2, picks: 1, heal: CFG.r1heal, san: 0 }
          : rank === 3
            ? {
                tiers: [...new Set(base.map(t => Math.min(3, t + 1)))],
                n: 3,
                picks: 2,
                heal: CFG.r3heal,
                san: CFG.r3san,
              }
            : { tiers: base, n: 3, picks: 1, heal: 0, san: 0 };
      run.hp = Math.min(run.maxHp, run.hp + rw.heal);
      run.san = Math.min(run.maxSan, run.san + rw.san);
      if (run.hp < run.maxHp * 0.45 && rw.picks === 1) {
        run.hp = Math.min(run.maxHp, run.hp + CFG.restPick.hp);
        run.san = Math.min(run.maxSan, run.san + CFG.restPick.san);
      } else {
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
    run.hp = Math.min(run.maxHp, run.hp + CFG.rest.hp);
    run.san = Math.min(run.maxSan, run.san + CFG.rest.san);
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
module.exports = { playRun, report, CFG, fight, ST };
if (require.main === module) report(+process.argv[2] || 1500);
