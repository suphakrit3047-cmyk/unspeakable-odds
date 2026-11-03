/* ---------- helpers ---------- */
function icon(t) {
  if (t === 'none') return '<span class="nil">–</span>';
  return `<svg class="ic"><use href="#i-${t}"/></svg>`;
}
function escTip(t) {
  return String(t).replace(/"/g, '&quot;');
}
function tipFace(t, v) {
  return escTip(`<b>${TYPES[t].l}${v !== '' && v != null && t !== 'none' ? ' ' + v : ''}</b>${GLOSS[t]}`);
}
function tipFoe(t, v) {
  const g = EGLOSS[t];
  return g ? escTip(`<b>ศัตรู: ${g[0]}${v != null ? ' ' + v : ''}</b>${g[1]}`) : '';
}
function cubeHTML(r, spin) {
  // front = result; the other five sides show this monster's real faces so you see them tumble past
  const pool = DICE[r.id].faces.map(f => upFace(f, r.id));
  let skip = pool.findIndex(f => f.t === r.face.t && f.v === r.face.v);
  const sides = pool.filter((_, i) => i !== (skip < 0 ? 5 : skip)).slice(0, 5);
  const q = () => (Math.random() < 0.5 ? -1 : 1) * (360 + 90 * Math.floor(Math.random() * 4));
  const st = spin ? `--rx:${q()}deg;--ry:${q()}deg;--rz:${Math.round((Math.random() - 0.5) * 60)}deg` : '';
  return `<div class="cube ${spin ? 'spin' : ''}" style="${st}">${faceHTML(r.face, 'front ' + (r.dist ? 'dist' : ''))}${sides.map((f, i) => faceHTML(f, 'side s' + (i + 1), true)).join('')}</div>`;
}
function faceHTML(f, cls = '', noTip) {
  return `<div class="face ${cls}" ${noTip ? '' : `data-tip="${tipFace(f.t, f.v)}"`} style="--fc:${TYPES[f.t].c}">${icon(f.t)}${f.t !== 'none' && f.v !== '' ? `<b>${f.v}</b>` : ''}</div>`;
}
function show(id) {
  [
    'splash',
    'page',
    'title',
    'chapters',
    'choose',
    'battle',
    'reward',
    'inter',
    'end',
    'codex',
    'shop',
    'setup',
    'event',
    'rshop',
  ].forEach(s => ($('#s-' + s).hidden = s !== id));
  window.scrollTo(0, 0);
  if (typeof musicFor === 'function') musicFor();
  if (typeof paintRunbar === 'function') paintRunbar(id);
}
const RUNBAR_ON = ['choose', 'reward', 'event', 'rshop', 'inter'];
function paintRunbar(id) {
  id = id || ['choose', 'reward', 'event', 'rshop', 'inter', 'battle'].find(x => !$('#s-' + x).hidden);
  const on = !!(run && run.mode === 'run' && RUNBAR_ON.includes(id));
  $('#runbar').hidden = !on;
  document.body.classList.toggle('has-runbar', on);
  if (!on) return;
  const pct = (a, b) => Math.max(0, Math.min(100, (100 * a) / b));
  $('#rb-hp').innerHTML =
    `<span class="rb-ic hp">${icon('heal')}</span><span class="rb-v"><b>${run.hp}</b>/${run.maxHp}</span><span class="rb-bar"><i style="width:${pct(run.hp, run.maxHp)}%"></i></span>`;
  $('#rb-san').innerHTML =
    `<span class="rb-ic sn">${icon('san')}</span><span class="rb-v"><b>${run.san}</b>/${run.maxSan}</span><span class="rb-bar sn"><i style="width:${pct(run.san, run.maxSan)}%"></i></span>`;
  $('#rb-coin').innerHTML =
    `<span class="rb-ic coin-ico">◉</span><span class="rb-v"><b>${run.coins || 0}</b></span><span class="rb-l">เงิน</span>`;
  $('#rb-relic').innerHTML =
    `<span class="rb-ic">${run.relics && run.relics[0] ? relicIcon(run.relics[0].id, 'sm') : '✦'}</span><span class="rb-v"><b>${(run.relics || []).length}</b>/${relicMax(run)}</span><span class="rb-l">เครื่องราง</span>`;
  $('#rb-bag').innerHTML =
    `<span class="rb-ic">${icon('atk')}</span><span class="rb-v"><b>${run.dice.length}</b>/6</span><span class="rb-l">ถุงเต๋า</span>`;
}
function openBag(kind) {
  if (kind === 'relic') {
    $('#bm-title').textContent = `เครื่องราง ${(run.relics || []).length}/${relicMax(run)}`;
    $('#bm-list').innerHTML =
      (run.relics || [])
        .map(r => {
          const R_ = RELICS[r.id];
          return `<div class="relic-card rar${R_.rar}"><span class="ri">${relicIcon(r.id)}</span><div class="si-meta"><b>${R_.name}${R_.grow && r.n ? ` <span class="rk">(สะสม ${r.n})</span>` : ''}</b><span class="dim">${R_.text}</span><span class="rk">${R_.kind === 'mul' ? 'แบบคูณ' : R_.kind === 'add' ? 'แบบบวก' : 'เศรษฐกิจ'}</span></div></div>`;
        })
        .join('') || '<p class="dim">ยังไม่มีเครื่องราง ซื้อได้ที่ร้านพ่อค้าชาวเลงกลางบท</p>';
  } else {
    $('#bm-title').textContent = `ถุงเต๋า ${run.dice.length}/6`;
    $('#bm-list').innerHTML = run.dice.map(id => dieCard(id)).join('');
  }
  $('#bagmodal').hidden = false;
  $('#bm-close').focus();
}
function log(msg) {
  battle.log.unshift(msg);
  battle.log = battle.log.slice(0, 5);
}
function sigil(name, col) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return h / 4294967296;
  };
  const n = 5 + Math.floor(rnd() * 4),
    k = 2 + Math.floor(rnd() * 2);
  const pts = [...Array(n)].map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [50 + 34 * Math.cos(a), 50 + 34 * Math.sin(a)];
  });
  let star = '';
  for (let i = 0; i < n; i++) {
    const p = pts[(i * k) % n];
    star += (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
  }
  const eyes = 1 + Math.floor(rnd() * 3);
  let e = '';
  for (let i = 0; i < eyes; i++) {
    const x = 50 + (i - (eyes - 1) / 2) * 12;
    e += `<ellipse cx="${x}" cy="50" rx="4.5" ry="2.6" fill="${col}"/><circle cx="${x}" cy="50" r="1.3" fill="var(--bg)"/>`;
  }
  const ticks = pts
    .map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.2" fill="${col}"/>`)
    .join('');
  return `<svg class="sig" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="none" stroke="${col}" stroke-width="1.5"/><circle cx="50" cy="50" r="39" fill="none" stroke="${col}" stroke-width=".6" stroke-dasharray="2 3"/><path d="${star}Z" fill="none" stroke="${col}" stroke-width="1.4"/>${ticks}${e}</svg>`;
}
function upLv(id) {
  return (run && run.ups && run.ups[id]) || 0;
}
function upFace(f, id) {
  const lv = upLv(id);
  return lv && f.t !== 'none' && f.t !== 'mad' ? { ...f, v: f.v + lv } : f;
}
function dieCard(id, btnLabel, btnAttr) {
  const d = DICE[id],
    lv = upLv(id);
  const tierTxt = ['เริ่มต้น', 'ระดับ 1', 'ระดับ 2', 'ระดับ 3'][d.tier] + (lv ? ` · ปลุกพลัง ${'✦'.repeat(lv)}` : '');
  return `<div class="card diecard" style="--tint:${d.tint}">
    <div class="dc-head"><canvas class="portrait" data-foe="${DIE_ART[id] || id}"></canvas>
    <h3><span class="sw"></span>${d.name}<span class="tier">${tierTxt}</span></h3></div>
    <p class="dim">${d.flav}</p>
    ${SKILLS[id] ? `<p class="skill"><b>สกิล · ${SKILLS[id].name}</b> ${SKILLS[id].text}</p>` : ''}
    <div class="preview">${d.faces.map(f => faceHTML(upFace(f, id), 'sm' + (lv && f.t !== 'none' && f.t !== 'mad' ? ' up' : ''))).join('')}</div>
    ${btnLabel ? `<button class="btn" ${btnAttr}>${btnLabel}</button>` : ''}
  </div>`;
}
