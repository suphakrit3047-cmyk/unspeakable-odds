/* ---------- help modal, glossary, button wiring ---------- */
$('#legend').innerHTML = Object.entries(TYPES)
  .map(([t, o]) => `<div>${faceHTML({ t, v: '' }, 'sm')}<span>${o.l}</span></div>`)
  .join('');
$('#glossary').innerHTML = Object.entries(TYPES)
  .map(([t, o]) => `<div>${faceHTML({ t, v: '' }, 'sm')}<span><b>${o.l}</b>${GLOSS[t]}</span></div>`)
  .join('');
$('#glossary-e').innerHTML = Object.entries(EGLOSS)
  .map(
    ([t, [l, d]]) =>
      `<div><span style="color:${ECOL[t]};display:grid;place-items:center">${icon(t)}</span><span><b>${l}</b>${d}</span></div>`
  )
  .join('');
function openHelp() {
  $('#m-dice').innerHTML = run ? run.dice.map(id => dieCard(id)).join('') : '';
  $('#modal').hidden = false;
  $('#b-close').focus();
}
function closeHelp() {
  $('#modal').hidden = true;
}
$('#b-help').onclick = openHelp;
$('#b-close').onclick = () => {
  closeHelp();
  $('#b-help').focus();
};
$('#modal').addEventListener('click', ev => {
  if (ev.target.id === 'modal') closeHelp();
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape') closeHelp();
});

$('#b-tut').onclick = () => startChapter(0);
$('#b-continue').onclick = resumeRun;
$('#b-run').onclick = () => {
  if (load(SAVEKEY, null)) {
    $('#b-run-confirm').hidden = false;
    $('#b-run-confirm').focus();
  } else beginRunFlow();
};
$('#b-run-confirm').onclick = () => {
  store(SAVEKEY, null);
  beginRunFlow();
};
$('#rb-relic').onclick = () => {
  SND.play('ui');
  openBag('relic');
};
$('#rb-bag').onclick = () => {
  SND.play('ui');
  openBag('bag');
};
$('#bm-close').onclick = () => {
  $('#bagmodal').hidden = true;
};
$('#bagmodal').addEventListener('click', ev => {
  if (ev.target.id === 'bagmodal') $('#bagmodal').hidden = true;
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape') $('#bagmodal').hidden = true;
});

