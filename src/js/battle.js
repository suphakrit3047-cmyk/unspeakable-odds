/* ---------- battle: the rules live in src/rules/rules.js; this file shows them ---------- */
const curIntent = () => RULES.curIntent(battle);
const enraged = () => RULES.enraged(battle);
const atkValue = v => RULES.atkValue(battle, run, v);
const tally = () => RULES.tally(battle, run);
const bump = (el, cls) => {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
};
const later = (ms, fn) => setTimeout(fn, ms);
const endBy = (out, ms) => later(ms, out === 'win' ? win : () => lose(out));

function startBattle(key) {
  const ch = run.ch;
  run.foeKey = key;
  run.path[run.stage] = { key, rank: run.rank };
  const e = RULES.newFoe(ch, key, { stage: run.stage, rank: run.rank, curse: run.curse, cursed: run.cursedNext });
  run.cursedNext = false;
  run.extraReroll = 0;
  if (e.boss) tip('boss');
  else tip('trait');
  cxSee('f:' + key);
  cxCount('fought', 'f:' + key);
  e.skill = e.skill ? { name: e.skill.name, text: fillSkill(e.skill.text, e) } : null;
  battle = { ...RULES.newBattle(e, run), busy: false, log: [] };
  if (ch.tut && run.stage === 2) run.san = Math.min(run.san, 8);
  run.tut.extra = null;
  log(`${e.name} ปรากฏตัว`);
  if (e.boss) later(150, () => SND.play('boss'));
  show('battle');
  startTurn();
}

function startTurn() {
  const { ev, out } = RULES.startTurn(battle, run);
  for (const x of ev) {
    if (x.k === 'bleed') {
      log(`เลือดไหล −${x.v}`);
      floatNum('#me-hp', '−' + x.v + ' เลือดไหล', 'hit');
      SND.play('hurt', x.v);
    } else if (x.k === 'relicOff')
      log(`${battle.e.name} ปิดเครื่องราง: ${x.idx.map(i => RELICS[run.relics[i].id].name).join(', ')}`);
    else if (x.k === 'frozen') log(`เต๋าของคุณถูกตรึง ${x.n} ลูก`);
    else if (x.k === 'dazed') log(`คุณมึนงง ทอยใหม่ได้ ${x.rerolls} ครั้ง`);
    else if (x.k === 'banish') log(`${battle.e.name} ส่งเต๋าของคุณไปมิติอื่น ${x.n} ลูก`);
  }
  if (out) {
    render(false);
    return endBy(out, 500);
  }
  SND.play('dice', run.dice.length);
  battle.busy = false;
  render(true);
}

function reroll() {
  if (battle.busy || battle.rerolls <= 0) return;
  const free = battle.rolls.filter(RULES.canReroll);
  if (!free.length) return;
  SND.play('dice', free.length);
  free.forEach(r => RULES.rerollDie(r, run));
  battle.rerolls--;
  coachEvent('reroll');
  render(true);
}

// your dice: skill dice glow one by one, then each relic adds its part to the score box
function resolve() {
  if (battle.busy) return;
  battle.busy = true;
  const T = tally();
  render(false);
  const SK = 380;
  const sk = battle.rolls.map((r, i) => ({ r, i })).filter(x => x.r.skTag && SKILLS[x.r.id] && !x.r.banished);
  sk.forEach((x, k) =>
    later(k * SK, () => {
      const el = document.querySelector(`#tray [data-i="${x.i}"]`);
      if (el) {
        bump(el, 'skfire');
        floatNum(el, `${SKILLS[x.r.id].name} ${x.r.skTag}`, 'skill');
      }
      SND.play('tick', k + 2);
    })
  );
  const lead = sk.length * SK;
  if (!T.steps.length) return later(lead, () => applyResult(T));
  const sb = $('#scorebox'),
    n = $('#sb-n');
  later(lead, () => {
    sb.hidden = false;
    n.textContent = T.base;
    bump(sb, 'pop');
  });
  T.steps.forEach((st, k) =>
    later(lead + 260 + k * 300, () => {
      const el = document.querySelector(`#relicbar [data-ri="${st.i}"]`);
      if (el) {
        bump(el, 'fire');
        floatNum(el, st.t, st.t.startsWith('×') ? 'mult' : 'add');
      }
      if (st.atk !== st.from) {
        n.textContent = st.atk;
        bump(n, 'bump');
      }
      SND.play('tick', k);
    })
  );
  later(lead + 520 + T.steps.length * 300, () => {
    sb.hidden = true;
    applyResult(T);
  });
}

