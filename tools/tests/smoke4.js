const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'../../dist/game-single.html'),'utf8');
const store={};
function mk(){ const errs=[];
 const dom=new JSDOM('<!doctype html><body>'+html+'</body>',{runScripts:'dangerously',url:'https://x.test/',beforeParse(w){
   for(const k in store) w.localStorage.setItem(k,store[k]); w.scrollTo=()=>{}; w.__Q=[]; w.setTimeout=f=>{w.__Q.push(f);return 0}; w.clearTimeout=()=>{}; w.addEventListener('error',e=>errs.push(e.message)); }});
 const w=dom.window;
 return {w,errs,q:s=>w.document.querySelector(s),run:()=>{while(w.__Q.length)w.__Q.shift()();},persist:()=>{for(let i=0;i<w.localStorage.length;i++){const k=w.localStorage.key(i);store[k]=w.localStorage.getItem(k);}}};}
let A=mk(); const {w,q,run}=A;
q('#b-run').click(); run(); while(!q('#s-page').hidden){q('#pg-next').click();run();}
console.log('choose shown:',!q('#s-choose').hidden,'tip:',q('#c-coach').textContent.slice(0,40));
q('[data-tipok]').click(); console.log('tip dismissed:',q('#c-coach').hidden);
q('[data-pick="1"]').click(); run();
console.log('battle shown:',!q('#s-battle').hidden,'path nodes',w.document.querySelectorAll('#path .node').length);
A.persist();
// resume in fresh page
let B=mk(); console.log('B errs',B.errs,'visible:',!B.q('#b-continue').hidden); B.q('#b-continue').click(); B.run();
console.log('resumed battle:',!B.q('#s-battle').hidden, B.w.eval('battle.e.name'));
// god mode through whole run with stars
B.w.eval("stars=Array.from({length:20},(_,i)=>'x-'+i)");
let screens=new Set(), inter=0, guard=0;
while(guard++<3000){ const Q=B.q;
 if(!Q('#s-end').hidden) break;
 if(!Q('#s-page').hidden){ screens.add('page:'+Q('#pg-title').textContent); Q('#pg-next').click(); B.run(); continue;}
 if(!Q('#s-event').hidden){ const o=Q('[data-evgo]')||Q('[data-ev]:not([disabled])'); o.click(); B.run(); screens.add('event'); continue;}
 if(!Q('#s-rshop').hidden){ const b=Q('[data-buyr]:not([disabled])'); if(b){b.click(); screens.add('bought');} else Q('#b-rs-go').click(); B.run(); continue;}
 if(!Q('#s-inter').hidden){inter++; screens.add('inter:'+Q('#i-title').textContent.slice(0,25)); Q('#b-onward').click(); B.run(); continue;}
 if(!Q('#s-choose').hidden){ Q('[data-pick="2"]').click(); B.run(); continue;}
 if(!Q('#s-reward').hidden){ const b=Q('[data-summon]'); if(b){b.click();B.run(); if(Q('[data-drop]')){Q('[data-drop]').click();B.run();}} else Q('[data-skip]').click(); continue;}
 B.w.eval('run.hp=run.maxHp; run.san=run.maxSan; battle.e.hp=Math.min(battle.e.hp,3)'); Q('#b-resolve').click(); B.run();
}
console.log('relics',B.w.eval('JSON.stringify(run.relics)'),'coins',B.w.eval('run.coins'),[...screens].filter(x=>!x.startsWith('inter')).join(','));
console.log('end:',B.q('#e-title').textContent,'| inter screens',inter,[...screens].pop());
console.log('records',B.w.eval('JSON.stringify(REC)'),'errors',A.errs,B.errs);
