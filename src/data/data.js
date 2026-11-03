// ===== GAME DATA (shared by the game page and the playtest bot) =====
var F = function (t, v) { return { t: t, v: v || 0 }; };
var P = F;

var DICE = {
  cultA:  { name: 'ผู้ทำพิธี (ดาบ)', short: 'พิธีดาบ', tier: 0, tint: '#7d8580', flav: 'คนธรรมดาที่ถือมีดพิธี',
            faces: [F('atk',3),F('atk',2),F('atk',2),F('blk',2),F('blk',1),F('none')] },
  cultB:  { name: 'ผู้ทำพิธี (โล่)', short: 'พิธีโล่', tier: 0, tint: '#7d8580', flav: 'คนธรรมดาที่ท่องบทสวดคุ้มกัน',
            faces: [F('blk',3),F('blk',2),F('atk',2),F('atk',1),F('san',1),F('none')] },
  ghoul:  { name: 'กูล', short: 'กูล', tier: 1, tint: '#8f7a5a', flav: 'ผีกินซากจากสุสานใต้ดิน ตีแรงแต่ขู่ขวัญเล็กน้อย',
            faces: [F('atk',4),F('atk',3),F('atk',3),F('heal',2),F('atk',2),F('mad',1)] },
  deep:   { name: 'ดีพวัน', short: 'ดีพวัน', tier: 1, tint: '#4f8a8b', flav: 'ลูกหลานแห่งทะเลลึก ทนทานและฟื้นตัวเร็ว',
            faces: [F('blk',4),F('blk',3),F('atk',3),F('heal',3),F('atk',2),F('mad',1)] },
  gaunt:  { name: 'ไนต์กอนต์', short: 'ไนต์กอนต์', tier: 1, tint: '#5e5873', flav: 'ปีศาจไร้หน้าแห่งราตรี ทำให้ศัตรูอ่อนแรง',
            faces: [F('weak',2),F('weak',1),F('atk',3),F('blk',3),F('atk',2),F('none')] },
  migo:   { name: 'มิโก', short: 'มิโก', tier: 1, tint: '#a0705e', flav: 'แมลงราจากดาวยูกอธ ปล่อยพิษช้าแต่แน่นอน',
            faces: [F('poison',3),F('poison',2),F('poison',2),F('atk',2),F('san',1),F('mad',1)] },
  spider: { name: 'แมงมุมแห่งเลง', short: 'แมงมุม', tier: 2, tint: '#9a4f6b', flav: 'แมงมุมยักษ์จากที่ราบสูงเลง ทั้งพิษทั้งเขี้ยว',
            faces: [F('poison',4),F('atk',5),F('atk',4),F('poison',3),F('mad',2),F('mad',1)] },
  elder:  { name: 'เอลเดอร์ธิง', short: 'เอลเดอร์', tier: 2, tint: '#6f8f6a', flav: 'ผู้สร้างโบราณจากขั้วโลกใต้ ช่วยประคองสติ',
            faces: [F('blk',5),F('blk',4),F('san',2),F('san',2),F('atk',3),F('heal',2)] },
  yith:   { name: 'เผ่ายิธ', short: 'ยิธ', tier: 2, tint: '#8a7fb0', flav: 'เผ่าที่สลับจิตข้ามกาลเวลา เยียวยาทั้งกายและใจ',
            faces: [F('san',3),F('san',2),F('heal',3),F('blk',3),F('atk',3),F('weak',1)] },
  shog:   { name: 'ช็อกกอธ', short: 'ช็อกกอธ', tier: 3, tint: '#3f6e5a', flav: 'ก้อนเนื้อนับพันตา ทรงพลังมหาศาลแต่คุมยาก',
            faces: [F('atk',8),F('atk',6),F('atk',5),F('blk',5),F('mad',3),F('mad',2)] },
  colour: { name: 'สีจากนอกโลก', short: 'สีนอกโลก', tier: 3, tint: '#b07ad6', flav: 'สีที่ไม่ควรมีอยู่ ดูดชีวิตทุกสิ่งที่แตะ',
            faces: [F('atk',10),F('poison',6),F('atk',7),F('heal',4),F('mad',4),F('mad',3)] },
  cat:    { name: 'แมวแห่งอุลธาร์', short: 'แมว', tier: 1, tint: '#c9a46a', flav: 'แมวศักดิ์สิทธิ์ ไม่มีหน้าเสียสติเลย',
            faces: [F('atk',3),F('atk',2),F('heal',2),F('san',2),F('blk',2),F('weak',1)] },
  ghast:  { name: 'แกสต์', short: 'แกสต์', tier: 1, tint: '#8c6b6b', flav: 'กระโดดเข้าใส่แรงมาก แต่บ้าคลั่งง่าย',
            faces: [F('atk',5),F('atk',4),F('atk',3),F('poison',2),F('mad',1),F('mad',1)] },
  moon:   { name: 'อสูรจันทรา', short: 'จันทรา', tier: 2, tint: '#9a8fa8', flav: 'ทำได้ทุกอย่าง แต่ไม่เก่งสักอย่าง',
            faces: [F('atk',4),F('blk',4),F('poison',3),F('heal',3),F('weak',1),F('mad',2)] },
  polyp:  { name: 'โพลิปบิน', short: 'โพลิป', tier: 3, tint: '#7d8fa0', flav: 'พายุล่องหน ตีแรงและทำให้ศัตรูอ่อนแรง',
            faces: [F('atk',9),F('atk',7),F('weak',2),F('weak',2),F('mad',3),F('none')] },
};

