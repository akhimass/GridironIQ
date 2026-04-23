"""Encode the 2026 NFL Draft order (all 257 picks) and emit it as JSON.

Source: ESPN's 2026 NFL Draft order (user-provided). Captures the full seven
rounds including trades, compensatory picks, and per-team top-5 needs. The
output is consumed by the GridironIQ frontend (see
``gridiron-intel/src/lib/engine.ts`` → ``useEngineData``) and replaces the
reverse-2025-standings heuristic we previously used for the Mock Draft pane.

Two artifacts are written:

1. ``outputs/nfl_draft_order_2026.json`` — canonical copy in the repo.
2. ``gridiron-intel/public/data/nfl_draft_order_2026.json`` — static asset
   the React app fetches at runtime. The pipeline keeps both in sync via
   ``scripts/run_real_draft_engine.py``.
"""

from __future__ import annotations

import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

# ---------------------------------------------------------------------------
# Team → top-5 positional needs (from ESPN's 2026 draft board).
# ---------------------------------------------------------------------------
TEAM_NEEDS: dict[str, list[str]] = {
    "LV":  ["QB",   "WR",   "OL",   "DL",   "CB"],
    "NYJ": ["QB",   "EDGE", "WR",   "CB",   "OL"],
    "ARI": ["QB",   "OL",   "EDGE", "DL",   "LB"],
    "TEN": ["OL",   "EDGE", "WR",   "RB",   "LB"],
    "NYG": ["DL",   "OL",   "CB",   "LB",   "WR"],
    "CLE": ["QB",   "OL",   "WR",   "CB",   "EDGE"],
    "WAS": ["WR",   "EDGE", "OL",   "S",    "RB"],
    "NO":  ["WR",   "EDGE", "CB",   "DL",   "OL"],
    "KC":  ["CB",   "WR",   "EDGE", "DL",   "OL"],
    "MIA": ["WR",   "CB",   "EDGE", "OL",   "S"],
    "DAL": ["EDGE", "LB",   "CB",   "DL",   "OL"],
    "LAR": ["WR",   "OL",   "LB",   "EDGE", "CB"],
    "BAL": ["OL",   "WR",   "EDGE", "DL",   "TE"],
    "TB":  ["EDGE", "CB",   "LB",   "OL",   "DL"],
    "DET": ["OL",   "EDGE", "S",    "CB",   "LB"],
    "MIN": ["DL",   "OL",   "S",    "WR",   "CB"],
    "CAR": ["OL",   "S",    "WR",   "TE",   "DL"],
    "PIT": ["QB",   "OL",   "WR",   "TE",   "LB"],
    "LAC": ["OL",   "EDGE", "DL",   "CB",   "WR"],
    "PHI": ["EDGE", "OL",   "S",    "WR",   "TE"],
    "CHI": ["S",    "OL",   "EDGE", "DL",   "WR"],
    "BUF": ["EDGE", "OL",   "LB",   "S",    "WR"],
    "SF":  ["OL",   "EDGE", "WR",   "DL",   "S"],
    "HOU": ["OL",   "DL",   "LB",   "CB",   "EDGE"],
    "NE":  ["EDGE", "OL",   "DL",   "TE",   "WR"],
    "SEA": ["RB",   "OL",   "CB",   "EDGE", "WR"],
    "CIN": ["LB",   "CB",   "OL",   "EDGE", "WR"],
    "ATL": ["WR",   "OL",   "DL",   "CB",   "EDGE"],
    "GB":  ["EDGE", "DL",   "OL",   "CB",   "RB"],
    "JAX": ["LB",   "EDGE", "DL",   "OL",   "S"],
    "IND": ["EDGE", "LB",   "S",    "OL",   "WR"],
    "DEN": ["DL",   "TE",   "CB",   "LB",   "OL"],
}

