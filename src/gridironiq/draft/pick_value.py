"""
NFL draft pick value curve (exponential decay) and trade-down EV heuristic.

Inspired by classic pick trade charts (e.g. Johnson-style decay); used for
trade-down summaries and leverage scoring — not a substitute for live market data.
"""

from __future__ import annotations

from typing import Any, Dict, List

import numpy as np


def nfl_pick_value(pick: int) -> float:
    """
    Monotonic decay: pick 1 is highest; later picks approach zero.
    Calibrated so early picks dominate and late picks are small but positive.
    """
    if pick <= 0:
        return 0.0
    return max(0.0, 3000.0 * float(np.exp(-0.075 * (pick - 1))))


def trade_down_ev(
    current_pick: int,
    trade_pick: int,
    additional_picks: List[int],
    top_prospect_score: float,
    next_best_at_trade_pick: float,
) -> Dict[str, Any]:
    """
    Heuristic EV of trading from ``current_pick`` to ``trade_pick`` plus extra capital.
    """
    current_value = nfl_pick_value(int(current_pick))
    traded_value = nfl_pick_value(int(trade_pick))
    additional_value = sum(nfl_pick_value(int(p)) for p in additional_picks)

    total_received = traded_value + additional_value
    pick_value_gain = total_received - current_value

    prospect_cost = float(top_prospect_score) - float(next_best_at_trade_pick)
    score_cost_in_value = prospect_cost * 40.0

    ev = pick_value_gain - score_cost_in_value

    if ev > 80:
        rec = "TRADE DOWN"
    elif ev > -80:
        rec = "HOLD"
    else:
        rec = "TRADE UP"

    return {
        "current_pick": int(current_pick),
        "trade_pick": int(trade_pick),
        "current_value": round(current_value, 1),
        "total_received": round(total_received, 1),
        "pick_value_gain": round(pick_value_gain, 1),
        "prospect_score_cost": round(prospect_cost, 2),
        "ev_trade_down": round(ev, 1),
        "recommendation": rec,
    }