function applyResult(T) {
  const e = battle.e;
  const { ev, out } = RULES.playerResolve(battle, run, T);
  const parts = [];
  let top = 0;
  for (const x of ev) {
    if (x.k === 'golddie') floatNum('#coins', '+' + x.v, 'coin');
    else if (x.k === 'combo') {
      top = x.top;
      parts.push(x.combos.map(k => `${COMBO_NAME[x.lv[k]]} ${TYPES[k].l} ×${COMBO_MULT[x.lv[k]]}`).join(', '));
      coachEvent('combo');
    } else if (x.k === 'atk') {
      if (x.dealt > 0) floatNum('#enemy', '−' + x.dealt, x.crit ? 'hit crit' : 'hit');
      else floatNum('#enemy', 'โล่กัน', 'blk');
      SND.play(x.dealt > 0 ? 'hit' : 'block', x.dealt);
      if (x.crit) quake(top >= 3 ? 2 : 1);
      parts.push(`โจมตี ${x.v}` + (x.absorbed ? ` (โล่กัน ${x.absorbed})` : ''));
      bump($('#enemy'), 'hit');
    } else if (x.k === 'thorns') {
      parts.push(`โดนหนามพิษ −${x.v}`);
      later(300, () => {
        floatNum('#me-hp', '−' + x.v + ' หนาม', 'hit');
        SND.play('hurt', x.v);
      });
    } else if (x.k === 'vengeful') {
      parts.push(`${e.name}แค้น พลัง +${x.v}`);
      later(250, () => floatNum('#enemy', 'แค้น +' + x.v, 'hit'));
    } else if (x.k === 'blk') {
      parts.push(`โล่ ${x.v}`);
      later(120, () => SND.play('block'));
    } else if (x.k === 'poison') {
      parts.push(`พิษ +${x.v}`);
      later(180, () => SND.play('poison'));
    } else if (x.k === 'weak') parts.push(`อ่อนแรง ${x.v} เทิร์น`);
    else if (x.k === 'heal') {
      parts.push(`ฟื้น ${x.v}`);
      floatNum('#me-hp', '+' + x.v, 'heal');
      later(220, () => SND.play('heal'));
    } else if (x.k === 'san') {
      parts.push(`สติ +${x.v}`);
      later(260, () => SND.play('san'));
    } else if (x.k === 'mad') {
      parts.push(`สติ −${x.v}`);
      floatNum('#me-sn', '−' + x.v, 'mad');
      later(200, () => SND.play('mad'));
    }
  }
  if (T.s.blk) floatNum('#pstat', '+' + T.s.blk + ' โล่', 'blk');
  log('คุณ: ' + (parts.join(' · ') || 'ไม่มีผลอะไรเลย'));
  coachEvent('resolve');
  render(false);
  if (out) return endBy(out, 700);
  if (ev.some(x => x.k === 'phase')) phaseShown();
  later(700, enemyTurn);
}
function phaseShown() {
  log(`${battle.e.name}! ท่าทั้งหมดเปลี่ยนไป`);
  render(false);
}