TEAM_LONG_NAMES: dict[str, str] = {
    "LV":  "Las Vegas Raiders",
    "NYJ": "New York Jets",
    "ARI": "Arizona Cardinals",
    "TEN": "Tennessee Titans",
    "NYG": "New York Giants",
    "CLE": "Cleveland Browns",
    "WAS": "Washington Commanders",
    "NO":  "New Orleans Saints",
    "KC":  "Kansas City Chiefs",
    "MIA": "Miami Dolphins",
    "DAL": "Dallas Cowboys",
    "LAR": "Los Angeles Rams",
    "BAL": "Baltimore Ravens",
    "TB":  "Tampa Bay Buccaneers",
    "DET": "Detroit Lions",
    "MIN": "Minnesota Vikings",
    "CAR": "Carolina Panthers",
    "PIT": "Pittsburgh Steelers",
    "LAC": "Los Angeles Chargers",
    "PHI": "Philadelphia Eagles",
    "CHI": "Chicago Bears",
    "BUF": "Buffalo Bills",
    "SF":  "San Francisco 49ers",
    "HOU": "Houston Texans",
    "NE":  "New England Patriots",
    "SEA": "Seattle Seahawks",
    "CIN": "Cincinnati Bengals",
    "ATL": "Atlanta Falcons",
    "GB":  "Green Bay Packers",
    "JAX": "Jacksonville Jaguars",
    "IND": "Indianapolis Colts",
    "DEN": "Denver Broncos",
}


# ---------------------------------------------------------------------------
# Pick encoding.
#
# Each pick is declared as ``(overall, round, pick_in_round, team, via, flags)``
# where ``via`` is an ordered list of prior owners (original team first, then
# any intermediate trade stops; empty if the pick has never changed hands).
# ``flags`` is a (possibly empty) set of strings — ``"comp"`` for a
# compensatory pick, ``"sp_comp"`` for a special compensatory selection.
# ---------------------------------------------------------------------------
PickTuple = tuple[int, int, int, str, list[str], set[str]]


def P(overall: int, rnd: int, pir: int, team: str, via: list[str] | None = None,
      *flags: str) -> PickTuple:
    return (overall, rnd, pir, team, via or [], set(flags))


