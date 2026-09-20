const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require('node:path').join(__dirname, 'momcozy-leak-flow.js'), 'utf8');

function makeDemo() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();
  const documentListeners = new Map();
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
    addEventListener() {},
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
  return { state, window, advance };
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
  demo.advance(16100);
  assert.equal(demo.state.modal, null);
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
  demo.advance(7100);
  assert.equal(demo.state.modal, null);
}

{
  const demo = makeDemo();
  demo.window.v4RunFit();
  demo.advance(3000);
  demo.window.mcFitScenario('wear');
  demo.advance(3180);
  assert.equal(demo.state.mcFitWear, 'failed');
  assert.equal(demo.state.mcFitInline, 'wear');
  demo.advance(6000);
  assert.equal(demo.state.mcFitBattery, 'done');
  demo.advance(16000);
  assert.equal(demo.state.mcFitWear, 'failed');
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
  demo.advance(32649);
  assert.equal(demo.state.mcFitCollapsed, true);
  demo.advance(32650);
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
}

console.log('Fit-check timing smoke tests passed.');
