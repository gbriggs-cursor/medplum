// Writes evidence/EVIDENCE.md and evidence/trace.json in the evidence v2 shape
// (schema evidence-v2/trace, version 2). approval.json is not written here.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const TEST_LOG = 'test-log.txt';

export function writeEvidenceV2(dir, input) {
  const logText = input.log.endsWith('\n') ? input.log : `${input.log}\n`;
  const trace = {
    schema: 'evidence-v2/trace',
    version: 2,
    story: input.story,
    synthetic: true,
    commit: input.commit,
    runs: [input.run],
    rows: input.rows,
  };
  const ids = [...new Set(input.rows.flatMap((row) => [row.req, row.risk]))].join(', ');
  const result = input.run.failed === 0 && input.run.exit === 0 ? 'pass' : 'fail';
  const header = [
    `Requirement: ${input.requirement}`,
    `Change: ${input.change}`,
    `Test: ${input.run.command}`,
    `Result: ${result} (${input.run.passed} passed, ${input.run.failed} failed)`,
    'Synthetic: true',
    `Commit: ${input.commit}`,
    `Trace: ${ids}`,
  ].join('\n');
  const table = [
    '| Requirement | Test | Run | Result |',
    '| --- | --- | --- | --- |',
    ...input.rows.map(
      (row) =>
        `| ${row.req} (${row.risk}) | ${row.test} | ${input.run.command}, ${input.run.date.slice(0, 10)} | ${row.result} |`
    ),
  ].join('\n');
  const markdown = `${header}\n\n${table}\n\n## Test log\n\n\`\`\`\n${logText}\`\`\`\n`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'EVIDENCE.md'), markdown);
  writeFileSync(join(dir, 'trace.json'), `${JSON.stringify(trace, null, 2)}\n`);
  writeFileSync(join(dir, TEST_LOG), logText);
  return { result, passed: input.run.passed, failed: input.run.failed, files: ['EVIDENCE.md', 'trace.json', TEST_LOG] };
}