// Enemy part types: atk, blk, mad, str, drain (attack that heals the enemy),
// daze (you get 1 fewer reroll next turn), freeze (N of your dice are pinned next turn)
var FOES = {
  zoog:     { name: 'ซูก', sub: 'สัตว์จิ๋วจอมแอบแห่งป่าต้องมนตร์', hp: 16, col: '#8b7d55', trait: 'thief',
              intents: [[P('atk',3)], [P('daze',1)], [P('atk',5)]] },
  cultist:  { name: 'สาวกลัทธิ', sub: 'ผู้บูชาเทพโบราณ', hp: 20, col: '#7a6a7e', trait: 'dread',
              intents: [[P('atk',4)], [P('mad',2)], [P('blk',4), P('atk',2)]] },
  ghoul:    { name: 'กูล', sub: 'ผู้กินซาก', hp: 22, col: '#8f7a5a', trait: 'bleed',
              intents: [[P('atk',5)], [P('atk',4)], [P('blk',4), P('atk',3)]] },
  ghoulPack:{ name: 'ฝูงกูล', sub: 'หิวโหยเกินกว่าจะรอ', hp: 28, col: '#9a7f52', trait: 'bleed',
              intents: [[P('atk',4)], [P('drain',4)], [P('atk',6)]] },
  ghoulKing:{ name: 'ราชากูล', sub: 'เจ้าแห่งสุสานใต้ดิน', hp: 55, col: '#b08a4e', boss: true,
              rule: { name: 'กินไม่เหลือซาก', text: 'ฟื้นเลือดไม่ได้เลยตลอดไฟต์' }, noHeal: true,
              skill: { name: 'งานเลี้ยงซากศพ', text: 'ถ้าเลือดคุณต่ำกว่าครึ่ง มันตีแรงขึ้น +{feast}' }, feast: 3,
              intents: [[P('atk',6)], [P('drain',6)], [P('blk',8), P('str',1)], [P('freeze',1), P('atk',5)], [P('atk',9)]] },
  hybrid:   { name: 'ชาวอินส์มัธ', sub: 'ครึ่งคนครึ่งปลา', hp: 24, col: '#5f8a80', trait: 'harden',
              intents: [[P('atk',5)], [P('daze',1), P('atk',2)], [P('atk',6)]] },
  deep:     { name: 'ดีพวัน', sub: 'ผู้มาจากใต้ทะเล', hp: 30, col: '#4f8a8b', trait: 'harden',
              intents: [[P('atk',6)], [P('blk',6), P('atk',2)], [P('mad',3)]] },
  deepElite:{ name: 'นักบวชดีพวัน', sub: 'ผู้สวดเรียกพระบิดา', hp: 36, col: '#3f7d8f', trait: 'dread',
              intents: [[P('mad',3)], [P('atk',7)], [P('freeze',1), P('atk',4)], [P('drain',5)]] },
  dagon:    { name: 'ดาก้อน', sub: 'พระบิดาแห่งห้วงน้ำ', hp: 80, col: '#3c8f9a', boss: true,
              rule: { name: 'แรงกดใต้ทะเล', text: 'ทอยใหม่ได้แค่ 1 ครั้งต่อเทิร์น' }, maxReroll: 1,
              skill: { name: 'คลื่นยักษ์', text: 'ทุก 3 เทิร์น ตรึงเต๋าทั้งถุงของคุณ 1 เทิร์น' }, wave: 3,
              intents: [[P('atk',9)], [P('freeze',2), P('atk',4)], [P('blk',10), P('str',2)], [P('drain',7)], [P('atk',12)]] },
  gaunt:    { name: 'ไนต์กอนต์', sub: 'ปีศาจไร้หน้า', hp: 26, col: '#5e5873', trait: 'vengeful',
              intents: [[P('atk',5)], [P('freeze',2)], [P('atk',8)]] },
  spider:   { name: 'แมงมุมแห่งเลง', sub: 'ผู้ทอใยในที่ราบสูง', hp: 32, col: '#9a4f6b', trait: 'thorns',
              intents: [[P('atk',5)], [P('drain',5)], [P('freeze',1), P('atk',4)], [P('mad',3)]] },
  gug:      { name: 'กั๊ก', sub: 'ยักษ์สี่แขนแห่งโลกใต้', hp: 44, col: '#7b5d4c', trait: 'enrage',
              intents: [[P('atk',9)], [P('blk',8)], [P('atk',7), P('daze',1)]] },
  nyar:     { name: 'ไนอาร์ลาโธเทป', sub: 'ผู้ส่งสารแห่งเทพภายนอก', hp: 150, col: '#8f6fc4', boss: true,
              rule: { name: 'ผู้หลอกลวง', text: 'ทุกเทิร์นเครื่องราง 1 ชิ้นถูกปิดแบบสุ่ม' }, relicOff: 1,
              skill: { name: 'พันหน้า', text: 'ซ่อนท่าที่จะใช้ทุกเทิร์นเว้นเทิร์น' }, hide: true,
              intents: [[P('mad',5)], [P('daze',1), P('atk',6)], [P('atk',10)], [P('freeze',2), P('mad',3)], [P('str',3), P('blk',10)], [P('atk',13)]] },
  elder:    { name: 'เอลเดอร์ธิง', sub: 'ผู้ตื่นจากน้ำแข็ง', hp: 40, col: '#6f8f6a', trait: 'harden',
              intents: [[P('blk',8)], [P('atk',7)], [P('daze',1), P('atk',4)]] },
  migo:     { name: 'มิโก', sub: 'นักผ่าตัดจากยูกอธ', hp: 36, col: '#a0705e', trait: 'dread',
              intents: [[P('atk',6)], [P('str',2)], [P('atk',7), P('mad',2)], [P('blk',8)]] },
  shog:     { name: 'ช็อกกอธ', sub: 'ทาสที่ลุกฮือ', hp: 55, col: '#3f6e5a', trait: 'grow',
              intents: [[P('atk',10)], [P('blk',10)], [P('atk',6), P('mad',3)], [P('mad',5)]] },
  shogKing: { name: 'ช็อกกอธบรรพกาล', sub: 'ผู้กลืนเมืองโบราณ', hp: 110, col: '#2f7f5f', boss: true,
              rule: { name: 'ดูดกลืน', text: 'คอมโบต้องออกหน้าเดียวกัน 4 ลูกขึ้นไป' }, comboMin: 4,
              skill: { name: 'ร่างหนืด', text: 'หน้าโจมตีที่แรงไม่ถึง 4 ทำความเสียหายแค่ครึ่ง' }, armor: 4,
              intents: [[P('atk',12)], [P('freeze',2), P('atk',6)], [P('drain',10)], [P('blk',14), P('str',2)], [P('atk',16)]] },
  spawn:    { name: 'ลูกหลานคธูลู', sub: 'ผู้ลงมาจากดวงดาว', hp: 60, col: '#4f7f62', trait: 'enrage',
              intents: [[P('atk',10)], [P('mad',4)], [P('freeze',2), P('atk',6)], [P('blk',12)]] },
  cthulhu:  { name: 'คธูลู', sub: 'ผู้หลับใหลแห่งริลลายเอห์', hp: 130, col: '#5b8f6e', boss: true,
              rule: { name: 'ห้วงนิทรา', text: 'ระหว่างที่มันหลับ เครื่องรางแบบคูณไม่ทำงาน' }, noMulAsleep: true,
              skill: { name: 'ความฝันและการตื่น', text: 'ช่วงแรกหลับฝัน ส่งความฝันกัดกินสติ พอเลือดต่ำกว่า 75% จะตื่นและเปลี่ยนท่าทั้งหมด' },
              intents: [[P('mad',5)], [P('mad',3), P('blk',10)], [P('atk',9), P('mad',3)]],
              phase2: { at: 0.75, name: 'คธูลูตื่นแล้ว', intents: [[P('atk',14)], [P('freeze',3), P('atk',8)], [P('drain',12)], [P('blk',12), P('str',2)], [P('atk',16), P('mad',3)]] } },
  rat:      { name: 'บราวน์ เจนกิน', sub: 'หนูหน้าคนของแม่มด', hp: 14, col: '#8a6f5c', trait: 'thief',
              intents: [[P('atk',3)], [P('mad',2)], [P('atk',4)]] },
  corpse:   { name: 'ศพคืนชีพ', sub: 'ผลงานของหมอเวสต์', hp: 26, col: '#7f8a6a', trait: 'harden',
              intents: [[P('atk',5)], [P('atk',5)], [P('drain',4)]] },
  ghast:    { name: 'แกสต์', sub: 'สัตว์กระโดดในหุบเหวมืด', hp: 30, col: '#8c6b6b', trait: 'enrage',
              intents: [[P('atk',7)], [P('daze',1), P('atk',3)], [P('atk',8)]] },
  shantak:  { name: 'ชานแท็ก', sub: 'นกยักษ์เกล็ดลื่น', hp: 20, col: '#6f7c8f', trait: 'vengeful',
              intents: [[P('atk',4)], [P('freeze',1)], [P('atk',5)]] },
  leng:     { name: 'ชาวเลง', sub: 'พ่อค้าสวมผ้าโพกจากที่ราบสูง', hp: 28, col: '#8b6a8f', trait: 'thief',
              intents: [[P('atk',5)], [P('mad',3)], [P('blk',5), P('atk',3)]] },
  moonbeast:{ name: 'อสูรจันทรา', sub: 'ก้อนเนื้อไร้หน้าจากดวงจันทร์', hp: 42, col: '#9a8fa8', trait: 'grow',
              intents: [[P('atk',7)], [P('drain',6)], [P('freeze',2)], [P('atk',9)]] },
  penguin:  { name: 'เพนกวินเผือกตาบอด', sub: 'ฝูงนกใต้ดินตัวเท่าคน', hp: 22, col: '#b8c2c6', trait: 'hide',
              intents: [[P('atk',4)], [P('atk',4)], [P('blk',4)]] },
  polyp:    { name: 'โพลิปบิน', sub: 'ล่องหนครึ่งหนึ่ง มาพร้อมเสียงลมหวีด', hp: 50, col: '#7d8fa0', trait: 'hide',
              intents: [[P('atk',9)], [P('daze',1), P('atk',5)], [P('mad',4)], [P('atk',11)]] },
  hydra:    { name: 'แม่ไฮดรา', sub: 'มารดาแห่งดีพวัน', hp: 48, col: '#3d7f86', trait: 'thorns',
              intents: [[P('atk',8)], [P('drain',6)], [P('blk',8), P('mad',2)], [P('atk',10)]] },
  dunwich:  { name: 'สิ่งจากดันวิช', sub: 'ฝาแฝดที่มองไม่เห็น', hp: 65, col: '#6d7a4f', trait: 'grow',
              intents: [[P('atk',11)], [P('blk',10)], [P('freeze',2), P('atk',6)], [P('drain',8)]] },
  // --- Carcosa (The King in Yellow, R. W. Chambers, public domain) ---
  mask:     { name: 'นักเต้นหน้ากากซีด', sub: 'ไม่มีใครเห็นใบหน้าใต้หน้ากาก', hp: 26, col: '#c9b25a', trait: 'thorns',
              intents: [[P('atk',5)], [P('mad',3)], [P('atk',6)]] },
  actor:    { name: 'นักแสดงบทละครต้องห้าม', sub: 'ผู้อ่านองก์ที่สองจนจบ', hp: 24, col: '#b89a4a', trait: 'vengeful',
              intents: [[P('daze',1), P('mad',2)], [P('atk',6)], [P('atk',4)]] },
  ysign:    { name: 'ผู้ถือสัญลักษณ์สีเหลือง', sub: 'เห็นสัญลักษณ์แล้วลืมไม่ได้', hp: 34, col: '#d4b53c', trait: 'harden',
              intents: [[P('mad',4)], [P('atk',7)], [P('blk',6), P('mad',2)]] },
  hali:     { name: 'เงาแห่งทะเลสาบฮาลี', sub: 'ลอยขึ้นจากน้ำที่ไม่มีคลื่น', hp: 46, col: '#8aa0a8', trait: 'thorns',
              intents: [[P('drain',7)], [P('freeze',2), P('mad',2)], [P('atk',10)]] },
  hastur:   { name: 'ฮัสเทอร์', sub: 'นามที่ถูกเอ่ยในบทละครราชาสีเหลือง', hp: 120, col: '#e0c040', boss: true,
              rule: { name: 'ราชาผู้ไม่มีใบหน้า', text: 'หน้าคืนสติให้ผลแค่ครึ่งเดียว' }, halfSan: true,
              skill: { name: 'สัญลักษณ์สีเหลือง', text: 'ทุกเทิร์นกัดกินสติคุณเพิ่มอีก 1 ไม่ว่าจะทำท่าอะไร' }, aura: 1,
              intents: [[P('mad',4)], [P('atk',10)], [P('daze',1), P('atk',7)], [P('blk',12), P('str',2)], [P('atk',14)]] },
  // --- The black woods (Shub-Niggurath) ---
  whip:     { name: 'ฝูงนกวิปเปอร์วิล', sub: 'รอจับวิญญาณคนใกล้ตาย', hp: 22, col: '#7d8a6a', trait: 'thief',
              intents: [[P('atk',4)], [P('drain',4)], [P('atk',5)]] },
  druid:    { name: 'ผู้บูชาในวงหิน', sub: 'ร่ายเพลงหน้าแท่นบูชา', hp: 26, col: '#6f7f4f', trait: 'dread',
              intents: [[P('blk',6)], [P('mad',3)], [P('atk',6)]] },
  witch:    { name: 'แม่มดเคซายา', sub: 'เดินทะลุมุมห้องที่ผิดเรขาคณิต', hp: 34, col: '#7a5a8a', trait: 'vengeful',
              intents: [[P('freeze',1), P('atk',4)], [P('mad',3)], [P('drain',6)]] },
  child:    { name: 'ลูกแห่งพงไพร', sub: 'หนึ่งในลูกพันตัวของแพะดำ', hp: 50, col: '#4f6a3a', trait: 'bleed',
              intents: [[P('atk',9)], [P('atk',6), P('daze',1)], [P('blk',10)], [P('atk',11)]] },
  brood:    { name: 'ฝูงลูกพันตัว', sub: 'นับไม่ถ้วน และหิวตลอดเวลา', hp: 58, col: '#5d7a3f', trait: 'grow',
              intents: [[P('atk',7)], [P('drain',8)], [P('atk',7), P('mad',2)], [P('atk',12)]] },
  shub:     { name: 'ชับ-นิกกูรัธ', sub: 'แพะดำแห่งพงไพรกับลูกพันตัว', hp: 130, col: '#3f5a2f', boss: true,
              rule: { name: 'พงไพรกลืนกิน', text: 'ทุกเทิร์นเครื่องราง 1 ชิ้นถูกปิดแบบสุ่ม' }, relicOff: 1,
              skill: { name: 'ความอุดมสมบูรณ์', text: 'ฟื้นเลือด {regen} ทุกต้นเทิร์นของมัน พิษช่วยหักล้างได้' }, regen: 4,
              intents: [[P('atk',10)], [P('drain',10)], [P('freeze',2), P('atk',6)], [P('mad',4), P('blk',10)], [P('atk',15)]] },
  // --- Dunwich (Yog-Sothoth) ---
  whateley: { name: 'ตระกูลวอทลีย์', sub: 'ชาวไร่บนเนินเขาที่ไม่มีใครคบ', hp: 26, col: '#8a7a5a', trait: 'thief',
              intents: [[P('atk',5)], [P('blk',5), P('atk',3)], [P('mad',2)]] },
  wilbur:   { name: 'วิลเบอร์ วอทลีย์', sub: 'โตเร็วผิดมนุษย์ ตามหาหนังสือต้องห้าม', hp: 40, col: '#7a6a4a', trait: 'enrage',
              intents: [[P('atk',8)], [P('mad',4)], [P('freeze',1), P('atk',6)], [P('drain',6)]] },
  colourFoe:{ name: 'สีจากนอกโลก', sub: 'ดูดชีวิตทุกสิ่งในหุบเขา', hp: 44, col: '#b07ad6', trait: 'thorns',
              intents: [[P('drain',8)], [P('mad',4)], [P('drain',6), P('daze',1)]] },
  yog:      { name: 'ยอก-โซโธธ', sub: 'ประตูและกุญแจแห่งกาลเวลา', hp: 140, col: '#c9a0e0', boss: true,
              rule: { name: 'กุญแจและประตู', text: 'ล็อกเต๋าไม่ได้ ทอยใหม่คือทอยทุกลูก' }, noHold: true,
              skill: { name: 'ประตูมิติ', text: 'ทุกเทิร์นส่งเต๋าของคุณ 1 ลูกไปมิติอื่น ลูกนั้นใช้ไม่ได้เทิร์นนั้น' }, banish: 1,
              intents: [[P('atk',11)], [P('mad',3)], [P('freeze',2), P('atk',8)], [P('drain',12)], [P('blk',14), P('str',3)], [P('atk',17)]] },
  // --- Secret: the centre of the universe ---
  piper:    { name: 'นักเป่าขลุ่ยไร้สติ', sub: 'เทพรองผู้กล่อมเทพตาบอดไม่ให้ตื่น', hp: 60, col: '#a08ac0', trait: 'dread',
              intents: [[P('mad',4)], [P('daze',1), P('atk',8)], [P('atk',12)], [P('blk',12)]] },
  drummer:  { name: 'ผู้ตีกลองอันบ้าคลั่ง', sub: 'จังหวะที่ไม่มีวันหยุด', hp: 70, col: '#8a6ab0', trait: 'grow',
              intents: [[P('atk',10)], [P('mad',5)], [P('freeze',2), P('atk',8)]] },
  azathoth: { name: 'อาซาทอธ', sub: 'เทพตาบอดไร้สติ ณ ใจกลางจักรวาล', hp: 150, col: '#e070c0', boss: true,
              rule: { name: 'ไร้ระเบียบ', text: 'เครื่องรางทุกชิ้นทำงานในลำดับสุ่ม และ 1 ชิ้นถูกปิด' }, relicOff: 1, shuffleRelics: true,
              skill: { name: 'ความโกลาหลดึกดำบรรพ์', text: 'ไม่มีใครรู้ว่ามันจะทำอะไร ทุกเทิร์นหน้าเต๋า 2 ลูกของคุณถูกสุ่มเป็นหน้าอะไรก็ได้ การโจมตีทำได้แค่ครึ่ง แต่หน้าคืนสติจะกล่อมมันให้หลับลงเป็น 2 เท่า มันค่อย ๆ ตื่นขึ้นทุกเทิร์น' },
              hideAll: true, randomIntent: true, chaos: 2, lull: true, regen: 5, meter: 'ความตื่น',
              intents: [[P('atk',12)], [P('mad',5)], [P('drain',10)], [P('freeze',2), P('atk',8)], [P('atk',16)], [P('mad',4), P('daze',1)]] },
};

