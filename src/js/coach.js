/* ---------- tutorial coach ---------- */
const COACH = [
  {
    text: 'นี่คือเต๋า 4 ลูกในถุงของคุณ ลองแตะลูกที่ออกหน้าดี เช่น <b>ดาบ (โจมตี)</b> เพื่อล็อกไว้ ลืมความหมายสัญลักษณ์เมื่อไหร่ กดปุ่ม <b>?</b> มุมขวาบน',
    on: 'hold',
  },
  {
    text: 'ล็อกแล้ว ลูกที่ล็อกจะไม่ถูกทอยใหม่ ทีนี้กด <b>ทอยใหม่</b> เพื่อทอยลูกที่เหลือ',
    on: 'reroll',
    pulse: '#b-reroll',
  },
  {
    text: 'ดูกล่อง <b>"ถ้าใช้ผลตอนนี้"</b> ใต้ลูกเต๋า มันบอกผลรวมและเลือดที่คุณจะเสีย พอใจแล้วกด <b>ใช้ผลเต๋า</b>',
    on: 'resolve',
    pulse: '#b-resolve',
  },
  {
    text: 'ศัตรูทำตามที่เขียนในช่อง <b>"กำลังจะ"</b> ก่อนทอยดูช่องนี้ทุกครั้ง ถ้ามันจะโจมตีให้เก็บโล่ ถ้ามันไม่โจมตีก็ทุ่มดาบได้เต็มที่',
    on: 'enemy',
  },
  { text: 'ดีมาก เล่นต่อจนชนะได้เลย', on: null },
];
const COACH_STAGE = {
  1: 'ด่านนี้ลองหา <b>คอมโบ</b>: ถ้าสัญลักษณ์เดียวกันออก 3 ลูกขึ้นไป ผลรวมได้ ×1.5 ล็อกลูกที่ออกเหมือนกันไว้ แล้วทอยลูกที่เหลือหาเพิ่ม ลูกที่ติดคอมโบจะมีกรอบสองชั้น',
  2: 'ด่านนี้เราลด <b>สติ</b> ของคุณเหลือ 8 ให้เห็นว่าเกิดอะไรขึ้น เต๋าบางลูกจะ <b>บิดเบือน</b> (ขอบม่วง) บางลูกแรง ×2 บางลูกกลายเป็นเสียสติ หน้า <b>ตา (คืนสติ)</b> ช่วยดึงสติกลับมาได้',
};
function coachEvent(ev) {
  if (!run || !run.ch.tut) return;
  const t = run.tut,
    before = t.extra;
  if (ev === 'freeze' && !t.seen.freeze) {
    t.seen.freeze = 1;
    t.extra = 'ศัตรูจะ <b>ตรึงเต๋า</b> คุณในเทิร์นหน้า ลูกที่ถูกตรึง (ลายทาง) ทอยใหม่ไม่ได้ ต้องใช้หน้าที่ออกมา';
  }
  if (ev === 'daze' && !t.seen.daze) {
    t.seen.daze = 1;
    t.extra = 'ศัตรูทำให้คุณ <b>มึน</b> เทิร์นหน้าทอยใหม่ได้น้อยลง เลือกลูกที่จะทอยให้ดี';
  }
  if (ev === 'combo' && run.stage === 1 && !t.seen.combo) {
    t.seen.combo = 1;
    t.extra = 'ได้คอมโบแล้ว ผลของสัญลักษณ์นั้นเพิ่มขึ้นครึ่งหนึ่ง';
  }
  if (t.extra !== before) t.extraTurn = battle.turn + 1;
  if (run.stage === 0 && COACH[t.step] && COACH[t.step].on === ev) t.step++;
}
function renderCoach() {
  const box = $('#coach');
  document.querySelectorAll('.pulse').forEach(el => el.classList.remove('pulse'));
  if (!run.ch.tut) {
    paintTip('#coach');
    return;
  }
  const t = run.tut;
  let html;
  if (t.extra && battle.turn > t.extraTurn) t.extra = null;
  if (t.extra) html = t.extra;
  else if (run.stage === 0) {
    const c = COACH[t.step];
    html = c.text;
    if (c.pulse && !battle.busy) $(c.pulse).classList.add('pulse');
  } else html = COACH_STAGE[run.stage];
  box.innerHTML = `<span class="eyebrow">คำแนะนำ · ด่านฝึก ${run.stage + 1}/3</span><p>${html}</p>`;
  box.hidden = false;
}
