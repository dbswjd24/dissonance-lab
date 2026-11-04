"""Test the roughness models against empirical consonance data.

Usage (from the repository root):

    python python/analysis/validate.py

Outputs figures and tables to ``results/``:

  fig1_dissonance_curves.png   model curves for several timbres
  fig2_model_vs_malmberg.png   predicted vs. empirical dyad consonance
  fig3_register.png            roughness of the same interval across registers
  fig4_farben.png              Schoenberg 'Farben' chord across timbres (Unit 4)
  fig5_listener_data.png       (only if data/experiment/*.csv exist)
  correlations.csv             Spearman rho for every model x timbre x dataset
  summary.md                   human-readable summary for the paper
"""

from __future__ import annotations

import csv
import glob
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "python"))

import matplotlib  # noqa: E402

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

from dissonance import (  # noqa: E402
    LABELS,
    MODELS,
    TIMBRES,
    chord,
    dissonance_curve,
    dyad_roughness,
    local_minima,
    note_to_hz,
    roughness,
    tenney_height,
)

RESULTS = os.path.join(ROOT, "results")
F0 = note_to_hz("C4")
RNG = np.random.default_rng(0)
MODEL_LABELS = {
    "sethares": "Sethares (1993)",
    "hk_cbw": "Hutchinson-Knopoff, critical band",
    "hk_erb": "Hutchinson-Knopoff, ERB",
}


# --------------------------------------------------------------------------- stats
def rankdata(x):
    """Average ranks (ties share the mean rank), like scipy.stats.rankdata."""
    x = np.asarray(x, dtype=float)
    order = np.argsort(x, kind="mergesort")
    ranks = np.empty(len(x))
    ranks[order] = np.arange(1, len(x) + 1)
    for v in np.unique(x):
        m = x == v
        ranks[m] = ranks[m].mean()
    return ranks


def spearman(x, y, n_perm: int = 20000):
    """Spearman rho and two-sided permutation p-value."""
    rx, ry = rankdata(x), rankdata(y)
    if rx.std() == 0 or ry.std() == 0:
        return float("nan"), float("nan")
    rho = np.corrcoef(rx, ry)[0, 1]
    perms = np.array([np.corrcoef(rx, RNG.permutation(ry))[0, 1] for _ in range(n_perm)])
    p = (np.sum(np.abs(perms) >= abs(rho) - 1e-12) + 1) / (n_perm + 1)
    return float(rho), float(p)


# --------------------------------------------------------------------------- data
def load_intervals():
    with open(os.path.join(ROOT, "data", "empirical", "intervals.csv")) as fh:
        rows = list(csv.DictReader(fh))
    return rows


def empirical_columns(rows):
    """Return {dataset_name: consonance scores (higher = more consonant)}."""
    out = {}
    for col in rows[0]:
        vals = [r[col] for r in rows]
        try:
            nums = np.array([float(v) for v in vals])
        except ValueError:
            continue
        if col.endswith("_rank"):
            out[col[:-5]] = -nums
        elif col.endswith("_rating"):
            out[col[:-7]] = nums
    return out


def load_listener_data(interval_names):
    """Mean rating per interval from CSVs exported by the website."""
    files = sorted(glob.glob(os.path.join(ROOT, "data", "experiment", "*.csv")))
    if not files:
        return None, 0
    ratings = {k: [] for k in interval_names}
    participants = set()
    for path in files:
        with open(path) as fh:
            for r in csv.DictReader(fh):
                if r.get("interval") in ratings and r.get("rating"):
                    ratings[r["interval"]].append(float(r["rating"]))
                    participants.add((path, r.get("participant", "")))
    if not any(ratings.values()):
        return None, 0
    means = np.array([np.mean(ratings[k]) if ratings[k] else np.nan for k in interval_names])
    sems = np.array(
        [np.std(ratings[k], ddof=1) / np.sqrt(len(ratings[k])) if len(ratings[k]) > 1 else 0 for k in interval_names]
    )
    return (means, sems), len(participants)


