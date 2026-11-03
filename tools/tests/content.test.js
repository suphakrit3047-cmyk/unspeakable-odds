const { JSDOM } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync(require('path').join(__dirname, '../../dist/game-single.html'), 'utf8');
const errs = [];
const dom = new JSDOM('<!doctype html><body>' + html + '</body>', {
  runScripts: 'dangerously',
  url: 'https://x.test/',
  beforeParse(w) {
    w.scrollTo = () => {};
    w.__Q = [];
    w.setTimeout = f => {
      w.__Q.push(f);
      return 0;
    };
    w.clearTimeout = () => {};
    w.addEventListener('error', e => errs.push(e.message));
  },
});
const w = dom.window,
  q = s => w.document.querySelector(s),
  run = () => {
    let g = 0;
    while (w.__Q.length && g++ < 500) w.__Q.shift()();
  },
  E = x => w.eval(x);
q('#b-run').click();
run();
while (!q('#s-page').hidden) {
  q('#pg-next').click();
  run();
}
// every event, every option
const evs = E('EVENTS.map(e=>e.id)');
let n = 0;
for (const id of evs) {
  const k = E(`EVENTS.find(e=>e.id==='${id}').opts.length`);
  for (let i = 0; i < k; i++) {
    E(
      `run.hp=40;run.maxHp=50;run.san=15;run.maxSan=20;run.coins=20;run.dice=['cultA','cultA','ghoul','migo'];run.relics=[];run.ups={}; run.event={id:'${id}',done:null}; showEvent()`
    );
    const b = q(`[data-ev="${i}"]`);
    if (b.disabled) {
      continue;
    }
    b.click();
    run();
    n++;
    const res = q('#ev-result').textContent;
    if (!res || res.includes('undefined')) console.log('BAD', id, i, res);
  }
}
console.log('event options run', n);
// shop specials
for (const k of E('Object.keys(SPECIALS)')) {
  E(
    `run.coins=30; run.dice=['cultA','ghoul','migo']; run.relics=[]; run.maxHp=50; run.shop=null; showRunShop(); run.shop.sp=[{k:'${k}',sold:false}]; showRunShop()`
  );
  q('[data-sp="0"]').click();
  console.log(
    k,
    'coins',
    E('run.coins'),
    'slot',
    E('relicMax(run)'),
    'relics',
    E('run.relics.length'),
    'dice',
    E('run.dice.length'),
    'maxHp',
    E('run.maxHp'),
    '|',
    q('#rs-special').textContent.replace(/\s+/g, ' ').slice(0, 90)
  );
}
E("run.relics=[{id:'key',n:0}]; run.shop=null; showRunShop()");
console.log('key price pot', q('[data-pot]').textContent);
q('[data-rel="cultA"]') && console.log('release disabled (3 dice)', q('[data-rel="cultA"]').disabled);
// all relics fire without error
E(
  "run.ci=RUN_ORDER[2]; run.ch=CHAPTERS[run.ci]; run.stage=0; run.rank=3; run.relics=Object.keys(RELICS).slice(-17).slice(0,6).map(id=>({id,n:0})); run.dice=['cultA','ghoul','migo','spider','gaunt','cat']; run.hp=20; startBattle('ghoul')"
);
run();
for (let t = 0; t < 3; t++) {
  E('run.hp=40');
  q('#b-resolve').click();
  run();
}
E(
  'run.relics=Object.keys(RELICS).slice(-11).slice(0,6).map(id=>({id,n:0})); battle.e.hp=battle.e.maxHp; battle.e.poison=3'
);
for (let t = 0; t < 3; t++) {
  E('run.hp=20; run.san=15');
  q('#b-resolve').click();
  run();
}
console.log('log', E('battle.log.slice(0,2).join(" | ")'));
console.log('errors', errs);
if (errs.length) {
  console.error('FAIL: page errors');
  process.exit(1);
}
