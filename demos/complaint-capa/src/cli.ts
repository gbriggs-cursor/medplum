// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadComplaint } from './complaint';
import { openCapaFromComplaint } from './open-capa';
import { renderCapaHtml } from './render-capa-html';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const complaint = loadComplaint(join(root, 'seed/complaint.md'));
const record = openCapaFromComplaint(complaint);

mkdirSync(join(root, 'out'), { recursive: true });
mkdirSync(join(root, 'preview'), { recursive: true });
writeFileSync(join(root, 'out/CAPA-001.json'), `${JSON.stringify(record, null, 2)}\n`);
writeFileSync(join(root, 'preview/CAPA-001.html'), renderCapaHtml(record));