// hpMul / atkAdd scale every foe in the chapter; each stage adds +7% hp.
// pool: foes the player picks from before each normal stage (1 = easy, 2 = normal, 3 = dangerous)
var CHAPTERS = [
  { id: 'tut', name: 'บทฝึก', place: 'ห้องสมุดมิสกาโทนิก', tut: true, level: 0,
    blurb: 'เรียนวิธีเล่นทีละขั้น 3 ด่าน',
    foes: ['zoog', 'cultist', 'ghoul'], hpMul: .8, atkAdd: -1,
    tiers: [[1], [1], [1]] },
  { id: 'c1', name: 'บทที่ 1', place: 'สุสานใต้ดินอาร์คัม', level: 1,
    blurb: 'กูลกับลัทธิใต้เมือง จุดเริ่มต้นของผู้ทำพิธี',
    pool: { 1: ['zoog', 'cultist'], 2: ['cultist', 'corpse', 'ghoul'], 3: ['ghast', 'ghoulPack'] }, boss: 'ghoulKing', hpMul: 1.62, bossHp: 2.23, atkMul: 1.1, atkAdd: 0,
    tiers: [[1], [1], [1], [1], [1]] },
  { id: 'c2', name: 'บทที่ 2', place: 'เมืองท่าอินส์มัธ', level: 2,
    blurb: 'ชาวเมืองครึ่งปลาและพระบิดาใต้ทะเล ระวังเต๋าโดนตรึง',
    pool: { 1: ['hybrid', 'corpse'], 2: ['deep', 'hybrid', 'ghoul'], 3: ['deepElite', 'ghast'] }, boss: 'dagon', hpMul: 3.67, bossHp: 0.51, atkMul: 2.23, atkAdd: 0,
    tiers: [[1], [1], [1, 2], [1, 2], [1, 2]] },
  { id: 'c3', name: 'บทที่ 3', place: 'ดินแดนแห่งความฝัน', level: 3,
    blurb: 'ฝันร้ายที่ทั้งตรึงและกัดกินสติ ผู้ส่งสารรออยู่ปลายทาง',
    pool: { 1: ['shantak', 'leng'], 2: ['gaunt', 'spider', 'gug'], 3: ['moonbeast', 'gug'] }, boss: 'nyar', hpMul: 3.08, bossHp: 0.51, atkMul: 3.44, atkAdd: 0,
    tiers: [[1, 2], [1, 2], [1, 2], [2], [2, 3]] },
  { id: 'c4', name: 'บทที่ 4', place: 'ภูเขาแห่งความบ้าคลั่ง', level: 4,
    blurb: 'เมืองโบราณใต้น้ำแข็งที่ยังไม่ตายสนิท',
    pool: { 1: ['penguin', 'shantak'], 2: ['elder', 'migo', 'leng'], 3: ['shog', 'polyp'] }, boss: 'shogKing', hpMul: 3.38, bossHp: 0.81, atkMul: 2.98, atkAdd: 0,
    tiers: [[1, 2], [2], [2, 3], [2, 3], [2, 3]] },
  { id: 'c5', name: 'บทที่ 5', place: 'ริลลายเอห์ นครจมสมุทร', level: 5,
    blurb: 'นครที่โผล่ขึ้นจากทะเล ผู้หลับใหลกำลังจะตื่น',
    pool: { 1: ['deep', 'hybrid'], 2: ['deepElite', 'hydra', 'moonbeast'], 3: ['spawn', 'polyp', 'dunwich'] }, boss: 'cthulhu', hpMul: 4.85, bossHp: 0.51, atkMul: 4.41, atkAdd: 0,
    tiers: [[2], [2, 3], [2, 3], [3], [2, 3]] },
  { id: 'c6', name: 'บทที่ 6', place: 'คาร์โคซา เมืองริมทะเลสาบฮาลี', level: 6,
    blurb: 'บทละครที่อ่านจบแล้วเสียสติ ราชาสีเหลืองรอดูคุณอยู่',
    pool: { 1: ['mask', 'actor'], 2: ['ysign', 'hali', 'leng'], 3: ['moonbeast', 'hali'] }, boss: 'hastur', hpMul: 11.57, bossHp: 0.59, atkMul: 4.24, atkAdd: 0,
    tiers: [[2], [2, 3], [2, 3], [3], [2, 3]] },
  { id: 'c7', name: 'บทที่ 7', place: 'ป่าดำแห่งแพะดำ', level: 7,
    blurb: 'ป่าที่ไม่มีนกร้อง ลูกพันตัวของมารดาอยู่ทุกหนแห่ง',
    pool: { 1: ['whip', 'druid'], 2: ['witch', 'ghast', 'child'], 3: ['brood', 'child'] }, boss: 'shub', hpMul: 14.8, bossHp: 0.51, atkMul: 3.09, atkAdd: 0,
    tiers: [[2], [2, 3], [2, 3], [3], [2, 3]] },
  { id: 'c8', name: 'บทที่ 8', place: 'เนินเขาดันวิช', level: 8,
    blurb: 'ประตูกำลังจะเปิด ยอก-โซโธธคือประตู คือกุญแจ คือผู้เฝ้าประตู',
    pool: { 1: ['whateley', 'whip'], 2: ['wilbur', 'colourFoe', 'polyp'], 3: ['dunwich', 'brood'] }, boss: 'yog', hpMul: 12.16, bossHp: 0.51, atkMul: 2.8, atkAdd: 0,
    tiers: [[2, 3], [2, 3], [3], [3], [3]] },
  { id: 'az', name: 'บทลับ', place: 'ใจกลางจักรวาล', level: 9, secret: true,
    blurb: 'เสียงขลุ่ยเพี้ยนกล่อมเทพตาบอดให้หลับ ถ้ามันตื่น ทุกอย่างจะจบ',
    pool: { 1: ['piper'], 2: ['piper', 'drummer'], 3: ['drummer'] }, boss: 'azathoth', hpMul: 10, bossHp: 0.7, atkMul: 3, atkAdd: 0,
    tiers: [[3], [3], [3], [3], [3]] },
];

