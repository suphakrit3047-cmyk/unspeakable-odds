/* ---------- battle: turns, rolling, resolve, enemy turn, win / lose ---------- */
function startBattle(key) {
  const ch = run.ch,
    E = FOES[key];
  run.foeKey = key;
  run.path[run.stage] = { key, rank: run.rank };
  let hp = foeHp(key, run.rank);
  if (run.cursedNext) {
    hp = Math.round(hp * 1.25);
    run.cursedNext = false;
  }
  run.extraReroll = 0;
  if (E.boss) tip('boss');
  else tip('trait');
  cxSee('f:' + key);
  cxCount('fought', 'f:' + key);
  const hs = hp / E.hp,
    bn = bossNums(E, hp);
  battle = {
    e: {
      ...E,
      hp,
      maxHp: hp,
      hs,
      intents: E.intents.map(it => it.map(p => scalePart(p, hs))),
      block: 0,
      poison: 0,
      weak: 0,
      str: 0,
      ii: 0,
      t: 0,
      phased: false,
      trait: foeTrait(key, hp),
      feast: bn.feast,
      regen: bn.regen,
      skill: E.skill ? { name: E.skill.name, text: fillSkill(E.skill.text, bn) } : null,
    },
    rolls: [],
    rerolls: 2,
    bonusRR: run.extraReroll || 0,
    pBlock: 0,
    bleed: 0,
    freezeNext: 0,
    dazeNext: 0,
    busy: false,
    log: [],
  };
  if (ch.tut && run.stage === 2) run.san = Math.min(run.san, 8);
  run.tut.extra = null;
  log(`${E.name} ปรากฏตัว`);
  if (E.boss) setTimeout(() => SND.play('boss'), 150);
  show('battle');
  startTurn();
}
function rollOne(r) {
  const d = DICE[r.id],
    sk = SKILLS[r.id] || {};
  let f = { ...d.faces[R(6)] };
  r.dist = null;
  if (run.san <= 8 && !sk.noDistort && Math.random() < 0.3) {
    if (f.t !== 'none' && f.t !== 'mad' && Math.random() < 0.5) {
      f.v *= 2;
      r.dist = 'pow';
    } else {
      f = F('mad', 1);
      r.dist = 'mad';
    }
  } else f = upFace(f, r.id);
  r.face = f;
}
function startTurn() {
  battle.turn = (battle.turn || 0) + 1;
  if (battle.bleed > 0) {
    run.hp = Math.max(0, run.hp - battle.bleed);
    log(`เลือดไหล −${battle.bleed}`);
    floatNum('#me-hp', '−' + battle.bleed + ' เลือดไหล', 'hit');
    SND.play('hurt', battle.bleed);
    battle.bleed--;
    if (run.hp <= 0) {
      render(false);
      return setTimeout(() => lose('body'), 500);
    }
  }
  SND.play('dice', run.dice.length);
  battle.pBlock = 0;
  battle.rerolls =
    Math.min(battle.e.maxReroll != null ? battle.e.maxReroll : 2, Math.max(0, 2 - battle.dazeNext)) +
    (battle.bonusRR || 0);
  if (run.relics) {
    run.relics.forEach(r => (r.off = false));
    if (battle.e.relicOff && run.relics.length) {
      const idx = run.relics
        .map((_, i) => i)
        .sort(() => Math.random() - 0.5)
        .slice(0, battle.e.relicOff);
      idx.forEach(i => (run.relics[i].off = true));
      log(`${battle.e.name} ปิดเครื่องราง: ${idx.map(i => RELICS[run.relics[i].id].name).join(', ')}`);
    }
  }
  battle.rolls = run.dice.map(id => ({ id, held: false, frozen: false, fresh: true }));
  battle.rolls.forEach(rollOne);
  const idx = [...battle.rolls.keys()]
    .filter(i => !(SKILLS[battle.rolls[i].id] || {}).noFreeze)
    .sort(() => Math.random() - 0.5)
    .slice(0, battle.freezeNext);
  idx.forEach(i => (battle.rolls[i].frozen = true));
  if (battle.freezeNext) log(`เต๋าของคุณถูกตรึง ${idx.length} ลูก`);
  if (battle.dazeNext) log(`คุณมึนงง ทอยใหม่ได้ ${battle.rerolls} ครั้ง`);
  battle.freezeNext = 0;
  battle.dazeNext = 0;
  if (battle.e.chaos) {
    const all = Object.keys(DICE);
    const free = [...battle.rolls.keys()]
      .filter(i => !battle.rolls[i].frozen)
      .sort(() => Math.random() - 0.5)
      .slice(0, battle.e.chaos);
    free.forEach(i => {
      const r = battle.rolls[i];
      r.face = { ...DICE[all[R(all.length)]].faces[R(6)] };
      r.chaos = true;
      r.dist = null;
    });
  }
  if (battle.e.banish) {
    const free = [...battle.rolls.keys()]
      .filter(i => !battle.rolls[i].frozen)
      .sort(() => Math.random() - 0.5)
      .slice(0, battle.e.banish);
    free.forEach(i => {
      battle.rolls[i].banished = true;
    });
    if (free.length) log(`${battle.e.name} ส่งเต๋าของคุณไปมิติอื่น ${free.length} ลูก`);
  }
  battle.busy = false;
  render(true);
}
function reroll() {
  if (!battle.busy && battle.rerolls > 0)
    SND.play('dice', battle.rolls.filter(r => !r.held && !r.frozen && !r.banished).length);
  if (battle.busy || battle.rerolls <= 0) return;
  if (battle.rolls.every(r => r.held || r.frozen || r.banished)) return;
  battle.rolls.forEach(r => {
    if (r.held || r.frozen || r.banished) return;
    const old = { face: r.face, dist: r.dist };
    rollOne(r);
    r.fresh = false;
    r.chaos = false;
    if ((SKILLS[r.id] || {}).keepBetter && faceScore(old.face) > faceScore(r.face)) {
      r.face = old.face;
      r.dist = old.dist;
      r.kept = true;
    } else r.kept = false;
  });
  battle.rerolls--;
  coachEvent('reroll');
  render(true);
}
function tally() {
  const e = battle.e;
  const T = computeTally(battle.rolls, {
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
  T.steps = [];
  T.steps = applyRelics(run.relics || [], {
    noHeal: e.noHeal,
    noSan: e.noSan,
    halfSan: e.halfSan,
    noMul: e.noMulAsleep && !e.phased,
    shuffle: e.shuffleRelics,
    s: T.s,
    rolls: battle.rolls,
    cnt: T.cnt,
    combos: T.combos,
    lv: T.lv,
    san: run.san,
    maxSan: run.maxSan,
    hp: run.hp,
    maxHp: run.maxHp,
    eHp: e.hp / e.maxHp,
    ePoison: e.poison,
    rerollsLeft: battle.rerolls,
    turn: battle.turn || 1,
  });
  return T;
}
function curIntent() {
  const e = battle.e;
  return e.intents[e.ii % e.intents.length];
}
function enraged() {
  const e = battle.e;
  return !!(e.trait && e.trait.key === 'enrage' && e.hp < e.maxHp / 2);
}
function atkValue(v) {
  const e = battle.e;
  let x = v + e.str + (e.feast && run.hp < run.maxHp / 2 ? e.feast : 0);
  if (enraged()) x = Math.floor(x * 1.5);
  if (e.weak > 0) x = Math.floor(x * 0.7);
  return x;
}

function resolve() {
  if (battle.busy) return;
  battle.busy = true;
  const T = tally();
  render(false);
  const sk = battle.rolls.map((r, i) => ({ r, i })).filter(x => x.r.skTag && SKILLS[x.r.id] && !x.r.banished);
  const SK = 380;
  sk.forEach((x, k) =>
    setTimeout(() => {
      const el = document.querySelector(`#tray [data-i="${x.i}"]`);
      if (el) {
        el.classList.remove('skfire');
        void el.offsetWidth;
        el.classList.add('skfire');
        floatNum(el, `${SKILLS[x.r.id].name} ${x.r.skTag}`, 'skill');
      }
      SND.play('tick', k + 2);
    }, k * SK)
  );
  const lead = sk.length * SK;
  if (!T.steps.length) return setTimeout(() => applyResult(T), lead);
  const sb = $('#scorebox'),
    n = $('#sb-n');
  setTimeout(() => {
    sb.hidden = false;
    n.textContent = T.base;
    sb.classList.remove('pop');
    void sb.offsetWidth;
    sb.classList.add('pop');
  }, lead);
  T.steps.forEach((st, k) =>
    setTimeout(
      () => {
        const el = document.querySelector(`#relicbar [data-ri="${st.i}"]`);
        if (el) {
          el.classList.remove('fire');
          void el.offsetWidth;
          el.classList.add('fire');
          floatNum(el, st.t, st.t.startsWith('×') ? 'mult' : 'add');
        }
        if (st.atk !== st.from) {
          n.textContent = st.atk;
          n.classList.remove('bump');
          void n.offsetWidth;
          n.classList.add('bump');
        }
        SND.play('tick', k);
      },
      lead + 260 + k * 300
    )
  );
  setTimeout(
    () => {
      sb.hidden = true;
      applyResult(T);
    },
    lead + 520 + T.steps.length * 300
  );
}
function applyResult(T) {
  const { s, combos, lv } = T;
  const e = battle.e;
  if (combos.length && run.relics) {
    run.relics.forEach(r => {
      if (RELICS[r.id].grow === 'combo') r.n = (r.n || 0) + 1;
    });
    if (hasRelic(run.relics, 'golddie')) {
      run.coins += 2;
      floatNum('#coins', '+2', 'coin');
    }
  }
  const parts = [];
  const top = combos.length ? Math.max(...combos.map(k => lv[k])) : 0;
  if (combos.length) {
    parts.push(combos.map(k => `${COMBO_NAME[lv[k]]} ${TYPES[k].l} ×${COMBO_MULT[lv[k]]}`).join(', '));
    coachEvent('combo');
  }
  if (s.atk) {
    const absorbed = Math.min(e.block, s.atk),
      dealt = s.atk - absorbed;
    e.block -= absorbed;
    e.hp -= dealt;
    const crit = dealt >= 20 || (lv.atk || 0) >= 2;
    if (dealt > 0) floatNum('#enemy', '−' + dealt, crit ? 'hit crit' : 'hit');
    else floatNum('#enemy', 'โล่กัน', 'blk');
    SND.play(dealt > 0 ? 'hit' : 'block', dealt);
    if (crit) quake(top >= 3 ? 2 : 1);
    parts.push(`โจมตี ${s.atk}` + (absorbed ? ` (โล่กัน ${absorbed})` : ''));
    const el = $('#enemy');
    el.classList.remove('hit');
    void el.offsetWidth;
    el.classList.add('hit');
    if (dealt > 0 && e.trait && e.trait.key === 'thorns' && !hasRelic(run.relics, 'salt')) {
      run.hp = Math.max(0, run.hp - e.trait.v);
      parts.push(`โดนหนามพิษ −${e.trait.v}`);
      setTimeout(() => {
        floatNum('#me-hp', '−' + e.trait.v + ' หนาม', 'hit');
        SND.play('hurt', e.trait.v);
      }, 300);
    }
  }
  if (!s.atk && e.trait && e.trait.key === 'vengeful' && e.hp > 0) {
    e.str += e.trait.v;
    parts.push(`${e.name}แค้น พลัง +${e.trait.v}`);
    setTimeout(() => floatNum('#enemy', 'แค้น +' + e.trait.v, 'hit'), 250);
  }
  if (s.blk) {
    battle.pBlock += s.blk;
    parts.push(`โล่ ${s.blk}`);
    setTimeout(() => SND.play('block'), 120);
  }
  if (s.poison) {
    e.poison += s.poison;
    parts.push(`พิษ +${s.poison}`);
    setTimeout(() => SND.play('poison'), 180);
  }
  if (s.weak) {
    e.weak += s.weak;
    parts.push(`อ่อนแรง ${s.weak} เทิร์น`);
  }
  if (s.heal) {
    run.hp = Math.min(run.maxHp, run.hp + s.heal);
    parts.push(`ฟื้น ${s.heal}`);
    floatNum('#me-hp', '+' + s.heal, 'heal');
    setTimeout(() => SND.play('heal'), 220);
  }
  if (s.san) {
    run.san = Math.min(run.maxSan, run.san + s.san);
    parts.push(`สติ +${s.san}`);
    setTimeout(() => SND.play('san'), 260);
  }
  if (s.mad) {
    run.san = Math.max(0, run.san - s.mad);
    parts.push(`สติ −${s.mad}`);
    floatNum('#me-sn', '−' + s.mad, 'mad');
    setTimeout(() => SND.play('mad'), 200);
  }
  if (s.blk) floatNum('#pstat', '+' + s.blk + ' โล่', 'blk');
  log('คุณ: ' + (parts.join(' · ') || 'ไม่มีผลอะไรเลย'));
  coachEvent('resolve');
  render(false);
  if (e.hp <= 0) return setTimeout(win, 700);
  if (run.hp <= 0) return setTimeout(() => lose('body'), 700);
  if (run.san <= 0) return setTimeout(() => lose('mind'), 700);
  checkPhase();
  setTimeout(enemyTurn, 700);
}

function checkPhase() {
  const e = battle.e;
  if (e.phase2 && !e.phased && e.hp > 0 && e.hp <= e.maxHp * e.phase2.at) {
    e.phased = true;
    e.ii = 0;
    e.intents = e.phase2.intents.map(it => it.map(p => scalePart(p, e.hs)));
    e.name = e.phase2.name;
    log(`${e.name}! ท่าทั้งหมดเปลี่ยนไป`);
    render(false);
  }
}
function enemyTurn() {
  const e = battle.e;
  e.block = 0;
  if (e.poison > 0) {
    e.hp -= e.poison;
    log(`${e.name} โดนพิษ ${e.poison}`);
    if (!bagHas(run.dice, 'poisonStay')) e.poison--;
    if (e.hp <= 0) {
      render(false);
      return setTimeout(win, 600);
    }
    checkPhase();
  }
  if (e.regen && e.hp < e.maxHp) {
    const h = Math.min(e.regen, e.maxHp - e.hp);
    e.hp += h;
    log(`${e.name} ฟื้นเลือด ${h}`);
  }
  const parts = [],
    tr = e.trait;
  if (curIntent().some(p => p.t === 'atk' || p.t === 'drain')) {
    const pc = $('#enemy .portrait');
    if (pc) {
      pc.classList.remove('lunge');
      void pc.offsetWidth;
      pc.classList.add('lunge');
    }
  }
  for (const p of curIntent()) {
    if (p.t === 'atk' || p.t === 'drain') {
      const dmg = atkValue(p.v);
      const absorbed = Math.min(battle.pBlock, dmg);
      const taken = dmg - absorbed;
      battle.pBlock -= absorbed;
      run.hp = Math.max(0, run.hp - taken);
      SND.play(taken ? 'hurt' : 'block', taken);
      if (taken >= 12) quake(1);
      if (taken) {
        floatNum('#me-hp', '−' + taken, 'hit');
        const sb = $('#s-battle');
        sb.classList.remove('hurt');
        void sb.offsetWidth;
        sb.classList.add('hurt');
      }
      if (p.t === 'drain') {
        e.hp = Math.min(e.maxHp, e.hp + taken);
        parts.push(`ดูดเลือด ${dmg}` + (taken ? ` ฟื้น ${taken}` : ' (โล่กันหมด)'));
      } else parts.push(`โจมตี ${dmg}` + (absorbed ? ` (โล่กัน ${absorbed})` : ''));
      if (taken > 0 && tr && tr.key === 'thief' && run.coins > 0 && !hasRelic(run.relics, 'salt')) {
        const st = Math.min(run.coins, tr.v);
        run.coins -= st;
        parts.push(`ขโมยเงิน ${st}`);
        setTimeout(() => floatNum('#coins', '−' + st + ' ◉', 'hit'), 250);
      }
      if (taken > 0 && tr && tr.key === 'bleed' && !hasRelic(run.relics, 'salt')) {
        battle.bleed += tr.v;
        parts.push(`เลือดไหล +${tr.v}`);
      }
    } else if (p.t === 'blk') {
      e.block += p.v;
      parts.push(`ตั้งโล่ ${p.v}`);
    } else if (p.t === 'mad') {
      run.san = Math.max(0, run.san - p.v);
      parts.push(`กัดกินสติ ${p.v}`);
      floatNum('#me-sn', '−' + p.v, 'mad');
      SND.play('mad');
    } else if (p.t === 'str') {
      e.str += p.v;
      parts.push(`เพิ่มพลัง +${p.v}`);
    } else if (p.t === 'freeze') {
      battle.freezeNext = Math.min(run.dice.length, p.v);
      parts.push(`ตรึงเต๋า ${p.v} ลูกเทิร์นหน้า`);
      coachEvent('freeze');
    } else if (p.t === 'daze') {
      battle.dazeNext = p.v;
      parts.push('ทำให้คุณมึน');
      coachEvent('daze');
    }
  }
  e.t++;
  if (tr && tr.key === 'harden') {
    e.block += tr.v;
    parts.push(`เปลือกแข็ง โล่ +${tr.v}`);
    setTimeout(() => floatNum('#enemy', '+' + tr.v + ' โล่', 'blk'), 200);
  }
  if (tr && tr.key === 'grow') {
    e.str += tr.v;
    parts.push(`โตขึ้น พลัง +${tr.v}`);
    setTimeout(() => floatNum('#enemy', 'พลัง +' + tr.v, 'hit'), 200);
  }
  if (tr && tr.key === 'dread') {
    run.san = Math.max(0, run.san - tr.v);
    parts.push(`ความหลอน สติ −${tr.v}`);
    floatNum('#me-sn', '−' + tr.v, 'mad');
  }
  if (e.aura) {
    run.san = Math.max(0, run.san - e.aura);
    parts.push(`สัญลักษณ์สีเหลืองกัดกินสติ ${e.aura}`);
  }
  if (e.wave && e.t % e.wave === 0) {
    battle.freezeNext = run.dice.length;
    parts.push('คลื่นยักษ์! ตรึงเต๋าทั้งถุงเทิร์นหน้า');
  }
  if (e.weak > 0) e.weak--;
  e.ii = e.randomIntent ? R(e.intents.length) : e.ii + 1;
  log(`${e.name}: ` + parts.join(' · '));
  coachEvent('enemy');
  render(false);
  if (run.hp <= 0) return setTimeout(() => lose('body'), 600);
  if (run.san <= 0) return setTimeout(() => lose('mind'), 600);
  setTimeout(startTurn, 550);
}

function win() {
  cxCount('won', 'f:' + run.foeKey);
  (run.relics || []).forEach(r => (r.off = false));
  if (run.mode === 'run') {
    const boss = !!FOES[run.foeKey].boss,
      it = interest(run.coins, run.relics);
    const g =
      (boss ? BOSS_COIN : RANK[run.rank || 2].coin) +
      (hasRelic(run.relics, 'coin') ? 1 : 0) +
      (hasRelic(run.relics, 'bounty') && (boss || run.rank === 3) ? 3 : 0);
    if (boss) {
      run.maxHp += BOSS_MAXHP;
      run.hp += BOSS_MAXHP;
    }
    run.coins += g + it;
    run.lastGain = { g, it };
    run.relics.forEach(r => {
      if (RELICS[r.id].grow === 'kill') r.n = (r.n || 0) + 1;
    });
    setTimeout(() => SND.play('coin'), 350);
  }
  run.cleared = (run.cleared || 0) + 1;
  if (FOES[run.foeKey].boss) run.bosses = (run.bosses || 0) + 1;
  SND.play(FOES[run.foeKey].boss ? 'chapter' : 'win');
  run.san = Math.min(run.maxSan, run.san + WIN_SAN);
  run.hp = Math.min(run.maxHp, run.hp + WIN_HEAL);
  if (run.stage === stagesOf(run.ch) - 1) {
    if (run.mode !== 'run') return endScreen(true);
    if (run.ch.secret) return showPages(['az_close'], () => endScreen(true, 'az'), true);
    const pos = RUN_ORDER.indexOf(run.ci),
      close = [run.ch.id + '_close'];
    if (pos < RUN_ORDER.length - 1) {
      run.nextI = RUN_ORDER[pos + 1];
      return showPages(close, () => interScreen());
    }
    if (stars.length >= STAR_NEED && AZ_I >= 0) {
      run.nextI = AZ_I;
      return showPages(close, () => interScreen());
    }
    return showPages(close, () => endScreen(true), true);
  }
  const base = run.ch.tiers[run.stage] || [1];
  if (run.ch.pool && run.rank === 1)
    run.reward = { tiers: [Math.max(1, Math.min(...base) - 1)], n: 2, picks: 1, heal: 3, san: 0 };
  else if (run.ch.pool && run.rank === 3)
    run.reward = { tiers: [...new Set(base.map(t => Math.min(3, t + 1)))], n: 3, picks: 2, heal: 5, san: 2 };
  else run.reward = { tiers: base, n: 3, picks: 1, heal: 0, san: 0 };
  run.hp = Math.min(run.maxHp, run.hp + run.reward.heal);
  run.san = Math.min(run.maxSan, run.san + run.reward.san);
  run.picksLeft = run.reward.picks;
  run.taken = 0;
  showReward();
}
function lose(kind) {
  cxCount('lost', 'f:' + run.foeKey);
  SND.play('lose');
  endScreen(false, kind);
}