# --------------------------------------------------------------------------- figures
def fig_curves():
    ratios = np.linspace(1.0, 2.3, 1301)
    fig, axes = plt.subplots(3, 1, figsize=(9, 9), sharex=True)
    rows = []
    for ax, t in zip(axes, ["sine", "complex6", "stretched"]):
        for m in MODELS:
            c = dissonance_curve(F0, TIMBRES[t], ratios, m)
            ax.plot(ratios, c / c.max(), label=MODEL_LABELS[m], lw=1.4)
            if m == "sethares":
                mins = local_minima(ratios, c)
                rows.append((t, mins))
                for r in mins:
                    ax.axvline(r, color="0.6", lw=0.6, ls=":")
        for k in range(13):
            ax.axvline(2 ** (k / 12), color="0.85", lw=0.5, zorder=0)
        ax.set_title(LABELS[t])
        ax.set_ylabel("roughness (normalised)")
    axes[0].legend(fontsize=8)
    axes[-1].set_xlabel("frequency ratio (grey lines = 12-TET semitones, dotted = Sethares minima)")
    fig.tight_layout()
    fig.savefig(os.path.join(RESULTS, "fig1_dissonance_curves.png"), dpi=150)
    plt.close(fig)
    return rows


def model_scores(rows):
    """Predicted consonance (= -roughness) for each model x timbre."""
    semis = np.array([int(r["semitones"]) for r in rows])
    ratios = 2 ** (semis / 12)
    scores = {}
    for t in TIMBRES:
        for m in MODELS:
            scores[(m, t)] = -np.array([dyad_roughness(F0, r, TIMBRES[t], m) for r in ratios])
    tenney = -np.array([tenney_height(int(r["just_p"]), int(r["just_q"])) for r in rows])
    scores[("tenney", "-")] = tenney
    return scores


def fig_vs_empirical(rows, scores, target, title, fname, sems=None):
    names = [r["interval"] for r in rows]
    fig, axes = plt.subplots(1, 3, figsize=(13, 4.2))
    panels = [("sethares", "sine"), ("sethares", "complex6"), ("tenney", "-")]
    for ax, key in zip(axes, panels):
        x = scores[key]
        rho, p = spearman(x, target)
        ax.scatter(x, target, color="C0")
        if sems is not None:
            ax.errorbar(x, target, yerr=sems, fmt="none", ecolor="C0", alpha=0.5)
        for xi, yi, n in zip(x, target, names):
            ax.annotate(n, (xi, yi), textcoords="offset points", xytext=(4, 3), fontsize=8)
        lab = "Tenney height (ratio simplicity)" if key[0] == "tenney" else f"{MODEL_LABELS[key[0]]}\n{LABELS[key[1]]}"
        ax.set_title(f"{lab}\nSpearman rho = {rho:.2f}, p = {p:.3f}", fontsize=9)
        ax.set_xlabel("predicted consonance (-roughness)")
    axes[0].set_ylabel(title)
    fig.tight_layout()
    fig.savefig(os.path.join(RESULTS, fname), dpi=150)
    plt.close(fig)


def fig_register():
    octaves = [1, 2, 3, 4, 5, 6]
    intervals = {"m3 (6/5)": 6 / 5, "M3 (5/4)": 5 / 4, "P5 (3/2)": 3 / 2}
    fig, ax = plt.subplots(figsize=(7, 4))
    out = {}
    for lab, r in intervals.items():
        vals = [dyad_roughness(note_to_hz(f"C{o}"), r, TIMBRES["complex6"], "sethares") for o in octaves]
        out[lab] = vals
        ax.plot([f"C{o}" for o in octaves], vals, marker="o", label=lab)
    ax.set_ylabel("roughness (Sethares, 6 harmonics)")
    ax.set_xlabel("lower note")
    ax.set_title("Same interval, different register: low-register intervals are rougher")
    ax.legend()
    fig.tight_layout()
    fig.savefig(os.path.join(RESULTS, "fig3_register.png"), dpi=150)
    plt.close(fig)
    return out


