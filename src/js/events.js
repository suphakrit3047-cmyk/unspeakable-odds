/* ---------- events ---------- */
const evApi = {
  giveRelic(rar) {
    if (run.relics.length >= relicMax(run)) {
      run.coins += 4;
      return 'ช่องเครื่องรางเต็ม ได้เงิน +4 แทน';
    }
    let pool = RELIC_KEYS.filter(k => !hasRelic(run.relics, k) && (!rar || RELICS[k].rar === rar));
    if (!pool.length) pool = RELIC_KEYS.filter(k => !hasRelic(run.relics, k));
    const id = pool[R(pool.length)];
    run.relics.push({ id, n: 0 });
    SND.play('coin');
    cxSee('r:' + id);
    return `<span class="ri-line">${relicIcon(id)}<span>ได้เครื่องราง <b>${RELICS[id].name}</b>: ${RELICS[id].text}</span></span>`;
  },
  sellWeakest(v) {
    const sc = id => DICE[id].faces.reduce((a, f) => a + faceScore(f), 0) + (SKILLS[id] ? 3 : 0);
    let wi = 0;
    run.dice.forEach((d, i) => {
      if (sc(d) < sc(run.dice[wi])) wi = i;
    });
    const [gone] = run.dice.splice(wi, 1);
    run.coins += v;
    return `ขาย${DICE[gone].name}ไป ได้เงิน +${v}`;
  },
  upgradeRandom(n, steps) {
    steps = steps || 1;
    run.ups = run.ups || {};
    const kinds = [...new Set(run.dice)]
      .filter(id => upLv(id) < UP_MAX)
      .sort(() => Math.random() - 0.5)
      .slice(0, n);
    if (!kinds.length) {
      run.coins += 4;
      return 'อสูรทุกตัวแข็งแกร่งสุดแล้ว ได้เงิน +4 แทน';
    }
    kinds.forEach(id => {
      run.ups[id] = Math.min(UP_MAX, upLv(id) + steps);
    });
    SND.play('combo', 1);
    return `ปลุกพลัง ${kinds.map(id => `<b>${DICE[id].name}</b>`).join(', ')} +${steps} ขั้น ทุกหน้าแรงขึ้น`;
  },
  upgradeAll() {
    run.ups = run.ups || {};
    [...new Set(run.dice)].forEach(id => {
      run.ups[id] = Math.min(UP_MAX, upLv(id) + 1);
    });
    SND.play('combo', 2);
    return 'ดวงดาวส่องลงมา อสูรทุกชนิดในถุงปลุกพลัง +1 ขั้น';
  },
  tradeUp() {
    const sc = id => DICE[id].faces.reduce((a, f) => a + faceScore(f), 0) + (SKILLS[id] ? 3 : 0);
    let wi = 0;
    run.dice.forEach((d, i) => {
      if (sc(d) < sc(run.dice[wi])) wi = i;
    });
    const gone = run.dice[wi],
      t = Math.min(3, DICE[gone].tier + 1),
      lk = lockedDice();
    const pool = Object.keys(DICE).filter(k => DICE[k].tier === t && !lk.includes(k) && k !== gone);
    if (!pool.length) {
      run.coins += 6;
      return 'กูลไม่มีอะไรดีกว่าให้แลก มันยื่นเหรียญให้ 6 แทน';
    }
    const nw = pool[R(pool.length)];
    run.dice[wi] = nw;
    cxSee('d:' + nw);
    return `กูลรับ${DICE[gone].name}ไป แล้วส่ง <b>${DICE[nw].name}</b> ให้คุณแทน`;
  },
  giveDie(id) {
    if (run.dice.length >= 6) {
      run.coins += 4;
      return 'ถุงเต็มแล้ว แมวเลยคาบเหรียญมาให้แทน เงิน +4';
    }
    run.dice.push(id);
    cxSee('d:' + id);
    return `${DICE[id].name}เข้ามาอยู่ในถุงของคุณ`;
  },
};
function showEvent(resumed) {
  if (!run.event) {
    run.seenEv = run.seenEv || [];
    let pool = EVENTS.filter(x => !run.seenEv.includes(x.id));
    if (!pool.length) pool = EVENTS;
    const pick = pool[R(pool.length)];
    run.seenEv.push(pick.id);
    run.event = { id: pick.id, done: null };
  }
  const ev = EVENTS.find(x => x.id === run.event.id);
  tip('event');
  $('#ev-eyebrow').textContent = `${run.ch.name} · ระหว่างทาง`;
  $('#ev-name').textContent = ev.name;
  $('#ev-text').innerHTML = keepNames((typeof EVENT_STORY !== 'undefined' && EVENT_STORY[ev.id]) || ev.text);
  $('#ev-art').dataset.foe = ev.art;
  $('#ev-art').dataset.drawn = '';
  if (run.event.done) {
    $('#ev-opts').innerHTML = `<button class="btn primary" data-evgo>เดินทางต่อ</button>`;
    $('#ev-result').innerHTML = `<p>${run.event.done}</p>`;
    $('#ev-result').hidden = false;
  } else {
    $('#ev-result').hidden = true;
    $('#ev-opts').innerHTML = ev.opts
      .map((o, i) => {
        const ok = !o.need || o.need(run);
        return `<button class="evopt" data-ev="${i}" ${ok ? '' : 'disabled'}><b>${o.t}</b><span class="dim">${ok ? o.d : 'ทำไม่ได้ตอนนี้'}</span></button>`;
      })
      .join('');
  }
  $('#ev-stats').textContent = '';
  paintTip('#ev-coach');
  show('event');
  saveRun('event');
}
$('#ev-opts').addEventListener('click', ev => {
  if (ev.target.closest('[data-evgo]')) {
    SND.play('ui');
    run.event = null;
    return beginStage();
  }
  const b = ev.target.closest('[data-ev]');
  if (!b || b.disabled) return;
  const e = EVENTS.find(x => x.id === run.event.id),
    o = e.opts[+b.dataset.ev];
  SND.play('ui');
  run.event.done = o.go(run, evApi) || 'ไม่มีอะไรเกิดขึ้น';
  run.hp = Math.max(1, Math.min(run.maxHp, run.hp));
  run.san = Math.max(1, Math.min(run.maxSan, run.san));
  showEvent();
});
