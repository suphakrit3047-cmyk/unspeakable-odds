/* ---------- tooltips: hover on desktop, press-and-hold on phones ---------- */
const tipBox = document.createElement('div');
tipBox.id = 'tipbox';
tipBox.setAttribute('role', 'tooltip');
tipBox.hidden = true;
document.body.appendChild(tipBox);
let tipEl = null,
  holdTimer = 0,
  holdShown = false,
  hideTimer = 0;
function showTip(el) {
  const t = el.getAttribute('data-tip');
  if (!t) return;
  tipEl = el;
  tipBox.innerHTML = t;
  tipBox.hidden = false;
  const r = el.getBoundingClientRect(),
    w = tipBox.offsetWidth,
    h = tipBox.offsetHeight,
    vw = document.documentElement.clientWidth;
  let x = r.left + r.width / 2 - w / 2;
  x = Math.max(8, Math.min(vw - w - 8, x));
  let y = r.top - h - 10;
  if (y < 8) y = r.bottom + 10;
  tipBox.style.left = x + 'px';
  tipBox.style.top = y + 'px';
  tipBox.classList.toggle('below', y > r.top);
}
function hideTip() {
  tipBox.hidden = true;
  tipEl = null;
}
document.addEventListener('pointerover', ev => {
  if (ev.pointerType !== 'mouse') return;
  const el = ev.target.closest('[data-tip]');
  if (el && el !== tipEl) showTip(el);
  else if (!el && tipEl) hideTip();
});
document.addEventListener('pointerout', ev => {
  if (ev.pointerType !== 'mouse') return;
  if (tipEl && !tipEl.contains(ev.relatedTarget)) hideTip();
});
document.addEventListener(
  'pointerdown',
  ev => {
    if (ev.pointerType === 'mouse') return;
    const el = ev.target.closest('[data-tip]');
    clearTimeout(holdTimer);
    holdShown = false;
    if (!el) {
      hideTip();
      return;
    }
    holdTimer = setTimeout(() => {
      holdShown = true;
      showTip(el);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hideTip, 2600);
    }, 380);
  },
  { passive: true }
);
['pointerup', 'pointercancel', 'pointermove'].forEach(n =>
  document.addEventListener(
    n,
    ev => {
      if (ev.pointerType !== 'mouse' && (n !== 'pointermove' || Math.abs(ev.movementX) + Math.abs(ev.movementY) > 6))
        clearTimeout(holdTimer);
    },
    { passive: true }
  )
);
document.addEventListener(
  'click',
  ev => {
    if (holdShown) {
      holdShown = false;
      ev.stopPropagation();
      ev.preventDefault();
    }
  },
  true
);
document.addEventListener('contextmenu', ev => {
  if (ev.target.closest('[data-tip]')) ev.preventDefault();
});
window.addEventListener('scroll', hideTip, { passive: true });
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
    if (!musicStarted) {
      musicStarted = true;
      musicFor();
    }
  },
  { once: false, passive: true }
);
let musicStarted = false;
function musicFor() {
  if (!musicStarted) return;
  const onBattle = !$('#s-battle').hidden && battle && battle.e;
  SND.music(run && run.ch && $('#s-title').hidden ? run.ch.id : 'title', !!(onBattle && battle.e.boss));
}
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
renderTitle();
show('splash');
$('#b-start').onclick = () => {
  SND.unlock();
  if (!musicStarted) {
    musicStarted = true;
  }
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
    run.hp = Math.min(run.maxHp, run.hp + restAmt());
    run.san = Math.min(run.maxSan, run.san + 5);
    nextStage();
  } else if (t.dataset.drop !== undefined) {
    run.dice.splice(+t.dataset.drop, 1);
    run.dice.push(pending);
    afterPick(pending);
  } else if ('skip' in t.dataset) nextStage();
  else if ('cancel' in t.dataset) showReward(true);
});
