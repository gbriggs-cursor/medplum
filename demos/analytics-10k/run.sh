#!/usr/bin/env bash
# L13 entry. DEMO_MODE selects live vs key-free. See demos/analytics-10k/README.md.
#   (unset)              live when CURSOR_API_KEY is set, otherwise REPLAY
#   replay | offline     REPLAY even if the key is set
#   live                 cloud-agent prompt; BLOCKED (exit 3) when the key is missing
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(cd "$here/../.." && pwd)"

offline_cmd="bash demos/analytics-10k/run.sh"
mode="${DEMO_MODE:-auto}"

blocked() {
  echo "BLOCKED: live mode needs CURSOR_API_KEY. Unset DEMO_MODE (or set DEMO_MODE=replay) to run REPLAY (no key) mode: $offline_cmd"
  exit 3
}

run_live() {
  # Same live path as before this script existed: prompt.md, pasted into a cloud agent.
  # Nothing here calls the agent API or rewrites the prompt.
  echo "LIVE: demos/analytics-10k/prompt.md"
  echo "Live mode available once keys are added: a cloud agent runs prompt.md against the pack instead of the checked-in REPLAY turns."
  exit 0
}

run_replay() {
  exec python3 "$here/replay.py"
}

case "$mode" in
  live)
    [ -n "${CURSOR_API_KEY:-}" ] || blocked
    run_live
    ;;
  replay | offline)
    run_replay
    ;;
  auto | "")
    if [ -n "${CURSOR_API_KEY:-}" ]; then
      run_live
    else
      run_replay
    fi
    ;;
  *)
    echo "unknown DEMO_MODE=$mode" >&2
    exit 2
    ;;
esac