FARBEN = ["C3", "G#3", "B3", "E4", "A4"]


def fig_farben():
    freqs = [note_to_hz(n) for n in FARBEN]
    order = ["sine", "mellow", "clarinet", "complex6", "sawtooth", "bright"]
    vals = {t: roughness(chord(freqs, TIMBRES[t]), "sethares") for t in order}
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.bar([LABELS[t] for t in order], [vals[t] for t in order], color="C1")
    ax.set_ylabel("roughness (Sethares)")
    ax.set_title("Schoenberg Op. 16/3 'Farben' chord (" + " ".join(FARBEN) + ") orchestrated with different timbres")
    plt.setp(ax.get_xticklabels(), rotation=25, ha="right", fontsize=8)
    fig.tight_layout()
    fig.savefig(os.path.join(RESULTS, "fig4_farben.png"), dpi=150)
    plt.close(fig)
    return vals


# --------------------------------------------------------------------------- main
def main():
    os.makedirs(RESULTS, exist_ok=True)
    rows = load_intervals()
    names = [r["interval"] for r in rows]
    scores = model_scores(rows)
    datasets = empirical_columns(rows)

    listener, n_participants = load_listener_data(names)
    if listener is not None:
        datasets["listeners"] = listener[0]

    # correlation table
    table = []
    for dname, target in datasets.items():
        ok = ~np.isnan(target)
        for (m, t), x in scores.items():
            rho, p = spearman(x[ok], target[ok])
            table.append({"dataset": dname, "model": m, "timbre": t, "spearman_rho": round(rho, 3), "p_perm": float(f"{p:.2g}")})
    with open(os.path.join(RESULTS, "correlations.csv"), "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(table[0]))
        w.writeheader()
        w.writerows(table)

    minima = fig_curves()
    fig_vs_empirical(rows, scores, datasets["malmberg"], "Malmberg (1918) consonance (-rank)", "fig2_model_vs_malmberg.png")
    if listener is not None:
        fig_vs_empirical(rows, scores, listener[0], "mean listener rating (1-7)", "fig5_listener_data.png", sems=listener[1])
    register = fig_register()
    farben = fig_farben()

    # summary
    lines = ["# Dissonance Lab - validation summary", ""]
    lines.append(f"Reference pitch C4 = {F0:.2f} Hz; dyads in 12-tone equal temperament.\n")
    for dname in datasets:
        extra = f" ({n_participants} participants)" if dname == "listeners" else ""
        lines.append(f"## Spearman correlation with `{dname}`{extra}\n")
        lines.append("| model | timbre | rho | p (permutation) |")
        lines.append("|---|---|---|---|")
        for r in sorted((r for r in table if r["dataset"] == dname), key=lambda r: -np.nan_to_num(r["spearman_rho"], nan=-9)):
            lines.append(f"| {r['model']} | {r['timbre']} | {r['spearman_rho']} | {r['p_perm']} |")
        lines.append("")
    lines.append("## Local minima of the Sethares curve (ratio 1.0-2.3)\n")
    for t, mins in minima:
        lines.append(f"- {LABELS[t]}: " + ", ".join(f"{r:.3f}" for r in mins))
    lines.append("\n## Register effect (Sethares, 6 harmonics)\n")
    for lab, vals in register.items():
        lines.append(f"- {lab}: " + ", ".join(f"C{o}={v:.3f}" for o, v in zip(range(1, 7), vals)))
    lines.append("\n## Farben chord roughness by timbre (Sethares)\n")
    for t, v in farben.items():
        lines.append(f"- {LABELS[t]}: {v:.3f}")
    with open(os.path.join(RESULTS, "summary.md"), "w") as fh:
        fh.write("\n".join(lines) + "\n")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
