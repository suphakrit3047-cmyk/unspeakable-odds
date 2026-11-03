/* ---------- events ---------- */
// wraps RULES.eventApi: same state changes, plus the text, sound and codex entry the game shows
const evApi = {
  giveRelic(rar) {
    const r = RULES.eventApi(run).giveRelic(rar);
    if (r.full) return 'ช่องเครื่องรางเต็ม ได้เงิน +4 แทน';
    SND.play('coin');
    cxSee('r:' + r.id);
    return `<span class="ri-line">${relicIcon(r.id)}<span>ได้เครื่องราง <b>${RELICS[r.id].name}</b>: ${RELICS[r.id].text}</span></span>`;
  },
  sellWeakest(v) {
    const r = RULES.eventApi(run).sellWeakest(v);
    return `ขาย${DICE[r.gone].name}ไป ได้เงิน +${v}`;
  },
  upgradeRandom(n, steps) {
    const r = RULES.eventApi(run).upgradeRandom(n, steps);
    if (r.none) return 'อสูรทุกตัวแข็งแกร่งสุดแล้ว ได้เงิน +4 แทน';
    SND.play('combo', 1);
    return `ปลุกพลัง ${r.kinds.map(id => `<b>${DICE[id].name}</b>`).join(', ')} +${r.steps} ขั้น ทุกหน้าแรงขึ้น`;
  },
  upgradeAll() {
    RULES.eventApi(run).upgradeAll();
    SND.play('combo', 2);
    return 'ดวงดาวส่องลงมา อสูรทุกชนิดในถุงปลุกพลัง +1 ขั้น';
  },
  tradeUp() {
    const r = RULES.eventApi(run, lockedDice()).tradeUp();
    if (r.none) return 'กูลไม่มีอะไรดีกว่าให้แลก มันยื่นเหรียญให้ 6 แทน';
    cxSee('d:' + r.nw);
    return `กูลรับ${DICE[r.gone].name}ไป แล้วส่ง <b>${DICE[r.nw].name}</b> ให้คุณแทน`;
  },
  giveDie(id) {
    const r = RULES.eventApi(run).giveDie(id);
    if (r.full) return 'ถุงเต็มแล้ว แมวเลยคาบเหรียญมาให้แทน เงิน +4';
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
