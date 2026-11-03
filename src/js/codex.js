/* ---------- codex: บันทึกต้องห้าม ---------- */
const CXKEY = 'abyss-dice-codex-v1';
let CX = load(CXKEY, { seen: {}, fought: {}, won: {}, lost: {} });
const cxSave = () => store(CXKEY, CX);
function cxSee(k) {
  if (!CX.seen[k]) {
    CX.seen[k] = 1;
    cxSave();
  }
}
function cxCount(bucket, k) {
  CX[bucket][k] = (CX[bucket][k] || 0) + 1;
  cxSave();
}
const SECRET_FOES = ['piper', 'drummer', 'azathoth'];
function cxEntries(tab) {
  if (tab === 'd') return Object.keys(DICE).map(id => ({ k: 'd:' + id, id }));
  if (tab === 'r') return RELIC_KEYS.map(id => ({ k: 'r:' + id, id }));
  if (tab === 'p') return CHAPTERS.map(c => ({ k: 'p:' + c.id, id: c.id, secret: !!c.secret }));
  return Object.keys(FOES)
    .filter(id => !!FOES[id].boss === (tab === 'b'))
    .map(id => ({ k: 'f:' + id, id, secret: SECRET_FOES.includes(id) }));
}
let cxTab = 'd',
  cxReturn = 'title',
  cxGlitch = false;
