// ===== Relics (เครื่องราง) — Balatro-style jokers. Shared by game and bot. =====
// kind 'add' runs before 'mul'. fx(c, st) mutates c.s and returns the popup text (or null when it does nothing).
// c = { s, rolls, cnt, combos, lv, san, maxSan, hp, maxHp, eHp, rerollsLeft, turn }
// st = this relic's own saved counter object { n }
var RELIC_MAX = 5;
var RELICS = {
  knife:   { name: 'มีดสังเวย', icon: '🗡', rar: 1, cost: 4, kind: 'add', flav: 'มีดหินออบซิเดียนจากแท่นบูชาของลัทธิ คมยังไม่เคยทื่อ', text: 'ถ้ามีหน้าโจมตี โจมตี +4',
             fx: function (c) { if (!c.cnt.atk) return null; c.s.atk += 4; return '+4'; } },
  stone:   { name: 'ศิลาจารึกเก่า', icon: '🗿', rar: 1, cost: 4, kind: 'add', flav: 'ศิลาจารึกที่ขุดได้จากฐานของเมืองโบราณใต้น้ำแข็ง', text: 'ถ้ามีหน้าป้องกัน ป้องกัน +5',
             fx: function (c) { if (!c.cnt.blk) return null; c.s.blk += 5; return '+5 โล่'; } },
  twins:   { name: 'คู่แฝดต้องสาป', icon: '♊', rar: 1, cost: 5, kind: 'add', flav: 'ตุ๊กตาแฝดที่พบในบ้านวอทลีย์ ใครถือไว้จะรู้สึกว่ามีอีกคนยืนอยู่ข้าง ๆ', text: 'หน้าเดียวกันทุกคู่ (คู่ละ 2 ลูก) โจมตี +3',
             fx: function (c) { var p = 0; for (var k in c.cnt) if (k !== 'mad') p += Math.floor(c.cnt[k] / 2); if (!p) return null; c.s.atk += 3 * p; return '+' + 3 * p; } },
  eye:     { name: 'ตาที่สาม', icon: '👁', rar: 1, cost: 4, kind: 'add', flav: 'ดวงตาแก้วจากหน้าผากรูปปั้นในริลลายเอห์ มองเห็นสิ่งที่ไม่ควรเห็น', text: 'หน้าคืนสติแต่ละลูก โจมตี +4',
             fx: function (c) { var n = c.cnt.san || 0; if (!n) return null; c.s.atk += 4 * n; return '+' + 4 * n; } },
  hourglass:{ name: 'นาฬิกาทรายของยิธ', icon: '⌛', rar: 1, cost: 5, kind: 'add', flav: 'นาฬิกาทรายที่ทรายไหลขึ้นข้างบน ของจากเผ่าที่ข้ามกาลเวลา', text: 'สิทธิ์ทอยใหม่ที่เหลือไม่ได้ใช้ โจมตี +5 ต่อครั้ง',
             fx: function (c) { if (!c.rerollsLeft) return null; c.s.atk += 5 * c.rerollsLeft; return '+' + 5 * c.rerollsLeft; } },
  scroll:  { name: 'ม้วนคัมภีร์สีเหลือง', icon: '📜', rar: 2, cost: 6, kind: 'add', flav: 'บทละครเรื่องราชาสีเหลือง องก์ที่สอง ห้ามอ่านจนจบ', text: 'หน้าเสียสติแต่ละลูก โจมตี +6',
             fx: function (c) { var n = c.cnt.mad || 0; if (!n) return null; c.s.atk += 6 * n; return '+' + 6 * n; } },
  tooth:   { name: 'ฟันกูล', icon: '🦷', rar: 2, cost: 6, kind: 'add', grow: 'kill', flav: 'ฟันกูลที่ยังงอกยาวต่อไปเรื่อย ๆ ทุกครั้งที่ได้ลิ้มรส', text: 'โจมตี +1 ถาวรทุกครั้งที่ชนะศัตรู (โตขึ้นเรื่อย ๆ)',
             fx: function (c, st) { if (!st.n) return null; c.s.atk += st.n; return '+' + st.n; } },
  jar:     { name: 'โหลช็อกกอธ', icon: '🏺', rar: 2, cost: 6, kind: 'add', flav: 'โหลแก้วที่ข้างในมีบางอย่างเคลื่อนไหว และมีตาเปิดขึ้นทีละดวง', text: 'เต๋าที่ออกหน้าแรง 5 ขึ้นไป โจมตี +4 ต่อลูก',
             fx: function (c) { var n = c.rolls.filter(function (r) { return !r.banished && r.face.t !== 'mad' && r.face.v >= 5; }).length; if (!n) return null; c.s.atk += 4 * n; return '+' + 4 * n; } },
  pearl:   { name: 'ไข่มุกแห่งดาก้อน', icon: '🦪', rar: 1, cost: 4, kind: 'add', flav: 'ไข่มุกสีเขียวจากแนวหินปีศาจนอกอินส์มัธ', text: 'หน้าป้องกันแต่ละลูก ฟื้นเลือด 2',
             fx: function (c) { var n = c.cnt.blk || 0; if (!n) return null; c.s.heal += 2 * n; return '+' + 2 * n + ' เลือด'; } },
  star:    { name: 'หินพิทักษ์ห้าแฉก', icon: '✴', rar: 1, cost: 5, kind: 'add', flav: 'หินสลักรูปดาวที่ชาวบ้านในนิวอิงแลนด์ฝังไว้ใต้ธรณีประตู ไม่มีใครจำได้ว่าเริ่มทำกันตั้งแต่เมื่อไร', text: 'ทุกเทิร์น สติ +1 และป้องกัน +2',
             fx: function (c) { c.s.san += 1; c.s.blk += 2; return '+1 สติ +2 โล่'; } },
  cylinder:{ name: 'กระบอกสมองของมิโก', icon: '🧪', rar: 2, cost: 6, kind: 'add', flav: 'กระบอกโลหะที่ข้างในมีสมองคนลอยอยู่ ยังกระซิบได้', text: 'ทุกเทิร์น ศัตรูอ่อนแรงเพิ่ม 1 เทิร์น',
             fx: function (c) { c.s.weak += 1; return 'อ่อนแรง +1'; } },
  cup:     { name: 'ถ้วยแห่งความหิว', icon: '🍷', rar: 1, cost: 4, kind: 'add', flav: 'ถ้วยเงินที่ไม่เคยว่าง ไม่มีใครรู้ว่าของเหลวในนั้นคืออะไร', text: 'ถ้าโจมตีได้ ฟื้นเลือด 3',
             fx: function (c) { if (!c.s.atk) return null; c.s.heal += 3; return '+3 เลือด'; } },
  coin:    { name: 'เหรียญวิปเปอร์วิล', icon: '💰', rar: 1, cost: 4, kind: 'eco', flav: 'เหรียญที่นกวิปเปอร์วิลคาบมาวางไว้ข้างเตียงคนใกล้ตาย', text: 'ดอกเบี้ยสูงสุด +3 และได้เงินเพิ่ม 1 ทุกครั้งที่ชนะ', fx: function () { return null; } },
  golddie: { name: 'ลูกเต๋าทองคำ', icon: '🎲', rar: 2, cost: 6, kind: 'eco', flav: 'ลูกเต๋าทองคำที่ทุกหน้าคือหน้าเดียวกัน แต่ไม่มีใครเห็นตรงกัน', text: 'ทุกครั้งที่ออกคอมโบ ได้เงิน +2', fx: function () { return null; } },
  flask:   { name: 'ขวดพิษอุลธาร์', icon: '⚗', rar: 2, cost: 6, kind: 'mul', flav: 'ขวดยาจากหมอเวสต์ แมวในอุลธาร์ไม่ยอมเข้าใกล้', text: 'พิษ ×2',
             fx: function (c) { if (!c.s.poison) return null; c.s.poison *= 2; return 'พิษ ×2'; } },
  skull:   { name: 'กะโหลกแห่งความบ้า', icon: '💀', rar: 2, cost: 7, kind: 'mul', flav: 'กะโหลกของผู้อ่านตำราต้องห้ามคนแรก ยังหัวเราะอยู่', text: 'โจมตี ×(1 + สติที่หายไป ÷ 8)',
             fx: function (c) { var m = 1 + (c.maxSan - c.san) / 8; if (m <= 1.01 || !c.s.atk) return null; m = Math.round(m * 10) / 10; c.s.atk = Math.floor(c.s.atk * m); return '×' + m; } },
  lens:    { name: 'เลนส์ไร้รูปทรง', icon: '🔮', rar: 2, cost: 7, kind: 'mul', flav: 'เลนส์ที่หักเหแสงเป็นมุมที่ไม่มีในเรขาคณิต', text: 'ถ้ามีคอมโบ โจมตี ×1.5',
             fx: function (c) { if (!c.combos.length || !c.s.atk) return null; c.s.atk = Math.floor(c.s.atk * 1.5); return '×1.5'; } },
  mask:    { name: 'หน้ากากซีด', icon: '🎭', rar: 2, cost: 7, kind: 'mul', flav: 'หน้ากากซีดที่ไม่มีใครถอดออกตอนเที่ยงคืน', text: 'ถ้าไม่มีเต๋าออกหน้าว่างเลย โจมตี ×1.5',
             fx: function (c) { if (c.rolls.some(function (r) { return !r.banished && r.face.t === 'none'; }) || !c.s.atk) return null; c.s.atk = Math.floor(c.s.atk * 1.5); return '×1.5'; } },
  bell:    { name: 'ระฆังแห่งดันวิช', icon: '🔔', rar: 2, cost: 6, kind: 'mul', flav: 'ระฆังโบสถ์ดันวิชที่ดังเองก่อนเกิดเรื่องร้าย', text: 'ถ้าศัตรูเลือดเกินครึ่ง โจมตี ×1.5',
             fx: function (c) { if (c.eHp <= 0.5 || !c.s.atk) return null; c.s.atk = Math.floor(c.s.atk * 1.5); return '×1.5'; } },
  ember:   { name: 'ถ่านไฟจากคาร์โคซา', icon: '🔥', rar: 3, cost: 8, kind: 'mul', grow: 'combo', flav: 'ถ่านไฟจากเมืองริมทะเลสาบที่ไม่เคยมอด', text: 'โจมตี ×(1 + 0.05 ต่อคอมโบที่เคยทำ) สูงสุด ×2',
             fx: function (c, st) { if (!st.n || !c.s.atk) return null; var m = Math.round(Math.min(2, 1 + st.n * 0.05) * 100) / 100; c.s.atk = Math.floor(c.s.atk * m); return '×' + m; } },
  idol:    { name: 'รูปปั้นคธูลู', icon: '🐙', rar: 3, cost: 9, kind: 'mul', flav: 'รูปปั้นหินสีเขียวที่ศิลปินทั่วโลกฝันเห็นพร้อมกันในปี 1925', text: 'ทุกเทิร์นที่ 3 โจมตี ×3',
             fx: function (c) { if (c.turn % 3 || !c.s.atk) return null; c.s.atk *= 3; return '×3'; } },
  azeye:   { name: 'ดวงตาแห่งอาซาทอธ', icon: '🌀', rar: 3, cost: 11, kind: 'mul', flav: 'ดวงตาจากใจกลางจักรวาล มองแล้วไม่มีทางกลับมาเป็นคนเดิม', text: 'โจมตี ×2 แต่ทุกเทิร์นเสียสติ 1',
             fx: function (c) { c.s.mad += 1; if (!c.s.atk) return '−1 สติ'; c.s.atk *= 2; return '×2'; } },
  // ----- v8 additions -----
  nail:    { name: 'ตะปูโลงศพ', icon: '📌', rar: 1, cost: 4, kind: 'add', flav: 'ตะปูสนิมจากโลงที่ถูกงัดเปิดจากข้างใน', text: 'ถ้าเลือดคุณต่ำกว่าครึ่ง โจมตี +8',
             fx: function (c) { if (c.hp >= c.maxHp / 2 || !c.cnt.atk) return null; c.s.atk += 8; return '+8'; } },
  candle:  { name: 'เทียนไขมนุษย์', icon: '🕯', rar: 1, cost: 4, kind: 'add', flav: 'เทียนที่จุดแล้วไม่เคยหดสั้นลง ไม่มีใครอยากรู้ว่าทำจากอะไร', text: 'หน้าฟื้นเลือดแต่ละลูก ป้องกัน +3',
             fx: function (c) { var n = c.cnt.heal || 0; if (!n) return null; c.s.blk += 3 * n; return '+' + 3 * n + ' โล่'; } },
  mirror:  { name: 'กระจกจากใต้พีระมิด', icon: '🪞', rar: 1, cost: 5, kind: 'add', flav: 'กระจกสำริดจากห้องโถงใต้พีระมิดที่ไม่มีใครควรลงไป มันสะท้อนสิ่งที่ยืนอยู่ข้างหลังคุณ ไม่ใช่ตัวคุณ', text: 'หน้าว่างแต่ละลูก โจมตี +5',
             fx: function (c) { var n = c.rolls.filter(function (r) { return !r.banished && r.face.t === 'none'; }).length; if (!n) return null; c.s.atk += 5 * n; return '+' + 5 * n; } },
  web:     { name: 'ใยแมงมุมเลง', icon: '🕸', rar: 1, cost: 4, kind: 'add', flav: 'ใยเหนียวที่ยังสั่นไหวแม้ไม่มีลม', text: 'หน้าพิษแต่ละลูก โจมตี +3',
             fx: function (c) { var n = c.cnt.poison || 0; if (!n) return null; c.s.atk += 3 * n; return '+' + 3 * n; } },
  chalk:   { name: 'ชอล์กวงเวท', icon: '🖍', rar: 1, cost: 4, kind: 'add', flav: 'ชอล์กขาวที่ขีดวงแล้วสิ่งข้างนอกเข้ามาไม่ได้ อย่างน้อยก็ชั่วครู่', text: 'เทิร์นแรกของทุกไฟต์ ป้องกัน +15',
             fx: function (c) { if (c.turn !== 1) return null; c.s.blk += 15; return '+15 โล่'; } },
  tome:    { name: 'เนโครโนมิคอนฉบับขาด', icon: '📕', rar: 2, cost: 6, kind: 'add', flav: 'หน้ากระดาษที่หลุดออกมาไม่กี่แผ่น แค่นี้ก็พอให้อสูรตื่นตัว', text: 'เต๋าที่สกิลทำงานแต่ละลูก โจมตี +4',
             fx: function (c) { var n = c.rolls.filter(function (r) { return !r.banished && r.skTag; }).length; if (!n) return null; c.s.atk += 4 * n; return '+' + 4 * n; } },
  lantern: { name: 'ตะเกียงแสงจันทร์', icon: '🏮', rar: 1, cost: 5, kind: 'add', flav: 'แสงสีเขียวจากตะเกียงนี้ทำให้เนื้อของสิ่งมีชีวิตเน่าช้า ๆ', text: 'ทุกเทิร์น ศัตรูติดพิษ +2',
             fx: function (c) { c.s.poison += 2; return 'พิษ +2'; } },
  silver:  { name: 'มีดเงินแห่งอาร์คัม', icon: '🔪', rar: 1, cost: 5, kind: 'add', flav: 'มีดเงินที่ผู้เฒ่าในอาร์คัมพกติดตัวทุกคืนเพ็ญ', text: 'ถ้าไม่มีเต๋าออกหน้าเสียสติเลย โจมตี +6',
             fx: function (c) { if (c.cnt.mad || !c.cnt.atk) return null; c.s.atk += 6; return '+6'; } },
  organ:   { name: 'ซอวิโอลของเอริช ซานน์', icon: '🎻', rar: 2, cost: 6, kind: 'add', flav: 'เสียงซอวิโอลที่ชายใบ้บรรเลงทุกคืน เพื่อกันบางสิ่งไว้นอกหน้าต่าง', text: 'ถ้าเต๋าทุกลูกออกหน้าไม่ซ้ำแบบกันเลย โจมตี +14',
             fx: function (c) { var seen = {}, ok = true; c.rolls.forEach(function (r) { if (r.banished) return; if (seen[r.face.t]) ok = false; seen[r.face.t] = 1; }); if (!ok) return null; c.s.atk += 14; return '+14'; } },
  crown:   { name: 'มงกุฎราชาสีเหลือง', icon: '👑', rar: 3, cost: 9, kind: 'mul', flav: 'มงกุฎผ้าขาดที่ไม่มีใครกล้าสวม เพราะมันจะไม่ยอมหลุดออก', text: 'ถ้ามีคอมโบตั้งแต่ 4 ลูกขึ้นไป โจมตี ×2',
             fx: function (c) { var top = 0; c.combos.forEach(function (k) { top = Math.max(top, c.lv[k]); }); if (top < 2 || !c.s.atk) return null; c.s.atk *= 2; return '×2'; } },
  heart:   { name: 'หัวใจที่ยังเต้น', icon: '❤', rar: 2, cost: 7, kind: 'mul', flav: 'หัวใจในโหลแก้ว ยิ่งเจ้าของเจ็บ มันยิ่งเต้นแรง', text: 'โจมตี ×(1 + เลือดที่หายไป ÷ เลือดเต็ม)',
             fx: function (c) { var m = Math.round((1 + (c.maxHp - c.hp) / c.maxHp) * 10) / 10; if (m <= 1.05 || !c.s.atk) return null; c.s.atk = Math.floor(c.s.atk * m); return '×' + m; } },
  aegis:   { name: 'โล่แห่งผู้เฒ่า', icon: '🛡', rar: 2, cost: 6, kind: 'mul', flav: 'โล่หินที่ผู้สร้างโบราณทิ้งไว้ในเมืองใต้น้ำแข็ง', text: 'ป้องกัน ×1.5',
             fx: function (c) { if (!c.s.blk) return null; c.s.blk = Math.floor(c.s.blk * 1.5); return 'โล่ ×1.5'; } },
  clock:   { name: 'นาฬิกาเดินถอยหลัง', icon: '⏳', rar: 2, cost: 6, kind: 'mul', flav: 'เข็มนาฬิกาที่เดินย้อน ทุกครั้งที่คุณลังเล มันได้เปรียบ', text: 'ถ้าใช้ทอยใหม่จนหมด โจมตี ×1.5',
             fx: function (c) { if (c.rerollsLeft > 0 || !c.s.atk) return null; c.s.atk = Math.floor(c.s.atk * 1.5); return '×1.5'; } },
  tentacle:{ name: 'หนวดจากห้วงลึก', icon: '🦑', rar: 2, cost: 6, kind: 'mul', flav: 'ปลายหนวดที่ตัดขาดแล้วยังบิดไปมา หาเหยื่อที่อ่อนแอ', text: 'ถ้าศัตรูมีพิษอยู่ โจมตี ×1.4',
             fx: function (c) { if (!c.ePoison || !c.s.atk) return null; c.s.atk = Math.floor(c.s.atk * 1.4); return '×1.4'; } },
  bounty:  { name: 'ใบประกาศจับของลัทธิ', icon: '📃', rar: 1, cost: 4, kind: 'eco', flav: 'ลัทธิให้รางวัลงามกับใครก็ตามที่เอาหัวของพวกเดียวกันมาได้', text: 'ชนะศัตรูอันตรายหรือบอส ได้เงินเพิ่ม 3', fx: function () { return null; } },
  key:     { name: 'กุญแจเงิน', icon: '🗝', rar: 2, cost: 6, kind: 'eco', flav: 'กุญแจที่ไขประตูได้ทุกบาน รวมถึงประตูแห่งความฝัน', text: 'ทุกอย่างในร้านถูกลง 1 เหรียญ', fx: function () { return null; } },
  salt:    { name: 'เกลือศักดิ์สิทธิ์', icon: '🧂', rar: 1, cost: 5, kind: 'eco', flav: 'เกลือจากโบสถ์เก่าในคิงส์พอร์ต โรยรอบตัวแล้วสิ่งต่ำช้าไม่กล้าแตะ', text: 'ไม่โดนหนามพิษ เลือดไหล และการขโมยเงินจากนิสัยศัตรู', fx: function () { return null; } },
};
var RELIC_KEYS = Object.keys(RELICS);
function relicMax(run) { return RELIC_MAX + (run && run.extraSlot ? 1 : 0); }
function applyRelics(list, c) {
  var steps = [];
  var order = list.map(function (st, i) { return i; });
  if (c.shuffle) order.sort(function (a, b) { return ((a * 7919 + c.turn * 31) % 13) - ((b * 7919 + c.turn * 31) % 13); });
  ['add', 'mul'].forEach(function (kind) {
    order.forEach(function (i) {
      var st = list[i];
      var R = RELICS[st.id]; if (!R || R.kind !== kind || st.off) return;
      if (kind === 'mul' && c.noMul) return;
      var before = c.s.atk, t = R.fx(c, st);
      if (t) steps.push({ i: i, id: st.id, t: t, atk: c.s.atk, from: before });
    });
  });
  if (c.noHeal) c.s.heal = 0;
  if (c.noSan) c.s.san = 0;
  if (c.halfSan) c.s.san = Math.floor(c.s.san / 2);
  return steps;
}
function hasRelic(list, id) { return (list || []).some(function (r) { return r.id === id; }); }
function sellPrice(id) { return Math.max(1, Math.floor(RELICS[id].cost / 2)); }
function shopRelics(list, n, rnd) {
  rnd = rnd || Math.random;
  var own = (list || []).map(function (r) { return r.id; });
  var pool = RELIC_KEYS.filter(function (k) { return own.indexOf(k) < 0; });
  var out = [];
  while (out.length < n && pool.length) {
    // rarity weights 1:60% 2:32% 3:8%
    var roll = rnd(), want = roll < 0.6 ? 1 : roll < 0.92 ? 2 : 3;
    var p = pool.filter(function (k) { return RELICS[k].rar === want; }); if (!p.length) p = pool;
    var pick = p[Math.floor(rnd() * p.length)]; out.push(pick); pool.splice(pool.indexOf(pick), 1);
  }
  return out;
}
function interest(coins, list) { return Math.min(Math.floor(coins / 5), hasRelic(list, 'coin') ? 6 : 3); }
// shop prices rise with chapter level
function relicCost(id, level, list) { return Math.max(1, RELICS[id].cost + Math.floor((level || 0) / 2) - (hasRelic(list, 'key') ? 1 : 0)); }
function upCost(lv) { return 4 + 3 * lv; }
var UP_MAX = 3;

