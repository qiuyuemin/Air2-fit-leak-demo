const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function harness() {
  let boot;
  const state = {
    page: 'control', running: true, paused: false, modal: null, timer: 0,
    milkL: 0, milkR: 0, mode: 'stimulation', auto: false,
    letdownPhaseL: 'baseline', letdownPhaseR: 'baseline',
    air2LastPhysicsSecond: 0,
    psFlowSamples: [{ second: 0, l: 1.1 / 60, r: 1.1 / 60 }],
    air2LetdownEvents: []
  };
  const window = { v4View() {}, v4Logged() {} };
  const document = {
    readyState: 'loading',
    addEventListener(type, listener) { if (type === 'DOMContentLoaded') boot = listener; },
    querySelector(selector) { return selector === '.demo-trigger-root' ? {} : null; },
    getElementById() { return null; }
  };
  const context = { state, window, document, setTimeout() { return 1; }, clearTimeout() {}, Date };
  vm.runInNewContext(fs.readFileSync('demo-triggers.js', 'utf8'), context);
  boot();
  return { state, api: window.Air2DemoTriggers };
}

function tick(test, from, to) {
  for (let second = from; second <= to; second++) {
    test.state.timer = second;
    test.api.physics();
  }
}

const left = harness();
assert.equal(left.api.trigger('letdown-start-l'), true);
const rates = [0, 1, 2, 3, 4, 5, 6, 10, 20].map(second => left.api.flowAt('l', second) * 60);
assert.ok(rates[0] < rates[1] && rates[1] < rates[2] && rates[2] < rates[3]);
assert.ok(rates[4] >= 8 && rates[4] <= 13);
assert.ok(rates[6] > rates[10 - 3] && rates[8] < 2);
assert.equal(left.api.flowAt('r', 5) * 60, 1.1);
tick(left, 1, 6);
assert.equal(left.state.psFlowSamples.length, 7);
assert.equal(left.state.air2LetdownEvents.filter(event => event.type === 'start').length, 1);
const expectedMl = left.state.psFlowSamples.slice(1).reduce((sum, sample, index) => {
  const previous = left.state.psFlowSamples[index];
  return sum + (previous.l + sample.l) * .5;
}, 0);
assert.ok(Math.abs(left.state.milkL * 29.5735 - expectedMl) < 1e-9);
assert.ok(left.state.milkL < .05, 'six seconds should not create several mL each tick');

const beforeRetrigger = left.api.flowAt('l', 6) * 60;
assert.equal(left.api.trigger('letdown-start-l'), true);
assert.equal(left.api.flowAt('l', 6) * 60, beforeRetrigger, 'retrigger must not jump');
tick(left, 7, 12);
assert.equal(left.state.air2LetdownEvents.filter(event => event.type === 'start').length, 2);
assert.equal(left.api.trigger('letdown-end-l'), true);
const afterEnd = [12, 13, 14, 15, 16].map(second => left.api.flowAt('l', second) * 60);
assert.ok(afterEnd[0] > afterEnd[1] && afterEnd[1] > afterEnd[2] && afterEnd[2] > afterEnd[3]);
assert.ok(afterEnd[4] <= 1.2, 'manual end should ease back to background flow');

const both = harness();
assert.equal(both.api.trigger('letdown-start-both'), true);
assert.ok(both.api.flowAt('l', 1) > both.api.flowAt('r', 1));
assert.ok(both.api.flowAt('r', 6) * 60 >= 8);
assert.notEqual(both.api.flowAt('l', 6), both.api.flowAt('r', 6));
tick(both, 1, 5);
const atPause = { milkL: both.state.milkL, milkR: both.state.milkR, samples: both.state.psFlowSamples.length };
both.state.paused = true;
both.api.physics();
assert.deepEqual({ milkL: both.state.milkL, milkR: both.state.milkR, samples: both.state.psFlowSamples.length }, atPause);
both.state.paused = false;
tick(both, 6, 6);
assert.ok(both.state.milkL > atPause.milkL);
console.log('Trigger-driven flow and milk integration tests passed.');
