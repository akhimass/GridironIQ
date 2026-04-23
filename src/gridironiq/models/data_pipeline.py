"""
RMU SAC / GridironIQ first-round model — training data prep (QB/WR/RB).

Loads CSVs with Data Dictionary field names; cleans and engineers features per position.
"""

from __future__ import annotations

from typing import List

import numpy as np
import pandas as pd

QB_FEATURES: List[str] = [
    "height_z",
    "weight_z",
    "completion_pct",
    "adj_completion_pct",
    "passing_yds",
    "passing_tds",
    "passing_ints",
    "passing_ypa",
    "td_int_ratio",
    "rushing_yds",
    "rushing_td",
    "conf_weight",
    "reg_win_pct",
    "had_postseason",
    "forty",
    "forty_attended",
    "vertical",
    "vertical_attended",
    "broad_jump",
    "broad_jump_attended",
]

WR_FEATURES: List[str] = [
    "height_z",
    "weight_z",
    "receiving_rec",
    "receiving_yds",
    "receiving_td",
    "receiving_ypr",
    "ypr_adj",
    "td_per_rec",
    "rushing_yds",
    "rushing_td",
    "conf_weight",
    "reg_win_pct",
    "had_postseason",
    "forty",
    "forty_attended",
    "vertical",
    "vertical_attended",
    "broad_jump",
    "broad_jump_attended",
    "cone",
    "cone_attended",
]

RB_FEATURES: List[str] = [
    "height_z",
    "weight_z",
    "rushing_car",
    "rushing_yds",
    "rushing_td",
    "rushing_ypc",
    "ypc_adj",
    "receiving_rec",
    "receiving_yds",
    "receiving_td",
    "receiving_role",
    "total_yds",
    "total_td",
    "conf_weight",
    "reg_win_pct",
    "had_postseason",
    "forty",
    "forty_attended",
    "vertical",
    "vertical_attended",
    "broad_jump",
    "broad_jump_attended",
    "bench",
    "bench_attended",
]


def _num_series(df: pd.DataFrame, col: str, default: float = 0.0) -> pd.Series:
    if col not in df.columns:
        return pd.Series(default, index=df.index, dtype=float)
    return pd.to_numeric(df[col], errors="coerce").fillna(default)


def ensure_first_round_target(df: pd.DataFrame) -> pd.DataFrame:
    """Ensure binary ``first_round`` exists (from ``draft_round`` when needed)."""
    out = df.copy()
    if "first_round" not in out.columns:
        if "draft_round" in out.columns:
            out["first_round"] = (pd.to_numeric(out["draft_round"], errors="coerce").fillna(99) == 1).astype(int)
        else:
            raise ValueError("Training data must include first_round or draft_round")
    else:
        out["first_round"] = pd.to_numeric(out["first_round"], errors="coerce").fillna(0).astype(int).clip(0, 1)
    return out


def clean_position_data(df: pd.DataFrame, position: str) -> pd.DataFrame:
    """
    Drop irrelevant stat columns, impute combine metrics, conference weighting,
    win-rate features, and position-specific derived fields.
    """
    pos = str(position).upper()
    df = df.copy()

    position_drops = {
        "QB": ["receiving_rec", "receiving_yds", "receiving_td", "receiving_ypr"],
        "WR": [
            "passing_completions",
            "passing_att",
            "completion_pct",
            "passing_yds",
            "passing_tds",
            "passing_ints",
            "passing_ypa",
        ],
        "RB": [
            "passing_completions",
            "passing_att",
            "completion_pct",
            "passing_yds",
            "passing_tds",
            "passing_ints",
            "passing_ypa",
        ],
    }
    df = df.drop(columns=position_drops.get(pos, []), errors="ignore")

    combine_cols = ["forty", "bench", "vertical", "broad_jump", "cone", "shuttle"]
    attended = df["attended_combine"].astype(str).str.upper().eq("Y")
    for col in combine_cols:
        if col not in df.columns:
            continue
        df[col] = pd.to_numeric(df[col], errors="coerce")
        med = float(df.loc[attended, col].median()) if attended.any() else float("nan")
        if np.isnan(med):
            med = 0.0
        mask_miss = attended & df[col].isna()
        df.loc[mask_miss, col] = med
        df[f"{col}_attended"] = attended.astype(int)

    conf_weights = {
        "SEC": 1.0,
        "Big Ten": 1.0,
        "Big 12": 0.95,
        "ACC": 0.90,
        "Pac-12": 0.90,
        "American": 0.75,
        "Mountain West": 0.70,
        "MAC": 0.65,
        "Sun Belt": 0.65,
        "Conference USA": 0.65,
        "Independent": 0.80,
    }
    df["conf_weight"] = df["college_conference"].astype(str).map(conf_weights).fillna(0.70)

    reg_g = _num_series(df, "regular_season_games", 1.0).clip(lower=1.0)
    reg_w = _num_series(df, "regular_season_wins", 0.0)
    df["reg_win_pct"] = reg_w / reg_g

    post_g = _num_series(df, "postseason_games", 0.0)
    post_w = _num_series(df, "postseason_wins", 0.0)
    df["had_postseason"] = (post_g > 0).astype(int)
    df["postseason_win_pct"] = (post_w / post_g.clip(lower=1.0)).fillna(0.0)

    if pos == "QB":
        ints = _num_series(df, "passing_ints", 0.5).clip(lower=0.5)
        df["td_int_ratio"] = _num_series(df, "passing_tds", 0.0) / ints
        comp_pct = _num_series(df, "completion_pct", 0.0)
        df["adj_completion_pct"] = comp_pct * df["conf_weight"]

    if pos in ("WR", "RB"):
        df["touches"] = _num_series(df, "rushing_car", 0.0) + _num_series(df, "receiving_rec", 0.0)
        df["total_yds"] = _num_series(df, "rushing_yds", 0.0) + _num_series(df, "receiving_yds", 0.0)
        df["total_td"] = _num_series(df, "rushing_td", 0.0) + _num_series(df, "receiving_td", 0.0)

    if pos == "WR":
        rec = _num_series(df, "receiving_rec", 0.0).clip(lower=1.0)
        df["ypr_adj"] = _num_series(df, "receiving_ypr", 0.0) * df["conf_weight"]
        df["td_per_rec"] = _num_series(df, "receiving_td", 0.0) / rec

    if pos == "RB":
        car = _num_series(df, "rushing_car", 0.0).clip(lower=0.0)
        ypc = _num_series(df, "rushing_yds", 0.0) / car.replace(0, np.nan)
        df["rushing_ypc"] = ypc.fillna(0.0)
        df["ypc_adj"] = df["rushing_ypc"] * df["conf_weight"]
        df["receiving_role"] = (_num_series(df, "receiving_rec", 0.0) >= 20).astype(int)

    for col in ("height", "weight"):
        if col not in df.columns:
            df[col] = 0.0
        s = pd.to_numeric(df[col], errors="coerce")
        mu, sig = float(s.mean()), float(s.std(ddof=0))
        if sig <= 1e-9:
            df[f"{col}_z"] = 0.0
        else:
            df[f"{col}_z"] = (s - mu) / sig

    return df


def load_position_csv(data_dir: str, position: str, split: str) -> pd.DataFrame:
    """Load ``{qb|wr|rb}_{train|test}.csv`` for a position."""
    pos = position.lower()
    sp = split.lower()
    path = f"{data_dir.rstrip('/')}/{pos}_{sp}.csv"
    return pd.read_csv(path)