// ===== Events between fights =====
// each option: { t: label, d: description, need(run) -> bool, go(run, api) -> result text }
var EVENTS = [
  { id: 'altar', name: 'แท่นบูชาเลือด', art: 'cultist', text: 'แท่นหินเปื้อนเลือดแห้ง มีบางอย่างวางอยู่บนนั้น มันต้องการเครื่องสังเวย',
    opts: [
      { t: 'สังเวยเลือด 10', d: 'ได้เครื่องรางสุ่ม 1 ชิ้น', need: function (r) { return r.hp > 10; }, go: function (r, a) { r.hp -= 10; return a.giveRelic(); } },
      { t: 'เดินผ่านไป', d: 'ไม่เสียอะไร', go: function () { return 'คุณเดินผ่านไปโดยไม่หันกลับไปมอง'; } } ] },
  { id: 'book', name: 'หนังสือต้องห้าม', art: 'actor', text: 'หนังสือเล่มหนาปกหนังที่ไม่ใช่หนังสัตว์ วางเปิดค้างไว้บนโต๊ะ ตัวอักษรขยับเอง',
    opts: [
      { t: 'อ่านจนจบ', d: 'ได้เครื่องรางหายาก แต่สติ −6', go: function (r, a) { r.san = Math.max(1, r.san - 6); return a.giveRelic(3); } },
      { t: 'ฉีกหน้ากระดาษไปขาย', d: 'ได้เงิน +7 สติ −2', go: function (r) { r.coins += 7; r.san = Math.max(1, r.san - 2); return 'ได้เงิน 7'; } },
      { t: 'ปิดหนังสือ', d: 'สติ +3', go: function (r) { r.san = Math.min(r.maxSan, r.san + 3); return 'คุณรู้สึกสบายใจขึ้นเล็กน้อย'; } } ] },
  { id: 'merchant', name: 'พ่อค้าชาวเลง', art: 'leng', text: 'ชายสวมผ้าโพกหัวยิ้มกว้างเกินไป เขาสนใจเต๋าในถุงของคุณมาก',
    opts: [
      { t: 'ขายเต๋า 1 ลูก', d: 'ทิ้งเต๋าลูกที่อ่อนที่สุด ได้เงิน +10', need: function (r) { return r.dice.length > 3; }, go: function (r, a) { return a.sellWeakest(10); } },
      { t: 'ซื้อของในห่อผ้า', d: 'จ่าย 5 ได้เครื่องรางสุ่ม', need: function (r) { return r.coins >= 5; }, go: function (r, a) { r.coins -= 5; return a.giveRelic(); } },
      { t: 'ปฏิเสธ', d: 'ไม่เกิดอะไรขึ้น', go: function () { return 'เขาหัวเราะเสียงแหลมแล้วหายไปในหมอก'; } } ] },
  { id: 'well', name: 'บ่อน้ำแห่งความฝัน', art: 'hali', text: 'น้ำในบ่อนิ่งสนิท ไม่สะท้อนเงาของคุณ แต่สะท้อนอย่างอื่น',
    opts: [
      { t: 'ดื่ม', d: 'ฟื้นสติเต็ม เลือด −8', need: function (r) { return r.hp > 8; }, go: function (r) { r.san = r.maxSan; r.hp -= 8; return 'สติกลับมาเต็ม แต่ร่างกายเย็นเฉียบ'; } },
      { t: 'ล้างหน้า', d: 'เลือด +12', go: function (r) { r.hp = Math.min(r.maxHp, r.hp + 12); return 'ฟื้นเลือด 12'; } } ] },
  { id: 'idol', name: 'เทวรูปทองคำ', art: 'deepElite', text: 'เทวรูปทองคำของพระบิดาดาก้อน แกะทองออกได้ แต่เขาจะรู้',
    opts: [
      { t: 'แกะทองออก', d: 'เงิน +14 แต่ศัตรูด่านต่อไปแรงขึ้น', go: function (r) { r.coins += 14; r.cursedNext = true; return 'ได้เงิน 14 รู้สึกเหมือนมีอะไรจ้องมอง'; } },
      { t: 'สวดภาวนา', d: 'เลือด +6 สติ +2', go: function (r) { r.hp = Math.min(r.maxHp, r.hp + 6); r.san = Math.min(r.maxSan, r.san + 2); return 'จิตใจสงบลง'; } } ] },
  { id: 'cat', name: 'แมวดำจรจัด', art: 'cat', text: 'แมวดำตัวหนึ่งนั่งมองคุณอยู่บนกำแพง ดวงตาสีเขียววาวในความมืด',
    opts: [
      { t: 'ให้อาหาร', d: 'จ่าย 3 แมวขอติดตามไปด้วย (ได้เต๋าแมว)', need: function (r) { return r.coins >= 3; }, go: function (r, a) { r.coins -= 3; return a.giveDie('cat'); } },
      { t: 'ลูบหัว', d: 'สติ +4', go: function (r) { r.san = Math.min(r.maxSan, r.san + 4); return 'มันครางเบา ๆ แล้วเดินจากไป'; } } ] },
  { id: 'tarot', name: 'หมอดูไพ่ทาโรต์', art: 'witch', text: 'หญิงชราคว่ำไพ่ใบเดียวลงบนโต๊ะ "เดิมพันไหม"',
    opts: [
      { t: 'เดิมพันเงินทั้งหมด', d: 'ครึ่งต่อครึ่ง: เงินเพิ่มเป็นสองเท่า หรือหายครึ่ง', need: function (r) { return r.coins > 0; }, go: function (r) { if (Math.random() < 0.5) { r.coins *= 2; return 'ไพ่คือดวงอาทิตย์ เงินเพิ่มเป็น ' + r.coins; } r.coins = Math.floor(r.coins / 2); return 'ไพ่คือหอคอย เงินเหลือ ' + r.coins; } },
      { t: 'ขอคำทำนาย', d: 'จ่าย 2 เลือดสูงสุด +4', need: function (r) { return r.coins >= 2; }, go: function (r) { r.coins -= 2; r.maxHp += 4; r.hp += 4; return 'เลือดสูงสุด +4'; } },
      { t: 'เดินหนี', d: '', go: function () { return 'เสียงหัวเราะของเธอตามคุณมาอีกนาน'; } } ] },
  { id: 'corpse', name: 'ศพนักสำรวจ', art: 'corpse', text: 'ศพในชุดสำรวจของมหาวิทยาลัยมิสกาโทนิก มือยังกำกระเป๋าไว้แน่น',
    opts: [
      { t: 'ค้นกระเป๋า', d: 'อาจได้เครื่องราง หรืออาจโดนกัด', go: function (r, a) { if (Math.random() < 0.6) return a.giveRelic(); r.hp = Math.max(1, r.hp - 9); return 'ศพลืมตาแล้วกัดมือคุณ เลือด −9'; } },
      { t: 'ฝังให้', d: 'สติ +3 เงิน +2', go: function (r) { r.san = Math.min(r.maxSan, r.san + 3); r.coins += 2; return 'คุณพบเหรียญในกระเป๋าเสื้อ'; } } ] },
  { id: 'shrine', name: 'ศาลเจ้าริมทะเล', art: 'hybrid', text: 'ศาลไม้ผุ ๆ ที่ชาวอินส์มัธทิ้งของเซ่นไว้ ตัวอักษรบนเสาไม่ใช่ภาษาของมนุษย์',
    opts: [
      { t: 'ถวายเงิน 5', d: 'อสูรสุ่ม 1 ชนิดในถุงปลุกพลัง +1 ขั้น', need: function (r) { return r.coins >= 5; }, go: function (r, a) { r.coins -= 5; return a.upgradeRandom(1); } },
      { t: 'ขโมยของเซ่น', d: 'เงิน +8 แต่ศัตรูด่านต่อไปแรงขึ้น', go: function (r) { r.coins += 8; r.cursedNext = true; return 'ได้เงิน 8 มีเสียงน้ำกระเพื่อมตามหลังมา'; } },
      { t: 'เดินผ่านไป', d: '', go: function () { return 'คลื่นซัดฝั่งเบา ๆ ไม่มีอะไรเกิดขึ้น'; } } ] },
  { id: 'library', name: 'ห้องเก็บหนังสือหายาก', art: 'actor', text: 'ห้องสมุดมิสกาโทนิกลืมล็อกห้องเก็บหนังสือต้องห้ามไว้ ตู้กระจกเปิดแง้มอยู่',
    opts: [
      { t: 'ศึกษาตำรา', d: 'สติ −5 อสูรสุ่ม 2 ชนิดปลุกพลัง +1 ขั้น', need: function (r) { return r.san > 5; }, go: function (r, a) { r.san -= 5; return a.upgradeRandom(2); } },
      { t: 'แอบเอาหนังสือไปขาย', d: 'เงิน +10 สติ −2', go: function (r) { r.coins += 10; r.san = Math.max(1, r.san - 2); return 'ได้เงิน 10 แต่ฝันถึงหน้ากระดาษทั้งคืน'; } },
      { t: 'ปิดประตูให้', d: 'สติ +3', go: function (r) { r.san = Math.min(r.maxSan, r.san + 3); return 'บางอย่างไม่ควรถูกอ่าน'; } } ] },
  { id: 'ghoultrade', name: 'กูลนักแลกเปลี่ยน', art: 'ghoul', text: 'กูลผอมโซตัวหนึ่งยื่นมือเปื้อนดินออกมา มันอยากได้อสูรของคุณ และมีของดีกว่าให้แลก',
    opts: [
      { t: 'แลกอสูรที่อ่อนที่สุด', d: 'ทิ้งเต๋าที่อ่อนที่สุด ได้อสูรระดับสูงกว่าแบบสุ่ม', need: function (r) { return r.dice.length >= 3; }, go: function (r, a) { return a.tradeUp(); } },
      { t: 'ขายกระดูกให้มัน', d: 'เลือด −6 เงิน +7', need: function (r) { return r.hp > 6; }, go: function (r) { r.hp -= 6; r.coins += 7; return 'มันแทะกระดูกนิ้วคุณอย่างพอใจ ได้เงิน 7'; } },
      { t: 'ไล่มันไป', d: '', go: function () { return 'มันหัวเราะเสียงแหบแล้วมุดหายลงดิน'; } } ] },
  { id: 'gate', name: 'บันไดเจ็ดสิบขั้นแห่งการหลับตื้น', art: 'moonbeast', text: 'บันไดที่ทอดลงไปในความฝัน ลมอุ่นพัดขึ้นมาพร้อมกลิ่นทะเลที่ไม่มีบนโลก',
    opts: [
      { t: 'เดินลงไป', d: 'ครึ่งต่อครึ่ง: ได้เครื่องรางหายาก หรือ สติ −7', go: function (r, a) { if (Math.random() < 0.5) return a.giveRelic(2); r.san = Math.max(1, r.san - 7); return 'คุณตื่นขึ้นพร้อมเสียงกรีดร้อง สติ −7'; } },
      { t: 'นั่งพักที่ขั้นแรก', d: 'สติ +4 เลือด +4', go: function (r) { r.san = Math.min(r.maxSan, r.san + 4); r.hp = Math.min(r.maxHp, r.hp + 4); return 'ความฝันตื้น ๆ ช่วยให้ใจสงบ'; } } ] },
  { id: 'fish', name: 'ร้านปลาในอินส์มัธ', art: 'deep', text: 'ชายหน้าเหมือนปลายื่นปลาตัวประหลาดตาโปนให้ "กินแล้วจะแข็งแรงเหมือนพวกเรา"',
    opts: [
      { t: 'ซื้อมากิน', d: 'จ่าย 4 เลือดสูงสุด +6 แต่สติสูงสุด −1', need: function (r) { return r.coins >= 4; }, go: function (r) { r.coins -= 4; r.maxHp += 6; r.hp += 6; r.maxSan = Math.max(10, r.maxSan - 1); r.san = Math.min(r.san, r.maxSan); return 'ผิวคุณลื่นขึ้นนิดหน่อย เลือดสูงสุด +6'; } },
      { t: 'ปฏิเสธ', d: '', go: function () { return 'เขามองตามคุณไปด้วยตาที่ไม่กะพริบ'; } } ] },
  { id: 'dicegame', name: 'วงเต๋าในตรอกมืด', art: 'leng', text: 'ชายสวมผ้าโพกสามคนนั่งทอยเต๋ากระดูก "เล่นสักตาไหม นักทอยเต๋า"',
    opts: [
      { t: 'แทง 5', d: 'โอกาส 1 ใน 3 ได้ 15', need: function (r) { return r.coins >= 5; }, go: function (r) { r.coins -= 5; if (Math.random() < 1 / 3) { r.coins += 15; return 'เต๋ากระดูกหงายหน้าตา คุณชนะ 15'; } return 'เต๋ากระดูกหงายหน้าว่าง เสียเงิน 5'; } },
      { t: 'ดูอยู่ห่าง ๆ', d: 'เรียนวิธีโกง ไฟต์หน้าทอยใหม่ได้เพิ่มเทิร์นละ 1 ครั้ง', go: function (r) { r.extraReroll = 1; return 'คุณจำวิธีบิดข้อมือได้ ไฟต์หน้าทอยใหม่ได้เพิ่มเทิร์นละ 1 ครั้ง'; } } ] },
  { id: 'surgeon', name: 'คลินิกของหมอเวสต์', art: 'corpse', text: 'ชายใส่แว่นยิ้มสุภาพ ถือเข็มฉีดยาเรืองแสงสีเขียว "ผมช่วยให้อสูรของคุณแข็งแรงขึ้นได้"',
    opts: [
      { t: 'ยอมให้ทดลอง', d: 'เลือดสูงสุด −5 อสูรสุ่ม 1 ชนิดปลุกพลัง +2 ขั้น', need: function (r) { return r.maxHp > 30; }, go: function (r, a) { r.maxHp -= 5; r.hp = Math.min(r.hp, r.maxHp); return a.upgradeRandom(1, 2); } },
      { t: 'ขอแค่รักษาแผล', d: 'จ่าย 3 เลือด +15', need: function (r) { return r.coins >= 3; }, go: function (r) { r.coins -= 3; r.hp = Math.min(r.maxHp, r.hp + 15); return 'แผลปิดสนิท ไม่อยากรู้ว่าใช้อะไรเย็บ'; } },
      { t: 'รีบออกไป', d: '', go: function () { return 'คุณได้ยินเสียงบางอย่างเคาะผนังจากข้างใน'; } } ] },
  { id: 'walls', name: 'เสียงในกำแพง', art: 'rat', text: 'เสียงหนูวิ่งในกำแพงบ้านเก่า มันดังเป็นจังหวะ เหมือนกำลังพาคุณไปที่ไหนสักแห่ง',
    opts: [
      { t: 'ตามเสียงลงไปใต้ดิน', d: 'ได้เครื่องรางสุ่ม สติ −4', need: function (r) { return r.san > 4; }, go: function (r, a) { r.san -= 4; return a.giveRelic(); } },
      { t: 'อุดกำแพง', d: 'เงิน −2 สติ +3', need: function (r) { return r.coins >= 2; }, go: function (r) { r.coins -= 2; r.san = Math.min(r.maxSan, r.san + 3); return 'เสียงเงียบลง แต่คุณรู้ว่ามันยังอยู่'; } } ] },
  { id: 'stars', name: 'ดวงดาวเรียงตัว', art: 'cultist', text: 'คืนนี้ดวงดาวอยู่ในตำแหน่งที่ถูกต้อง สาวกลัทธิทิ้งแท่นพิธีที่จุดไฟไว้แล้ว',
    opts: [
      { t: 'ทำพิธีให้จบ', d: 'อสูรทุกชนิดในถุงปลุกพลัง +1 แต่สติสูงสุด −3', need: function (r) { return r.maxSan > 12; }, go: function (r, a) { r.maxSan -= 3; r.san = Math.min(r.san, r.maxSan); return a.upgradeAll(); } },
      { t: 'ดับไฟ', d: 'สติ +3', go: function (r) { r.san = Math.min(r.maxSan, r.san + 3); return 'ดวงดาวเคลื่อนพ้นไป ครั้งนี้รอดตัว'; } } ] },
  { id: 'colourwell', name: 'บ่อน้ำในหุบเขาที่ตายแล้ว', art: 'colourFoe', text: 'น้ำในบ่อเรืองแสงสีที่ไม่มีชื่อ ต้นไม้รอบ ๆ แห้งตายเป็นสีเทา',
    opts: [
      { t: 'ดื่ม', d: 'เลือดเต็ม แต่สติสูงสุด −2', go: function (r) { r.hp = r.maxHp; r.maxSan = Math.max(10, r.maxSan - 2); r.san = Math.min(r.san, r.maxSan); return 'ร่างกายแข็งแรงผิดธรรมชาติ แต่สีบางอย่างติดอยู่ในตา'; } },
      { t: 'ตักใส่ขวดไปขาย', d: 'เงิน +6 เลือด −4', need: function (r) { return r.hp > 4; }, go: function (r) { r.coins += 6; r.hp -= 4; return 'ขวดอุ่นขึ้นเรื่อย ๆ ในมือ ได้เงิน 6'; } } ] },
];

if (typeof module !== 'undefined') module.exports = { relicMax: relicMax, relicCost: relicCost, upCost: upCost, UP_MAX: UP_MAX, RELICS: RELICS, RELIC_KEYS: RELIC_KEYS, RELIC_MAX: RELIC_MAX, applyRelics: applyRelics, shopRelics: shopRelics, interest: interest, hasRelic: hasRelic, sellPrice: sellPrice, EVENTS: EVENTS };
