"""Sensory dissonance (roughness) models.

Three bottom-up models of sensory dissonance are implemented, plus one
top-down / ratio-simplicity baseline:

1. ``sethares``  - Sethares (1993) parameterisation of the Plomp & Levelt (1965)
   dissonance curve. Each pair of partials contributes
   min(a1, a2) * (exp(-b1 * s * df) - exp(-b2 * s * df)),
   where s scales the curve so its peak tracks the critical band.

2. ``hk_cbw``    - Hutchinson & Knopoff (1978) / Parncutt (1989) style model.
   Pairwise roughness g(y) = (e * (y / 0.25) * exp(-y / 0.25))^2 where y is the
   frequency difference measured in critical bandwidths (Zwicker & Terhardt 1980).
   Contributions are weighted by a1 * a2 and normalised by sum(a^2).

3. ``hk_erb``    - same as (2) but bandwidth measured with the Equivalent
   Rectangular Bandwidth of Glasberg & Moore (1990), as presented in Unit 4.

4. ``tenney``    - Tenney height log2(p * q) of the just-intonation ratio p/q that
   approximates an interval. Not a sensory model: a stand-in for the
   "simple ratio" (Pythagorean) account of consonance.

All functions accept spectra as arrays of (frequency_hz, amplitude) pairs.
"""

from __future__ import annotations

import math
from typing import Iterable, Sequence

import numpy as np

# --- Sethares (1993) constants -------------------------------------------------
D_STAR = 0.24  # frequency difference (in scaled units) of maximum dissonance
S1 = 0.0207
S2 = 18.96
B1 = 3.51
B2 = 5.75

# Peak of the Hutchinson & Knopoff curve, as a fraction of a critical band.
HK_PEAK = 0.25

MODELS = ("sethares", "hk_cbw", "hk_erb")


def erb(f: np.ndarray | float) -> np.ndarray | float:
    """Equivalent rectangular bandwidth in Hz (Glasberg & Moore, 1990)."""
    return 24.7 * (4.37 * np.asarray(f) / 1000.0 + 1.0)


def critical_bandwidth(f: np.ndarray | float) -> np.ndarray | float:
    """Classic critical bandwidth in Hz (Zwicker & Terhardt, 1980)."""
    f = np.asarray(f)
    return 25.0 + 75.0 * (1.0 + 1.4 * (f / 1000.0) ** 2) ** 0.69


def _pairs(spectrum: np.ndarray):
    """Return arrays (f1, a1, f2, a2) for every unordered pair of partials."""
    i, j = np.triu_indices(len(spectrum), k=1)
    return spectrum[i, 0], spectrum[i, 1], spectrum[j, 0], spectrum[j, 1]


def _as_spectrum(spectrum) -> np.ndarray:
    s = np.asarray(spectrum, dtype=float).reshape(-1, 2)
    return s[s[:, 1] > 0]


def roughness(spectrum, model: str = "sethares") -> float:
    """Total roughness of a spectrum (all pairs of partials).

    ``spectrum``: iterable of (frequency_hz, amplitude).
    """
    s = _as_spectrum(spectrum)
    if len(s) < 2:
        return 0.0
    f1, a1, f2, a2 = _pairs(s)
    df = np.abs(f2 - f1)
    fmin = np.minimum(f1, f2)

    if model == "sethares":
        sc = D_STAR / (S1 * fmin + S2)
        d = np.minimum(a1, a2) * (np.exp(-B1 * sc * df) - np.exp(-B2 * sc * df))
        return float(d.sum())

    if model in ("hk_cbw", "hk_erb"):
        fmean = (f1 + f2) / 2.0
        bw = critical_bandwidth(fmean) if model == "hk_cbw" else erb(fmean)
        y = df / bw
        g = (math.e * (y / HK_PEAK) * np.exp(-y / HK_PEAK)) ** 2
        return float((a1 * a2 * g).sum() / (s[:, 1] ** 2).sum())

    raise ValueError(f"unknown model {model!r}; choose from {MODELS}")


def tone(f0: float, partials: Sequence[tuple[float, float]]) -> np.ndarray:
    """Spectrum of a tone with fundamental ``f0`` and (ratio, amp) partials."""
    p = np.asarray(partials, dtype=float)
    return np.column_stack([f0 * p[:, 0], p[:, 1]])


def chord(freqs: Iterable[float], partials) -> np.ndarray:
    """Combined spectrum of several tones sharing one timbre."""
    return np.vstack([tone(f, partials) for f in freqs])


def dyad_roughness(f0: float, ratio: float, partials, model: str = "sethares") -> float:
    return roughness(chord([f0, f0 * ratio], partials), model)


def dissonance_curve(f0: float, partials, ratios: np.ndarray, model: str = "sethares") -> np.ndarray:
    """Roughness of a dyad (f0, f0*r) for every r in ``ratios``."""
    return np.array([dyad_roughness(f0, r, partials, model) for r in ratios])


def local_minima(ratios: np.ndarray, curve: np.ndarray, min_depth: float = 0.01) -> list[float]:
    """Ratios at which the curve has a local minimum (the 'consonant points')."""
    out = []
    span = curve.max() - curve.min() or 1.0
    for k in range(1, len(curve) - 1):
        if curve[k] < curve[k - 1] and curve[k] <= curve[k + 1]:
            # require the dip to be visible on both sides within +-25 samples
            lo, hi = max(0, k - 25), min(len(curve), k + 26)
            if min(curve[lo:k].max(), curve[k + 1:hi].max()) - curve[k] > min_depth * span:
                out.append(float(ratios[k]))
    return out


def tenney_height(p: int, q: int) -> float:
    g = math.gcd(p, q)
    return math.log2((p // g) * (q // g))


def midi_to_hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


_NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def note_to_hz(name: str) -> float:
    """'C4', 'G#3', 'Bb2' -> frequency in Hz (A4 = 440)."""
    name = name.strip()
    pc = _NOTE[name[0].upper()]
    rest = name[1:]
    while rest and rest[0] in "#b":
        pc += 1 if rest[0] == "#" else -1
        rest = rest[1:]
    octave = int(rest)
    return midi_to_hz(12 * (octave + 1) + pc)
