#!/usr/bin/env bash
# Builds a pack end to end: Synthea -> flatten -> (private plant step) -> DuckDB + MANIFEST -> tarball.
#   build-pack.sh p2     10,000 patients, seed 20261112 -> synthea-analytics-10k
#   build-pack.sh p0     100 patients, seed 100          -> synthea-analytics-100 (the committed fixture)
#
# The plant step lives in the private answer-keys repo (answer-keys://analytics-10k/). Without
# L13_PLANT_SCRIPT and L13_PLANT_SEED the pack is built clean and marked "planted": false.
# L13_ANSWER_KEY must point outside this repository.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="${L13_WORK_DIR:-$HOME/.cache/medplum-demos}"

case "${1:-}" in
  p2) POP=10000; SEED=20261112; NAME=synthea-analytics-10k ;;
  p0) POP=100; SEED=100; NAME=synthea-analytics-100 ;;
  *) echo "usage: build-pack.sh p0|p2" >&2; exit 1 ;;
esac

PACK="$WORK/$NAME"
SYNTHEA_SEED="$SEED" "$here/generate.sh" "$POP" "$WORK/synthea-$POP"
rm -rf "$PACK"
mkdir -p "$PACK"
python3 "$here/flatten.py" "$WORK/synthea-$POP/csv" "$PACK/parquet" --seed "$SEED"

planted=false
if [ -n "${L13_PLANT_SCRIPT:-}" ] && [ -n "${L13_PLANT_SEED:-}" ]; then
  : "${L13_ANSWER_KEY:?set L13_ANSWER_KEY to a path outside this repository}"
  python3 "$L13_PLANT_SCRIPT" "$PACK/parquet" --plant-seed "$L13_PLANT_SEED" --answer-key "$L13_ANSWER_KEY"
  planted=true
fi

python3 "$here/build-db.py" "$PACK/parquet" --pack "$NAME" --manifest ${L13_NO_DB:+--no-db}
python3 - "$PACK/MANIFEST.json" "$planted" "$POP" "$SEED" <<'EOF'
import json, sys
path, planted, pop, seed = sys.argv[1], sys.argv[2] == "true", int(sys.argv[3]), int(sys.argv[4])
m = json.load(open(path))
m.update({"planted": planted, "synthea": {"version": "v3.3.0", "population": pop, "seed": seed,
          "clinician_seed": seed, "reference_date": "2026-10-01", "end_date": "2026-10-01", "state": "Massachusetts"}})
json.dump(m, open(path, "w"), indent=2)
open(path, "a").write("\n")
EOF

tar -C "$WORK" --sort=name --mtime=2026-10-01 --owner=0 --group=0 --numeric-owner \
  --exclude analytics.duckdb -cf - "$NAME" | gzip -n > "$WORK/$NAME.tar.gz"
echo "build-pack: $WORK/$NAME.tar.gz ($(du -h "$WORK/$NAME.tar.gz" | cut -f1), planted=$planted)"
sha256sum "$WORK/$NAME.tar.gz"
