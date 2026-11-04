# Empirical reference data

`intervals.csv` lists the 12 chromatic dyads with

- `just_p`, `just_q`: the just-intonation ratio commonly used to name each
  interval (used for the Tenney-height "simple ratio" baseline).
- `malmberg_rank`: consonance rank (1 = most consonant) from Malmberg (1918),
  as summarised in Schwartz, Howe & Purves (2003), Figure 1, and reproduced in
  Sethares (2005).

Check these values against the original sources before citing them in the
paper:

- Malmberg, C. F. (1918). The perception of consonance and dissonance.
  *Psychological Monographs, 25*(2), 93-133.
- Schwartz, D. A., Howe, C. Q., & Purves, D. (2003). The statistical structure
  of human speech sounds predicts musical universals. *Journal of
  Neuroscience, 23*(18), 7160-7168.

## Adding more datasets

Any CSV with columns `interval` (m2 ... P8) and a numeric column can be
compared with the models. For example, mean pleasantness ratings from
McDermott, Lehr & Oxenham (2010) or Bowling, Purves & Gill (2018) can be added
as new columns; `analysis/validate.py` correlates every numeric column whose
name ends in `_rank` (lower = more consonant) or `_rating` (higher = more
consonant).
