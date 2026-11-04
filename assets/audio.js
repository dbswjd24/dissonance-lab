// Additive synthesis with the Web Audio API.
const Synth = (() => {
  let ctx = null, master = null;
  const active = new Set();

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.25;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function stop() {
    for (const o of active) { try { o.stop(); } catch (e) { /* already stopped */ } }
    active.clear();
  }

  // spectrum: [[freq, amp], ...]; plays all partials together.
  function play(spectrum, dur = 1.5) {
    ensure();
    stop();
    const t0 = ctx.currentTime + 0.02;
    const sum = spectrum.reduce((s, p) => s + p[1], 0) || 1;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(1, t0 + 0.03);
    env.gain.setValueAtTime(1, t0 + dur - 0.15);
    env.gain.linearRampToValueAtTime(0, t0 + dur);
    env.connect(master);
    for (const [f, a] of spectrum) {
      if (f > ctx.sampleRate / 2 - 100 || f < 20) continue;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.value = a / sum;
      o.connect(g).connect(env);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
      active.add(o);
      o.onended = () => active.delete(o);
    }
    return new Promise(res => setTimeout(res, dur * 1000 + 80));
  }

  return { play, stop, ensure };
})();
