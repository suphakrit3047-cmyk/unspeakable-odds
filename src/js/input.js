/* ---------- button wiring ---------- */
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
