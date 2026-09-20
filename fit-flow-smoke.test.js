const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require('node:path').join(__dirname, 'momcozy-leak-flow.js'), 'utf8');

function makeDemo() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();
  const documentListeners = new Map();
  const windowListeners = new Map();
  const state = {};
  const document = {
    readyState: 'loading',
    documentElement: { classList: { add() {} } },
    addEventListener(type, handler) { documentListeners.set(type, handler); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementById() { return null; },
  };
  const window = {
    v4View() {},
    addEventListener(type, handler) {
      if (!windowListeners.has(type)) windowListeners.set(type, []);
      windowListeners.get(type).push(handler);
    },
  };
  const context = vm.createContext({
    state, document, window, navigator: { maxTouchPoints: 0 },
    Date: class extends Date { static now() { return now; } },
    setTimeout(handler, delay = 0) {
      const id = nextId++;
      timers.set(id, { at: now + delay, handler });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame() {},
  });
  vm.runInContext(source, context);
  documentListeners.get('DOMContentLoaded')();
  function advance(to) {
    while (true) {
      const due = [...timers.entries()].filter(([, timer]) => timer.at <= to).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      const [id, timer] = due;
      timers.delete(id);
      now = timer.at;
      timer.handler();
    }
    now = to;
  }
  function inlineDone() {
    const button = { dataset: { mc: 'fit-inline-done' } };
    const event = {
      target: { closest(selector) { return selector.includes('[data-mc="fit-inline-done"]') ? button : null; } },
      preventDefault() {},
      stopImmediatePropagation() {},
    };
    for (const handler of windowListeners.get('pointerdown') || []) handler(event);
  }
  return { state, window, advance, inlineDone };
}

{
  const demo = makeDemo();
  demo.window.v4RunFit();
  assert.equal(demo.state.mcFitBattery, 'checking');
  assert.equal(demo.state.mcFitWear, 'checking');
  demo.advance(5999);
  assert.equal(demo.state.mcFitBattery, 'checking');
  demo.advance(6000);
  assert.equal(demo.state.mcFitBattery, 'done');
  assert.equal(demo.state.mcFitWear, 'checking');
  demo.advance(14999);
  assert.equal(demo.state.mcFitWear, 'checking');
  demo.advance(15000);
  assert.equal(demo.state.mcFitWear, 'done');
  assert.equal(demo.state.modal, 'fit');
  assert.equal(demo.state.fitStage, 5);
  demo.advance(16799);
  assert.equal(demo.state.modal, 'fit');
  demo.advance(16800);
  assert.equal(demo.state.modal, null);
  assert.equal(demo.state.mcFitNoticePhase, 'monitoring');
}

{
  const demo = makeDemo();
  demo.window.v4RunFit();
  demo.advance(3000);
  demo.window.mcFitScenario('pass');
  demo.advance(3180);
  assert.equal(demo.state.mcFitWear, 'done');
  assert.equal(demo.state.mcFitBattery, 'checking');
  demo.advance(6000);
  assert.equal(demo.state.mcFitBattery, 'done');
  assert.equal(demo.state.fitStage, 5);
  demo.advance(7799);
  assert.equal(demo.state.modal, 'fit');
  demo.advance(7800);
  assert.equal(demo.state.modal, null);
  assert.equal(demo.state.mcFitNoticePhase, 'monitoring');
}

{
  const demo = makeDemo();
  demo.window.v4RunFit();
  demo.advance(3000);
  demo.window.mcFitScenario('wear');
  demo.advance(3180);
  assert.equal(demo.state.mcFitWear, 'failed');
  assert.equal(demo.state.mcFitInline, 'wear');
  assert.equal(demo.state.mcFitNoticePhase, 'failed');
  assert.equal(demo.state.mcFitCollapsed, true);
  demo.advance(6000);
  assert.equal(demo.state.mcFitBattery, 'done');
  demo.advance(16000);
  assert.equal(demo.state.mcFitWear, 'failed');
  assert.equal(demo.state.mcFitNoticePhase, 'failed');
  demo.inlineDone();
  assert.equal(demo.state.mcFitNoticeLeaving, true);
  demo.advance(16850);
  assert.equal(demo.state.mcFitNoticePhase, 'passed');
  demo.advance(18650);
  assert.equal(demo.state.mcFitNoticePhase, 'monitoring');
}

{
  const demo = makeDemo();
  demo.window.v4RunFit();
  demo.window.mcMinimizeFitCheck();
  demo.advance(6000);
  assert.equal(demo.state.mcFitNoticePhase, 'battery-passed');
  demo.advance(7700);
  assert.equal(demo.state.mcFitNoticePhase, 'checking-wear');
  demo.advance(15000);
  assert.equal(demo.state.mcFitNoticePhase, 'passed');
  demo.advance(16100);
  assert.equal(demo.state.modal, null);
  assert.equal(demo.state.mcFitCollapsed, true);
  demo.advance(16800);
  assert.equal(demo.state.mcFitNoticePhase, 'monitoring');
  demo.advance(31799);
  assert.equal(demo.state.mcFitCollapsed, true);
  demo.advance(31800);
  assert.equal(demo.state.mcFitNoticeLeaving, true);
  assert.equal(demo.state.mcFitCollapsed, true);
  demo.advance(32499);
  assert.equal(demo.state.mcFitCollapsed, true);
  demo.advance(32500);
  assert.equal(demo.state.mcFitCollapsed, false);
}

{
  const demo = makeDemo();
  demo.window.v4RunFit();
  demo.window.mcMinimizeFitCheck();
  demo.advance(3000);
  demo.window.mcFitScenario('severe');
  demo.advance(3180);
  assert.equal(demo.state.mcFitStatus, 'Air leak detected');
  demo.advance(3980);
  assert.equal(demo.state.mcFitInline, 'leak');
  assert.equal(demo.state.paused, true);
  assert.equal(demo.state.mcFitNoticePhase, 'failed');
  demo.inlineDone();
  demo.advance(4830);
  assert.equal(demo.state.mcFitNoticePhase, 'passed');
  demo.advance(6630);
  assert.equal(demo.state.mcFitNoticePhase, 'monitoring');
}

console.log('Fit-check timing smoke tests passed.');
