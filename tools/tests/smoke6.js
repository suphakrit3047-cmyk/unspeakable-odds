const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'../../dist/game-single.html'),'utf8');
const errs=[];
const dom=new JSDOM('<!doctype html><body>'+html+'</body>',{runScripts:'dangerously',url:'https://x.test/',beforeParse(w){ w.scrollTo=()=>{}; w.__Q=[]; w.setTimeout=f=>{w.__Q.push(f);return 0}; w.clearTimeout=()=>{}; w.addEventListener('error',e=>errs.push(e.message)); }});
const w=dom.window, q=s=>w.document.querySelector(s), run=()=>{let g=0;while(w.__Q.length&&g++<500)w.__Q.shift()();}, E=x=>w.eval(x);
q('#b-run').click(); run(); while(!q('#s-page').hidden){q('#pg-next').click();run();}
// choose: primary follows peek
const prim=()=>[...w.document.querySelectorAll('.arch-go')].map(b=>b.classList.contains('primary')?1:0).join('');
console.log('primary initial',prim()); w.document.querySelector('[data-peek="0"]').click(); console.log('after peek 0',prim(),'| trait in detail:',q('#c-detail .btrait')&&q('#c-detail .btrait').textContent);
// event coach
E("run.stage=1; run.event=null; showEvent()"); console.log('event coach visible',!q('#ev-coach').hidden); q('#ev-coach [data-tipok]').click(); console.log('event coach after ok hidden',q('#ev-coach').hidden);
// shop coach + upgrades + potion
E("run.coins=40; run.hp=20; run.shop=null; showRunShop()"); console.log('shop coach visible',!q('#rs-coach').hidden); q('#rs-coach [data-tipok]').click(); console.log('shop coach hidden',q('#rs-coach').hidden);
q('[data-up="cultA"]').click(); console.log('ups',E('JSON.stringify(run.ups)'),'coins',E('run.coins'),'pips on',w.document.querySelectorAll('.up-pips i.on').length);
q('[data-pot]').click(); console.log('hp after potion',E('run.hp'),'coins',E('run.coins'));
console.log('upgraded face in card:',E("upFace(DICE.cultA.faces[0],'cultA').v"), 'base', E('DICE.cultA.faces[0].v'));
// battle with traits
for (const key of ['ghoul','spider','corpse','zoog','gaunt','moonbeast','ghast']) {
  E(`run.ci=RUN_ORDER[2]; run.ch=CHAPTERS[run.ci]; run.stage=0; run.rank=2; run.hp=run.maxHp=60; run.san=20; run.coins=10; startBattle('${key}')`); run();
  const tr=E('JSON.stringify(battle.e.trait)');
  // force enemy to attack and player to attack
  E("battle.e.ii=battle.e.intents.findIndex(it=>it.some(p=>p.t==='atk'))"); E("battle.rolls.forEach(r=>r.face={t:'atk',v:3})");
  const hp0=E('run.hp'), c0=E('run.coins'), b0=E('battle.e.block'), s0=E('battle.e.str'), san0=E('run.san');
  q('#b-resolve').click(); run();
  console.log(key, tr, '| hp', hp0,'->',E('run.hp'),'coins',c0,'->',E('run.coins'),'eblock',b0,'->',E('battle.e.block'),'str',s0,'->',E('battle.e.str'),'bleed',E('battle.bleed'),'san',san0,'->',E('run.san'));
}
// boss skill text filled
E("run.ci=RUN_ORDER[6]; run.ch=CHAPTERS[run.ci]; run.stage=3; startBattle('shub')"); run(); console.log('shub skill:',E('battle.e.skill.text'),'regen',E('battle.e.regen'),'hp',E('battle.e.maxHp'));
E("run.ci=RUN_ORDER[0]; run.ch=CHAPTERS[run.ci]; run.stage=3; startBattle('ghoulKing')"); run(); console.log('gk skill:',E('battle.e.skill.text'),'hp',E('battle.e.maxHp'), 'intents', E('JSON.stringify(battle.e.intents)'));
// danger telegraph
E("run.hp=10; render(false)"); console.log('danger class',!!q('.intent.danger'));
// skill tags
E("battle.rolls=[{id:'ghast',face:{t:'atk',v:4},fresh:true,held:false},{id:'polyp',face:{t:'weak',v:1},fresh:false,held:false}]; render(false)"); console.log('smark:',[...w.document.querySelectorAll('.smark')].map(x=>x.textContent).join(' | '));
// inter: no boss name
E("run.nextI=RUN_ORDER[1]; interScreen()"); console.log('inter next:',q('#i-next').textContent.replace(/\s+/g,' ').slice(0,140)); console.log('inter text', q('#i-text').textContent);
q('#b-onward').click(); run(); console.log('after onward shop shown',!q('#s-rshop').hidden, q('#rs-eyebrow').textContent);
console.log('errors',errs);
