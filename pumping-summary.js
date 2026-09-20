/* Editable end-of-session sheet, based on the supplied 402 × 630 SVG. */
(function () {
  var chartPaths = {
    l: 'M42 442C53 436 61 405 70 378C77 355 80 346 86 346C94 346 98 374 109 391C123 412 137 439 149 439C163 439 173 406 182 382C188 365 193 363 196 363C206 363 211 391 222 408C233 427 246 440 258 440C272 440 283 412 292 395C298 383 304 380 309 383C320 389 328 412 338 421C353 434 364 439 375 442',
    r: 'M42 442C59 440 71 414 82 383C93 355 102 317 108 317C116 317 122 365 134 391C147 420 153 439 165 439C180 439 188 403 198 368C204 347 209 327 215 327C225 327 235 379 246 406C255 429 264 440 275 440C289 440 301 406 312 385C319 370 323 367 328 370C340 378 346 409 355 423C363 434 370 439 375 442'
  };
  function icon(name) {
    if (name === 'edit') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17.5 16.8 4.7l2.5 2.5L6.5 20H4zM14.8 6.7l2.5 2.5"/></svg>';
    if (name === 'trash') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 4h6M7 7l1 13h8l1-13M10 10v7M14 10v7"/></svg>';
    if (name === 'close') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17v.2"/></svg>';
  }
  function duration(seconds) {
    var n = Math.max(0, Math.round(Number(seconds) || 0));
    return Math.floor(n / 60) + 'm ' + String(n % 60).padStart(2, '0') + 's';
  }
  function chart(s) {
    var samples = s.reviewFrozen ? null : s.psFlowSamples;
    var useLive = Array.isArray(samples) && samples.length > 1;
    function livePath(side) {
      var end = Math.max(1, Number(s.timer) || samples[samples.length - 1].second || 1);
      return samples.map(function(sample, i) {
        var x = 42 + Math.min(1, Math.max(0, sample.second / end)) * 333;
        var y = 442 - Math.min(15, Math.max(0, Number(sample[side]) || 0) * 60) / 15 * 144;
        return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }).join(' ');
    }
    var maxMinutes = s.reviewFrozen ? 24 : Math.max(1, Math.ceil((Number(s.timer) || 0) / 60));
    var labels = [0, 1, 2, 3, 4].map(function (n, i) { return '<text x="' + (42 + i * 83.25) + '" y="460" text-anchor="middle">' + (n * maxMinutes / 4).toFixed(maxMinutes < 4 ? 1 : 0) + '</text>'; }).join('');
    var events = Array.isArray(s.air2LetdownEvents) ? s.air2LetdownEvents : [];
    function markers(side, fallback) {
      if (!useLive) return s.reviewFrozen ? fallback.map(function (p, i) { return '<g class="ps-marker ps-marker-'+side+'"><circle cx="'+p[0]+'" cy="'+p[1]+'" r="6"/><text x="'+p[0]+'" y="'+(p[1]+3)+'">'+(i+1)+'</text></g>'; }).join('') : '';
      return events.filter(function(event){return event.type==='start' && (event.side===side || event.side==='both')}).map(function(event,i){
        var second = Math.max(0,Number(event.second)||0),end=Math.max(1,Number(s.timer)||1),x=42+Math.min(1,second/end)*333;
        var sample = samples.reduce(function(best,item){return Math.abs(item.second-second)<Math.abs(best.second-second)?item:best},samples[0]);
        var y=430-Math.min(15,Math.max(0,Number(sample[side])||0)*60)/15*144;
        return '<g class="ps-marker ps-marker-'+side+'"><circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="6"/><text x="'+x.toFixed(1)+'" y="'+(y+3).toFixed(1)+'">'+(i+1)+'</text></g>';
      }).join('');
    }
    return '<svg class="ps-chart" viewBox="0 282 390 195" role="img" aria-label="Milk flow over time, left and right"><g class="ps-chart-grid"><path d="M42 298H375M42 346H375M42 394H375"/></g><g class="ps-chart-axis"><path d="M42 294V442H375M42 442V446M125.25 442V446M208.5 442V446M291.75 442V446M375 442V446"/></g><g class="ps-chart-labels"><text x="34" y="302" text-anchor="end">15</text><text x="34" y="350" text-anchor="end">10</text><text x="34" y="398" text-anchor="end">5</text><text x="34" y="446" text-anchor="end">0</text>'+labels+'<text x="375" y="475" text-anchor="end">Time (min)</text></g><path class="ps-flow-l" d="'+(useLive?livePath('l'):s.reviewFrozen?chartPaths.l:'M42 442H375')+'"/><path class="ps-flow-r" d="'+(useLive?livePath('r'):s.reviewFrozen?chartPaths.r:'M42 442H375')+'"/>'+markers('l',[[86,334],[196,351],[305,369]])+markers('r',[[108,305],[215,315],[325,357]])+'</svg>';
  }
  function render() {
    var s = state, left = Math.max(0, Number(s.milkL) || 0), right = Math.max(0, Number(s.milkR) || 0);
    var started = s.air2SessionStartedAt || (Date.now() - Math.max(0, Number(s.timer) || 0) * 1000);
    var date = new Date(started).toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
    var problem = s.air2SessionSummaryKind === 'severe' ? 'Significant air leak detected' : s.air2SessionSummaryKind === 'wear' ? 'Pump fit issue detected' : '';
    var events = Array.isArray(s.air2LetdownEvents) ? s.air2LetdownEvents : [];
    function count(side) { return s.reviewFrozen ? 3 : events.filter(function(event){return event.type==='start' && (event.side===side || event.side==='both')}).length; }
    return '<div class="v4-overlay ps-overlay"><section class="v4-log ps-sheet" aria-label="Pumping record">' +
      '<header class="ps-header"><button class="ps-icon-button" type="button" data-v4="control" aria-label="Close">'+icon('close')+'</button><div><h1>Pumping Record</h1><span>'+date+'</span></div><button class="ps-icon-button" type="button" data-ps="delete" aria-label="Delete record">'+icon('trash')+'</button></header>'+
      '<div class="ps-total"><span>Total milk</span><strong data-ps-total>'+ (left + right).toFixed(1) +'</strong><span>oz</span></div>'+
      '<div class="ps-sides">'+['l','r'].map(function(side){var value=side==='l'?left:right;return '<button class="ps-side" type="button" data-ps="milk" data-side="'+side+'"><i class="ps-dot ps-dot-'+side+'"></i><span>'+(side==='l'?'Left':'Right')+'</span><strong data-ps-value="'+side+'">'+value.toFixed(1)+'</strong><small>oz</small>'+icon('edit')+'</button>'}).join('')+'</div>'+
      '<section class="ps-process"><button class="ps-duration" type="button" data-ps="duration"><span>Duration</span><strong>'+duration(s.timer)+'</strong>'+icon('edit')+'</button><div class="ps-chart-head"><h2>Milk Flow</h2><div class="ps-filters" role="group" aria-label="Chart sides"><button class="is-active" type="button" data-ps-filter="all">All</button><button type="button" data-ps-filter="l"><i class="ps-dot ps-dot-l"></i>Left</button><button type="button" data-ps-filter="r"><i class="ps-dot ps-dot-r"></i>Right</button></div></div><p class="ps-rate">Flow rate (mL/min)</p>'+chart(s)+'<div class="ps-letdown"><b>Let-down</b><span><i class="ps-dot ps-dot-l"></i>Left <strong data-ps-count="l">'+count('l')+'</strong></span><em></em><span><i class="ps-dot ps-dot-r"></i>Right <strong data-ps-count="r">'+count('r')+'</strong></span></div></section>'+
      (problem?'<button class="ps-leak-note mc-severe-log-note" type="button" data-mc="log">'+icon('alert')+'<span>'+problem+'</span><u>Troubleshoot</u><b>›</b></button>':'')+
      '<button class="ps-save" type="button" data-v4="save">Confirm &amp; Save</button></section></div>';
  }
  window.v4Log = v4Log = render;
  setInterval(function(){
    var s=state;
    if (!s || !s.running || s.paused || s.page!=='control') return;
    var second=Math.max(0,Number(s.timer)||0);
    if (!Array.isArray(s.psFlowSamples) || (s.psFlowSamples.length && second < s.psFlowSamples[s.psFlowSamples.length-1].second)) {
      s.psFlowSamples=[];
      s.air2SessionStartedAt=Date.now()-second*1000;
    }
    if (s.psFlowSamples.length && s.psFlowSamples[s.psFlowSamples.length-1].second===second) return;
    s.psFlowSamples.push({second:second,l:Number(s.flowRateL)||0,r:Number(s.flowRateR)||0});
  },1000);
  if (state.reviewFrozen && state.reviewScreenId === 'log-amount') {
    root.innerHTML = v4Control() + render();
  }
  document.addEventListener('click', function(event) {
    var button = event.target.closest('#demo [data-ps], #demo [data-ps-filter]');
    if (!button) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (button.dataset.psFilter) {
      var filter = button.dataset.psFilter, sheet = button.closest('.ps-sheet');
      sheet.dataset.filter = filter;
      sheet.querySelectorAll('[data-ps-filter]').forEach(function(item){item.classList.toggle('is-active',item.dataset.psFilter===filter)});
      return;
    }
    if (button.dataset.ps === 'milk') {
      var side = button.dataset.side, key = side === 'l' ? 'milkL' : 'milkR';
      var answer = window.prompt('Enter ' + (side === 'l' ? 'left' : 'right') + ' milk amount (oz)', (Number(state[key]) || 0).toFixed(1));
      if (answer === null) return;
      var value = Number(answer);
      var capacity = typeof window.air2CapacityOz === 'function' ? window.air2CapacityOz() : 180 / 29.5735;
      if (!Number.isFinite(value) || value < 0 || value > capacity) return;
      state[key] = Math.round(value * 10) / 10;
      v4View(); return;
    }
    if (button.dataset.ps === 'duration') {
      var minutes = window.prompt('Enter duration in minutes', (Math.max(0, Number(state.timer) || 0) / 60).toFixed(1));
      if (minutes === null) return;
      var amount = Number(minutes);
      if (!Number.isFinite(amount) || amount < 0 || amount > 120) return;
      state.timer = Math.round(amount * 60);
      v4View(); return;
    }
    if (button.dataset.ps === 'delete' && window.confirm('Delete this pumping record?')) {
      if (Array.isArray(state.air2SessionHistory) && state.air2ActiveSessionId) {
        state.air2SessionHistory = state.air2SessionHistory.filter(function(record){return record.id!==state.air2ActiveSessionId});
      }
      state.air2ActiveSessionId = null;
      state.hasLogged = !!(state.air2SessionHistory && state.air2SessionHistory.length);
      state.modal = null; state.page = 'home'; state.running = false; state.paused = false;
      state.air2ShowSessionSummary = false; state.air2ShowLoggedSummary = false;
      v4View();
    }
  }, true);
}());
