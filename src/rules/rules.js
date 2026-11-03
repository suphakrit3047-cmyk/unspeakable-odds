// ===== Game rules: one copy, used by the game (src/js) and the balance bot (tools/sim.js) =====
// Pure state changes only. Nothing here touches the page: each step returns a list of
// events ({ k: 'hit', ... }) that the game turns into log lines, numbers and sounds.
//
// State shapes
//   run    : { hp, maxHp, san, maxSan, coins, dice: [id], relics: [{ id, n, off }], ups: { id: level }, curse }
//   battle : { e (foe), rolls: [{ id, face, held, frozen, banished, fresh }], rerolls, bonusRR, pBlock,
//              bleed, freezeNext, dazeNext, turn }
//   ch     : a chapter from CHAPTERS

// <node-only> build.py removes this block: in the browser these are already globals
const {
  DICE,
  FOES,
  SKILLS,
  F,
  computeTally,
  bagHas,
  faceScore,
  traitOf,
  scaleFoePart,
  curseMod,
} = require('../data/data.js');
const { RELICS, RELIC_KEYS, UP_MAX, relicMax, applyRelics, hasRelic, interest } = require('../data/relics.js');
// </node-only>

var RULES = (function () {
  const R = n => Math.floor(Math.random() * n);
  const shuffled = a => a.sort(() => Math.random() - 0.5);

  /* ---------- numbers ---------- */
  const ECON = {
    rank: { 1: { hp: 1, coin: 1 }, 2: { hp: 1, coin: 2 }, 3: { hp: 0.85, coin: 4 } },
    stageHp: 0.04, // foe hp +4% per stage inside a chapter
    cursedFoeHp: 1.25, // an event can curse the next foe
    bossCoin: 6,
    bossMaxHp: 5,
    winHeal: 3,
    winSan: 3,
    rest: { hp: 10, san: 4 }, // between chapters
    restPickSan: 5, // "rest by the fire" instead of taking a die
    potion: { base: 3, step: 2, heal: 12 }, // price rises each bottle in one shop visit
    incense: { base: 3, step: 2, san: 5 },
    rerolls: 2,
    madAt: 8, // sanity at or below this distorts faces
    distort: 0.3,
  };
  // the silver key relic takes 1 off every shop price
  const shopPrice = (n, relics) => (n <= 0 ? 0 : Math.max(1, n - (hasRelic(relics, 'key') ? 1 : 0)));
  const potionCost = (n, relics) => shopPrice(ECON.potion.base + ECON.potion.step * n, relics);
  const incenseCost = (n, relics) => shopPrice(ECON.incense.base + ECON.incense.step * n, relics);
  const restPickHp = curse => curseMod(curse || 0).rest;

  /* ---------- foes ---------- */
  function foeHp(ch, stage, key, rank, curse) {
    const E = FOES[key];
    return Math.round(
      E.hp *
        ch.hpMul *
        (1 + ECON.stageHp * stage) *
        (E.boss ? ch.bossHp || 1 : ch.pool ? ECON.rank[rank].hp : 1) *
        curseMod(curse || 0).hp
    );
  }
  function bossNums(ch, E, hp) {
    const m = ch.atkMul || 1;
    return {
      feast: E.feast ? Math.round(E.feast * m) : 0,
      regen: E.regen ? Math.max(1, Math.round(((E.regen * hp) / E.hp) * 0.7)) : 0,
    };
  }
  // bosses and tutorial foes have no trait
  function foeTrait(ch, key, maxHp) {
    return FOES[key].boss || ch.tut ? null : traitOf(key, { L: ch.level || 0, maxHp, atkMul: ch.atkMul || 1 });
  }
  // opts: { stage, rank, curse, cursed }
  function newFoe(ch, key, opts) {
    const E = FOES[key];
    let hp = foeHp(ch, opts.stage, key, opts.rank, opts.curse);
    if (opts.cursed) hp = Math.round(hp * ECON.cursedFoeHp);
    const hs = hp / E.hp,
      atk = curseMod(opts.curse || 0).atk,
      bn = bossNums(ch, E, hp);
    return {
      ...E,
      key,
      hp,
      maxHp: hp,
      hs,
      atkCurse: atk,
      intents: E.intents.map(it => it.map(p => scaleFoePart(p, ch, atk, hs))),
      block: 0,
      poison: 0,
      weak: 0,
      str: 0,
      ii: 0,
      t: 0,
      phased: false,
      trait: foeTrait(ch, key, hp),
      feast: bn.feast,
      regen: bn.regen,
      chs: { atkMul: ch.atkMul, atkAdd: ch.atkAdd, hpMul: ch.hpMul }, // what phase 2 needs to scale its moves
    };
  }
  function newBattle(e, run) {
    return {
      e,
      rolls: [],
      rerolls: ECON.rerolls,
      bonusRR: run.extraReroll || 0,
      pBlock: 0,
      bleed: 0,
      freezeNext: 0,
      dazeNext: 0,
      turn: 0,
    };
  }
  const curIntent = b => b.e.intents[b.e.ii % b.e.intents.length];
  const enraged = b => !!(b.e.trait && b.e.trait.key === 'enrage' && b.e.hp < b.e.maxHp / 2);
  // what one enemy attack part really hits for right now
  function atkValue(b, run, v) {
    const e = b.e;
    let x = v + e.str + (e.feast && run.hp < run.maxHp / 2 ? e.feast : 0);
    if (enraged(b)) x = Math.floor(x * 1.5);
    if (e.weak > 0) x = Math.floor(x * 0.7);
    return x;
  }
  const salted = run => hasRelic(run.relics, 'salt');

  /* ---------- dice ---------- */
  function upFace(f, id, run) {
    const lv = (run.ups && run.ups[id]) || 0;
    return lv && f.t !== 'none' && f.t !== 'mad' ? { ...f, v: f.v + lv } : f;
  }
  // roll one die in place; low sanity can double a face or turn it into madness
  function rollDie(r, run) {
    const sk = SKILLS[r.id] || {};
    let f = { ...DICE[r.id].faces[R(6)] };
    r.dist = null;
    if (run.san <= ECON.madAt && !sk.noDistort && Math.random() < ECON.distort) {
      if (f.t !== 'none' && f.t !== 'mad' && Math.random() < 0.5) {
        f.v *= 2;
        r.dist = 'pow';
      } else {
        f = F('mad', 1);
        r.dist = 'mad';
      }
    } else f = upFace(f, r.id, run);
    r.face = f;
  }
  // re-roll one die (the caller decides which); Yith keeps the better face
  function rerollDie(r, run) {
    const old = { face: r.face, dist: r.dist };
    rollDie(r, run);
    r.fresh = false;
    r.chaos = false;
    if ((SKILLS[r.id] || {}).keepBetter && faceScore(old.face) > faceScore(r.face)) {
      r.face = old.face;
      r.dist = old.dist;
      r.kept = true;
    } else r.kept = false;
  }
  const canReroll = r => !r.held && !r.frozen && !r.banished;

  /* ---------- turn start ---------- */
  // returns { ev, out } where out is 'body' if bleeding killed you
  function startTurn(b, run) {
    const e = b.e,
      ev = [];
    b.turn++;
    if (b.bleed > 0) {
      run.hp = Math.max(0, run.hp - b.bleed);
      ev.push({ k: 'bleed', v: b.bleed });
      b.bleed--;
      if (run.hp <= 0) return { ev, out: 'body' };
    }
    b.pBlock = 0;
    b.rerolls =
      Math.min(e.maxReroll != null ? e.maxReroll : ECON.rerolls, Math.max(0, 2 - b.dazeNext)) + (b.bonusRR || 0);
    const rel = run.relics || [];
    rel.forEach(r => (r.off = false));
    if (e.relicOff && rel.length) {
      const idx = shuffled(run.relics.map((_, i) => i)).slice(0, e.relicOff);
      idx.forEach(i => (run.relics[i].off = true));
      ev.push({ k: 'relicOff', idx });
    }
    b.rolls = run.dice.map(id => ({ id, held: false, frozen: false, fresh: true }));
    b.rolls.forEach(r => rollDie(r, run));
    const fz = shuffled([...b.rolls.keys()].filter(i => !(SKILLS[b.rolls[i].id] || {}).noFreeze)).slice(
      0,
      b.freezeNext
    );
    fz.forEach(i => (b.rolls[i].frozen = true));
    if (b.freezeNext) ev.push({ k: 'frozen', n: fz.length });
    if (b.dazeNext) ev.push({ k: 'dazed', rerolls: b.rerolls });
    b.freezeNext = 0;
    b.dazeNext = 0;
    const free = () => [...b.rolls.keys()].filter(i => !b.rolls[i].frozen);
    if (e.chaos) {
      const all = Object.keys(DICE);
      shuffled(free())
        .slice(0, e.chaos)
        .forEach(i => {
          const r = b.rolls[i];
          r.face = { ...DICE[all[R(all.length)]].faces[R(6)] };
          r.chaos = true;
          r.dist = null;
        });
    }
    if (e.banish) {
      const gone = shuffled(free()).slice(0, e.banish);
      gone.forEach(i => (b.rolls[i].banished = true));
      if (gone.length) ev.push({ k: 'banish', n: gone.length });
    }
    return { ev, out: null };
  }

  /* ---------- your dice resolve ---------- */
  // totals after monster skills, combos and relics; T.steps lists each relic that fired
  function tally(b, run) {
    const e = b.e;
    const T = computeTally(b.rolls, {
      eHp: e.hp / e.maxHp,
      ePoison: e.poison,
      eWeak: e.weak,
      san: run.san,
      maxSan: run.maxSan,
      armor: e.armor || (e.trait && e.trait.key === 'hide' ? e.trait.v : 0),
      lull: !!e.lull,
      comboMin: e.comboMin,
    });
    T.base = T.s.atk;
    T.steps = applyRelics(run.relics || [], {
      noHeal: e.noHeal,
      noSan: e.noSan,
      halfSan: e.halfSan,
      noMul: e.noMulAsleep && !e.phased,
      shuffle: e.shuffleRelics,
      s: T.s,
      rolls: b.rolls,
      cnt: T.cnt,
      combos: T.combos,
      lv: T.lv,
      san: run.san,
      maxSan: run.maxSan,
      hp: run.hp,
      maxHp: run.maxHp,
      eHp: e.hp / e.maxHp,
      ePoison: e.poison,
      rerollsLeft: b.rerolls,
      turn: b.turn || 1,
    });
    return T;
  }
  // apply your totals. out: 'win' | 'body' | 'mind' | null
  function playerResolve(b, run, T) {
    const { s, combos, lv } = T,
      e = b.e,
      ev = [];
    if (combos.length) {
      (run.relics || []).forEach(r => {
        if (RELICS[r.id].grow === 'combo') r.n = (r.n || 0) + 1;
      });
      if (hasRelic(run.relics, 'golddie')) {
        run.coins += 2;
        ev.push({ k: 'golddie', v: 2 });
      }
      ev.push({ k: 'combo', combos, lv, top: Math.max(...combos.map(k => lv[k])) });
    }
    if (s.atk) {
      const absorbed = Math.min(e.block, s.atk),
        dealt = s.atk - absorbed;
      e.block -= absorbed;
      e.hp -= dealt;
      ev.push({ k: 'atk', v: s.atk, dealt, absorbed, crit: dealt >= 20 || (lv.atk || 0) >= 2 });
      if (dealt > 0 && e.trait && e.trait.key === 'thorns' && !salted(run)) {
        run.hp = Math.max(0, run.hp - e.trait.v);
        ev.push({ k: 'thorns', v: e.trait.v });
      }
    }
    if (!s.atk && e.trait && e.trait.key === 'vengeful' && e.hp > 0) {
      e.str += e.trait.v;
      ev.push({ k: 'vengeful', v: e.trait.v });
    }
    if (s.blk) {
      b.pBlock += s.blk;
      ev.push({ k: 'blk', v: s.blk });
    }
    if (s.poison) {
      e.poison += s.poison;
      ev.push({ k: 'poison', v: s.poison });
    }
    if (s.weak) {
      e.weak += s.weak;
      ev.push({ k: 'weak', v: s.weak });
    }
    if (s.heal) {
      run.hp = Math.min(run.maxHp, run.hp + s.heal);
      ev.push({ k: 'heal', v: s.heal });
    }
    if (s.san) {
      run.san = Math.min(run.maxSan, run.san + s.san);
      ev.push({ k: 'san', v: s.san });
    }
    if (s.mad) {
      run.san = Math.max(0, run.san - s.mad);
      ev.push({ k: 'mad', v: s.mad });
    }
    const out = e.hp <= 0 ? 'win' : run.hp <= 0 ? 'body' : run.san <= 0 ? 'mind' : null;
    if (!out && checkPhase(b)) ev.push({ k: 'phase' });
    return { ev, out };
  }
  // bosses with a second form switch when their hp drops low enough
  function checkPhase(b) {
    const e = b.e;
    if (!(e.phase2 && !e.phased && e.hp > 0 && e.hp <= e.maxHp * e.phase2.at)) return false;
    e.phased = true;
    e.ii = 0;
    e.intents = e.phase2.intents.map(it => it.map(p => scaleFoePart(p, e.chs, e.atkCurse, e.hs)));
    e.name = e.phase2.name;
    return true;
  }

  /* ---------- enemy turn ---------- */
  // out: 'win' (poison killed it) | 'body' | 'mind' | null
  function enemyTurn(b, run) {
    const e = b.e,
      tr = e.trait,
      ev = [];
    e.block = 0;
    if (e.poison > 0) {
      e.hp -= e.poison;
      ev.push({ k: 'poisoned', v: e.poison });
      if (!bagHas(run.dice, 'poisonStay')) e.poison--;
      if (e.hp <= 0) return { ev, out: 'win' };
      if (checkPhase(b)) ev.push({ k: 'phase' });
    }
    if (e.regen && e.hp < e.maxHp) {
      const h = Math.min(e.regen, e.maxHp - e.hp);
      e.hp += h;
      ev.push({ k: 'regen', v: h });
    }
    const intent = curIntent(b);
    if (intent.some(p => p.t === 'atk' || p.t === 'drain')) ev.push({ k: 'lunge' });
    for (const p of intent) {
      if (p.t === 'atk' || p.t === 'drain') {
        const dmg = atkValue(b, run, p.v),
          absorbed = Math.min(b.pBlock, dmg),
          taken = dmg - absorbed;
        b.pBlock -= absorbed;
        run.hp = Math.max(0, run.hp - taken);
        if (p.t === 'drain') e.hp = Math.min(e.maxHp, e.hp + taken);
        ev.push({ k: p.t === 'drain' ? 'drain' : 'hit', dmg, absorbed, taken });
        if (taken > 0 && tr && tr.key === 'thief' && run.coins > 0 && !salted(run)) {
          const st = Math.min(run.coins, tr.v);
          run.coins -= st;
          ev.push({ k: 'steal', v: st });
        }
        if (taken > 0 && tr && tr.key === 'bleed' && !salted(run)) {
          b.bleed += tr.v;
          ev.push({ k: 'bleeding', v: tr.v });
        }
      } else if (p.t === 'blk') {
        e.block += p.v;
        ev.push({ k: 'eblk', v: p.v });
      } else if (p.t === 'mad') {
        run.san = Math.max(0, run.san - p.v);
        ev.push({ k: 'emad', v: p.v });
      } else if (p.t === 'str') {
        e.str += p.v;
        ev.push({ k: 'str', v: p.v });
      } else if (p.t === 'freeze') {
        b.freezeNext = Math.min(run.dice.length, p.v);
        ev.push({ k: 'freeze', v: p.v });
      } else if (p.t === 'daze') {
        b.dazeNext = p.v;
        ev.push({ k: 'daze', v: p.v });
      }
    }
    e.t++;
    if (tr && tr.key === 'harden') {
      e.block += tr.v;
      ev.push({ k: 'harden', v: tr.v });
    }
    if (tr && tr.key === 'grow') {
      e.str += tr.v;
      ev.push({ k: 'grow', v: tr.v });
    }
    if (tr && tr.key === 'dread') {
      run.san = Math.max(0, run.san - tr.v);
      ev.push({ k: 'dread', v: tr.v });
    }
    if (e.aura) {
      run.san = Math.max(0, run.san - e.aura);
      ev.push({ k: 'aura', v: e.aura });
    }
    if (e.wave && e.t % e.wave === 0) {
      b.freezeNext = run.dice.length;
      ev.push({ k: 'wave' });
    }
    if (e.weak > 0) e.weak--;
    e.ii = e.randomIntent ? R(e.intents.length) : e.ii + 1;
    return { ev, out: run.hp <= 0 ? 'body' : run.san <= 0 ? 'mind' : null };
  }

  /* ---------- after a win ---------- */
  // coins, boss max hp and kill counters (run mode only), then the small heal every win gives
  function winSpoils(run, { boss, rank, inRun }) {
    let gain = null;
    (run.relics || []).forEach(r => (r.off = false));
    if (inRun) {
      const it = interest(run.coins, run.relics);
      const g =
        (boss ? ECON.bossCoin : ECON.rank[rank || 2].coin) +
        (hasRelic(run.relics, 'coin') ? 1 : 0) +
        (hasRelic(run.relics, 'bounty') && (boss || rank === 3) ? 3 : 0);
      if (boss) {
        run.maxHp += ECON.bossMaxHp;
        run.hp += ECON.bossMaxHp;
      }
      run.coins += g + it;
      gain = { g, it };
      run.relics.forEach(r => {
        if (RELICS[r.id].grow === 'kill') r.n = (r.n || 0) + 1;
      });
    }
    run.san = Math.min(run.maxSan, run.san + ECON.winSan);
    run.hp = Math.min(run.maxHp, run.hp + ECON.winHeal);
    return gain;
  }
  // which dice you may summon after a normal-stage win, plus the extra heal for the rank
  function stageReward(run, ch, stage, rank) {
    const base = ch.tiers[stage] || [1];
    let rw;
    if (ch.pool && rank === 1) rw = { tiers: [Math.max(1, Math.min(...base) - 1)], n: 2, picks: 1, heal: 3, san: 0 };
    else if (ch.pool && rank === 3)
      rw = { tiers: [...new Set(base.map(t => Math.min(3, t + 1)))], n: 3, picks: 2, heal: 5, san: 2 };
    else rw = { tiers: base, n: 3, picks: 1, heal: 0, san: 0 };
    run.hp = Math.min(run.maxHp, run.hp + rw.heal);
    run.san = Math.min(run.maxSan, run.san + rw.san);
    return rw;
  }
  // "rest by the fire" instead of summoning
  function restPick(run) {
    run.hp = Math.min(run.maxHp, run.hp + restPickHp(run.curse));
    run.san = Math.min(run.maxSan, run.san + ECON.restPickSan);
  }
  // between chapters
  function restBetween(run) {
    run.hp = Math.min(run.maxHp, run.hp + ECON.rest.hp);
    run.san = Math.min(run.maxSan, run.san + ECON.rest.san);
  }
  // n = how many already bought this visit
  function drinkPotion(run, n) {
    run.coins -= potionCost(n, run.relics);
    run.hp = Math.min(run.maxHp, run.hp + ECON.potion.heal);
  }
  function burnIncense(run, n) {
    run.coins -= incenseCost(n, run.relics);
    run.san = Math.min(run.maxSan, run.san + ECON.incense.san);
  }

  /* ---------- event effects ---------- */
  // the state changes behind event choices (EVENTS in relics.js call these through the game's wrapper)
  // locked = dice not unlocked yet, never handed out
  function eventApi(run, locked) {
    locked = locked || [];
    const sc = id => DICE[id].faces.reduce((a, f) => a + faceScore(f), 0) + (SKILLS[id] ? 3 : 0);
    const weakest = () => {
      let wi = 0;
      run.dice.forEach((d, i) => {
        if (sc(d) < sc(run.dice[wi])) wi = i;
      });
      return wi;
    };
    const upLv = id => (run.ups && run.ups[id]) || 0;
    return {
      giveRelic(rar) {
        if (run.relics.length >= relicMax(run)) {
          run.coins += 4;
          return { full: true };
        }
        let pool = RELIC_KEYS.filter(k => !hasRelic(run.relics, k) && (!rar || RELICS[k].rar === rar));
        if (!pool.length) pool = RELIC_KEYS.filter(k => !hasRelic(run.relics, k));
        const id = pool[R(pool.length)];
        run.relics.push({ id, n: 0 });
        return { id };
      },
      sellWeakest(v) {
        const [gone] = run.dice.splice(weakest(), 1);
        run.coins += v;
        return { gone, v };
      },
      upgradeRandom(n, steps) {
        steps = steps || 1;
        run.ups = run.ups || {};
        const kinds = shuffled([...new Set(run.dice)].filter(id => upLv(id) < UP_MAX)).slice(0, n);
        if (!kinds.length) {
          run.coins += 4;
          return { none: true };
        }
        kinds.forEach(id => (run.ups[id] = Math.min(UP_MAX, upLv(id) + steps)));
        return { kinds, steps };
      },
      upgradeAll() {
        run.ups = run.ups || {};
        [...new Set(run.dice)].forEach(id => (run.ups[id] = Math.min(UP_MAX, upLv(id) + 1)));
        return {};
      },
      tradeUp() {
        const wi = weakest(),
          gone = run.dice[wi],
          t = Math.min(3, DICE[gone].tier + 1);
        const pool = Object.keys(DICE).filter(k => DICE[k].tier === t && !locked.includes(k) && k !== gone);
        if (!pool.length) {
          run.coins += 6;
          return { none: true };
        }
        const nw = pool[R(pool.length)];
        run.dice[wi] = nw;
        return { gone, nw };
      },
      giveDie(id) {
        if (run.dice.length >= 6) {
          run.coins += 4;
          return { full: true };
        }
        run.dice.push(id);
        return { id };
      },
    };
  }

  return {
    ECON,
    shopPrice,
    potionCost,
    incenseCost,
    restPickHp,
    foeHp,
    bossNums,
    foeTrait,
    newFoe,
    newBattle,
    curIntent,
    enraged,
    atkValue,
    upFace,
    rollDie,
    rerollDie,
    canReroll,
    startTurn,
    tally,
    playerResolve,
    checkPhase,
    enemyTurn,
    winSpoils,
    stageReward,
    restPick,
    restBetween,
    drinkPotion,
    burnIncense,
    eventApi,
  };
})();

if (typeof module !== 'undefined') module.exports = RULES;
