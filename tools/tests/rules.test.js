// Small checks on src/rules/rules.js with fixed dice, no browser needed.
const assert = require('assert');
const D = require('../../src/data/data.js');
const RULES = require('../../src/rules/rules.js');
const ch = id => D.CHAPTERS.find(c => c.id === id);
const mkRun = o => ({
  hp: 40,
  maxHp: 50,
  san: 20,
  maxSan: 20,
  coins: 0,
  dice: [],
  relics: [],
  ups: {},
  curse: 0,
  ...o,
});
const face = (t, v) => ({ t, v });
const roll = (id, f) => ({ id, face: f, fresh: false, held: false, frozen: false });
let n = 0;
const test = (name, fn) => {
  fn();
  n++;
};

test('block absorbs attack before hp', () => {
  const run = mkRun();
  const b = RULES.newBattle(RULES.newFoe(ch('c1'), 'ghoul', { stage: 0, rank: 2 }), run);
  b.e.block = 3;
  const hp0 = b.e.hp;
  b.rolls = [roll('cultA', face('atk', 5))];
  const r = RULES.playerResolve(b, run, RULES.tally(b, run));
  assert.strictEqual(b.e.block, 0);
  assert.strictEqual(b.e.hp, hp0 - 2);
  assert.deepStrictEqual(
    r.ev.find(x => x.k === 'atk'),
    { k: 'atk', v: 5, dealt: 2, absorbed: 3, crit: false }
  );
});

test('enemy attack: your block first, drain heals the foe up to max', () => {
  const run = mkRun({ hp: 40 });
  const b = RULES.newBattle(RULES.newFoe(ch('c1'), 'ghoul', { stage: 0, rank: 2 }), run);
  b.e.intents = [[{ t: 'drain', v: 10 }]];
  b.e.hp = b.e.maxHp - 2;
  b.pBlock = 4;
  RULES.enemyTurn(b, run);
  assert.strictEqual(run.hp, 34);
  assert.strictEqual(b.e.hp, b.e.maxHp);
});

test('poison ticks, then drops by 1', () => {
  const run = mkRun();
  const b = RULES.newBattle(RULES.newFoe(ch('c1'), 'ghoul', { stage: 0, rank: 2 }), run);
  b.e.poison = 3;
  const hp0 = b.e.hp;
  RULES.enemyTurn(b, run);
  assert.strictEqual(b.e.hp, hp0 - 3);
  assert.strictEqual(b.e.poison, 2);
});

test('boss phase 2 switches moves at the threshold', () => {
  const run = mkRun({ hp: 999, maxHp: 999 });
  const b = RULES.newBattle(RULES.newFoe(ch('c5'), 'cthulhu', { stage: 3, rank: 2 }), run);
  b.e.hp = Math.floor(b.e.maxHp * 0.74);
  assert.ok(RULES.checkPhase(b));
  assert.strictEqual(b.e.name, D.FOES.cthulhu.phase2.name);
  assert.strictEqual(b.e.intents.length, D.FOES.cthulhu.phase2.intents.length);
  assert.ok(!RULES.checkPhase(b), 'only once');
});

test('win spoils: rank coins + interest, boss max hp', () => {
  const run = mkRun({ coins: 10 });
  const g = RULES.winSpoils(run, { boss: false, rank: 3, inRun: true });
  assert.deepStrictEqual(g, { g: 4, it: 2 });
  assert.strictEqual(run.coins, 16);
  const run2 = mkRun({ hp: 50, maxHp: 50 });
  RULES.winSpoils(run2, { boss: true, rank: 2, inRun: true });
  assert.strictEqual(run2.maxHp, 55);
});

test('shop prices: potion rises per bottle, silver key takes 1 off', () => {
  assert.deepStrictEqual(
    [0, 1, 2].map(i => RULES.potionCost(i, [])),
    [3, 5, 7]
  );
  assert.strictEqual(RULES.potionCost(0, [{ id: 'key' }]), 2);
});

test('upgrades add to every face except blank and madness', () => {
  const run = mkRun({ ups: { cultA: 2 } });
  assert.deepStrictEqual(RULES.upFace(face('atk', 3), 'cultA', run), face('atk', 5));
  assert.deepStrictEqual(RULES.upFace(face('mad', 1), 'cultA', run), face('mad', 1));
});

test('event: selling the weakest die pays and removes it', () => {
  const run = mkRun({ dice: ['cultA', 'shog', 'cultB'] });
  const r = RULES.eventApi(run).sellWeakest(5);
  assert.strictEqual(run.dice.length, 2);
  assert.strictEqual(run.coins, 5);
  assert.ok(['cultA', 'cultB'].includes(r.gone), 'a starter die is the weakest');
});

console.log(`rules: ${n} checks passed`);
