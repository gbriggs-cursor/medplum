// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildCohort, BUNDLE_PATH, DEFAULT_SEED } from './cohort';

const root = join(import.meta.dirname, '..');
const seed = Number(process.argv[2] ?? DEFAULT_SEED);
if (!Number.isInteger(seed)) {
  throw new Error(`Seed must be an integer, got ${process.argv[2]}`);
}

const { bundle, manifest } = buildCohort(seed);
const bundleJson = JSON.stringify(bundle, null, 2) + '\n';
const bundleFile = join(root, BUNDLE_PATH);
mkdirSync(dirname(bundleFile), { recursive: true });
writeFileSync(bundleFile, bundleJson);

const bundleSha256 = createHash('sha256').update(bundleJson).digest('hex');
writeFileSync(join(root, 'manifest.json'), JSON.stringify({ ...manifest, bundleSha256 }, null, 2) + '\n');

console.log(`Synthetic cohort seed ${seed}: ${JSON.stringify(manifest.counts)}`);
console.log(`Wrote ${BUNDLE_PATH} (sha256 ${bundleSha256}) and manifest.json`);