$('#b-onward').onclick = () => {
  SND.play('ui');
  onward();
};
$('#b-shop').onclick = renderShop;
$('#shop-back').onclick = () => {
  renderTitle();
  show('title');
};
$('#setup-back').onclick = () => {
  renderTitle();
  show('title');
};
$('#shop-list').addEventListener('click', ev => {
  const b = ev.target.closest('[data-buy]');
  if (b) buy(b.dataset.buy);
});
$('#s-setup').addEventListener('click', ev => {
  const b = ev.target.closest('[data-bag]'),
    c = ev.target.closest('[data-curse]');
  if (b) {
    META.bag = b.dataset.bag;
    metaSave();
    SND.play('ui');
    renderSetup();
  }
  if (c) {
    META.curse = +c.dataset.curse;
    metaSave();
    SND.play('ui');
    renderSetup();
  }
});
$('#b-setup-go').onclick = () => {
  startRun();
};
document.addEventListener(
  'click',
  ev => {
    SND.unlock();
    if (ev.target.closest('.sndbtn')) {
      SND.toggle();
      if (SND.on) SND.play('ui');
      paintSound();
    }
  },
  true
);
document.addEventListener(
  'pointerdown',
  () => {
    SND.unlock();
  },
  { once: false, passive: true }
);
$('#b-codex').onclick = () => openCodex('title');
$('#b-help-codex').onclick = () => {
  const cur = ['choose', 'battle', 'reward', 'inter', 'chapters', 'end'].find(id => !$('#s-' + id).hidden) || 'title';
  openCodex(cur);
};
$('#cx-back').onclick = () => {
  if (cxReturn === 'title') renderTitle();
  show(cxReturn);
  if (cxReturn === 'battle') render(false);
};
$('#cx-tabs').addEventListener('click', ev => {
  const b = ev.target.closest('[data-tab]');
  if (!b) return;
  cxTab = b.dataset.tab;
  renderCodexList();
});
$('#s-codex').addEventListener('click', ev => {
  const pg = ev.target.closest('[data-page]');
  if (pg) return rereadPage(pg.dataset.page);
  const it = ev.target.closest('[data-cx]');
  if (it) return openEntry(it.dataset.cx);
  if (ev.target.closest('[data-cxback]')) {
    renderCodexList();
  }
});
$('#b-chapters').onclick = renderChapters;
$('#b-back').onclick = () => {
  renderTitle();
  show('title');
};
$('#b-start').onclick = () => {
  SND.unlock();
  SND.play('chapter');
  document.body.classList.add('sp-leave');
  setTimeout(() => {
    document.body.classList.remove('sp-leave');
    show('title');
  }, 380);
};
$('#chap-list').addEventListener('click', ev => {
  const b = ev.target.closest('[data-ch]');
  if (b && !b.disabled) startChapter(+b.dataset.ch);
});
$('#e-shards').addEventListener('click', ev => {
  if (ev.target.closest('[data-shop]')) renderShop();
});
$('#e-actions').addEventListener('click', ev => {
  const b = ev.target.closest('button');
  if (!b) return;
  if ('new' in b.dataset) beginRunFlow();
  else if ('shop' in b.dataset) renderShop();
  else if (b.dataset.go !== undefined) startChapter(+b.dataset.go);
  else {
    renderTitle();
    show('title');
  }
});
$('#c-list').addEventListener('click', ev => {
  const b = ev.target.closest('[data-pick]');
  if (!b) {
    const a = ev.target.closest('[data-peek]');
    if (a) {
      run.peek = +a.dataset.peek;
      SND.play('ui');
      document.querySelectorAll('.arch').forEach(x => {
        x.classList.toggle('on', x === a);
        const g = x.querySelector('.arch-go');
        if (g) g.classList.toggle('primary', x === a);
      });
      paintPeek();
    }
    return;
  }
  run.peek = null;
  const o = run.choice[+b.dataset.pick];
  run.rank = o.rank;
  startBattle(o.key);
});
$('#b-reroll').onclick = reroll;
$('#b-resolve').onclick = resolve;
$('#relicbar').addEventListener('click', ev => {
  const b = ev.target.closest('[data-ri]');
  const info = $('#relicinfo');
  if (!b) return;
  const r = run.relics[+b.dataset.ri],
    R_ = RELICS[r.id];
  const t = `${relicIcon(r.id, 'sm')} <b>${R_.name}</b> ${R_.text}${R_.grow ? ` · สะสมแล้ว ${r.n || 0}` : ''}`;
  if (!info.hidden && info.dataset.ri === b.dataset.ri) {
    info.hidden = true;
    return;
  }
  info.innerHTML = t;
  info.dataset.ri = b.dataset.ri;
  info.hidden = false;
});
$('#tray').addEventListener('click', ev => {
  const b = ev.target.closest('.die');
  if (!b || battle.busy) return;
  const r = battle.rolls[+b.dataset.i];
  if (r.frozen || r.banished) return;
  if (battle.e.noHold) {
    log(`${battle.e.name}: ล็อกเต๋าไม่ได้ในไฟต์นี้`);
    return render(false);
  }
  r.held = !r.held;
  if (r.held) coachEvent('hold');
  render(false);
});
$('#r-list').addEventListener('click', ev => {
  const t = ev.target.closest('button');
  if (!t) return;
  if (t.dataset.summon) summon(t.dataset.summon);
  else if ('rest' in t.dataset) {
    SND.play('heal');
    RULES.restPick(run);
    nextStage();
  } else if (t.dataset.drop !== undefined) {
    run.dice.splice(+t.dataset.drop, 1);
    run.dice.push(pending);
    afterPick(pending);
  } else if ('skip' in t.dataset) nextStage();
  else if ('cancel' in t.dataset) showReward(true);
});
