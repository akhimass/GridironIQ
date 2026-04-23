from __future__ import annotations

from gridironiq.draft.offseason_context import (
    OffseasonMove,
    _compute_need_reduction,
    compute_adjusted_need_scores,
    load_transactions_override,
)


def test_need_reduction_phillips():
    """Phillips 4yr/$120M should reduce EDGE need significantly."""
    move = OffseasonMove(
        type="free_agency_signing",
        player="Jaelan Phillips",
        pos="EDGE",
        from_team="MIA",
        to_team="CAR",
        contract_aav=30_000_000,
        contract_years=4,
    )
    reduction = _compute_need_reduction(move, "EDGE")
    assert reduction >= 15.0, f"Expected >=15 reduction, got {reduction}"
    assert reduction <= 40.0, f"Expected <=40 reduction, got {reduction}"


def test_bridge_signing_smaller_reduction():
    """1-year bridge signing should reduce need less than multi-year."""
    bridge = OffseasonMove(
        type="free_agency_signing",
        player="Rasheed Walker",
        pos="OT",
        from_team="PIT",
        to_team="CAR",
        contract_aav=8_000_000,
        contract_years=1,
    )
    multi = OffseasonMove(
        type="free_agency_signing",
        player="Hypothetical OT",
        pos="OT",
        from_team="FA",
        to_team="CAR",
        contract_aav=18_000_000,
        contract_years=4,
    )
    bridge_reduction = _compute_need_reduction(bridge, "OT")
    multi_reduction = _compute_need_reduction(multi, "OT")
    assert bridge_reduction < multi_reduction, "Bridge should reduce need less"


def test_transactions_json_loads():
    """transactions_2026.json should load without error."""
    from gridironiq.draft.offseason_context import load_transactions_json

    data = load_transactions_json("data/offseason/transactions_2026.json")
    assert isinstance(data.get("sources"), list)
    assert isinstance(data.get("net_need_adjustments_by_team"), dict)


def test_adjusted_needs_car():
    """CAR net row should lower EDGE/LB/OT from curated deltas."""
    base = {"EDGE": 72.7, "TE": 77.3, "LB": 100.0, "OT": 63.5}
    adjusted = compute_adjusted_need_scores(
        team="CAR",
        season=2026,
        base_need_scores=base,
        transactions_path="data/offseason/transactions_2026.json",
    )
    assert adjusted["EDGE"] < base["EDGE"], "CAR net EDGE delta should reduce need"
    assert adjusted["TE"] == base["TE"], "CAR net TE delta is 0"
    assert adjusted["LB"] < base["LB"], "CAR net LB delta should reduce need"
    assert adjusted["OT"] < base["OT"], "CAR net OT delta should reduce need"


def test_dexter_lawrence_trade_context():
    """Cumulative net table should show CIN IDL improvement after Lawrence."""
    from gridironiq.draft.offseason_context import load_transactions_json

    data = load_transactions_json("data/offseason/transactions_2026.json")
    net = data.get("net_need_adjustments_by_team") or {}
    assert float(net["CIN"]["IDL"]) < -30.0
