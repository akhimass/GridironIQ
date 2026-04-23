#!/usr/bin/env python3
"""Extract the first top-level JSON object from a file that may contain two concatenated objects (`}{`)."""
from __future__ import annotations

import argparse
import json
import pathlib


def first_json_object(text: str) -> dict:
    text = text.strip()
    depth = 0
    start = None
    for i, ch in enumerate(text):
        if ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and start is not None:
                return json.loads(text[start : i + 1])
    raise ValueError("No balanced JSON object found")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("inp", type=pathlib.Path, help="Path to possibly duplicated JSON file")
    p.add_argument("out", type=pathlib.Path, help="Output path for cleaned JSON")
    args = p.parse_args()
    obj = first_json_object(args.inp.read_text())
    args.out.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {args.out} ({len(obj.get('transactions', []))} transactions)")


if __name__ == "__main__":
    main()
