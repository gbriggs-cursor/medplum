#!/usr/bin/env bash
# Runs the pinned Synthea jar with the pinned seeds. Output: $OUT/csv/*.csv
#   generate.sh [population] [out_dir]
# Defaults: 10000 patients (P2). Use 100 with SYNTHEA_SEED=100 for the P0 fixture.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

POP="${1:-10000}"
OUT="${2:-${L13_WORK_DIR:-$HOME/.cache/medplum-demos}/synthea-$POP}"
JAR="${SYNTHEA_JAR:-$HOME/.cache/medplum-demos/synthea/synthea-with-dependencies-v3.3.0.jar}"
SEED="${SYNTHEA_SEED:-20261112}"
CLINICIAN_SEED="${SYNTHEA_CLINICIAN_SEED:-$SEED}"
REFERENCE_DATE=20261001
END_DATE=20261001

[ -f "$JAR" ] || { echo "missing $JAR; run $here/install.sh first" >&2; exit 1; }
rm -rf "$OUT"
mkdir -p "$OUT"

java "-Xmx${SYNTHEA_XMX:-8g}" -jar "$JAR" \
  -s "$SEED" -cs "$CLINICIAN_SEED" -r "$REFERENCE_DATE" -e "$END_DATE" -p "$POP" \
  --exporter.baseDirectory="$OUT" \
  --exporter.years_of_history=3 \
  --exporter.csv.export=true \
  --exporter.fhir.export=false \
  --exporter.hospital.fhir.export=false \
  --exporter.practitioner.fhir.export=false \
  Massachusetts | tee "$OUT/synthea.log" | tail -4

echo "generate: wrote $OUT/csv (population=$POP seed=$SEED clinician_seed=$CLINICIAN_SEED end=$END_DATE)"
