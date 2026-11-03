/* ---------- run flow ---------- */
function startChapter(i) {
  const ch = CHAPTERS[i];
  run = {
    mode: 'tut',
    ci: i,
    ch,
    hp: 45,
    maxHp: 45,
    san: 20,
    maxSan: 20,
    dice: [...STARTER],
    stage: 0,
    path: [],
    tut: { step: 0, seen: {} },
  };
  STARTER.forEach(id => cxSee('d:' + id));
  beginStage();
}
function wantSetup() {
  return META.maxCurse > 0 || META_SHOP.some(u => u.kind === 'bag' && owns(u.id));
}
function beginRunFlow() {
  if (wantSetup()) renderSetup();
  else startRun();
}
function renderSetup() {
  if (META.bag !== 'default' && !owns(META.bag)) META.bag = 'default';
  META.curse = Math.min(META.curse, META.maxCurse);
  const bags = [{ id: 'default', name: 'ถุงผู้ทำพิธี', text: 'ผู้ทำพิธีดาบ 2 ลูก โล่ 2 ลูก', bag: STARTER }].concat(
    META_SHOP.filter(u => u.kind === 'bag' && owns(u.id))
  );
  $('#setup-bags').innerHTML = bags
    .map(
      b => `<button class="pick ${META.bag === b.id ? 'on' : ''}" data-bag="${b.id}">
    <span class="pick-dice">${b.bag.map(id => `<canvas class="portrait" data-foe="${DIE_ART[id] || id}" data-static></canvas>`).join('')}</span>
    <span><b>${b.name}</b><span class="dim">${b.text}</span></span></button>`
    )
    .join('');
  $('#setup-curse-wrap').hidden = META.maxCurse === 0;
  $('#setup-curses').innerHTML = CURSES.slice(0, META.maxCurse + 1)
    .map(
      (c, i) =>
        `<button class="pick ${META.curse === i ? 'on' : ''}" data-curse="${i}"><span><b>${c.name}</b><span class="dim">${c.text}</span></span></button>`
    )
    .join('');
  show('setup');
}
function startRun() {
  REC.runs++;
  store(RKEY, REC);
  const cur = META.curse || 0,
    cm = curseMod(cur),
    mb = metaBonus();
  const san = (cm.san || 20) + mb.san;
  run = {
    mode: 'run',
    ci: RUN_ORDER[0],
    hp: 45 + mb.hp,
    maxHp: 45 + mb.hp,
    san,
    maxSan: 20 + mb.san,
    dice: [...bagOf(META.bag)],
    stage: 0,
    path: [],
    tut: { step: 0, seen: {} },
    curse: cur,
    cleared: 0,
    bosses: 0,
    coins: 0,
    relics: [],
    ups: {},
  };
  run.ch = CHAPTERS[run.ci];
  STARTER.forEach(id => cxSee('d:' + id));
  showPages(['prologue', run.ch.id + '_open'], beginStage);
}
function interScreen(resumed) {
  const ch = run.ch,
    nextI = run.nextI,
    nx = CHAPTERS[nextI];
  if (!resumed) {
    RULES.restBetween(run);
    const pos = RUN_ORDER.indexOf(run.ci);
    if (pos > REC.best) {
      REC.best = pos;
      store(RKEY, REC);
    }
    tip('inter');
    if (nx.secret && !REC.azSeen) {
      REC.azSeen = true;
      store(RKEY, REC);
    }
  }
  $('#i-eyebrow').textContent = `${ch.name} · ${ch.place}`;
  $('#i-title').textContent = nx.secret ? 'เสียงขลุ่ยดังมาจากใจกลางจักรวาล' : `ผ่าน${ch.name}`;
  $('#i-text').textContent = nx.secret
    ? `แสงเล็ก ๆ ที่คุณเก็บมาตลอดทางส่องให้เห็นประตูบานที่ยอก-โซโธธเคยเฝ้า ข้างหลังคือสิ่งที่ไม่เคยหลับ เลือด ${run.hp}/${run.maxHp} · สติ ${run.san}/${run.maxSan}`
    : `ชนะบอสแล้ว เลือดสูงสุด +${BOSS_MAXHP} · พักระหว่างทาง เลือด +${REST.hp} สติ +${REST.san} ตอนนี้เลือด ${run.hp}/${run.maxHp} · สติ ${run.san}/${run.maxSan}`;
  $('#i-next').innerHTML =
    `<span class="eyebrow">ต่อไป · ${nx.name}</span><h3>${nx.place}</h3><p class="dim">${nx.blurb}</p>
    <p class="bossline dim">บอสรออยู่ปลายทาง ไม่มีใครรู้ว่าคือสิ่งใด</p>`;
  $('#i-dice').innerHTML = run.dice.map(id => dieCard(id)).join('');
  paintTip('#i-coach');
  show('inter');
  saveRun('inter');
}
function onward() {
  run.ci = run.nextI;
  run.ch = CHAPTERS[run.ci];
  run.stage = 0;
  run.path = [];
  run.offers = null;
  run.choice = null;
  showPages([run.ch.id + '_open'], () => {
    if (run.mode === 'run' && !run.ch.secret) {
      run.shop = null;
      return showRunShop();
    }
    beginStage();
  });
}
// labels for the three foe choices; hp and coin numbers are in RULES.ECON.rank
const RANK = {
  1: {
    l: 'ง่าย',
    c: 'var(--verd)',
    reward: 'อสูรระดับต่ำกว่าปกติ 2 ตัวให้เลือก 1 · เลือด +3 · เงิน 1',
  },
  2: { l: 'ปกติ', c: 'var(--steel)', reward: 'อสูร 3 ตัวให้เลือก 1 · เงิน 2' },
  3: {
    l: 'อันตราย',
    c: 'var(--blood)',
    reward: 'อสูรระดับสูงขึ้น เลือกได้ 2 ตัว · เลือด +5 · สติ +2 · เงิน 4',
  },
};
const WIN_HEAL = RULES.ECON.winHeal,
  WIN_SAN = RULES.ECON.winSan,
  BOSS_MAXHP = RULES.ECON.bossMaxHp,
  REST = RULES.ECON.rest;
