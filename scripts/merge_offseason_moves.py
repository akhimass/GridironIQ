#!/usr/bin/env python3
"""Merge optional sidecar move lists into data/offseason/transactions_2026.json (in-place)."""
from __future__ import annotations

import argparse
import json
import pathlib


def _load_sidecar(path: pathlib.Path) -> list[dict]:
    if not path.exists():
        return []
    raw = path.read_text(encoding="utf-8").strip()
    if not raw:
        return []
    if path.suffix == ".jsonl":
        out: list[dict] = []
        for line in raw.splitlines():
            line = line.strip()
            if not line:
                continue
            out.append(json.loads(line))
        return out
    obj = json.loads(raw)
    if isinstance(obj, list):
        return obj
    if isinstance(obj, dict) and isinstance(obj.get("transactions"), list):
        return list(obj["transactions"])
    return []


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument(
        "base",
        nargs="?",
        type=pathlib.Path,
        default=pathlib.Path("data/offseason/transactions_2026.json"),
    )
    args = p.parse_args()
    base_path = args.base
    data = json.loads(base_path.read_text(encoding="utf-8"))
    txs = list(data.get("transactions") or [])
    root = base_path.parent
    for name in ("transactions_2026.moves.json", "transactions_2026.moves.jsonl"):
        txs.extend(_load_sidecar(root / name))
    data["transactions"] = txs
    base_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"Merged {len(txs)} transactions into {base_path}")


if __name__ == "__main__":
    main()
