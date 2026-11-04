# Paper outline (7-10 pages)

Working title: **Can roughness explain consonance? A computational test of
critical-band dissonance models against listener judgments**

## 1. Introduction (about 1 page)
- Consonance and dissonance from Pythagoras to Helmholtz (Unit 4 history).
- Two accounts: *sensory* (roughness, bottom-up) and *musical* (top-down,
  learned). See Terhardt's two-component theory (Unit 4, Unit 2).
- Research question and the predictions listed in the README.

## 2. Background (1.5-2 pages)
- Basilar membrane as a filter bank. Critical bandwidth and ERB (Glasberg & Moore).
  Use the Unit 4 ERB formula and the gammatone figure.
- Beats and roughness (von Békésy, Terhardt). Plomp & Levelt (1965) curve.
- Extension to complex tones: summing over partial pairs. Kameoka & Kuriyagawa
  (1969), Hutchinson & Knopoff (1978), Sethares (1993).
- Timbre and orchestration (Unit 4 *Farben* example; Unit 6 spectral envelope).
- Limits of a bottom-up account: Wright-Bregman stream segregation,
  enculturation, the neural coding results (Tramo 2001, McKinney 2003).

## 3. Methods: the software (2 pages)
- Model equations: Sethares; H&K with CB vs. ERB. Explain each parameter.
- Timbres used (table of partials and amplitudes).
- Implementation: Python (numpy) and JavaScript (Web Audio). Both use the same
  equations. Link to the repository.
- Dissonance-curve computation and local-minimum detection.
- Listening experiment: stimuli (12 ET dyads, randomised root A3-F4, 1.5 s,
  chosen timbre), 7-point pleasantness scale, randomised order, repetitions,
  participants (N, musical training).
- Analysis: Spearman rank correlation with permutation p-values. Tenney height
  as a ratio-simplicity baseline.

## 4. Results (2 pages)
- Fig 1: dissonance curves for sine, harmonic, and stretched spectra.
  Where do the minima fall?
- Fig 2: model vs. Malmberg (1918). Table of rho for every model and timbre.
- Fig 5: model vs. your listeners (and musicians vs. non-musicians if N allows).
- Fig 3: register effect. Fig 4: *Farben* orchestration.

## 5. Discussion (1.5-2 pages)
- What the model gets right: ordering of harmonic dyads, timbre dependence,
  register.
- What it gets wrong, and why: e.g. P4 vs. M3/M6 order, the tritone, and
  pure-tone 7ths that musicians still hear as dissonant (top-down, Unit 4).
- Roughness vs. ratio-simplicity (Tenney) fit about equally well. What
  stimuli would tell them apart? Stretched timbres (Sethares) and
  inharmonic spectra are an ideal test, and the website can produce them.
- Limits: no masking or loudness weighting, no temporal or context effects,
  small N.
- Future work: gammatone or AIM front end, harmonicity models, non-Western
  listeners, chords in context.

## 6. Conclusion (about 0.5 page)

## References
Glasberg & Moore 1990; Hutchinson & Knopoff 1978; Kameoka & Kuriyagawa 1969;
Malmberg 1918; McDermott, Lehr & Oxenham 2010; Parncutt 1989; Plomp & Levelt
1965; Schwartz, Howe & Purves 2003; Sethares 1993, 2005; Terhardt 1974, 1977;
Wright & Bregman 1987; Zwicker & Terhardt 1980.
