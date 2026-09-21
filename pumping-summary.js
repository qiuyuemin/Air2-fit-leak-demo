/* Editable end-of-session sheet, based on the supplied 402 × 630 SVG. */
(function () {
  var activeFilter = 'all';
  var selectedLetdownIndex = null;
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
  function letdownSummary(s) {
    var events=Array.isArray(s.air2LetdownEvents)?s.air2LetdownEvents:[];
    var event=events[selectedLetdownIndex], side, number, at;
    if(event&&event.type==='start'&&(activeFilter==='all'||activeFilter===event.side)){
      side=event.side==='r'?'Right':'Left';
      number=events.slice(0,selectedLetdownIndex+1).filter(function(item){return item.type==='start'&&item.side===event.side}).length;
      at=Math.max(0,Math.round(Number(event.second)||0));
      return '<b>Let-down</b><span class="ps-event-detail">'+side+' #'+number+' · '+Math.floor(at/60)+':'+String(at%60).padStart(2,'0')+' · peak '+Number(event.peak||0).toFixed(1)+' mL/min</span>';
    }
    function count(side){return s.reviewFrozen?3:events.filter(function(item){return item.type==='start'&&item.side===side}).length;}
    return '<b>Let-down</b><span data-ps-detail="l"><i class="ps-side-line"></i>Left <strong data-ps-count="l">'+count('l')+'</strong></span><em></em><span data-ps-detail="r"><i class="ps-side-line is-dashed"></i>Right <strong data-ps-count="r">'+count('r')+'</strong></span>';
  }
  function chart(s) {
    var samples = s.reviewFrozen ? null : s.psFlowSamples;
    var useLive = Array.isArray(samples) && samples.length > 0;
    var end = useLive ? Math.max(1,Number(samples[samples.length-1].second)||0) : Math.max(1,Number(s.timer)||0);
    function speedZone(y) { return y > 394 ? 'low' : y > 346 ? 'medium' : 'high'; }
    function livePath(side) {
      return samples.map(function(sample, i) {
        var x = 42 + Math.min(1, Math.max(0, sample.second / end)) * 333;
        var y = 442 - Math.min(15, Math.max(0, Number(sample[side]) || 0) * 60) / 15 * 144;
        return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }).join(' ');
    }
    var shortRun = !s.reviewFrozen && end < 180;
    var labels = [0, 1, 2, 3, 4].map(function (n, i) { var value=n*(s.reviewFrozen?24:end/(shortRun?1:60))/4;return '<text x="' + (42 + i * 83.25) + '" y="460" text-anchor="middle">' + (shortRun?Math.round(value):value.toFixed(end<600&&!s.reviewFrozen?1:0)) + '</text>'; }).join('');
    var events = Array.isArray(s.air2LetdownEvents) ? s.air2LetdownEvents : [];
    function markers(side, fallback) {
      if (!useLive) return s.reviewFrozen ? fallback.map(function (p, i) { return '<g class="ps-marker ps-marker-'+side+' ps-zone-'+speedZone(p[1]+12)+'"><circle cx="'+p[0]+'" cy="'+p[1]+'" r="6"/><text x="'+p[0]+'" y="'+(p[1]+3)+'">'+(i+1)+'</text></g>'; }).join('') : '';
      return events.map(function(event,index){return {event:event,index:index}}).filter(function(item){return item.event.type==='start'&&item.event.side===side}).map(function(item,i){
        var event=item.event,second=Math.max(0,Number(event.peakSecond)||Number(event.second)||0),x=42+Math.min(1,second/end)*333;
        var sample=samples.reduce(function(best,point){return Math.abs(point.second-second)<Math.abs(best.second-second)?point:best},samples[0]);
        var y=430-Math.min(15,Math.max(0,Number(sample[side])||0)*60)/15*144;
        return '<g class="ps-marker ps-marker-'+side+' ps-zone-'+speedZone(y+12)+(selectedLetdownIndex===item.index?' is-selected':'')+'" role="button" tabindex="0" data-ps-event="'+item.index+'" aria-label="'+(side==='l'?'Left':'Right')+' let-down '+(i+1)+'"><circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="7"/><text x="'+x.toFixed(1)+'" y="'+(y+3).toFixed(1)+'">'+(i+1)+'</text></g>';
      }).join('');
    }
    return '<svg class="ps-chart" viewBox="0 282 390 195" role="img" aria-label="Milk flow over time: blue below 5, teal from 5 to below 10, orange at 10 mL per minute or above; left solid, right dashed"><defs><linearGradient id="ps-flow-zones" gradientUnits="userSpaceOnUse" x1="0" y1="442" x2="0" y2="298"><stop offset="0%" stop-color="#5B8FD9"/><stop offset="33.333%" stop-color="#5B8FD9"/><stop offset="33.333%" stop-color="#379D89"/><stop offset="66.667%" stop-color="#379D89"/><stop offset="66.667%" stop-color="#E6A044"/><stop offset="100%" stop-color="#E6A044"/></linearGradient></defs><g class="ps-chart-grid"><path d="M42 298H375M42 346H375M42 394H375"/></g><g class="ps-chart-axis"><path d="M42 294V442H375M42 442V446M125.25 442V446M208.5 442V446M291.75 442V446M375 442V446"/></g><g class="ps-chart-labels"><text x="34" y="302" text-anchor="end">15</text><text x="34" y="350" text-anchor="end">10</text><text x="34" y="398" text-anchor="end">5</text><text x="34" y="446" text-anchor="end">0</text>'+labels+'<text x="375" y="475" text-anchor="end">Time ('+(shortRun?'sec':'min')+')</text></g><path class="ps-flow-l" d="'+(useLive?livePath('l'):s.reviewFrozen?chartPaths.l:'')+'"/><path class="ps-flow-r" d="'+(useLive?livePath('r'):s.reviewFrozen?chartPaths.r:'')+'"/>'+markers('l',[[86,334],[196,351],[305,369]])+markers('r',[[108,305],[215,315],[325,357]])+'</svg>';
  }
  function render() {
    var s = state, left = Math.max(0, Number(s.milkL) || 0), right = Math.max(0, Number(s.milkR) || 0);
    var started = s.air2SessionStartedAt || (Date.now() - Math.max(0, Number(s.timer) || 0) * 1000);
    var date = new Date(started).toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
    var problem = s.air2SessionSummaryKind === 'severe' ? 'Significant air leak detected' : s.air2SessionSummaryKind === 'wear' ? 'Pump fit issue detected' : '';
    return '<div class="v4-overlay ps-overlay"><section class="v4-log ps-sheet" data-filter="'+activeFilter+'" aria-label="Pumping record">' +
      '<header class="ps-header"><button class="ps-icon-button" type="button" data-v4="control" aria-label="Close">'+icon('close')+'</button><div><h1>Pumping Record</h1><span>'+date+'</span></div><button class="ps-icon-button" type="button" data-ps="delete" aria-label="Delete record">'+icon('trash')+'</button></header>'+
      '<div class="ps-total"><span>Total milk</span><strong data-ps-total>'+ (left + right).toFixed(1) +'</strong><span>oz</span></div>'+
      '<div class="ps-sides">'+['l','r'].map(function(side){var value=side==='l'?left:right;return '<button class="ps-side" type="button" data-ps="milk" data-side="'+side+'"><i class="ps-dot ps-dot-'+side+'"></i><span>'+(side==='l'?'Left':'Right')+'</span><strong data-ps-value="'+side+'">'+value.toFixed(1)+'</strong><small>oz</small>'+icon('edit')+'</button>'}).join('')+'</div>'+
      '<section class="ps-process"><button class="ps-duration" type="button" data-ps="duration"><span>Duration</span><strong>'+duration(s.timer)+'</strong>'+icon('edit')+'</button><div class="ps-chart-head"><h2>Milk Flow</h2><div class="ps-filters" role="group" aria-label="Chart sides">'+[['all','All',''],['l','Left','<i class="ps-side-line"></i>'],['r','Right','<i class="ps-side-line is-dashed"></i>']].map(function(item){return '<button class="'+(activeFilter===item[0]?'is-active':'')+'" type="button" data-ps-filter="'+item[0]+'" aria-pressed="'+(activeFilter===item[0])+'">'+item[2]+item[1]+'</button>'}).join('')+'</div></div><div class="ps-rate"><span>Flow rate (mL/min)</span><span class="ps-speed-key" aria-label="Color shows flow speed, not health status"><i class="ps-speed-low"></i>&lt;5 <i class="ps-speed-medium"></i>5–&lt;10 <i class="ps-speed-high"></i>≥10</span></div>'+chart(s)+'<div class="ps-letdown">'+letdownSummary(s)+'</div></section>'+
      (problem?'<button class="ps-leak-note mc-severe-log-note" type="button" data-mc="log">'+icon('alert')+'<span>'+problem+'</span><u>Troubleshoot</u><b>›</b></button>':'')+
      '<button class="ps-save" type="button" data-v4="save">Confirm &amp; Save</button></section></div>';
  }
  window.v4Log = v4Log = render;
  if (state.reviewFrozen && state.reviewScreenId === 'log-amount') {
    state.milkL = 1.7;
    state.milkR = 2.2;
    state.timer = 24 * 60 + 36;
    state.air2SessionSummaryKind = 'severe';
    root.innerHTML = v4Control() + render();
  }
  document.addEventListener('click', function(event) {
    var marker=event.target.closest('#demo [data-ps-event]');
    if(marker){
      event.preventDefault();event.stopImmediatePropagation();
      selectedLetdownIndex=Number(marker.dataset.psEvent);
      var card=marker.closest('.ps-sheet');
      card.querySelector('.ps-letdown').innerHTML=letdownSummary(state);
      card.querySelectorAll('[data-ps-event]').forEach(function(item){item.classList.toggle('is-selected',item===marker)});
      return;
    }
    var button = event.target.closest('#demo [data-ps], #demo [data-ps-filter]');
    if (!button) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (button.dataset.psFilter) {
      var filter = button.dataset.psFilter, sheet = button.closest('.ps-sheet');
      activeFilter = filter;
      sheet.dataset.filter = filter;
      sheet.querySelectorAll('[data-ps-filter]').forEach(function(item){var selected=item.dataset.psFilter===filter;item.classList.toggle('is-active',selected);item.setAttribute('aria-pressed',String(selected))});
      if(selectedLetdownIndex!=null){var selectedEvent=(state.air2LetdownEvents||[])[selectedLetdownIndex];if(!selectedEvent||(filter!=='all'&&selectedEvent.side!==filter)){selectedLetdownIndex=null;sheet.querySelector('.ps-letdown').innerHTML=letdownSummary(state);sheet.querySelectorAll('[data-ps-event]').forEach(function(item){item.classList.remove('is-selected')})}}
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
  document.addEventListener('keydown', function(event){
    if(event.key!=='Enter'&&event.key!==' ')return;
    var marker=event.target.closest&&event.target.closest('#demo [data-ps-event]');
    if(marker){event.preventDefault();marker.dispatchEvent(new MouseEvent('click',{bubbles:true}));}
  }, true);
}());