function openCodex(from) {
  cxReturn = from || 'title';
  cxGlitch = !!(run && run.mode === 'run' && run.san <= 8 && from && from !== 'title');
  $('#modal').hidden = true;
  $('#cx-warn').hidden = !cxGlitch;
  $('#s-codex').classList.toggle('glitch', cxGlitch);
  renderCodexList();
  show('codex');
}
function placeArt(id) {
  const c = CHAPTERS.find(x => x.id === id);
  return c && c.boss ? c.boss : 'cultist';
}
function cxVisible(e) {
  return !e.secret || CX.seen[e.k];
}
function renderCodexList() {
  const all = ['d', 'f', 'b', 'r', 'p'].flatMap(cxEntries).filter(cxVisible);
  if (cxTab === 'j')
    $('#cx-progress').textContent =
      `ต้นฉบับที่พบแล้ว ${pagesSeen.filter(id => STORY[id]).length} หน้า · หน้าใหม่จะปรากฏระหว่างการเดินทาง`;
  else
    $('#cx-progress').textContent =
      `บันทึกแล้ว ${all.filter(e => CX.seen[e.k]).length} จาก ${all.length} หน้า · หน้าใหม่จะเปิดเมื่อคุณได้พบมันครั้งแรก`;
  document.querySelectorAll('#cx-tabs .tab').forEach(b => {
    const on = b.dataset.tab === cxTab;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on);
  });
  $('#cx-detail').hidden = true;
  $('#cx-list').hidden = false;
  if (cxTab === 'j') {
    $('#cx-list').innerHTML = STORY_ORDER.filter(id => !id.startsWith('az') || pagesSeen.includes(id))
      .map((id, n) =>
        pagesSeen.includes(id)
          ? `<button class="cx-item ms-item" data-page="${id}"><span class="cx-ico">${n + 1}</span><span>${STORY[id].title}</span></button>`
          : `<button class="cx-item locked" disabled><span class="cx-ico">${n + 1}</span><span>หน้าที่ยังไม่พบ</span></button>`
      )
      .join('');
    return;
  }
  $('#cx-list').innerHTML = cxEntries(cxTab)
    .filter(cxVisible)
    .map(e => {
      if (!CX.seen[e.k])
        return `<button class="cx-item locked" disabled><span class="cx-ico">?</span><span>? ? ?</span></button>`;
      const art = cxTab === 'd' ? DIE_ART[e.id] || e.id : cxTab === 'p' ? placeArt(e.id) : e.id;
      const ico =
        cxTab === 'r' ? relicIcon(e.id, 'cx') : `<canvas class="portrait" data-foe="${art}" data-static></canvas>`;
      const name =
        cxTab === 'r'
          ? RELICS[e.id].name
          : cxTab === 'd'
            ? DICE[e.id].name
            : cxTab === 'p'
              ? CHAPTERS.find(c => c.id === e.id).place
              : FOES[e.id].name;
      return `<button class="cx-item" data-cx="${e.k}">${ico}<span>${name}</span></button>`;
    })
    .join('');
}
function corrupt(t) {
  if (!cxGlitch) return t;
  const g = '▓▒░█';
  return [...t].map(ch => (ch !== ' ' && Math.random() < 0.16 ? g[R(4)] : ch)).join('');
}
function moveSeq(intents) {
  return intents
    .map(it =>
      it
        .map(
          p => `<span class="part" data-tip="${tipFoe(p.t, p.v)}" style="color:${ECOL[p.t]}">${icon(p.t)}${p.v}</span>`
        )
        .join('')
    )
    .join('<span class="sep">›</span>');
}
function openEntry(k) {
  const [type, id] = [k[0], k.slice(2)];
  let head = '',
    body = '',
    lore;
  if (type === 'r') {
    const RR = RELICS[id];
    lore = { src: 'สร้างสำหรับเกมนี้', text: RR.flav };
    head = `${relicIcon(id, 'big')}<div><span class="eyebrow">เครื่องราง · ${['', 'ธรรมดา', 'หายาก', 'ตำนาน'][RR.rar]} · ${RR.kind === 'mul' ? 'แบบคูณ' : RR.kind === 'add' ? 'แบบบวก' : 'เศรษฐกิจ'}</span><h3>${RR.name}</h3><p class="dim">ราคา ◉ ${RR.cost}</p></div>`;
    body = `<h4>ผล</h4><p class="skill">${RR.text}</p>`;
  } else if (type === 'd') {
    const dd = DICE[id];
    lore = LORE[LORE_OF.d[id] || id];
    head = `<canvas class="portrait" data-foe="${DIE_ART[id] || id}"></canvas><div><span class="eyebrow">${['เริ่มต้น', 'ระดับ 1', 'ระดับ 2', 'ระดับ 3'][dd.tier]}</span><h3>${dd.name}</h3><p class="dim">${dd.flav}</p></div>`;
    body =
      `<h4>หน้าเต๋า</h4><div class="preview">${dd.faces.map(f => faceHTML(f, 'sm')).join('')}</div>` +
      (SKILLS[id]
        ? `<p class="skill"><b>สกิล · ${SKILLS[id].name}</b> ${SKILLS[id].text}</p>`
        : '<p class="dim">ไม่มีสกิล</p>');
  } else if (type === 'p') {
    const c = CHAPTERS.find(x => x.id === id);
    lore = PLACES[id];
    head = `<canvas class="portrait" data-foe="${placeArt(id)}"></canvas><div><span class="eyebrow">${c.name}</span><h3>${c.place}</h3><p class="dim">${c.blurb}</p></div>`;
    if (c.pool) {
      const foes = [...new Set(Object.values(c.pool).flat())];
      body = `<h4>บอส</h4>${bossLine(c, '')}
        <h4>สิ่งที่พบได้ที่นี่</h4><p>${foes.map(f => (CX.seen['f:' + f] ? FOES[f].name : '? ? ?')).join(' · ')}</p>`;
    }
  } else {
    const E = FOES[id];
    lore = LORE[LORE_OF.f[id] || id];
    head = `<canvas class="portrait" data-foe="${id}"></canvas><div><span class="eyebrow">${E.boss ? 'บอส' : 'ศัตรู'}</span><h3>${E.name}</h3><p class="dim">${E.sub}</p></div>`;
    body =
      `<h4>ค่าพื้นฐาน</h4><p>${E.meter || 'เลือด'} ${E.hp} <span class="dim">(ยังไม่รวมความยากของบท)</span></p>
      <h4>ท่าตามลำดับ</h4><div class="seq">${E.randomIntent ? '<span class="dim">สุ่มทุกเทิร์น จาก:</span> ' : ''}${moveSeq(E.intents)}</div>` +
      (E.skill ? `<p class="bskill"><b>${E.skill.name}</b> ${fillSkill(E.skill.text)}</p>` : '') +
      (E.trait
        ? (t => `<p class="btrait"><b>นิสัย · ${t.name}</b> ${t.text}</p>`)(
            traitOf(id, { L: 1, maxHp: E.hp, atkMul: 1 })
          )
        : '') +
      (E.rule ? `<p class="brule"><b>กฎ · ${E.rule.name}</b> ${E.rule.text}</p>` : '') +
      (E.phase2 ? `<h4>${E.phase2.name}</h4><div class="seq">${moveSeq(E.phase2.intents)}</div>` : '') +
      `<h4>บันทึกการเผชิญหน้า</h4><p>สู้ ${CX.fought[k] || 0} ครั้ง · ชนะ ${CX.won[k] || 0} · ตายเพราะมัน ${CX.lost[k] || 0}</p>`;
  }
  $('#cx-detail').innerHTML = `<button class="back" data-cxback>← กลับไปที่รายการ</button>
    <div class="cx-head">${head}</div>
    <div class="cx-lore"><span class="eyebrow">ที่มา · ${lore.src}</span><p>${corrupt(lore.text)}</p></div>
    ${body}`;
  $('#cx-list').hidden = true;
  $('#cx-detail').hidden = false;
  window.scrollTo(0, 0);
}
