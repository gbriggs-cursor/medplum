#!/usr/bin/env python3
"""Scores an L13 findings.json with the private answer key, when that key is on this machine.

    score.py <findings.json> [--pack-dir <pack>] [--answer-key-dir <dir>]

The key directory is --answer-key-dir, else $L13_ANSWER_KEY_DIR, else ~/.cache/medplum-demos/answer-keys/analytics-10k
(provisioned from answer-keys://analytics-10k/, never committed here). It holds index.json:
    {"scorer": "<file>", "packs": {"<pack name>": "<key file>"}}
The scorer is run as <scorer> <key file> <findings.json> [--pack-dir <pack>] --shared-dir <synthea-analytics dir>.

If the directory, index.json, the scorer, or the key for this pack is missing, prints "answer key absent" and exits 0.
"""

import argparse
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SHARED = os.path.abspath(os.path.join(HERE, "..", "_shared", "data-packs", "synthea-analytics"))
DEFAULT_KEY_DIR = os.path.expanduser("~/.cache/medplum-demos/answer-keys/analytics-10k")


def absent(reason):
    print(f"answer key absent ({reason}); run is unscored")
    sys.exit(0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("findings")
    ap.add_argument("--pack-dir")
    ap.add_argument("--answer-key-dir")
    args = ap.parse_args()

    key_dir = args.answer_key_dir or os.environ.get("L13_ANSWER_KEY_DIR") or DEFAULT_KEY_DIR
    index_path = os.path.join(key_dir, "index.json")
    if not os.path.isfile(index_path):
        absent(f"no index.json in {key_dir}")
    index = json.load(open(index_path))
    pack = json.load(open(args.findings)).get("pack")
    scorer = os.path.join(key_dir, index.get("scorer", ""))
    key_file = index.get("packs", {}).get(pack)
    if not os.path.isfile(scorer):
        absent("scorer missing")
    if not key_file or not os.path.isfile(os.path.join(key_dir, key_file)):
        absent(f"no key for {pack}")

    cmd = [sys.executable, scorer, os.path.join(key_dir, key_file), args.findings, "--shared-dir", SHARED]
    if args.pack_dir:
        cmd += ["--pack-dir", args.pack_dir]
    print(f"answer key present: {key_file}", flush=True)
    sys.exit(subprocess.run(cmd).returncode)


if __name__ == "__main__":
    main()
