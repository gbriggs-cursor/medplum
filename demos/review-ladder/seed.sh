#!/usr/bin/env bash
# Cuts this run's review-ladder demo PRs from a baseline, or closes them.
#
#   demos/review-ladder/seed.sh [--baseline <ref>] [--run <YYYYMMDD>] [--dry-run]
#   demos/review-ladder/seed.sh --close [--run <YYYYMMDD>] [--dry-run]
#   demos/review-ladder/seed.sh --self-test
#
# Seed mode pushes demo/run-<run>/baseline (the PR base) and, for each patch in seeds/,
# demo/run-<run>/b-seed-<name>, then opens a draft PR labeled demo-do-not-merge.
# The baseline defaults to the tag demo-baseline-v1 (override with --baseline or SEED_BASELINE).
# Patches are applied in a temporary worktree: the current checkout and main are never touched.
#
# Close mode closes the run's open demo PRs without merging and deletes the run's demo/run-* branches.
# It never touches the recorded takes in PROTECTED_PRS.
#
# --dry-run does every local step (resolve the baseline, apply and commit each patch in a temporary
# worktree, select PRs to close) and prints the push, gh, and delete commands instead of running them.
# For tests, SEED_PR_LIST_JSON and SEED_REMOTE_BRANCHES name files that stand in for
# `gh pr list --json number,headRefName,title` and `git ls-remote --heads origin` output.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
SEEDS_DIR="$SCRIPT_DIR/seeds"
SEEDS=(bugbot security)
LABEL="demo-do-not-merge"
PROTECTED_PRS=(4 9 10 11 14 16 20)
DEFAULT_BASELINE="demo-baseline-v1"

MODE="seed"
DRY_RUN=0
BASELINE="${SEED_BASELINE:-$DEFAULT_BASELINE}"
RUN="$(date -u +%Y%m%d)"

die() {
  echo "seed.sh: $*" >&2
  exit 1
}

usage() {
  sed -n '2,6p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

while [ $# -gt 0 ]; do
  case "$1" in
    --baseline)
      [ $# -ge 2 ] || die "--baseline needs a ref"
      BASELINE="$2"
      shift 2
      ;;
    --run)
      [ $# -ge 2 ] || die "--run needs a YYYYMMDD date"
      RUN="$2"
      shift 2
      ;;
    --close) MODE="close"; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --self-test) MODE="self-test"; shift ;;
    -h | --help) usage; exit 0 ;;
    *) die "unknown argument: $1 (see --help)" ;;
  esac
done

[[ "$RUN" =~ ^[0-9]{8}$ ]] || die "--run must be YYYYMMDD, got '$RUN'"
RUN_PREFIX="demo/run-$RUN"
BASE_BRANCH="$RUN_PREFIX/baseline"

# Runs a command, or prints it under --dry-run.
act() {
  if [ "$DRY_RUN" = 1 ]; then
    printf 'DRY-RUN would run:'
    printf ' %q' "$@"
    printf '\n'
  else
    "$@"
  fi
}

is_protected() {
  local n="$1" p
  for p in "${PROTECTED_PRS[@]}"; do
    [ "$n" = "$p" ] && return 0
  done
  return 1
}

resolve_baseline() {
  local sha
  if [ "$BASELINE" = "$DEFAULT_BASELINE" ] && [ "$DRY_RUN" = 0 ]; then
    git -C "$REPO_ROOT" fetch --quiet origin "refs/tags/$BASELINE:refs/tags/$BASELINE" 2>/dev/null || true
  fi
  sha="$(git -C "$REPO_ROOT" rev-parse --verify --quiet "$BASELINE^{commit}")" || true
  if [ -z "$sha" ]; then
    if [ "$BASELINE" = "$DEFAULT_BASELINE" ]; then
      die "baseline tag $BASELINE does not exist yet. Ask Gio to tag the merged harness commit (git tag $BASELINE <sha> && git push origin $BASELINE), or pass --baseline <ref>."
    fi
    die "baseline ref '$BASELINE' does not resolve to a commit. Pass a tag, branch, or SHA with --baseline."
  fi
  echo "$sha"
}

