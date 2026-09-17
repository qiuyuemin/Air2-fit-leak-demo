/* DEMO_STUDIO_INSPECTOR_V4 */
(() => {
  if (window.__demoStudioInspector) return;
  window.__demoStudioInspector = true;

  const STORE = "demo-studio-captures";
  let mode = null, latest = null, start = null;

  const freezeStyle = document.createElement("style");
  freezeStyle.textContent = "html.demo-studio-freeze *,html.demo-studio-freeze *::before,html.demo-studio-freeze *::after{animation-play-state:paused!important;transition:none!important;scroll-behavior:auto!important}";
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;z-index:2147483645;pointer-events:none;border:2px solid #675ff3;background:#675ff31a;display:none;box-sizing:border-box";
  const regionLayer = document.createElement("div");
  regionLayer.style.cssText = "position:fixed;inset:0;z-index:2147483644;cursor:crosshair;display:none;background:transparent;touch-action:none";
  const panel = document.createElement("aside");
  panel.style.cssText = "position:fixed;z-index:2147483647;left:12px;bottom:12px;max-width:min(560px,calc(100vw - 24px));padding:10px 12px;border-radius:10px;background:#202127;color:white;font:600 12px/1.45 system-ui;box-shadow:0 10px 30px #0004;display:none;pointer-events:auto";
  panel.innerHTML = '<div data-ds-summary></div><div data-ds-actions style="display:none;gap:7px;margin-top:9px"><button data-ds-copy style="border:0;border-radius:6px;padding:6px 10px;background:#6b63f5;color:#fff;font:600 12px system-ui;cursor:pointer">复制组件信息</button><button data-ds-close style="border:1px solid #ffffff2c;border-radius:6px;padding:6px 10px;background:#ffffff10;color:#fff;font:600 12px system-ui;cursor:pointer">关闭</button></div>';
  const summary = panel.querySelector("[data-ds-summary]");
  const actions = panel.querySelector("[data-ds-actions]");
  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.textContent = "⌗ 定位";
  launcher.setAttribute("aria-label", "开启组件定位");
  launcher.style.cssText = "position:fixed;z-index:2147483646;right:12px;bottom:12px;border:0;border-radius:999px;padding:9px 13px;background:#202127;color:#fff;font:600 12px system-ui;box-shadow:0 8px 24px #0003;cursor:pointer";
  document.documentElement.append(freezeStyle, regionLayer, overlay, panel, launcher);

  const selector = element => {
    if (!(element instanceof Element)) return "";
    if (element.id) return `#${CSS.escape(element.id)}`;
    for (const attr of ["data-testid", "data-action", "data-component"]) {
      const value = element.getAttribute(attr); if (value) return `[${attr}="${CSS.escape(value)}"]`;
    }
    const parts = []; let node = element;
    while (node && node !== document.body && parts.length < 5) {
      let part = node.tagName.toLowerCase();
      const useful = [...node.classList].filter(name => !/^(active|selected|hover|focus|open|is-)/.test(name)).slice(0, 2);
      if (useful.length) part += useful.map(name => `.${CSS.escape(name)}`).join("");
      else if (node.parentElement) part += `:nth-child(${[...node.parentElement.children].indexOf(node) + 1})`;
      parts.unshift(part); node = node.parentElement;
    }
    return parts.join(" > ");
  };

  const typeName = type => {
    if (!type) return null;
    if (typeof type === "function") return type.displayName || type.name || null;
    if (typeof type === "object") return type.displayName || type.name || type.render?.displayName || type.render?.name || null;
    return null;
  };
  const componentInfo = element => {
    let node = element;
    while (node instanceof Element) {
      const fiberKey = Object.keys(node).find(key => key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$"));
      if (fiberKey) {
        const names = []; let fiber = node[fiberKey];
        while (fiber && names.length < 10) {
          const name = typeName(fiber.elementType || fiber.type);
          if (name && !names.includes(name)) names.push(name);
          fiber = fiber.return;
        }
        if (names.length) return { framework: "React", name: names[0], hierarchy: [...names].reverse() };
      }
      const vue = node.__vueParentComponent;
      if (vue) {
        const names = []; let current = vue;
        while (current && names.length < 10) {
          const name = current.type?.name || current.type?.__name || current.type?.displayName;
          if (name && !names.includes(name)) names.push(name);
          current = current.parent;
        }
        if (names.length) return { framework: "Vue", name: names[0], hierarchy: [...names].reverse() };
      }
      node = node.parentElement;
    }
    const declared = element.closest?.("[data-component]")?.getAttribute("data-component");
    if (declared) return { framework: "DOM", name: declared, hierarchy: [declared] };
    const custom = element.closest?.("*")?.tagName?.toLowerCase();
    return { framework: custom?.includes("-") ? "Web Component" : "DOM", name: custom || "unknown", hierarchy: custom ? [custom] : [] };
  };

  const semanticBoundary = element => {
    if (!(element instanceof Element)) return element;
    const explicit = element.closest('[data-component], [role="dialog"], [role="region"], dialog, [aria-modal="true"]');
    if (explicit) return explicit;
    let node = element;
    while (node && node !== document.body && node !== document.documentElement) {
      const hint = `${node.tagName} ${node.id} ${node.className}`;
      const rect = node.getBoundingClientRect();
      if (/(?:fit|card|panel|sheet|modal|drawer|overlay|popover|dialog|dock)/i.test(hint) && rect.width >= 120 && rect.height >= 80) return node;
      node = node.parentElement;
    }
    return element;
  };
  const inferredName = element => {
    const declared = element?.getAttribute?.("data-component") || element?.getAttribute?.("aria-label");
    const heading = element?.querySelector?.("h1,h2,h3,[data-title],header strong")?.textContent?.replace(/\s+/g, " ").trim();
    const classHint = [...(element?.classList || [])].find(name => /(?:fit|card|panel|sheet|modal|drawer|dock)/i.test(name));
    return declared || heading || classHint || null;
  };

  const textOf = element => (element?.getAttribute?.("aria-label") || element?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 180);
  const context = () => ({ url: location.href, title: document.title, viewportSize: { width: innerWidth, height: innerHeight }, pageState: { html: { ...document.documentElement.dataset }, body: { ...document.body.dataset }, query: Object.fromEntries(new URLSearchParams(location.search)) }, capturedAt: new Date().toISOString() });
  const attributesOf = element => {
    if (!(element instanceof Element)) return {};
    return Object.fromEntries([...element.attributes].filter(attr => /^(aria-|data-|role$|name$|type$)/.test(attr.name)).slice(0, 16).map(attr => [attr.name, attr.value]));
  };
  const copyLatest = async () => {
    if (!latest) return;
    const value = JSON.stringify(latest, null, 2);
    try { await navigator.clipboard.writeText(value); }
    catch { const area = document.createElement("textarea"); area.value = value; document.body.append(area); area.select(); document.execCommand("copy"); area.remove(); }
    summary.textContent = "组件信息已复制，可直接粘贴给 AI";
  };
  const showResult = item => {
    latest = item; panel.style.display = "block"; actions.style.display = "flex";
    summary.textContent = `组件：${item.component?.name || "未识别"} · ${item.selector || "区域"} · (${item.viewport.x}, ${item.viewport.y}) ${item.viewport.width}×${item.viewport.height}`;
  };
  const persist = item => {
    const items = JSON.parse(localStorage.getItem(STORE) || "[]"); items.push(item);
    localStorage.setItem(STORE, JSON.stringify(items)); showResult(item);
  };
  const draw = rect => Object.assign(overlay.style, { display: "block", left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  const stop = ({ keepPanel = false } = {}) => {
    mode = null; start = null; regionLayer.style.display = "none"; overlay.style.display = "none"; document.documentElement.classList.remove("demo-studio-freeze");
    if (!keepPanel) panel.style.display = "none";
  };
  const begin = nextMode => {
    stop(); mode = nextMode; document.documentElement.classList.add("demo-studio-freeze"); panel.style.display = "block"; actions.style.display = "none";
    summary.textContent = nextMode === "region" ? "区域框选：拖拽任意范围 · Esc 退出" : "元素定位：移动鼠标并点击 · Esc 退出";
    regionLayer.style.display = nextMode === "region" ? "block" : "none";
  };
  const elementCapture = element => {
    element = semanticBoundary(element);
    const rect = element.getBoundingClientRect();
    const component = componentInfo(element); component.name = inferredName(element) || component.name;
    return { kind: "element", component, selector: selector(element), tag: element.tagName.toLowerCase(), role: element.getAttribute("role"), text: textOf(element), attributes: attributesOf(element), viewport: { x: Math.round(rect.left), y: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) }, page: { x: Math.round(rect.left + scrollX), y: Math.round(rect.top + scrollY) }, ...context() };
  };

  launcher.addEventListener("click", () => mode === "element" ? stop() : begin("element"));
  panel.querySelector("[data-ds-copy]").addEventListener("click", copyLatest);
  panel.querySelector("[data-ds-close]").addEventListener("click", () => stop());
  document.addEventListener("mousemove", event => {
    if (mode !== "element" || !(event.target instanceof Element) || panel.contains(event.target) || event.target === overlay || event.target === regionLayer) return;
    draw(semanticBoundary(event.target).getBoundingClientRect());
  }, true);
  document.addEventListener("click", event => {
    if (panel.contains(event.target)) return;
    if (mode !== "element" || !(event.target instanceof Element)) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); persist(elementCapture(event.target)); stop({ keepPanel: true });
  }, true);
  regionLayer.addEventListener("pointerdown", event => { event.preventDefault(); start = { x: event.clientX, y: event.clientY }; regionLayer.setPointerCapture(event.pointerId); draw({ left: start.x, top: start.y, width: 0, height: 0 }); });
  regionLayer.addEventListener("pointermove", event => { if (!start) return; draw({ left: Math.min(start.x, event.clientX), top: Math.min(start.y, event.clientY), width: Math.abs(event.clientX - start.x), height: Math.abs(event.clientY - start.y) }); });
  regionLayer.addEventListener("pointerup", event => {
    if (!start) return;
    const left = Math.min(start.x, event.clientX), top = Math.min(start.y, event.clientY), width = Math.abs(event.clientX - start.x), height = Math.abs(event.clientY - start.y);
    regionLayer.style.display = "none"; overlay.style.display = "none";
    const center = semanticBoundary(document.elementFromPoint(left + width / 2, top + height / 2));
    if (width >= 4 && height >= 4) {
      const component = componentInfo(center); component.name = inferredName(center) || component.name;
      const componentRect = center?.getBoundingClientRect?.();
      persist({ kind: "region", component, selector: selector(center), tag: center?.tagName?.toLowerCase() || null, text: textOf(center), attributes: attributesOf(center), viewport: { x: Math.round(left), y: Math.round(top), width: Math.round(width), height: Math.round(height) }, componentViewport: componentRect ? { x: Math.round(componentRect.left), y: Math.round(componentRect.top), width: Math.round(componentRect.width), height: Math.round(componentRect.height) } : null, page: { x: Math.round(left + scrollX), y: Math.round(top + scrollY) }, ...context() });
    }
    stop({ keepPanel: width >= 4 && height >= 4 });
  });
  document.addEventListener("keydown", event => {
    if (event.altKey && event.shiftKey && event.code === "KeyD") { event.preventDefault(); mode === "element" ? stop() : begin("element"); }
    if (event.altKey && event.shiftKey && event.code === "KeyR") { event.preventDefault(); mode === "region" ? stop() : begin("region"); }
    if (event.key === "Escape") stop();
    if (event.altKey && event.shiftKey && event.code === "KeyC" && latest) { event.preventDefault(); void copyLatest(); }
  }, true);
})();
