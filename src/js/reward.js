/* ---------- reward ---------- */
function offerPool() {
  const tiers = run.reward.tiers,
    n = run.reward.n;
  const lk = run.mode === 'run' ? lockedDice() : [];
  let pool = Object.keys(DICE).filter(k => tiers.includes(DICE[k].tier) && !lk.includes(k));
  if (pool.length < n)
    pool = pool.concat(
      Object.keys(DICE).filter(
        k =>
          DICE[k].tier > 0 && !lk.includes(k) && !pool.includes(k) && Math.abs(DICE[k].tier - Math.max(...tiers)) === 1
      )
    );
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(R(pool.length), 1)[0]);
  return out;
}
function showReward(keep) {
  pending = null;
  if (!keep || !run.offers) run.offers = offerPool();
  const rw = run.reward;
  $('#r-eyebrow').textContent =
    `${run.ch.name} · ผ่านด่าน ${run.stage + 1} จาก ${stagesOf(run.ch)} · เลือด +${WIN_HEAL + rw.heal} · สติ +${WIN_SAN + rw.san}` +
    (run.lastGain
      ? ` · เงิน +${run.lastGain.g}${run.lastGain.it ? ` ดอกเบี้ย +${run.lastGain.it}` : ''} (มี ${run.coins})`
      : '');
  $('#r-title').textContent = run.taken ? `เลือกได้อีก ${run.picksLeft} ตัว` : `เลือกอัญเชิญ ${run.picksLeft} ตัว`;
  $('#r-sub').textContent =
    `เลือด ${run.hp}/${run.maxHp} · สติ ${run.san}/${run.maxSan} · ถุงเต๋า ${run.dice.length}/6 ลูก`;
  run.offers.forEach(id => cxSee('d:' + id));
  $('#r-list').innerHTML =
    run.offers.map(id => dieCard(id, 'อัญเชิญเข้าถุง', `data-summon="${id}"`)).join('') +
    (run.taken
      ? `<button class="btn" data-skip>พอแล้ว ไปด่านต่อไป</button>`
      : `<div class="card"><h3>พักฟื้นข้างกองไฟ</h3><p class="dim">ไม่รับอสูรเพิ่ม แต่ได้เลือด +${restAmt()} และสติ +5</p><button class="btn" data-rest>พักฟื้น</button></div>`);
  const rc = $('#r-coach');
  tip('reward');
  if (run.mode === 'run') {
    paintTip('#r-coach');
  } else if (run.ch.tut && run.stage === 0) {
    rc.innerHTML = `<span class="eyebrow">คำแนะนำ</span><p>หลังชนะแต่ละด่าน เลือกอสูร 1 ตัวเข้าถุง อสูรแรงกว่าผู้ทำพิธีแต่บางหน้ามี <b>เสียสติ</b> ถุงจุได้ 6 ลูก ถ้าเลือดเหลือน้อยให้เลือกพักฟื้นแทน</p>`;
    rc.hidden = false;
  } else rc.hidden = true;
  show('reward');
  saveRun('reward');
}
function summon(id) {
  if (run.dice.length < 6) {
    run.dice.push(id);
    return afterPick(id);
  }
  pending = id;
  $('#r-title').textContent = `ถุงเต็มแล้ว เลือกลูกที่จะทิ้งเพื่อรับ ${DICE[id].name}`;
  $('#r-sub').textContent = 'ลูกที่ทิ้งจะหายไปถาวร';
  $('#r-coach').hidden = true;
  $('#r-list').innerHTML =
    run.dice.map((d, i) => dieCard(d, 'ทิ้งลูกนี้', `data-drop="${i}"`)).join('') +
    `<button class="btn" data-cancel>ยกเลิก กลับไปเลือกใหม่</button>`;
  window.scrollTo(0, 0);
}
function afterPick(id) {
  run.picksLeft--;
  run.taken++;
  run.offers = run.offers.filter(o => o !== id);
  if (run.picksLeft > 0 && run.offers.length) return showReward(true);
  nextStage();
}
function nextStage() {
  run.stage++;
  run.offers = null;
  run.choice = null;
  run.peek = null;
  if (run.mode === 'run' && run.ch.pool && run.stage === 1) {
    run.event = null;
    return showEvent();
  }
  if (run.mode === 'run' && run.ch.pool && run.stage === 2) {
    run.shop = null;
    return showRunShop();
  }
  beginStage();
}
