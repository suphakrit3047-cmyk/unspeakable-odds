/* ---------- manuscript pages ---------- */
const PAGEKEY = 'abyss-dice-pages';
let pagesSeen = load(PAGEKEY, []),
  pageQ = null;
function showPages(ids, done, always) {
  const q = ids.filter(id => STORY[id] && (always || !pagesSeen.includes(id)));
  if (!q.length || !run || run.mode !== 'run') return done();
  pageQ = { q, i: 0, done, reread: false };
  paintPage();
}
// Thai line-breaking splits transliterated names mid-word; keep them whole
const NAMES = [
  'นกวิปเปอร์วิล',
  'แพะดำ',
  'ข้าพเจ้า',
  'ชับ-นิกกูรัธ',
  'ริลลายเอห์',
  'ไนอาร์ลาโธเทป',
  'โจไซอาห์',
  'อินส์มัธ',
  'มิสกาโทนิก',
  'ยอก-โซโธธ',
  'คาร์โคซา',
  'วอทลีย์',
  'วัลพูร์กิส',
  'ลูกพันตัว',
  'เทเคลิ-ลี',
  'แอนตาร์กติกา',
  'นิวเบดฟอร์ด',
  'อาร์คัม',
  'ดันวิช',
  'อุลธาร์',
  'เซนต์แมรี',
  'แปซิฟิก',
  'ฟาโรห์',
  'ดาก้อน',
  'เพนกวิน',
];
function keepNames(t) {
  let out = t;
  NAMES.forEach((n, i) => {
    out = out.split(n).join('\u0001' + i + '\u0002');
  });
  return out.replace(/\u0001(\d+)\u0002/g, (_, i) => `<span class="nb">${NAMES[+i]}</span>`);
}
function paintPage() {
  const id = pageQ.q[pageQ.i],
    P = STORY[id];
  if (!pagesSeen.includes(id)) {
    pagesSeen.push(id);
    store(PAGEKEY, pagesSeen);
  }
  $('#pg-date').textContent = P.date;
  $('#pg-title').textContent = P.title;
  $('#pg-body').innerHTML = P.paras.map(t => `<p>${keepNames(t)}</p>`).join('');
  $('#pg-folio').textContent = `หน้า ${STORY_ORDER.indexOf(id) + 1}`;
  const last = pageQ.i >= pageQ.q.length - 1;
  $('#pg-next').textContent = pageQ.reread ? 'กลับไปที่บันทึก' : last ? 'เดินทางต่อ' : 'พลิกหน้าต่อ';
  $('#pg-skip').hidden = pageQ.reread || last;
  const pp = $('#pg-paper');
  pp.classList.remove('turn');
  void pp.offsetWidth;
  pp.classList.add('turn');
  show('page');
}
function pageNext(skip) {
  SND.play('ui');
  if (pageQ.reread) {
    pageQ = null;
    show('codex');
    return;
  }
  if (!skip && pageQ.i < pageQ.q.length - 1) {
    pageQ.i++;
    return paintPage();
  }
  const f = pageQ.done;
  pageQ = null;
  f();
}
$('#pg-next').onclick = () => pageNext(false);
$('#pg-skip').onclick = () => pageNext(true);
function rereadPage(id) {
  pageQ = { q: [id], i: 0, done: null, reread: true };
  paintPage();
}