seed() {
  local base_sha name patch wt seed_sha evidence_sha branch title body
  base_sha="$(resolve_baseline)"
  echo "seed.sh: baseline $BASELINE = $base_sha, run $RUN"
  TMP_DIR="$(mktemp -d)"
  trap 'for w in "$TMP_DIR"/wt-*; do [ -d "$w" ] && git -C "$REPO_ROOT" worktree remove --force "$w" >/dev/null 2>&1; done; rm -rf "$TMP_DIR"' EXIT

  act git -C "$REPO_ROOT" push origin "$base_sha:refs/heads/$BASE_BRANCH"
  if [ "$DRY_RUN" = 0 ]; then
    gh label list --search "$LABEL" --json name --jq '.[].name' | grep -qx "$LABEL" ||
      gh label create "$LABEL" --color B60205 --description "Demo artifact. Never merge."
  else
    echo "DRY-RUN would create label $LABEL if missing"
  fi

  for name in "${SEEDS[@]}"; do
    patch="$SEEDS_DIR/$name.patch"
    [ -f "$patch" ] || die "missing seed patch $patch"
    wt="$TMP_DIR/wt-$name"
    git -C "$REPO_ROOT" worktree add --quiet --detach "$wt" "$base_sha"
    git -C "$wt" apply --check "$patch" || die "$name.patch does not apply cleanly to $BASELINE ($base_sha)"
    git -C "$wt" apply --index "$patch"
    git -C "$wt" -c user.name="${GIT_AUTHOR_NAME:-Review Ladder Seed}" -c user.email="${GIT_AUTHOR_EMAIL:-demo-seed@example.invalid}" \
      commit --quiet --no-verify -m "[DEMO - do not merge] Seed $name review findings"
    seed_sha="$(git -C "$wt" rev-parse HEAD)"
    { grep -rl '@SEED_COMMIT@' "$wt" --include=EVIDENCE.md || true; } | while read -r f; do
      sed -i.bak "s/@SEED_COMMIT@/$seed_sha/" "$f" && rm -f "$f.bak"
    done
    git -C "$wt" add -A
    git -C "$wt" -c user.name="${GIT_AUTHOR_NAME:-Review Ladder Seed}" -c user.email="${GIT_AUTHOR_EMAIL:-demo-seed@example.invalid}" \
      commit --quiet --no-verify --allow-empty -m "[DEMO - do not merge] Record evidence commit for $name seed"
    evidence_sha="$(git -C "$wt" rev-parse HEAD)"
    echo "seed.sh: $name.patch applied cleanly: $(git -C "$wt" diff --shortstat --text "$base_sha" "$evidence_sha")"

    branch="$RUN_PREFIX/b-seed-$name"
    title="[DEMO – do not merge] Review ladder: $name seed ($RUN)"
    body="Synthetic demo PR cut by demos/review-ladder/seed.sh from $BASELINE ($base_sha). Seeded findings are listed in demos/review-ladder/README.md. Close with seed.sh --close --run $RUN. Never merge."
    act git -C "$REPO_ROOT" push origin "$evidence_sha:refs/heads/$branch"
    act gh pr create --draft --base "$BASE_BRANCH" --head "$branch" --title "$title" --body "$body" --label "$LABEL" # pin-ok: per-run demo/run-* base
  done
}