const isBossStage = () => run.ch.pool && run.stage === stagesOf(run.ch) - 1;
function beginStage() {
  const ch = run.ch;
  if (run.stage === 0) cxSee('p:' + ch.id);
  if (!ch.pool) {
    run.rank = 2;
    return startBattle(ch.foes[run.stage]);
  }
  if (isBossStage()) {
    run.rank = 2;
    return startBattle(ch.boss);
  }
  showChoice();
}
// numbers the choose-a-foe screen shows (the battle itself builds the foe in RULES.newFoe)
const foeHp = (key, rank) => RULES.foeHp(run.ch, run.stage, key, rank, run.curse);
const scalePart = (p, hpScale) => scaleFoePart(p, run.ch, curseMod(run.curse || 0).atk, hpScale);
const foeTrait = (key, maxHp) => RULES.foeTrait(run.ch, key, maxHp);
function fillSkill(text, nums) {
  return text.replace(/\{(\w+)\}/g, (_, k) =>
    nums && nums[k] != null ? nums[k] : k === 'feast' ? 3 : k === 'regen' ? 4 : '?'
  );
}
function bossLine(c, pre) {
  const B = FOES[c.boss];
  if (!(typeof CX !== 'undefined' && CX.seen && CX.seen['f:' + c.boss]))
    return `<p class="bossline dim">${pre}<b>? ? ?</b> · ยังไม่เคยเผชิญหน้า</p>`;
  return `<p class="bossline">${pre}<b>${B.name}</b> · ${B.skill.name}: ${fillSkill(B.skill.text)}${B.rule ? `<br><span class="brl">กฎ · ${B.rule.name}: ${B.rule.text}</span>` : ''}</p>`;
}
function traitBox(tr) {
  return tr
    ? `<p class="btrait" data-tip="${escTip(`<b>นิสัย · ${tr.name}</b>${tr.text}`)}"><b>นิสัย · ${tr.name}</b> ${tr.text}</p>`
    : '';
}
const restAmt = () => RULES.restPickHp(run.curse);
function intentIcons(intents, hpScale) {
  return intents
    .map(it =>
      it
        .map(p => {
          const v = scalePart(p, hpScale).v;
          return `<span class="part" data-tip="${tipFoe(p.t, v)}" style="color:${ECOL[p.t]}">${icon(p.t)}${v}</span>`;
        })
        .join('')
    )
    .join('<span class="sep">›</span>');
}
function paintPeek() {
  const o = run.choice[run.peek],
    E = FOES[o.key],
    rk = RANK[o.rank],
    hp = foeHp(o.key, o.rank);
  $('#c-detail').innerHTML =
    `<div class="pd-head"><span class="rank" style="--rk:${rk.c}">${rk.l}</span><h3>${E.name}</h3></div>
    <p class="pd-sub">${E.sub}</p>
    <div class="fc-row"><span>เลือด</span><b>${hp}</b></div>
    <div class="fc-row moves"><span>ท่า</span><span class="seq">${intentIcons(E.intents, hp / E.hp)}</span></div>
    ${traitBox(foeTrait(o.key, hp))}
    <div class="fc-row"><span>รางวัล</span><span>${rk.reward}</span></div>`;
}
function showChoice() {
  const ch = run.ch;
  tip('choose');
  if (!run.choice) run.choice = [1, 2, 3].map(r => ({ rank: r, key: ch.pool[r][R(ch.pool[r].length)] }));
  renderPath('#c-path');
  $('#c-eyebrow').textContent = `${ch.name} · ด่าน ${run.stage + 1} จาก ${stagesOf(ch)}`;
  $('#c-sub').textContent = `เลือด ${run.hp}/${run.maxHp} · สติ ${run.san}/${run.maxSan} · ยิ่งอันตราย รางวัลยิ่งดี`;
  if (run.peek == null) run.peek = 1;
  $('#c-list').innerHTML = run.choice
    .map((o, i) => {
      const E = FOES[o.key],
        rk = RANK[o.rank];
      return `<div class="arch ${run.peek === i ? 'on' : ''}" style="--rk:${rk.c}" data-peek="${i}" role="button" tabindex="0" aria-label="ดูรายละเอียด ${E.name}">
      <span class="arch-rank">${rk.l}</span>
      <div class="arch-window"><canvas class="portrait" data-foe="${o.key}"></canvas></div>
      <b class="arch-name">${E.name}</b>
      <span class="arch-hp">${icon('heal')}${foeHp(o.key, o.rank)}</span>
      <button class="btn arch-go ${run.peek === i ? 'primary' : ''}" data-pick="${i}">เลือก</button>
    </div>`;
    })
    .join('');
  paintPeek();
  run.choice.forEach(o => cxSee('f:' + o.key));
  paintTip('#c-coach');
  show('choose');
  saveRun('choose');
}
