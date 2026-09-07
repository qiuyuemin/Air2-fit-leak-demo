(function () {
  var designWidth = 402, designHeight = 874;
  var demo = document.getElementById('demo');
  if (!demo || demo.parentElement.id === 'air2-phone-shell') return;

  var shell = document.createElement('main');
  shell.id = 'air2-phone-shell';
  demo.parentNode.insertBefore(shell, demo);
  shell.appendChild(demo);

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function layout() {
    document.documentElement.classList.toggle('air2-standalone', isStandalone());
    shell.dataset.displayMode = isStandalone() ? 'standalone' : 'browser';
    var viewport = window.visualViewport;
    var viewportWidth = viewport ? viewport.width : document.documentElement.clientWidth;
    var viewportHeight = viewport ? viewport.height : document.documentElement.clientHeight;
    /* One immutable 402 × 874 canvas everywhere. Desktop never enlarges it;
       smaller phones only scale the complete canvas down proportionally. */
    var scale = Math.max(.1, Math.min(1, viewportWidth / designWidth, viewportHeight / designHeight));
    shell.style.setProperty('--air2-scale', String(scale));
    shell.style.setProperty('--air2-shell-width', (designWidth * scale) + 'px');
    shell.style.setProperty('--air2-shell-height', (designHeight * scale) + 'px');
    shell.style.setProperty('--air2-canvas-height', designHeight + 'px');
  }

  layout();
  window.addEventListener('resize', layout, {passive:true});
  window.addEventListener('orientationchange', layout, {passive:true});
  if (window.visualViewport) window.visualViewport.addEventListener('resize', layout, {passive:true});
}());
