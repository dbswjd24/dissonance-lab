# Dissonance Lab

**A computational model of sensory dissonance, tested against listeners.**

Live site: <https://dbswjd24.github.io/dissonance-lab/>  
Code: <https://github.com/dbswjd24/dissonance-lab>

Dissonance Lab implements the critical-band theory of sensory dissonance
(Plomp & Levelt 1965; Sethares 1993; Hutchinson & Knopoff 1978) as:

1. an **interactive website** for exploring dissonance curves, chords, and
   timbre, with a built-in **listening experiment** that saves ratings to CSV, and
2. a **Python analysis pipeline** that tests the model's predictions against
   empirical consonance data (Malmberg 1918) and against ratings collected
   with the website.

Built as a final project (software option) for a Music Perception &
Cognition course. It draws on Unit 4 (Consonance & Dissonance: critical
bandwidth, ERB, roughness, orchestration), Unit 6 (Timbre), Unit 2
(bottom-up vs. top-down processing), and Unit 5 (Pitch).

## Research question

> How much of the perceived consonance of musical intervals can a purely
> bottom-up, peripheral-auditory model (roughness between partials within a
> critical band) explain, and how does that depend on timbre?

Model predictions to test:

| Prediction | Where it is tested |
|---|---|
| Harmonic timbres produce consonance minima at simple ratios (2/1, 3/2, 4/3, 5/4, 5/3) | Curve tab, `fig1` |
| Pure (sine) tones have no consonance ordering beyond the critical band | Curve tab, `fig1`, `fig2` |
| Stretched timbres move the "octave" (consonance follows spectrum, Sethares 2005) | Curve tab, `fig1` |
| The same interval is rougher in a low register | Chords tab, `fig3` |
| Bright orchestration makes the same chord rougher (Schoenberg *Farben*, Unit 4) | Chords tab, `fig4` |
| Model rank order of dyads matches listeners' rank order | `fig2`, `fig5`, `correlations.csv` |

## Run the analysis

```bash
pip install -r requirements.txt
python python/tests/test_model.py      # sanity checks
python python/analysis/validate.py     # writes results/
```

To include your own participants, download their CSV files from the website's
*Listening experiment* tab and put them in `data/experiment/`. Then run
`validate.py` again. It adds a `listeners` dataset and `fig5_listener_data.png`.

## Results so far (Malmberg 1918 ranking, C4 root)

From `results/summary.md` (Spearman ρ between predicted consonance and rank):

| Model | Timbre | ρ |
|---|---|---|
| Hutchinson-Knopoff (ERB) | mellow 1/k² | 0.95 |
| Hutchinson-Knopoff (critical band) | 6 harmonics | 0.90 |
| Tenney height (ratio-simplicity baseline) | n/a | 0.88 |
| Sethares | 6 harmonics | 0.76 |
| any model | sine tones | 0.36-0.37 (n.s.) |
| any model | stretched (2.1) | ≈ 0 |

Pure-tone models cannot explain the ranking. Harmonic-spectrum models can,
which supports Plomp & Levelt's claim that consonance between complex tones
comes from coinciding upper partials. A ratio-simplicity account fits about
as well, so the data alone cannot separate the bottom-up (roughness) account
from the top-down or harmonicity account. That is a good discussion point for
the paper.

## Repository layout

```
index.html               website (tabs: curve, chords, experiment, about)
assets/
  model.js               roughness models + timbres (mirrors the Python)
  audio.js               Web Audio additive synthesis
  plot.js                small SVG charting helpers
  app.js                 UI + listening experiment
  style.css
python/
  dissonance/model.py    Sethares, Hutchinson-Knopoff (CB and ERB) models
  dissonance/timbres.py  spectra used everywhere
  analysis/validate.py   figures + correlations vs. empirical data
  tests/test_model.py    sanity checks against known results
data/
  empirical/intervals.csv  Malmberg (1918) ranks, just ratios
  experiment/              put listener CSVs from the website here
results/                 generated figures, correlations.csv, summary.md
docs/paper_outline.md    suggested structure for the 7-10 page paper
```

## References

See the *How it works* tab or `docs/paper_outline.md`.

## License

MIT