function enemyTurn() {
  const e = battle.e,
    nameBefore = e.name; // poison is logged under the old name if it pushes a boss into phase 2
  const { ev, out } = RULES.enemyTurn(battle, run);
  const parts = [];
  for (const x of ev) {
    switch (x.k) {
      case 'poisoned':
        log(`${nameBefore} โดนพิษ ${x.v}`);
        break;
      case 'phase':
        phaseShown();
        break;
      case 'regen':
        log(`${e.name} ฟื้นเลือด ${x.v}`);
        break;
      case 'lunge':
        bump($('#enemy .portrait'), 'lunge');
        break;
      case 'hit':
      case 'drain':
        SND.play(x.taken ? 'hurt' : 'block', x.taken);
        if (x.taken >= 12) quake(1);
        if (x.taken) {
          floatNum('#me-hp', '−' + x.taken, 'hit');
          bump($('#s-battle'), 'hurt');
        }
        if (x.k === 'drain') parts.push(`ดูดเลือด ${x.dmg}` + (x.taken ? ` ฟื้น ${x.taken}` : ' (โล่กันหมด)'));
        else parts.push(`โจมตี ${x.dmg}` + (x.absorbed ? ` (โล่กัน ${x.absorbed})` : ''));
        break;
      case 'steal':
        parts.push(`ขโมยเงิน ${x.v}`);
        later(250, () => floatNum('#coins', '−' + x.v + ' ◉', 'hit'));
        break;
      case 'bleeding':
        parts.push(`เลือดไหล +${x.v}`);
        break;
      case 'eblk':
        parts.push(`ตั้งโล่ ${x.v}`);
        break;
      case 'emad':
        parts.push(`กัดกินสติ ${x.v}`);
        floatNum('#me-sn', '−' + x.v, 'mad');
        SND.play('mad');
        break;
      case 'str':
        parts.push(`เพิ่มพลัง +${x.v}`);
        break;
      case 'freeze':
        parts.push(`ตรึงเต๋า ${x.v} ลูกเทิร์นหน้า`);
        coachEvent('freeze');
        break;
      case 'daze':
        parts.push('ทำให้คุณมึน');
        coachEvent('daze');
        break;
      case 'harden':
        parts.push(`เปลือกแข็ง โล่ +${x.v}`);
        later(200, () => floatNum('#enemy', '+' + x.v + ' โล่', 'blk'));
        break;
      case 'grow':
        parts.push(`โตขึ้น พลัง +${x.v}`);
        later(200, () => floatNum('#enemy', 'พลัง +' + x.v, 'hit'));
        break;
      case 'dread':
        parts.push(`ความหลอน สติ −${x.v}`);
        floatNum('#me-sn', '−' + x.v, 'mad');
        break;
      case 'aura':
        parts.push(`สัญลักษณ์สีเหลืองกัดกินสติ ${x.v}`);
        break;
      case 'wave':
        parts.push('คลื่นยักษ์! ตรึงเต๋าทั้งถุงเทิร์นหน้า');
        break;
    }
  }
  if (out === 'win') {
    render(false);
    return endBy(out, 600);
  }
  log(`${e.name}: ` + parts.join(' · '));
  coachEvent('enemy');
  render(false);
  if (out) return endBy(out, 600);
  later(550, startTurn);
}

function win() {
  cxCount('won', 'f:' + run.foeKey);
  const boss = !!FOES[run.foeKey].boss;
  const gain = RULES.winSpoils(run, { boss, rank: run.rank, inRun: run.mode === 'run' });
  if (gain) {
    run.lastGain = gain;
    later(350, () => SND.play('coin'));
  }
  run.cleared = (run.cleared || 0) + 1;
  if (boss) run.bosses = (run.bosses || 0) + 1;
  SND.play(boss ? 'chapter' : 'win');
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
  run.reward = RULES.stageReward(run, run.ch, run.stage, run.rank);
  run.picksLeft = run.reward.picks;
  run.taken = 0;
  showReward();
}
function lose(kind) {
  cxCount('lost', 'f:' + run.foeKey);
  SND.play('lose');
  endScreen(false, kind);
}