close_run() {
  local list branches selected=() skipped=() n head b
  if [ -n "${SEED_PR_LIST_JSON:-}" ]; then
    list="$(cat "$SEED_PR_LIST_JSON")"
  else
    list="$(gh pr list --state open --limit 500 --json number,headRefName,title)"
  fi
  if [ -n "${SEED_REMOTE_BRANCHES:-}" ]; then
    branches="$(cat "$SEED_REMOTE_BRANCHES")"
  else
    branches="$(git -C "$REPO_ROOT" ls-remote --heads origin "refs/heads/$RUN_PREFIX/*")"
  fi

  while IFS=$'\t' read -r n head; do
    [ -n "$n" ] || continue
    if is_protected "$n"; then
      skipped+=("$n")
    elif [[ "$head" == "$RUN_PREFIX/"* ]]; then
      selected+=("$n")
    fi
  done < <(printf '%s' "$list" | node -e '
    let s = ""; process.stdin.on("data", (c) => (s += c)).on("end", () => {
      for (const pr of JSON.parse(s || "[]")) console.log(`${pr.number}\t${pr.headRefName}`);
    });')

  local protected_heads
  protected_heads="$(printf '%s' "$list" | node -e '
    const protectedPrs = new Set(process.argv[1].split(" ").map(Number));
    let s = ""; process.stdin.on("data", (c) => (s += c)).on("end", () => {
      for (const pr of JSON.parse(s || "[]")) if (protectedPrs.has(pr.number)) console.log(pr.headRefName);
    });' "${PROTECTED_PRS[*]}")"

  echo "seed.sh: close run $RUN: PRs to close: ${selected[*]:-none}"
  echo "seed.sh: protected, never touched: ${PROTECTED_PRS[*]}"
  for n in "${selected[@]}"; do
    act gh pr close "$n" --comment "Demo run $RUN finished. Closed unmerged by seed.sh --close."
  done
  while read -r _ b; do
    b="${b#refs/heads/}"
    [[ "$b" == "$RUN_PREFIX/"* ]] || continue
    if printf '%s\n' "$protected_heads" | grep -qxF "$b"; then
      echo "seed.sh: keep $b (head of a protected PR)"
      continue
    fi
    act git -C "$REPO_ROOT" push origin --delete "$b"
  done <<<"$branches"
}

self_test() {
  local self="${BASH_SOURCE[0]}" out main_before main_after head_before head_after status_before status_after fail=0
  TMP_DIR="$(mktemp -d)"
  trap 'git -C "$REPO_ROOT" update-ref -d refs/seed-self-test/baseline 2>/dev/null || true; rm -rf "$TMP_DIR"' EXIT
  main_before="$(git -C "$REPO_ROOT" rev-parse --verify --quiet refs/remotes/origin/main || echo none)"
  head_before="$(git -C "$REPO_ROOT" rev-parse HEAD)"
  status_before="$(git -C "$REPO_ROOT" status --porcelain)"

  if out="$(bash "$self" --baseline demo-baseline-self-test-missing --dry-run 2>&1)"; then
    echo "FAIL  missing baseline: exited 0"; fail=1
  elif [[ "$out" == *"does not resolve to a commit"* ]]; then
    echo "PASS  missing baseline errors clearly"
  else
    echo "FAIL  missing baseline: $out"; fail=1
  fi
  if git -C "$REPO_ROOT" rev-parse --verify --quiet "$DEFAULT_BASELINE^{commit}" >/dev/null; then
    echo "PASS  default tag $DEFAULT_BASELINE exists locally"
  elif out="$(SEED_BASELINE="$DEFAULT_BASELINE" bash "$self" --dry-run 2>&1)"; then
    echo "FAIL  missing $DEFAULT_BASELINE tag: exited 0"; fail=1
  elif [[ "$out" == *"does not exist yet"* ]]; then
    echo "PASS  missing $DEFAULT_BASELINE tag errors clearly"
  else
    echo "FAIL  missing $DEFAULT_BASELINE tag: $out"; fail=1
  fi

  git -C "$REPO_ROOT" update-ref refs/seed-self-test/baseline HEAD
  if out="$(bash "$self" --baseline refs/seed-self-test/baseline --run 20991231 --dry-run 2>&1)" &&
    [[ "$out" == *"bugbot.patch applied cleanly"* ]] && [[ "$out" == *"security.patch applied cleanly"* ]]; then
    echo "PASS  both patches apply cleanly to a temporary ref (dry-run, nothing pushed)"
  else
    echo "FAIL  dry-run seed: $out"; fail=1
  fi

  cat >"$TMP_DIR/prs.json" <<'EOF'
[
  {"number": 4, "headRefName": "demo/run-20991231/recorded-take-a", "title": "protected"},
  {"number": 9, "headRefName": "demo/run-20991231/recorded-take-b", "title": "protected"},
  {"number": 10, "headRefName": "demo/run-20991231/recorded-take-c", "title": "protected"},
  {"number": 11, "headRefName": "demo/run-20991231/recorded-take-d", "title": "protected"},
  {"number": 14, "headRefName": "demo/run-20991231/recorded-take-e", "title": "protected"},
  {"number": 16, "headRefName": "demo/run-20991231/recorded-take-f", "title": "protected"},
  {"number": 20, "headRefName": "demo/run-20991231/recorded-take-g", "title": "protected"},
  {"number": 101, "headRefName": "demo/run-20991231/b-seed-bugbot", "title": "[DEMO – do not merge] bugbot"},
  {"number": 102, "headRefName": "demo/run-20991231/b-seed-security", "title": "[DEMO – do not merge] security"},
  {"number": 103, "headRefName": "demo/run-20991230/b-seed-bugbot", "title": "other run"},
  {"number": 104, "headRefName": "cursor/some-feature", "title": "not a demo"}
]
EOF
  printf '%s\n' \
    "0000000000000000000000000000000000000001	refs/heads/demo/run-20991231/baseline" \
    "0000000000000000000000000000000000000002	refs/heads/demo/run-20991231/b-seed-bugbot" \
    "0000000000000000000000000000000000000003	refs/heads/demo/run-20991231/b-seed-security" \
    "0000000000000000000000000000000000000004	refs/heads/demo/run-20991231/recorded-take-a" \
    "0000000000000000000000000000000000000005	refs/heads/demo/run-20991230/b-seed-bugbot" >"$TMP_DIR/branches.txt"
  out="$(SEED_PR_LIST_JSON="$TMP_DIR/prs.json" SEED_REMOTE_BRANCHES="$TMP_DIR/branches.txt" bash "$self" --close --run 20991231 --dry-run 2>&1)"
  local closes deletes
  closes="$(printf '%s\n' "$out" | sed -n 's/^DRY-RUN would run: gh pr close \([0-9]*\).*/\1/p' | tr '\n' ' ')"
  deletes="$(printf '%s\n' "$out" | sed -n 's/^DRY-RUN would run: .* --delete \(.*\)$/\1/p' | tr '\n' ' ')"
  if [ "$closes" = "101 102 " ] && [ "$deletes" = "demo/run-20991231/baseline demo/run-20991231/b-seed-bugbot demo/run-20991231/b-seed-security " ]; then
    echo "PASS  --close selects 101 102 only; deletes this run's 3 seed branches; keeps other runs, non-demo PRs, and ${PROTECTED_PRS[*]}"
  else
    echo "FAIL  --close selection: closes='$closes' deletes='$deletes'"; printf '%s\n' "$out"; fail=1
  fi

  main_after="$(git -C "$REPO_ROOT" rev-parse --verify --quiet refs/remotes/origin/main || echo none)"
  head_after="$(git -C "$REPO_ROOT" rev-parse HEAD)"
  status_after="$(git -C "$REPO_ROOT" status --porcelain)"
  if [ "$main_before" = "$main_after" ] && [ "$head_before" = "$head_after" ] && [ "$status_before" = "$status_after" ]; then
    echo "PASS  origin/main ($main_after), HEAD, and the working tree are unchanged"
  else
    echo "FAIL  checkout changed: origin/main $main_before -> $main_after, HEAD $head_before -> $head_after"; fail=1
  fi

  if [ "$fail" = 0 ]; then
    echo "PASS: OFFLINE (no key) L18 review ladder seed self-test. Nothing pushed, no PRs opened"
  else
    echo "FAIL: L18 review ladder seed self-test"
    exit 1
  fi
}

case "$MODE" in
  seed) seed ;;
  close) close_run ;;
  self-test) self_test ;;
esac
