const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function render(kind) {
  const context = {
    state: {
      page: 'control', modal: 'log', timer: 124,
      milkL: 1.7, milkR: 2.2, air2SessionSummaryKind: kind,
      air2LetdownEvents: [{ side: 'l', type: 'start', second: 12 }],
      psFlowSamples: [{ second: 0, l: 0, r: 0 }, { second: 120, l: 0.04, r: 0.02 }]
    },
    document: { addEventListener() {} },
    window: {},
    setInterval() {}
  };
  vm.runInNewContext(fs.readFileSync('pumping-summary.js', 'utf8'), context);
  return context.window.v4Log();
}

const severe = render('severe');
assert.match(severe, /Significant air leak detected/);
assert.match(severe, /data-mc="log"/);
assert.match(severe, /Confirm &amp; Save/);
assert.match(severe, /data-ps-count="l">1/);
assert.match(severe, /data-ps-count="r">0/);
assert.match(severe, /3\.9/);
assert.match(severe, /2m 04s/);
assert.match(severe, /id="ps-flow-zones"/);
assert.match(severe, /#5B8FD9/);
assert.match(severe, /#379D89/);
assert.match(severe, /#E6A044/);
assert.match(severe, /ps-side-line is-dashed/);
assert.match(severe, /Color shows flow speed, not health status/);
assert.match(severe, /Time \(sec\)/);
assert.match(severe, /data-ps-event="0"/);
assert.match(severe, /data-ps-detail="l"/);
assert.match(severe, /data-ps-detail="r"/);
assert.match(severe, /data-ps-filter="all" aria-pressed="true"/);
const css = fs.readFileSync('pumping-summary.css', 'utf8');
assert.match(css, /ps-marker-l[^}]*opacity:\.2/);
assert.match(css, /\[data-ps-detail=r\][^}]*display:none/);
assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);

let onClick;
const interactive = {
  state: { page: 'control', modal: 'log', milkL: 1.7, milkR: 2.2 },
  document: { addEventListener(type, handler) { if (type === 'click') onClick = handler; } },
  window: {}, setInterval() {}
};
vm.runInNewContext(fs.readFileSync('pumping-summary.js', 'utf8'), interactive);
const items = ['all', 'l', 'r'].map(filter => ({
  dataset: { psFilter: filter },
  classList: { toggle(name, selected) { this.selected = selected; } },
  setAttribute(name, value) { this[name] = value; }
}));
const sheet = { dataset: {}, querySelectorAll() { return items; } };
const button = { dataset: { psFilter: 'l' }, closest() { return sheet; } };
onClick({ target: { closest(selector) { return selector.includes('data-ps-event') ? null : button; } }, preventDefault() {}, stopImmediatePropagation() {} });
assert.equal(sheet.dataset.filter, 'l');
assert.deepEqual(items.map(item => item['aria-pressed']), ['false', 'true', 'false']);
assert.match(interactive.window.v4Log(), /data-filter="l"/);
assert.match(interactive.window.v4Log(), /data-ps-filter="l" aria-pressed="true"/);
assert.doesNotMatch(render('stable'), /Significant air leak detected/);
console.log('Pumping summary smoke tests passed.');
