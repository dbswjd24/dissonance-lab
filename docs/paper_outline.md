# Paper outline (7-10 pages)

Working title: **Sensation or learning? A computational test of roughness
and harmonicity accounts of consonance in musicians and non-musicians**

**Thesis.** Sensory roughness (Plomp & Levelt, 1965) predicts the broad
ordering of intervals for complex tones, but it does not explain consonance
*preference*. Preferences follow harmonicity, which is learned and grows with
musical exposure. Prediction: a harmonicity measure (Tenney height) will fit
listener ratings better than the roughness model, and the advantage will be
larger for musicians than for non-musicians (McDermott, Lehr & Oxenham, 2010;
Cousineau, McDermott & Peretz, 2012; McDermott et al., 2016).

Code: link the GitHub repository and the live GitHub Pages site here.

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

## References (peer-reviewed core)

1. Plomp, R., & Levelt, W. J. M. (1965). Tonal consonance and critical bandwidth. *JASA, 38*, 548-560.
2. Sethares, W. A. (1993). Local consonance and the relationship between timbre and scale. *JASA, 94*, 1218-1228.
3. Hutchinson, W., & Knopoff, L. (1978). The acoustic component of Western consonance. *Interface, 7*, 1-29.
4. McDermott, J. H., Lehr, A. J., & Oxenham, A. J. (2010). Individual differences reveal the basis of consonance. *Current Biology, 20*(11), 1035-1041. Harmonicity, not beating, predicts preference, and it correlates with years of training. This is the main support for the thesis.
5. Cousineau, M., McDermott, J. H., & Peretz, I. (2012). The basis of musical consonance as revealed by congenital amusia. *PNAS, 109*(48), 19858-19863. Amusics dislike beating normally but show no consonance preference, which argues against roughness as the basis of preference.
6. McDermott, J. H., Schultz, A. F., Undurraga, E. A., & Godoy, R. A. (2016). Indifference to dissonance in native Amazonians reveals cultural variation in music perception. *Nature, 535*, 547-550. Evidence for a top-down, cultural account.
7. Bidelman, G. M., & Krishnan, A. (2009). Neural correlates of consonance, dissonance, and the hierarchy of musical pitch in the human brainstem. *Journal of Neuroscience, 29*(42), 13165-13171. Neural pitch salience correlates with consonance ratings.
8. Bowling, D. L., Purves, D., & Gill, K. Z. (2018). Vocal similarity predicts the relative attraction of musical chords. *PNAS, 115*(1), 216-221. Proposes an alternative account (similarity to voiced speech).
9. Malmberg, C. F. (1918). The perception of consonance and dissonance. *Psychological Monographs, 25*, 93-133. Source of the benchmark ranking.
10. Glasberg, B. R., & Moore, B. C. J. (1990). Derivation of auditory filter shapes from notched-noise data. *Hearing Research, 47*, 103-138.

Other: Kameoka & Kuriyagawa 1969; Parncutt 1989; Sethares 2005; Terhardt 1974;
Zwicker & Terhardt 1980; Wright & Bregman 1987.
