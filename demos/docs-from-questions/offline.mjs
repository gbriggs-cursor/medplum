import { spawnSync } from 'node:child_process';

console.log('OFFLINE');
const run = spawnSync('demos/docs-from-questions/reset.sh', { stdio: 'inherit' });
process.exit(run.status ?? 1);
