/* ---------- progress (per-viewer, optional) ---------- */
const RKEY = 'abyss-dice-records-v1',
  SAVEKEY = 'abyss-dice-save-v1',
  TIPKEY = 'abyss-dice-tips-v1';
const load = (k, d) => {
  try {
    const v = JSON.parse(localStorage.getItem(k));
    return v == null ? d : v;
  } catch (e) {
    return d;
  }
};
const store = (k, v) => {
  try {
    if (v == null) localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
};
let REC = load(RKEY, { runs: 0, best: -1, wins: 0, az: false });
let seenTips = load(TIPKEY, []);
const RUN_ORDER = CHAPTERS.map((c, i) => i).filter(i => !CHAPTERS[i].tut && !CHAPTERS[i].secret);
const AZ_I = CHAPTERS.findIndex(c => c.secret);
const STAR_NEED = 15;
const MKEY = 'abyss-dice-meta-v1';
let META = load(MKEY, { shards: 0, own: [], bag: 'default', curse: 0, maxCurse: 0 });
const metaSave = () => store(MKEY, META);
const owns = id => META.own.includes(id);
function lockedDice() {
  return LOCKED_START.filter(k => !owns('d:' + k));
}
function metaBonus() {
  let hp = 0,
    san = 0;
  META_SHOP.forEach(u => {
    if (u.kind === 'up' && owns(u.id)) {
      hp += u.hp || 0;
      san += u.san || 0;
    }
  });
  return { hp, san };
}
function bagOf(id) {
  const it = META_SHOP.find(u => u.id === id);
  return it && owns(id) ? it.bag : STARTER;
}
const SKEY = 'abyss-dice-stars-v1';
let stars = load(SKEY, []);
const LOCK_SVG =
  '<svg viewBox="0 0 24 24"><path d="M7 10V7a5 5 0 0 1 10 0v3h1.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20.5v-9A1.5 1.5 0 0 1 5.5 10zm2.5 0h5V7a2.5 2.5 0 0 0-5 0z" fill="currentColor"/></svg>';
const STAR_SVG =
  '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';
function stagesOf(c) {
  return c.pool ? 4 : c.foes.length;
}
stars = stars.filter(id => {
  const k = id.lastIndexOf('-'),
    c = CHAPTERS.find(x => x.id === id.slice(0, k));
  return c && +id.slice(k + 1) < stagesOf(c);
});
function starId() {
  return run.ch.id + '-' + run.stage;
}
function starSpot() {
  let h = 7;
  for (const ch of starId()) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return h / 4294967296;
  };
  const hosts = ['enemy', 'forecast'];
  return { host: hosts[Math.floor(rnd() * hosts.length)], x: 4 + rnd() * 86, y: 8 + rnd() * 72 };
}
function placeStar() {
  if (!run || stars.includes(starId())) return;
  const sp = starSpot(),
    host = document.getElementById(sp.host);
  if (!host || host.querySelector('.hstar')) return;
  const b = document.createElement('button');
  b.className = 'hstar';
  b.setAttribute('aria-label', 'จุดแสงเล็ก ๆ');
  b.style.left = `calc(${sp.x.toFixed(1)}% - 13px)`;
  b.style.top = `calc(${sp.y.toFixed(1)}% - 13px)`;
  b.innerHTML = STAR_SVG;
  b.addEventListener('click', ev => {
    ev.stopPropagation();
    collectStar(b);
  });
  host.appendChild(b);
}
function collectStar(b) {
  const id = starId();
  if (stars.includes(id)) return;
  stars.push(id);
  store(SKEY, stars);
  b.classList.add('got');
  b.disabled = true;
  setTimeout(() => b.remove(), 650);
}
function renderTitle() {
  $('#title-rec').textContent = REC.runs
    ? `เดินทางมาแล้ว ${REC.runs} รอบ · ไปได้ไกลสุด${REC.best >= 0 ? CHAPTERS[RUN_ORDER[REC.best]].name : 'ยังไม่ผ่านบทไหน'} · ชนะ ${REC.wins} รอบ`
    : '';
  $('#title-shards').innerHTML = `${SHARD}<span>เศษความทรงจำ ${META.shards}</span>`;
  paintSound();
  const has = !!load(SAVEKEY, null);
  $('#b-continue').hidden = !has;
  $('#b-run').classList.toggle('primary', !has);
  $('#b-run-confirm').hidden = true;
}
function saveRun(screen) {
  if (!run || run.mode !== 'run') return;
  if (screen === 'battle' && battle.busy) return;
  const r = { ...run };
  delete r.ch;
  store(SAVEKEY, { run: r, battle: screen === 'battle' ? battle : null, screen, pending });
}
function resumeRun() {
  const sv = load(SAVEKEY, null);
  if (!sv) return renderTitle();
  run = sv.run;
  run.ch = CHAPTERS[run.ci];
  pending = sv.pending || null;
  if (sv.screen === 'battle' && sv.battle) {
    battle = sv.battle;
    battle.busy = false;
    show('battle');
    render(false);
  } else if (sv.screen === 'reward') showReward(true);
  else if (sv.screen === 'inter') interScreen(true);
  else if (sv.screen === 'event') showEvent(true);
  else if (sv.screen === 'rshop') showRunShop(true);
  else showChoice();
}
