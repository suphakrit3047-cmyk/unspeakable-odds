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