PICKS: list[PickTuple] = [
    # Round 1 ------------------------------------------------------------
    P(1,  1, 1,  "LV"),
    P(2,  1, 2,  "NYJ"),
    P(3,  1, 3,  "ARI"),
    P(4,  1, 4,  "TEN"),
    P(5,  1, 5,  "NYG"),
    P(6,  1, 6,  "CLE"),
    P(7,  1, 7,  "WAS"),
    P(8,  1, 8,  "NO"),
    P(9,  1, 9,  "KC"),
    P(10, 1, 10, "NYG",  ["CIN"]),
    P(11, 1, 11, "MIA"),
    P(12, 1, 12, "DAL"),
    P(13, 1, 13, "LAR",  ["ATL"]),
    P(14, 1, 14, "BAL"),
    P(15, 1, 15, "TB"),
    P(16, 1, 16, "NYJ",  ["IND"]),
    P(17, 1, 17, "DET"),
    P(18, 1, 18, "MIN"),
    P(19, 1, 19, "CAR"),
    P(20, 1, 20, "DAL",  ["GB"]),
    P(21, 1, 21, "PIT"),
    P(22, 1, 22, "LAC"),
    P(23, 1, 23, "PHI"),
    P(24, 1, 24, "CLE",  ["JAX"]),
    P(25, 1, 25, "CHI"),
    P(26, 1, 26, "BUF"),
    P(27, 1, 27, "SF"),
    P(28, 1, 28, "HOU"),
    P(29, 1, 29, "KC",   ["LAR"]),
    P(30, 1, 30, "MIA",  ["DEN"]),
    P(31, 1, 31, "NE"),
    P(32, 1, 32, "SEA"),

    # Round 2 ------------------------------------------------------------
    P(33, 2, 1,  "NYJ"),
    P(34, 2, 2,  "ARI"),
    P(35, 2, 3,  "TEN"),
    P(36, 2, 4,  "LV"),
    P(37, 2, 5,  "NYG"),
    P(38, 2, 6,  "HOU",  ["WAS"]),
    P(39, 2, 7,  "CLE"),
    P(40, 2, 8,  "KC"),
    P(41, 2, 9,  "CIN"),
    P(42, 2, 10, "NO"),
    P(43, 2, 11, "MIA"),
    P(44, 2, 12, "NYJ",  ["DAL"]),
    P(45, 2, 13, "BAL"),
    P(46, 2, 14, "TB"),
    P(47, 2, 15, "IND"),
    P(48, 2, 16, "ATL"),
    P(49, 2, 17, "MIN"),
    P(50, 2, 18, "DET"),
    P(51, 2, 19, "CAR"),
    P(52, 2, 20, "GB"),
    P(53, 2, 21, "PIT"),
    P(54, 2, 22, "PHI"),
    P(55, 2, 23, "LAC"),
    P(56, 2, 24, "JAX"),
    P(57, 2, 25, "CHI"),
    P(58, 2, 26, "SF"),
    P(59, 2, 27, "HOU"),
    P(60, 2, 28, "CHI",  ["BUF"]),
    P(61, 2, 29, "LAR"),
    P(62, 2, 30, "DEN"),
    P(63, 2, 31, "NE"),
    P(64, 2, 32, "SEA"),

    # Round 3 ------------------------------------------------------------
    P(65, 3, 1,  "ARI"),
    P(66, 3, 2,  "TEN"),
    P(67, 3, 3,  "LV"),
    P(68, 3, 4,  "PHI",  ["NYJ"]),
    P(69, 3, 5,  "HOU",  ["NYG"]),
    P(70, 3, 6,  "CLE"),
    P(71, 3, 7,  "WAS"),
    P(72, 3, 8,  "CIN"),
    P(73, 3, 9,  "NO"),
    P(74, 3, 10, "KC"),
    P(75, 3, 11, "MIA"),
    P(76, 3, 12, "PIT",  ["DAL"]),
    P(77, 3, 13, "TB"),
    P(78, 3, 14, "IND"),
    P(79, 3, 15, "ATL"),
    P(80, 3, 16, "BAL"),
    P(81, 3, 17, "JAX",  ["DET"]),
    P(82, 3, 18, "MIN"),
    P(83, 3, 19, "CAR"),
    P(84, 3, 20, "GB"),
    P(85, 3, 21, "PIT"),
    P(86, 3, 22, "LAC"),
    P(87, 3, 23, "MIA",  ["PHI"]),
    P(88, 3, 24, "JAX"),
    P(89, 3, 25, "CHI"),
    P(90, 3, 26, "MIA",  ["HOU"]),
    P(91, 3, 27, "BUF"),
    P(92, 3, 28, "DAL",  ["SF"]),
    P(93, 3, 29, "LAR"),
    P(94, 3, 30, "MIA",  ["DEN"]),
    P(95, 3, 31, "NE"),
    P(96, 3, 32, "SEA"),
    P(97, 3, 33, "MIN",  None, "comp"),
    P(98, 3, 34, "PHI",  None, "comp"),
    P(99, 3, 35, "PIT",  None, "comp"),
    P(100, 3, 36, "JAX", ["DET"], "sp_comp"),

    # Round 4 ------------------------------------------------------------
    P(101, 4, 1,  "TEN"),
    P(102, 4, 2,  "LV"),
    P(103, 4, 3,  "NYJ"),
    P(104, 4, 4,  "ARI"),
    P(105, 4, 5,  "NYG"),
    P(106, 4, 6,  "HOU", ["WAS"]),
    P(107, 4, 7,  "CLE"),
    P(108, 4, 8,  "DEN", ["NO"]),
    P(109, 4, 9,  "KC"),
    P(110, 4, 10, "CIN"),
    P(111, 4, 11, "DEN", ["MIA"]),
    P(112, 4, 12, "DAL"),
    P(113, 4, 13, "IND"),
    P(114, 4, 14, "PHI", ["ATL"]),
    P(115, 4, 15, "BAL"),
    P(116, 4, 16, "TB"),
    P(117, 4, 17, "LV",  ["MIN", "JAX"]),
    P(118, 4, 18, "DET"),
    P(119, 4, 19, "CAR"),
    P(120, 4, 20, "GB"),
    P(121, 4, 21, "PIT"),
    P(122, 4, 22, "ATL", ["PHI"]),
    P(123, 4, 23, "LAC"),
    P(124, 4, 24, "JAX"),
    P(125, 4, 25, "NE",  ["CHI", "KC"]),
    P(126, 4, 26, "BUF"),
    P(127, 4, 27, "SF"),
    P(128, 4, 28, "DET", ["HOU"]),
    P(129, 4, 29, "CHI", ["LAR"]),
    P(130, 4, 30, "MIA", ["DEN"]),
    P(131, 4, 31, "NE"),
    P(132, 4, 32, "NO",  ["SEA"]),
    P(133, 4, 33, "SF",  None, "comp"),
    P(134, 4, 34, "LV",  None, "comp"),
    P(135, 4, 35, "PIT", None, "comp"),
    P(136, 4, 36, "NO",  None, "comp"),
    P(137, 4, 37, "PHI", None, "comp"),
    P(138, 4, 38, "SF",  None, "comp"),
    P(139, 4, 39, "SF",  None, "comp"),
    P(140, 4, 40, "NYJ", None, "comp"),

    # Round 5 ------------------------------------------------------------
    P(141, 5, 1,  "HOU", ["LV", "CLE"]),
    P(142, 5, 2,  "TEN", ["NYJ", "BAL"]),
    P(143, 5, 3,  "ARI"),
    P(144, 5, 4,  "TEN", ["TEN", "LAR"]),  # traded away and recovered
    P(145, 5, 5,  "NYG"),
    P(146, 5, 6,  "CLE"),
    P(147, 5, 7,  "WAS"),
    P(148, 5, 8,  "KC"),
    P(149, 5, 9,  "CLE", ["CIN"]),
    P(150, 5, 10, "NO"),
    P(151, 5, 11, "MIA"),
    P(152, 5, 12, "DAL"),
    P(153, 5, 13, "GB",  ["ATL", "PHI"]),
    P(154, 5, 14, "BAL"),
    P(155, 5, 15, "TB"),
    P(156, 5, 16, "IND"),
    P(157, 5, 17, "DET"),
    P(158, 5, 18, "CAR", ["MIN"]),
    P(159, 5, 19, "CAR"),
    P(160, 5, 20, "GB"),
    P(161, 5, 21, "PIT"),
    P(162, 5, 22, "BAL", ["LAC"]),
    P(163, 5, 23, "MIN", ["PHI"]),
    P(164, 5, 24, "JAX"),
    P(165, 5, 25, "BUF", ["CHI"]),
    P(166, 5, 26, "JAX", ["SF", "PHI"]),
    P(167, 5, 27, "HOU", ["HOU", "PHI"]),  # traded away and recovered
    P(168, 5, 28, "BUF"),
    P(169, 5, 29, "KC",  ["LAR"]),
    P(170, 5, 30, "DEN"),
    P(171, 5, 31, "NE"),
    P(172, 5, 32, "NO",  ["SEA"]),
    P(173, 5, 33, "BAL", None, "comp"),
    P(174, 5, 34, "BAL", None, "comp"),
    P(175, 5, 35, "LV",  None, "comp"),
    P(176, 5, 36, "KC",  None, "comp"),
    P(177, 5, 37, "DAL", None, "comp"),
    P(178, 5, 38, "PHI", None, "comp"),
    P(179, 5, 39, "NYJ", None, "comp"),
    P(180, 5, 40, "DAL", None, "comp"),
    P(181, 5, 41, "DET", None, "comp"),

    # Round 6 ------------------------------------------------------------
    P(182, 6, 1,  "BUF", ["NYJ", "CLE", "JAX", "LV"]),
    P(183, 6, 2,  "ARI"),
    P(184, 6, 3,  "TEN"),
    P(185, 6, 4,  "LV"),
    P(186, 6, 5,  "NYG"),
    P(187, 6, 6,  "WAS"),
    P(188, 6, 7,  "SEA", ["CLE"]),
    P(189, 6, 8,  "CIN"),
    P(190, 6, 9,  "NO"),
    P(191, 6, 10, "NE",  ["KC"]),
    P(192, 6, 11, "NYG", ["MIA"]),
    P(193, 6, 12, "NYG", ["DAL"]),
    P(194, 6, 13, "TEN", ["BAL", "NYJ"]),
    P(195, 6, 14, "TB"),
    P(196, 6, 15, "MIN", ["IND"]),
    P(197, 6, 16, "PHI", ["ATL"]),
    P(198, 6, 17, "NE",  ["MIN", "HOU", "MIN", "SF"]),
    P(199, 6, 18, "CIN", ["DET", "CLE"]),
    P(200, 6, 19, "CAR"),
    P(201, 6, 20, "GB"),
    P(202, 6, 21, "NE",  ["PIT"]),
    P(203, 6, 22, "JAX", ["PHI", "HOU", "PHI"]),
    P(204, 6, 23, "LAC"),
    P(205, 6, 24, "DET", ["JAX"]),
    P(206, 6, 25, "CLE", ["CHI"]),
    P(207, 6, 26, "LAR", ["HOU", "LAR", "TEN"]),
    P(208, 6, 27, "LV",  ["BUF", "NYJ"]),
    P(209, 6, 28, "WAS", ["SF"]),
    P(210, 6, 29, "KC",  ["LAR"]),
    P(211, 6, 30, "BAL", ["DEN", "NYJ", "MIN", "PHI"]),
    P(212, 6, 31, "NE"),
    P(213, 6, 32, "DET", ["SEA", "JAX"]),
    P(214, 6, 33, "IND", ["PIT"], "comp"),
    P(215, 6, 34, "ATL", ["PHI"], "comp"),
    P(216, 6, 35, "PIT", None, "comp"),

    # Round 7 ------------------------------------------------------------
    P(217, 7, 1,  "ARI"),
    P(218, 7, 2,  "DAL", ["TEN"]),
    P(219, 7, 3,  "LV"),
    P(220, 7, 4,  "BUF", ["NYJ"]),
    P(221, 7, 5,  "CIN", ["NYG", "DAL"]),
    P(222, 7, 6,  "DET", ["CLE"]),
    P(223, 7, 7,  "WAS"),
    P(224, 7, 8,  "PIT", ["NO", "NE"]),
    P(225, 7, 9,  "TEN", ["KC", "DAL"]),
    P(226, 7, 10, "CIN"),
    P(227, 7, 11, "MIA"),
    P(228, 7, 12, "NYJ", ["DAL", "BUF", "LV"]),
    P(229, 7, 13, "TB"),
    P(230, 7, 14, "PIT", ["IND"]),
    P(231, 7, 15, "ATL"),
    P(232, 7, 16, "LAR", ["BAL"]),
    P(233, 7, 17, "JAX", ["DET"]),
    P(234, 7, 18, "MIN"),
    P(235, 7, 19, "MIN", ["CAR"]),
    P(236, 7, 20, "GB"),
    P(237, 7, 21, "PIT"),
    P(238, 7, 22, "MIA", ["LAC", "TEN", "NYJ"]),
    P(239, 7, 23, "CHI", ["PHI", "JAX", "CLE"]),
    P(240, 7, 24, "JAX"),
    P(241, 7, 25, "CHI"),
    P(242, 7, 26, "NYJ", ["BUF", "CLE"]),
    P(243, 7, 27, "HOU", ["SF"]),
    P(244, 7, 28, "MIN", ["HOU"]),
    P(245, 7, 29, "JAX", ["LAR", "HOU"]),
    P(246, 7, 30, "DEN"),
    P(247, 7, 31, "NE"),
    P(248, 7, 32, "CLE", ["SEA"]),
    P(249, 7, 33, "IND", None, "comp"),
    P(250, 7, 34, "BAL", None, "comp"),
    P(251, 7, 35, "LAR", None, "comp"),
    P(252, 7, 36, "LAR", None, "comp"),
    P(253, 7, 37, "BAL", None, "comp"),
    P(254, 7, 38, "IND", None, "comp"),
    P(255, 7, 39, "GB",  None, "comp"),
    P(256, 7, 40, "DEN", None, "comp"),
    P(257, 7, 41, "DEN", None, "comp"),
]


