/* ---------- run shop ---------- */
function shopDieOffer() {
  const lk = lockedDice(),
    tiers = run.ch.tiers[1] || [1];
  const pool = Object.keys(DICE).filter(k => DICE[k].tier > 0 && tiers.includes(DICE[k].tier) && !lk.includes(k));
  return pool.length ? pool[R(pool.length)] : null;
}
const SPECIALS = {
  slot: {
    name: 'แท่นบูชาเพิ่มอีกหนึ่งที่',
    text: 'ช่องเครื่องรางถาวร +1 (ถือได้ 6 ชิ้น) ซื้อได้ครั้งเดียวต่อการเดินทาง',
    cost: 14,
    ok: () => !run.extraSlot,
    go: () => {
      run.extraSlot = true;
    },
  },
  mystery: {
    name: 'ห่อผ้าที่ถูกเย็บปิด',
    text: 'เครื่องรางสุ่ม 1 ชิ้น โอกาสได้ระดับตำนานสูงกว่าปกติ',
    cost: 7,
    ok: () => run.relics.length < relicMax(run),
    go: () => {
      const roll = Math.random(),
        rar = roll < 0.35 ? 1 : roll < 0.75 ? 2 : 3;
      let p = RELIC_KEYS.filter(k => !hasRelic(run.relics, k) && RELICS[k].rar === rar);
      if (!p.length) p = RELIC_KEYS.filter(k => !hasRelic(run.relics, k));
      const id = p[R(p.length)];
      run.relics.push({ id, n: 0 });
      cxSee('r:' + id);
      return `ในห่อผ้าคือ <b>${RELICS[id].name}</b>: ${RELICS[id].text}`;
    },
  },
  contract: {
    name: 'สัญญาเลือดกับพ่อค้า',
    text: 'เลือดสูงสุด −6 แลกเงิน 12',
    cost: 0,
    ok: () => run.maxHp > 30,
    go: () => {
      run.maxHp -= 6;
      run.hp = Math.min(run.hp, run.maxHp);
      run.coins += 12;
    },
  },
  cage3: {
    name: 'กรงเหล็กที่สั่นไม่หยุด',
    text: 'อสูรระดับ 3 แบบสุ่ม 1 ตัวเข้าถุง',
    cost: 10,
    ok: () => run.dice.length < 6,
    go: () => {
      const lk = lockedDice(),
        p = Object.keys(DICE).filter(k => DICE[k].tier === 3 && !lk.includes(k));
      const id = p[R(p.length)];
      run.dice.push(id);
      cxSee('d:' + id);
      return `<b>${DICE[id].name}</b> คลานออกจากกรงมาอยู่ในถุงของคุณ`;
    },
  },
};
const price = n => RULES.shopPrice(n, run.relics);
function showRunShop(resumed) {
  if (!run.shop) {
    const sp = Object.keys(SPECIALS)
      .filter(k => SPECIALS[k].ok())
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    run.shop = {
      offers: shopRelics(run.relics, 3),
      die: shopDieOffer(),
      dieSold: false,
      rr: 0,
      pot: 0,
      calm: 0,
      sp: sp.map(k => ({ k, sold: false })),
      note: '',
    };
  }
  const sh = run.shop,
    full = run.relics.length >= relicMax(run),
    L = run.ch.level || 0;
  sh.offers.forEach(id => id && cxSee('r:' + id));
  tip('shop');
  $('#rs-eyebrow').textContent =
    run.stage === 0 ? `ก่อนเข้า${run.ch.name} · ${run.ch.place}` : `${run.ch.name} · กลางทาง`;
  $('#rs-coins').innerHTML =
    `<span class="coin-ico">◉</span>${run.coins} เหรียญ${hasRelic(run.relics, 'key') ? ' <span class="dim" style="font-size:.8rem">กุญแจเงิน: ทุกอย่างลด 1</span>' : ''}`;
  $('#rs-offers').innerHTML =
    sh.offers
      .map((id, i) => {
        if (!id) return '';
        const R_ = RELICS[id],
          cost = relicCost(id, L, run.relics),
          can = run.coins >= cost && !full;
        return `<div class="relic-card rar${R_.rar}"><span class="ri">${relicIcon(id)}</span><div class="si-meta"><b>${R_.name}</b><span class="dim">${R_.text}</span><span class="rk">${R_.kind === 'mul' ? 'แบบคูณ' : R_.kind === 'add' ? 'แบบบวก' : 'เศรษฐกิจ'} · ${['', 'ธรรมดา', 'หายาก', 'ตำนาน'][R_.rar]}</span></div>
      <button class="btn ${can ? 'primary' : ''}" data-buyr="${i}" ${can ? '' : 'disabled'}>◉ ${cost}</button></div>`;
      })
      .join('') || '<p class="dim">ซื้อหมดแล้ว</p>';
  if (full)
    $('#rs-offers').insertAdjacentHTML(
      'beforeend',
      '<p class="dim">ช่องเครื่องรางเต็ม ขายชิ้นเก่าข้างล่างก่อนถึงจะซื้อใหม่ได้</p>'
    );
  $('#rs-special').innerHTML =
    (sh.sp || [])
      .map((x, i) => {
        const S = SPECIALS[x.k],
          c = price(S.cost),
          can = !x.sold && S.ok() && run.coins >= c;
        return `<div class="up-row special"><span class="ri big-ic sp">✦</span><div class="si-meta"><b>${S.name}</b><span class="dim">${x.sold ? 'ขายไปแล้ว' : S.text}</span></div><button class="btn ${can ? 'primary' : ''}" data-sp="${i}" ${can ? '' : 'disabled'}>${x.sold ? 'หมด' : c ? `◉ ${c}` : 'รับ'}</button></div>`;
      })
      .join('') + (sh.note ? `<p class="sp-note">${sh.note}</p>` : '');
  const kinds = [...new Set(run.dice)];
  $('#rs-ups').innerHTML = kinds
    .map(id => {
      const lv = upLv(id),
        n = run.dice.filter(x => x === id).length,
        c = price(upCost(lv)),
        max = lv >= UP_MAX,
        can = !max && run.coins >= c,
        rc = price(2),
        canRel = run.dice.length > 3 && run.coins >= rc;
      return `<div class="up-row"><canvas class="portrait" data-foe="${DIE_ART[id] || id}"></canvas><div class="si-meta"><b>${DICE[id].name}${n > 1 ? ` ×${n}` : ''}</b><span class="up-pips">${[1, 2, 3].map(k => `<i class="${k <= lv ? 'on' : ''}"></i>`).join('')}</span><span class="preview">${DICE[id].faces.map(f => faceHTML(upFace(f, id), 'sm' + (lv && f.t !== 'none' && f.t !== 'mad' ? ' up' : ''))).join('')}</span></div>
      <div class="up-btns"><button class="btn ${can ? 'primary' : ''}" data-up="${id}" ${can ? '' : 'disabled'}>${max ? 'เต็มแล้ว' : `ปลุก ◉ ${c}`}</button><button class="btn mini" data-rel="${id}" ${canRel ? '' : 'disabled'} title="ปล่อยอสูรลูกนี้ออกจากถุง 1 ลูก">ปล่อย ◉ ${rc}</button></div></div>`;
    })
    .join('');
  const pc = RULES.potionCost(sh.pot, run.relics),
    cc = RULES.incenseCost(sh.calm, run.relics);
  $('#rs-heal').innerHTML =
    `<div class="up-row"><span class="ri big-ic hp">${icon('heal')}</span><div class="si-meta"><b>ยาสมุนไพรจากอุลธาร์</b><span class="dim">เลือด +12 (ตอนนี้ ${run.hp}/${run.maxHp}) ราคาขึ้นทุกขวด</span></div><button class="btn" data-pot ${run.coins >= pc && run.hp < run.maxHp ? '' : 'disabled'}>◉ ${pc}</button></div>
    <div class="up-row"><span class="ri big-ic sn">${icon('san')}</span><div class="si-meta"><b>ธูปชำระใจ</b><span class="dim">สติ +5 (ตอนนี้ ${run.san}/${run.maxSan}) ราคาขึ้นทุกครั้ง</span></div><button class="btn" data-calm ${run.coins >= cc && run.san < run.maxSan ? '' : 'disabled'}>◉ ${cc}</button></div>`;
  const dc = price(5);
  $('#rs-die').innerHTML =
    sh.die && !sh.dieSold
      ? dieCard(sh.die, `ซื้อ ◉ ${dc}`, `data-buyd ${run.coins >= dc && run.dice.length < 6 ? '' : 'disabled'}`) +
        (run.dice.length >= 6 ? '<p class="dim">ถุงเต็มแล้ว</p>' : '')
      : '<p class="dim">ไม่มีอสูรเหลือในกรง</p>';
  const rc = price(2 + sh.rr);
  $('#b-rs-reroll').innerHTML = `สุ่มเครื่องรางในร้านใหม่ ◉ ${rc}`;
  $('#b-rs-reroll').disabled = run.coins < rc;
  $('#rs-mine-h').textContent = `เครื่องรางของคุณ ${run.relics.length}/${relicMax(run)}`;
  $('#rs-mine').innerHTML =
    run.relics
      .map((r, i) => {
        const R_ = RELICS[r.id];
        return `<div class="relic-card mine"><span class="ri">${relicIcon(r.id)}</span><div class="si-meta"><b>${R_.name}${R_.grow && r.n ? ` <span class="rk">(สะสม ${r.n})</span>` : ''}</b><span class="dim">${R_.text}</span></div><button class="btn" data-sell="${i}">ขาย ◉ ${sellPrice(r.id)}</button></div>`;
      })
      .join('') || '<p class="dim">ยังไม่มีเครื่องราง</p>';
  paintTip('#rs-coach');
  const y = $('#s-rshop').hidden ? 0 : window.scrollY;
  show('rshop');
  if (y) window.scrollTo(0, y);
  saveRun('rshop');
}
$('#s-rshop').addEventListener('click', ev => {
  const sh = run.shop;
  let b;
  if ((b = ev.target.closest('[data-sp]')) && !b.disabled) {
    const x = sh.sp[+b.dataset.sp],
      S = SPECIALS[x.k],
      c = price(S.cost);
    if (x.sold || !S.ok() || run.coins < c) return;
    run.coins -= c;
    x.sold = true;
    sh.note = S.go() || '';
    SND.play('coin');
    return showRunShop();
  }
  if ((b = ev.target.closest('[data-rel]')) && !b.disabled) {
    const id = b.dataset.rel,
      c = price(2);
    if (run.dice.length <= 3 || run.coins < c) return;
    run.coins -= c;
    run.dice.splice(run.dice.indexOf(id), 1);
    SND.play('ui');
    return showRunShop();
  }
  if ((b = ev.target.closest('[data-up]')) && !b.disabled) {
    const id = b.dataset.up,
      lv = upLv(id),
      c = price(upCost(lv));
    if (lv >= UP_MAX || run.coins < c) return;
    run.coins -= c;
    run.ups = run.ups || {};
    run.ups[id] = lv + 1;
    SND.play('combo', 1);
    return showRunShop();
  }
  if ((b = ev.target.closest('[data-pot]')) && !b.disabled) {
    if (run.coins < RULES.potionCost(sh.pot, run.relics)) return;
    RULES.drinkPotion(run, sh.pot++);
    SND.play('heal');
    return showRunShop();
  }
  if ((b = ev.target.closest('[data-calm]')) && !b.disabled) {
    if (run.coins < RULES.incenseCost(sh.calm, run.relics)) return;
    RULES.burnIncense(run, sh.calm++);
    SND.play('san');
    return showRunShop();
  }
  if ((b = ev.target.closest('[data-buyr]')) && !b.disabled) {
    const id = sh.offers[+b.dataset.buyr],
      c = relicCost(id, run.ch.level || 0, run.relics);
    if (run.coins < c || run.relics.length >= relicMax(run)) return;
    run.coins -= c;
    run.relics.push({ id, n: 0 });
    sh.offers[+b.dataset.buyr] = null;
    SND.play('coin');
    return showRunShop();
  }
  if ((b = ev.target.closest('[data-buyd]')) && !b.disabled) {
    const c = price(5);
    if (run.coins < c) return;
    run.coins -= c;
    run.dice.push(sh.die);
    cxSee('d:' + sh.die);
    sh.dieSold = true;
    SND.play('coin');
    return showRunShop();
  }
  if ((b = ev.target.closest('[data-sell]'))) {
    const [r] = run.relics.splice(+b.dataset.sell, 1);
    run.coins += sellPrice(r.id);
    SND.play('coin');
    return showRunShop();
  }
  if (ev.target.closest('#b-rs-reroll') && run.coins >= price(2 + sh.rr)) {
    run.coins -= price(2 + sh.rr);
    sh.rr++;
    sh.offers = shopRelics(run.relics, 3);
    SND.play('dice', 3);
    return showRunShop();
  }
  if (ev.target.closest('#b-rs-go')) {
    SND.play('ui');
    run.shop = null;
    beginStage();
  }
});
