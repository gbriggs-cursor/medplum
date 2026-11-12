#!/usr/bin/env bash
# Environment install for the analytics packs (run at environment build time, never at demo time).
# Installs: Java 17+ check, the pinned Synthea jar (sha256-verified), DuckDB (Python 1.1.3 and CLI 1.1.3).
# Optional: FETCH_P2=1 also downloads the P2 release asset (see fetch.sh).
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SYNTHEA_VERSION=v3.3.0
SYNTHEA_SHA256=8ba04f7d73abadd5a377e41edf24c5c83935a1cb07c6d982cd5db731ef1cf445
SYNTHEA_URL="https://github.com/synthetichealth/synthea/releases/download/$SYNTHEA_VERSION/synthea-with-dependencies.jar"
DUCKDB_VERSION=1.1.3
CACHE="$HOME/.cache/medplum-demos"
JAR="$CACHE/synthea/synthea-with-dependencies-$SYNTHEA_VERSION.jar"

if ! command -v java >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y && sudo apt-get install -y --no-install-recommends openjdk-21-jre-headless
  else
    echo "install Java 17+ (for example openjdk-21-jre-headless)" >&2
    exit 1
  fi
fi
java_major="$(java -version 2>&1 | sed -nE 's/.*version "([0-9]+).*/\1/p' | head -1)"
[ "${java_major:-0}" -ge 17 ] || { echo "Java 17+ required, found ${java_major:-none}" >&2; exit 1; }

mkdir -p "$(dirname "$JAR")"
if [ ! -f "$JAR" ] || ! echo "$SYNTHEA_SHA256  $JAR" | sha256sum -c --status; then
  curl -fsSL -o "$JAR.tmp" "$SYNTHEA_URL"
  echo "$SYNTHEA_SHA256  $JAR.tmp" | sha256sum -c --status || { echo "Synthea jar sha256 mismatch" >&2; exit 1; }
  mv "$JAR.tmp" "$JAR"
fi

python3 -m pip install --user --quiet "duckdb==$DUCKDB_VERSION" 2>/dev/null \
  || python3 -m pip install --user --quiet --break-system-packages "duckdb==$DUCKDB_VERSION"

if ! command -v duckdb >/dev/null 2>&1; then
  mkdir -p "$HOME/.local/bin"
  curl -fsSL -o "$CACHE/duckdb_cli.zip" \
    "https://github.com/duckdb/duckdb/releases/download/v$DUCKDB_VERSION/duckdb_cli-linux-amd64.zip"
  python3 -c "import zipfile,sys; zipfile.ZipFile(sys.argv[1]).extract('duckdb', sys.argv[2])" \
    "$CACHE/duckdb_cli.zip" "$HOME/.local/bin"
  chmod +x "$HOME/.local/bin/duckdb"
fi

echo "install: java $java_major, synthea $SYNTHEA_VERSION at $JAR, duckdb $(python3 -c 'import duckdb; print(duckdb.__version__)')"
case ":$PATH:" in
  *":$HOME/.local/bin:"*) ;;
  *) echo "install: add \$HOME/.local/bin to PATH for the duckdb CLI" ;;
esac

if [ "${FETCH_P2:-0}" = "1" ]; then
  "$here/fetch.sh"
fi