// ===== Enemy traits (passives for normal foes). v scales with chapter level. =====
var TRAITS = {
  thorns:  { name: 'หนามพิษ', v: function (c) { return 2 + Math.floor(c.L / 3); }, text: 'ทุกครั้งที่คุณโจมตีเข้าเนื้อ คุณเสียเลือด {v}' },
  enrage:  { name: 'คลั่งเลือด', v: function () { return 50; }, text: 'เลือดต่ำกว่าครึ่งเมื่อไร ตีแรงขึ้น {v}%' },
  harden:  { name: 'เปลือกแข็ง', v: function (c) { return Math.max(3, Math.round(c.maxHp * 0.12)); }, text: 'จบเทิร์นของมัน ตั้งโล่เพิ่ม {v} เสมอ' },
  thief:   { name: 'มือไว', v: function (c) { return 2 + Math.floor(c.L / 3); }, text: 'ตีเข้าเลือดคุณเมื่อไร ขโมยเงิน {v}' },
  bleed:   { name: 'เขี้ยวฉีก', v: function (c) { return 2 + Math.floor(c.L / 2); }, text: 'ตีเข้าเลือดคุณแล้วเลือดไหล +{v} (ต้นเทิร์นคุณเสียเลือดเท่านั้น แล้วลด 1)' },
  grow:    { name: 'โตไม่หยุด', v: function (c) { return Math.max(1, Math.round(1.5 * c.atkMul)); }, text: 'จบเทิร์นของมัน พลัง +{v} ทุกครั้ง ยิ่งช้ายิ่งแย่' },
  dread:   { name: 'ความหลอน', v: function () { return 1; }, text: 'จบเทิร์นของมัน สติคุณ −{v}' },
  hide:    { name: 'หนังหนา', v: function (c) { return 4 + Math.floor(c.L / 2); }, text: 'หน้าโจมตีที่แรงไม่ถึง {v} ทำความเสียหายแค่ครึ่ง' },
  vengeful:{ name: 'แค้นฝังใจ', v: function (c) { return Math.max(2, Math.round(2.5 * c.atkMul)); }, text: 'เทิร์นไหนคุณไม่โจมตี มันพลัง +{v}' },
};
// c = { L: chapter level, maxHp: this foe's max hp, atkMul: chapter attack multiplier }
function traitOf(key, c) {
  var t = FOES[key] && FOES[key].trait && TRAITS[FOES[key].trait]; if (!t) return null;
  var v = t.v(c || { L: 0, maxHp: 30, atkMul: 1 });
  return { key: FOES[key].trait, name: t.name, v: v, text: t.text.replace('{v}', v) };
}
// enemy numbers scale per chapter: attacks multiply (keeps big hits big), block follows hp scaling
function scaleFoePart(p, ch, curseAtk, hpScale) {
  var m = ch.atkMul || 1;
  if (p.t === 'atk' || p.t === 'drain') return { t: p.t, v: Math.max(1, Math.round(p.v * m) + (ch.atkAdd || 0) + (curseAtk || 0)) };
  if (p.t === 'str') return { t: p.t, v: Math.max(1, Math.round(p.v * m)) };
  if (p.t === 'blk') return { t: p.t, v: Math.max(1, Math.round(p.v * Math.max(1, (hpScale || ch.hpMul) * 0.8))) };
  return { t: p.t, v: p.v };
}

