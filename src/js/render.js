/* ---------- render ---------- */
function renderPath(sel) {
  const ch = run.ch,
    n = stagesOf(ch);
  $(sel).innerHTML = [...Array(n)]
    .map((_, i) => {
      const cls = i < run.stage ? 'done' : i === run.stage ? 'now' : '';
      const p = run.path[i],
        boss = ch.pool ? i === n - 1 : FOES[ch.foes[i]].boss;
      const title = p ? FOES[p.key].name : boss ? 'บอส' : 'ยังไม่รู้';
      const rk = p && ch.pool && !boss ? `style="border-color:${RANK[p.rank].c}"` : '';
      return (
        (i ? '<span class="link"></span>' : '') +
        `<span class="node ${cls} ${boss ? 'boss' : ''}" title="${title}" ${i < run.stage ? '' : rk}>${i + 1}</span>`
      );
    })
    .join('');
}
function renderRelics() {
  const on = run.mode === 'run';
  $('#relicrow').hidden = !on;
  if (!on) return;
  $('#relicbar').innerHTML = Array.from({ length: relicMax(run) }, (_, i) => {
    const r = run.relics[i];
    return r
      ? `<button class="relic rar${RELICS[r.id].rar} ${r.off ? 'off' : ''}" data-ri="${i}" data-tip="${escTip(`<b>${RELICS[r.id].name}</b>${RELICS[r.id].text}${r.off ? ' · ถูกบอสปิดอยู่' : ''}`)}" aria-label="${RELICS[r.id].name}">${relicIcon(r.id)}${RELICS[r.id].grow && r.n ? `<i>${r.n}</i>` : ''}</button>`
      : '<span class="relic empty"></span>';
  }).join('');
  $('#coins').innerHTML = `<span class="coin-ico">◉</span>${run.coins}`;
}
function render(rolled) {
  const e = battle.e,
    ch = run.ch;
  renderRelics();
  renderPath('#path');
  $('#b-where').textContent = `${ch.name} · ${ch.place}` + (run.curse ? ` · คำสาป ${run.curse}` : '');
  $('#t-hp').textContent = `${run.hp}/${run.maxHp}`;
  $('#f-hp').style.width = (100 * run.hp) / run.maxHp + '%';
  $('#t-sn').textContent = `${run.san}/${run.maxSan}`;
  $('#f-sn').style.width = (100 * run.san) / run.maxSan + '%';
  const low = run.san <= 8;
  $('#sn-bar').classList.toggle('low', low);
  $('#warn').hidden = !low;
  document.body.classList.toggle('insane', low);
  // enemy
  const hidden = e.hideAll || (e.hide && e.ii % 2 === 1);
  const it = hidden
    ? '<span class="part" style="color:var(--void)">? ? ?</span>'
    : curIntent()
        .map(p => {
          const v = p.t === 'atk' || p.t === 'drain' ? atkValue(p.v) : p.v;
          return `<span class="part" data-tip="${tipFoe(p.t, v)}" style="color:${ECOL[p.t]}">${icon(p.t)}${v}</span>`;
        })
        .join('');
  const hpPct = Math.max(0, (100 * e.hp) / e.maxHp);
  const inc0 = hidden
    ? 0
    : curIntent()
        .filter(p => p.t === 'atk' || p.t === 'drain')
        .reduce((a, p) => a + atkValue(p.v), 0);
  const danger = inc0 >= Math.max(8, run.hp * 0.35);
  $('#enemy').innerHTML = `<canvas class="portrait" data-foe="${run.foeKey}"></canvas>
    <div class="info">
      <div><h2>${e.name}${e.boss ? ' <span class="badge" style="border-color:var(--bronze);color:var(--bronze)">บอส</span>' : ''}</h2><p class="dim" style="font-size:.85rem">${e.sub}</p></div>
      <div class="bar hp" style="padding:6px 8px"><div class="lbl">${e.meter || 'เลือด'} <b>${Math.max(0, e.hp)}/${e.maxHp}</b></div><div class="track"><div class="fill" style="width:${hpPct}%"></div></div></div>
      <div class="chips">
        ${e.block ? `<span class="chip" data-tip="${escTip('<b>โล่ของศัตรู ' + e.block + '</b>กันการโจมตีของคุณก่อนถึงเลือด หายเมื่อถึงเทิร์นของมัน')}" style="color:var(--steel)">${icon('blk')}${e.block}</span>` : ''}
        ${e.poison ? `<span class="chip" data-tip="${escTip('<b>พิษ ' + e.poison + '</b>ทุกเทิร์นศัตรูเสียเลือดเท่านี้ แล้วพิษลด 1')}" style="color:var(--verd)">${icon('poison')}${e.poison}</span>` : ''}
        ${e.weak ? `<span class="chip" data-tip="${escTip('<b>อ่อนแรง ' + e.weak + ' เทิร์น</b>ศัตรูตีเบาลง 30%')}" style="color:var(--ash)">${icon('weak')}อ่อนแรง ${e.weak}</span>` : ''}
        ${e.str ? `<span class="chip" data-tip="${escTip('<b>พลัง +' + e.str + '</b>การโจมตีของศัตรูแรงขึ้นถาวรในไฟต์นี้')}" style="color:var(--blood)">${icon('str')}พลัง +${e.str}</span>` : ''}
      </div>
      ${e.skill ? `<p class="bskill"><b>${e.skill.name}</b> ${e.skill.text}</p>` : ''}
      ${e.rule ? `<p class="brule"><b>กฎ · ${e.rule.name}</b> ${e.rule.text}</p>` : ''}
      ${enraged() ? `<p class="btrait hot" data-tip="${escTip(`<b>นิสัย · ${e.trait.name}</b>${e.trait.text}`)}"><b>คลั่งแล้ว!</b> ตีแรงขึ้น 50%</p>` : traitBox(e.trait)}
      <div class="intent ${danger ? 'danger' : ''}"><span class="dim">กำลังจะ</span>${it}${danger ? '<span class="dz">หนัก!</span>' : ''}</div>
    </div>`;
  // player status, right above your dice
  const pc = (a, b) => Math.max(0, Math.min(100, (100 * a) / b));
  $('#me').innerHTML = `<span class="me-tag">คุณ</span>
    <span class="me-bar hp ${run.hp <= run.maxHp * 0.3 ? 'low' : ''}" id="me-hp" data-tip="${escTip('<b>เลือดของคุณ</b>หมดเมื่อไรคือแพ้ ศัตรูตีทะลุโล่มาเท่าไร เลือดลดเท่านั้น')}">${icon('heal')}<b>${run.hp}</b><small>/${run.maxHp}</small><i style="width:${pc(run.hp, run.maxHp)}%"></i></span>
    <span class="me-bar sn ${run.san <= 8 ? 'low' : ''}" id="me-sn" data-tip="${escTip('<b>สติของคุณ</b>เหลือ 8 หรือต่ำกว่า เต๋าจะเริ่มบิดเบือน หมดเมื่อไรคือแพ้')}">${icon('san')}<b>${run.san}</b><small>/${run.maxSan}</small><i style="width:${pc(run.san, run.maxSan)}%"></i></span>`;
  const pst = [];
  if (battle.pBlock)
    pst.push(
      `<span class="chip" data-tip="${escTip('<b>โล่ของคุณ</b>กันการโจมตีของศัตรูในเทิร์นนี้')}" style="color:var(--steel)">${icon('blk')}โล่ของคุณ ${battle.pBlock}</span>`
    );
  if (battle.freezeNext)
    pst.push(
      `<span class="chip" data-tip="${tipFoe('freeze')}" style="color:var(--steel)">${icon('freeze')}เทิร์นหน้าโดนตรึง ${battle.freezeNext}</span>`
    );
  if (battle.bleed)
    pst.push(
      `<span class="chip" data-tip="${escTip('<b>เลือดไหล ' + battle.bleed + '</b>ต้นเทิร์นหน้าคุณเสียเลือดเท่านี้ แล้วลดลง 1')}" style="color:var(--blood)">${icon('heal')}เลือดไหล ${battle.bleed}</span>`
    );
  if (battle.dazeNext)
    pst.push(
      `<span class="chip" data-tip="${tipFoe('daze')}" style="color:var(--ash)">${icon('daze')}เทิร์นหน้ามึน</span>`
    );
  $('#pstat').innerHTML = pst.join('');
  // dice
  const tray = $('#tray');
  tray.classList.toggle('rolling', !!rolled);
  const { s, combos, lv, base, steps } = tally();
  let rollIdx = 0;
  tray.innerHTML = battle.rolls
    .map((r, i) => {
      const d = DICE[r.id];
      const delay = rolled && !r.held && !r.frozen ? rollIdx++ * 70 : 0;
      return `<button class="die ${r.held ? 'held' : ''} ${r.frozen ? 'frozen' : ''} ${r.banished ? 'banished' : ''} ${combos.includes(r.face.t) ? 'combo lv' + lv[r.face.t] : ''}" style="--d:${delay}ms;--tint:${d.tint}" data-i="${i}" aria-pressed="${r.held}" aria-label="${d.name}: ${TYPES[r.face.t].l} ${r.face.v || ''}${r.frozen ? ' (ถูกตรึง)' : ''}">
      <span class="tint"></span>
      ${r.banished ? '<span class="frz">ข้ามมิติ</span>' : r.chaos ? '<span class="dmark">โกลาหล</span>' : r.frozen ? '<span class="frz">ตรึง</span>' : r.held ? `<span class="lock" aria-hidden="true">${LOCK_SVG}</span>` : ''}
      ${r.dist ? `<span class="dmark">${r.dist === 'pow' ? 'คลั่ง×2' : 'บิดเบือน'}</span>` : r.skTag && SKILLS[r.id] ? `<span class="smark" data-tip="${escTip(`<b>สกิล · ${SKILLS[r.id].name}</b>${SKILLS[r.id].text}`)}">✦${String(r.skTag).split(' ')[0]}</span>` : r.kept ? `<span class="smark" data-tip="${escTip('<b>สกิล · ข้ามกาลเวลา</b>เผ่ายิธเก็บหน้าเดิมไว้เพราะดีกว่าหน้าที่ทอยได้ใหม่')}">⟲</span>` : ''}
      ${cubeHTML(r, rolled && !r.held && !r.frozen)}
      <span class="nm">${d.short || d.name}</span>
    </button>`;
    })
    .join('');
  const f0 = tray.querySelector('.cube');
  if (f0) tray.style.setProperty('--h', f0.offsetWidth / 2 + 'px');
  if (rolled) {
    setTimeout(() => tray.classList.remove('rolling'), 760 + rollIdx * 70);
    for (let k = 0; k < rollIdx; k++) setTimeout(() => SND.play('land', k), 560 + k * 70);
  }
  // combo banner
  const sig = combos.map(k => k + lv[k]).join(',');
  const cb = $('#combo');
  if (combos.length) {
    const top = Math.max(...combos.map(k => lv[k]));
    cb.className = 'combo-banner lv' + top;
    cb.innerHTML = combos
      .map(k => `<span><b>${COMBO_NAME[lv[k]]}!</b> ${TYPES[k].l} ×${COMBO_MULT[lv[k]]}</span>`)
      .join('');
    cb.hidden = false;
    if (sig !== battle.comboSig) {
      const wait = rolled ? 620 + rollIdx * 70 : 0;
      cb.classList.remove('pop');
      setTimeout(() => {
        void cb.offsetWidth;
        cb.classList.add('pop');
        SND.play('combo', top);
      }, wait);
    }
  } else cb.hidden = true;
  battle.comboSig = sig;
  // forecast
  const fp = ['atk', 'blk', 'poison', 'weak', 'heal', 'san', 'mad']
    .filter(k => s[k])
    .map(
      k =>
        `<span class="part" data-tip="${escTip(`<b>รวม${TYPES[k].l} ${s[k]}</b>${GLOSS[k]}${combos.includes(k) ? ` · ${COMBO_NAME[lv[k]]} ×${COMBO_MULT[lv[k]]}` : ''}`)}" style="color:${TYPES[k].c}">${icon(k)}${k === 'mad' ? '−' : ''}${s[k]}${combos.includes(k) ? `<span class="cb">×${COMBO_MULT[lv[k]]}</span>` : ''}</span>`
    )
    .join('');
  const incoming = curIntent()
    .filter(p => p.t === 'atk' || p.t === 'drain')
    .reduce((a, p) => a + atkValue(p.v), 0);
  const madIn = curIntent()
    .filter(p => p.t === 'mad')
    .reduce((a, p) => a + p.v, 0);
  let threat = '';
  const hiddenNow = e.hideAll || (e.hide && e.ii % 2 === 1);
  if (incoming) {
    const taken = Math.max(0, incoming - battle.pBlock - s.blk);
    threat = taken ? `ศัตรูจะตี ${incoming} คุณจะเสียเลือด ${taken}` : `ศัตรูจะตี ${incoming} โล่กันได้หมด`;
  }
  if (madIn) threat += (threat ? ' · ' : '') + `ศัตรูจะกัดกินสติ ${madIn}`;
  if (!threat) threat = 'ศัตรูไม่โจมตีเทิร์นนี้ ทุ่มโจมตีได้เต็มที่';
  if (hiddenNow) threat = 'มันซ่อนท่าไว้ เดาเอาเองว่าจะเก็บโล่หรือโจมตี';
  if (e.aura) threat += ` · สัญลักษณ์สีเหลืองจะกัดกินสติ ${e.aura}`;
  if (e.lull) threat += ` · โจมตีทำได้ครึ่งเดียว หน้าคืนสติกล่อมได้ ×2 (รวมในตัวเลขโจมตีแล้ว)`;
  if (e.feast && run.hp < run.maxHp / 2) threat += ' · เลือดคุณต่ำกว่าครึ่ง มันตีแรงขึ้น';
  if (e.trait && e.trait.key === 'thorns' && s.atk) threat += ` · ตีโดนจะโดนหนาม −${e.trait.v}`;
  if (e.trait && e.trait.key === 'vengeful' && !s.atk) threat += ` · ไม่โจมตีมันจะแค้น พลัง +${e.trait.v}`;
  const relicNote = steps.length
    ? `<span class="threat">เครื่องรางทำงาน ${steps.length} ชิ้น${base !== s.atk ? ` · โจมตี ${base} → ${s.atk}` : ''}</span>`
    : '';
  $('#forecast').innerHTML =
    `<span class="dim">ถ้าใช้ผลตอนนี้</span>${fp || '<span class="dim">ไม่มีผล</span>'}${relicNote}<span class="threat">${threat}</span>`;
  $('#b-reroll').textContent = `ทอยใหม่ (เหลือ ${battle.rerolls})`;
  $('#b-reroll').disabled = battle.busy || battle.rerolls <= 0;
  $('#b-resolve').disabled = battle.busy;
  $('#log').innerHTML = battle.log.map(l => `<p>${l}</p>`).join('');
  if (battle.rolls.some(r => r.skTag)) tip('skill');
  if (!hidden) {
    const ts = curIntent().map(p => p.t);
    ['freeze', 'daze', 'drain'].forEach(t => {
      if (ts.includes(t)) tip(t);
    });
  }
  if (low) tip('insane');
  renderCoach();
  placeStar();
  saveRun('battle');
}
