"""Sanity checks that the models reproduce known qualitative results.

Run:  python -m pytest python/tests   (or)   python python/tests/test_model.py
"""

import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dissonance import (  # noqa: E402
    MODELS,
    TIMBRES,
    dissonance_curve,
    dyad_roughness,
    local_minima,
    note_to_hz,
    roughness,
)

RATIOS = np.linspace(1.0, 2.3, 2601)


def near(xs, target, tol=0.006):
    return any(abs(x - target) < tol for x in xs)


def test_note_to_hz():
    assert abs(note_to_hz("A4") - 440.0) < 1e-9
    assert abs(note_to_hz("C4") - 261.6256) < 1e-3
    assert abs(note_to_hz("Bb3") - note_to_hz("A#3")) < 1e-9


def test_unison_and_single_tone_have_no_roughness():
    for m in MODELS:
        assert roughness([(440, 1)], m) == 0.0
        assert dyad_roughness(440, 1.0, TIMBRES["sine"], m) < 1e-12


def test_sine_dyad_peaks_inside_critical_band_then_decays():
    # Plomp & Levelt (1965): for pure tones roughness peaks at a small
    # fraction of the critical band and is ~0 beyond it.
    for m in MODELS:
        c = dissonance_curve(440, TIMBRES["sine"], RATIOS, m)
        peak_ratio = RATIOS[np.argmax(c)]
        assert 1.01 < peak_ratio < 1.10, (m, peak_ratio)
        assert c[np.searchsorted(RATIOS, 1.5)] < 0.05 * c.max()


def test_harmonic_timbre_minima_at_simple_ratios():
    # Sethares (1993): harmonic spectra give minima at 2/1, 3/2, 4/3, 5/4, 5/3
    c = dissonance_curve(261.63, TIMBRES["complex6"], RATIOS, "sethares")
    mins = local_minima(RATIOS, c)
    for r in (2.0, 1.5, 4 / 3, 5 / 4, 5 / 3):
        assert near(mins, r), (r, mins)


def test_stretched_timbre_moves_octave_minimum():
    c = dissonance_curve(261.63, TIMBRES["stretched"], RATIOS, "sethares")
    mins = local_minima(RATIOS, c)
    assert near(mins, 2.1)
    assert not near(mins, 2.0, tol=0.02)


def test_low_register_rougher():
    # Same major third is rougher in a low register (wider critical bands).
    for m in MODELS:
        lo = dyad_roughness(note_to_hz("C2"), 5 / 4, TIMBRES["complex6"], m)
        hi = dyad_roughness(note_to_hz("C5"), 5 / 4, TIMBRES["complex6"], m)
        assert lo > hi, m


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok ", name)
