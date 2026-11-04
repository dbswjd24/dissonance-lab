"""Timbre definitions as lists of (frequency ratio, amplitude) partials.

These mirror ``assets/model.js`` so the website and the analysis use the same
spectra.
"""

from __future__ import annotations

import math


def harmonic(n: int, rolloff: float = 1.0, odd_only: bool = False, stretch: float = 2.0):
    """Harmonic-series timbre.

    n        number of partials
    rolloff  amplitude of partial k is 1 / k**rolloff
    odd_only keep only odd harmonics (clarinet-like)
    stretch  pseudo-octave; 2.0 = harmonic, >2 stretched, <2 compressed.
             Partial k sits at k ** log2(stretch) (Sethares 2005, ch. 6).
    """
    e = math.log2(stretch)
    ks = [k for k in range(1, 2 * n + 1) if (k % 2 == 1 or not odd_only)][:n]
    return [(k ** e, 1.0 / k ** rolloff) for k in ks]


TIMBRES = {
    "sine": [(1.0, 1.0)],
    # Sethares (1993) uses 6 harmonics with amplitudes 0.88**k
    "complex6": [(k, 0.88 ** (k - 1)) for k in range(1, 7)],
    "mellow": harmonic(8, rolloff=2.0),
    "sawtooth": harmonic(10, rolloff=1.0),
    "bright": harmonic(12, rolloff=0.5),
    "clarinet": harmonic(6, rolloff=1.0, odd_only=True),
    "stretched": harmonic(6, rolloff=0.0, stretch=2.1),
}

LABELS = {
    "sine": "Sine (pure tone)",
    "complex6": "6 harmonics (Sethares)",
    "mellow": "Mellow / flute-like (1/k^2)",
    "sawtooth": "Sawtooth / string-like (1/k)",
    "bright": "Bright / brass-like (1/sqrt k)",
    "clarinet": "Clarinet-like (odd harmonics)",
    "stretched": "Stretched, pseudo-octave 2.1",
}
