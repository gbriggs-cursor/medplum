// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATOR_SEED } from './constants';
import { buildManifest, generateBundle } from './generate';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function main(): void {
  const bundle = generateBundle(GENERATOR_SEED);
  const manifest = buildManifest(bundle, GENERATOR_SEED);
  mkdirSync(join(root, 'data'), { recursive: true });
  writeFileSync(join(root, 'data', 'acme-cardio-bundle.json'), `${JSON.stringify(bundle, null, 2)}\n`);
  writeFileSync(join(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${manifest.counts.total} resources with seed ${manifest.seed}`);
}

main();
