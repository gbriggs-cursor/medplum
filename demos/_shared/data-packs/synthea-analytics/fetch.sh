#!/usr/bin/env bash
# Downloads the P2 pack from the GitHub Release, verifies it, unpacks it, and builds analytics.duckdb.
# Run at environment build time (install.sh with FETCH_P2=1), never at demo time.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TAG=data-p2-synthea-analytics-10k-v1
ASSET=synthea-analytics-10k.tar.gz
SHA256="${L13_P2_SHA256:-$(sed -nE '/name: synthea-analytics-10k/,/install_path/ s/^ *tarball_sha256: *([0-9a-f]{64}).*/\1/p' "$here/pack.yaml")}"
[ -n "$SHA256" ] || { echo "fetch: no P2 tarball_sha256 in pack.yaml" >&2; exit 1; }
URL="${L13_P2_URL:-https://github.com/gbriggs-cursor/medplum/releases/download/$TAG/$ASSET}"
DATA="${L13_DATA_ROOT:-$HOME/.cache/medplum-demos}"

mkdir -p "$DATA"
if ! curl -fsSL -o "$DATA/$ASSET.tmp" "$URL"; then
  echo "fetch: could not download $URL (is the release published?). See pack.yaml release.status." >&2
  exit 1
fi
echo "$SHA256  $DATA/$ASSET.tmp" | sha256sum -c --status || { echo "fetch: sha256 mismatch for $ASSET" >&2; exit 1; }
mv "$DATA/$ASSET.tmp" "$DATA/$ASSET"
rm -rf "$DATA/synthea-analytics-10k"
tar -C "$DATA" -xzf "$DATA/$ASSET"
python3 "$here/build-db.py" "$DATA/synthea-analytics-10k/parquet" >/dev/null
python3 "$here/verify.py" "$DATA/synthea-analytics-10k"
