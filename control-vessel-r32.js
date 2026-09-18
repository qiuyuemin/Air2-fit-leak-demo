/* Running-vessel renderer.  The base, liquid and droplets are separate layers. */
function c32Vessel(side,amount){
  var right=side==='r',raw=Math.max(0,Number(amount)||0);
  var level=Math.max(0,Math.min(94,Math.round(raw/AIR2_BOWL_CAPACITY_OZ*94)));
  var flow=state.paused?'paused':(state.flowKind||'none');
  var label=raw<=.02?'0 oz':raw.toFixed(1)+' oz';
  return `<div class="v4-pump c32-pump ${right?'right':''}"><span class="c32-vessel ${right?'c32-right':'c32-left'} c32-flow-${flow}"><img class="c32-base" src="./assets/figma-control-r32/vessel-${right?'r':'l'}.svg" alt="Milk container"><span class="c32-liquid-clip"><span class="c32-liquid" style="--liquid-height:${level}px;height:${level}px"><svg viewBox="0 0 100 18" preserveAspectRatio="none" aria-hidden="true"><path d="M0 9 Q12 3 25 9 T50 9 T75 9 T100 9 V18 H0Z"/></svg><i></i></span>${c32Drops(flow,right?'r':'l')}</span></span><span class="amount">${label}</span></div>`;
}
function c32Drops(flow,side){
  var count=flow==='low'?2:flow==='medium'?5:flow==='high'?10:0;
  var lanes=[48,24,70,37,61,15,82,31,55,75],offset=side==='r'?3:0;
  return count?`<span class="c32-drops c32-drops-${flow} c32-drops-${side}" data-flow-kind="${flow}">${Array.from({length:count},function(_,i){var lane=lanes[(i+offset)%lanes.length],delay=-(i*(flow==='high'?.09:flow==='medium'?.19:.72)+(side==='r'?.13:0));return `<img src="./assets/figma-control-r15/milk-drop.svg" style="--drop:${i};--drop-x:${lane}%;--drop-delay:${delay.toFixed(2)}s" alt="">`;}).join('')}</span>`:'';
}
v4Hardware=function(side,amount){return state.running?c32Vessel(side,amount):c15Hardware(side,amount);};
if(state.reviewFrozen&&String(state.reviewScreenId||'').startsWith('control-')){document.body.classList.remove('review-static');state.reviewFrozen=false;v4View=function(){root.innerHTML=v4Control();};view=v4View;}
if(String(state.reviewScreenId||'').startsWith('control-'))v4View();
