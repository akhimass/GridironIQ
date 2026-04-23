from __future__ import annotations

import numpy as np
import pandas as pd
from gridironiq.draft.pick_value import nfl_pick_value, trade_down_ev
from gridironiq.draft.scheme_fit import cosine_similarity_normalized
from gridironiq.draft.team_needs import NEED_SIGNAL_WEIGHTS
from gridironiq.models.data_pipeline import clean_position_data
from gridironiq.models.first_round_model import build_lr_model, build_xgb_model, predict_first_round_prob


def test_cosine_similarity_normalized_high_alignment() -> None:
    """L2-normalized cosine should be ~1 for parallel vectors (no magnitude domination)."""
    team_vec = np.array([0.1, 0.2, 0.3, 0.4, 0.5, 0.1, 0.2, 0.3, 0.4, 0.5], dtype=float)
    prospect_vec = team_vec * 2.7 + 0.05
    sim = cosine_similarity_normalized(team_vec, prospect_vec)
    assert sim > 0.99, f"expected ~1.0 parallel alignment, got {sim}"


def test_clean_removes_wrong_position_cols() -> None:
    df = pd.DataFrame(
        {
            "name": ["Player A"],
            "college_team": ["X"],
            "college_conference": ["SEC"],
            "position": ["WR"],
            "height": [72],
            "weight": [190],
            "season_before_draft": [2023],
            "passing_completions": [0],
            "passing_att": [0],
            "completion_pct": [0],
            "passing_yds": [0],
            "passing_tds": [0],
            "passing_ints": [0],
            "passing_ypa": [0],
            "receiving_rec": [80],
            "receiving_yds": [1100],
            "receiving_td": [9],
            "receiving_ypr": [13.75],
            "rushing_car": [5],
            "rushing_yds": [30],
            "rushing_td": [0],
            "rushing_ypc": [6.0],
            "regular_season_games": [12],
            "regular_season_wins": [8],
            "regular_season_losses": [4],
            "postseason_games": [2],
            "postseason_wins": [1],
            "postseason_losses": [1],
            "forty": [4.42],
            "bench": [12],
            "vertical": [38.0],
            "broad_jump": [128],
            "cone": [6.8],
            "shuttle": [4.1],
            "attended_combine": ["Y"],
        }
    )
    cleaned = clean_position_data(df, "WR")
    for col in ["passing_completions", "passing_yds", "passing_tds"]:
        assert col not in cleaned.columns, f"{col} should be dropped for WR"
    assert "receiving_yds" in cleaned.columns


def test_need_signal_weights_sum() -> None:
    s = sum(NEED_SIGNAL_WEIGHTS.values())
    assert abs(s - 1.0) < 1e-6


def test_nfl_pick_value_decay() -> None:
    v1 = nfl_pick_value(1)
    v32 = nfl_pick_value(32)
    v64 = nfl_pick_value(64)
    assert v1 > v32 > v64 > 0
    assert v1 > 2000
    assert v64 < 300


def test_trade_down_ev() -> None:
    ev = trade_down_ev(
        current_pick=19,
        trade_pick=25,
        additional_picks=[51],
        top_prospect_score=88.7,
        next_best_at_trade_pick=83.2,
    )
    assert "ev_trade_down" in ev
    assert "recommendation" in ev
    assert ev["recommendation"] in ["TRADE DOWN", "HOLD", "TRADE UP"]


def test_ensemble_probabilities_in_range() -> None:
    rng = np.random.default_rng(0)
    X = rng.random((40, 5))
    y = np.array([0, 1] * 20)
    lr = build_lr_model(X, y)
    xgb = build_xgb_model(X, y)
    probs = predict_first_round_prob(lr, xgb, X)
    assert probs.min() >= 0.0 and probs.max() <= 1.0 + 1e-9
