import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineTool } from '@grok/agent-sdk/tools';
import { z } from 'zod';

const script = join(dirname(fileURLToPath(import.meta.url)), '../../../src/refresh.mjs');

export default defineTool({
  description:
    'Write evidence/EVIDENCE.md and evidence/trace.json for the synthetic device-change batch. Does not write approval.json. Idempotent for a given date.',
  effect: 'idempotent',
  inputSchema: z.object({
    date: z.string().optional().describe('Run date YYYY-MM-DD. Defaults to today UTC.'),
  }),
  execute({ date }) {
    const args = [script, '--json'];
    if (date) {
      args.push('--date', date);
    }
    try {
      const stdout = execFileSync(process.execPath, args, { encoding: 'utf8' });
      const index = JSON.parse(stdout) as {
        result: string;
        passed: number;
        failed: number;
        commit: string;
        date: string;
        files: string[];
      };
      return {
        ok: index.failed === 0,
        result: index.result,
        passed: index.passed,
        failed: index.failed,
        commit: index.commit,
        date: index.date,
        files: index.files,
      };
    } catch (error) {
      const failed = error as { stdout?: string; stderr?: string; message?: string };
      return {
        ok: false,
        error: (failed.stderr || failed.stdout || failed.message || 'refresh failed').trim(),
      };
    }
  },
});
