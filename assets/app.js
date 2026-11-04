// UI wiring for Dissonance Lab.
(() => {
  const $ = id => document.getElementById(id);

  // ---------------------------------------------------------------- tabs
  document.querySelectorAll("nav [data-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("nav [data-tab]").forEach(b => b.setAttribute("aria-selected", b === btn));
      document.querySelectorAll(".tab").forEach(s => s.classList.toggle("active", s.id === "tab-" + btn.dataset.tab));
      Synth.stop();
      if (btn.dataset.tab === "chords") drawChords();
      if (btn.dataset.tab === "curve") drawCurve();
    });
  });

  const fillSelect = (sel, obj, labelOf, value) => {
    sel.innerHTML = Object.entries(obj).map(([k, v]) => `<option value="${k}">${labelOf(v)}</option>`).join("");
    if (value) sel.value = value;
  };

  // Timbre recipes so the curve tab can vary #partials and stretch.
  const RECIPES = {
    sine: { n: 1, stretch: 2, amp: () => 1 },
    complex6: { n: 6, stretch: 2, amp: k => Math.pow(0.88, k - 1) },
    mellow: { n: 8, stretch: 2, amp: k => 1 / (k * k) },
    sawtooth: { n: 10, stretch: 2, amp: k => 1 / k },
    bright: { n: 12, stretch: 2, amp: k => 1 / Math.sqrt(k) },
    clarinet: { n: 6, stretch: 2, amp: k => 1 / k, odd: true },
    stretched: { n: 6, stretch: 2.1, amp: () => 1 },
  };
  function build(key, n, stretch) {
    const r = RECIPES[key], e = Math.log2(stretch), out = [];
    for (let k = 1; out.length < n; k++) {
      if (r.odd && k % 2 === 0) continue;
      out.push([Math.pow(k, e), r.amp(k)]);
    }
    return out;
  }

  const hzToNote = f => {
    const names = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
    const m = Math.round(69 + 12 * Math.log2(f / 440));
    return names[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  };
  const INTERVALS = ["P1", "m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7", "P8", "m9", "M9", "m10", "M10", "P11", "TT", "P12", "m13", "M13", "m14", "M14", "P15"];

  // ---------------------------------------------------------------- curve tab
  const c = { timbre: $("c-timbre"), model: $("c-model"), f0: $("c-f0"), n: $("c-n"), s: $("c-s"), range: $("c-range"), cmp: $("c-cmp") };
  fillSelect(c.timbre, Model.TIMBRES, v => v.label, "complex6");
  fillSelect(c.model, Model.MODELS, v => v, "sethares");

  function syncTimbreDefaults() {
    const r = RECIPES[c.timbre.value];
    c.n.value = r.n; c.s.value = r.stretch;
    c.n.disabled = c.timbre.value === "sine";
  }
  syncTimbreDefaults();

  let curveState = null;
  function drawCurve() {
    const f0 = +c.f0.value, n = +c.n.value, stretch = +c.s.value, rMax = +c.range.value, model = c.model.value;
    $("c-f0-val").textContent = `${f0} Hz (${hzToNote(f0)})`;
    $("c-n-val").textContent = n;
    $("c-s-val").textContent = stretch.toFixed(2) + (Math.abs(stretch - 2) < 1e-9 ? " (harmonic)" : "");
    const partials = build(c.timbre.value, n, stretch);
    const N = rMax > 3 ? 1200 : 700;
    const main = Model.curve(f0, partials, 1, rMax, N, model);
    const series = [];
    if (c.cmp.checked && c.timbre.value !== "sine") {
      const sine = Model.curve(f0, [[1, 1]], 1, rMax, N, model);
      // scale the sine curve to the same peak so shapes can be compared
      const k = Math.max(...main.ys) / Math.max(...sine.ys);
      series.push({ xs: sine.xs, ys: sine.ys.map(y => y * k), cls: "cmp" });
    }
    series.push({ ...main, cls: "main" });

    const mins = Model.localMinima(main.xs, main.ys);
    const marks = [];
    for (let k = 0; 2 ** (k / 12) <= rMax; k++) marks.push({ x: 2 ** (k / 12), cls: "et", label: k % 12 === 0 || [3, 4, 5, 7, 9].includes(k % 12) ? INTERVALS[k] : "", top: true });
    mins.forEach(x => marks.push({ x, cls: "min" }));

    const xTicks = [];
    for (let v = 1; v <= rMax + 1e-9; v += rMax > 3 ? 0.5 : 0.1) xTicks.push(+v.toFixed(2));
    Plot.line($("c-chart"), series, {
      marks, xTicks, xLabel: "frequency ratio of upper to lower note", yLabel: "roughness",
      xFmt: v => v.toFixed(rMax > 3 ? 1 : 1),
      tip: x => `ratio ${x.toFixed(3)} · ${(1200 * Math.log2(x)).toFixed(0)} cents · R=${Model.roughness(Model.chord([f0, f0 * x], partials), model).toFixed(3)}`,
      onClick: x => Synth.play(Model.chord([f0, f0 * x], partials), 1.4),
    });

    $("c-minima").innerHTML = "";
    mins.forEach(x => {
      const nr = Model.nearestRatio(x);
      const cents = 1200 * Math.log2(x);
      const semis = Math.round(cents / 100);
      const b = document.createElement("button");
      b.className = "chip";
      const just = nr.cents < 12 ? `≈ ${nr.p}/${nr.q}` : "no simple ratio";
      b.innerHTML = `<strong>${x.toFixed(3)}</strong> · ${cents.toFixed(0)}¢ <span>${just} · nearest ${INTERVALS[semis] || semis + " st"} (${(cents - semis * 100 >= 0 ? "+" : "") + (cents - semis * 100).toFixed(0)}¢)</span>`;
      b.onclick = () => Synth.play(Model.chord([f0, f0 * x], partials), 1.4);
      $("c-minima").appendChild(b);
    });
    if (!mins.length) $("c-minima").innerHTML = '<p class="hint">No local minima. With pure tones the curve is flat beyond the critical band, so the model ranks every wide interval as equally consonant.</p>';
    $("c-hint").textContent = `${partials.length} partial${partials.length > 1 ? "s" : ""}: ` + partials.slice(0, 8).map(([r, a]) => `${r.toFixed(2)}×(${a.toFixed(2)})`).join("  ") + (partials.length > 8 ? " …" : "");
    curveState = { f0, partials, model };
  }
  c.timbre.addEventListener("change", () => { syncTimbreDefaults(); drawCurve(); });
  [c.model, c.range, c.cmp].forEach(e => e.addEventListener("change", drawCurve));
  [c.f0, c.n, c.s].forEach(e => e.addEventListener("input", drawCurve));

  // ---------------------------------------------------------------- chord tab
  const h = { notes: $("h-notes"), preset: $("h-preset"), model: $("h-model") };
  fillSelect(h.model, Model.MODELS, v => v, "sethares");
  h.preset.addEventListener("change", () => { h.notes.value = h.preset.value; drawChords(); });
  h.notes.addEventListener("input", drawChords);
  h.model.addEventListener("change", drawChords);

  function parseNotes() {
    const toks = h.notes.value.split(/[\s,]+/).filter(Boolean);
    const freqs = toks.map(t => (/^\d+(\.\d+)?$/.test(t) ? +t : Model.noteToHz(t)));
    const bad = toks.filter((t, i) => !isFinite(freqs[i]));
    return { freqs: freqs.filter(isFinite), bad };
  }

  function drawChords() {
    const { freqs, bad } = parseNotes();
    $("h-err").textContent = bad.length ? `Couldn't read: ${bad.join(", ")}. Use note names like C4, F#3, Bb2, or frequencies in Hz.` : "";
    if (freqs.length < 1) return;
    const order = ["sine", "mellow", "clarinet", "complex6", "sawtooth", "stretched", "bright"];
    const data = order.map(k => ({ key: k, label: Model.TIMBRES[k].label.split(" (")[0].split(",")[0], value: Model.roughness(Model.chord(freqs, Model.TIMBRES[k].partials), h.model.value) }));
    Plot.bars($("h-chart"), data, { yLabel: "total roughness", bottom: 80 });
    $("h-play").innerHTML = "";
    data.forEach(d => {
      const b = document.createElement("button");
      b.className = "chip";
      b.innerHTML = `▶ ${Model.TIMBRES[d.key].label}`;
      b.onclick = () => Synth.play(Model.chord(freqs, Model.TIMBRES[d.key].partials), 2);
      $("h-play").appendChild(b);
    });
  }

  // ---------------------------------------------------------------- experiment
  const DYADS = [
    ["m2", 1, 12], ["M2", 2, 10], ["m3", 3, 7], ["M3", 4, 4], ["P4", 5, 5], ["TT", 6, 8],
    ["P5", 7, 2], ["m6", 8, 6], ["M6", 9, 3], ["m7", 10, 9], ["M7", 11, 11], ["P8", 12, 1],
  ]; // [name, semitones, Malmberg 1918 rank]
  const x = { timbre: $("x-timbre"), reps: $("x-reps"), pid: $("x-pid"), train: $("x-train") };
  fillSelect(x.timbre, Model.TIMBRES, v => v.label, "sawtooth");
  let exp = null;

  const spectrumFor = t => Model.chord([t.root, t.root * 2 ** (t.semis / 12)], Model.TIMBRES[exp.timbre].partials);

  $("x-test").onclick = () => Synth.play(Model.chord([262, 330], Model.TIMBRES[x.timbre.value].partials), 1.5);
  $("x-start").onclick = () => {
    Synth.ensure();
    const reps = +x.reps.value;
    const trials = [];
    for (let r = 0; r < reps; r++) for (const [name, semis] of DYADS) {
      // random root between A3 and F4 so absolute pitch can't cue the interval
      trials.push({ interval: name, semis, root: 220 * 2 ** (Math.random() * 8 / 12) });
    }
    for (let i = trials.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [trials[i], trials[j]] = [trials[j], trials[i]]; }
    exp = { trials, i: 0, timbre: x.timbre.value, pid: x.pid.value.trim() || "anon-" + Date.now().toString(36), train: +x.train.value || 0, started: new Date().toISOString() };
    $("x-intro").hidden = true; $("x-done").hidden = true; $("x-trial").hidden = false;
    runTrial();
  };

  const scale = $("x-scale");
  for (let v = 1; v <= 7; v++) {
    const b = document.createElement("button");
    b.textContent = v; b.className = "rate"; b.disabled = true;
    b.onclick = () => respond(v);
    scale.appendChild(b);
  }
  const setRating = on => scale.querySelectorAll("button").forEach(b => (b.disabled = !on));

  async function runTrial() {
    const t = exp.trials[exp.i];
    $("x-count").textContent = `Trial ${exp.i + 1} of ${exp.trials.length}`;
    $("x-bar").style.width = `${(100 * exp.i) / exp.trials.length}%`;
    setRating(false);
    await Synth.play(spectrumFor(t), 1.5);
    setRating(true);
    t.shown = performance.now();
  }
  $("x-replay").onclick = () => exp && Synth.play(spectrumFor(exp.trials[exp.i]), 1.5);

  function respond(v) {
    const t = exp.trials[exp.i];
    if (!t.shown) return;
    t.rating = v; t.rt = Math.round(performance.now() - t.shown);
    exp.i++;
    if (exp.i < exp.trials.length) setTimeout(runTrial, 350);
    else finish();
  }
  document.addEventListener("keydown", e => {
    if ($("x-trial").hidden || !exp) return;
    if (/^[1-7]$/.test(e.key) && !scale.querySelector("button").disabled) respond(+e.key);
    if (e.key.toLowerCase() === "r") $("x-replay").click();
  });

  function ranks(a) {
    const idx = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]);
    const r = new Array(a.length);
    for (let i = 0; i < idx.length;) {
      let j = i;
      while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
      for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2 + 1;
      i = j + 1;
    }
    return r;
  }
  function pearson(a, b) {
    const n = a.length, ma = a.reduce((s, v) => s + v, 0) / n, mb = b.reduce((s, v) => s + v, 0) / n;
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
    return da && db ? num / Math.sqrt(da * db) : NaN;
  }
  const spearman = (a, b) => pearson(ranks(a), ranks(b));

  function finish() {
    $("x-trial").hidden = true; $("x-done").hidden = false;
    $("x-bar").style.width = "100%";
    const means = DYADS.map(([name]) => {
      const rs = exp.trials.filter(t => t.interval === name).map(t => t.rating);
      return rs.reduce((s, v) => s + v, 0) / rs.length;
    });
    const partials = Model.TIMBRES[exp.timbre].partials, f0 = Model.noteToHz("C4");
    const pred = DYADS.map(([, s]) => -Model.roughness(Model.chord([f0, f0 * 2 ** (s / 12)], partials), "sethares"));
    const malm = DYADS.map(d => -d[2]);
    const rhoModel = spearman(means, pred), rhoMalm = spearman(means, malm);
    const fmtR = r => (isFinite(r) ? r.toFixed(2) : "n/a");
    $("x-stats").innerHTML = `
      <div><span>${fmtR(rhoModel)}</span>Spearman ρ, your ratings vs. model (Sethares, ${Model.TIMBRES[exp.timbre].label})</div>
      <div><span>${fmtR(rhoMalm)}</span>Spearman ρ, your ratings vs. Malmberg (1918) ranking</div>
      <div><span>${fmtR(spearman(pred, malm))}</span>Spearman ρ, model vs. Malmberg (1918)</div>`;
    // rescale model prediction onto the 1-7 axis for display
    const pMin = Math.min(...pred), pMax = Math.max(...pred);
    const predScaled = pred.map(p => 1 + (6 * (p - pMin)) / (pMax - pMin || 1));
    const box = $("x-chart");
    Plot.bars(box, DYADS.map(([name], i) => ({ label: name, value: means[i] })), { yLabel: "mean rating (1-7)", yMax: 7, bottom: 50 });
    // overlay model line on the bar chart
    const svg = box.querySelector("svg"), g = svg.querySelector("g");
    const H = 300 - 14 - 50, W = 860 - 56 - 16, bw = W / DYADS.length, sy = v => H - (v / 7.7) * H;
    const d = predScaled.map((v, i) => `${i ? "L" : "M"}${(i + 0.5) * bw},${sy(v)}`).join("");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d); path.setAttribute("class", "series main");
    g.appendChild(path);
    exp.summary = { means, pred };
  }

  $("x-dl").onclick = () => {
    const head = "participant,training_years,timbre,trial,interval,semitones,root_hz,rating,rt_ms,started";
    const rows = exp.trials.map((t, i) => [exp.pid, exp.train, exp.timbre, i + 1, t.interval, t.semis, t.root.toFixed(2), t.rating, t.rt, exp.started].join(","));
    const blob = new Blob([head + "\n" + rows.join("\n") + "\n"], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dissonance_${exp.pid.replace(/[^\w-]/g, "_")}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $("x-again").onclick = () => { $("x-done").hidden = true; $("x-intro").hidden = false; };

  drawCurve();
})();
