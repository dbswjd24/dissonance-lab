# Dissonance Lab - validation summary

Reference pitch C4 = 261.63 Hz; dyads in 12-tone equal temperament.

## Spearman correlation with `malmberg`

| model | timbre | rho | p (permutation) |
|---|---|---|---|
| hk_erb | mellow | 0.951 | 5e-05 |
| hk_erb | sawtooth | 0.93 | 0.0001 |
| hk_cbw | complex6 | 0.902 | 0.00015 |
| hk_erb | bright | 0.895 | 0.00025 |
| hk_cbw | bright | 0.888 | 0.0003 |
| tenney | - | 0.881 | 0.0006 |
| hk_cbw | sawtooth | 0.86 | 0.0004 |
| hk_erb | complex6 | 0.832 | 0.0016 |
| sethares | complex6 | 0.762 | 0.0055 |
| hk_cbw | mellow | 0.748 | 0.0065 |
| sethares | sawtooth | 0.734 | 0.0085 |
| sethares | bright | 0.734 | 0.0086 |
| sethares | mellow | 0.706 | 0.013 |
| hk_erb | clarinet | 0.524 | 0.083 |
| sethares | sine | 0.371 | 0.23 |
| hk_erb | sine | 0.371 | 0.23 |
| hk_cbw | clarinet | 0.371 | 0.24 |
| hk_cbw | sine | 0.357 | 0.25 |
| sethares | clarinet | 0.343 | 0.27 |
| sethares | stretched | 0.035 | 0.92 |
| hk_cbw | stretched | 0.014 | 0.97 |
| hk_erb | stretched | -0.364 | 0.24 |

## Local minima of the Sethares curve (ratio 1.0-2.3)

- Sine (pure tone): 
- 6 harmonics (Sethares): 1.200, 1.250, 1.333, 1.500, 1.667, 2.000
- Stretched, pseudo-octave 2.1: 1.215, 1.270, 1.361, 1.543, 1.728, 2.100

## Register effect (Sethares, 6 harmonics)

- m3 (6/5): C1=3.079, C2=1.560, C3=0.745, C4=0.369, C5=0.192, C6=0.122
- M3 (5/4): C1=2.987, C2=1.488, C3=0.694, C4=0.343, C5=0.194, C6=0.140
- P5 (3/2): C1=2.529, C2=1.117, C3=0.389, C4=0.119, C5=0.045, C6=0.024

## Farben chord roughness by timbre (Sethares)

- Sine (pure tone): 0.281
- Mellow / flute-like (1/k^2): 0.761
- Clarinet-like (odd harmonics): 0.759
- 6 harmonics (Sethares): 3.537
- Sawtooth / string-like (1/k): 2.354
- Bright / brass-like (1/sqrt k): 6.069
