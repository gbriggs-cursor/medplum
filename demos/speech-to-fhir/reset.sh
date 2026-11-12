#!/usr/bin/env bash
# Removes this story's synthetic Patients and QuestionnaireResponses from the local Medplum server. Safe to re-run.
set -euo pipefail
cd "$(dirname "$0")"
node scripts/reset.mjs
