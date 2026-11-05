// UI wiring for Dissonance Lab.
(() => {
  const $ = id => document.getElementById(id);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ---------------------------------------------------------------- navigation
  function go(view) {
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === "v-" + view));
    document.querySelectorAll("nav [data-go]").forEach(b => b.classList.toggle("on", b.dataset.go === view));
    Synth.stop();
    if (view === "explore") drawCurve();
    if (view === "chords") drawChords();
    window.scrollTo({ top: 0, behavior: "smooth" });
    history.replaceState(null, "", view === "home" ? location.pathname : "#" + view);
  }
  document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); go(b.dataset.go); }));

  const fillSelect = (sel, obj, labelOf, value) => {
    sel.innerHTML = Object.entries(obj).map(([k, v]) => `<option value="${k}">${labelOf(v)}</option>`).join("");
    if (value) sel.value = value;
  };

  // play a spectrum and animate a .player button while it sounds
  async function playWith(btn, spectrum, dur) {
    if (btn) btn.classList.add("playing");
    await Synth.play(spectrum, dur);
    if (btn) btn.classList.remove("playing");
  }

  // ---------------------------------------------------------------- timbres
  const RECIPES = {
    sine: { n: 1, stretch: 2, amp: () => 1, short: "Pure tone", color: "var(--sky)" },
    mellow: { n: 8, stretch: 2, amp: k => 1 / (k * k), short: "Flute-ish", color: "var(--mint)" },
    clarinet: { n: 6, stretch: 2, amp: k => 1 / k, odd: true, short: "Clarinet-ish", color: "var(--butter)" },
    complex6: { n: 6, stretch: 2, amp: k => Math.pow(0.88, k - 1), short: "6 harmonics", color: "var(--lav)" },
    sawtooth: { n: 10, stretch: 2, amp: k => 1 / k, short: "String-ish", color: "var(--peach)" },
    stretched: { n: 6, stretch: 2.1, amp: () => 1, short: "Bell-ish (stretched)", color: "#f3a6c8" },
    bright: { n: 12, stretch: 2, amp: k => 1 / Math.sqrt(k), short: "Brassy", color: "#f08c7a" },
  };
  const ORDER = Object.keys(RECIPES);
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
  const INTERVALS = ["unison", "minor 2nd", "major 2nd", "minor 3rd", "major 3rd", "perfect 4th", "tritone", "perfect 5th", "minor 6th", "major 6th", "minor 7th", "major 7th", "octave",
    "minor 9th", "major 9th", "minor 10th", "major 10th", "11th", "aug 11th", "12th", "minor 13th", "major 13th", "minor 14th", "major 14th", "2 octaves"];
  const SHORT = ["P1", "m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7", "P8", "m9", "M9", "m10", "M10", "P11", "TT", "P12", "m13", "M13", "m14", "M14", "P15"];

  // ---------------------------------------------------------------- explore
  const c = { f0: $("c-f0"), model: $("c-model"), n: $("c-n"), s: $("c-s"), range: $("c-range"), cmp: $("c-cmp") };
  let timbre = "complex6";
  fillSelect(c.model, Model.MODELS, v => v, "sethares");

  const pillBox = $("c-timbres");
  ORDER.forEach(k => {
    const b = document.createElement("button");
    b.className = "pill" + (k === timbre ? " on" : "");
    b.innerHTML = `<i style="background:${RECIPES[k].color}"></i>${RECIPES[k].short}`;
    b.onclick = () => {
      timbre = k;
      pillBox.querySelectorAll(".pill").forEach(p => p.classList.toggle("on", p === b));
      syncTimbreDefaults(); drawCurve();
      const f0 = +c.f0.value;
      Synth.play(Model.tone(f0, build(k, +c.n.value, +c.s.value)), 0.8);
    };
    pillBox.appendChild(b);
  });
  function syncTimbreDefaults() {
    const r = RECIPES[timbre];
    c.n.value = r.n; c.s.value = r.stretch;
    c.n.disabled = timbre === "sine";
  }
  syncTimbreDefaults();

  function drawCurve() {
    const f0 = +c.f0.value, n = +c.n.value, stretch = +c.s.value, rMax = +c.range.value, model = c.model.value;
    $("c-f0-val").textContent = `${hzToNote(f0)} · ${f0} Hz`;
    $("c-n-val").textContent = n;
    $("c-s-val").textContent = stretch.toFixed(2) + (Math.abs(stretch - 2) < 1e-9 ? " (normal)" : "");
    const partials = build(timbre, n, stretch);
    const N = rMax > 3 ? 1200 : 700;
    const main = Model.curve(f0, partials, 1, rMax, N, model);
    const series = [];
    if (c.cmp.checked && timbre !== "sine") {
      const sine = Model.curve(f0, [[1, 1]], 1, rMax, N, model);
      const k = Math.max(...main.ys) / Math.max(...sine.ys);
      series.push({ xs: sine.xs, ys: sine.ys.map(y => y * k), cls: "cmp" });
    }
    series.push({ ...main, cls: "main" });

    const mins = Model.localMinima(main.xs, main.ys);
    const marks = [];
    for (let k = 0; 2 ** (k / 12) <= rMax; k++) marks.push({ x: 2 ** (k / 12), cls: "et", label: [0, 3, 4, 5, 7, 9, 12, 19, 24].includes(k) ? SHORT[k] : "", top: true });
    mins.forEach(x => marks.push({ x, cls: "min" }));

    const xTicks = [];
    for (let v = 1; v <= rMax + 1e-9; v += rMax > 3 ? 0.5 : 0.1) xTicks.push(+v.toFixed(2));
    Plot.line($("c-chart"), series, {
      marks, xTicks, xLabel: "how far apart the two notes are (frequency ratio)", yLabel: "roughness",
      xFmt: v => v.toFixed(1),
      tip: x => `${x.toFixed(3)} · ${(1200 * Math.log2(x)).toFixed(0)}¢ · tap to play`,
      onClick: x => Synth.play(Model.chord([f0, f0 * x], partials), 1.4),
    });

    $("c-minima").innerHTML = "";
    mins.forEach(x => {
      const nr = Model.nearestRatio(x);
      const cents = 1200 * Math.log2(x);
      const semis = Math.round(cents / 100);
      const off = cents - semis * 100;
      const b = document.createElement("button");
      b.className = "chip";
      b.innerHTML = `<b>${nr.cents < 12 ? `${nr.p}:${nr.q}` : x.toFixed(3)}</b> ▶<small>${INTERVALS[semis] || semis + " semitones"}${Math.abs(off) >= 3 ? ` ${off > 0 ? "+" : ""}${off.toFixed(0)}¢` : ""}</small>`;
      b.onclick = () => Synth.play(Model.chord([f0, f0 * x], partials), 1.4);
      $("c-minima").appendChild(b);
    });
    if (!mins.length) $("c-minima").innerHTML = '<p class="tiny">No smooth spots. Pure tones stop clashing once they are more than a critical band apart, so every wide interval scores the same.</p>';
    $("c-hint").textContent = `Partials (ratio × loudness): ` + partials.slice(0, 8).map(([r, a]) => `${r.toFixed(2)}×${a.toFixed(2)}`).join("  ") + (partials.length > 8 ? " …" : "");
  }
  [c.model, c.range, c.cmp].forEach(e => e.addEventListener("change", drawCurve));
  [c.f0, c.n, c.s].forEach(e => e.addEventListener("input", drawCurve));

  // ---------------------------------------------------------------- chords
  const PRESETS = [
    ["Major", "C4 E4 G4"], ["Minor", "C4 Eb4 G4"], ["Diminished", "C4 Eb4 Gb4"], ["Augmented", "C4 E4 G#4"],
    ["Dominant 7th", "C4 E4 G4 Bb4"], ["Major in the bass", "C2 E2 G2"], ["Schoenberg 'Farben'", "C3 G#3 B3 E4 A4"], ["Cluster", "C4 C#4 D4"],
  ];
  const h = { notes: $("h-notes"), model: $("h-model") };
  fillSelect(h.model, Model.MODELS, v => v, "sethares");
  const presetBox = $("h-presets");
  PRESETS.forEach(([name, notes], i) => {
    const b = document.createElement("button");
    b.className = "pill" + (i === 0 ? " on" : "");
    b.textContent = name;
    b.onclick = () => {
      h.notes.value = notes;
      presetBox.querySelectorAll(".pill").forEach(p => p.classList.toggle("on", p === b));
      drawChords();
    };
    presetBox.appendChild(b);
  });
  h.notes.addEventListener("input", () => { presetBox.querySelectorAll(".pill").forEach(p => p.classList.remove("on")); drawChords(); });
  h.model.addEventListener("change", drawChords);

  function parseNotes() {
    const toks = h.notes.value.split(/[\s,]+/).filter(Boolean);
    const freqs = toks.map(t => (/^\d+(\.\d+)?$/.test(t) ? +t : Model.noteToHz(t)));
    return { freqs: freqs.filter(isFinite), bad: toks.filter((t, i) => !isFinite(freqs[i])) };
  }
  function drawChords() {
    const { freqs, bad } = parseNotes();
    $("h-err").textContent = bad.length ? `Couldn't read: ${bad.join(", ")}. Try names like C4, F#3, Bb2.` : "";
    if (!freqs.length) return;
    const data = ORDER.map((k, i) => ({ key: k, label: RECIPES[k].short, cls: "c" + i, value: Model.roughness(Model.chord(freqs, Model.TIMBRES[k].partials), h.model.value) }));
    Plot.bars($("h-chart"), data, { yLabel: "roughness", bottom: 80 });
    $("h-play").innerHTML = "";
    data.forEach(d => {
      const b = document.createElement("button");
      b.className = "pill";
      b.innerHTML = `<i style="background:${RECIPES[d.key].color}"></i>▶ ${RECIPES[d.key].short}`;
      b.onclick = () => Synth.play(Model.chord(freqs, Model.TIMBRES[d.key].partials), 2);
      $("h-play").appendChild(b);
    });
  }

  // ---------------------------------------------------------------- study
  const DYADS = [
    ["m2", 1, 12], ["M2", 2, 10], ["m3", 3, 7], ["M3", 4, 4], ["P4", 5, 5], ["TT", 6, 8],
    ["P5", 7, 2], ["m6", 8, 6], ["M6", 9, 3], ["m7", 10, 9], ["M7", 11, 11], ["P8", 12, 1],
  ]; // [name, semitones, Malmberg 1918 rank]
  const x = { timbre: $("x-timbre"), reps: $("x-reps"), pid: $("x-pid"), train: $("x-train") };
  fillSelect(x.timbre, Model.TIMBRES, v => v.label, "sawtooth");
  const answers = { musician: null, phones: null };
  let exp = null;

  const showStep = name => {
    document.querySelectorAll("#v-study .step").forEach(s => (s.hidden = s.dataset.step !== name));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // consent
  $("s-agree").onchange = e => ($("s-consent").disabled = !e.target.checked);
  $("s-consent").onclick = () => { Synth.ensure(); showStep("about"); };

  // about you
  const checkAbout = () => ($("s-about").disabled = !(answers.musician && answers.phones));
  [["x-musician", "musician"], ["x-phones", "phones"]].forEach(([id, key]) => {
    $(id).querySelectorAll("button").forEach(b => (b.onclick = () => {
      answers[key] = b.dataset.v;
      $(id).querySelectorAll("button").forEach(o => o.classList.toggle("on", o === b));
      checkAbout();
    }));
  });
  $("s-about").onclick = () => showStep("check");

  // sound check
  $("s-test").onclick = async () => {
    await playWith($("s-test"), Model.chord([262, 392], Model.TIMBRES[x.timbre.value].partials), 1.5);
    $("s-check").disabled = false;
  };
  $("s-check").onclick = () => startStudy();

  function makeTrial(name, semis, phase) {
    // random root between A3 and F4 so absolute pitch can't cue the interval
    return { interval: name, semis, phase, root: 220 * 2 ** ((Math.random() * 8) / 12) };
  }
  function startStudy() {
    const reps = +x.reps.value;
    const trials = [];
    for (let r = 0; r < reps; r++) for (const [name, semis] of DYADS) trials.push(makeTrial(name, semis, "main"));
    for (let i = trials.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [trials[i], trials[j]] = [trials[j], trials[i]]; }
    const practice = [makeTrial("P5", 7, "practice"), makeTrial("m2", 1, "practice")].sort(() => Math.random() - 0.5);
    exp = {
      practice, trials, i: 0, inPractice: true, breakDone: trials.length < 18,
      timbre: x.timbre.value, pid: x.pid.value.trim() || "anon-" + Date.now().toString(36),
      train: +x.train.value || 0, musician: answers.musician, phones: answers.phones, started: new Date().toISOString(),
    };
    $("x-ntrials").textContent = trials.length;
    showStep("trial");
    runTrial();
  }
  const current = () => (exp.inPractice ? exp.practice : exp.trials)[exp.i];

  // rating buttons: peach (unpleasant) to mint (pleasant)
  const SCALE_COLORS = ["#ffb59a", "#ffc8ab", "#ffdcc0", "#efe9de", "#d3efdc", "#b2e5c9", "#8fd9b6"];
  const scale = $("x-scale");
  SCALE_COLORS.forEach((col, i) => {
    const b = document.createElement("button");
    b.textContent = i + 1; b.className = "rate"; b.disabled = true; b.style.background = col;
    b.onclick = () => respond(i + 1);
    scale.appendChild(b);
  });
  const setRating = on => scale.querySelectorAll("button").forEach(b => (b.disabled = !on));
  const spectrumFor = t => Model.chord([t.root, t.root * 2 ** (t.semis / 12)], Model.TIMBRES[exp.timbre].partials);

  async function runTrial() {
    const t = current();
    const list = exp.inPractice ? exp.practice : exp.trials;
    $("x-practice").hidden = !exp.inPractice;
    $("x-count").textContent = exp.inPractice ? `Practice ${exp.i + 1} of ${list.length}` : `Sound ${exp.i + 1} of ${list.length}`;
    $("x-bar").style.width = exp.inPractice ? "0%" : `${(100 * exp.i) / list.length}%`;
    setRating(false);
    t.shown = null;
    await sleep(250);
    await playWith($("x-replay"), spectrumFor(t), 1.5);
    setRating(true);
    t.shown = performance.now();
    t.replays = t.replays || 0;
  }
  $("x-replay").onclick = () => {
    if (!exp) return;
    const t = current();
    if (t.shown) t.replays = (t.replays || 0) + 1;
    playWith($("x-replay"), spectrumFor(t), 1.5);
  };

  function respond(v) {
    const t = current();
    if (!t || !t.shown) return;
    t.rating = v; t.rt = Math.round(performance.now() - t.shown);
    setRating(false);
    exp.i++;
    if (exp.inPractice) {
      if (exp.i < exp.practice.length) return void runTrial();
      exp.inPractice = false; exp.i = 0;
      return void showStep("ready");
    }
    if (exp.i >= exp.trials.length) return void finish();
    if (!exp.breakDone && exp.i === Math.floor(exp.trials.length / 2)) { exp.breakDone = true; return void showStep("break"); }
    runTrial();
  }
  $("s-go").onclick = () => { showStep("trial"); runTrial(); };
  $("s-resume").onclick = () => { showStep("trial"); runTrial(); };
  document.addEventListener("keydown", e => {
    if (!exp || $("v-study").querySelector('[data-step="trial"]').hidden) return;
    if (e.target.tagName === "INPUT") return;
    if (/^[1-7]$/.test(e.key) && !scale.querySelector("button").disabled) respond(+e.key);
    if (e.key.toLowerCase() === "r") $("x-replay").click();
  });

  // stats
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
    showStep("done");
    $("x-bar").style.width = "100%";
    const means = DYADS.map(([name]) => {
      const rs = exp.trials.filter(t => t.interval === name).map(t => t.rating);
      return rs.reduce((s, v) => s + v, 0) / rs.length;
    });
    const partials = Model.TIMBRES[exp.timbre].partials, f0 = Model.noteToHz("C4");
    const pred = DYADS.map(([, s]) => -Model.roughness(Model.chord([f0, f0 * 2 ** (s / 12)], partials), "sethares"));
    const malm = DYADS.map(d => -d[2]);
    const f = r => (isFinite(r) ? r.toFixed(2) : "n/a");
    $("x-stats").innerHTML = `
      <div><span>${f(spearman(means, pred))}</span>you vs. the ear model</div>
      <div><span>${f(spearman(means, malm))}</span>you vs. listeners in 1918 (Malmberg)</div>
      <div><span>${f(spearman(pred, malm))}</span>ear model vs. 1918 listeners</div>`;
    const pMin = Math.min(...pred), pMax = Math.max(...pred);
    const predScaled = pred.map(p => 1 + (6 * (p - pMin)) / (pMax - pMin || 1));
    const box = $("x-chart");
    Plot.bars(box, DYADS.map(([name], i) => ({ label: name, value: means[i] })), { yLabel: "pleasantness (1-7)", yMax: 7, bottom: 50 });
    const g = box.querySelector("svg g");
    const vb = box.querySelector("svg").viewBox.baseVal;
    const H = vb.height - 14 - 50, W = vb.width - 56 - 16, bw = W / DYADS.length, sy = v => H - (v / 7.7) * H;
    const NS = "http://www.w3.org/2000/svg";
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", predScaled.map((v, i) => `${i ? "L" : "M"}${(i + 0.5) * bw},${sy(v)}`).join(""));
    path.setAttribute("class", "series main");
    g.appendChild(path);
    predScaled.forEach((v, i) => {
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", (i + 0.5) * bw); dot.setAttribute("cy", sy(v)); dot.setAttribute("r", 5); dot.setAttribute("class", "dotpt");
      g.appendChild(dot);
    });
  }

  $("x-dl").onclick = () => {
    const head = "participant,training_years,musician,headphones,timbre,trial,interval,semitones,root_hz,rating,rt_ms,replays,started";
    const rows = exp.trials.map((t, i) => [exp.pid, exp.train, exp.musician, exp.phones, exp.timbre, i + 1, t.interval, t.semis, t.root.toFixed(2), t.rating, t.rt, t.replays || 0, exp.started].join(","));
    const blob = new Blob([head + "\n" + rows.join("\n") + "\n"], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dissonance_${exp.pid.replace(/[^\w-]/g, "_")}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $("x-again").onclick = () => {
    exp = null;
    $("s-agree").checked = false; $("s-consent").disabled = true; $("s-check").disabled = true;
    showStep("consent");
  };

  // redraw charts when the window size changes
  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if ($("v-explore").classList.contains("active")) drawCurve();
      if ($("v-chords").classList.contains("active")) drawChords();
    }, 200);
  });

  // ---------------------------------------------------------------- start
  const initial = location.hash.slice(1);
  go(["explore", "chords", "study", "about"].includes(initial) ? initial : "home");
})();
