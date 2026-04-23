"""
Combined first-round projection report (QB/WR/RB).

Merges the per-position prediction CSVs written by
``scripts/run_real_draft_engine.py`` into a single ranked board, filters to
prospects the model projects inside Round 1 (P(R1) ≥ 0.50), and writes
both a Markdown table and a CSV for quick sharing.

Usage::

    python scripts/report_r1_projections.py

Outputs:

- ``outputs/real_predictions/r1_board_combined.csv``
- ``outputs/real_predictions/r1_board_combined.md``

Author: Akhi Chappidi · UNC Charlotte (RMU SAC 2026).
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

REPO = Path(__file__).resolve().parents[1]
PRED_DIR = REPO / "outputs" / "real_predictions"
DATA_DIR = REPO / "data" / "rmu_sac_real"
OUT_CSV = PRED_DIR / "r1_board_combined.csv"
OUT_MD = PRED_DIR / "r1_board_combined.md"

THRESHOLD = 0.50


def _load(pos: str) -> pd.DataFrame:
    pred = pd.read_csv(PRED_DIR / f"{pos.lower()}_predictions.csv")
    test = pd.read_csv(DATA_DIR / f"{pos.lower()}_test.csv")
    pred["position"] = pos
    keep = ["name", "position", "college_team", "college_conference",
            "r1_probability", "r1_predicted", "confidence"]
    return pred[keep].merge(
        test[["name", "height", "weight"]].drop_duplicates("name"),
        on="name",
        how="left",
    )


def _stat_line(row: pd.Series, test: dict[str, pd.DataFrame]) -> str:
    pos = row["position"]
    t = test[pos].loc[test[pos]["name"] == row["name"]].iloc[0]
    if pos == "QB":
        return (f"{int(t['passing_yds'])} yds · {int(t['passing_tds'])} TD / "
                f"{int(t['passing_ints'])} INT · {t['completion_pct']*100:.1f}%")
    if pos == "WR":
        return (f"{int(t['receiving_rec'])} rec · {int(t['receiving_yds'])} yds · "
                f"{int(t['receiving_td'])} TD")
    return (f"{int(t['rushing_yds'])} rush · {int(t['rushing_td'])} TD · "
            f"{int(t['receiving_rec'])} rec / {int(t['receiving_yds'])} yds")


def main() -> None:
    qb = _load("QB")
    wr = _load("WR")
    rb = _load("RB")
    board = pd.concat([qb, wr, rb], ignore_index=True)
    board = board.sort_values("r1_probability", ascending=False).reset_index(drop=True)
    board.insert(0, "overall_rank", board.index + 1)

    test_map = {
        "QB": pd.read_csv(DATA_DIR / "qb_test.csv"),
        "WR": pd.read_csv(DATA_DIR / "wr_test.csv"),
        "RB": pd.read_csv(DATA_DIR / "rb_test.csv"),
    }
    board["stat_line"] = board.apply(lambda r: _stat_line(r, test_map), axis=1)

    r1 = board.loc[board["r1_probability"] >= THRESHOLD].copy()
    near = board.loc[(board["r1_probability"] >= 0.40) & (board["r1_probability"] < THRESHOLD)].copy()

    PRED_DIR.mkdir(parents=True, exist_ok=True)
    board.to_csv(OUT_CSV, index=False)

    # ---- terminal print -------------------------------------------------- #
    print("\n" + "=" * 78)
    print("2026 NFL DRAFT — 1st-round projection from GridironIQ model")
    print("(skill positions only: QB / WR / RB, N = 42 prospects)")
    print("=" * 78)
    print(f"\nTHRESHOLD: P(R1) >= {THRESHOLD:.2f}")
    print(f"Model projects {len(r1)} skill-position players inside Round 1:\n")
    header = f"{'#':>3}  {'POS':<3}  {'P(R1)':>6}  {'PROSPECT':<22}  {'SCHOOL':<18}  {'CONF':<18}  STAT LINE"
    print(header)
    print("-" * len(header))
    for _, r in r1.iterrows():
        print(f"{int(r['overall_rank']):>3}  {r['position']:<3}  "
              f"{r['r1_probability']:>6.2f}  {r['name'][:22]:<22}  "
              f"{str(r['college_team'])[:18]:<18}  {str(r['college_conference'])[:18]:<18}  "
              f"{r['stat_line']}")

    if not near.empty:
        print(f"\nBUBBLE (0.40 ≤ P(R1) < {THRESHOLD:.2f})")
        for _, r in near.iterrows():
            print(f"{int(r['overall_rank']):>3}  {r['position']:<3}  "
                  f"{r['r1_probability']:>6.2f}  {r['name'][:22]:<22}  "
                  f"{str(r['college_team'])[:18]:<18}  {str(r['college_conference'])[:18]:<18}  "
                  f"{r['stat_line']}")

    # Per-position counts
    print("\nBY POSITION (P(R1) >= 0.50):")
    counts = r1.groupby("position").size().reindex(["QB", "WR", "RB"], fill_value=0)
    for p, n in counts.items():
        print(f"  {p}: {n}")

    # ---- markdown report ------------------------------------------------- #
    lines: list[str] = []
    lines.append("# 2026 NFL Draft — 1st-round projection (skill positions)")
    lines.append("")
    lines.append("GridironIQ dual-model (LR + XGBoost) first-round probability, combined across "
                 "QB / WR / RB from the 42-prospect RMU SAC test set.")
    lines.append("")
    lines.append(f"**Threshold:** P(R1) ≥ {THRESHOLD:.2f}.  "
                 f"**Inside R1:** {len(r1)} prospects.  "
                 f"**Bubble (0.40–0.49):** {len(near)} prospects.")
    lines.append("")
    lines.append("## Projected Round 1")
    lines.append("")
    lines.append("| # | Pos | P(R1) | Prospect | School | Conference | Key line |")
    lines.append("|---|-----|-------|----------|--------|------------|----------|")
    for _, r in r1.iterrows():
        lines.append(f"| {int(r['overall_rank'])} | {r['position']} | "
                     f"**{r['r1_probability']:.2f}** | {r['name']} | "
                     f"{r['college_team']} | {r['college_conference']} | {r['stat_line']} |")

    if not near.empty:
        lines.append("")
        lines.append("## Bubble (0.40 ≤ P(R1) < 0.50)")
        lines.append("")
        lines.append("| # | Pos | P(R1) | Prospect | School | Conference | Key line |")
        lines.append("|---|-----|-------|----------|--------|------------|----------|")
        for _, r in near.iterrows():
            lines.append(f"| {int(r['overall_rank'])} | {r['position']} | "
                         f"{r['r1_probability']:.2f} | {r['name']} | "
                         f"{r['college_team']} | {r['college_conference']} | {r['stat_line']} |")

    lines.append("")
    lines.append("## By-position count (P(R1) ≥ 0.50)")
    lines.append("")
    for p in ("QB", "WR", "RB"):
        lines.append(f"- **{p}:** {int(counts[p])}")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("*Source: GridironIQ R1 engine · holdout AUC — QB 0.80 · WR 0.77 · RB 0.72.*  ")
    lines.append("*Prepared by Akhi Chappidi · UNC Charlotte · RMU SAC 2026.*")

    OUT_MD.write_text("\n".join(lines) + "\n")

    print(f"\nwrote {OUT_CSV.relative_to(REPO)}")
    print(f"wrote {OUT_MD.relative_to(REPO)}")


if __name__ == "__main__":
    main()
