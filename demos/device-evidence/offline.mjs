import { spawnSync } from 'node:child_process';

console.log('OFFLINE');
const run = spawnSync('demos/device-evidence/reset.sh', { stdio: 'inherit' });
process.exit(run.status ?? 1);
