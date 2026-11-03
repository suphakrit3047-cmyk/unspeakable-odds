/* ---------- shard shop (between runs) ---------- */
const SHARD =
  '<svg class="shard" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l6 7-6 13-6-13z"/><path d="M6 9h12M12 2v20" fill="none"/></svg>';
function renderShop() {
  $('#shop-shards').innerHTML = `${SHARD}<span>${META.shards} เศษความทรงจำ</span>`;
  const groups = [
    ['die', 'อสูรใหม่'],
    ['bag', 'ถุงเต๋าเริ่มต้น'],
    ['up', 'พลังติดตัว'],
  ];
  $('#shop-list').innerHTML = groups
    .map(
      ([k, label]) =>
        `<h3 class="sh">${label}</h3>` +
        META_SHOP.filter(u => u.kind === k)
          .map(u => {
            const own = owns(u.id),
              blocked = u.need && !owns(u.need),
              afford = META.shards >= u.cost;
            const art =
              u.kind === 'die'
                ? `<canvas class="portrait" data-foe="${DIE_ART[u.die] || u.die}" data-static></canvas>`
                : u.kind === 'bag'
                  ? `<canvas class="portrait" data-foe="${DIE_ART[u.bag[3]] || u.bag[3]}" data-static></canvas>`
                  : `<span class="up-ico">${u.hp ? icon('heal') : icon('san')}</span>`;
            const btn = own
              ? '<span class="badge">ได้แล้ว</span>'
              : blocked
                ? `<span class="dim" style="font-size:.8rem">ต้องมี ${META_SHOP.find(x => x.id === u.need).name} ก่อน</span>`
                : `<button class="btn ${afford ? 'primary' : ''}" data-buy="${u.id}" ${afford ? '' : 'disabled'}>${SHARD}${u.cost}</button>`;
            return `<div class="shop-item ${own ? 'owned' : ''}">${art}<div class="si-meta"><b>${u.name}</b><span class="dim">${u.text}</span></div>${btn}</div>`;
          })
          .join('')
    )
    .join('');
  show('shop');
}
function buy(id) {
  const u = META_SHOP.find(x => x.id === id);
  if (!u || owns(id) || META.shards < u.cost) return;
  META.shards -= u.cost;
  META.own.push(id);
  if (u.kind === 'bag') META.bag = id;
  metaSave();
  SND.play('coin');
  renderShop();
}
