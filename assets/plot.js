// Tiny dependency-free SVG charts.
const Plot = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  };
  const fmt = v => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));

  function frame(container, { width = Math.max(340, Math.min(860, (container.clientWidth || 860) - 20)), height = 340, m = { l: 56, r: 16, t: 14, b: 44 } } = {}) {
    if (width < 600) height = Math.round(height * 0.85);
    container.innerHTML = "";
    const svg = el("svg", { viewBox: `0 0 ${width} ${height}`, class: "chart", role: "img" }, container);
    return { svg, W: width - m.l - m.r, H: height - m.t - m.b, m, width, height };
  }

  function axes(f, xMin, xMax, yMin, yMax, { xTicks, yTicks = 5, xLabel = "", yLabel = "", xFmt = fmt } = {}) {
    const { svg, W, H, m } = f;
    const g = el("g", { transform: `translate(${m.l},${m.t})` }, svg);
    const sx = x => ((x - xMin) / (xMax - xMin)) * W;
    const sy = y => H - ((y - yMin) / (yMax - yMin || 1)) * H;
    for (let i = 0; i <= yTicks; i++) {
      const v = yMin + ((yMax - yMin) * i) / yTicks;
      el("line", { x1: 0, x2: W, y1: sy(v), y2: sy(v), class: "gl" }, g);
      el("text", { x: -8, y: sy(v) + 4, class: "tick", "text-anchor": "end" }, g).textContent = fmt(v);
    }
    (xTicks || []).forEach(v => {
      el("text", { x: sx(v), y: H + 18, class: "tick", "text-anchor": "middle" }, g).textContent = xFmt(v);
    });
    el("line", { x1: 0, x2: W, y1: H, y2: H, class: "axis" }, g);
    el("text", { x: W / 2, y: H + 38, class: "label", "text-anchor": "middle" }, g).textContent = xLabel;
    el("text", { x: -H / 2, y: -42, class: "label", "text-anchor": "middle", transform: "rotate(-90)" }, g).textContent = yLabel;
    return { g, sx, sy };
  }

  // series: [{xs, ys, cls}] ; marks: [{x, label, cls}]
  function line(container, series, opts = {}) {
    const f = frame(container, opts);
    const all = series.flatMap(s => s.ys);
    const xMin = opts.xMin ?? Math.min(...series[0].xs), xMax = opts.xMax ?? Math.max(...series[0].xs);
    const yMax = opts.yMax ?? Math.max(...all) * 1.05;
    const { g, sx, sy } = axes(f, xMin, xMax, 0, yMax, opts);
    (opts.marks || []).forEach(mk => {
      el("line", { x1: sx(mk.x), x2: sx(mk.x), y1: 0, y2: f.H, class: mk.cls || "mark" }, g);
      if (mk.label) {
        el("text", { x: sx(mk.x), y: mk.top ? -2 : 10, class: "marklabel " + (mk.cls || ""), "text-anchor": "middle" }, g).textContent = mk.label;
      }
    });
    series.forEach(s => {
      const d = s.xs.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(s.ys[i]).toFixed(1)}`).join("");
      el("path", { d, class: "series " + (s.cls || "") }, g);
    });
    // hover + click layer
    const cursor = el("line", { y1: 0, y2: f.H, class: "cursor", visibility: "hidden" }, g);
    const tip = el("text", { y: 12, class: "tip", visibility: "hidden" }, g);
    const hit = el("rect", { x: 0, y: 0, width: f.W, height: f.H, fill: "transparent", style: "cursor:pointer" }, g);
    const toX = evt => {
      const pt = f.svg.createSVGPoint();
      pt.x = evt.clientX; pt.y = evt.clientY;
      const p = pt.matrixTransform(g.getScreenCTM().inverse());
      return xMin + (Math.max(0, Math.min(f.W, p.x)) / f.W) * (xMax - xMin);
    };
    hit.addEventListener("pointermove", e => {
      const x = toX(e);
      cursor.setAttribute("x1", sx(x)); cursor.setAttribute("x2", sx(x));
      cursor.setAttribute("visibility", "visible");
      tip.textContent = opts.tip ? opts.tip(x) : fmt(x);
      tip.setAttribute("x", Math.min(sx(x) + 6, f.W - 150));
      tip.setAttribute("visibility", "visible");
    });
    hit.addEventListener("pointerleave", () => { cursor.setAttribute("visibility", "hidden"); tip.setAttribute("visibility", "hidden"); });
    if (opts.onClick) hit.addEventListener("click", e => opts.onClick(toX(e)));
  }

  // bars: [{label, value, cls}]
  function bars(container, data, opts = {}) {
    const f = frame(container, { height: opts.height || 300, m: { l: 56, r: 16, t: 14, b: opts.bottom || 70 } });
    const yMax = (opts.yMax ?? Math.max(...data.map(d => d.value), 1e-9)) * 1.1;
    const { g, sy } = axes(f, 0, data.length, 0, yMax, { yLabel: opts.yLabel || "" });
    const bw = f.W / data.length;
    data.forEach((d, i) => {
      const x = i * bw + bw * 0.15;
      el("rect", { x, y: sy(d.value), width: bw * 0.7, height: f.H - sy(d.value), class: "bar " + (d.cls || ""), rx: 3 }, g);
      el("text", { x: x + bw * 0.35, y: sy(d.value) - 5, class: "tick", "text-anchor": "middle" }, g).textContent = fmt(d.value);
      const t = el("text", { x: x + bw * 0.35, y: f.H + 16, class: "tick", "text-anchor": "end", transform: `rotate(-30 ${x + bw * 0.35} ${f.H + 16})` }, g);
      t.textContent = d.label;
    });
  }

  return { line, bars };
})();
