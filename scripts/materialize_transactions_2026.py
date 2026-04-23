#!/usr/bin/env python3
"""Build data/offseason/transactions_2026.json from _net_pick_sources.json (metadata + net table)."""
from __future__ import annotations

import json
import pathlib


def main() -> None:
    root = pathlib.Path(__file__).resolve().parents[1]
    src = root / "data" / "offseason" / "_net_pick_sources.json"
    out = root / "data" / "offseason" / "transactions_2026.json"
    payload = json.loads(src.read_text(encoding="utf-8"))
    obj = {
        "season": 2026,
        "last_updated": "2026-04-22",
        "sources": payload["sources"],
        "transactions": [],
        "pick_changes": payload["pick_changes"],
        "net_need_adjustments_by_team": payload["net_need_adjustments_by_team"],
    }
    out.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
