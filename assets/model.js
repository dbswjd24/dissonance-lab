// Sensory dissonance models. Mirrors python/dissonance/model.py and timbres.py.
// Spectra are arrays of [frequencyHz, amplitude].

const Model = (() => {
  const D_STAR = 0.24, S1 = 0.0207, S2 = 18.96, B1 = 3.51, B2 = 5.75;
  const HK_PEAK = 0.25;

  const erb = f => 24.7 * (4.37 * f / 1000 + 1);
  const criticalBandwidth = f => 25 + 75 * Math.pow(1 + 1.4 * Math.pow(f / 1000, 2), 0.69);

  function roughness(spectrum, model = "sethares") {
    const s = spectrum.filter(p => p[1] > 0);
    if (s.length < 2) return 0;
    let total = 0, energy = 0;
    for (const p of s) energy += p[1] * p[1];
    for (let i = 0; i < s.length; i++) {
      for (let j = i + 1; j < s.length; j++) {
        const [f1, a1] = s[i], [f2, a2] = s[j];
        const df = Math.abs(f2 - f1);
        if (model === "sethares") {
          const sc = D_STAR / (S1 * Math.min(f1, f2) + S2);
          total += Math.min(a1, a2) * (Math.exp(-B1 * sc * df) - Math.exp(-B2 * sc * df));
        } else {
          const fm = (f1 + f2) / 2;
          const bw = model === "hk_cbw" ? criticalBandwidth(fm) : erb(fm);
          const y = df / bw;
          const g = Math.pow(Math.E * (y / HK_PEAK) * Math.exp(-y / HK_PEAK), 2);
          total += a1 * a2 * g;
        }
      }
    }
    return model === "sethares" ? total : total / energy;
  }

  const tone = (f0, partials) => partials.map(([r, a]) => [f0 * r, a]);
  const chord = (freqs, partials) => freqs.flatMap(f => tone(f, partials));

  function curve(f0, partials, rMin, rMax, n, model) {
    const xs = [], ys = [];
    for (let k = 0; k < n; k++) {
      const r = rMin + (rMax - rMin) * k / (n - 1);
      xs.push(r);
      ys.push(roughness(chord([f0, f0 * r], partials), model));
    }
    return { xs, ys };
  }

  function localMinima(xs, ys, minDepth = 0.01) {
    const out = [];
    const span = (Math.max(...ys) - Math.min(...ys)) || 1;
    for (let k = 1; k < ys.length - 1; k++) {
      if (ys[k] < ys[k - 1] && ys[k] <= ys[k + 1]) {
        const lo = Math.max(0, k - 25), hi = Math.min(ys.length, k + 26);
        const left = Math.max(...ys.slice(lo, k)), right = Math.max(...ys.slice(k + 1, hi));
        if (Math.min(left, right) - ys[k] > minDepth * span) out.push(xs[k]);
      }
    }
    return out;
  }

  function harmonic(n, { rolloff = 1, oddOnly = false, stretch = 2 } = {}) {
    const e = Math.log2(stretch), out = [];
    for (let k = 1; out.length < n; k++) {
      if (oddOnly && k % 2 === 0) continue;
      out.push([Math.pow(k, e), 1 / Math.pow(k, rolloff)]);
    }
    return out;
  }

  const TIMBRES = {
    sine: { label: "Sine (pure tone)", partials: [[1, 1]] },
    complex6: { label: "6 harmonics (Sethares)", partials: [1, 2, 3, 4, 5, 6].map(k => [k, Math.pow(0.88, k - 1)]) },
    mellow: { label: "Mellow / flute-like (1/k²)", partials: harmonic(8, { rolloff: 2 }) },
    sawtooth: { label: "Sawtooth / string-like (1/k)", partials: harmonic(10, { rolloff: 1 }) },
    bright: { label: "Bright / brass-like (1/√k)", partials: harmonic(12, { rolloff: 0.5 }) },
    clarinet: { label: "Clarinet-like (odd harmonics)", partials: harmonic(6, { rolloff: 1, oddOnly: true }) },
    stretched: { label: "Stretched, pseudo-octave 2.1", partials: harmonic(6, { rolloff: 0, stretch: 2.1 }) },
  };

  const MODELS = {
    sethares: "Sethares (1993) / Plomp-Levelt",
    hk_cbw: "Hutchinson-Knopoff, critical band",
    hk_erb: "Hutchinson-Knopoff, ERB",
  };

  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function noteToHz(name) {
    const m = /^([A-Ga-g])([#b]*)(-?\d+)$/.exec(name.trim());
    if (!m) return NaN;
    let pc = NOTE[m[1].toUpperCase()];
    for (const c of m[2]) pc += c === "#" ? 1 : -1;
    return 440 * Math.pow(2, (12 * (+m[3] + 1) + pc - 69) / 12);
  }

  // Simple-ratio names for labelling minima.
  const JUST = [[1,1],[16,15],[10,9],[9,8],[8,7],[7,6],[6,5],[11,9],[5,4],[9,7],[4,3],[11,8],[7,5],[10,7],[3,2],[11,7],[8,5],[13,8],[5,3],[12,7],[7,4],[16,9],[9,5],[11,6],[15,8],[2,1],[9,4],[11,5],[7,3]];
  function nearestRatio(r) {
    let best = null, bestErr = Infinity;
    for (const [p, q] of JUST) {
      const err = Math.abs(1200 * Math.log2(r / (p / q)));
      if (err < bestErr) { bestErr = err; best = [p, q]; }
    }
    return { p: best[0], q: best[1], cents: bestErr };
  }

  return { roughness, tone, chord, curve, localMinima, harmonic, TIMBRES, MODELS, noteToHz, nearestRatio, erb, criticalBandwidth };
})();
