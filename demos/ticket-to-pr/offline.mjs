import { spawnSync } from 'node:child_process';

console.log('OFFLINE (no key)');
const run = spawnSync('demos/ticket-to-pr/reset.sh', { stdio: 'inherit' });
process.exit(run.status ?? 1);