def _assert_consistency() -> None:
    """Light integrity checks on the encoded data."""
    # Sequential overall picks.
    for i, pick in enumerate(PICKS, start=1):
        assert pick[0] == i, f"pick {pick} is out of order (expected overall {i})"

    # Round boundaries.
    round_counts: dict[int, int] = {}
    for _, r, _pir, *_rest in PICKS:
        round_counts[r] = round_counts.get(r, 0) + 1
    expected = {1: 32, 2: 32, 3: 36, 4: 40, 5: 41, 6: 35, 7: 41}
    assert round_counts == expected, f"bad round sizes: {round_counts}"

    # All teams are known.
    for pick in PICKS:
        team = pick[3]
        via = pick[4]
        assert team in TEAM_NEEDS, f"unknown current team {team!r}"
        for t in via:
            assert t in TEAM_NEEDS, f"unknown via team {t!r} in pick {pick[0]}"


def build_payload() -> dict:
    _assert_consistency()
    picks_json = []
    for overall, rnd, pir, team, via, flags in PICKS:
        picks_json.append(
            {
                "overall": overall,
                "round": rnd,
                "pick_in_round": pir,
                "team": team,
                "team_long": TEAM_LONG_NAMES[team],
                "via": via,
                "original_team": via[0] if via else team,
                "is_compensatory": "comp" in flags,
                "is_special_comp": "sp_comp" in flags,
            }
        )
    return {
        "source": "ESPN 2026 NFL Draft order (user-provided transcription)",
        "total_picks": len(PICKS),
        "rounds": {str(k): v for k, v in sorted(
            {p["round"]: 0 for p in picks_json}.items())},
        "team_needs": TEAM_NEEDS,
        "team_long_names": TEAM_LONG_NAMES,
        "picks": picks_json,
    }


def main() -> None:
    payload = build_payload()

    out1 = REPO / "outputs" / "nfl_draft_order_2026.json"
    out1.parent.mkdir(parents=True, exist_ok=True)
    out1.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    print(f"wrote {out1.relative_to(REPO)}  ({out1.stat().st_size:,} bytes)")

    out2 = REPO / "gridiron-intel" / "public" / "data" / "nfl_draft_order_2026.json"
    if out2.parent.parent.exists():
        out2.parent.mkdir(parents=True, exist_ok=True)
        out2.write_text(json.dumps(payload, ensure_ascii=False))
        print(f"wrote {out2.relative_to(REPO)}  ({out2.stat().st_size:,} bytes)")
    else:
        print(f"[skip] frontend not present at {out2.parent.parent}")

    by_round: dict[int, int] = {}
    for pick in payload["picks"]:
        by_round[pick["round"]] = by_round.get(pick["round"], 0) + 1
    trades = sum(1 for p in payload["picks"] if p["via"])
    comps = sum(1 for p in payload["picks"] if p["is_compensatory"])
    print(
        f"rounds={dict(sorted(by_round.items()))} · total={payload['total_picks']}"
        f" · trades={trades} · comp_picks={comps}"
    )


if __name__ == "__main__":
    main()
