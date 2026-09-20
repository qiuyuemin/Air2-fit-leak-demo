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
assert.doesNotMatch(render('stable'), /Significant air leak detected/);
console.log('Pumping summary smoke tests passed.');
