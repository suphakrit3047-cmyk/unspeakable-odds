/* ---------- chapters ---------- */
function renderChapters() {
  $('#map-rec').textContent = `เดินทาง ${REC.runs} รอบ · ชนะ ${REC.wins} รอบ`;
  $('#chap-list').innerHTML = CHAPTERS.map((c, i) => {
    const pos = RUN_ORDER.indexOf(i);
    const pips =
      c.tut || c.secret
        ? ''
        : `<span class="pips" aria-label="ความยาก ${c.level} จาก 8">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<i class="${n <= c.level ? 'on' : ''}"></i>`).join('')}</span>`;
    if (c.secret && !REC.azSeen) return '';
    const reached = c.tut || (c.secret ? REC.az : pos <= REC.best + 1);
    const status = c.tut
      ? ''
      : c.secret
        ? REC.az
          ? '<span class="badge">ผ่านแล้ว</span>'
          : '<span class="badge" style="border-color:var(--void);color:var(--void)">เคยไปถึง</span>'
        : pos <= REC.best
          ? '<span class="badge">เคยผ่าน</span>'
          : pos === REC.best + 1
            ? '<span class="badge" style="border-color:var(--bronze);color:var(--bronze)">บทถัดไป</span>'
            : '';
    return `<div class="chap ${reached ? '' : 'locked'}">
      <div class="meta">
        <span class="lv">${c.name}${pips}</span>
        <h3>${c.place}</h3>
        <p>${c.blurb} · ${stagesOf(c)} ด่าน</p>
        ${c.pool ? bossLine(c, 'บอส: ') : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        ${status}
        ${c.tut ? `<button class="btn" data-ch="${i}">เล่น</button>` : ''}
      </div>
    </div>`;
  }).join('');
  show('chapters');
}
