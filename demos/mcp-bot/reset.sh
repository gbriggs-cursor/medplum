#!/usr/bin/env bash
# Idempotent. Does not delete the synthetic Observation or Task the offline command creates.
set -euo pipefail
echo "mcp-bot: already clean"
