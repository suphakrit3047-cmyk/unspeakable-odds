/* ---------- end ---------- */
function endScreen(won, kind) {
  document.body.classList.remove('insane');
  const ch = run.ch,
    foe = FOES[run.foeKey];
  let actions = '';
  $('#e-shards').hidden = true;
  if (run.mode === 'run') {
    store(SAVEKEY, null);
    const base = (run.cleared || 0) * 2 + (run.bosses || 0) * 8 + (won ? 20 : 0),
      mult = curseMod(run.curse || 0).shards,
      got = Math.round(base * mult);
    META.shards += got;
    let note = '';
    if (won && (run.curse || 0) === META.maxCurse && META.maxCurse < CURSES.length - 1) {
      META.maxCurse++;
      note = `<p>ปลดล็อก<b>${CURSES[META.maxCurse].name}</b>แล้ว เลือกได้ตอนเริ่มการเดินทาง</p>`;
    }
    metaSave();
    const can = META_SHOP.filter(u => !owns(u.id) && (!u.need || owns(u.need)) && u.cost <= META.shards).length;
    $('#e-shards').innerHTML = `<div class="shards big">${SHARD}<span>+${got} เศษความทรงจำ</span></div>
      <p class="dim">ผ่าน ${run.cleared || 0} ด่าน (+${(run.cleared || 0) * 2}) · ล้มบอส ${run.bosses || 0} ตัว (+${(run.bosses || 0) * 8})${won ? ' · จบการเดินทาง (+20)' : ''}${mult > 1 ? ` · คำสาป ×${mult}` : ''} · มีทั้งหมด ${META.shards}</p>${note}
      ${can ? `<button class="btn primary" data-shop>ไปห้องสมุด (ปลดล็อกได้ ${can} อย่าง)</button>` : ''}`;
    $('#e-shards').hidden = false;
    if (got) setTimeout(() => SND.play('coin'), 500);
    const pos = RUN_ORDER.indexOf(run.ci);
    if (won || pos - 1 > REC.best) {
      /* keep best below */
    }
    if (won && pos > REC.best) REC.best = pos;
    if (won) {
      REC.wins++;
      if (kind === 'az') REC.az = true;
    }
    store(RKEY, REC);
  }
  if (won) {
    $('#e-eyebrow').textContent = `${ch.name} · ${ch.place}`;
    if (ch.tut) {
      $('#e-title').textContent = 'จบบทฝึกแล้ว';
      $('#e-text').textContent =
        'คุณรู้วิธีล็อกเต๋า หาคอมโบ และคุมสติแล้ว ต่อไปคือการเดินทางจริง ระบบใหม่ ๆ จะมีคำแนะนำโผล่มาตอนเจอครั้งแรก';
      actions += `<button class="btn primary" data-new>เริ่มการเดินทาง</button>`;
    } else if (kind === 'az') {
      $('#e-title').textContent = 'เทพตาบอดหลับใหลอีกครั้ง';
      $('#e-text').textContent =
        `ต้นฉบับจบลงตรงนี้ เศษลูกเต๋าที่พบในห้องหมายเลขเก้าหายไปจากตู้เก็บหลักฐานในคืนหนึ่งโดยไม่มีใครเห็น และผู้ดูแลยืนยันว่าบางคืนยังได้ยินเสียงขลุ่ยแผ่วเบาจากห้องนั้น ทั้งที่ห้องว่างมาตั้งแต่ปี 1929`;
      actions += `<button class="btn primary" data-new>เดินทางอีกครั้ง</button>`;
    } else {
      $('#e-title').textContent = 'ประตูปิดลงแล้ว';
      $('#e-text').textContent =
        `ต้นฉบับส่วนที่หลงเหลือจบลงตรงนี้ ผู้เขียนเสียชีวิตอย่างสงบในฤดูหนาวปีเดียวกัน ข้างเตียงของเขามีเศษลูกเต๋ากระดูกที่แตกร้าว ซึ่งบางชิ้นยังอุ่นอยู่`;
      actions += `<button class="btn primary" data-new>เดินทางอีกครั้ง</button>`;
    }
  } else {
    $('#e-eyebrow').textContent =
      run.mode === 'run'
        ? `การเดินทางจบที่${ch.name} · ${ch.place} · ด่าน ${run.stage + 1}`
        : `${ch.name} · ด่าน ${run.stage + 1}`;
    $('#e-title').textContent = kind === 'mind' ? 'สติแตกสลาย' : 'ร่างกายพ่ายแพ้';
    const frag = run.mode === 'run' && STORY_DEATH[ch.id];
    $('#e-text').innerHTML =
      (frag
        ? `<span class="ms-frag">"${frag}—"</span><span class="ms-note">${STORY_DEATH_NOTE[kind === 'mind' ? 'mind' : 'body']}</span>`
        : '') +
      `<span class="ms-hint">${
        kind === 'mind'
          ? `จิตใจรับความจริงไม่ไหวต่อหน้า${foe.name} รอบหน้าลองเก็บอสูรที่มีหน้าคืนสติ เช่น เอลเดอร์ธิง เผ่ายิธ หรือแมว`
          : `ล้มลงต่อหน้า${foe.name} รอบหน้าลองดูช่อง "กำลังจะ" ของศัตรู แล้วล็อกโล่ไว้ก่อนเทิร์นที่มันโจมตีแรง`
      }</span>`;
    actions +=
      run.mode === 'run'
        ? `<button class="btn primary" data-new>เริ่มการเดินทางใหม่</button>`
        : `<button class="btn primary" data-go="${run.ci}">ลองบทฝึกอีกครั้ง</button>`;
  }
  actions += `<button class="btn" data-home>หน้าแรก</button>`;
  $('#e-actions').innerHTML = actions;
  $('#e-dice').innerHTML = run.dice.map(id => dieCard(id)).join('');
  show('end');
}