// ===== Monster skills (passive, automatic). Shared by game and bot. =====
// bonus(face, ctx, r, rolls) -> extra value for this die's face
// after(face, s) -> add side effects to totals after combos
var isAtk = function (f) { return f.t === 'atk'; };
var SKILLS = {
  ghoul:  { name: 'กินซาก', text: 'ถ้าศัตรูเลือดต่ำกว่าครึ่ง หน้าโจมตีของลูกนี้ +3',
            bonus: function (f, c) { return isAtk(f) && c.eHp < 0.5 ? 3 : 0; } },
  deep:   { name: 'เกล็ดทะเล', text: 'ถ้าออกโล่ ฟื้นเลือด 2 ด้วย',
            after: function (f, s) { if (f.t === 'blk') { s.heal += 2; return '+2 เลือด'; } } },
  gaunt:  { name: 'กรงเล็บรัตติกาล', text: 'ถ้าศัตรูกำลังอ่อนแรง หน้าโจมตีของลูกนี้ ×2',
            bonus: function (f, c) { return isAtk(f) && c.eWeak > 0 ? f.v : 0; } },
  migo:   { name: 'พิษเรื้อรัง', text: 'ถ้ามีมิโกในถุง พิษบนศัตรูไม่ลดลงทุกเทิร์น', poisonStay: true },
  spider: { name: 'ใยพันธนาการ', text: 'ถ้าศัตรูมีพิษอยู่ หน้าโจมตีของลูกนี้ +3',
            bonus: function (f, c) { return isAtk(f) && c.ePoison > 0 ? 3 : 0; } },
  elder:  { name: 'ผู้สร้างโบราณ', text: 'ถ้าออกโล่ ได้สติ +1 ด้วย',
            after: function (f, s) { if (f.t === 'blk') { s.san += 1; return '+1 สติ'; } } },
  yith:   { name: 'ข้ามกาลเวลา', text: 'เมื่อทอยใหม่ ลูกนี้เก็บหน้าที่ดีกว่าระหว่างหน้าเดิมกับหน้าใหม่ให้เอง', keepBetter: true },
  shog:   { name: 'ยิ่งบ้ายิ่งแรง', text: 'หน้าโจมตีของลูกนี้ +1 ทุกสติที่หายไป 3 แต้ม',
            bonus: function (f, c) { return isAtk(f) ? Math.floor((c.maxSan - c.san) / 3) : 0; } },
  colour: { name: 'ดูดสี', text: 'หน้าโจมตีของลูกนี้ +3 ต่อเต๋าลูกอื่นที่ออกหน้าว่างหรือเสียสติ',
            bonus: function (f, c, r, rolls) { return isAtk(f) ? 3 * rolls.filter(function (o) { return o !== r && (o.face.t === 'none' || o.face.t === 'mad'); }).length : 0; } },
  cat:    { name: 'เก้าชีวิต', text: 'ไม่มีวันถูกตรึง และไม่บิดเบือนตอนสติต่ำ', noFreeze: true, noDistort: true },
  ghast:  { name: 'จู่โจม', text: 'ถ้าออกโจมตีตั้งแต่ทอยแรก (ไม่ได้ทอยใหม่) +3',
            bonus: function (f, c, r) { return isAtk(f) && r.fresh ? 3 : 0; } },
  moon:   { name: 'แปรผัน', text: 'ถ้าหน้าที่ออกไม่ซ้ำกับลูกอื่นเลย +3',
            bonus: function (f, c, r, rolls) { return f.t !== 'none' && f.t !== 'mad' && !rolls.some(function (o) { return o !== r && o.face.t === f.t; }) ? 3 : 0; } },
  polyp:  { name: 'พายุล่องหน', text: 'ถ้าออกอ่อนแรง ตีศัตรู 6 ด้วย',
            after: function (f, s) { if (f.t === 'weak') { s.atk += 6; return '+6 โจมตี'; } } },
};
var COMBO_TYPES = ['atk', 'blk', 'heal', 'san', 'poison'];
var COMBO_MULT = { 1: 1.5, 2: 2, 3: 3 };
var COMBO_NAME = { 1: 'คอมโบ', 2: 'คอมโบใหญ่', 3: 'แจ็กพอตแห่งห้วงลึก' };
// ===== Meta progression (between runs) =====
var LOCKED_START = ['cat', 'yith', 'moon', 'colour'];
var META_SHOP = [
  { id: 'd:cat', kind: 'die', die: 'cat', cost: 20, name: 'แมวแห่งอุลธาร์', text: 'เพิ่มแมวเข้ากลุ่มอสูรที่อาจโผล่ให้อัญเชิญ' },
  { id: 'd:yith', kind: 'die', die: 'yith', cost: 30, name: 'เผ่ายิธ', text: 'เพิ่มเผ่ายิธเข้ากลุ่มอสูรที่อาจโผล่ให้อัญเชิญ' },
  { id: 'd:moon', kind: 'die', die: 'moon', cost: 30, name: 'อสูรจันทรา', text: 'เพิ่มอสูรจันทราเข้ากลุ่มอสูรที่อาจโผล่ให้อัญเชิญ' },
  { id: 'd:colour', kind: 'die', die: 'colour', cost: 60, name: 'สีจากนอกโลก', text: 'เพิ่มสีจากนอกโลกเข้ากลุ่มอสูรระดับ 3' },
  { id: 'b:ghoul', kind: 'bag', cost: 25, name: 'ถุงนักล่าซากศพ', text: 'เริ่มด้วยกูล 1 ตัวแทนผู้ทำพิธี (โล่) 1 ลูก', bag: ['cultA', 'cultA', 'cultB', 'ghoul'] },
  { id: 'b:deep', kind: 'bag', cost: 25, name: 'ถุงผู้รอดจากอินส์มัธ', text: 'เริ่มด้วยดีพวัน 1 ตัวแทนผู้ทำพิธี (ดาบ) 1 ลูก', bag: ['cultA', 'cultB', 'cultB', 'deep'] },
  { id: 'b:elder', kind: 'bag', cost: 45, name: 'ถุงนักวิชาการ', text: 'เริ่มด้วยเอลเดอร์ธิงกับผู้ทำพิธี 3 ลูก', bag: ['cultA', 'cultA', 'cultB', 'elder'] },
  { id: 'u:hp1', kind: 'up', cost: 15, name: 'ร่างกายแกร่ง I', text: 'เลือดสูงสุด +5 ทุกการเดินทาง', hp: 5 },
  { id: 'u:hp2', kind: 'up', cost: 30, name: 'ร่างกายแกร่ง II', text: 'เลือดสูงสุด +5 อีก', hp: 5, need: 'u:hp1' },
  { id: 'u:san1', kind: 'up', cost: 20, name: 'จิตใจมั่นคง I', text: 'สติสูงสุด +2 ทุกการเดินทาง', san: 2 },
  { id: 'u:san2', kind: 'up', cost: 40, name: 'จิตใจมั่นคง II', text: 'สติสูงสุด +2 อีก', san: 2, need: 'u:san1' },
];
var CURSES = [
  { name: 'ไม่มีคำสาป', text: 'การเดินทางปกติ' },
  { name: 'คำสาประดับ 1', text: 'ศัตรูเลือด +10% · ได้เศษความทรงจำ +25%' },
  { name: 'คำสาประดับ 2', text: 'ศัตรูเลือด +20% ตี +1 · เศษ +50%' },
  { name: 'คำสาประดับ 3', text: 'ศัตรูเลือด +30% ตี +1 · พักฟื้นได้น้อยลง · เศษ +75%' },
  { name: 'คำสาประดับ 4', text: 'ศัตรูเลือด +40% ตี +2 · พักฟื้นได้น้อยลง · เศษ +100%' },
  { name: 'คำสาประดับ 5', text: 'ศัตรูเลือด +50% ตี +2 · พักฟื้นน้อยลง · เริ่มด้วยสติ 15 · เศษ +125%' },
];
function curseMod(c) { return { hp: 1 + 0.1 * c, atk: c >= 4 ? 2 : c >= 2 ? 1 : 0, rest: c >= 3 ? 8 : 12, san: c >= 5 ? 15 : null, shards: 1 + 0.25 * c }; }
function faceScore(f) { return f.t === 'mad' ? -2 * f.v : f.t === 'none' ? 0 : f.v; }
// rolls: [{id, face, fresh}], ctx: {eHp (0..1), ePoison, eWeak, san, maxSan}
function computeTally(rolls, ctx) {
  var s = { atk: 0, blk: 0, heal: 0, san: 0, poison: 0, weak: 0, mad: 0 }, cnt = {};
  rolls.forEach(function (r) {
    var sk = SKILLS[r.id], b = sk && sk.bonus ? sk.bonus(r.face, ctx, r, rolls) : 0;
    r.bonus = b;
    var v = r.face.v + b;
    if (ctx.armor && r.face.t === 'atk' && v < ctx.armor) { r.armored = true; v = Math.floor(v / 2); } else r.armored = false;
    if (r.banished) return;
    if (r.face.t !== 'none') { s[r.face.t] += v; cnt[r.face.t] = (cnt[r.face.t] || 0) + 1; }
  });
  var cmin = ctx.comboMin || 3;
  var combos = COMBO_TYPES.filter(function (k) { return (cnt[k] || 0) >= cmin; }), lv = {};
  combos.forEach(function (k) { var n = cnt[k] - (cmin - 3); lv[k] = n >= 5 ? 3 : n === 4 ? 2 : 1; s[k] = Math.floor(s[k] * COMBO_MULT[lv[k]]); });
  rolls.forEach(function (r) { var sk = SKILLS[r.id]; r.skTag = r.bonus > 0 && !r.banished ? '+' + r.bonus : null; if (sk && sk.after && !r.banished) { var t = sk.after(r.face, s); if (t) r.skTag = t; } });
  if (ctx.lull) { s.lull = 2 * s.san; s.atk = Math.floor(s.atk / 2) + s.lull; }
  return { s: s, combos: combos, lv: lv, cnt: cnt };
}
function bagHas(dice, flag) { return dice.some(function (id) { return SKILLS[id] && SKILLS[id][flag]; }); }

if (typeof module !== 'undefined') module.exports = { scaleFoePart: scaleFoePart, TRAITS: TRAITS, traitOf: traitOf, DICE: DICE, FOES: FOES, CHAPTERS: CHAPTERS, F: F, SKILLS: SKILLS, computeTally: computeTally, bagHas: bagHas, faceScore: faceScore, LOCKED_START: LOCKED_START, COMBO_MULT: COMBO_MULT, curseMod: curseMod };
